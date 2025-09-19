
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Info, Calendar, Tag, Newspaper, Search, Hand, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import nigerianStatesAndLgas from '@/data/nigerianStatesAndLgas.json';

const NewsCard = ({ item }) => {
    const bountyPostUrl = item.bounty_id ? `/bounties/${item.bounty_id}` : null;
    const newsPostUrl = `/news/post/${item.id}`;

    return (
        <Card className="flex flex-col h-full overflow-hidden">
            {item.featured_image_url && (
                <div className="aspect-video overflow-hidden bg-muted">
                    <img src={item.featured_image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                </div>
            )}
            <CardHeader>
                <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 pt-2 text-xs">
                    <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {format(new Date(item.created_at), 'PPP')}</span>
                    <span className="flex items-center capitalize"><Tag className="mr-1 h-3 w-3" /> {item.category.replace('_', ' ')}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground text-sm line-clamp-4">{item.content}</p>
            </CardContent>
            <CardFooter>
                {item.category === 'bounty' && bountyPostUrl ? (
                    <Link to={bountyPostUrl} className="w-full">
                        <Button className="w-full">
                            <Info className="mr-2 h-4 w-4" /> View Bounty
                        </Button>
                    </Link>
                ) : (
                    <Link to={newsPostUrl} className="w-full">
                        <Button variant="outline" className="w-full">Read More</Button>
                    </Link>
                )}
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
        icon: Search,
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

    const fetchNews = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase.from('news').select(`*`).eq('status', 'published');

            if (category && category !== 'all') {
                query = query.eq('category', category);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            const imagePaths = data.map(item => item.featured_image).filter(Boolean);
            let imageUrlMap = {};

            if (imagePaths.length > 0) {
                const { data: signedUrls, error: urlError } = await supabase.storage.from('wb_evio').createSignedUrls(imagePaths, 3600); // 1 hour validity
                if (urlError) throw urlError;

                signedUrls.forEach(url => {
                    if (url.signedUrl) {
                        const path = url.path;
                        imageUrlMap[path] = url.signedUrl;
                    }
                });
            }

            const newsWithImageUrls = data.map(item => ({
                ...item,
                featured_image_url: item.featured_image ? imageUrlMap[item.featured_image] : null
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

    return (
        <>
            <Helmet>
                <title>{currentCategory.title} - WhistleBlower.ng</title>
                <meta name="description" content={currentCategory.description} />
            </Helmet>
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
