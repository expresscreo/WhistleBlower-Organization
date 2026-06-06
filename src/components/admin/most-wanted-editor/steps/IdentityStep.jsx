'use client';

import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/ui/form-feedback';
import { buildMostWantedHeadline, MOST_WANTED_INACTIVE_INPUT_CLASS } from '@/lib/mostWantedUtils';

export default function IdentityStep({ title, details, onTitleChange, onChange, fieldErrors = {} }) {
  const set = (key, value) => onChange({ ...details, [key]: value });

  useEffect(() => {
    const headline = buildMostWantedHeadline(details);
    if (headline && headline !== title) {
      onTitleChange(headline);
    }
  }, [details.suspect_name, details.crime_type, details, title, onTitleChange]);

  const headlinePreview = buildMostWantedHeadline(details);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mw-title">Public headline</Label>
        <Input
          id="mw-title"
          value={headlinePreview || title || ''}
          readOnly
          tabIndex={-1}
          aria-readonly="true"
          placeholder="Enter suspect name below — headline is generated automatically"
          className={MOST_WANTED_INACTIVE_INPUT_CLASS}
        />
        <p className="text-xs text-muted-foreground">
          Auto-generated as &ldquo;[suspect name] wanted for [crime type]&rdquo; — not editable.
        </p>
        <FieldError message={fieldErrors.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mw-suspect-name">Suspect name</Label>
        <Input
          id="mw-suspect-name"
          placeholder="Full name as known"
          value={details.suspect_name || ''}
          onChange={(e) => set('suspect_name', e.target.value)}
        />
        <FieldError message={fieldErrors.suspect_name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mw-nickname">Nickname</Label>
        <Input
          id="mw-nickname"
          placeholder="Optional — leave blank if none"
          value={details.nickname || ''}
          onChange={(e) => set('nickname', e.target.value)}
        />
      </div>
    </div>
  );
}
