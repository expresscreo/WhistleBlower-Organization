'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Newspaper } from 'lucide-react';
import { slugify } from '@/lib/utils';
import ResolvedStorageImage from '@/components/media/ResolvedStorageImage';

export function getNewsPostUrl(item) {
  if (item.category === 'bounty' && item.bounty_id) {
    return `/bounties/${slugify(item.title)}`;
  }
  const slug = item.slug || slugify(item.title);
  return `/news/post/${slug}`;
}

export function getNewsCategoryLabel(category) {
  if (category === 'most_wanted') return 'Most Wanted';
  if (category === 'bounty') return 'Bounty';
  return 'News';
}

export default function CompactNewsListItem({ item }) {
  const postUrl = getNewsPostUrl(item);
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  return (
    <article className="group">
      <Link
        href={postUrl}
        className="flex items-center gap-4 overflow-hidden border border-border/60 bg-card p-3 shadow-sm transition-shadow duration-300 hover:bg-muted/20 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.16)] sm:p-4"
      >
        <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-muted sm:h-28 sm:w-28">
          {item.featured_image ? (
            <ResolvedStorageImage
              path={item.featured_image}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : item.featured_image_url ? (
            <img
              src={item.featured_image_url}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/40">
              <Newspaper className="h-7 w-7 text-muted-foreground/70" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {getNewsCategoryLabel(item.category)} · {timeAgo}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
            {item.title}
          </h3>
        </div>
      </Link>
    </article>
  );
}
