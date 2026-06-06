'use client';

import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMostWantedStepNumber } from './mostWantedStepMeta';
import {
  displayMostWantedValue,
  formatCrimeLocation,
  getLawEnforcementDisplay,
} from '@/lib/mostWantedUtils';

function ReviewRow({ label, value, onEdit, step }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="break-words text-sm">{value}</p>
      </div>
      {onEdit && step != null && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1 text-primary"
          onClick={() => onEdit(step)}
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Button>
      )}
    </div>
  );
}

export default function MostWantedReviewSummary({ title, details, hasFeaturedImage, onGoToStep, steps }) {
  const step = (id) => getMostWantedStepNumber(steps, id);
  const d = details;

  return (
    <div className="divide-y rounded-lg border bg-muted/20">
      <ReviewRow label="Headline" value={title} onEdit={onGoToStep} step={step('identity')} />
      <ReviewRow
        label="Report"
        value={[d.crime_type, formatCrimeLocation(d)].filter(Boolean).join(' · ')}
        onEdit={onGoToStep}
        step={step('case_facts')}
      />
      <ReviewRow
        label="Suspect"
        value={[d.suspect_name, d.nickname && `aka ${d.nickname}`].filter(Boolean).join(' ')}
        onEdit={onGoToStep}
        step={step('identity')}
      />
      <ReviewRow
        label="Agency"
        value={getLawEnforcementDisplay(d)}
        onEdit={onGoToStep}
        step={step('case_facts')}
      />
      <ReviewRow
        label="Appearance"
        value={[d.sex, d.age, d.build, d.hair_colour].filter(Boolean).join(' · ')}
        onEdit={onGoToStep}
        step={step('physical')}
      />
      <ReviewRow
        label="Full details"
        value={
          d.full_details?.slice(0, 140) + (d.full_details?.length > 140 ? '…' : '')
        }
        onEdit={onGoToStep}
        step={step('narrative')}
      />
      <ReviewRow
        label="Photos"
        value={hasFeaturedImage ? 'Featured image set' : 'No featured image'}
        onEdit={onGoToStep}
        step={step('media')}
      />
      <div className="px-4 py-3 text-xs text-muted-foreground">
        Report ID: {displayMostWantedValue(d.case_reference)} · Whereabouts:{' '}
        {displayMostWantedValue(d.whereabouts)}
      </div>
    </div>
  );
}
