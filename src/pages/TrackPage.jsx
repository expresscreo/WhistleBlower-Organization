import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import TrackReportPage from './TrackReportPage';
import TrackBountyPage from './TrackBountyPage';

const TrackPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [idInput, setIdInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [trackId, setTrackId] = useState(null);
    const [trackPassword, setTrackPassword] = useState(null);
    const [trackType, setTrackType] = useState(null);

    useEffect(() => {
        const storedId = sessionStorage.getItem('trackId');
        const storedPassword = sessionStorage.getItem('trackPassword');
        const storedType = sessionStorage.getItem('trackType');

        if (storedId && storedPassword && storedType) {
            setTrackId(storedId);
            setTrackPassword(storedPassword);
            setTrackType(storedType);
        }
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!idInput || !passwordInput) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter both an ID and a password.' });
            return;
        }
        setLoading(true);

        const type = idInput.startsWith('WBB') ? 'bounty' : 'report';
        
        sessionStorage.setItem('trackId', idInput);
        sessionStorage.setItem('trackPassword', passwordInput);
        sessionStorage.setItem('trackType', type);

        setTrackId(idInput);
        setTrackPassword(passwordInput);
        setTrackType(type);
        
        setLoading(false);
    };

    if (trackType === 'report') {
        return <TrackReportPage reportId={trackId} password={trackPassword} />;
    }

    if (trackType === 'bounty') {
        return <TrackBountyPage bountyId={trackId} password={trackPassword} />;
    }

    return (
        <>
            <Helmet>
                <title>Track Your Submission - WhistleBlower.ng</title>
                <meta name="description" content="Securely track the status of your submitted report or bounty." />
            </Helmet>
            <div className="container mx-auto px-4 py-16 md:py-24 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Track Your Submission</h1>
                        <p className="text-lg text-muted-foreground mb-8">Enter your Report or Bounty ID and password to securely check its status.</p>
                        <Card className="max-w-xl mx-auto p-6">
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="text-left">
                                    <Label htmlFor="trackId">Report / Bounty ID</Label>
                                    <Input id="trackId" type="text" placeholder="Enter your ID (e.g., WB123... or WBB123...)" value={idInput} onChange={(e) => setIdInput(e.target.value)} />
                                </div>
                                <div className="space-y-2 relative text-left">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type={!showPassword ? "password" : "text"} value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} disabled={loading} />
                                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-7 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Track Submission'}
                                </Button>
                            </form>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default TrackPage;