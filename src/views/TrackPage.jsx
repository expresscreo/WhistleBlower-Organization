'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { FieldError } from '@/components/ui/form-feedback';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import TrackReportPage from './TrackReportPage';
import TrackBountyPage from './TrackBountyPage';
import {
    authenticateTrackedReport,
    authenticateTrackedBounty,
} from '@/lib/trackApi';

const TrackPage = () => {
    const router = useRouter();
    const [searchError, setSearchError] = useState('');
    const [idInput, setIdInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [trackId, setTrackId] = useState(null);
    const [trackPassword, setTrackPassword] = useState(null);
    const [trackType, setTrackType] = useState(null);
    const [trackAuthData, setTrackAuthData] = useState(null);

    const clearTrackSession = useCallback(() => {
        sessionStorage.removeItem('trackId');
        sessionStorage.removeItem('trackPassword');
        sessionStorage.removeItem('trackType');
        sessionStorage.removeItem('trackAuthError');
    }, []);

    const handleAuthFailure = useCallback((message) => {
        clearTrackSession();
        setTrackId(null);
        setTrackPassword(null);
        setTrackType(null);
        setTrackAuthData(null);
        setSearchError(message || 'Please check your ID and password.');
        setLoading(false);
    }, [clearTrackSession]);

    const handleTrackLogout = useCallback(() => {
        clearTrackSession();
        setTrackId(null);
        setTrackPassword(null);
        setTrackType(null);
        setTrackAuthData(null);
        setIdInput('');
        setPasswordInput('');
        setSearchError('');
        setLoading(false);
    }, [clearTrackSession]);

    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo(0, 0);

        const authError = sessionStorage.getItem('trackAuthError');
        if (authError) {
            clearTrackSession();
            setSearchError(authError);
            return;
        }

        const storedId = sessionStorage.getItem('trackId');
        const storedPassword = sessionStorage.getItem('trackPassword');
        const storedType = sessionStorage.getItem('trackType');

        if (storedId && storedPassword) {
            const type = storedType || (storedId.startsWith('WBB') ? 'bounty' : 'report');
            setTrackId(storedId);
            setTrackPassword(storedPassword);
            setTrackType(type);
        }
    }, [clearTrackSession]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearchError('');
        if (!idInput || !passwordInput) {
            setSearchError('Please enter both an ID and a password.');
            return;
        }

        setLoading(true);
        const type = idInput.startsWith('WBB') ? 'bounty' : 'report';

        try {
            const authData = type === 'bounty'
                ? await authenticateTrackedBounty(idInput, passwordInput)
                : await authenticateTrackedReport(idInput, passwordInput);

            sessionStorage.setItem('trackId', idInput);
            sessionStorage.setItem('trackPassword', passwordInput);
            sessionStorage.setItem('trackType', type);

            setTrackAuthData(authData);
            setTrackId(idInput);
            setTrackPassword(passwordInput);
            setTrackType(type);
        } catch (error) {
            setTrackAuthData(null);
            setSearchError(error.message || 'Please check your ID and password.');
        } finally {
            setLoading(false);
        }
    };

    if (trackType === 'report') {
        return (
            <TrackReportPage
                reportId={trackId}
                password={trackPassword}
                initialAuthData={trackAuthData}
                onAuthFailure={handleAuthFailure}
                onLogout={handleTrackLogout}
            />
        );
    }

    if (trackType === 'bounty') {
        return (
            <TrackBountyPage
                bountyId={trackId}
                password={trackPassword}
                initialAuthData={trackAuthData}
                onAuthFailure={handleAuthFailure}
                onLogout={handleTrackLogout}
            />
        );
    }

    return (
        <>
            <SEOHead 
                {...generateSEOMeta({
                    ...DEFAULT_SEO_PAGES.trackReport,
                    url: '/track',
                    type: 'website'
                })}
            />
            <div className="container mx-auto px-4 py-8 sm:py-16 md:py-24 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Track Your Submission</h1>
                        <p className="text-base sm:text-lg text-muted-foreground mb-8 px-4">Enter your Report or Bounty ID and password to securely check its status.</p>
                        <Card className="max-w-xl mx-auto p-4 sm:p-6">
                            <form onSubmit={handleSearch} className="space-y-4" autoComplete="off">
                                <div className="text-left">
                                    <Label htmlFor="track-submission-id">Report / Bounty ID</Label>
                                    <Input
                                        id="track-submission-id"
                                        name="tracking_reference_id"
                                        type="text"
                                        inputMode="text"
                                        autoComplete="one-time-code"
                                        autoCorrect="off"
                                        autoCapitalize="characters"
                                        spellCheck={false}
                                        data-1p-ignore="true"
                                        data-lpignore="true"
                                        data-form-type="other"
                                        readOnly
                                        onFocus={(e) => e.target.removeAttribute('readonly')}
                                        placeholder="Enter your ID (e.g., WB123... or WBB123...)"
                                        value={idInput}
                                        onChange={(e) => setIdInput(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 relative text-left">
                                    <Label htmlFor="track-password">Password</Label>
                                    <Input
                                        id="track-password"
                                        name="tracking_password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        disabled={loading}
                                    />
                                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-7 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <FieldError message={searchError} />
                                <Button type="submit" className="w-full" loading={loading}>
                                    Track Submission
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