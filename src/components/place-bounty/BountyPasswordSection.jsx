'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/form-feedback';
import { inputFieldClasses } from '@/lib/fieldStyles';
import { TipFieldGroup } from '@/components/submit-report/TipFieldLabel';

export default function BountyPasswordSection({ formData, handleInputChange, fieldErrors = {} }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Create a password to securely track your bounty&apos;s status.{' '}
        <strong>Keep it safe</strong> — it cannot be recovered.
      </p>

      <TipFieldGroup isBountyMode label="Create password" htmlFor="bounty-password">
        <div className="relative">
          <Input
            id="bounty-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            aria-label="Create password"
            autoComplete="new-password"
            value={formData.password || ''}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={inputFieldClasses}
            minLength={8}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <FieldError message={fieldErrors.password} className="mt-2" />
      </TipFieldGroup>

      <TipFieldGroup isBountyMode label="Confirm password" htmlFor="bounty-confirm-password">
        <div className="relative">
          <Input
            id="bounty-confirm-password"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Re-enter password"
            aria-label="Confirm password"
            autoComplete="new-password"
            value={formData.confirmPassword || ''}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={inputFieldClasses}
            minLength={8}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowConfirm(!showConfirm)}
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <FieldError message={fieldErrors.confirmPassword} className="mt-2" />
      </TipFieldGroup>
    </div>
  );
}
