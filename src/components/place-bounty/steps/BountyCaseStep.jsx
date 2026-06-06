'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { inputFieldClasses, textareaFieldClasses, selectTriggerFieldClasses } from '@/lib/fieldStyles';
import { FieldError } from '@/components/ui/form-feedback';
import { TipFieldGroup } from '@/components/submit-report/TipFieldLabel';

const crimeTypes = [
  'Theft',
  'Murderer',
  'Fraud',
  'Assault',
  'Scam',
  'Sex Predator',
  'Armed Robbery',
  'Kidnapping',
  'Vandalism',
  'Missing Person',
  'Cybercrime',
  'Other',
];

export default function BountyCaseStep({ formData, handleInputChange, fieldErrors = {} }) {
  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <TipFieldGroup isBountyMode label="Bounty title" htmlFor="bounty-title">
        <Input
          id="bounty-title"
          placeholder="e.g., Information leading to recovery of stolen vehicle"
          aria-label="Bounty title"
          value={formData.title || ''}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={inputFieldClasses}
        />
        <FieldError message={fieldErrors.title} className="mt-2" />
      </TipFieldGroup>

      <TipFieldGroup isBountyMode label="Suspect description" htmlFor="bounty-description">
        <Textarea
          id="bounty-description"
          placeholder="Provide a physical description, behavior, identifying details, etc."
          aria-label="Suspect description"
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className={textareaFieldClasses}
          rows={6}
        />
        <FieldError message={fieldErrors.description} className="mt-2" />
      </TipFieldGroup>

      <TipFieldGroup isBountyMode label="Type of crime" htmlFor="bounty-crime-type">
        <Select
          value={formData.typeOfCrime || ''}
          onValueChange={(v) => handleInputChange('typeOfCrime', v)}
        >
          <SelectTrigger id="bounty-crime-type" className={selectTriggerFieldClasses} aria-label="Type of crime">
            <SelectValue placeholder="Select type of crime" />
          </SelectTrigger>
          <SelectContent>
            {crimeTypes.map((crime) => (
              <SelectItem key={crime} value={crime}>
                {crime}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={fieldErrors.typeOfCrime} className="mt-2" />
      </TipFieldGroup>
    </div>
  );
}
