'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Copy, Download, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function SuccessView({
  reportId,
  password,
  isFeedbackMode = false,
  processedAudioUrl = null,
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard.` });
  };

  const trackReport = () => {
    if (password) {
      sessionStorage.setItem('trackId', reportId);
      sessionStorage.setItem('trackPassword', password);
    }
    router.push('/track');
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(isFeedbackMode ? 'Feedback Submitted' : 'Report Submitted', 20, 20);
    doc.setFontSize(12);
    doc.text(`Report ID: ${reportId}`, 20, 35);
    if (password) doc.text(`Password: ${password}`, 20, 45);
    doc.save(`whistleblower-${reportId}.pdf`);
  };

  return (
    <div
      ref={containerRef}
      className="submit-report-page py-12 md:py-20 max-md:pt-10 px-4 flex justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="submit-report-card glass-effect border rounded-xl p-6 md:p-10 max-w-lg w-full space-y-6 text-center"
      >
        <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {isFeedbackMode ? 'Feedback submitted' : 'Report submitted securely'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isFeedbackMode
              ? 'Thank you. Save your report ID to follow up if needed.'
              : 'Save these credentials now — they cannot be recovered later.'}
          </p>
        </div>

        <div className="text-left space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Report ID</label>
            <div className="flex gap-2 mt-1">
              <Input value={reportId} readOnly aria-label="Report ID" />
              <Button type="button" variant="outline" size="icon" onClick={() => copy(reportId, 'Report ID')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {password && (
            <div>
              <label className="text-xs text-muted-foreground">Password</label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    readOnly
                    aria-label="Report password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => copy(password, 'Password')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {processedAudioUrl && (
          <audio controls src={processedAudioUrl} className="w-full" aria-label="Processed voice preview" />
        )}

        <div className="flex flex-col gap-3">
          <Button onClick={trackReport}>Track your {isFeedbackMode ? 'feedback' : 'report'}</Button>
          <Button variant="outline" onClick={downloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download details
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
