import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  placeholder?: string;
  showTranscription?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onTranscription, 
  placeholder = "Click the microphone to start recording...",
  showTranscription = true 
}) => {
  const { 
    isRecording, 
    isProcessing, 
    transcription, 
    startRecording, 
    stopRecording, 
    clearTranscription 
  } = useVoiceRecorder();

  const handleTranscriptionReceived = (text: string) => {
    onTranscription(text);
    if (!showTranscription) {
      clearTranscription();
    }
  };

  React.useEffect(() => {
    if (transcription) {
      handleTranscriptionReceived(transcription);
    }
  }, [transcription]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {!isRecording && !isProcessing ? (
          <Button
            onClick={startRecording}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Mic className="h-4 w-4" />
            Start Recording
          </Button>
        ) : isRecording ? (
          <Button
            onClick={stopRecording}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
          >
            <MicOff className="h-4 w-4" />
            Stop Recording
          </Button>
        ) : (
          <Button disabled className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </Button>
        )}

        {transcription && showTranscription && (
          <Button
            onClick={clearTranscription}
            variant="ghost"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isRecording && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-600">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Recording in progress...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isProcessing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Converting speech to text...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {transcription && showTranscription && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <Mic className="h-4 w-4" />
                <span className="text-sm font-medium">Transcribed Text:</span>
              </div>
              <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                {transcription}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isRecording && !isProcessing && !transcription && (
        <Card className="border-gray-200">
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500 text-center">
              {placeholder}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};