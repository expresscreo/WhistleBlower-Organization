import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Trash2, PlusCircle, Eye } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import { format } from 'date-fns';
import { getLocalFileUrl } from '@/lib/fileUtils';

const NewsEditor = () => {
    const navigate = useNavigate();
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchNews = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setNewsItems(data);
        } catch (error) {
            console.error('Error fetching news:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Error', 
                description: 'Failed to fetch news items' 
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this news item?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('news')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({ title: 'Success', description: 'News item deleted successfully' });
            fetchNews();
        } catch (error) {
            console.error('Error deleting news item:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Error', 
                description: 'Failed to delete news item' 
            });
        }
    };

    const handleViewPost = (item) => {
        if (item.category === 'bounty' && item.bounty_id) {
            window.open(`/bounties/${item.bounty_id}`, '_blank');
        } else {
            window.open(`/news/post/${item.id}`, '_blank');
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'news': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'bounty': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'most_wanted': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    if (loading) {
        return <NavbarLoader />;
    }

    return (
        <>
            <Helmet><title>News Editor - WhistleBlower.ng</title></Helmet>
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">News Editor</h1>
                            <p className="text-muted-foreground">Manage news items and content</p>
                        </div>
                        <Button onClick={() => navigate('/admin/news-editor/create')}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create News Item
                        </Button>
                    </div>

                    {/* News Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {newsItems.map((item) => (
                            <Card key={item.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg line-clamp-2">
                                                {item.title}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {format(new Date(item.created_at), 'MMM dd, yyyy')}
                                            </CardDescription>
                                        </div>
                                        <div className="flex flex-col gap-2 ml-4">
                                            <Badge className={getCategoryColor(item.category)}>
                                                {item.category}
                                            </Badge>
                                            <Badge className={getStatusColor(item.status)}>
                                                {item.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                
                                <CardContent>
                                    {/* Featured Image */}
                                    {item.featured_image && (
                                        <div className="mb-4">
                                            <img
                                                src={getLocalFileUrl(item.featured_image)}
                                                alt={item.title}
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                        </div>
                                    )}
                                    
                                    {/* Content Preview */}
                                    <div className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                        <div 
                                            dangerouslySetInnerHTML={{ 
                                                __html: item.content?.replace(/<img[^>]*>/g, '[Image]') || '' 
                                            }}
                                        />
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/admin/news-editor/edit/${item.id}`)}
                                            className="flex-1"
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                        
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewPost(item)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Empty State */}
                    {newsItems.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-muted-foreground mb-4">
                                <PlusCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium">No news items yet</h3>
                                <p>Create your first news item to get started</p>
                            </div>
                            <Button onClick={() => navigate('/admin/news-editor/create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create News Item
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default NewsEditor;