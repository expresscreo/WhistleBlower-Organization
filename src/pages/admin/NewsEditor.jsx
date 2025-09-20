
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Edit, Trash2, PlusCircle, ImagePlus, UploadCloud } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import { format } from 'date-fns';
import { sanitizeFilename } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';

const NewsEditor = () => {
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [bountyEvidence, setBountyEvidence] = useState([]);
    const [featuredImageFile, setFeaturedImageFile] = useState(null);
    const [featuredImageUrl, setFeaturedImageUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const textareaRef = useRef(null);

    const fetchNews = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching news', description: error.message });
        } else {
            setNewsItems(data);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const fetchBountyEvidence = async (bountyId) => {
        if (!bountyId) return;
        const { data, error } = await supabase.from('bounties').select('evidence').eq('id', bountyId).single();
        if (!error && data.evidence) {
            setBountyEvidence(data.evidence);
        }
    };

    const handleOpenDialog = (item = null) => {
        const initialItem = item || { title: '', content: '', category: 'news', status: 'draft', featured_image: null };
        setCurrentItem(initialItem);
        setFeaturedImageFile(null);
        setFeaturedImageUrl(initialItem.featured_image);
        setBountyEvidence([]);
        if (initialItem.bounty_id) {
            fetchBountyEvidence(initialItem.bounty_id);
        }
        setIsDialogOpen(true);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFeaturedImageFile(file);
            setFeaturedImageUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setIsUploading(true);
        let finalImageUrl = currentItem.featured_image;

        if (featuredImageFile) {
            const sanitizedName = sanitizeFilename(featuredImageFile.name);
            const filePath = `News Media/${currentItem.id || 'new'}/${Date.now()}-${sanitizedName}`;
            const { data, error } = await supabase.storage.from('wb_evio').upload(filePath, featuredImageFile, { upsert: true });
            if (error) {
                toast({ variant: 'destructive', title: 'Image upload failed', description: error.message });
                setIsUploading(false);
                return;
            }
            const { data: urlData } = supabase.storage.from('wb_evio').getPublicUrl(data.path);
            finalImageUrl = urlData.publicUrl;
        }

        const { id, ...upsertData } = { ...currentItem, featured_image: finalImageUrl };
        const query = id ? supabase.from('news').update(upsertData).eq('id', id).select().single() : supabase.from('news').insert(upsertData).select().single();

        const { data: savedData, error } = await query;
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to save news item', description: error.message });
        } else {
            if (savedData.status === 'published' && savedData.bounty_id) {
                await supabase.from('bounties').update({ status: 'published' }).eq('id', savedData.bounty_id);
            }
            toast({ title: 'News item saved successfully!' });
            setIsDialogOpen(false);
            fetchNews();
        }
        setIsUploading(false);
    };

    const handleDelete = async (id) => {
        const { error } = await supabase.from('news').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to delete news item', description: error.message });
        } else {
            toast({ title: 'News item deleted.' });
            fetchNews();
        }
    };

    const importFromBounty = async (path) => {
        const { data, error } = await supabase.functions.invoke('create-signed-url', { body: { path } });
        if (error || data.error) {
            toast({ variant: 'destructive', title: 'Failed to get image URL' });
            return;
        }
        setFeaturedImageUrl(data.signedUrl);
        setCurrentItem(prev => ({ ...prev, featured_image: data.signedUrl }));
        setFeaturedImageFile(null);
    };

    const handleInlineImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const sanitizedName = sanitizeFilename(file.name);
        const filePath = `News Media/inline/${Date.now()}-${sanitizedName}`;
        const { data, error } = await supabase.storage.from('wb_evio').upload(filePath, file);
        if (error) {
            toast({ variant: 'destructive', title: 'Image upload failed', description: error.message });
            setIsUploading(false);
            return;
        }
        const { data: urlData } = supabase.storage.from('wb_evio').getPublicUrl(data.path);
        const markdownImage = `\n![${file.name}](${urlData.publicUrl})\n`;
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = currentItem.content.substring(0, start) + markdownImage + currentItem.content.substring(end);
        setCurrentItem(prev => ({ ...prev, content: newText }));
        setIsUploading(false);
    };

    return (
        <>
            <Helmet><title>News Editor - WhistleBlower.ng</title></Helmet>
            {loading && <NavbarLoader />}
            <div className="space-y-8">
                <PageHeader 
                    title="News Editor"
                    description="Create, edit, and publish articles."
                >
                    <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Create News</Button>
                </PageHeader>
                
                {/* News Articles */}
                        {loading ? (
                            <div className="flex justify-center py-8">
                                {/* Loading indication is handled by NavbarLoader */}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {newsItems.map(item => (
                                    <Card key={item.id} className="flex items-center justify-between p-4">
                                        <div>
                                            <h3 className="font-semibold">{item.title}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Category: {item.category} | Status: {item.status} | Last updated: {format(new Date(item.updated_at), 'PPP')}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleOpenDialog(item)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                        {!loading && newsItems.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground">
                                <PlusCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">No news items yet.</p>
                                <p className="text-sm">Create your first article to get started.</p>
                            </div>
                        )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle>{currentItem?.id ? 'Edit' : 'Create'} News Item</DialogTitle>
                        <DialogDescription>Make changes and publish when ready.</DialogDescription>
                    </DialogHeader>
                    {currentItem && (
                        <div className="grid gap-4 py-4">
                            <Input placeholder="Title" value={currentItem.title} onChange={(e) => setCurrentItem({ ...currentItem, title: e.target.value })} />
                            <div className="relative">
                                <Textarea ref={textareaRef} placeholder="Content (supports Markdown for images)" value={currentItem.content} onChange={(e) => setCurrentItem({ ...currentItem, content: e.target.value })} rows={10} />
                                <label htmlFor="inline-image-upload" className="absolute bottom-2 right-2 cursor-pointer">
                                    <Button variant="ghost" size="icon" as="span">
                                        <UploadCloud className="h-4 w-4" />
                                    </Button>
                                    <input id="inline-image-upload" type="file" accept="image/*" className="hidden" onChange={handleInlineImageUpload} />
                                </label>
                            </div>
                            
                            <div>
                                <Label>Featured Image</Label>
                                <div className="mt-2 flex items-center gap-4">
                                    <div className="w-32 h-32 bg-muted flex items-center justify-center overflow-hidden">
                                        {featuredImageUrl ? (
                                            <img src={featuredImageUrl} alt="Featured" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImagePlus className="h-12 w-12 text-muted-foreground" />
                                        )}
                                    </div>
                                    <Input id="picture" type="file" accept="image/*" onChange={handleFileSelect} className="flex-1" />
                                </div>
                            </div>

                            {bountyEvidence.length > 0 && (
                                <div>
                                    <Label>Import from Bounty Evidence</Label>
                                    <div className="flex gap-2 overflow-x-auto p-2 border mt-2">
                                        {bountyEvidence.map((path, i) => (
                                            <Button key={i} type="button" variant="outline" onClick={() => importFromBounty(path)} className="h-20 w-20 p-0 overflow-hidden flex-shrink-0">
                                                <img src={`${supabase.storage.from('wb_evio').getPublicUrl(path).data.publicUrl}?width=80&height=80`} alt="evidence" className="w-full h-full object-cover" />
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <Select value={currentItem.category} onValueChange={(v) => setCurrentItem({ ...currentItem, category: v })}>
                                    <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="news">News</SelectItem>
                                        <SelectItem value="bounty">Bounty</SelectItem>
                                        <SelectItem value="most_wanted">Most Wanted</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={currentItem.status} onValueChange={(v) => setCurrentItem({ ...currentItem, status: v })}>
                                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isUploading}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default NewsEditor;
