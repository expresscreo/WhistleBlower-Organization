'use client';

import { PUBLISHED_ARTICLE_PROSE_CLASS } from '@/lib/articleContentStyles';
import { cn } from '@/lib/utils';

export default function PlainTextArticleContent({ text = '', className = '' }) {
  const lines = String(text || '').split('\n');

  if (!text?.trim()) return null;

  return (
    <div className={cn(PUBLISHED_ARTICLE_PROSE_CLASS, className)}>
      {lines.map((line, index) => {
        if (!line.trim()) {
          return <div key={`spacer-${index}`} className="h-2" />;
        }
        return (
          <p key={`line-${index}`} className="whitespace-pre-wrap">
            {line}
          </p>
        );
      })}
    </div>
  );
}
