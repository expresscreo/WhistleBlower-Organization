'use client';

import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/form-feedback';
import { formatNumberWithCommas } from '@/lib/utils';
import { TipFieldGroup } from '@/components/submit-report/TipFieldLabel';

export default function BountyRewardStep({ formData, handleInputChange, fieldError = '' }) {
  const handleAmountChange = (e) => {
    handleInputChange('bountyAmount', formatNumberWithCommas(e.target.value));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-orange-500 border border-orange-600 p-6 text-center space-y-3">
        <TipFieldGroup isBountyMode label="Set the bounty amount" htmlFor="bounty-amount" labelClassName="text-white">
          <Input
            id="bounty-amount"
            type="text"
            inputMode="numeric"
            placeholder="e.g., 50,000"
            aria-label="Bounty amount"
            value={formData.bountyAmount || ''}
            onChange={handleAmountChange}
            className="mx-auto max-w-sm text-center text-lg font-bold h-12 bg-white text-black placeholder-orange-700/60 border-[#00000026] focus:border-[#00000026] outline-none focus:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none focus:shadow-none"
          />
        </TipFieldGroup>
        <p className="text-xs text-white/80">(Refundable if not approved)</p>
      </div>
      <FieldError message={fieldError} />
    </div>
  );
}
