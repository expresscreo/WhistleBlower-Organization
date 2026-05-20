'use client';

import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { MAX_EVIDENCE_FILE_BYTES, formatFileSize } from './reportFormUtils';
import { sanitizeFilename } from '@/lib/utils';

export default function EvidenceUpload({
  files,
  onFilesChange,
  hasOrganization,
  disabled = false,
}) {
  const { toast } = useToast();
  const inputRef = useRef(null);

  const handlePick = () => {
    if (!hasOrganization) {
      toast({
        title: 'Organization required',
        description: 'Please select an organization before uploading evidence.',
        variant: 'destructive',
      });
      return;
    }
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    const valid = [];
    for (const file of picked) {
      if (file.size > MAX_EVIDENCE_FILE_BYTES) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the 200MB limit.`,
          variant: 'destructive',
        });
        continue;
      }
      valid.push(file);
    }
    if (valid.length) onFilesChange([...files, ...valid]);
  };

  const removeFile = (index) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div role="group" aria-label="Evidence upload" className="space-y-4">
      <button
        type="button"
        onClick={handlePick}
        disabled={disabled}
        className="w-full border-2 border-dashed rounded-lg p-8 md:p-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/30 disabled:opacity-50"
      >
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" aria-hidden />
        <p className="font-medium mb-1">Drag files here or tap to browse</p>
        <p className="text-sm text-muted-foreground">Images, PDFs, documents — max 200MB each</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleChange}
        aria-hidden
      />
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="truncate">{sanitizeFilename(file.name)}</span>
              <span className="text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label={`Remove ${file.name}`}
                onClick={() => removeFile(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
