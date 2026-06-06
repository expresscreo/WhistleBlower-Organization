# AI Agent Prompt: AVIF Image Converter & Upload System

Copy and paste the **Prompt** section below to your AI coding assistant to implement the HeySpender-style **image-to-AVIF converter + Supabase Storage upload pipeline** on the **Whistleblower app** (or any Next.js + Supabase project).

---

## Prompt

```
Implement a full image conversion and upload system for this app. Images uploaded by users should be converted server-side to AVIF format (60–80% smaller), optionally resized, stored in Supabase Storage, and return a public URL for use in forms and database records.

Match the architecture, behavior, and API contract from the HeySpender reference implementation below.

---

## Goals

1. **Server-side AVIF conversion** via Sharp (not client-side canvas conversion)
2. **Supabase Storage upload** with organized folder paths
3. **Reusable client service** that all image upload flows call (reports, attachments, profile photos, etc.)
4. **Feature flag** to toggle AVIF storage vs legacy fallback (Data URL or direct upload)
5. **Optional standalone `/image-converter` page** for manual conversion/testing
6. **Graceful fallback** if AVIF conversion or upload fails

---

## Stack assumptions

- Next.js App Router (13+)
- React 18+
- Supabase (`@supabase/supabase-js`)
- Tailwind CSS for UI
- TypeScript or JavaScript (match the target project)

---

## Step 1 — Install dependency

```bash
npm install sharp
```

Sharp must run **only on the server** (API route). Do not import it in client components.

---

## Step 2 — Environment variables

Add to `.env.local` (adjust names to match the Whistleblower project if different):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Enable AVIF + Supabase Storage pipeline
NEXT_PUBLIC_USE_AVIF_STORAGE=true
```

**Important:**
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** — used by `/api/upload-image` to bypass RLS for uploads initiated from the API route.
- Never expose the service role key to the browser.
- Restart the dev server after changing env vars.

---

## Step 3 — Supabase Storage bucket setup

Create a **public** storage bucket (rename for Whistleblower; HeySpender uses `HeySpender Media`):

| Setting | Value |
|---------|-------|
| Bucket name | `Whistleblower Media` (or match existing bucket) |
| Public | Yes (for public URLs via `getPublicUrl`) |

Suggested folder structure inside the bucket:

```
Whistleblower Media/
├── report-evidence/     # Images attached to whistleblower reports
├── attachments/         # General file attachments
├── profile/             # User profile images (optional)
└── General/             # Fallback / manual converter uploads
```

**RLS policies (minimum):**
- Allow **public read** on objects in the bucket (or scoped read if reports are sensitive — see Security notes below).
- Allow **authenticated users** to upload under paths that include their user ID, OR rely on the service-role API route for all uploads (HeySpender uses the API route approach).

If the Whistleblower app handles sensitive evidence, consider:
- Private bucket + signed URLs instead of public URLs
- Authenticated-only read policies
- Server-side validation of `userId` against the session before upload

Adapt storage visibility to the app's security model; the reference code assumes **public URLs**.

---

## Step 4 — API route: `POST /api/upload-image`

Create `src/app/api/upload-image/route.js` (or `.ts`).

### Request

- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  | Field | Required | Description |
  |-------|----------|-------------|
  | `file` | Yes | Image file (PNG, JPG, JPEG, WEBP, etc.) |
  | `userId` | Yes | User ID or namespace prefix for filename (e.g. auth user UUID, or `"upload"` for anonymous converter page) |
  | `folder` | No | Subfolder in bucket (default: `General`) |

### Validation

- Reject if no file → 400 `{ success: false, error: 'No file provided' }`
- Reject if no userId → 400
- Reject if `!file.type.startsWith('image/')` → 400
- Reject if file size > **10MB** → 400

### Processing pipeline

1. Read file into a `Buffer`
2. Use `sharp(buffer).metadata()` to get width/height
3. If width or height > **1920**, resize with `fit: 'inside'`, `withoutEnlargement: true`
4. Convert to AVIF:
   - `quality: 50` (aggressive compression; range 0–100)
   - `effort: 9` (max compression effort; range 0–9)
   - `chromaSubsampling: '4:2:0'`
5. Always use AVIF output (even if slightly larger than original — rare)
6. Generate filename: `{userId}-{timestamp}-{random6}.{avif}`
7. Upload to `{folder}/{filename}` in the storage bucket
8. Return public URL via `supabase.storage.from(BUCKET).getPublicUrl(filePath)`

### Response (success)

```json
{
  "success": true,
  "url": "https://...supabase.co/storage/v1/object/public/Whistleblower%20Media/report-evidence/user-123-1710000000000-abc123.avif",
  "originalSize": 2048000,
  "compressedSize": 412000,
  "savings": 80,
  "format": "avif",
  "folder": "report-evidence"
}
```

### Response (error)

```json
{
  "success": false,
  "error": "Upload failed: ..."
}
```

Status: 400 for validation errors, 500 for server errors.

### Health check: `GET /api/upload-image`

Return `{ status: 'ok', message: '...', bucket, avifQuality, avifEffort }` for debugging.

### Reference implementation (HeySpender)

```javascript
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STORAGE_BUCKET = 'Whistleblower Media'; // ← rename for target app

const AVIF_QUALITY = 50;
const AVIF_EFFORT = 9;
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');
    const folder = formData.get('folder') || 'General';

    if (!file) {
      return Response.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    if (!userId) {
      return Response.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return Response.json({ success: false, error: 'File must be an image' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json({ success: false, error: 'File size must be less than 10MB' }, { status: 400 });
    }

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
    const filePath = `${folder}/${userId}-${timestamp}-${randomStr}.avif`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, avifBuffer, {
        contentType: 'image/avif',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return Response.json({
      success: true,
      url: urlData.publicUrl,
      originalSize,
      compressedSize,
      savings,
      format: 'avif',
      folder,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    status: 'ok',
    message: 'AVIF Image Upload API is running',
    bucket: STORAGE_BUCKET,
    avifQuality: AVIF_QUALITY,
    avifEffort: AVIF_EFFORT,
  });
}
```

---

## Step 5 — Client storage service: `src/lib/supabaseStorageService.js`

Create a module that all upload UIs and form handlers import. It routes based on `NEXT_PUBLIC_USE_AVIF_STORAGE`.

### Feature flag

```javascript
const USE_AVIF_STORAGE = process.env.NEXT_PUBLIC_USE_AVIF_STORAGE === 'true';
const STORAGE_BUCKET = 'Whistleblower Media';
```

### Core function: `uploadImage(file, userId, folder = 'General')`

1. Validate: image type, max 10MB
2. If `USE_AVIF_STORAGE === true`:
   - Build `FormData` with `file`, `userId`, `folder`
   - `POST /api/upload-image`
   - On success, return `result.url`
   - On failure, **fallback** to legacy method (see below)
3. If flag is false:
   - Use legacy `uploadAsDataURL` (base64) OR direct Supabase client upload — match what the app already uses

### Legacy fallback: `uploadAsDataURL(file, userId)`

Read file with `FileReader.readAsDataURL` and return the data URL string. This keeps the app working if AVIF is disabled or the API fails.

### Direct upload (optional, for non-AVIF files)

Some file types (e.g. purchase proofs) may skip AVIF and upload raw via the Supabase client:

```javascript
async function uploadDirectToStorage(file, userId, folder) {
  const filePath = generateFileName(file, userId, folder);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
```

### Folder-specific helpers

Export convenience wrappers (rename folders for Whistleblower):

```javascript
export async function uploadReportEvidence(file, userId) {
  return uploadImage(file, userId, 'report-evidence');
}

export async function uploadAttachment(file, userId) {
  return uploadImage(file, userId, 'attachments');
}

export async function uploadProfileImage(file, userId) {
  return uploadImage(file, userId, 'profile');
}
```

### Delete helpers

```javascript
export async function deleteImage(imageUrl) {
  if (!imageUrl) return false;
  if (imageUrl.startsWith('data:')) return true; // nothing to delete server-side

  if (USE_AVIF_STORAGE && imageUrl.includes(STORAGE_BUCKET)) {
    const filePath = imageUrl.split(`${STORAGE_BUCKET}/`)[1]?.split('?')[0];
    if (!filePath) return false;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
    return !error;
  }
  return true;
}

export async function getStorageMode() {
  return USE_AVIF_STORAGE ? 'avif' : 'data-url';
}
```

Export as `supabaseStorageService` object for barrel imports.

---

## Step 6 — Wire into existing upload forms

Wherever the app currently uploads images (report submission, evidence attachment, profile edit):

### Before (typical anti-pattern)

```javascript
// Direct base64 or raw upload scattered in components
const reader = new FileReader();
reader.onload = () => saveToDatabase(reader.result);
```

### After (centralized)

```javascript
import { supabaseStorageService } from '@/lib/supabaseStorageService';

const handleUpload = async (file) => {
  const userId = user.id; // from auth context
  const url = await supabaseStorageService.uploadReportEvidence(file, userId);
  // Save `url` to your database column (e.g. reports.evidence_url)
  return url;
};
```

### Example: reusable upload field pattern

If the app has an image upload field component, pass `onUpload`:

```jsx
<ImageUploadField
  label="Evidence photo"
  value={evidenceUrl}
  onChange={setEvidenceUrl}
  onUpload={(file) => supabaseStorageService.uploadReportEvidence(file, user.id)}
/>
```

The field should:
- Show preview (blob URL while uploading, then final URL)
- Show loading state during upload
- Validate file type and size client-side before calling the service
- Handle errors with user-visible messages

---

## Step 7 — Standalone image converter page (optional)

Create `src/app/image-converter/page.tsx` — a public or admin-only tool to manually convert images and copy the resulting URL.

### UX flow

1. User selects image (PNG, JPG, WEBP; max 10MB)
2. Show preview + file metadata (name, size, type)
3. "Convert to AVIF" button → calls `POST /api/upload-image` with `userId: 'upload'`, `folder: 'General'`
4. On success:
   - Before/after size comparison
   - Side-by-side preview (original blob URL vs converted AVIF URL)
   - Savings percentage banner
   - Copyable public URL field
   - Download link + "Convert another" reset

### Client fetch pattern

```javascript
const formData = new FormData();
formData.append('file', selectedFile);
formData.append('userId', 'upload');
formData.append('folder', 'General');

const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
const data = await response.json();

if (!response.ok || !data.success) {
  throw new Error(data.error || 'Conversion failed');
}

// data.url, data.originalSize, data.compressedSize, data.savings
```

Use the app's existing `Button` component with a `loading` prop during conversion.

---

## Step 8 — Security hardening (recommended for Whistleblower)

The reference HeySpender route trusts `userId` from the client. For a whistleblower app, **enhance the API route**:

1. **Authenticate the request** — read session/JWT from cookies or `Authorization` header
2. **Ignore client-supplied `userId`** — use the authenticated user's ID from the session
3. **Validate folder** — allowlist folders (`report-evidence`, `attachments`, `General`); reject arbitrary paths
4. **Rate limit** uploads per user/IP
5. **Consider private bucket + signed URLs** if evidence must not be publicly enumerable
6. **Strip EXIF metadata** — Sharp can do this implicitly on re-encode; document that GPS/camera metadata is removed (important for whistleblower safety)

Example auth guard (pseudocode — adapt to your auth):

```javascript
const session = await getSession(request);
if (!session?.user?.id) {
  return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
const userId = session.user.id;
const allowedFolders = ['report-evidence', 'attachments', 'General'];
if (!allowedFolders.includes(folder)) {
  return Response.json({ success: false, error: 'Invalid folder' }, { status: 400 });
}
```

---

## Step 9 — Testing checklist

### API health

```bash
curl http://localhost:3000/api/upload-image
# Expect: { "status": "ok", ... }
```

### Manual upload test

1. Set `NEXT_PUBLIC_USE_AVIF_STORAGE=true` in `.env.local`
2. Restart dev server
3. Visit `/image-converter` (or `/upload-test` if you add one)
4. Upload a large JPG (2–5MB)
5. Verify:
   - Response includes `success: true` and a `.avif` URL
   - `savings` is typically 50–85%
   - Image loads in browser from Supabase public URL
   - File appears in Supabase Dashboard → Storage → bucket → folder
   - Browser console shows `Storage mode: AVIF + Supabase Storage`

### Feature flag rollback

1. Set `NEXT_PUBLIC_USE_AVIF_STORAGE=false`
2. Restart server
3. Upload again — should use legacy Data URL (or direct upload) with no API call

### Integration test

1. Submit a report/form with an image attachment
2. Confirm the saved database value is an `https://` Supabase URL ending in `.avif`
3. Confirm the image renders on view/edit screens

---

## Architecture diagram

```
┌─────────────────┐     FormData (file, userId, folder)     ┌──────────────────────┐
│  Client UI      │ ──────────────────────────────────────► │  POST /api/upload-image │
│  (form, converter)│                                        │  (Next.js API route)    │
└────────┬────────┘                                         └──────────┬───────────┘
         │                                                              │
         │  supabaseStorageService.uploadImage()                         │ sharp: resize + AVIF
         │  (feature flag routes here)                                   │
         │                                                              ▼
         │                                                   ┌──────────────────────┐
         │◄─────────────── { url, savings, sizes } ──────────│  Supabase Storage     │
         │                                                    │  Whistleblower Media/ │
         ▼                                                    └──────────────────────┘
  Save URL to DB
  (reports, users, etc.)
```

---

## Constants reference (HeySpender defaults)

| Constant | Value | Notes |
|----------|-------|-------|
| `AVIF_QUALITY` | 50 | Lower = smaller file, more artifacts |
| `AVIF_EFFORT` | 9 | Higher = slower encode, smaller file |
| `MAX_WIDTH` / `MAX_HEIGHT` | 1920 | Resize only if exceeded |
| Max upload size | 10 MB | Client + server validation |
| Cache-Control | 31536000 (1 year) | On uploaded AVIF objects |
| Output format | Always AVIF | Consistency over size edge cases |

Tune quality/effort if whistleblower evidence needs higher fidelity (e.g. `quality: 65`).

---

## Do NOT

- Import `sharp` in client components (`"use client"` files)
- Expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Store base64 image blobs in Postgres when AVIF storage is enabled (use URLs)
- Skip file type / size validation on the server (client checks are not enough)
- Use arbitrary user-supplied folder paths without an allowlist (path traversal risk)

---

## Deliverables

Implement all of the following in the Whistleblower app:

1. `npm install sharp`
2. `.env.local` entries documented in README or `.env.example`
3. Supabase bucket + folder structure (document bucket name)
4. `src/app/api/upload-image/route.js` (POST + GET)
5. `src/lib/supabaseStorageService.js` with feature flag + fallback
6. Wire at least **one real form** (e.g. report evidence upload) to use `supabaseStorageService`
7. Optional: `src/app/image-converter/page.tsx` for manual testing
8. Optional: `src/app/upload-test/page.tsx` for dev QA behind auth

Match existing project conventions (TS vs JS, import aliases `@/`, UI components, auth patterns). Adapt bucket name, folder names, and security rules to the Whistleblower domain.
```

---

## Reference implementation (HeySpender)

| Piece | Location |
|-------|----------|
| AVIF upload API route | `src/app/api/upload-image/route.js` |
| Client storage service + feature flag | `src/lib/supabaseStorageService.js` |
| Standalone converter UI | `src/app/image-converter/page.tsx` |
| Dev upload test page | `src/app/upload-test/page.tsx` |
| AVIF feature flag test page | `src/app/test-avif/page.tsx` |
| Form integration (upload field) | `src/components/forms/ImageUploadField.jsx` |
| Service re-export / wrappers | `src/lib/wishlistService.js` → `imageService` |
| Sharp dependency | `package.json` → `"sharp": "^0.33.5"` |
| Env flag | `NEXT_PUBLIC_USE_AVIF_STORAGE=true` |

---

## Key code excerpts (HeySpender)

### API — AVIF conversion settings

```javascript
const AVIF_QUALITY = 50;
const AVIF_EFFORT = 9;
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;

const avifBuffer = await imageProcessor
  .avif({
    quality: AVIF_QUALITY,
    effort: AVIF_EFFORT,
    chromaSubsampling: '4:2:0',
  })
  .toBuffer();
```

### Client service — AVIF upload via API

```javascript
async function uploadWithAVIF(file, userId, folder) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  formData.append('folder', folder);

  const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
  const result = await response.json();

  if (!result.success) throw new Error(result.error || 'Upload failed');
  return result.url;
}
```

### Converter page — fetch call

```javascript
formData.append('file', selectedFile);
formData.append('userId', 'upload');
formData.append('folder', 'General');

const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
```

---

## Whistleblower-specific adaptations

When pasting the prompt, tell the agent to customize these values:

| HeySpender | Whistleblower (suggested) |
|------------|---------------------------|
| Bucket: `HeySpender Media` | `Whistleblower Media` or existing bucket name |
| Folders: `wishlist-covers`, `wishlist-items`, … | `report-evidence`, `attachments`, `profile` |
| Public URLs for all images | Consider private bucket + signed URLs for sensitive evidence |
| Client-supplied `userId` | Derive from authenticated session |
| Standalone `/image-converter` | Optional; may restrict to admin role |

---

## Usage

1. Open your AI coding assistant in the **Whistleblower** project.
2. Paste the prompt from the **Prompt** section above.
3. Add a short preamble with Whistleblower specifics, e.g.:
   - "Our bucket is already named `X`"
   - "Report evidence is stored in table `reports`, column `evidence_urls` (text array)"
   - "We use Supabase Auth; session is in `useAuth()` hook"
4. Run through the testing checklist after implementation.
5. Toggle `NEXT_PUBLIC_USE_AVIF_STORAGE=false` to verify rollback before deploying.
