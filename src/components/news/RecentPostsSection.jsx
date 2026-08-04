'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import CompactNewsListItem from '@/components/news/CompactNewsListItem';

/**
 * Compact list of other recently published news/bounty/most-wanted posts,
 * shown at the bottom of a post's detail page.
 */
export default function RecentPostsSection({ posts = [], className = '' }) {
    if (!posts.length) return null;

    return (
        <section className={className}>
            <div className="mb-4 flex items-center justify-between gap-4 border-t pt-6">
                <h2 className="text-xl font-bold text-foreground">Recent Posts</h2>
                <Link
                    href="/news"
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                    View all
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
            <div className="flex flex-col gap-4">
                {posts.map((item) => (
                    <CompactNewsListItem key={item.id} item={item} />
                ))}
            </div>
        </section>
    );
}
