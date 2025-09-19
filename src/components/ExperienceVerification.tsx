import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  MapPin,
  Scan
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ExperienceVerificationProps {
  className?: string;
}

interface VerificationResult {
  success: boolean;
  experience?: {
    id: string;
    experience_type: string;
    scheduled_at: string | null;
    location: string | null;
    status: string;
    fan_id: string;
    reward_redemptions: {
      reward: {
        title: string;
        creator_id: string;
      };
    };
  };
  canVerify?: boolean;
  error?: string;
}

export function ExperienceVerification({ className }: ExperienceVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const verifyExperience = async (code: string) => {
    if (!code.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a verification code',
        variant: 'destructive'
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-experiences', {
        body: { 
          action: 'verify',
          code: code.trim()
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setVerificationResult({
          success: true,
          experience: data.experience,
          canVerify: data.canVerify
        });
        
        if (data.canVerify) {
          toast({
            title: 'Verification Successful',
            description: 'Experience found and ready to verify'
          });
        } else {
          toast({
            title: 'Already Completed',
            description: 'This experience has already been verified',
            variant: 'destructive'
          });
        }
      } else {
        setVerificationResult({
          success: false,
          error: data.error || 'Verification failed'
        });
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerificationResult({
        success: false,
        error: error.message || 'Failed to verify experience'
      });
      toast({
        title: 'Verification Failed',
        description: error.message || 'Failed to verify experience',
        variant: 'destructive'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const completeExperience = async () => {
    if (!verificationResult?.experience) return;

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-experiences', {
        body: {
          action: 'update',
          experienceId: verificationResult.experience.id,
          status: 'completed',
          verificationMethod: 'manual',
          verificationData: {
            verified_at: new Date().toISOString(),
            verification_code: verificationCode
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Experience completed successfully!',
          variant: 'default'
        });
        
        // Reset form
        setVerificationCode('');
        setVerificationResult(null);
      }
    } catch (error: any) {
      console.error('Completion error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete experience',
        variant: 'destructive'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const enableCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      setStream(mediaStream);
      setCameraEnabled(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please enter code manually.',
        variant: 'destructive'
      });
    }
  };

  const disableCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraEnabled(false);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Experience Verification
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Manual Code Entry */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="font-mono"
                disabled={isVerifying}
              />
              <Button
                onClick={() => verifyExperience(verificationCode)}
                disabled={isVerifying || !verificationCode.trim()}
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </Button>
            </div>

            {/* Camera Toggle */}
            <div className="flex justify-center">
              {!cameraEnabled ? (
                <Button variant="outline" onClick={enableCamera}>
                  <Camera className="w-4 h-4 mr-2" />
                  Scan QR Code
                </Button>
              ) : (
                <Button variant="outline" onClick={disableCamera}>
                  <CameraOff className="w-4 h-4 mr-2" />
                  Stop Camera
                </Button>
              )}
            </div>

            {/* Camera View */}
            {cameraEnabled && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md mx-auto rounded-lg border"
                />
                <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <QrCode className="w-8 h-8 text-primary/50" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Verification Result */}
          {verificationResult && (
            <Card className={verificationResult.success ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:bg-red-950/20'}>
              <CardContent className="p-4">
                {verificationResult.success && verificationResult.experience ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Experience Found</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {verificationResult.experience.reward_redemptions.reward.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            {verificationResult.experience.experience_type.replace('_', ' ')}
                          </Badge>
                          <Badge className={
                            verificationResult.experience.status === 'completed' 
                              ? 'bg-purple-500/20 text-purple-700' 
                              : 'bg-blue-500/20 text-blue-700'
                          }>
                            {verificationResult.experience.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Fan ID: {verificationResult.experience.fan_id.slice(0, 8)}...</span>
                        </div>
                        
                        {verificationResult.experience.scheduled_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(verificationResult.experience.scheduled_at), 'PP')}</span>
                          </div>
                        )}
                        
                        {verificationResult.experience.location && (
                          <div className="flex items-center gap-2 col-span-2">
                            <MapPin className="w-4 h-4" />
                            <span>{verificationResult.experience.location}</span>
                          </div>
                        )}
                      </div>

                      {verificationResult.canVerify ? (
                        <Button
                          onClick={completeExperience}
                          disabled={isVerifying}
                          className="w-full"
                        >
                          {isVerifying ? 'Completing...' : 'Complete Experience'}
                        </Button>
                      ) : (
                        <Alert>
                          <AlertDescription>
                            This experience has already been completed.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <XCircle className="w-5 h-5" />
                    <span>{verificationResult.error || 'Verification failed'}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}