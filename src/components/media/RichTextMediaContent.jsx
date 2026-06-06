'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  enrichHtmlMediaContent,
  needsMediaEnrichment,
  stripEditorInlineImageControls,
  stripEditorSocialEmbedControls,
  stripHtmlThumbnailHover,
  stripPublishedInlineTextStyles,
  wrapHtmlThumbnails,
} from '@/lib/mediaUtils';
import { hydrateSocialEmbeds } from '@/lib/socialEmbeds';
import { cn } from '@/lib/utils';

const RichTextMediaContent = ({ html, evidence = [], className = '', thumbnailHover = true }) => {
  const [content, setContent] = useState(null);
  const [ready, setReady] = useState(false);
  const containerRef = useRef(null);
  const evidenceKey = JSON.stringify(evidence);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!html) {
        if (!cancelled) {
          setContent('');
          setReady(true);
        }
        return;
      }

      const parsedEvidence = evidenceKey ? JSON.parse(evidenceKey) : [];
      let output = html;

      if (needsMediaEnrichment(html)) {
        if (!cancelled) setReady(false);
        output = await enrichHtmlMediaContent(html, parsedEvidence);
      }

      if (thumbnailHover && /<img\b/i.test(output)) {
        output = wrapHtmlThumbnails(output);
      } else if (!thumbnailHover) {
        output = stripHtmlThumbnailHover(output);
        output = stripEditorInlineImageControls(output);
        output = stripEditorSocialEmbedControls(output);
        output = stripPublishedInlineTextStyles(output);
      }

      if (!cancelled) {
        setContent(output || html);
        setReady(true);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [html, evidenceKey, thumbnailHover]);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    hydrateSocialEmbeds(containerRef.current);
  }, [ready, content]);

  if (!ready) {
    return <div className={`${className} min-h-[4rem] animate-pulse bg-muted/30 rounded-md`} aria-hidden />;
  }

  if (!content) return null;

  return (
    <div
      ref={containerRef}
      className={cn(className, !thumbnailHover && 'rich-text-no-thumbnail-hover', 'rich-text-social-embeds')}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default RichTextMediaContent;
