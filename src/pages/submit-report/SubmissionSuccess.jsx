import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, Copy, Download, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

const SubmissionSuccess = ({ id, password, type = 'report' }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const isBounty = type === 'bounty';
    const idLabel = isBounty ? 'Bounty ID' : 'Report ID';
    const title = isBounty ? 'Bounty Placed Successfully!' : 'Submission Successful!';
    const description = isBounty 
        ? 'Your bounty has been submitted for review. Please save the following details to track its status.'
        : 'Your report has been submitted securely. Please save the following details to track its progress.';

    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard!",
            description: `${fieldName} has been copied.`,
        });
    };

    const handleTrackSubmission = () => {
        sessionStorage.setItem('trackId', id);
        sessionStorage.setItem('trackPassword', password);
        sessionStorage.setItem('trackType', type);
        navigate('/track');
    };

    const downloadDetails = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("Your Submission Details", 20, 20);
        
        doc.setFontSize(14);
        doc.text("Please save these details in a secure location.", 20, 30);
        
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);
        
        doc.setFontSize(16);
        doc.text(`${idLabel}:`, 20, 45);
        doc.setFont('courier');
        doc.text(id, 60, 45);
        
        if (password) {
            doc.setFont('helvetica');
            doc.text("Password:", 20, 60);
            doc.setFont('courier');
            doc.text(password, 60, 60);
        }

        doc.setFont('helvetica');
        doc.setFontSize(12);
        const fullTrackUrl = `${window.location.origin}/track`;
        doc.textWithLink(`You can track your ${type} here.`, 20, 80, { url: fullTrackUrl });

        doc.save(`whistleblower_${type}_${id}.pdf`);
    };

    const containerRef = useRef(null);

    useEffect(() => {
        // Smoothly bring the success content into view on mount
        if (containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []);

    return (
        <div ref={containerRef} className="min-h-screen flex items-start justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-2xl w-full">
                <CardHeader className="text-center">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4"/>
                    <CardTitle className="text-3xl font-bold">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="submissionId">Your Unique {idLabel}</Label>
                        <div className="flex items-center space-x-2">
                            <Input id="submissionId" value={id} readOnly />
                            <Button variant="outline" size="icon" onClick={() => copyToClipboard(id, idLabel)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    {password && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Your Password</Label>
                            <div className="flex items-center space-x-2 relative">
                                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} readOnly className="pr-10" />
                                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                    <Button variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="h-7 w-7">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard(password, 'Password')}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">This password is not stored and cannot be recovered. Please save it now.</p>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button className="w-full" onClick={downloadDetails}><Download className="mr-2 h-4 w-4"/>Download Details (PDF)</Button>
                        <Button className="w-full" variant="secondary" onClick={handleTrackSubmission}>Track Your {isBounty ? 'Bounty' : 'Report'}</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SubmissionSuccess;