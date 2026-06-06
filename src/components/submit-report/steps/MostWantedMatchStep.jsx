'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FieldError } from '@/components/ui/form-feedback';
import { TipFieldGroup } from '../TipFieldLabel';
import { inputFieldClasses, textareaFieldClasses } from '@/lib/fieldStyles';

const IDENTIFIER_OPTIONS = [
  'Face / facial features',
  'Height / build',
  'Hair style / colour',
  'Tattoo / scar / mark',
  'Clothing',
  'Companion(s)',
  'Vehicle',
];

export default function MostWantedMatchStep({
  formData,
  handleSelectChange,
  fieldErrors = {},
}) {
  const selected = Array.isArray(formData.mostWantedIdentifiers)
    ? formData.mostWantedIdentifiers
    : [];

  const toggleIdentifier = (value, checked) => {
    if (checked) {
      handleSelectChange('mostWantedIdentifiers', [...selected, value]);
      return;
    }
    handleSelectChange(
      'mostWantedIdentifiers',
      selected.filter((item) => item !== value)
    );
  };

  return (
    <div className="space-y-5">
      <TipFieldGroup isBountyMode label="What matched?" htmlFor="mw-identifiers">
        <div id="mw-identifiers" className="space-y-3 rounded-lg border p-4">
          {IDENTIFIER_OPTIONS.map((item) => (
            <label key={item} className="flex items-center gap-3 text-sm cursor-pointer">
              <Checkbox
                checked={selected.includes(item)}
                onCheckedChange={(checked) => toggleIdentifier(item, !!checked)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
        <FieldError message={fieldErrors.identifiers} className="mt-2" />
      </TipFieldGroup>

      <TipFieldGroup isBountyMode label="Direction / movement" htmlFor="mw-direction" optional>
        <Input
          id="mw-direction"
          placeholder="e.g., Heading toward Ojota in a white Corolla"
          value={formData.mostWantedDirection || ''}
          onChange={(e) => handleSelectChange('mostWantedDirection', e.target.value)}
          className={inputFieldClasses}
        />
      </TipFieldGroup>

      <TipFieldGroup isBountyMode label="Additional observed details" htmlFor="mw-observed-details" optional>
        <Textarea
          id="mw-observed-details"
          rows={4}
          placeholder="Clothing, companion details, vehicle plate, behavior, and any other useful observations."
          value={formData.mostWantedObservedDetails || ''}
          onChange={(e) => handleSelectChange('mostWantedObservedDetails', e.target.value)}
          className={textareaFieldClasses}
        />
      </TipFieldGroup>
    </div>
  );
}
