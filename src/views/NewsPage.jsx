'use client';

import { usePathname, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { PageErrorBanner } from '@/components/ui/form-feedback';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Calendar, Bookmark, Newspaper, Target, Hand, Megaphone, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import nigerianStatesAndLgas from '@/data/nigerianStatesAndLgas.json';
import { resolveOgImageUrl } from '@/lib/ogImageUrl';
import { cn, slugify, htmlToPlainText } from '@/lib/utils';
import { getMostWantedCardExcerpt } from '@/lib/mostWantedUtils';
import {
    fetchBountyLocationLookup,
    filterNewsByLocation,
} from '@/lib/newsLocationFilter';
import MaximizableImage from '@/components/media/MaximizableImage';
import ResolvedStorageImage from '@/components/media/ResolvedStorageImage';
import CompactNewsListItem from '@/components/news/CompactNewsListItem';
import FeaturedNewsListItem from '@/components/news/FeaturedNewsListItem';
import {
    getNewsCategoryFromPathname,
    getNewsCategoryPath,
    getNewsCategoryFromRouteSegment,
} from '@/lib/newsCategoryPaths';

const NewsCard = ({ item }) => {
    const bountyPostUrl = item.bounty_id ? `/bounties/${slugify(item.title)}` : null;
    const slug = item.slug || slugify(item.title);
    const newsPostUrl = `/news/post/${slug}`;
    const cardExcerpt =
        item.category === 'most_wanted'
            ? getMostWantedCardExcerpt(item)
            : htmlToPlainText(item.content);

    return (
        <Card className="flex flex-col h-full overflow-hidden">
            {item.featured_image ? (
                <div className="aspect-video w-full bg-muted overflow-hidden">
                    <ResolvedStorageImage
                        path={item.featured_image}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
            ) : item.featured_image_url ? (
                <MaximizableImage
                    src={item.featured_image_url}
                    alt={item.title}
                    wrapperClassName="aspect-video w-full bg-muted"
                    imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            ) : null}
            <CardHeader>
                {item.category === 'bounty' && item.bounty_id ? (
                    <Link href={`/bounties/${slugify(item.title)}`}>
                        <CardTitle className="text-xl font-bold hover:text-primary transition-colors cursor-pointer">{item.title}</CardTitle>
                    </Link>
                ) : (
                    <Link href={`/news/post/${slug}` }>
                        <CardTitle className="text-xl font-bold hover:text-primary transition-colors cursor-pointer">{item.title}</CardTitle>
                    </Link>
                )}
                <CardDescription className="flex items-center gap-4 pt-2 text-xs">
                    <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {format(new Date(item.created_at), 'PPP')}</span>
                    <span className="flex items-center capitalize"><Bookmark className="mr-1 h-3 w-3" /> {item.category.replace('_', ' ')}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground text-sm line-clamp-2">
                    {cardExcerpt}
                </p>
            </CardContent>
            <CardFooter>
                {item.category === 'bounty' && bountyPostUrl ? (
                    <Link href={bountyPostUrl} className="w-full">
                        <Button className="w-full uppercase">
                            <Target className="mr-2 h-4 w-4" /> View Bounty
                        </Button>
                    </Link>
                ) : item.category === 'most_wanted' ? (
                    <Link href={newsPostUrl} className="w-full">
                        <Button className="w-full uppercase bg-red-600 hover:bg-red-700 text-white">
                            <AlertTriangle className="mr-2 h-4 w-4" /> View Alert
                        </Button>
                    </Link>
                ) : (
                    <Link href={newsPostUrl} className="w-full">
                        <Button variant="outline" className="w-full uppercase">
                            Read More
                        </Button>
                    </Link>
                )}
            </CardFooter>
        </Card>
    );
};

const NEWS_PER_PAGE = 9;

const filterSelectClassName = cn(
    'flex h-10 w-full appearance-none border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50'
);

const categoryDetails = {
    all: {
        icon: Newspaper,
        title: 'News & Updates',
        description: 'Stay updated with the latest news, published bounties, and most wanted alerts from across the nation. Your awareness is a step towards a safer Nigeria.'
    },
    news: {
        icon: Megaphone,
        title: 'Latest News',
        description: 'Catch up on the latest developments, security updates, and stories of impact. Information is power in our collective effort to build a safer community.'
    },
    bounty: {
        icon: Target,
        title: 'Active Bounties',
        description: 'Explore active bounties placed by individuals and organizations. Your information could be the key to resolving a case and earning a reward.'
    },
    most_wanted: {
        icon: Hand,
        title: 'Most Wanted',
        description: 'View alerts for high-priority individuals wanted by law enforcement. Help bring fugitives to justice by providing anonymous and crucial tips.'
    }
};

const NewsPage = ({ initialNews = null, category: categoryProp = null }) => {
    const pathname = usePathname();
    const params = useParams();
    const router = useRouter();
    const fetchSeqRef = useRef(0);
    const [categoryOverride, setCategoryOverride] = useState(null);
    const [fetchError, setFetchError] = useState('');
    const [news, setNews] = useState(initialNews ?? []);
    const [bountyLookup, setBountyLookup] = useState({});
    const [loading, setLoading] = useState(initialNews == null);
    
    const [selectedState, setSelectedState] = useState('all');
    const [selectedLga, setSelectedLga] = useState('all');
    const [lgas, setLgas] = useState([]);
    const [visibleCount, setVisibleCount] = useState(NEWS_PER_PAGE);

    const routeCategory = getNewsCategoryFromRouteSegment(params?.category);
    const pathnameCategory = getNewsCategoryFromPathname(pathname);
    const category = categoryOverride ?? categoryProp ?? routeCategory ?? pathnameCategory;

    useEffect(() => {
        if (!categoryOverride) return;
        const resolved = categoryProp ?? routeCategory ?? pathnameCategory;
        if (resolved === categoryOverride) {
            setCategoryOverride(null);
        }
    }, [categoryOverride, categoryProp, routeCategory, pathnameCategory]);
    const currentCategory = categoryDetails[category] || categoryDetails.all;
    const categoryFilteredNews = useMemo(() => {
        if (!category || category === 'all') return news;
        return news.filter((item) => item.category === category);
    }, [news, category]);
    const filteredNews = useMemo(
        () => filterNewsByLocation(categoryFilteredNews, { state: selectedState, lga: selectedLga }, bountyLookup),
        [categoryFilteredNews, selectedState, selectedLga, bountyLookup]
    );
    const visibleNews = useMemo(() => filteredNews.slice(0, visibleCount), [filteredNews, visibleCount]);
    const hasMoreNews = visibleCount < filteredNews.length;
    const Icon = currentCategory.icon;

    const fetchNews = useCallback(async ({ background = false } = {}) => {
        const requestSeq = ++fetchSeqRef.current;

        if (!background) {
            setLoading(true);
        }
        setFetchError('');
        try {
            let query = supabase.from('news').select(`*`).eq('status', 'published');

            if (category && category !== 'all') {
                query = query.eq('category', category);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            if (requestSeq !== fetchSeqRef.current) return;

            const newsWithImageUrls = data.map(item => ({
                ...item,
                featured_image_url: resolveOgImageUrl(item.featured_image)
            }));

            const lookup = await fetchBountyLocationLookup(supabase, newsWithImageUrls);
            if (requestSeq !== fetchSeqRef.current) return;

            setBountyLookup(lookup);
            setNews(newsWithImageUrls);
        } catch (error) {
            if (requestSeq !== fetchSeqRef.current) return;
            setFetchError(error.message);
            setBountyLookup({});
            setNews([]);
        } finally {
            if (requestSeq === fetchSeqRef.current) {
                setLoading(false);
            }
        }
    }, [category]);

    useEffect(() => {
        if (initialNews != null) {
            setNews(initialNews);
            setLoading(false);
        }
    }, [initialNews, category]);

    useEffect(() => {
        fetchNews({ background: initialNews != null });
    }, [fetchNews, initialNews]);

    useEffect(() => {
        setVisibleCount(NEWS_PER_PAGE);
    }, [category, selectedState, selectedLga]);

    useEffect(() => {
        setSelectedState('all');
        setSelectedLga('all');
        setLgas([]);
    }, [category]);

    // Real-time subscription for news updates
    useEffect(() => {
        const channel = supabase
            .channel('news-updates')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'news',
                    filter: 'status=eq.published'
                }, 
                async (payload) => {
                    console.log('News update received:', payload);
                    // Refresh news when any published news item is updated
                    // Add a small delay to ensure database consistency
                    setTimeout(() => {
                        fetchNews({ background: true });
                    }, 100);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchNews]);

    const handleStateChange = (event) => {
        const value = event.target.value;
        setSelectedState(value);
        setSelectedLga('all');
        if (value && value !== 'all') {
            const stateData = nigerianStatesAndLgas.find((s) => s.state === value);
            setLgas(stateData ? stateData.lgas : []);
        } else {
            setLgas([]);
        }
    };

    const handleCategoryChange = (event) => {
        const newCategory = event.target.value;
        setVisibleCount(NEWS_PER_PAGE);
        const nextCategory = newCategory || 'all';
        const activeCategory = category || 'all';
        if (nextCategory === activeCategory) return;

        setCategoryOverride(nextCategory);
        setSelectedState('all');
        setSelectedLga('all');
        setLgas([]);

        // Defer navigation so React can finish this render before Next.js swaps the route tree.
        // Calling router.push in the same tick as head/state updates causes a removeChild crash.
        const nextPath = getNewsCategoryPath(nextCategory);
        queueMicrotask(() => {
            router.push(nextPath);
        });
    };

    const handleLgaChange = (event) => {
        setSelectedLga(event.target.value);
    };

    const handleLoadMore = () => {
        setVisibleCount((count) => Math.min(count + NEWS_PER_PAGE, filteredNews.length));
    };

    return (
        <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="text-center mb-12">
                    <Icon className="h-16 w-16 text-primary mx-auto mb-6" />
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">{currentCategory.title}</h1>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        {currentCategory.description}
                    </p>
                </div>

                <PageErrorBanner error={fetchError} title="Could not load news" className="mb-8" />

                <div className="mb-8 p-4 border bg-card rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="news-category-filter" className="text-sm font-medium mb-2 block">Category</label>
                            <div className="relative">
                                <select
                                    id="news-category-filter"
                                    value={category || 'all'}
                                    onChange={handleCategoryChange}
                                    className={filterSelectClassName}
                                    aria-label="Filter by category"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="news">News</option>
                                    <option value="bounty">Bounty</option>
                                    <option value="most_wanted">Most Wanted</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" aria-hidden />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="news-state-filter" className="text-sm font-medium mb-2 block">State</label>
                            <div className="relative">
                                <select
                                    id="news-state-filter"
                                    value={selectedState}
                                    onChange={handleStateChange}
                                    className={filterSelectClassName}
                                    aria-label="Filter by state"
                                >
                                    <option value="all">All States</option>
                                    {nigerianStatesAndLgas.map((state) => (
                                        <option key={state.state} value={state.state}>
                                            {state.state}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" aria-hidden />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="news-lga-filter" className="text-sm font-medium mb-2 block">City/LGA</label>
                            <div className="relative">
                                <select
                                    id="news-lga-filter"
                                    value={selectedLga}
                                    onChange={handleLgaChange}
                                    disabled={selectedState === 'all' || lgas.length === 0}
                                    className={filterSelectClassName}
                                    aria-label="Filter by city/LGA"
                                >
                                    <option value="all">All LGAs</option>
                                    {lgas.map((lga) => (
                                        <option key={lga} value={lga}>
                                            {lga}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" aria-hidden />
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center min-h-[40vh]"><Loader2 className="h-16 w-16 animate-spin" /></div>
                ) : filteredNews.length > 0 ? (
                    <>
                        <div className="flex flex-col gap-5 md:hidden">
                            {visibleNews.length > 0 && (
                                <FeaturedNewsListItem item={visibleNews[0]} />
                            )}
                            {visibleNews.slice(1).map((item) => (
                                <CompactNewsListItem key={item.id} item={item} />
                            ))}
                        </div>
                        <div className="hidden gap-8 md:grid md:grid-cols-2 lg:grid-cols-3">
                            {visibleNews.map((item) => (
                                <NewsCard key={item.id} item={item} />
                            ))}
                        </div>
                        {hasMoreNews && (
                            <div className="mt-10 flex justify-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="min-w-[10rem] uppercase"
                                    onClick={handleLoadMore}
                                >
                                    Load more
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mx-auto max-w-2xl space-y-4 py-16 text-center">
                        <p className="text-xl font-medium text-foreground">
                            {selectedState !== 'all' || selectedLga !== 'all'
                                ? `No ${currentCategory.title.toLowerCase()} match your location filters.`
                                : `No ${currentCategory.title.toLowerCase()} alerts are published right now.`}
                        </p>
                        <p className="text-muted-foreground">
                            WhistleBlower.ng publishes verified {currentCategory.title.toLowerCase()} updates as they
                            become available. Browse{' '}
                            <Link href="/news" className="text-primary hover:underline">
                                all news
                            </Link>
                            , explore{' '}
                            <Link href="/most-wanted" className="text-primary hover:underline">
                                most wanted
                            </Link>
                            , or{' '}
                            <Link href="/submit-report" className="text-primary hover:underline">
                                submit a report
                            </Link>{' '}
                            anonymously.
                        </p>
                    </div>
                )}
            </div>
    );
};

export default NewsPage;
