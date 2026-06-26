'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { dateInputFieldClasses, inputFieldClasses, selectTriggerFieldClasses } from '@/lib/fieldStyles';
import {
  formatTimeSeenDisplay,
  getCategories,
} from '../reportFormUtils';
import { useReportFormLocation } from '../useReportFormLocation';
import { FieldError } from '@/components/ui/form-feedback';
import { TipFieldGroup } from '../TipFieldLabel';
import MobileIncidentDateField from '../MobileIncidentDateField';

const DatePicker = dynamic(() => import('react-datepicker'), { ssr: false });

export default function ContextStep({
  formData,
  handleSelectChange,
  isFeedbackMode,
  isBountyMode,
  isMostWantedMode,
  mostWantedContext,
  fieldErrors = {},
}) {
  const { states, lgas, hasLgasForState, handleStateChange } = useReportFormLocation(
    formData,
    handleSelectChange
  );
  const categories = getCategories(isFeedbackMode);
  const maxDate = useMemo(() => new Date(), []);
  const statePlaceholder = isBountyMode || isMostWantedMode
    ? 'Select state'
    : 'State where incident occurred';
  const lgaPlaceholder = isBountyMode || isMostWantedMode
    ? 'Select LGA (optional)'
    : 'Local government area (LGA, optional)';
  const addressPlaceholder = isBountyMode || isMostWantedMode
    ? 'Street, area, or landmark'
    : 'Incident address (optional)';
  const timeInputRef = useRef(null);

  const openTimePicker = useCallback(() => {
    const input = timeInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // Fall through to click() when showPicker is blocked.
      }
    }

    input.click();
  }, []);

  const subjectPronoun = useMemo(() => {
    const sex = String(mostWantedContext?.sex || '').toLowerCase();
    if (sex === 'male') return 'him';
    if (sex === 'female') return 'her';
    return 'them';
  }, [mostWantedContext?.sex]);
  const stateLabel = isMostWantedMode
    ? `State where you saw ${subjectPronoun}`
    : 'State where you observed this';
  const addressLabel = isMostWantedMode
    ? `Address where you saw ${subjectPronoun}`
    : 'Address where you observed this';
  const dateLabel = isMostWantedMode
    ? `Date you saw ${subjectPronoun}`
    : 'Date of incident';
  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      {isMostWantedMode && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-900/50 dark:bg-red-950/20">
          <p className="font-semibold text-red-700 dark:text-red-300">Most Wanted alert</p>
          <p className="mt-1 text-muted-foreground">{mostWantedContext?.title || formData.title}</p>
          {mostWantedContext?.reportId && (
            <p className="mt-1 text-xs text-muted-foreground">Report ID: {mostWantedContext.reportId}</p>
          )}
        </div>
      )}

      <TipFieldGroup
        isBountyMode={isBountyMode || isMostWantedMode}
        label={stateLabel}
        htmlFor="stateOfIncident"
      >
        <Select
          value={formData.stateOfIncident || ''}
          onValueChange={handleStateChange}
        >
          <SelectTrigger id="stateOfIncident" className={selectTriggerFieldClasses} aria-label={statePlaceholder}>
            <SelectValue placeholder={statePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={fieldErrors.stateOfIncident} className="mt-2" />
      </TipFieldGroup>

      <TipFieldGroup
        isBountyMode={isBountyMode || isMostWantedMode}
        label="Local government area (LGA)"
        htmlFor="lga"
        optional
      >
        <Select
          value={formData.lga || ''}
          onValueChange={(v) => handleSelectChange('lga', v)}
          disabled={!formData.stateOfIncident}
        >
          <SelectTrigger id="lga" className={selectTriggerFieldClasses} aria-label={lgaPlaceholder}>
            <SelectValue placeholder={lgaPlaceholder} />
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

      {formData.stateOfIncident && !hasLgasForState && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          No LGA list available for this state — you may continue without selecting an LGA.
        </p>
      )}

      <TipFieldGroup
        isBountyMode={isBountyMode || isMostWantedMode}
        label={addressLabel}
        htmlFor="incidentAddress"
        optional
      >
        <Input
          id="incidentAddress"
          placeholder={addressPlaceholder}
          aria-label={addressPlaceholder}
          value={formData.incidentAddress || ''}
          onChange={(e) => handleSelectChange('incidentAddress', e.target.value)}
          className={inputFieldClasses}
        />
      </TipFieldGroup>

      {!isMostWantedMode && (
        <TipFieldGroup
          isBountyMode={isBountyMode || isMostWantedMode}
          label="Category"
          htmlFor="category"
        >
          <Select
            value={formData.category || ''}
            onValueChange={(v) => handleSelectChange('category', v)}
            disabled={(isBountyMode || isMostWantedMode) && !!formData.category}
          >
            <SelectTrigger id="category" className={selectTriggerFieldClasses} aria-label="Report category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={fieldErrors.category} className="mt-2" />
        </TipFieldGroup>
      )}

      {!isBountyMode && !isMostWantedMode && (
        <>
          <MobileIncidentDateField
            id="dateOfIncident"
            value={formData.dateOfIncident}
            onChange={(date) => handleSelectChange('dateOfIncident', date)}
            placeholder="Select incident date"
            ariaLabel="Date of incident"
            maxDate={maxDate}
          />
          <FieldError message={fieldErrors.dateOfIncident} className="mt-2 md:hidden" />

          {/* Desktop: react-datepicker popup */}
          <div className="hidden md:block w-full min-w-0 max-w-full">
            <DatePicker
              id="dateOfIncident"
              selected={formData.dateOfIncident}
              onChange={(date) => handleSelectChange('dateOfIncident', date)}
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
        </>
      )}

      {isMostWantedMode && (
        <>
          <TipFieldGroup
            isBountyMode
            label={dateLabel}
            htmlFor="dateOfIncident"
          >
            <MobileIncidentDateField
              id="dateOfIncident"
              value={formData.dateOfIncident}
              onChange={(date) => handleSelectChange('dateOfIncident', date)}
              placeholder="Select date"
              ariaLabel={dateLabel}
              maxDate={maxDate}
            />
            <FieldError message={fieldErrors.dateOfIncident} className="mt-2 md:hidden" />

            {/* Desktop: react-datepicker popup */}
            <div className="hidden md:block w-full min-w-0 max-w-full">
              <DatePicker
                id="dateOfIncidentDesktop"
                selected={formData.dateOfIncident}
                onChange={(date) => handleSelectChange('dateOfIncident', date)}
                maxDate={maxDate}
                placeholderText={dateLabel}
                dateFormat="MMMM d, yyyy"
                className={dateInputFieldClasses}
                wrapperClassName="w-full"
                showPopperArrow={false}
                popperPlacement="bottom-start"
                aria-label={dateLabel}
              />
            </div>
            <FieldError message={fieldErrors.dateOfIncident} className="mt-2 hidden md:block" />
          </TipFieldGroup>
        <TipFieldGroup
          isBountyMode
          label="Time seen"
          htmlFor="timeSeen"
        >
          <div className="relative w-full">
            <button
              type="button"
              id="timeSeen"
              onClick={openTimePicker}
              className={cn(
                inputFieldClasses,
                'w-full cursor-pointer text-left',
                !formData.timeSeen?.trim() && 'text-muted-foreground'
              )}
            >
              {formData.timeSeen?.trim()
                ? formatTimeSeenDisplay(formData.timeSeen)
                : 'Select time'}
            </button>
            <input
              ref={timeInputRef}
              type="time"
              aria-label="Time seen"
              tabIndex={-1}
              className="sr-only"
              value={formData.timeSeen || ''}
              onChange={(e) => handleSelectChange('timeSeen', e.target.value)}
            />
          </div>
          <FieldError message={fieldErrors.timeSeen} className="mt-2" />
        </TipFieldGroup>
        </>
      )}
    </div>
  );
}
