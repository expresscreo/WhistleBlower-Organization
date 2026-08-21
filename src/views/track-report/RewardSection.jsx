import React, { useEffect, useRef, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { FieldError } from '@/components/ui/form-feedback';
import { format } from 'date-fns';

const STATUS_STYLES = {
  ready: 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]',
  pending: 'border-white/20 bg-white/5 text-white/70',
  redeemed: 'border-white/20 bg-white/5 text-white/70',
  expired: 'border-red-400/40 bg-red-400/10 text-red-300',
};

function formatAmount(value) {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(String(value).replace(/,/g, ''));
  if (!Number.isFinite(amount)) return null;
  return `₦${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function TicketNotch() {
  return (
    <div className="relative -mx-6 sm:-mx-8" aria-hidden="true">
      <span className="absolute -left-2.5 top-1/2 size-5 -translate-y-1/2 rounded-full bg-background" />
      <span className="absolute -right-2.5 top-1/2 size-5 -translate-y-1/2 rounded-full bg-background" />
      <div className="border-t border-dashed border-white/20" />
    </div>
  );
}

function StatusPill({ tone, children }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase ${STATUS_STYLES[tone]}`}>
      {children}
    </span>
  );
}

function RewardVoucher({ statusLabel, statusTone, title, description, children }) {
  return (
    <section className="border border-white/10 bg-[#111111] text-white shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)]">
      <div className="h-1 bg-gradient-to-r from-[#D4AF37] via-[#00C853] to-[#D4AF37]" />
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
            WhistleBlower reward
          </p>
          <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">{description}</p>
        ) : null}
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </section>
  );
}

function PaycodeWell({ children, empty }) {
  return (
    <div
      className={`flex min-h-[88px] items-center justify-center border border-dashed px-4 py-4 ${
        empty ? 'border-white/15 bg-white/[0.03]' : 'border-[#D4AF37]/35 bg-[#D4AF37]/[0.06]'
      }`}
    >
      {children}
    </div>
  );
}

const RewardSection = ({ report }) => {
  const {
    status,
    reward_paycode,
    reward_status,
    reward_paycode_expires_at,
    reward_paycode_status,
    reward_requested_amount,
  } = report;
  const [copyError, setCopyError] = useState('');
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef(null);

  useEffect(() => () => {
    if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
  }, []);

  const handleCopy = async () => {
    setCopyError('');
    setCopied(false);
    try {
      await navigator.clipboard.writeText(reward_paycode);
      setCopied(true);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError('Could not copy paycode to clipboard.');
    }
  };

  if (status !== 'Resolved') {
    return (
      <RewardVoucher
        statusLabel="Locked"
        statusTone="pending"
        title="Reward information"
        description='Once this report is marked as "Resolved" and a reward is approved by WhistleBlower.ng, your Paycode will appear here.'
      >
        <TicketNotch />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Paycode</p>
        <PaycodeWell empty>
          <p className="font-mono text-2xl tracking-[0.45em] text-white/20">••••••••</p>
        </PaycodeWell>
      </RewardVoucher>
    );
  }

  if (reward_paycode) {
    const expiresLabel = reward_paycode_expires_at
      ? format(new Date(reward_paycode_expires_at), 'PPP p')
      : null;
    const amountLabel = formatAmount(reward_requested_amount);
    const paycodeStatus = String(reward_paycode_status || '').toUpperCase();
    const redeemed = paycodeStatus === 'SUCCESS';
    const cancelled = paycodeStatus === 'CANCELLED';
    const expired = paycodeStatus === 'EXPIRED' || (
      paycodeStatus !== 'SUCCESS' &&
      reward_paycode_expires_at &&
      new Date(reward_paycode_expires_at) < new Date()
    );
    const statusTone = redeemed ? 'redeemed' : cancelled || expired ? 'expired' : 'ready';
    const statusLabel = redeemed ? 'Redeemed' : cancelled ? 'Cancelled' : expired ? 'Expired' : 'Ready to claim';
    const title = redeemed
      ? 'Reward redeemed'
      : cancelled
        ? 'Paycode cancelled'
        : expired
          ? 'Paycode expired'
          : 'Your reward is ready';
    const description = redeemed
      ? 'This Monnify Paycode has already been cashed at a Moniepoint agent.'
      : cancelled
        ? 'This Paycode was cancelled. Contact support if you still need to claim this reward.'
        : expired
          ? 'This Paycode has expired. Contact support if you still need to claim this reward.'
          : 'Present this code at any Moniepoint POS or agent to withdraw your reward in cash. No bank account is required.';

    return (
      <RewardVoucher
        statusLabel={statusLabel}
        statusTone={statusTone}
        title={title}
        description={description}
      >
        {amountLabel ? (
          <p className="font-semibold tabular-nums tracking-tight text-[#D4AF37] text-4xl sm:text-5xl">
            {amountLabel}
          </p>
        ) : null}
        <TicketNotch />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Paycode</p>
          {expiresLabel ? (
            <p className="text-[11px] text-white/45">Expires {expiresLabel}</p>
          ) : null}
        </div>
        <PaycodeWell empty={redeemed || expired || cancelled}>
          <div className="flex w-full items-center justify-between gap-3">
            <p className="flex-1 text-center font-mono text-2xl font-semibold tracking-[0.38em] text-white sm:text-3xl">
              {reward_paycode}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? 'Paycode copied' : 'Copy paycode'}
              className="inline-flex shrink-0 items-center gap-1.5 border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80 transition hover:bg-white/10"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </PaycodeWell>
        <FieldError message={copyError} />
      </RewardVoucher>
    );
  }

  if (reward_status === 'pending_request') {
    return (
      <RewardVoucher
        statusLabel="In review"
        statusTone="pending"
        title="Reward pending"
        description="Your reward request is being reviewed by WhistleBlower.ng. The Paycode will appear on this voucher once it is approved."
      >
        <TicketNotch />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Paycode</p>
        <PaycodeWell empty>
          <p className="font-mono text-2xl tracking-[0.45em] text-white/20">••••••••</p>
        </PaycodeWell>
      </RewardVoucher>
    );
  }

  if (reward_status === 'rejected') {
    return (
      <RewardVoucher
        statusLabel="Not approved"
        statusTone="expired"
        title="Reward not approved"
        description="This reward request was not approved. Contact support if you believe this is an error."
      >
        <TicketNotch />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Paycode</p>
        <PaycodeWell empty>
          <p className="font-mono text-2xl tracking-[0.45em] text-white/20">••••••••</p>
        </PaycodeWell>
      </RewardVoucher>
    );
  }

  return (
    <RewardVoucher
      statusLabel="Awaiting request"
      statusTone="pending"
      title="Reward information"
      description="This report has been resolved. The organization may submit a reward request for WhistleBlower.ng approval."
    >
      <TicketNotch />
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Paycode</p>
      <PaycodeWell empty>
        <p className="font-mono text-2xl tracking-[0.45em] text-white/20">••••••••</p>
      </PaycodeWell>
    </RewardVoucher>
  );
};

export default RewardSection;
