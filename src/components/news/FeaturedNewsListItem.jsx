'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, Calendar } from 'lucide-react';
import { getNewsCategoryLabel, getNewsPostUrl } from '@/components/news/CompactNewsListItem';

export default function FeaturedNewsListItem({ item }) {
  const postUrl = getNewsPostUrl(item);
  const publishedLabel = format(new Date(item.created_at), 'MMM d, yyyy');

  return (
    <article className="group relative h-full">
      <Link
        href={postUrl}
        className="relative flex h-full min-h-[280px] overflow-hidden border border-border/60 bg-card shadow-sm transition-shadow duration-500 hover:shadow-[0_24px_60px_-16px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_24px_60px_-16px_rgba(0,0,0,0.18)] sm:min-h-[320px]"
      >
        {item.featured_image_url ? (
          <img
            src={item.featured_image_url}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#171717] via-[#2a2a2a] to-[#4285F4]/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <div className="relative mt-auto flex w-full flex-col p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
              {getNewsCategoryLabel(item.category)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/75">
              <Calendar className="h-3.5 w-3.5" />
              {publishedLabel}
            </span>
          </div>
          <h3 className="max-w-2xl line-clamp-2 text-xl font-bold leading-snug text-white sm:text-2xl lg:text-3xl">
            {item.title}
          </h3>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            Read story
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </article>
  );
}
