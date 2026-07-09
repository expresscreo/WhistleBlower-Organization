'use client';

import { Button } from '@/components/ui/button';
import { getStepNumber } from './submitReportStepMeta';
import { formatIncidentDate } from './reportFormUtils';

function ReviewRow({ label, value, onEdit, step }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 border-b py-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm break-words">{value}</p>
      </div>
      {onEdit && step != null && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 h-8 text-primary"
          onClick={() => onEdit(step)}
        >
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
  isBountyMode,
  isMostWantedMode,
  steps,
  bountyTitle,
}) {
  const step = (id) => getStepNumber(steps, id);

  const orgLabel = formData.organization?.label;
  const location = [formData.stateOfIncident, formData.lga, formData.incidentAddress]
    .filter(Boolean)
    .join(' · ');
  const categorySummary = isBountyMode || isMostWantedMode
    ? formData.category
    : [formData.category, formatIncidentDate(formData.dateOfIncident)]
        .filter(Boolean)
        .join(' · ');

  const storySummary =
    descriptionMode === 'voice'
      ? 'Voice note recorded'
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

  const matchedSummary = Array.isArray(formData.mostWantedIdentifiers)
    ? formData.mostWantedIdentifiers.join(', ')
    : '';

  const rewardLabel =
    formData.reporterType === 'reward'
      ? 'I want to be eligible for reward'
      : "I DON'T want to be eligible for reward";

  return (
    <div>
      {isBountyMode || isMostWantedMode ? (
        <ReviewRow
          label={isMostWantedMode ? 'Most Wanted alert' : 'Bounty'}
          value={bountyTitle || formData.title}
          onEdit={onGoToStep}
          step={step('context')}
        />
      ) : (
        <ReviewRow
          label="Organization"
          value={orgLabel}
          onEdit={onGoToStep}
          step={step('organization')}
        />
      )}
      <ReviewRow
        label="Location"
        value={location || '—'}
        onEdit={onGoToStep}
        step={step('context')}
      />
      <ReviewRow
        label={isMostWantedMode ? 'Category & time seen' : isBountyMode ? 'Category' : 'Category & date'}
        value={isMostWantedMode ? [categorySummary, formData.timeSeen].filter(Boolean).join(' · ') : categorySummary}
        onEdit={onGoToStep}
        step={step('context')}
      />
      {isMostWantedMode && (
        <ReviewRow
          label="What matched"
          value={matchedSummary || '—'}
          onEdit={onGoToStep}
          step={step('match')}
        />
      )}
      <ReviewRow
        label={isMostWantedMode ? 'Your intel' : isBountyMode ? 'Your tip' : 'Story'}
        value={storySummary}
        onEdit={onGoToStep}
        step={step('story')}
      />
      <ReviewRow
        label="Evidence"
        value={evidenceSummary}
        onEdit={onGoToStep}
        step={step('evidence')}
      />
      {!isFeedbackMode && (
        <ReviewRow
          label="Access preference"
          value={rewardLabel}
          onEdit={onGoToStep}
          step={step('finish')}
        />
      )}
    </div>
  );
}
