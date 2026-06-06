'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Gift, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { inputFieldClasses, inputWithTrailingIconClasses } from '@/lib/fieldStyles';
import { FieldError } from '@/components/ui/form-feedback';
import { TipFieldGroup } from './TipFieldLabel';

export default function ContactInfo({
  formData,
  onInputChange,
  embedded = false,
  fieldErrors = {},
  isBountyMode = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const wrapperClass = embedded ? 'space-y-4' : 'space-y-4 p-6 border rounded-lg';

  return (
    <div className={wrapperClass}>
      <p className="text-sm text-muted-foreground">
        {isBountyMode
          ? 'Choose how you want to track your tip. A password is required to check updates securely.'
          : 'Choose how you want to interact with your report. A password is required to track updates securely.'}
      </p>
      <TipFieldGroup isBountyMode={isBountyMode} label="Reward eligibility">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onInputChange('reporterType', 'anonymous')}
            className={cn(
              'p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors text-center',
              formData.reporterType === 'anonymous'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
            )}
          >
            <Shield className="h-7 w-7 text-primary" aria-hidden />
            <span className="text-sm font-semibold">I DON&apos;T want to be eligible for reward</span>
          </button>
          <button
            type="button"
            onClick={() => onInputChange('reporterType', 'reward')}
            className={cn(
              'p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors text-center',
              formData.reporterType === 'reward'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
            )}
          >
            <Gift className="h-7 w-7 text-primary" aria-hidden />
            <span className="text-sm font-semibold">I want to be eligible for reward</span>
          </button>
        </div>
      </TipFieldGroup>

      <AnimatePresence>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="space-y-4 overflow-hidden"
        >
          <TipFieldGroup
            isBountyMode={isBountyMode}
            label="Create password"
            htmlFor="anonymousPassword"
          >
            <div className="relative">
              <Input
                id="anonymousPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                aria-label="Create password"
                autoComplete="new-password"
                value={formData.anonymousPassword}
                onChange={(e) => onInputChange('anonymousPassword', e.target.value)}
                className={cn(inputFieldClasses, inputWithTrailingIconClasses)}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError message={fieldErrors.anonymousPassword} />
          </TipFieldGroup>
          <TipFieldGroup
            isBountyMode={isBountyMode}
            label="Confirm password"
            htmlFor="confirmPassword"
          >
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter password"
                aria-label="Confirm password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => onInputChange('confirmPassword', e.target.value)}
                className={cn(inputFieldClasses, inputWithTrailingIconClasses)}
              />
              <button
                type="button"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError message={fieldErrors.confirmPassword} />
          </TipFieldGroup>
          <p className="text-xs text-muted-foreground">
            Save this password securely — it cannot be recovered and is required to track your{' '}
            {isBountyMode ? 'tip' : 'report'}.
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
