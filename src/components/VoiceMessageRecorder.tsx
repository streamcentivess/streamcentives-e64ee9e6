import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Loader2, Send, X, Play, Pause } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface VoiceMessageRecorderProps {
  onSendVoiceMessage: (transcription: string, audioBlob?: Blob) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const VoiceMessageRecorder: React.FC<VoiceMessageRecorderProps> = ({ 
  onSendVoiceMessage, 
  onCancel,
  disabled = false 
}) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  
  const { 
    isRecording, 
    isProcessing, 
    transcription, 
    startRecording, 
    stopRecording, 
    clearTranscription 
  } = useVoiceRecorder();

  const handleStopRecording = async () => {
    await stopRecording();
    // Create audio blob for playback (this would need to be implemented in the hook)
    // For now, we'll just use the transcription
  };

  const handleSend = () => {
    if (transcription) {
      onSendVoiceMessage(transcription, audioBlob || undefined);
      clearTranscription();
      setAudioBlob(null);
      setAudioUrl('');
    }
  };

  const handleCancel = () => {
    clearTranscription();
    setAudioBlob(null);
    setAudioUrl('');
    onCancel();
  };

  const togglePlayback = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
      }
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-2">
            {!isRecording && !isProcessing && !transcription ? (
              <Button
                onClick={startRecording}
                disabled={disabled}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Mic className="h-5 w-5" />
                Start Voice Message
              </Button>
            ) : isRecording ? (
              <Button
                onClick={handleStopRecording}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
                size="lg"
              >
                <MicOff className="h-5 w-5" />
                Stop Recording
              </Button>
            ) : isProcessing ? (
              <Button disabled className="flex items-center gap-2" size="lg">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </Button>
            ) : null}
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-red-600">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Recording voice message...</span>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Converting speech to text...</span>
              </div>
            </div>
          )}

          {/* Transcription Result */}
          {transcription && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Voice Message Preview:</span>
                </div>
                <p className="text-sm text-gray-700">
                  {transcription}
                </p>
              </div>

              {/* Playback Controls (if audio available) */}
              {audioUrl && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={togglePlayback}
                    variant="outline"
                    size="sm"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                
                <Button
                  onClick={handleSend}
                  disabled={disabled}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                  Send Voice Message
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!isRecording && !isProcessing && !transcription && (
            <div className="text-center text-sm text-gray-500">
              <p>Record a voice message to send to this conversation.</p>
              <p className="text-xs mt-1">Your voice will be converted to text for messaging.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};