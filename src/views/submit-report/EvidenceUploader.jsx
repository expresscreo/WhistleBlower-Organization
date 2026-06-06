import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FieldError } from '@/components/ui/form-feedback';
import { sanitizeFilename } from '@/lib/utils';

const EvidenceUploader = ({ evidenceFiles, setEvidenceFiles, uploadProgress, isSubmitting }) => {
    const [uploadError, setUploadError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const oversizedFiles = newFiles.filter(file => file.size > 25 * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                setUploadError('Please ensure all files are smaller than 25MB.');
                return;
            }
            setUploadError('');
            setEvidenceFiles(prev => [...prev, ...newFiles]);
        }
    };
    
    const removeFile = (index) => {
        setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <Label>Evidence Upload</Label>
            <div className="border-2 border-dashed p-8 text-center flex flex-col items-center">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Upload one or more files (image, PDF, etc. Max 25MB each)</p>
                <Label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    Choose Files
                </Label>
                <Input id="file-upload" type="file" onChange={handleFileChange} className="hidden" multiple />
            </div>
            <FieldError message={uploadError} className="mt-2" />
            {evidenceFiles.length > 0 && (
                <div className="space-y-2 mt-2">
                    {evidenceFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-muted p-2">
                            <div className="flex-grow">
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
    );
};

export default EvidenceUploader;
