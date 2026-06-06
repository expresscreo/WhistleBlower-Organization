'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldError } from '@/components/ui/form-feedback';
import { parseSocialEmbedUrl, resolveSocialEmbedUrl } from '@/lib/socialEmbeds';

const PLATFORM_LABELS = {
  twitter: 'X (Twitter) post',
  facebook: 'Facebook',
  tiktok: 'TikTok video',
  youtube: 'YouTube video',
};

export default function SocialEmbedInsertDialog({ open, onOpenChange, onInsert }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [resolving, setResolving] = useState(false);

  const handleClose = (nextOpen) => {
    if (!nextOpen) {
      setUrl('');
      setError('');
    }
    onOpenChange(nextOpen);
  };

  const handleInsert = async () => {
    const parsed = parseSocialEmbedUrl(url);
    if (!parsed) {
      setError('Enter a valid public URL from YouTube, X (Twitter), Facebook, or TikTok.');
      return;
    }

    setResolving(true);
    setError('');

    try {
      const resolved = (await resolveSocialEmbedUrl(parsed)) || parsed;
      await onInsert(resolved);
      setUrl('');
      setError('');
      onOpenChange(false);
    } catch (insertError) {
      console.error('Social embed insert failed:', insertError);
      setError('Could not embed this link. Confirm the Facebook video is public and allows embedding.');
    } finally {
      setResolving(false);
    }
  };

  const preview = parseSocialEmbedUrl(url);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Embed video or social post</DialogTitle>
          <DialogDescription>
            Paste a public video or post link from YouTube, X, Facebook, or TikTok. It will appear
            inline in your article content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="social-embed-url">Video or post URL</Label>
          <Input
            id="social-embed-url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            placeholder="https://youtube.com/watch?v=… or https://x.com/user/status/123…"
            autoComplete="off"
          />
          {preview && (
            <p className="text-xs text-muted-foreground">
              Detected:{' '}
              {preview.platform === 'facebook' && preview.isVideo
                ? 'Facebook video'
                : preview.platform === 'facebook'
                  ? 'Facebook post'
                  : PLATFORM_LABELS[preview.platform] || preview.platform}{' '}
              embed
            </p>
          )}
          <FieldError message={error} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleInsert} loading={resolving}>
            Insert embed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
