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
import { cn } from '@/lib/utils';
import { dateInputFieldClasses, inputFieldClasses, selectTriggerFieldClasses } from '@/lib/fieldStyles';
import {
  formatDateForInput,
  formatIncidentDate,
  formatTimeSeenDisplay,
  getCategories,
} from '../reportFormUtils';
import { useReportFormLocation } from '../useReportFormLocation';
import { FieldError } from '@/components/ui/form-feedback';
import { TipFieldGroup } from '../TipFieldLabel';

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
  const maxDate = formatDateForInput(new Date());
  const statePlaceholder = isBountyMode || isMostWantedMode
    ? 'Select state'
    : 'State where incident occurred';
  const lgaPlaceholder = isBountyMode || isMostWantedMode
    ? 'Select LGA'
    : 'Local government area (LGA)';
  const addressPlaceholder = isBountyMode || isMostWantedMode
    ? 'Street, area, or landmark'
    : 'Incident address (optional)';
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
          {/* Mobile: native date */}
          <Input
            id="dateOfIncident"
            type="date"
            max={maxDate}
            aria-label="Date of incident"
            className={`md:hidden ${dateInputFieldClasses}`}
            value={formatDateForInput(formData.dateOfIncident)}
            onChange={(e) =>
              handleSelectChange(
                'dateOfIncident',
                e.target.value ? new Date(e.target.value) : null
              )
            }
          />
          <FieldError message={fieldErrors.dateOfIncident} className="mt-2" />

          {/* Desktop: react-datepicker */}
          <div className="hidden md:block w-full min-w-0 max-w-full">
            <DatePicker
              id="dateOfIncident"
              selected={formData.dateOfIncident}
              onChange={(date) => handleSelectChange('dateOfIncident', date)}
              maxDate={new Date()}
              placeholderText="Date of incident"
              dateFormat="PPP"
              className={dateInputFieldClasses}
              wrapperClassName="w-full"
            />
          </div>
        </>
      )}

      {isMostWantedMode && (
        <>
          <TipFieldGroup
            isBountyMode
            label={dateLabel}
            htmlFor="dateOfIncident"
          >
            {/* Mobile: button-styled native date picker */}
            <div className="relative w-full md:hidden">
              <button
                type="button"
                tabIndex={-1}
                aria-hidden
                className={cn(
                  inputFieldClasses,
                  'pointer-events-none w-full text-left',
                  !formData.dateOfIncident && 'text-muted-foreground'
                )}
              >
                {formData.dateOfIncident
                  ? formatIncidentDate(formData.dateOfIncident)
                  : 'Select date'}
              </button>
              <input
                id="dateOfIncident"
                type="date"
                max={maxDate}
                aria-label={dateLabel}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                value={formatDateForInput(formData.dateOfIncident)}
                onChange={(e) =>
                  handleSelectChange(
                    'dateOfIncident',
                    e.target.value ? new Date(`${e.target.value}T12:00:00`) : null
                  )
                }
              />
            </div>
            <FieldError message={fieldErrors.dateOfIncident} className="mt-2 md:hidden" />

            {/* Desktop: react-datepicker */}
            <div className="hidden md:block w-full min-w-0 max-w-full">
              <DatePicker
                id="dateOfIncident"
                selected={formData.dateOfIncident}
                onChange={(date) => handleSelectChange('dateOfIncident', date)}
                maxDate={new Date()}
                placeholderText={dateLabel}
                dateFormat="PPP"
                className={dateInputFieldClasses}
                wrapperClassName="w-full"
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
              tabIndex={-1}
              aria-hidden
              className={cn(
                inputFieldClasses,
                'pointer-events-none w-full text-left',
                !formData.timeSeen?.trim() && 'text-muted-foreground'
              )}
            >
              {formData.timeSeen?.trim()
                ? formatTimeSeenDisplay(formData.timeSeen)
                : 'Select time'}
            </button>
            <input
              id="timeSeen"
              type="time"
              aria-label="Time seen"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
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
