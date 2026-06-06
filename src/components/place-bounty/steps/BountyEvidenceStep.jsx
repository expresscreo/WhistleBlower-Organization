'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FieldError } from '@/components/ui/form-feedback';
import { sanitizeFilename } from '@/lib/utils';
import MaximizableThumbnailOverlay, {
  maximizableThumbnailGroupClass,
} from '@/components/media/MaximizableThumbnailOverlay';
import { TipFieldGroup } from '@/components/submit-report/TipFieldLabel';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export default function BountyEvidenceStep({
  files,
  onFilesChange,
  disabled = false,
  uploadProgress = {},
  fieldError = '',
}) {
  const [uploadError, setUploadError] = useState('');
  const [filePreviewUrls, setFilePreviewUrls] = useState({});
  const inputRef = useRef(null);

  const handlePick = () => {
    setUploadError('');
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    const oversized = picked.filter((file) => file.size > MAX_FILE_BYTES);
    if (oversized.length) {
      setUploadError('Please ensure all files are smaller than 25MB.');
      return;
    }
    setUploadError('');
    onFilesChange([...files, ...picked]);
  };

  const removeFile = (index) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const nextPreviewUrls = {};
    files.forEach((file, index) => {
      if (file.type?.startsWith('image/')) {
        nextPreviewUrls[index] = URL.createObjectURL(file);
      }
    });
    setFilePreviewUrls(nextPreviewUrls);
    return () => {
      Object.values(nextPreviewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  return (
    <TipFieldGroup isBountyMode label="Supporting files" className="space-y-4">
      <button
        type="button"
        id="bounty-file-upload"
        onClick={handlePick}
        disabled={disabled}
        className="w-full border-2 border-dashed rounded-lg p-8 md:p-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/30 disabled:opacity-50"
      >
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" aria-hidden />
        <p className="font-medium mb-1">Drag files here or tap to browse</p>
        <p className="text-sm text-muted-foreground">
          Images, videos, or documents — max 25MB each. At least one file is required.
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleChange}
        aria-hidden
      />
      <FieldError message={uploadError || fieldError} className="mt-2" />
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
            >
              {filePreviewUrls[index] && (
                <div className={`${maximizableThumbnailGroupClass} mr-1 h-14 w-14 flex-shrink-0 rounded`}>
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
                <div className="flex justify-between items-center gap-2">
                  <span className="truncate">{sanitizeFilename(file.name)}</span>
                  {disabled && uploadProgress[index] > 0 && (
                    <span className="text-xs shrink-0">{Math.round(uploadProgress[index])}%</span>
                  )}
                </div>
                {disabled && uploadProgress[index] > 0 && (
                  <Progress value={uploadProgress[index]} className="h-2 mt-1" />
                )}
              </div>
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
    </TipFieldGroup>
  );
}
