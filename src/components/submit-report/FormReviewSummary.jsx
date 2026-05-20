'use client';

import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatIncidentDate } from './reportFormUtils';

function ReviewRow({ label, value, onEdit, step }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm break-words">{value}</p>
      </div>
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 h-8 gap-1 text-primary"
          onClick={() => onEdit(step)}
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Button>
      )}
    </div>
  );
}

export default function FormReviewSummary({
  formData,
  descriptionMode,
  files,
  onGoToStep,
  isFeedbackMode,
}) {
  const orgLabel = formData.organization?.label;
  const location = [formData.stateOfIncident, formData.lga, formData.incidentAddress]
    .filter(Boolean)
    .join(' · ');
  const categoryDate = [
    formData.category,
    formatIncidentDate(formData.dateOfIncident),
  ]
    .filter(Boolean)
    .join(' · ');

  const storySummary =
    descriptionMode === 'voice'
      ? 'Voice note recorded'
      : [formData.title, formData.description?.slice(0, 120) + (formData.description?.length > 120 ? '…' : '')]
          .filter(Boolean)
          .join(' — ');

  const evidenceSummary =
    files.length === 0
      ? 'No files attached'
      : `${files.length} file${files.length > 1 ? 's' : ''} attached`;

  const rewardLabel =
    formData.reporterType === 'reward' ? 'Reward eligible' : 'Anonymous (no reward)';

  return (
    <div className="rounded-lg border bg-muted/20 divide-y">
      <ReviewRow label="Organization" value={orgLabel} onEdit={onGoToStep} step={1} />
      <ReviewRow label="Location" value={location || '—'} onEdit={onGoToStep} step={2} />
      <ReviewRow label="Category & date" value={categoryDate} onEdit={onGoToStep} step={2} />
      <ReviewRow label="Story" value={storySummary} onEdit={onGoToStep} step={3} />
      <ReviewRow label="Evidence" value={evidenceSummary} onEdit={onGoToStep} step={4} />
      {!isFeedbackMode && (
        <ReviewRow label="Access preference" value={rewardLabel} onEdit={onGoToStep} step={5} />
      )}
    </div>
  );
}
