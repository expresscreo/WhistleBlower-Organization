'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Download, ImageIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabaseStorageService } from '@/lib/supabaseStorageService';

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageConverterPage() {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [storageMode, setStorageMode] = useState('');

  useEffect(() => {
    supabaseStorageService.getStorageMode().then(setStorageMode);
  }, []);

  const resetPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setConvertedUrl(null);
    setResult(null);
    setError('');
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    resetPreview();
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setError('');
    setIsConverting(true);
    setConvertedUrl(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', 'upload');
      formData.append('folder', 'General');

      const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Conversion failed');
      }

      setConvertedUrl(data.url);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopy = async () => {
    if (!convertedUrl) return;
    try {
      await navigator.clipboard.writeText(convertedUrl);
    } catch {
      setError('Could not copy URL to clipboard');
    }
  };

  return (
    <div className="container max-w-3xl py-10 md:py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Image Converter</h1>
        <p className="text-muted-foreground">
          Convert images to AVIF and upload to Supabase Storage. Storage mode:{' '}
          <span className="font-medium text-foreground">{storageMode || '…'}</span>
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-6">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed rounded-lg p-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
        >
          <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" aria-hidden />
          <p className="font-medium mb-1">Select an image to convert</p>
          <p className="text-sm text-muted-foreground">PNG, JPG, WEBP — max 10MB</p>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {selectedFile && (
          <div className="rounded-md bg-muted/50 p-4 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">File:</span> {selectedFile.name}
            </p>
            <p>
              <span className="text-muted-foreground">Type:</span> {selectedFile.type}
            </p>
            <p>
              <span className="text-muted-foreground">Size:</span> {formatBytes(selectedFile.size)}
            </p>
          </div>
        )}

        {previewUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Original preview</p>
            <img
              src={previewUrl}
              alt="Original preview"
              className="max-h-64 rounded-md border object-contain"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleConvert} loading={isConverting} disabled={!selectedFile}>
            Convert to AVIF
          </Button>
          {(selectedFile || convertedUrl) && (
            <Button type="button" variant="outline" onClick={resetPreview}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Convert another
            </Button>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <div className="space-y-4 pt-2 border-t">
            <div className="rounded-md bg-green-500/10 border border-green-500/20 p-4 text-sm">
              <p className="font-medium text-green-700 dark:text-green-400">
                Saved {result.savings}% — {formatBytes(result.originalSize)} →{' '}
                {formatBytes(result.compressedSize)}
              </p>
            </div>

            {convertedUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Converted AVIF preview</p>
                <img
                  src={convertedUrl}
                  alt="Converted AVIF preview"
                  className="max-h-64 rounded-md border object-contain"
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Public URL</p>
              <div className="flex gap-2">
                <Input readOnly value={convertedUrl || ''} />
                <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copy URL">
                  <Copy className="h-4 w-4" />
                </Button>
                {convertedUrl && (
                  <Button type="button" variant="outline" size="icon" asChild>
                    <a href={convertedUrl} download target="_blank" rel="noopener noreferrer" aria-label="Download AVIF">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
