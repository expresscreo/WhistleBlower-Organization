import Link from 'next/link';
import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, FileType2, List, MapPin, Calendar, Eye, EyeOff, Upload, X } from 'lucide-react';
import { formatDateForInput } from '@/components/submit-report/reportFormUtils';
import { FieldError } from '@/components/ui/form-feedback';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import nigerianStatesAndLgas from '@/data/nigerianStatesAndLgas.json';
import { Progress } from '@/components/ui/progress';
import { sanitizeFilename, formatNumberWithCommas } from '@/lib/utils';
import MaximizableThumbnailOverlay, { maximizableThumbnailGroupClass } from '@/components/media/MaximizableThumbnailOverlay';

 

const crimeTypes = [
    "Theft", "Murderer", "Fraud", "Assault", "Scam", "Sex Predator", "Armed Robbery", "Kidnapping", "Vandalism", "Missing Person", "Cybercrime", "Other"
];

const BountyForm = ({ onSubmit, isSubmitting, uploadProgress }) => {
    const [formError, setFormError] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        typeOfCrime: '',
        state: '',
        fullAddress: '',
        lga: '',
        dateOfIncident: null,
        bountyAmount: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
        evidenceFiles: [],
    });
    const [lgas, setLgas] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [filePreviewUrls, setFilePreviewUrls] = useState({});

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleBountyAmountChange = (e) => {
        const formattedValue = formatNumberWithCommas(e.target.value);
        handleInputChange('bountyAmount', formattedValue);
    };

    const handleStateChange = (value) => {
        handleInputChange('state', value);
        const selectedState = nigerianStatesAndLgas.find(s => s.state === value);
        setLgas(selectedState ? selectedState.lgas : []);
        handleInputChange('lga', '');
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const oversizedFiles = newFiles.filter(file => file.size > 25 * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                setUploadError('Please ensure all files are smaller than 25MB.');
                return;
            }
            setUploadError('');
            handleInputChange('evidenceFiles', [...formData.evidenceFiles, ...newFiles]);
        }
    };
    
    const removeFile = (index) => {
        handleInputChange('evidenceFiles', formData.evidenceFiles.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const nextPreviewUrls = {};

        formData.evidenceFiles.forEach((file, index) => {
            if (file.type?.startsWith('image/')) {
                nextPreviewUrls[index] = URL.createObjectURL(file);
            }
        });

        setFilePreviewUrls(nextPreviewUrls);

        return () => {
            Object.values(nextPreviewUrls).forEach((url) => URL.revokeObjectURL(url));
        };
    }, [formData.evidenceFiles]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError('');
        if (!formData.agreeTerms) {
            setFormError('You must agree to the terms and conditions.');
            return;
        }
        if (!formData.dateOfIncident) {
            setFormError('Please provide the date of incident.');
            return;
        }
        if (formData.evidenceFiles.length === 0) {
            setFormError('Please attach at least one supporting file for your bounty.');
            return;
        }
        if (formData.password.length < 8 || formData.password !== formData.confirmPassword) {
            setFormError('Passwords must be at least 8 characters long and must match.');
            return;
        }
        const submissionData = {
            ...formData,
            bountyAmount: formData.bountyAmount.replace(/,/g, '')
        };
        onSubmit(submissionData);
    };

    return (
        <motion.form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 border">
            <div className="space-y-2">
                <Label htmlFor="bounty-title" className="flex items-center"><Award className="mr-2 h-4 w-4" />Bounty Title</Label>
                <Input id="bounty-title" placeholder="e.g., Information leading to recovery of stolen vehicle" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="bounty-description" className="flex items-center"><FileType2 className="mr-2 h-4 w-4" />Suspect Description</Label>
                <Textarea id="bounty-description" placeholder="Provide a physical description, behavior, identifying details, etc." value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={6} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="bounty-crime-type" className="flex items-center"><List className="mr-2 h-4 w-4" />Type of Crime</Label>
                <Select value={formData.typeOfCrime} onValueChange={(v) => handleInputChange('typeOfCrime', v)} required>
                    <SelectTrigger><SelectValue placeholder="Select type of crime" /></SelectTrigger>
                    <SelectContent>{crimeTypes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="bounty-state" className="flex items-center"><MapPin className="mr-2 h-4 w-4" />State of Incident</Label>
                    <Select value={formData.state} onValueChange={handleStateChange} required>
                        <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                        <SelectContent>{nigerianStatesAndLgas.map(s => <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bounty-lga" className="flex items-center"><MapPin className="mr-2 h-4 w-4" />Local Government Area</Label>
                    <Select value={formData.lga} onValueChange={(v) => handleInputChange('lga', v)} disabled={!formData.state} required>
                        <SelectTrigger><SelectValue placeholder="Select LGA" /></SelectTrigger>
                        <SelectContent>{lgas.map(lga => <SelectItem key={lga} value={lga}>{lga}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bounty-address" className="flex items-center"><MapPin className="mr-2 h-4 w-4" />Full Address (Optional)</Label>
                    <Input id="bounty-address" placeholder="e.g., 123 Akure Road, Ikeja, Lagos" value={formData.fullAddress} onChange={(e) => handleInputChange('fullAddress', e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bounty-incident-date" className="flex items-center"><Calendar className="mr-2 h-4 w-4" />Date of Incident</Label>
                    <Input
                        id="bounty-incident-date"
                        type="date"
                        max={formatDateForInput(new Date())}
                        value={formatDateForInput(formData.dateOfIncident)}
                        onChange={(e) =>
                            handleInputChange(
                                'dateOfIncident',
                                e.target.value ? new Date(`${e.target.value}T12:00:00`) : null
                            )
                        }
                        required
                    />
                </div>
            </div>
            <div className="space-y-4">
                <Label>Attach Supporting Files</Label>
                <div className="border-2 border-dashed p-8 text-center flex flex-col items-center">
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Upload images, videos, or documents (Max 25MB each). At least one file is required.</p>
                    <Label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        Choose Files
                    </Label>
                    <Input id="file-upload" type="file" onChange={handleFileChange} className="hidden" multiple />
                </div>
                {formData.evidenceFiles.length > 0 && (
                    <div className="space-y-2 mt-2">
                        {formData.evidenceFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-sm bg-muted p-2">
                                {filePreviewUrls[index] && (
                                    <div className={`${maximizableThumbnailGroupClass} mr-3 h-14 w-14 flex-shrink-0 rounded`}>
                                        <img
                                            src={filePreviewUrls[index]}
                                            alt={sanitizeFilename(file.name)}
                                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                        />
                                        <MaximizableThumbnailOverlay
                                            iconRingClassName="h-8 w-8"
                                            iconClassName="h-4 w-4"
                                            overlayClassName="rounded"
                                        />
                                    </div>
                                )}
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-center">
                                        <span className="truncate pr-2">{sanitizeFilename(file.name)}</span>
                                        {isSubmitting && uploadProgress[index] > 0 && <span className="text-xs">{Math.round(uploadProgress[index])}%</span>}
                                    </div>
                                    {isSubmitting && uploadProgress[index] > 0 && <Progress value={uploadProgress[index]} className="h-2 mt-1" />}
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)} disabled={isSubmitting}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="rounded-md bg-orange-500 border border-orange-600 p-6 text-center space-y-3">
                <div className="flex items-center justify-center text-white">
                    <Label htmlFor="bounty-amount" className="text-white font-semibold text-lg">SET THE BOUNTY AMOUNT</Label>
                </div>
                <Input id="bounty-amount" placeholder="e.g., 50,000" value={formData.bountyAmount} onChange={handleBountyAmountChange} required className="mx-auto max-w-sm text-center text-lg h-12 bg-white text-orange-900 placeholder-orange-700/60 border-[#00000026] focus:border-[#00000026] outline-none focus:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none focus:shadow-none" />
                <p className="text-xs text-white/80">(Refundable if not approved)</p>
            </div>
            <div className="space-y-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Create a password to securely track your bounty's status. <strong>Keep it safe</strong>—it cannot be recovered.</p>
                <div className="space-y-2 relative">
                    <Label htmlFor="bounty-password">Create Password (min 8 characters)</Label>
                    <Input id="bounty-password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} minLength="8" required autoComplete="new-password" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-7 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                </div>
                <div className="space-y-2 relative">
                    <Label htmlFor="bounty-confirm-password">Confirm Password</Label>
                    <Input id="bounty-confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} minLength="8" required autoComplete="new-password" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-7 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="bounty-terms" checked={formData.agreeTerms} onCheckedChange={(c) => handleInputChange('agreeTerms', c)} />
                <Label htmlFor="bounty-terms" className="text-sm">I have read and agree to the <Link href="/terms-of-service" className="underline">Terms and Conditions</Link>.</Label>
            </div>
            <FieldError message={uploadError} className="mt-2" />
            <FieldError message={formError} />
            <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={!formData.agreeTerms}>
                Submit Bounty
            </Button>
        </motion.form>
    );
};

export default BountyForm;