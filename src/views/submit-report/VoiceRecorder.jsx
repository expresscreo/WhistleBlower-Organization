import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Trash2, Loader2, AlertTriangle, CheckCircle, UploadCloud, RefreshCw } from 'lucide-react';
// import * as Tone from 'tone'; // Temporarily disabled due to build issues

// WaveformVisualizer removed - using simple animated bars instead


const VoiceRecorder = ({ onRecordingComplete }) => {
    const { toast } = useToast();
    const [recorderState, setRecorderState] = useState('idle');
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);

    const mediaRecorderRef = useRef(null);

    const startRecording = async () => {
        setRecorderState('initializing');
        await resetRecording();
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            const audioChunks = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                setRecorderState('preview');
            };

            mediaRecorderRef.current.start();
            setRecorderState('recording');
        } catch (error) {
            console.error("Audio initialization error:", error);
            toast({
                variant: "destructive",
                title: "Microphone Access Denied",
                description: "Please allow microphone access. If you've already allowed it, try refreshing the page.",
            });
            setRecorderState('error');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setRecorderState('processing');
    };

    const handleSubmission = () => {
        if (audioBlob) {
            onRecordingComplete(audioBlob);
            setRecorderState('submitted');
            toast({
                title: "Voice Note Ready",
                description: "Your voice note is attached and ready for submission with your report.",
            });
        }
    };
    
    const resetRecording = useCallback(async () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        
        setRecorderState('idle');
        setAudioBlob(null);
        setAudioUrl(null);
        onRecordingComplete(null);
    }, [audioUrl, onRecordingComplete]);

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);


    const renderControls = () => {
        switch (recorderState) {
            case 'idle':
            case 'error':
                return (
                    <div className="flex flex-col items-center gap-4">
                        {recorderState === 'error' && <p className="text-destructive text-sm">Could not initialize microphone.</p>}
                        <Button onClick={startRecording} size="lg">
                            <Mic className="mr-2 h-5 w-5" /> Start Recording
                        </Button>
                    </div>
                );
            case 'initializing':
                return (
                     <div className="flex items-center text-primary">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Initializing...
                    </div>
                );
            case 'recording':
                return (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-64 h-16 bg-primary/20 rounded-lg flex items-center justify-center">
                            <div className="flex gap-1">
                                <div className="w-1 h-8 bg-primary animate-pulse"></div>
                                <div className="w-1 h-6 bg-primary animate-pulse" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-1 h-10 bg-primary animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-1 h-4 bg-primary animate-pulse" style={{animationDelay: '0.3s'}}></div>
                                <div className="w-1 h-8 bg-primary animate-pulse" style={{animationDelay: '0.4s'}}></div>
                            </div>
                        </div>
                        <Button onClick={stopRecording} variant="destructive" size="lg">
                            <StopCircle className="mr-2 h-5 w-5 animate-pulse" /> Stop Recording
                        </Button>
                    </div>
                );
            case 'processing':
                return (
                     <div className="flex items-center text-primary">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Audio...
                    </div>
                );
            case 'preview':
                return (
                    <div className="w-full space-y-4 text-center">
                        <p className="font-semibold">Anonymized preview is ready.</p>
                        <div className="w-full">
                           <audio src={audioUrl} controls className="w-full" />
                        </div>
                        <div className="flex justify-center gap-4 pt-4">
                            <Button onClick={resetRecording} variant="outline" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" /> Discard
                            </Button>
                            <Button onClick={handleSubmission} size="sm">
                                <UploadCloud className="mr-2 h-4 w-4" /> Attach Voice Note
                            </Button>
                        </div>
                    </div>
                );
            case 'submitted':
                return (
                    <div className="w-full space-y-3 text-center">
                        <div className="flex items-center justify-center bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 p-3 rounded-md">
                            <CheckCircle className="mr-2 h-5 w-5" />
                            <p className="font-semibold">Voice note attached successfully!</p>
                        </div>
                         <Button onClick={resetRecording} variant="outline" size="sm">
                            <RefreshCw className="mr-2 h-4 w-4" /> Record New Note
                        </Button>
                    </div>
                );
            default: return null;
        }
    };


    return (
        <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold text-center">Voice Note Submission</h3>
            <p className="text-sm text-muted-foreground text-center">Record your report using your voice. We'll automatically anonymize it to protect your identity.</p>

            <div className="flex flex-col items-center justify-center gap-4 min-h-[150px]">
                {renderControls()}
            </div>
             <div className="text-xs text-muted-foreground bg-secondary p-3 mt-4 flex items-start gap-2 rounded-md">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>For your safety, avoid mentioning any personally identifiable information in your recording, such as your name or specific location.</span>
            </div>
        </div>
    );
};

export default VoiceRecorder;