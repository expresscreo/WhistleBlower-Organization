'use client';

import { Button } from '@/components/ui/button';
import { formatIncidentDate } from '@/components/submit-report/reportFormUtils';

function ReviewRow({ label, value, onEdit, step }) {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-3 border-b py-3">
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="break-words text-sm">{value}</p>
      </div>
      {onEdit && step != null ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 text-primary"
          onClick={() => onEdit(step)}
        >
          Edit
        </Button>
      ) : null}
    </div>
  );
}

export default function PlaceBountyReviewSummary({ formData, files, onGoToStep }) {
  const caseSummary = [formData.title, formData.typeOfCrime].filter(Boolean).join(' · ');
  const location = [formData.state, formData.lga, formData.fullAddress].filter(Boolean).join(' · ');
  const evidenceSummary =
    files.length === 0
      ? 'No files attached'
      : `${files.length} file${files.length > 1 ? 's' : ''} attached`;
  const amount = (formData.bountyAmount || '').replace(/,/g, '');
  const amountSummary = amount ? `₦${Number(amount).toLocaleString()}` : '';

  return (
    <div>
      <ReviewRow label="Case" value={caseSummary || '—'} onEdit={onGoToStep} step={0} />
      <ReviewRow
        label="Description"
        value={
          formData.description?.slice(0, 120) +
          (formData.description?.length > 120 ? '…' : '')
        }
        onEdit={onGoToStep}
        step={0}
      />
      <ReviewRow label="Location" value={location || '—'} onEdit={onGoToStep} step={1} />
      <ReviewRow
        label="Date"
        value={formatIncidentDate(formData.dateOfIncident) || '—'}
        onEdit={onGoToStep}
        step={2}
      />
      <ReviewRow label="Evidence" value={evidenceSummary} onEdit={onGoToStep} step={3} />
      <ReviewRow label="Bounty amount" value={amountSummary} onEdit={onGoToStep} step={4} />
    </div>
  );
}
