'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Home,
  KeyRound,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';
import { cn } from '@/lib/utils';

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function getTrackPageUrl() {
  if (typeof window === 'undefined') return '/track';
  return `${window.location.origin}/track`;
}

function CredentialsCard({
  trackPageUrl,
  idLabel,
  reportId,
  password,
  copyError,
  copied,
  onCopy,
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="h-[3px] bg-primary" aria-hidden />

      <div className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Access credentials
          </p>
          <button
            type="button"
            onClick={onCopy}
            aria-label={copied ? 'Copied credentials' : 'Copy track page, ID, and password'}
            className={cn(
              'shrink-0 flex h-9 w-9 items-center justify-center transition-colors',
              copied
                ? 'border-0 bg-transparent'
                : 'rounded-full border border-border bg-muted/60 hover:bg-muted'
            )}
          >
            {copied ? (
              <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" aria-hidden />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" aria-hidden />
            )}
          </button>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Track page
          </p>
          <p className="text-sm font-semibold text-primary break-all">{trackPageUrl}</p>
        </div>

        <div className="space-y-1.5 pt-1 border-t border-border">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {idLabel}
          </p>
          <p className="text-2xl font-semibold tracking-wide text-primary break-all">{reportId}</p>
          {copyError ? (
            <p className="text-xs text-destructive">{copyError}</p>
          ) : null}
        </div>

        {password ? (
          <div className="space-y-1.5 pt-4 border-t border-border">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Password
            </p>
            <p className="text-lg font-medium tracking-wide break-all">{password}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SuccessView({
  reportId,
  password,
  isFeedbackMode = false,
  isBountyMode = false,
  processedAudioUrl = null,
}) {
  const router = useRouter();
  const { copy, isCopied, copyError } = useCopyFeedback();
  const topRef = useRef(null);

  const trackPageUrl = useMemo(() => getTrackPageUrl(), []);

  const idLabel = isFeedbackMode ? 'Feedback ID' : isBountyMode ? 'Tip ID' : 'Report ID';
  const title = isFeedbackMode
    ? 'Feedback received'
    : isBountyMode
      ? 'Tip received securely'
      : 'Report received securely';
  const subtitle = isFeedbackMode
    ? 'Thank you. Your message has been encrypted and delivered for review.'
    : isBountyMode
      ? 'Thank you for your tip. Your submission is encrypted and queued for review.'
      : 'Thank you for speaking up. Your submission is encrypted and queued for review.';
  const trackLabel = isFeedbackMode
    ? 'Track your feedback'
    : isBountyMode
      ? 'Track your tip'
      : 'Track your report';

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleTrackReport = () => {
    const type = reportId.startsWith('WBB') || isBountyMode ? 'bounty' : 'report';
    sessionStorage.setItem('trackId', reportId);
    sessionStorage.setItem('trackPassword', password || '');
    sessionStorage.setItem('trackType', type);
    router.push('/track');
  };

  const buildCopyAllText = () => {
    const lines = [`Track page: ${trackPageUrl}`, `${idLabel}: ${reportId}`];
    if (password) {
      lines.push(`Password: ${password}`);
    }
    return lines.join('\n');
  };

  const handleCopyAll = () => {
    copy(buildCopyAllText(), 'all');
  };

  const downloadPdf = async () => {
    const { downloadSubmissionCredentialsPdf } = await import(
      '@/lib/generateSubmissionCredentialsPdf'
    );
    await downloadSubmissionCredentialsPdf({
      reportId,
      password,
      trackPageUrl,
      isFeedbackMode,
      isBountyMode,
    });
  };

  const nextSteps = isFeedbackMode
    ? [
        { icon: KeyRound, text: 'Save your Feedback ID — it is the only way to follow up.' },
        { icon: MessageSquare, text: 'Check status anytime on the track page.' },
        { icon: ShieldCheck, text: 'Your identity stays protected throughout the process.' },
      ]
    : isBountyMode
      ? [
          { icon: KeyRound, text: 'Save your Tip ID and password in a secure place.' },
          { icon: MessageSquare, text: 'Track progress and chat with investigators securely.' },
          { icon: ShieldCheck, text: 'We cannot recover lost credentials — store them now.' },
        ]
      : [
          { icon: KeyRound, text: 'Save your Report ID and password in a secure place.' },
          { icon: MessageSquare, text: 'Track progress and chat with investigators securely.' },
          { icon: ShieldCheck, text: 'We cannot recover lost credentials — store them now.' },
        ];

  const footerCredentialLabel = isFeedbackMode
    ? 'feedback ID'
    : isBountyMode
      ? 'tip ID or password'
      : 'report ID or password';

  return (
    <div
      ref={topRef}
      className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 md:py-16 px-4 overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 bg-muted/30" aria-hidden />
      <motion.div
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        aria-hidden
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-lg"
      >
        <motion.div
          variants={fadeUp}
          className="overflow-hidden rounded-lg border border-border bg-card shadow-none"
        >
          <div className="relative px-6 md:px-8 pt-8 pb-6 text-center border-b border-border/60 bg-gradient-to-b from-primary/10 to-transparent">
            <motion.div
              className="mx-auto mb-5 relative flex h-16 w-16 items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            >
              <span
                className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-40"
                aria-hidden
              />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-8 w-8 stroke-[2.5]" />
              </span>
            </motion.div>

            <h1 className="text-2xl md:text-[1.65rem] font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="px-6 md:px-8 py-6 space-y-6">
            <motion.div variants={fadeUp} className="space-y-3">
              <h2 className="text-sm font-semibold">Save these details</h2>

              <CredentialsCard
                trackPageUrl={trackPageUrl}
                idLabel={idLabel}
                reportId={reportId}
                password={password}
                copyError={copyError}
                copied={isCopied('all')}
                onCopy={handleCopyAll}
              />
            </motion.div>

            {processedAudioUrl && (
              <motion.div variants={fadeUp}>
                <audio
                  controls
                  src={processedAudioUrl}
                  className="w-full"
                  aria-label="Processed voice preview"
                />
              </motion.div>
            )}

            <motion.div variants={fadeUp}>
              <h2 className="text-sm font-semibold mb-3">What happens next</h2>
              <ol className="space-y-3">
                {nextSteps.map((step, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="flex gap-2 text-muted-foreground leading-snug pt-0.5">
                      <step.icon className="h-4 w-4 shrink-0 text-primary/80 mt-0.5" />
                      {step.text}
                    </span>
                  </li>
                ))}
              </ol>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col gap-2 pt-2">
              <Button
                type="button"
                onClick={handleTrackReport}
                className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {trackLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" className="w-full h-11" onClick={downloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Download details (PDF)
              </Button>
              <Button asChild variant="outline" className="w-full h-11">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Return home
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-center text-xs text-muted-foreground mt-6 max-w-sm mx-auto"
        >
          Do not share your {footerCredentialLabel} on public channels. Use only the official
          track page to follow up.
        </motion.p>
      </motion.div>
    </div>
  );
}
