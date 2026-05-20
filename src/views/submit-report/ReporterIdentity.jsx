import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Shield, Gift, Eye, EyeOff } from 'lucide-react';

const FormLabel = ({ id, children, required = false }) => (
    <Label htmlFor={id} className="flex items-center">
        {children}
        {required && <span className="text-primary ml-1">*</span>}
    </Label>
);

const ReporterIdentity = ({ formData, onInputChange }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div className="space-y-4">
            <Label>Anonymity & Access</Label>
            <p className="text-sm text-muted-foreground">Our platform is 100% anonymous. Choose your preference below. Both options require a password to track your report.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button type="button" onClick={() => onInputChange('reporterType', 'anonymous')} className={cn('p-6 text-center border-2 flex flex-col items-center justify-center gap-2 transition-colors', formData.reporterType === 'anonymous' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent')}>
                    <Shield className="h-8 w-8" />
                    <span className="font-semibold">I DON'T want a Reward</span>
                </button>
                <button type="button" onClick={() => onInputChange('reporterType', 'eligible')} className={cn('p-6 text-center border-2 flex flex-col items-center justify-center gap-2 transition-colors', formData.reporterType === 'eligible' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent')}>
                    <Gift className="h-8 w-8" />
                    <span className="font-semibold">I want a Reward</span>
                </button>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Your password allows you to securely follow up on your report and chat with Admins. <strong>Keep it safe</strong>—without it, you cannot access your report updates or claim rewards.</p>
                <div className="space-y-2 relative">
                    <FormLabel id="password" required>Create Password (min 8 characters)</FormLabel>
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => onInputChange('password', e.target.value)} minLength="8" required autoComplete="new-password" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-7 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                </div>
                <div className="space-y-2 relative">
                    <FormLabel id="confirmPassword" required>Confirm Password</FormLabel>
                    <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => onInputChange('confirmPassword', e.target.value)} minLength="8" required autoComplete="new-password" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-7 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                </div>
            </div>
        </div>
    );
};

export default ReporterIdentity;