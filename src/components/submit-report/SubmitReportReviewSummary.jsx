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

export default function SubmitReportReviewSummary({
  formData,
  descriptionMode,
  voiceNoteCount,
  files,
  onGoToStep,
}) {
  const location = [formData.stateOfIncident, formData.lga, formData.incidentAddress]
    .filter(Boolean)
    .join(' · ');

  const categoryAndDate = [
    formData.category,
    formData.knowsDate
      ? formatIncidentDate(formData.dateOfIncident)
      : 'Date not sure',
  ]
    .filter(Boolean)
    .join(' · ');

  const storySummary =
    descriptionMode === 'voice'
      ? voiceNoteCount > 0
        ? `${voiceNoteCount} protected voice note${voiceNoteCount === 1 ? '' : 's'}`
        : 'Voice note recorded'
      : [
          formData.title,
          formData.description?.slice(0, 120) +
            (formData.description?.length > 120 ? '…' : ''),
        ]
          .filter(Boolean)
          .join(' — ');

  const evidenceSummary =
    files.length === 0
      ? 'No files attached'
      : `${files.length} file${files.length > 1 ? 's' : ''} attached`;

  const rewardLabel =
    formData.reporterType === 'reward'
      ? 'I want to be eligible for reward'
      : "I DON'T want to be eligible for reward";

  return (
    <div>
      <ReviewRow label="Location" value={location || '—'} onEdit={onGoToStep} step={1} />
      <ReviewRow
        label="Category & date"
        value={categoryAndDate}
        onEdit={onGoToStep}
        step={0}
      />
      <ReviewRow label="Story" value={storySummary} onEdit={onGoToStep} step={3} />
      <ReviewRow label="Evidence" value={evidenceSummary} onEdit={onGoToStep} step={4} />
      <ReviewRow label="Access preference" value={rewardLabel} onEdit={onGoToStep} step={5} />
    </div>
  );
}
