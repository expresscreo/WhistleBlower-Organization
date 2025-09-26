
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Info, Calendar, Bookmark, Newspaper, Target, Hand, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import nigerianStatesAndLgas from '@/data/nigerianStatesAndLgas.json';
import { getLocalFileUrl, resolveImageUrl } from '@/lib/fileUtils';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, STRUCTURED_DATA_TEMPLATES, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';
import { slugify } from '@/lib/utils';
import SocialShare from '@/components/SocialShare';

const NewsCard = ({ item }) => {
    const bountyPostUrl = item.bounty_id ? `/bounties/${slugify(item.title)}` : null;
    const slug = item.slug || slugify(item.title);
    const newsPostUrl = `/news/post/${slug}`;

    return (
        <Card className="flex flex-col h-full overflow-hidden">
            {item.featured_image_url && (
                <div className="aspect-video overflow-hidden bg-muted">
                    <img src={item.featured_image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                </div>
            )}
            <CardHeader>
                {item.category === 'bounty' && item.bounty_id ? (
                    <Link to={`/bounties/${slugify(item.title)}`}>
                        <CardTitle className="text-xl font-bold hover:text-primary transition-colors cursor-pointer">{item.title}</CardTitle>
                    </Link>
                ) : (
                    <Link to={`/news/post/${slug}` }>
                        <CardTitle className="text-xl font-bold hover:text-primary transition-colors cursor-pointer">{item.title}</CardTitle>
                    </Link>
                )}
                <CardDescription className="flex items-center gap-4 pt-2 text-xs">
                    <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {format(new Date(item.created_at), 'PPP')}</span>
                    <span className="flex items-center capitalize"><Bookmark className="mr-1 h-3 w-3" /> {item.category.replace('_', ' ')}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div 
                    className="text-muted-foreground text-sm line-clamp-4 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ 
                        __html: item.content?.replace(/<img[^>]*>/g, '[Image]') || '' 
                    }}
                />
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
                {item.category === 'bounty' && bountyPostUrl ? (
                    <Link to={bountyPostUrl} className="w-full">
                        <Button className="w-full">
                            <Target className="mr-2 h-4 w-4" /> View Bounty
                        </Button>
                    </Link>
                ) : (
                    <Link to={newsPostUrl} className="w-full">
                        <Button variant={item.category === 'bounty' ? 'default' : 'outline'} className="w-full">
                            {item.category === 'bounty' ? (
                                <>
                                    <Target className="mr-2 h-4 w-4" /> View Bounty
                                </>
                            ) : item.category === 'most_wanted' ? (
                                <>
                                    <Info className="mr-2 h-4 w-4" /> View Alert
                                </>
                            ) : (
                                'Read More'
                            )}
                        </Button>
                    </Link>
                )}
                
                {/* Social Share Section */}
                <div className="border-t pt-3">
                    <SocialShare 
                        title={item.title}
                        url={item.category === 'bounty' && item.bounty_id ? `/bounties/${slugify(item.title)}` : `/news/post/${slugify(item.title)}`}
                        description={item.content?.replace(/<[^>]*>/g, '').substring(0, 100) + '...'}
                        hashtags={['WhistleBlower', 'Nigeria', item.category]}
                    />
                </div>
            </CardFooter>
        </Card>
    );
};

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

const NewsPage = () => {
    const { category = 'all' } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedState, setSelectedState] = useState('all');
    const [selectedLga, setSelectedLga] = useState('all');
    const [lgas, setLgas] = useState([]);

    const currentCategory = categoryDetails[category] || categoryDetails.all;
    const Icon = currentCategory.icon;

    // Generate SEO metadata based on category
    const getPageTitle = (category) => {
        if (category === 'bounty') {
            return 'Active Bounties - WhistleBlower.ng';
        } else if (category === 'most_wanted') {
            return 'Most Wanted - WhistleBlower.ng';
        } else if (category === 'news') {
            return 'Latest News - WhistleBlower.ng';
        }
        return 'News & Updates - WhistleBlower.ng';
    };

    const getPageDescription = (category) => {
        if (category === 'bounty') {
            return 'Browse active bounties and earn rewards for providing valuable information. Help solve cases and make Nigeria safer.';
        } else if (category === 'most_wanted') {
            return 'View Nigeria\'s most wanted individuals and help law enforcement. Provide anonymous tips to bring fugitives to justice.';
        } else if (category === 'news') {
            return 'Stay informed with the latest news and security updates from across Nigeria. Important information for citizen safety.';
        }
        return 'Stay updated with the latest news, published bounties, and most wanted alerts from across the nation.';
    };

    const fetchNews = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase.from('news').select(`*`).eq('status', 'published');

            if (category && category !== 'all') {
                query = query.eq('category', category);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            const newsWithImageUrls = data.map(item => ({
                ...item,
                featured_image_url: resolveImageUrl(item.featured_image)
            }));

            setNews(newsWithImageUrls);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching news', description: error.message });
            setNews([]);
        } finally {
            setLoading(false);
        }
    }, [category, toast]);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

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
                        fetchNews();
                    }, 100);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchNews]);

    useEffect(() => {
        if (selectedState && selectedState !== 'all') {
            const stateData = nigerianStatesAndLgas.find(s => s.state === selectedState);
            setLgas(stateData ? stateData.lgas : []);
        } else {
            setLgas([]);
        }
        setSelectedLga('all');
    }, [selectedState]);

    const handleCategoryChange = (newCategory) => {
        navigate(newCategory && newCategory !== 'all' ? `/news/${newCategory}` : '/news');
    };

    // Generate SEO metadata based on category
    const seoMeta = generateSEOMeta({
        title: getPageTitle(category),
        description: getPageDescription(category),
        url: category === 'all' ? '/news' : `/news/${category}`,
        keywords: category === 'bounty' ? ['bounty', 'reward', 'active bounties', 'information bounty', 'Nigeria bounty'] :
                 category === 'most_wanted' ? ['most wanted', 'fugitive', 'criminal', 'wanted person', 'law enforcement'] :
                 category === 'news' ? ['news', 'latest news', 'security updates', 'crime news', 'Nigeria news'] :
                 ['news', 'updates', 'bounties', 'most wanted', 'Nigeria security']
    });

    // Generate structured data for news listing
    const structuredData = [
        STRUCTURED_DATA_TEMPLATES.organization(),
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: getPageTitle(category),
            description: getPageDescription(category),
            mainEntity: {
                '@type': 'ItemList',
                numberOfItems: news.length,
                itemListElement: news.slice(0, 10).map((item, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    item: {
                        '@type': 'Article',
                        headline: item.title,
                        description: item.content?.replace(/<[^>]*>/g, '').substring(0, 160),
                        url: item.bounty_id ? `/bounties/${slugify(item.title)}` : `/news/post/${item.slug || `${slugify(item.title)}`}`,
                        datePublished: item.created_at,
                        author: {
                            '@type': 'Organization',
                            name: 'WhistleBlower.ng'
                        }
                    }
                }))
            }
        }
    ];

    return (
        <>
            <SEOHead
                {...seoMeta}
                structuredData={structuredData}
            />
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="text-center mb-12">
                    <Icon className="h-16 w-16 text-primary mx-auto mb-6" />
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">{currentCategory.title}</h1>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        {currentCategory.description}
                    </p>
                </div>

                <div className="mb-8 p-4 border bg-card rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Category</label>
                            <Select value={category || 'all'} onValueChange={handleCategoryChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="news">News</SelectItem>
                                    <SelectItem value="bounty">Bounty</SelectItem>
                                    <SelectItem value="most_wanted">Most Wanted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">State</label>
                            <Select value={selectedState} onValueChange={setSelectedState} disabled>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by state" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All States</SelectItem>
                                    {nigerianStatesAndLgas.map(s => <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">City/LGA</label>
                            <Select value={selectedLga} onValueChange={setSelectedLga} disabled>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by city/LGA" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All LGAs</SelectItem>
                                    {lgas.map(lga => <SelectItem key={lga} value={lga}>{lga}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center min-h-[40vh]"><Loader2 className="h-16 w-16 animate-spin" /></div>
                ) : news.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {news.map(item => <NewsCard key={item.id} item={item} />)}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-xl text-muted-foreground">No articles found for the selected filters.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default NewsPage;
