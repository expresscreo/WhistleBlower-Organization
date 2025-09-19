import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Calendar, Tag, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const NewsPostPage = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPost = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .eq('id', id)
            .eq('status', 'published')
            .single();

        if (error || !data) {
            toast({ variant: 'destructive', title: 'Error', description: 'News post not found.' });
            setPost(null);
        } else {
            setPost(data);
        }
        setLoading(false);
    }, [id, toast]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const { data } = supabase.storage.from('wb_evio').getPublicUrl(path);
        return data.publicUrl;
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-[80vh]"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    if (!post) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold">Post Not Found</h1>
                <p className="text-muted-foreground">The requested news post could not be found.</p>
                <Link to="/news" className="mt-4 inline-block text-primary hover:underline">Back to News</Link>
            </div>
        );
    }

    const featuredImageUrl = getImageUrl(post.featured_image);

    return (
        <>
            <Helmet>
                <title>{post.title} - WhistleBlower.ng</title>
                <meta name="description" content={post.content.substring(0, 160)} />
            </Helmet>
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl mx-auto">
                    <Link to="/news" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-8">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All News
                    </Link>
                    <Card>
                        {featuredImageUrl && (
                            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                                <img src={featuredImageUrl} alt={post.title} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-3xl md:text-4xl font-bold">{post.title}</CardTitle>
                            <CardDescription className="flex items-center gap-4 pt-4 text-sm">
                                <span className="flex items-center"><Calendar className="mr-1.5 h-4 w-4" /> {format(new Date(post.created_at), 'PPP')}</span>
                                <span className="flex items-center capitalize"><Tag className="mr-1.5 h-4 w-4" /> {post.category}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed whitespace-pre-wrap">
                                {post.content}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default NewsPostPage;