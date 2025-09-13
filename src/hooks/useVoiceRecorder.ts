import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Convert audio to WAV format
const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
  return new Promise((resolve) => {
    const audioContext = new AudioContext({ sampleRate: 44100 });
    const fileReader = new FileReader();
    
    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Convert to WAV
        const wavBuffer = audioBufferToWav(audioBuffer);
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
        
        resolve(wavBlob);
      } catch (error) {
        console.log('Audio conversion failed, using original:', error);
        resolve(audioBlob); // Fallback to original
      }
    };
    
    fileReader.readAsArrayBuffer(audioBlob);
  });
};

// Convert AudioBuffer to WAV format
const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
  const length = buffer.length;
  const sampleRate = buffer.sampleRate;
  const numChannels = 1; // downmix to mono for compatibility
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * bytesPerSample; // mono 16-bit

  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // audio format = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Downmix to mono and write samples
  const channelData = [] as Float32Array[];
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    let sample = 0;
    for (let ch = 0; ch < channelData.length; ch++) sample += channelData[ch][i] || 0;
    sample /= channelData.length || 1;
    sample = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += bytesPerSample;
  }

  return arrayBuffer;
};

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isProcessing: boolean;
  transcription: string;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearTranscription: () => void;
  lastWavBlob: Blob | null;
  lastWavBase64: string;
}

export const useVoiceRecorder = (): UseVoiceRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [lastWavBlob, setLastWavBlob] = useState<Blob | null>(null);
  const [lastWavBase64, setLastWavBase64] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      console.log('Microphone access granted');
      
      audioChunksRef.current = [];
      
      // Use WebM as it's more widely supported, we'll convert to WAV later
      const mimeType = 'audio/webm;codecs=opus';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length > 0) {
          await processAudio();
        }
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      toast.success('Recording started');
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Failed to access microphone. Please grant permission.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  }, [isRecording]);

  const processAudio = async () => {
    try {
      console.log('Processing audio chunks...');
      
      const originalBlob = new Blob(audioChunksRef.current);
      
      // Convert to WAV format if needed
      const wavBlob = await convertToWav(originalBlob);
      
      // Convert blob to base64
      const arrayBuffer = await wavBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 0x8000; // 32KB chunks
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Audio = btoa(binary);
      console.log('WAV audio converted to base64, size:', base64Audio.length);
      
      // Store the WAV blob and base64 for external use
      setLastWavBlob(wavBlob);
      setLastWavBase64(base64Audio);
      
      // Send to voice-to-text function
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.text) {
        console.log('Transcription received:', data.text);
        setTranscription(data.text);
        toast.success('Voice transcribed successfully!');
      } else {
        throw new Error('No transcription received');
      }
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process voice recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearTranscription = useCallback(() => {
    setTranscription('');
  }, []);

  return {
    isRecording,
    isProcessing,
    transcription,
    startRecording,
    stopRecording,
    clearTranscription,
    lastWavBlob,
    lastWavBase64,
  };
};