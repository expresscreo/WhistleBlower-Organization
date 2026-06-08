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
  DEFAULT_MOST_WANTED_COUNTRY,
  LAW_ENFORCEMENT_OPTIONS,
  MOST_WANTED_COUNTRY_OPTIONS,
  MOST_WANTED_INACTIVE_INPUT_CLASS,
  generateMostWantedReportReference,
  resolveMostWantedCountry,
} from '@/lib/mostWantedUtils';
import {
  MOST_WANTED_CLEAR_SELECT_VALUE,
  useMostWantedFormLocation,
} from '../useMostWantedFormLocation';

export default function CaseFactsStep({ details, onChange, fieldErrors = {} }) {
  const set = (key, value) => onChange({ ...details, [key]: value });
  const {
    states,
    lgas,
    hasLgasForState,
    handleStateSelect,
    handleLgaSelect,
    handleCountryChange,
    isNigeria,
  } = useMostWantedFormLocation(details, onChange);

  useEffect(() => {
    const updates = {};
    if (!details.case_reference?.trim()) {
      updates.case_reference = generateMostWantedReportReference();
    }
    if (!resolveMostWantedCountry(details.crime_country)) {
      updates.crime_country = DEFAULT_MOST_WANTED_COUNTRY;
    }
    if (Object.keys(updates).length > 0) {
      onChange({ ...details, ...updates });
    }
    // Only assign defaults when missing (e.g. new alert)
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
        <Label htmlFor="mw-crime-country">Country</Label>
        <Select
          value={resolveMostWantedCountry(details.crime_country)}
          onValueChange={handleCountryChange}
        >
          <SelectTrigger id="mw-crime-country">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {MOST_WANTED_COUNTRY_OPTIONS.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={fieldErrors.crime_country} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mw-crime-state">
          {isNigeria ? 'State (optional)' : 'State / region (optional)'}
        </Label>
        {isNigeria ? (
          <Select
            value={details.crime_state || undefined}
            onValueChange={handleStateSelect}
          >
            <SelectTrigger id="mw-crime-state">
              <SelectValue placeholder="Select state (optional)" />
            </SelectTrigger>
            <SelectContent>
              {details.crime_state && (
                <SelectItem value={MOST_WANTED_CLEAR_SELECT_VALUE} className="text-muted-foreground">
                  Clear selection
                </SelectItem>
              )}
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="mw-crime-state"
            placeholder="e.g., Greater Accra (optional)"
            value={details.crime_state || ''}
            onChange={(e) => set('crime_state', e.target.value)}
          />
        )}
        <FieldError message={fieldErrors.crime_state} />
        <p className="text-xs text-muted-foreground">
          Optional — if left blank, state will not appear on the public alert.
        </p>
      </div>

      {isNigeria && (
        <div className="space-y-2">
          <Label htmlFor="mw-crime-lga">Local government area (LGA) (optional)</Label>
          <Select
            value={details.crime_lga || undefined}
            onValueChange={handleLgaSelect}
            disabled={!details.crime_state || !hasLgasForState}
          >
            <SelectTrigger id="mw-crime-lga">
              <SelectValue placeholder="Select LGA (optional)" />
            </SelectTrigger>
            <SelectContent>
              {details.crime_lga && (
                <SelectItem value={MOST_WANTED_CLEAR_SELECT_VALUE} className="text-muted-foreground">
                  Clear selection
                </SelectItem>
              )}
              {lgas.map((lga) => (
                <SelectItem key={lga} value={lga}>
                  {lga}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={fieldErrors.crime_lga} />
          {details.crime_state && !hasLgasForState && (
            <p className="text-xs text-muted-foreground">
              No LGA list is available for this state. Leave blank and the public page will show state only.
            </p>
          )}
          {details.crime_state && hasLgasForState && (
            <p className="text-xs text-muted-foreground">
              Optional — choose “Clear selection” or leave blank to omit LGA on the public alert.
            </p>
          )}
        </div>
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
