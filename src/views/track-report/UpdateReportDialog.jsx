import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, X } from 'lucide-react';

const UpdateReportDialog = ({ isOpen, onOpenChange, onUpdate, updateMessage, setUpdateMessage, newEvidenceFiles, setNewEvidenceFiles, isUpdating, uploadProgress }) => {
    
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const oversizedFiles = newFiles.filter(file => file.size > 25 * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                // This should be a toast notification in a real app
                console.error('File(s) too large');
                return;
            }
            setNewEvidenceFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index) => {
        setNewEvidenceFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Update Report</DialogTitle>
                    <DialogDescription>Add more information or attach more files to your report.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Textarea placeholder="Provide additional details..." value={updateMessage} onChange={(e) => setUpdateMessage(e.target.value)} />
                    
                    <div className="space-y-4">
                        <Label>Add more evidence</Label>
                        <div className="border-2 border-dashed p-8 text-center flex flex-col items-center">
                            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">Upload one or more files (Max 25MB each)</p>
                            <Label htmlFor="new-evidence-upload" className="cursor-pointer inline-flex items-center justify-center h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">
                                Choose Files
                            </Label>
                            <Input id="new-evidence-upload" type="file" onChange={handleFileChange} className="hidden" multiple />
                        </div>
                        {newEvidenceFiles.length > 0 && (
                            <div className="space-y-2 mt-2">
                                {newEvidenceFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm bg-muted p-2">
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-center">
                                                <span className="truncate pr-2">{file.name}</span>
                                                {isUpdating && uploadProgress[index] > 0 && <span className="text-xs">{Math.round(uploadProgress[index])}%</span>}
                                            </div>
                                            {isUpdating && uploadProgress[index] > 0 && <Progress value={uploadProgress[index]} className="h-2 mt-1" />}
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)} disabled={isUpdating}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onUpdate} disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Submit Update
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateReportDialog;