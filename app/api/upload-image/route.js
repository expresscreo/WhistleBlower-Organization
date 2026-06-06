import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { publicEnv, serverEnv } from '@/lib/env';
import { getBucketForFolder } from '@/lib/storageBuckets';

export const runtime = 'nodejs';

const AVIF_QUALITY = 50;
const AVIF_EFFORT = 9;
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FOLDERS = ['report-evidence', 'attachments', 'profile', 'General'];
const REPORT_FOLDER_PATTERN = /^reports\/[a-f0-9-]{36}$/i;
const CATEGORY_FOLDER_PATTERN = /^(news|bounties|general)(\/[a-zA-Z0-9._-]+)*$/i;

function isAllowedFolder(folder) {
  if (!folder || folder.includes('..')) return false;
  return (
    ALLOWED_FOLDERS.includes(folder) ||
    REPORT_FOLDER_PATTERN.test(folder) ||
    CATEGORY_FOLDER_PATTERN.test(folder)
  );
}

function getSupabaseAdmin() {
  const serviceKey = serverEnv.supabaseServiceRoleKey;
  const key = serviceKey || publicEnv.supabaseAnonKey;
  return createClient(publicEnv.supabaseUrl, key);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');
    const folder = formData.get('folder') || 'General';

    if (!file || typeof file === 'string') {
      return Response.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    if (!userId || typeof userId !== 'string') {
      return Response.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return Response.json({ success: false, error: 'File must be an image' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 },
      );
    }
    if (!isAllowedFolder(folder)) {
      return Response.json({ success: false, error: 'Invalid folder' }, { status: 400 });
    }

    const storageBucket = getBucketForFolder(folder);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const metadata = await sharp(buffer).metadata();
    let imageProcessor = sharp(buffer);

    if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
      imageProcessor = imageProcessor.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const avifBuffer = await imageProcessor
      .avif({
        quality: AVIF_QUALITY,
        effort: AVIF_EFFORT,
        chromaSubsampling: '4:2:0',
      })
      .toBuffer();

    const originalSize = buffer.length;
    const compressedSize = avifBuffer.length;
    const savings = Math.round((1 - compressedSize / originalSize) * 100);

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
    const filePath = `${folder}/${safeUserId}-${timestamp}-${randomStr}.avif`;

    const supabase = getSupabaseAdmin();
    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(filePath, avifBuffer, {
        contentType: 'image/avif',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from(storageBucket).getPublicUrl(filePath);

    return Response.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      bucket: storageBucket,
      originalSize,
      compressedSize,
      savings,
      format: 'avif',
      folder,
    });
  } catch (error) {
    console.error('AVIF upload error:', error);
    return Response.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({
    status: 'ok',
    message: 'AVIF Image Upload API is running',
    publicBucket: getBucketForFolder('news'),
    privateBucket: getBucketForFolder('reports/example'),
    avifQuality: AVIF_QUALITY,
    avifEffort: AVIF_EFFORT,
  });
}
