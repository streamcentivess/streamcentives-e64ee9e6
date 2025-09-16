import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  VolumeX, 
  Loader2,
  User,
  Signal
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceChatInterfaceProps {
  conversationId: string;
  recipientName: string;
  onEndCall?: () => void;
}

export const VoiceChatInterface: React.FC<VoiceChatInterfaceProps> = ({
  conversationId,
  recipientName,
  onEndCall
}) => {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  const startCall = async () => {
    setIsConnecting(true);
    
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      localStreamRef.current = stream;
      
      // Create peer connection
      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = peerConnection;

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        
        // Create audio element for remote stream
        const audioElement = new Audio();
        audioElement.srcObject = event.streams[0];
        audioElement.play().catch(console.error);
        
        setIsPeerConnected(true);
        toast.success(`Connected to ${recipientName}!`);
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // In a real implementation, send this to the other peer via signaling server
          console.log('ICE candidate:', event.candidate);
        }
      };

      // Monitor connection state
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log('Connection state:', state);
        
        if (state === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
          startCallTimer();
        } else if (state === 'disconnected' || state === 'failed') {
          setIsConnected(false);
          setIsPeerConnected(false);
          toast.error('Call disconnected');
          endCall();
        }
      };

      // Simulate call connection for demo
      setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
        setIsPeerConnected(true);
        startCallTimer();
        toast.success(`Voice call started with ${recipientName}`);
      }, 2000);

    } catch (error) {
      console.error('Error starting call:', error);
      setIsConnecting(false);
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Microphone permission denied. Please allow access to start voice chat.');
      } else {
        toast.error('Failed to start voice chat. Please check your audio settings.');
      }
    }
  };

  const endCall = () => {
    // Stop call timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsConnected(false);
    setIsPeerConnected(false);
    setIsConnecting(false);
    setCallDuration(0);
    
    if (onEndCall) {
      onEndCall();
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        toast.success(audioTrack.enabled ? 'Microphone unmuted' : 'Microphone muted');
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerMuted(!isSpeakerMuted);
    toast.success(isSpeakerMuted ? 'Speaker unmuted' : 'Speaker muted');
  };

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!isConnected && !isConnecting) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Start Voice Chat</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Connect with {recipientName} for real-time voice conversation
            </p>
          </div>
          <Button onClick={startCall} className="w-full bg-green-600 hover:bg-green-700">
            <Phone className="h-4 w-4 mr-2" />
            Start Voice Call
          </Button>
          <p className="text-xs text-muted-foreground">
            This will request microphone access for voice chat
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6 text-center space-y-6">
        {/* Connection Status */}
        <div className="space-y-2">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white">
            {isConnecting ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <User className="h-8 w-8" />
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">{recipientName}</h3>
            <div className="flex items-center justify-center gap-2 mt-1">
              {isConnecting && (
                <Badge variant="secondary">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Connecting...
                </Badge>
              )}
              {isConnected && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  Connected
                </Badge>
              )}
              {isPeerConnected && (
                <div className="flex items-center gap-1">
                  <Signal className={`h-3 w-3 ${getConnectionQualityColor()}`} />
                  <span className={`text-xs ${getConnectionQualityColor()}`}>
                    {connectionQuality}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Call Duration */}
        {isConnected && (
          <div className="text-2xl font-mono font-bold text-muted-foreground">
            {formatCallDuration(callDuration)}
          </div>
        )}

        {/* Call Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="lg"
            onClick={toggleMute}
            className="rounded-full w-12 h-12 p-0"
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={endCall}
            className="rounded-full w-14 h-14 p-0 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>

          <Button
            variant={isSpeakerMuted ? "destructive" : "secondary"}
            size="lg"
            onClick={toggleSpeaker}
            className="rounded-full w-12 h-12 p-0"
          >
            {isSpeakerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>

        {/* Call Status Messages */}
        {isConnecting && (
          <p className="text-sm text-muted-foreground">
            Establishing secure voice connection...
          </p>
        )}
        
        {isConnected && !isPeerConnected && (
          <p className="text-sm text-muted-foreground">
            Waiting for {recipientName} to join...
          </p>
        )}

        {/* Privacy Notice */}
        <div className="bg-muted/30 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground">
            🔒 Voice data is transmitted securely and not recorded or stored by StreamCentives
          </p>
        </div>
      </CardContent>
    </Card>
  );
};