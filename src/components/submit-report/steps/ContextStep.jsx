'use client';

import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dateInputFieldClasses, inputFieldClasses, selectTriggerFieldClasses } from '@/lib/fieldStyles';
import { getCategories, formatDateForInput } from '../reportFormUtils';
import { useReportFormLocation } from '../useReportFormLocation';

const DatePicker = dynamic(() => import('react-datepicker'), { ssr: false });

export default function ContextStep({
  formData,
  handleSelectChange,
  isFeedbackMode,
  isBountyMode,
}) {
  const { states, lgas, hasLgasForState, handleStateChange } = useReportFormLocation(
    formData,
    handleSelectChange
  );
  const categories = getCategories(isFeedbackMode);
  const maxDate = formatDateForInput(new Date());

  return (
    <div className="space-y-4">
      <Select
        value={formData.stateOfIncident || ''}
        onValueChange={handleStateChange}
      >
        <SelectTrigger id="stateOfIncident" className={selectTriggerFieldClasses} aria-label="State of incident">
          <SelectValue placeholder="State where incident occurred" />
        </SelectTrigger>
        <SelectContent>
          {states.map((state) => (
            <SelectItem key={state} value={state}>
              {state}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={formData.lga || ''}
        onValueChange={(v) => handleSelectChange('lga', v)}
        disabled={!formData.stateOfIncident}
      >
        <SelectTrigger id="lga" className={selectTriggerFieldClasses} aria-label="Local government area">
          <SelectValue placeholder="Local government area (LGA)" />
        </SelectTrigger>
        <SelectContent>
          {lgas.map((lga) => (
            <SelectItem key={lga} value={lga}>
              {lga}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {formData.stateOfIncident && !hasLgasForState && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          No LGA list available for this state — you may continue without selecting an LGA.
        </p>
      )}

      <Input
        id="incidentAddress"
        placeholder="Incident address (optional)"
        aria-label="Incident address"
        value={formData.incidentAddress || ''}
        onChange={(e) => handleSelectChange('incidentAddress', e.target.value)}
        className={inputFieldClasses}
      />

      <Select
        value={formData.category || ''}
        onValueChange={(v) => handleSelectChange('category', v)}
        disabled={isBountyMode && !!formData.category}
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

      {/* Desktop: react-datepicker */}
      <div className="hidden md:block">
        <DatePicker
          id="dateOfIncidentDesktop"
          selected={formData.dateOfIncident}
          onChange={(date) => handleSelectChange('dateOfIncident', date)}
          maxDate={new Date()}
          placeholderText="Date of incident"
          dateFormat="PPP"
          className={dateInputFieldClasses}
          wrapperClassName="w-full"
        />
      </div>
    </div>
  );
}
