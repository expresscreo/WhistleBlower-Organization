'use client';

import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldError } from '@/components/ui/form-feedback';
import {
  CRIME_TYPE_OPTIONS,
  LAW_ENFORCEMENT_OPTIONS,
  MOST_WANTED_INACTIVE_INPUT_CLASS,
  generateMostWantedReportReference,
} from '@/lib/mostWantedUtils';
import { useMostWantedFormLocation } from '../useMostWantedFormLocation';

export default function CaseFactsStep({ details, onChange, fieldErrors = {} }) {
  const set = (key, value) => onChange({ ...details, [key]: value });
  const { states, lgas, hasLgasForState, handleStateChange } = useMostWantedFormLocation(
    details,
    onChange
  );

  useEffect(() => {
    if (!details.case_reference?.trim()) {
      onChange({ ...details, case_reference: generateMostWantedReportReference() });
    }
    // Only assign an ID when missing (e.g. new alert)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mw-crime-type">Crime type</Label>
        <Select value={details.crime_type || ''} onValueChange={(v) => set('crime_type', v)}>
          <SelectTrigger id="mw-crime-type">
            <SelectValue placeholder="Select crime type" />
          </SelectTrigger>
          <SelectContent>
            {CRIME_TYPE_OPTIONS.map((crime) => (
              <SelectItem key={crime} value={crime}>
                {crime}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={fieldErrors.crime_type} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mw-report-id">Report ID</Label>
        <Input
          id="mw-report-id"
          value={details.case_reference || 'Generating…'}
          readOnly
          tabIndex={-1}
          aria-readonly="true"
          className={`font-mono text-sm ${MOST_WANTED_INACTIVE_INPUT_CLASS}`}
        />
        <p className="text-xs text-muted-foreground">
          Auto-generated — not editable.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mw-crime-state">State</Label>
        <Select value={details.crime_state || ''} onValueChange={handleStateChange}>
          <SelectTrigger id="mw-crime-state">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={fieldErrors.crime_state} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mw-crime-lga">Local government area (LGA)</Label>
        <Select
          value={details.crime_lga || ''}
          onValueChange={(v) => set('crime_lga', v)}
          disabled={!details.crime_state}
        >
          <SelectTrigger id="mw-crime-lga">
            <SelectValue placeholder="Select LGA" />
          </SelectTrigger>
          <SelectContent>
            {lgas.map((lga) => (
              <SelectItem key={lga} value={lga}>
                {lga}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={fieldErrors.crime_lga} />
      </div>

      {details.crime_state && !hasLgasForState && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          No LGA list available for this state — you may continue without selecting an LGA.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="mw-crime-address">Address (optional)</Label>
        <Input
          id="mw-crime-address"
          placeholder="e.g., 123 Akure Road, Ikeja"
          value={details.crime_address || ''}
          onChange={(e) => set('crime_address', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mw-people-involved">Number of people involved</Label>
        <Input
          id="mw-people-involved"
          placeholder="e.g., 1 or 2–3"
          value={details.people_involved || ''}
          onChange={(e) => set('people_involved', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mw-law-enforcement">Law enforcement</Label>
        <Select value={details.law_enforcement || ''} onValueChange={(v) => set('law_enforcement', v)}>
          <SelectTrigger id="mw-law-enforcement">
            <SelectValue placeholder="Select agency" />
          </SelectTrigger>
          <SelectContent>
            {LAW_ENFORCEMENT_OPTIONS.map((agency) => (
              <SelectItem key={agency} value={agency}>
                {agency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={fieldErrors.law_enforcement} />
      </div>

      {details.law_enforcement === 'Other Law Enforcement' && (
        <div className="space-y-2">
          <Label htmlFor="mw-law-enforcement-other">Agency name</Label>
          <Input
            id="mw-law-enforcement-other"
            placeholder="Enter agency name"
            value={details.law_enforcement_other || ''}
            onChange={(e) => set('law_enforcement_other', e.target.value)}
          />
          <FieldError message={fieldErrors.law_enforcement_other} />
        </div>
      )}
    </div>
  );
}
