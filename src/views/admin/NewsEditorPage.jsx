import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { uploadFileToLocal, getLocalFileUrl } from '@/lib/fileUtils';
import { areSameMediaPath, resolveMediaUrl } from '@/lib/mediaUtils';
import { isEvidencePathApproved, normalizePublishedEvidence } from '@/lib/publishedEvidence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError, PageErrorBanner } from '@/components/ui/form-feedback';
import { ArrowLeft, Save, Eye, Image as ImageIcon, Upload, Bold, Italic, AlignLeft, AlignCenter, AlignRight, X, Underline, Strikethrough, List, ListOrdered, Type, Quote, Pilcrow, CheckCircle, Undo, Redo, Share2 } from 'lucide-react';
import { slugify } from '@/lib/utils';
import PageHead from '@/components/PageHead';
import NavbarLoader from '@/components/admin/NavbarLoader';
import { formatNumberWithCommas } from '@/lib/utils';
import { consumeNavigationState } from '@/lib/navigation-state';
import EvidenceThumbnailGallery from '@/components/media/EvidenceThumbnailGallery';
import { isImagePath } from '@/lib/mediaUtils';
import MostWantedEditorWizard from '@/components/admin/most-wanted-editor/MostWantedEditorWizard';
import {
  EMPTY_MOST_WANTED_DETAILS,
  normalizeMostWantedDetails,
  buildMostWantedContentSnippet,
  buildMostWantedHeadline,
  ensureMostWantedReportReference,
  suggestMostWantedTitle,
} from '@/lib/mostWantedUtils';
import { validateMostWantedForSave } from '@/lib/mostWantedValidation';
import { saveNewsPost } from '@/lib/newsAdminApi';
import { formatSupabaseError } from '@/lib/supabaseErrors';
import { buildNewsPreviewPayload, validateNewsPreviewPayload } from '@/lib/newsPreview';
import {
  getNewsPreviewPath,
  openNewsPreviewWindow,
  storeNewsPreviewPayload,
} from '@/lib/newsPreviewState';
import SocialEmbedInsertDialog from '@/components/admin/news-editor/SocialEmbedInsertDialog';
import {
  createSocialEmbedElement,
  hydrateSocialEmbeds,
  insertNodeAtSelection,
  isSocialEmbedUrl,
  isTrustedEmbedIframe,
  parseSocialEmbedUrl,
  resolveSocialEmbedUrl,
} from '@/lib/socialEmbeds';

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
        status: 'published',
        featured_image: null,
        bounty_id: null,
        bounty_amount: '',
        most_wanted_details: { ...EMPTY_MOST_WANTED_DETAILS },
    });
    const [mostWantedPendingGalleryFiles, setMostWantedPendingGalleryFiles] = useState([]);
    const [featuredImageFile, setFeaturedImageFile] = useState(null);
    const [featuredImageUrl, setFeaturedImageUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [inlineImages, setInlineImages] = useState([]);
    const [editorContent, setEditorContent] = useState('');
    const [bountyEvidence, setBountyEvidence] = useState([]);
    const [publishedEvidencePaths, setPublishedEvidencePaths] = useState([]);
    const [bountyAmountVerified, setBountyAmountVerified] = useState(false);
    const [wasPublishedOnLoad, setWasPublishedOnLoad] = useState(false);
    
    // Undo/Redo state management
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isUndoRedo, setIsUndoRedo] = useState(false);
    
    const [fetchError, setFetchError] = useState('');
    const [saveFeedback, setSaveFeedback] = useState({ error: '' });
    const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
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
                category: data?.category || 'bounty',
                most_wanted_details: normalizeMostWantedDetails(data?.most_wanted_details),
            });
            setWasPublishedOnLoad(data?.status === 'published');
            setMostWantedPendingGalleryFiles([]);

            setBountyAmountVerified(Boolean(prefill));
            setPublishedEvidencePaths(normalizePublishedEvidence(data.published_evidence));
            setEditorContent(data.content || '');
            if (data.featured_image) {
                resolveMediaUrl(data.featured_image).then(setFeaturedImageUrl);
            } else {
                setFeaturedImageUrl(null);
            }
            
            if (data.bounty_id) {
                fetchBountyEvidence(data.bounty_id);
            }
            
            contentInitializedRef.current = false;
        } catch (error) {
            console.error('Error loading news post:', error);
            setFetchError('Failed to load news post');
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
        
    };

    const updateEditorContentRef = useRef(() => {});

    const removeEditorImageBlock = useCallback((wrap) => {
        if (!wrap) return;

        const img = wrap.querySelector('img');
        const imageId = img?.dataset?.imageId;

        if (imageId) {
            const id = Number(imageId);
            const image = inlineImages.find((item) => item.id === id);
            if (image?.previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(image.previewUrl);
            }
            setInlineImages((prev) => prev.filter((item) => item.id !== id));
        }

        wrap.remove();
        updateEditorContentRef.current();
    }, [inlineImages]);

    const attachInlineImageRemoveButton = useCallback(
        (wrap) => {
            if (!wrap || wrap.querySelector('.inline-image-remove')) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'inline-image-remove';
            button.setAttribute('aria-label', 'Remove image');
            button.textContent = '×';
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                removeEditorImageBlock(wrap);
            });

            wrap.insertBefore(button, wrap.firstChild);
        },
        [removeEditorImageBlock]
    );

    const wrapEditorImage = useCallback(
        (img) => {
            if (!img || img.closest('.inline-image-wrap')) return img?.parentElement;

            const wrap = document.createElement('div');
            wrap.className = 'inline-image-wrap';
            wrap.contentEditable = 'false';

            img.classList.add('inline-image');
            img.classList.remove('my-4', 'cursor-pointer');
            if (!img.className.includes('rounded-md')) {
                img.classList.add('max-w-full', 'h-auto', 'rounded-md', 'block');
            }

            const parent = img.parentNode;
            if (parent) {
                parent.insertBefore(wrap, img);
                wrap.appendChild(img);
            }

            attachInlineImageRemoveButton(wrap);
            return wrap;
        },
        [attachInlineImageRemoveButton]
    );

    const removeEditorSocialEmbedBlock = useCallback((wrap) => {
        if (!wrap) return;
        wrap.remove();
        updateEditorContentRef.current();
    }, []);

    const attachSocialEmbedRemoveButton = useCallback(
        (wrap) => {
            if (!wrap || wrap.querySelector('.social-embed-remove')) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'social-embed-remove';
            button.setAttribute('aria-label', 'Remove embed');
            button.textContent = '×';
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                removeEditorSocialEmbedBlock(wrap);
            });

            wrap.insertBefore(button, wrap.firstChild);
        },
        [removeEditorSocialEmbedBlock]
    );

    const wrapExistingEditorEmbeds = useCallback(
        (editor) => {
            if (!editor) return;

            editor.querySelectorAll('.social-embed-wrap').forEach((wrap) => {
                wrap.contentEditable = 'false';
                const existingButton = wrap.querySelector('.social-embed-remove');
                if (existingButton) existingButton.remove();
                attachSocialEmbedRemoveButton(wrap);
            });
        },
        [attachSocialEmbedRemoveButton]
    );

    const refreshEditorEmbeds = useCallback((editor) => {
        if (!editor) return;
        wrapExistingEditorEmbeds(editor);
        hydrateSocialEmbeds(editor);
    }, [wrapExistingEditorEmbeds]);

    const wrapExistingEditorImages = useCallback(
        (editor) => {
            if (!editor) return;

            editor.querySelectorAll('.inline-image-wrap').forEach((wrap) => {
                const existingButton = wrap.querySelector('.inline-image-remove');
                if (existingButton) existingButton.remove();
                attachInlineImageRemoveButton(wrap);
            });

            editor.querySelectorAll('img').forEach((img) => {
                if (img.closest('.inline-image-wrap')) return;
                if (!editor.contains(img)) return;
                img.classList.add('inline-image');
                wrapEditorImage(img);
            });

            wrapExistingEditorEmbeds(editor);
        },
        [attachInlineImageRemoveButton, wrapEditorImage, wrapExistingEditorEmbeds]
    );

    const insertImageIntoEditor = (image) => {
        const editor = editorRef.current;
        if (!editor) return;

        const wrap = document.createElement('div');
        wrap.className = 'inline-image-wrap';
        wrap.contentEditable = 'false';

        const img = document.createElement('img');
        img.src = image.previewUrl;
        img.alt = image.name;
        img.className = 'inline-image max-w-full h-auto rounded-md block';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.width = '100%';

        if (image.id) {
            img.dataset.imageId = String(image.id);
        }

        wrap.appendChild(img);
        attachInlineImageRemoveButton(wrap);

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(wrap);
            range.setStartAfter(wrap);
            range.setEndAfter(wrap);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            editor.appendChild(wrap);
        }

        updateEditorContent();
        requestAnimationFrame(() => {
            if (editorRef.current) refreshEditorEmbeds(editorRef.current);
        });
    };

    const handleUseEvidenceAsFeatured = async (path, resolvedUrl) => {
        const imageUrl = resolvedUrl || (await resolveMediaUrl(path));
        setCurrentItem(prev => ({ ...prev, featured_image: path }));
        setFeaturedImageFile(null);
        setFeaturedImageUrl(imageUrl);
    };

    const handleApproveEvidenceForPublish = (path) => {
        if (isEvidencePathApproved(path, publishedEvidencePaths)) {
            return;
        }

        const canonicalPath = bountyEvidence.find((p) => areSameMediaPath(p, path)) || path;
        setPublishedEvidencePaths((prev) => [...prev, canonicalPath]);
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

    updateEditorContentRef.current = updateEditorContent;

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
                wrapExistingEditorImages(editorRef.current);
                refreshEditorEmbeds(editorRef.current);
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
                wrapExistingEditorImages(editorRef.current);
                refreshEditorEmbeds(editorRef.current);
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
        const trimmedPlain = plain?.trim();

        if (trimmedPlain && isSocialEmbedUrl(trimmedPlain)) {
            insertSocialEmbedIntoEditor(trimmedPlain);
            return;
        }

        const sanitizeHtml = (unsafeHtml) => {
            // Basic, lightweight sanitizer: removes script/style tags and event handlers
            // Allows common formatting tags and attributes like href/src
            const template = document.createElement('template');
            template.innerHTML = unsafeHtml || '';

            const disallowedTags = new Set(['SCRIPT', 'STYLE', 'OBJECT', 'EMBED', 'META', 'LINK']);

            const walk = (node) => {
                // Remove disallowed elements
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node;
                    if (disallowedTags.has(el.tagName)) {
                        if (el.tagName === 'IFRAME' && isTrustedEmbedIframe(el.getAttribute('src'))) {
                            // keep trusted social embed iframes
                        } else if (el.tagName === 'IFRAME') {
                            el.remove();
                            return;
                        } else {
                            el.remove();
                            return;
                        }
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
        requestAnimationFrame(() => {
            if (editorRef.current) {
                wrapExistingEditorImages(editorRef.current);
                refreshEditorEmbeds(editorRef.current);
            }
        });
    };

    const insertSocialEmbedIntoEditor = async (input) => {
        const editor = editorRef.current;
        if (!editor) return;

        let parsed = typeof input === 'string' ? parseSocialEmbedUrl(input) : input;
        if (!parsed) return;

        if (parsed.platform === 'facebook' || typeof input === 'string') {
            parsed = (await resolveSocialEmbedUrl(parsed)) || parsed;
        }

        const node = createSocialEmbedElement(parsed);
        if (!node) return;

        attachSocialEmbedRemoveButton(node);
        insertNodeAtSelection(editor, node);
        updateEditorContent();
        requestAnimationFrame(() => {
            if (editorRef.current) refreshEditorEmbeds(editorRef.current);
        });
    };

    // Initialize editor content when component mounts or content changes
    useEffect(() => {
        if (editorRef.current && currentItem.content && !contentInitializedRef.current) {
            editorRef.current.innerHTML = currentItem.content;
            wrapExistingEditorImages(editorRef.current);
            refreshEditorEmbeds(editorRef.current);
            setEditorContent(currentItem.content);
            contentInitializedRef.current = true;
            // Initialize history with initial content
            addToHistory(currentItem.content);
        }
    }, [currentItem.content, wrapExistingEditorImages, refreshEditorEmbeds]);

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

    const getSaveButtonLabel = () => {
        if (currentItem.status === 'draft') return 'Save draft';
        if (isEditing && wasPublishedOnLoad) return 'Update';
        return 'Publish';
    };

    const handleCategoryChange = (value) => {
        setCurrentItem((prev) => ({
            ...prev,
            category: value,
            most_wanted_details:
                value === 'most_wanted'
                    ? normalizeMostWantedDetails(prev.most_wanted_details)
                    : prev.most_wanted_details,
        }));
        if (value !== 'most_wanted') {
            setMostWantedPendingGalleryFiles([]);
        }
    };

    const handlePreview = async () => {
        setSaveFeedback({ error: '' });

        try {
            let bountyDetails = null;
            if (currentItem.category === 'bounty' && currentItem.bounty_id) {
                const { data } = await supabase
                    .from('bounties')
                    .select('bounty_amount, evidence, location, state, type_of_crime')
                    .eq('id', currentItem.bounty_id)
                    .maybeSingle();
                bountyDetails = data;
            }

            const editorHtml =
                currentItem.category === 'most_wanted'
                    ? null
                    : editorRef.current?.innerHTML ?? currentItem.content ?? editorContent;

            const previewPayload = await buildNewsPreviewPayload({
                currentItem,
                editorHtml,
                featuredImageUrl,
                featuredImageFile,
                pendingGalleryFiles: mostWantedPendingGalleryFiles,
                publishedEvidencePaths,
                bountyDetails,
            });

            const validationError = validateNewsPreviewPayload(previewPayload);
            if (validationError) {
                setSaveFeedback({ error: validationError });
                return;
            }

            const previewId = storeNewsPreviewPayload(previewPayload);
            const previewWindow = openNewsPreviewWindow(previewId, previewPayload);

            if (!previewWindow) {
                router.push(getNewsPreviewPath(previewId));
            }
        } catch (error) {
            console.error('Preview failed:', error);
            const message =
                error?.name === 'QuotaExceededError'
                    ? 'Preview content is too large to store locally. Remove some inline images and try again.'
                    : error?.message || 'Could not open preview. Please try again.';
            setSaveFeedback({ error: message });
        }
    };

    const handleSave = async () => {
        setSaveFeedback({ error: '' });

        const isMostWanted = currentItem.category === 'most_wanted';

        if (isMostWanted) {
            const validation = validateMostWantedForSave({
                details: currentItem.most_wanted_details,
                title: currentItem.title,
                hasFeaturedImage: Boolean(featuredImageUrl || currentItem.featured_image),
            });
            if (!validation.valid) {
                const message = [validation.title, validation.description].filter(Boolean).join(': ');
                setSaveFeedback({ error: message });
                return;
            }
        } else if (!currentItem.title.trim()) {
            setSaveFeedback({ error: 'Title is required' });
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
                        const localImageUrl = await resolveMediaUrl(uploadedFilePath);
                        
                        if (!localImageUrl) continue;

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

            let galleryEvidencePaths = [...publishedEvidencePaths];

            if (isMostWanted && mostWantedPendingGalleryFiles.length > 0) {
                const subfolder = currentItem.id || slugify(currentItem.title) || 'new';
                for (const file of mostWantedPendingGalleryFiles) {
                    try {
                        const path = await uploadFileToLocal(file, 'news', subfolder);
                        galleryEvidencePaths.push(path);
                    } catch (e) {
                        console.error('Most wanted gallery upload failed:', e);
                    }
                }
                setMostWantedPendingGalleryFiles([]);
            }

            const mostWantedDetails = isMostWanted
                ? ensureMostWantedReportReference(currentItem.most_wanted_details)
                : null;

            const resolvedTitle = isMostWanted
                ? buildMostWantedHeadline(mostWantedDetails) || suggestMostWantedTitle(mostWantedDetails)
                : currentItem.title;

            const resolvedContent = isMostWanted
                ? buildMostWantedContentSnippet(resolvedTitle, mostWantedDetails)
                : finalContent;

            const newsData = {
                title: resolvedTitle,
                content: resolvedContent,
                category: currentItem.category,
                status: currentItem.status,
                featured_image: featuredImagePath,
                bounty_id: currentItem.bounty_id,
                most_wanted_details: isMostWanted ? mostWantedDetails : null,
                published_evidence:
                    currentItem.category === 'bounty' || isMostWanted ? galleryEvidencePaths : [],
                updated_at: new Date().toISOString(),
            };

            const saveResult = await saveNewsPost({
                id: isEditing ? id : undefined,
                payload: newsData,
            });

            if (saveResult?.warnings?.length) {
                setSaveFeedback({ error: saveResult.warnings.join(' ') });
            }

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

            router.push('/admin/news-editor');
        } catch (error) {
            console.error('Error saving news post:', error);
            setSaveFeedback({ error: `Failed to save news post: ${formatSupabaseError(error)}` });
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return <NavbarLoader />;
    }

    return (
        <>
            <PageHead title={`${isEditing ? 'Edit' : 'Create'} News Post — WhistleBlower.ng`} />
            
            
                <PageErrorBanner error={fetchError} title="Could not load news post" />
                <FieldError message={saveFeedback.error} />
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

                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
                        {/* Main Editor */}
                        <div className="min-w-0 lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {currentItem.category === 'most_wanted' ? 'Most Wanted Alert' : 'Content'}
                                    </CardTitle>
                                    <CardDescription>
                                        {currentItem.category === 'most_wanted'
                                            ? 'Complete each step to build a structured wanted alert'
                                            : 'Write and format your news content'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {currentItem.category === 'most_wanted' ? (
                                        <MostWantedEditorWizard
                                            title={currentItem.title}
                                            onTitleChange={(title) =>
                                                setCurrentItem((prev) => ({ ...prev, title }))
                                            }
                                            details={currentItem.most_wanted_details}
                                            onDetailsChange={(most_wanted_details) =>
                                                setCurrentItem((prev) => ({ ...prev, most_wanted_details }))
                                            }
                                            featuredImageUrl={featuredImageUrl}
                                            onFeaturedFileSelect={handleFileSelect}
                                            onFeaturedRemove={() => {
                                                setFeaturedImageFile(null);
                                                setFeaturedImageUrl(null);
                                                setCurrentItem((prev) => ({ ...prev, featured_image: null }));
                                            }}
                                            galleryPaths={publishedEvidencePaths}
                                            onGalleryPathsChange={setPublishedEvidencePaths}
                                            pendingGalleryFiles={mostWantedPendingGalleryFiles}
                                            onPendingGalleryFilesChange={setMostWantedPendingGalleryFiles}
                                        />
                                    ) : (
                                    <>
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

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEmbedDialogOpen(true)}
                                                    disabled={isUploading}
                                                    title="Embed YouTube, X, Facebook, or TikTok video"
                                                >
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
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
                                            Tip: Use the × on an image or embed to remove it from the content. You can also paste a public YouTube, X, Facebook, or TikTok URL directly into the editor.
                                        </p>

                                        <SocialEmbedInsertDialog
                                            open={embedDialogOpen}
                                            onOpenChange={setEmbedDialogOpen}
                                            onInsert={insertSocialEmbedIntoEditor}
                                        />
                                    </div>
                                    </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar — sticky while scrolling the editor */}
                        <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:z-10 lg:max-h-[calc(100vh-5rem)]">
                            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain lg:pr-1">
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
                                            onValueChange={handleCategoryChange}
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
                                                <SelectItem value="published">Published</SelectItem>
                                                <SelectItem value="draft">Draft</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Featured Image — news posts; Most Wanted uses wizard media step */}
                            {currentItem.category !== 'most_wanted' &&
                                (currentItem.category !== 'bounty' || !currentItem.bounty_id) && (
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
                                                        setCurrentItem(prev => ({ ...prev, featured_image: null }));
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Bounty evidence from linked bounty */}
                            {currentItem.category === 'bounty' && currentItem.bounty_id && (
                                <Card className="overflow-hidden border-primary/20 shadow-sm">
                                    <CardHeader className="space-y-1 border-b bg-primary/5 pb-4">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <ImageIcon className="h-4 w-4 text-primary" />
                                            Bounty Photos
                                        </CardTitle>
                                        <CardDescription className="text-xs leading-relaxed">
                                            Images from the Bounty Setter. Set a cover image, or approve photos for the public bounty gallery on the post page.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <EvidenceThumbnailGallery
                                            variant="editor"
                                            paths={bountyEvidence}
                                            title=""
                                            featuredPath={currentItem.featured_image}
                                            insertedPaths={publishedEvidencePaths}
                                            onSelectFeatured={handleUseEvidenceAsFeatured}
                                            onInsertContent={handleApproveEvidenceForPublish}
                                            showOtherAttachments={bountyEvidence.some((path) => !isImagePath(path))}
                                        />
                                    </CardContent>
                                </Card>
                            )}
                            </div>

                            {/* Actions — pinned to bottom of sticky sidebar */}
                            <div className="shrink-0 space-y-2 border-t border-border bg-background/95 pt-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handlePreview}
                                        disabled={isUploading}
                                        className="flex-1"
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        Preview
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={handleSave}
                                        loading={isUploading}
                                        className="flex-1"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {getSaveButtonLabel()}
                                    </Button>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/admin/news-editor')}
                                    className="w-full"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </aside>
                    </div>
            </div>
        </>
    );
};

export default NewsEditorPage;
