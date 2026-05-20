import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const AuthenticationDialog = ({ open, onOpenChange, onVerify, authInput, setAuthInput, loading }) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onVerify();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Verification Required</DialogTitle>
                    <DialogDescription>Please enter your password to access the report.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 relative">
                    <Label htmlFor="authInput">Password</Label>
                    <Input 
                        id="authInput" 
                        type={!showPassword ? "password" : "text"} 
                        value={authInput} 
                        onChange={e => setAuthInput(e.target.value)} 
                        onKeyDown={handleKeyDown} 
                        disabled={loading}
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-7 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                <DialogFooter>
                    <Button onClick={onVerify} className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Verify
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AuthenticationDialog;