import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const AttachmentItem = ({ file, onDownload }) => {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);
  const isImage = file.name?.match(/\.(jpeg|jpg|gif|png|webp)$/i);

  useEffect(() => {
    let isMounted = true;
    const generateUrl = async () => {
      if (!file.path) {
        setError('File path is missing.');
        return;
      }
      const { data, error: urlError } = await supabase.storage
        .from('wb-evidence')
        .createSignedUrl(file.path, 3600); // 1 hour expiry

      if (!isMounted) return;
      if (urlError) {
        console.error(`Error generating signed URL for ${file.path}:`, urlError);
        setError('Could not load preview.');
      } else {
        setUrl(data.signedUrl);
      }
    };

    if (isImage) {
      generateUrl();
    }
    
    return () => { isMounted = false; };
  }, [file, isImage]);

  return (
    <div className="border p-2 my-2">
      {isImage && url && (
        <img src={url} alt={`Preview of ${file.name}`} className="w-full h-auto object-cover mb-2" />
      )}
      {isImage && !url && !error && (
         <div className="w-full h-24 bg-muted flex items-center justify-center text-sm">Loading preview...</div>
      )}
      {error && (
        <div className="w-full h-24 bg-muted flex items-center justify-center text-sm text-destructive">{error}</div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-sm truncate pr-2">{file.name || 'Unnamed file'}</span>
        <Button size="sm" variant="outline" onClick={() => onDownload(file)}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
};

export default AttachmentItem;