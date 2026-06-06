import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/form-feedback';
import { 
    Facebook, 
    Twitter, 
    Linkedin, 
    MessageCircle, 
    Link as LinkIcon,
    Share2,
    Copy,
    Check
} from 'lucide-react';

const SocialShare = ({ 
    title, 
    url, 
    description = '', 
    hashtags = [],
    className = '' 
}) => {
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState('');

    // Ensure we have a full URL
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    
    // Create share text with hashtags
    const shareText = `${title}${description ? ` - ${description}` : ''}${hashtags.length > 0 ? ` ${hashtags.map(tag => `#${tag}`).join(' ')}` : ''}`;
    
    // Social media share URLs
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + fullUrl)}`
    };

    const handleShare = (platform) => {
        const shareUrl = shareUrls[platform];
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    };

    const handleCopyLink = async () => {
        setCopyError('');
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            setCopyError('Could not copy the link to clipboard.');
        }
    };

    const shareButtons = [
        {
            id: 'whatsapp',
            name: 'WhatsApp',
            icon: MessageCircle,
            color: 'bg-green-600 hover:bg-green-700',
            onClick: () => handleShare('whatsapp')
        },
        {
            id: 'copy-link',
            name: copied ? 'Copied' : 'Copy Link',
            icon: copied ? Check : Copy,
            color: 'bg-gray-600 hover:bg-gray-700',
            onClick: handleCopyLink
        },
        {
            id: 'facebook',
            name: 'Facebook',
            icon: Facebook,
            color: 'bg-blue-600 hover:bg-blue-700',
            onClick: () => handleShare('facebook')
        },
        {
            id: 'twitter',
            name: 'Twitter',
            icon: Twitter,
            color: 'bg-sky-500 hover:bg-sky-600',
            onClick: () => handleShare('twitter')
        },
        {
            id: 'linkedin',
            name: 'LinkedIn',
            icon: Linkedin,
            color: 'bg-blue-700 hover:bg-blue-800',
            onClick: () => handleShare('linkedin')
        },
    ];

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Share2 className="h-4 w-4" />
                <span>Share this post</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {shareButtons.map((button) => {
                    const Icon = button.icon;
                    return (
                        <Button
                            key={button.id}
                            variant="outline"
                            size="sm"
                            onClick={button.onClick}
                            className={`${button.color} text-white border-0 hover:text-white`}
                            title={`Share on ${button.name}`}
                        >
                            <Icon className="h-4 w-4 mr-2" />
                            {button.name}
                        </Button>
                    );
                })}
            </div>
            <FieldError message={copyError} />
        </div>
    );
};

export default SocialShare;
