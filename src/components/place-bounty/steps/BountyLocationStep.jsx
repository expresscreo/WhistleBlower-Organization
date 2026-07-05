'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dateInputFieldClasses, inputFieldClasses, selectTriggerFieldClasses } from '@/lib/fieldStyles';
import { FieldError } from '@/components/ui/form-feedback';
import { TipFieldGroup } from '@/components/submit-report/TipFieldLabel';
import MobileIncidentDateField from '@/components/submit-report/MobileIncidentDateField';
import { useBountyFormLocation } from '../useBountyFormLocation';

const DatePicker = dynamic(() => import('react-datepicker'), { ssr: false });

export default function BountyLocationStep({ formData, handleInputChange, fieldErrors = {} }) {
  const { states, lgas, hasLgasForState, handleStateChange } = useBountyFormLocation(
    formData,
    handleInputChange
  );
  const maxDate = useMemo(() => new Date(), []);

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <TipFieldGroup isBountyMode label="State of incident" htmlFor="bounty-state">
        <Select value={formData.state || ''} onValueChange={handleStateChange}>
          <SelectTrigger id="bounty-state" className={selectTriggerFieldClasses} aria-label="State of incident">
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
        <FieldError message={fieldErrors.state} className="mt-2" />
      </TipFieldGroup>

      <TipFieldGroup isBountyMode label="Local government area (LGA)" htmlFor="bounty-lga">
        <Select
          value={formData.lga || ''}
          onValueChange={(v) => handleInputChange('lga', v)}
          disabled={!formData.state}
        >
          <SelectTrigger id="bounty-lga" className={selectTriggerFieldClasses} aria-label="Local government area">
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
        <FieldError message={fieldErrors.lga} className="mt-2" />
      </TipFieldGroup>

      {formData.state && !hasLgasForState && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          No LGA list available for this state — you may continue without selecting an LGA.
        </p>
      )}

      <TipFieldGroup isBountyMode label="Full address" htmlFor="bounty-address" optional>
        <Input
          id="bounty-address"
          placeholder="e.g., 123 Akure Road, Ikeja, Lagos"
          aria-label="Full address"
          value={formData.fullAddress || ''}
          onChange={(e) => handleInputChange('fullAddress', e.target.value)}
          className={inputFieldClasses}
        />
      </TipFieldGroup>

      <TipFieldGroup isBountyMode label="Date of incident" htmlFor="bounty-incident-date">
        <MobileIncidentDateField
          id="bounty-incident-date"
          value={formData.dateOfIncident}
          onChange={(date) => handleInputChange('dateOfIncident', date)}
          placeholder="Select incident date"
          ariaLabel="Date of incident"
          maxDate={maxDate}
        />
        <FieldError message={fieldErrors.dateOfIncident} className="mt-2 md:hidden" />

        <div className="hidden md:block w-full min-w-0 max-w-full">
          <DatePicker
            id="bounty-incident-date-desktop"
            selected={formData.dateOfIncident}
            onChange={(date) => handleInputChange('dateOfIncident', date)}
            maxDate={maxDate}
            placeholderText="Date of incident"
            dateFormat="MMMM d, yyyy"
            className={dateInputFieldClasses}
            wrapperClassName="w-full"
            showPopperArrow={false}
            popperPlacement="bottom-start"
            aria-label="Date of incident"
          />
        </div>
        <FieldError message={fieldErrors.dateOfIncident} className="mt-2 hidden md:block" />
      </TipFieldGroup>
    </div>
  );
}
