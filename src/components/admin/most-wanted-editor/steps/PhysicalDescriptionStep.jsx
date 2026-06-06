'use client';

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
import { BUILD_OPTIONS, HAIR_COLOUR_OPTIONS, SEX_OPTIONS } from '@/lib/mostWantedUtils';

export default function PhysicalDescriptionStep({ details, onChange, fieldErrors = {} }) {
  const set = (key, value) => onChange({ ...details, [key]: value });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mw-whereabouts">Whereabouts</Label>
        <Input
          id="mw-whereabouts"
          placeholder="e.g., Last seen in Abuja"
          value={details.whereabouts || ''}
          onChange={(e) => set('whereabouts', e.target.value)}
        />
        <FieldError message={fieldErrors.whereabouts} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mw-sex">Sex</Label>
          <Select value={details.sex || ''} onValueChange={(v) => set('sex', v)}>
            <SelectTrigger id="mw-sex">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {SEX_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={fieldErrors.sex} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mw-age">Age</Label>
          <Input
            id="mw-age"
            placeholder="e.g., 30 - 35"
            value={details.age || ''}
            onChange={(e) => set('age', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mw-height">Height</Label>
          <Input
            id="mw-height"
            placeholder={'e.g., 170 - 175 cm (approx 5\' 8")'}
            value={details.height || ''}
            onChange={(e) => set('height', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mw-build">Build</Label>
          <Select value={details.build || ''} onValueChange={(v) => set('build', v)}>
            <SelectTrigger id="mw-build">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {BUILD_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="mw-hair-colour">Hair colour</Label>
          <Select value={details.hair_colour || ''} onValueChange={(v) => set('hair_colour', v)}>
            <SelectTrigger id="mw-hair-colour">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {HAIR_COLOUR_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
