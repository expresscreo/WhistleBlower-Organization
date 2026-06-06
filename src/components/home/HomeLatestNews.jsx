'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Newspaper } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { resolveOgImageUrl } from '@/lib/ogImageUrl';
import { Button } from '@/components/ui/button';
import CompactNewsListItem from '@/components/news/CompactNewsListItem';
import FeaturedNewsListItem from '@/components/news/FeaturedNewsListItem';

function FeaturedNewsCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="h-full lg:col-span-7"
    >
      <FeaturedNewsListItem item={item} />
    </motion.div>
  );
}

function CompactNewsCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 + index * 0.08 }}
    >
      <CompactNewsListItem item={item} />
    </motion.div>
  );
}

function NewsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch lg:gap-6">
      <div className="min-h-[280px] animate-pulse bg-muted sm:min-h-[320px] lg:col-span-7 lg:min-h-0 lg:h-full" />
      <div className="flex flex-col gap-5 lg:col-span-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function HomeLatestNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLatestNews = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setNews(
        (data ?? []).map((item) => ({
          ...item,
          featured_image_url: resolveOgImageUrl(item.featured_image),
        }))
      );
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestNews();
  }, [fetchLatestNews]);

  const [featured, ...rest] = news;

  return (
    <section className="relative isolate z-[60] overflow-hidden bg-background py-20 sm:py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-6 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              In the news
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              <span className="text-muted-foreground">Latest </span>
              <span className="text-foreground">Updates</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              Stay informed with recent stories, security alerts, and platform news—or browse active bounties if you&apos;re a bounty hunter looking for your next lead.
            </p>
          </div>
          <Link href="/news" className="shrink-0">
            <Button
              variant="outline"
              className="group w-full border-foreground/10 bg-background/80 uppercase tracking-[0.12em] sm:w-auto"
            >
              View all news
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <NewsSkeleton />
        ) : news.length === 0 ? (
          <div className="border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
            <Newspaper className="mx-auto mb-4 h-10 w-10 text-muted-foreground/60" />
            <p className="text-lg font-medium text-foreground">No published stories yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon for the latest updates from WhistleBlower.ng.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch lg:gap-6">
            <FeaturedNewsCard item={featured} index={0} />
            {rest.length > 0 ? (
              <div className="flex flex-col gap-5 lg:col-span-5">
                {rest.map((item, index) => (
                  <CompactNewsCard key={item.id} item={item} index={index} />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
