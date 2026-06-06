'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FieldError } from '@/components/ui/form-feedback';

export default function NarrativeStep({ details, onChange, fieldErrors = {} }) {
  const set = (key, value) => onChange({ ...details, [key]: value });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mw-full-details">Full details</Label>
        <Textarea
          id="mw-full-details"
          rows={8}
          placeholder="Full narrative of the report and allegations"
          value={details.full_details || ''}
          onChange={(e) => set('full_details', e.target.value)}
        />
        <FieldError message={fieldErrors.full_details} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mw-additional-information">Additional information</Label>
        <Textarea
          id="mw-additional-information"
          rows={4}
          placeholder="Tattoos, scars, distinguishing marks, languages spoken, etc."
          value={details.additional_information || ''}
          onChange={(e) => set('additional_information', e.target.value)}
        />
      </div>
    </div>
  );
}
