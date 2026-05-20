import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { uploadFileToLocal, getLocalFileUrl } from '@/lib/fileUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Eye, Image as ImageIcon, Upload, Bold, Italic, AlignLeft, AlignCenter, AlignRight, X, Underline, Strikethrough, List, ListOrdered, Type, Quote, Pilcrow, CheckCircle, Undo, Redo } from 'lucide-react';
import { slugify } from '@/lib/utils';
import { Helmet } from 'react-helmet';
import NavbarLoader from '@/components/admin/NavbarLoader';
import { formatNumberWithCommas } from '@/lib/utils';
import { consumeNavigationState } from '@/lib/navigation-state';

const NewsEditorPage = () => {
    const router = useRouter();
    const { id } = useParams();
    const pathname = usePathname();
    const isEditing = Boolean(id);
    
    const [loading, setLoading] = useState(false);
    const [currentItem, setCurrentItem] = useState({
        title: '',
        content: '',
        category: 'news',
        status: 'draft',
        featured_image: null,
        bounty_id: null,
        bounty_amount: ''
    });
    const [featuredImageFile, setFeaturedImageFile] = useState(null);
    const [featuredImageUrl, setFeaturedImageUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [inlineImages, setInlineImages] = useState([]);
    const [editorContent, setEditorContent] = useState('');
    const [bountyEvidence, setBountyEvidence] = useState([]);
    const [bountyAmountVerified, setBountyAmountVerified] = useState(false);
    
    // Undo/Redo state management
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isUndoRedo, setIsUndoRedo] = useState(false);
    
    const { toast } = useToast();
    const editorRef = useRef(null);
    const contentInitializedRef = useRef(false);

    // Prefill bounty amount when navigated from BountyDetails (create flow only)
    useEffect(() => {
        if (isEditing) return;
        const prefill = consumeNavigationState()?.prefillBountyAmount;
        if (prefill !== undefined && prefill !== null && prefill !== '') {
            setCurrentItem(prev => ({ ...prev, category: 'bounty', bounty_amount: formatNumberWithCommas(String(prefill)) }));
            setBountyAmountVerified(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load existing item if editing
    useEffect(() => {
        if (isEditing && id) {
            loadNewsItem(id);
        }
    }, [id, isEditing]);

    const loadNewsItem = async (newsId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .eq('id', newsId)
                .single();

            if (error) throw error;

            // If we navigated from BountyDetails with a prefilled amount, prefer that
            const prefill = consumeNavigationState()?.prefillBountyAmount;
            const bountyAmountPrefilled = prefill !== undefined && prefill !== null && prefill !== ''
                ? formatNumberWithCommas(String(prefill))
                : (data?.bounty_amount ? formatNumberWithCommas(String(data.bounty_amount)) : '');

            setCurrentItem({
                ...data,
                bounty_amount: bountyAmountPrefilled,
                category: data?.category || 'bounty'
            });

            setBountyAmountVerified(Boolean(prefill));
            setEditorContent(data.content || '');
            setFeaturedImageUrl(getLocalFileUrl(data.featured_image));
            
            if (data.bounty_id) {
                fetchBountyEvidence(data.bounty_id);
            }
            
            contentInitializedRef.current = false;
        } catch (error) {
            console.error('Error loading news post:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load news post' });
        } finally {
            setLoading(false);
        }
    };

    const fetchBountyEvidence = async (bountyId) => {
        if (!bountyId) return;
        const { data, error } = await supabase.from('bounties').select('evidence').eq('id', bountyId).single();
        if (!error && data.evidence) {
            setBountyEvidence(data.evidence);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFeaturedImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setFeaturedImageUrl(previewUrl);
        }
    };

    const handleInlineImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const previewUrl = URL.createObjectURL(file);
        const newImage = {
            id: Date.now(),
            file: file,
            previewUrl: previewUrl,
            name: file.name
        };
        
        setInlineImages(prev => [...prev, newImage]);
        insertImageIntoEditor(newImage);
        e.target.value = '';
        
        toast({ title: 'Image added!', description: 'Image will be uploaded when you save the post.' });
    };

    const insertImageIntoEditor = (image) => {
        const editor = editorRef.current;
        if (!editor) return;

        const img = document.createElement('img');
        img.src = image.previewUrl;
        img.alt = image.name;
        img.className = 'inline-image max-w-full h-auto rounded-md my-4 cursor-pointer';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.width = '100%';
        img.dataset.imageId = image.id;
        
        img.addEventListener('click', (e) => {
            e.preventDefault();
            showImageOptions(image.id);
        });

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            range.setStartAfter(img);
            range.setEndAfter(img);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            editor.appendChild(img);
        }

        updateEditorContent();
    };

    const showImageOptions = (imageId) => {
        const image = inlineImages.find(img => img.id === imageId);
        if (!image) return;

        const imgElement = editorRef.current?.querySelector(`[data-image-id="${imageId}"]`);
        if (!imgElement) return;

        const input = window.prompt('Enter image width percentage (10-100). Type "remove" to delete. Leave blank to cancel.', '100');
        if (input === null) {
            return; // cancelled
        }
        const trimmed = input.trim().toLowerCase();
        if (trimmed === 'remove') {
            // Remove image from DOM
            imgElement.remove();
            // Remove from state
            setInlineImages(prev => prev.filter(img => img.id !== imageId));
            URL.revokeObjectURL(image.previewUrl);
            updateEditorContent();
            toast({ title: 'Image removed', description: 'Image has been removed from the content.' });
            return;
        }
        if (trimmed !== '') {
            const value = Number(trimmed);
            if (!Number.isNaN(value) && value >= 10 && value <= 100) {
                imgElement.style.width = `${value}%`;
                imgElement.style.height = 'auto';
                imgElement.style.maxWidth = '100%';
                updateEditorContent();
                toast({ title: 'Image resized', description: `Set width to ${value}%.` });
            } else {
                toast({ variant: 'destructive', title: 'Invalid size', description: 'Please enter a number between 10 and 100, or type remove.' });
            }
        }
    };

    const updateEditorContent = () => {
        const editor = editorRef.current;
        if (!editor) return;
        
        const content = editor.innerHTML;
        setEditorContent(content);
        setCurrentItem(prev => ({ ...prev, content }));
        
        // Add to history if not an undo/redo operation
        if (!isUndoRedo) {
            addToHistory(content);
        }
    };

    // Undo/Redo functionality
    const addToHistory = (content) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(content);
            // Limit history to 50 items to prevent memory issues
            if (newHistory.length > 50) {
                newHistory.shift();
                setHistoryIndex(prev => prev - 1);
            } else {
                setHistoryIndex(newHistory.length - 1);
            }
            return newHistory;
        });
    };

    const undo = () => {
        if (historyIndex > 0) {
            setIsUndoRedo(true);
            const previousContent = history[historyIndex - 1];
            if (editorRef.current) {
                editorRef.current.innerHTML = previousContent;
                setEditorContent(previousContent);
                setCurrentItem(prev => ({ ...prev, content: previousContent }));
            }
            setHistoryIndex(prev => prev - 1);
            setTimeout(() => setIsUndoRedo(false), 100);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setIsUndoRedo(true);
            const nextContent = history[historyIndex + 1];
            if (editorRef.current) {
                editorRef.current.innerHTML = nextContent;
                setEditorContent(nextContent);
                setCurrentItem(prev => ({ ...prev, content: nextContent }));
            }
            setHistoryIndex(prev => prev + 1);
            setTimeout(() => setIsUndoRedo(false), 100);
        }
    };

    const formatText = (command, value = null) => {
        const editor = editorRef.current;
        if (!editor) return;
        
        editor.focus();
        document.execCommand(command, false, value);
        updateEditorContent();
    };

    const insertHeader = (level) => {
        const editor = editorRef.current;
        if (!editor) return;
        
        editor.focus();
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            // If there's selected text, wrap it in a header
            if (!range.collapsed) {
                const selectedText = range.toString();
                if (selectedText.trim()) {
                    // Check if selection is already in a header element
                    let container = range.commonAncestorContainer;
                    let headerParent = null;
                    
                    // Walk up the DOM tree to find if we're inside a header
                    while (container && container !== editor) {
                        if (container.nodeType === Node.ELEMENT_NODE && /^H[1-6]$/.test(container.tagName)) {
                            headerParent = container;
                            break;
                        }
                        container = container.parentNode;
                    }
                    
                    if (headerParent) {
                        // If the same header level is clicked, toggle to paragraph
                        if (headerParent.tagName === `H${level}`) {
                            const p = document.createElement('p');
                            p.innerHTML = headerParent.innerHTML;
                            // Replace header with paragraph while preserving content
                            headerParent.replaceWith(p);
                            // Re-select paragraph contents
                            range.selectNodeContents(p);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        } else {
                            // Change to a different header level, preserving content
                            const newHeader = document.createElement(`h${level}`);
                            newHeader.innerHTML = headerParent.innerHTML;
                            // Apply header styles
                            newHeader.style.margin = '16px 0 8px 0';
                            newHeader.style.fontWeight = 'bold';
                            newHeader.style.fontSize = level === 1 ? '2em' : level === 2 ? '1.5em' : '1.25em';
                            newHeader.style.lineHeight = '1.2';
                            newHeader.style.display = 'block';
                            headerParent.replaceWith(newHeader);
                            range.selectNodeContents(newHeader);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    } else {
                        // Create new header element
                        const headerElement = document.createElement(`h${level}`);
                        
                        // Apply header styles
                        headerElement.style.margin = '16px 0 8px 0';
                        headerElement.style.fontWeight = 'bold';
                        headerElement.style.fontSize = level === 1 ? '2em' : level === 2 ? '1.5em' : '1.25em';
                        headerElement.style.lineHeight = '1.2';
                        headerElement.style.display = 'block';
                        
                        // Extract the selected content and wrap it
                        const contents = range.extractContents();
                        headerElement.appendChild(contents);
                        
                        // Insert the header element
                        range.insertNode(headerElement);
                        
                        // Select the new header element
                        range.selectNodeContents(headerElement);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            } else {
                // No selection, insert header at cursor position
                const headerElement = document.createElement(`h${level}`);
                headerElement.textContent = 'Header Text';
                headerElement.style.margin = '16px 0 8px 0';
                headerElement.style.fontWeight = 'bold';
                headerElement.style.fontSize = level === 1 ? '2em' : level === 2 ? '1.5em' : '1.25em';
                headerElement.style.lineHeight = '1.2';
                headerElement.style.display = 'block';
                
                range.insertNode(headerElement);
                range.selectNodeContents(headerElement);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
        updateEditorContent();
    };

    const convertToParagraph = () => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;
        while (container && container !== editor && container.nodeType !== Node.ELEMENT_NODE) {
            container = container.parentNode;
        }

        // Find nearest block element (H1-H6 or P)
        let block = container;
        while (block && block !== editor && block.nodeType === Node.ELEMENT_NODE && !/^H[1-6]$|^P$/.test(block.tagName)) {
            block = block.parentNode;
        }

        if (block && /^H[1-6]$/.test(block.tagName)) {
            const p = document.createElement('p');
            p.innerHTML = block.innerHTML;
            block.replaceWith(p);
            range.selectNodeContents(p);
            selection.removeAllRanges();
            selection.addRange(range);
        } else if (!block || block === editor) {
            // If no block found, wrap selection contents in a paragraph
            const p = document.createElement('p');
            const contents = range.extractContents();
            if (contents.childNodes.length === 0) {
                p.innerHTML = '&nbsp;';
            } else {
                p.appendChild(contents);
            }
            range.insertNode(p);
            range.selectNodeContents(p);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        updateEditorContent();
    };

    const insertQuote = () => {
        const editor = editorRef.current;
        if (!editor) return;
        
        editor.focus();
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            // If there's selected text, wrap it in a blockquote
            if (!range.collapsed) {
                const selectedText = range.toString();
                if (selectedText.trim()) {
                    // Check if the selection is already in a blockquote
                    let container = range.commonAncestorContainer;
                    let blockquoteParent = null;
                    
                    // Walk up the DOM tree to find if we're inside a blockquote
                    while (container && container !== editor) {
                        if (container.nodeType === Node.ELEMENT_NODE && container.tagName === 'BLOCKQUOTE') {
                            blockquoteParent = container;
                            break;
                        }
                        container = container.parentNode;
                    }
                    
                    if (blockquoteParent) {
                        // Already in a blockquote, remove the blockquote formatting
                        const blockquoteContent = blockquoteParent.innerHTML;
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = blockquoteContent;
                        
                        range.selectNodeContents(blockquoteParent);
                        range.deleteContents();
                        range.insertNode(document.createTextNode(tempDiv.textContent));
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } else {
                        // Create new blockquote element
                        const blockquoteElement = document.createElement('blockquote');
                        
                        // Apply quote styles
                        blockquoteElement.style.borderLeft = '4px solid #e5e7eb';
                        blockquoteElement.style.paddingLeft = '16px';
                        blockquoteElement.style.fontStyle = 'italic';
                        blockquoteElement.style.margin = '16px 0';
                        blockquoteElement.style.backgroundColor = '#f9fafb';
                        blockquoteElement.style.padding = '12px 16px';
                        blockquoteElement.style.borderRadius = '6px';
                        blockquoteElement.style.borderColor = '#d1d5db';
                        blockquoteElement.style.display = 'block';
                        
                        // Extract the selected content and wrap it
                        const contents = range.extractContents();
                        blockquoteElement.appendChild(contents);
                        
                        // Insert the blockquote element
                        range.insertNode(blockquoteElement);
                        
                        // Select the new blockquote element
                        range.selectNodeContents(blockquoteElement);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            } else {
                // No selection, insert blockquote at cursor position
                const blockquoteElement = document.createElement('blockquote');
                blockquoteElement.innerHTML = 'Quote text here...';
                blockquoteElement.style.borderLeft = '4px solid #e5e7eb';
                blockquoteElement.style.paddingLeft = '16px';
                blockquoteElement.style.fontStyle = 'italic';
                blockquoteElement.style.margin = '16px 0';
                blockquoteElement.style.backgroundColor = '#f9fafb';
                blockquoteElement.style.padding = '12px 16px';
                blockquoteElement.style.borderRadius = '6px';
                blockquoteElement.style.borderColor = '#d1d5db';
                blockquoteElement.style.display = 'block';
                
                range.insertNode(blockquoteElement);
                range.selectNodeContents(blockquoteElement);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
        updateEditorContent();
    };

    const handleEditorInput = () => {
        updateEditorContent();
    };

    const handleEditorBlur = () => {
        updateEditorContent();
    };

    const handleEditorPaste = (e) => {
        // Preserve formatting from clipboard by inserting sanitized HTML when available
        e.preventDefault();
        const clipboardData = e.clipboardData || window.clipboardData;
        const html = clipboardData.getData('text/html');
        const plain = clipboardData.getData('text/plain');

        const sanitizeHtml = (unsafeHtml) => {
            // Basic, lightweight sanitizer: removes script/style tags and event handlers
            // Allows common formatting tags and attributes like href/src
            const template = document.createElement('template');
            template.innerHTML = unsafeHtml || '';

            const disallowedTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'META', 'LINK']);

            const walk = (node) => {
                // Remove disallowed elements
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node;
                    if (disallowedTags.has(el.tagName)) {
                        el.remove();
                        return;
                    }
                    // Strip event handlers and javascript: urls
                    [...el.attributes].forEach((attr) => {
                        const name = attr.name.toLowerCase();
                        const value = attr.value;
                        if (name.startsWith('on')) {
                            el.removeAttribute(attr.name);
                            return;
                        }
                        if ((name === 'href' || name === 'src') && typeof value === 'string') {
                            const trimmed = value.trim().toLowerCase();
                            if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:text/html')) {
                                el.removeAttribute(attr.name);
                            }
                        }
                    });
                }
                // Recurse
                let child = node.firstChild;
                while (child) {
                    const next = child.nextSibling;
                    walk(child);
                    child = next;
                }
            };

            walk(template.content);
            return template.innerHTML;
        };

        const selection = window.getSelection();
        if (!selection) return;

        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();

            if (html) {
                const cleaned = sanitizeHtml(html);
                // Insert as DocumentFragment to preserve structure
                const fragment = range.createContextualFragment(cleaned);
                range.insertNode(fragment);
                // Move cursor to end of inserted content
                selection.removeAllRanges();
                const newRange = document.createRange();
                if (range.endContainer) {
                    newRange.setStartAfter(range.endContainer);
                }
                // Fallback: collapse at editor end
                newRange.collapse(true);
                selection.addRange(newRange);
            } else if (plain) {
                // Preserve newlines in plain text
                const lines = plain.split(/\r?\n/);
                lines.forEach((line, idx) => {
                    if (idx > 0) {
                        range.insertNode(document.createElement('br'));
                        range.collapse(false);
                    }
                    range.insertNode(document.createTextNode(line));
                    range.collapse(false);
                });
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }

        updateEditorContent();
    };

    // Initialize editor content when component mounts or content changes
    useEffect(() => {
        if (editorRef.current && currentItem.content && !contentInitializedRef.current) {
            editorRef.current.innerHTML = currentItem.content;
            setEditorContent(currentItem.content);
            contentInitializedRef.current = true;
            // Initialize history with initial content
            addToHistory(currentItem.content);
        }
    }, [currentItem.content]);

    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                redo();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [historyIndex, history]);

    const handleSave = async () => {
        if (!currentItem.title.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Title is required' });
            return;
        }

        setIsUploading(true);
        try {
            let featuredImagePath = currentItem.featured_image;
            
            // Upload featured image if changed
            if (featuredImageFile) {
                try {
                    const uploadedPath = await uploadFileToLocal(featuredImageFile, 'news', currentItem.id || slugify(currentItem.title) || 'new');
                    featuredImagePath = uploadedPath;
                } catch (e) {
                    console.error('Featured image upload failed:', e);
                    // Non-blocking: allow publish without featured image
                    featuredImagePath = currentItem.featured_image || null;
                }
            }

            // Upload inline images and replace preview URLs with actual URLs
            let finalContent = currentItem.content;
            if (inlineImages.length > 0) {
                const subfolder = currentItem.id || 'new';
                
                for (const image of inlineImages) {
                    try {
                        const uploadedFilePath = await uploadFileToLocal(image.file, 'news', subfolder);
                        const localImageUrl = getLocalFileUrl(uploadedFilePath);
                        
                        finalContent = finalContent.replace(
                            new RegExp(image.previewUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                            localImageUrl
                        );
                    } catch (e) {
                        console.error('Inline image upload failed:', e);
                        // keep preview URL if upload fails; doesn't block publish
                    }
                }
                
                inlineImages.forEach(image => {
                    URL.revokeObjectURL(image.previewUrl);
                });
            }

            // Generate slug from title
            const baseSlug = slugify(currentItem.title);
            let finalSlug = baseSlug;

            // Try to ensure unique slug if column exists by checking conflicts
            try {
                const { data: existing } = await supabase
                    .from('news')
                    .select('slug')
                    .ilike('slug', `${baseSlug}%`);

                if (Array.isArray(existing) && existing.length > 0) {
                    const existingSlugs = new Set(existing.map(e => e.slug));
                    let suffix = 2;
                    while (existingSlugs.has(finalSlug)) {
                        finalSlug = `${baseSlug}-${suffix++}`;
                    }
                }
            } catch (_) {
                // If the query fails (e.g., slug column doesn't exist), we'll fallback below
            }

            const newsData = {
                title: currentItem.title,
                content: finalContent,
                category: currentItem.category,
                status: currentItem.status,
                featured_image: featuredImagePath,
                bounty_id: currentItem.bounty_id,
                updated_at: new Date().toISOString(),
                // Include slug optimistically; we'll retry without it if DB doesn't have the column
                slug: finalSlug
            };

            const saveWithData = async (payload, edit) => {
                if (edit) {
                    return supabase.from('news').update(payload).eq('id', id);
                }
                return supabase.from('news').insert([payload]);
            };

            // First attempt: with slug
            let result = await saveWithData(newsData, isEditing);

            // Fallback: if slug column doesn't exist, retry without slug
            if (result.error && /slug/i.test(result.error.message || '')) {
                const { slug, ...withoutSlug } = newsData;
                result = await saveWithData(withoutSlug, isEditing);
            }

            if (result.error) throw result.error;

            // If linked to a bounty, propagate changes
            if (currentItem.category === 'bounty' && currentItem.bounty_id) {
                // 1) Update bounty amount, if provided
                if (currentItem.bounty_amount) {
                    const numericAmount = Number(String(currentItem.bounty_amount).replace(/,/g, ''));
                    try {
                        await supabase
                            .from('bounties')
                            .update({ bounty_amount: numericAmount })
                            .eq('id', currentItem.bounty_id);
                    } catch (e) {
                        console.warn('Could not update bounty amount on bounty record:', e);
                    }
                }

                // 2) If the news post is being published, mark the bounty as published
                if (currentItem.status === 'published') {
                    try {
                        await supabase
                            .from('bounties')
                            .update({ status: 'published' })
                            .eq('id', currentItem.bounty_id);
                    } catch (e) {
                        console.warn('Could not update bounty status to published:', e);
                    }
                }
            }

            toast({ title: 'Success', description: `News post ${isEditing ? 'updated' : 'created'} successfully!` });

            router.push('/admin/news-editor');
        } catch (error) {
            console.error('Error saving news post:', error);
            toast({ variant: 'destructive', title: 'Error', description: `Failed to save news post: ${error.message || error}` });
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return <NavbarLoader />;
    }

    return (
        <>
            <Helmet>
                <title>{isEditing ? 'Edit' : 'Create'} News Post - WhistleBlower.ng</title>
            </Helmet>
            
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push('/admin/news-editor')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">
                                {isEditing ? 'Edit' : 'Create'} News Post
                            </h1>
                            {isEditing && (
                                <p className="text-muted-foreground">
                                    Update the news post details
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Editor */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Content</CardTitle>
                                    <CardDescription>
                                        Write and format your news content
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Title */}
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            placeholder="Enter news title"
                                            value={currentItem.title}
                                            onChange={(e) => setCurrentItem({ ...currentItem, title: e.target.value })}
                                        />
                                    </div>

                                    {/* Content Editor */}
                                    <div className="space-y-2">
                                        <Label>Content Editor</Label>
                                        
                                        {/* Toolbar */}
                                        <div className="border border-border rounded-t-md bg-muted/50">
                                            {/* First Row - Undo/Redo and Basic Formatting */}
                                            <div className="flex items-center gap-1 p-2 border-b border-border">
                                                {/* Undo/Redo buttons */}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={undo}
                                                    disabled={historyIndex <= 0}
                                                    title="Undo (Ctrl+Z)"
                                                >
                                                    <Undo className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={redo}
                                                    disabled={historyIndex >= history.length - 1}
                                                    title="Redo (Ctrl+Y)"
                                                >
                                                    <Redo className="h-4 w-4" />
                                                </Button>
                                                
                                                <div className="h-4 w-px bg-border mx-2" />
                                                
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => formatText('bold')}
                                                    title="Bold"
                                                >
                                                    <Bold className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => formatText('italic')}
                                                    title="Italic"
                                                >
                                                    <Italic className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => formatText('underline')}
                                                    title="Underline"
                                                >
                                                    <Underline className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => formatText('strikeThrough')}
                                                    title="Strikethrough"
                                                >
                                                    <Strikethrough className="h-4 w-4" />
                                                </Button>
                                                
                                                <div className="h-4 w-px bg-border mx-2" />
                                                
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => formatText('justifyLeft')}
                                                    title="Align Left"
                                                >
                                                    <AlignLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => formatText('justifyCenter')}
                                                    title="Align Center"
                                                >
                                                    <AlignCenter className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => formatText('justifyRight')}
                                                    title="Align Right"
                                                >
                                                    <AlignRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            
                                            {/* Second Row - Headers, Lists, Paragraph, and Media */}
                                            <div className="flex items-center gap-1 p-2">
                                                {/* Headers */}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => insertHeader(1)}
                                                    title="Header 1"
                                                >
                                                    <Type className="h-4 w-4" />
                                                    <span className="ml-1 text-xs">H1</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => insertHeader(2)}
                                                    title="Header 2"
                                                >
                                                    <Type className="h-4 w-4" />
                                                    <span className="ml-1 text-xs">H2</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => insertHeader(3)}
                                                    title="Header 3"
                                                >
                                                    <Type className="h-4 w-4" />
                                                    <span className="ml-1 text-xs">H3</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={convertToParagraph}
                                                    title="Paragraph"
                                                >
                                                    <Pilcrow className="h-4 w-4" />
                                                    <span className="ml-1 text-xs">P</span>
                                                </Button>
                                                
                                                <div className="h-4 w-px bg-border mx-2" />
                                                
                                                {/* Lists */}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => formatText('insertUnorderedList')}
                                                    title="Bullet List"
                                                >
                                                    <List className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => formatText('insertOrderedList')}
                                                    title="Numbered List"
                                                >
                                                    <ListOrdered className="h-4 w-4" />
                                                </Button>
                                                
                                                <div className="h-4 w-px bg-border mx-2" />
                                                
                                                {/* Quote */}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={insertQuote}
                                                    title="Quote"
                                                >
                                                    <Quote className="h-4 w-4" />
                                                </Button>
                                                
                                                <div className="h-4 w-px bg-border mx-2" />
                                                
                                                {/* Inline Image Upload */}
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleInlineImageUpload}
                                                        className="hidden"
                                                        id="inline-image-upload"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => document.getElementById('inline-image-upload').click()}
                                                        disabled={isUploading}
                                                        title="Add Image"
                                                    >
                                                        <ImageIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Rich Text Editor */}
                                        <div
                                            ref={editorRef}
                                            contentEditable
                                            className="min-h-[400px] p-4 border border-border rounded-b-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent prose dark:prose-invert max-w-none bg-background"
                                            style={{ minHeight: '400px' }}
                                            onInput={handleEditorInput}
                                            onBlur={handleEditorBlur}
                                            onPaste={handleEditorPaste}
                                            suppressContentEditableWarning={true}
                                        />
                                        
                                        <p className="text-xs text-muted-foreground">
                                            💡 Tip: Click on images to remove them. Use the toolbar for formatting.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Category */}
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select
                                            value={currentItem.category}
                                            onValueChange={(value) => setCurrentItem({ ...currentItem, category: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="news">News</SelectItem>
                                                <SelectItem value="bounty">Bounty</SelectItem>
                                                <SelectItem value="most_wanted">Most Wanted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Bounty Amount (only for bounty category) */}
                                    {currentItem.category === 'bounty' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="bounty_amount">Bounty Amount</Label>
                                                {bountyAmountVerified && (
                                                    <span className="inline-flex items-center text-xs text-green-600">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Verified from bounty
                                                    </span>
                                                )}
                                            </div>
                                            <Input
                                                id="bounty_amount"
                                                placeholder="e.g., 50,000"
                                                value={currentItem.bounty_amount}
                                                onChange={(e) => {
                                                    const formatted = formatNumberWithCommas(e.target.value);
                                                    setCurrentItem(prev => ({ ...prev, bounty_amount: formatted }));
                                                    setBountyAmountVerified(false);
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Status */}
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={currentItem.status}
                                            onValueChange={(value) => setCurrentItem({ ...currentItem, status: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="published">Publish</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Featured Image */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Featured Image</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="featured-image"
                                        />
                                        <Label htmlFor="featured-image" className="cursor-pointer">
                                            <div className="flex items-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-muted-foreground transition-colors">
                                                <Upload className="h-5 w-5" />
                                                <span>Choose Featured Image</span>
                                            </div>
                                        </Label>
                                    </div>

                                    {featuredImageUrl && (
                                        <div className="relative">
                                            <img
                                                src={featuredImageUrl}
                                                alt="Featured"
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-2 right-2"
                                                onClick={() => {
                                                    setFeaturedImageFile(null);
                                                    setFeaturedImageUrl(null);
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Bounty Evidence (if applicable) */}
                            {currentItem.category === 'bounty' && bountyEvidence.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Bounty Evidence</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-2">
                                            {bountyEvidence.map((evidence, index) => (
                                                <img
                                                    key={index}
                                                    src={getLocalFileUrl(evidence)}
                                                    alt={`Evidence ${index + 1}`}
                                                    className="w-full h-20 object-cover rounded cursor-pointer"
                                                    onClick={() => insertImageIntoEditor({
                                                        id: Date.now() + index,
                                                        previewUrl: getLocalFileUrl(evidence),
                                                        name: `evidence-${index + 1}`
                                                    })}
                                                />
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Actions */}
                            <div className="space-y-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={isUploading}
                                    className="w-full"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                            {currentItem.status === 'published' ? 'Publishing...' : 'Saving...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            {currentItem.status === 'published' ? 'PUBLISH' : 'SAVE'}
                                        </>
                                    )}
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/admin/news-editor')}
                                    className="w-full"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
            </div>
        </>
    );
};

export default NewsEditorPage;
