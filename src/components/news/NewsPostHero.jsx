'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { AlertTriangle, ArrowLeft, Calendar, Megaphone, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_HERO_CONFIG = {
  most_wanted: {
    label: 'Most Wanted',
    backLabel: 'Back to Most Wanted',
    backHref: '/most-wanted',
    heroClass: 'bg-red-600',
    icon: AlertTriangle,
  },
  bounty: {
    label: 'Active Bounty',
    backLabel: 'Back to Bounties',
    backHref: '/news/bounty',
    heroClass: 'bg-primary',
    icon: Target,
  },
  news: {
    label: 'News',
    backLabel: 'Back to News',
    backHref: '/news/latest-news',
    heroClass: 'bg-[#0f0f0f]',
    icon: Megaphone,
  },
};

const DEFAULT_CONFIG = {
  label: 'Article',
  backLabel: 'Back to All News',
  backHref: '/news',
  heroClass: 'bg-[#0f0f0f]',
  icon: Megaphone,
};

function getCategoryConfig(category) {
  return CATEGORY_HERO_CONFIG[category] || DEFAULT_CONFIG;
}

function formatCategoryLabel(category) {
  if (!category) return DEFAULT_CONFIG.label;
  return category.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function NewsPostHero({ post }) {
  const config = getCategoryConfig(post.category);
  const CategoryIcon = config.icon;
  const categoryLabel =
    CATEGORY_HERO_CONFIG[post.category]?.label ?? formatCategoryLabel(post.category);

  return (
    <section
      className={cn('relative', config.heroClass)}
      aria-labelledby="news-post-title"
    >
      <div className="container relative mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="flex items-center justify-between gap-4 border-b border-white/20 pb-5">
          <Link
            href={config.backHref}
            className="group inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-white/85 transition-colors hover:text-white"
          >
            <ArrowLeft
              className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="truncate sm:hidden">Back</span>
            <span className="hidden truncate sm:inline">{config.backLabel}</span>
          </Link>

          <div className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
            <CategoryIcon className="h-4 w-4" aria-hidden="true" />
            <span>{categoryLabel}</span>
          </div>
        </div>

        <div className="py-8 md:py-10 lg:py-12">
          <h1
            id="news-post-title"
            className="text-balance text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]"
          >
            {post.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/20 pt-4 text-sm text-white/75">
          <time
            className="inline-flex items-center gap-2"
            dateTime={post.created_at}
          >
            <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Published {format(new Date(post.created_at), 'PPP')}</span>
          </time>
          <span aria-hidden="true">•</span>
          <span>Publisher: WhistleBlower.ng</span>
        </div>
      </div>
    </section>
  );
}
