# Report Details PDF Export — Full Implementation Guide

This document describes how the **Download Report** PDF feature is designed and implemented in the WhistleBlower organization dashboard. Use it as a blueprint when porting the same capability to the **WhistleBlower Public Organization platform** (or any sibling product that shares the same Supabase schema).

---

## Table of Contents

1. [Overview](#overview)
2. [Design Goals & Decisions](#design-goals--decisions)
3. [Architecture](#architecture)
4. [Dependencies & Assets](#dependencies--assets)
5. [File Structure](#file-structure)
6. [Data Contract](#data-contract)
7. [PDF Layout & Visual Design](#pdf-layout--visual-design)
8. [Core Modules](#core-modules)
9. [UI Integration](#ui-integration)
10. [Step-by-Step Implementation (Public Organization Platform)](#step-by-step-implementation-public-organization-platform)
11. [Customization Guide](#customization-guide)
12. [Security & Privacy](#security--privacy)
13. [Known Limitations](#known-limitations)
14. [Testing Checklist](#testing-checklist)
15. [Troubleshooting](#troubleshooting)

---

## Overview

Authorized staff on the organization dashboard can export a single report as a **print-ready PDF** from the Report Details page. The export captures structured report content — metadata, narrative, attachment inventory, secure chat log, and activity history — without dashboard chrome, navigation, or live media embeds.

### What the PDF includes

| Section | Content |
|--------|---------|
| Cover header | Platform name, “Confidential report export”, report ID, company name, generation timestamp |
| Overview | Company, category, status, urgency, state, branch, submission date, reward eligibility, assigned staff, report type |
| Report narrative | Title + full description text |
| Voice note | Placeholder note when a voice recording exists (original stays in dashboard) |
| Attachments | Bulleted list of file names with type labels (Image, Video, Audio, PDF, File) |
| Secure communication log | Chat-style bubbles for reporter and admin messages, including reply previews |
| Activity history | Timeline of status/assignment changes |
| Footer (every page) | Confidentiality notice + page numbers |

### What the PDF deliberately excludes

- Dashboard layout, sidebar, buttons, or screenshots
- Embedded images, video frames, or audio waveforms
- Raw Supabase storage URLs or signed links
- Reporter identity when the report is anonymous (same rules as the dashboard)

### User entry point

On `/dashboard/reports/:reportId`, a **Download Report** button triggers client-side generation and saves `Report-{report_id}.pdf` via the browser download API.

---

## Design Goals & Decisions

### 1. Programmatic PDF (jsPDF), not HTML screenshot

The implementation uses **[jsPDF](https://github.com/parallax/jsPDF)** to draw the document directly in JavaScript. This was chosen over `html2canvas` + PDF because:

- **Predictable pagination** — long descriptions, chat threads, and meta grids break across pages with explicit `ensureSpace()` logic.
- **Smaller files** — text-only PDFs are lightweight compared to rasterized page images.
- **No layout drift** — export matches a fixed A4 template regardless of viewport or dark mode.
- **Confidentiality** — only selected fields are rendered; no accidental capture of UI state.

`html2canvas` remains available in the project for other features but is **not** used for report export.

### 2. Client-side generation

PDFs are built entirely in the browser after report data is already loaded on the page. Benefits:

- No new server endpoint or queue worker
- Reuses the same Supabase queries and RLS permissions as the details view
- Instant download for typical report sizes

Trade-off: very large chat histories generate synchronously on the main thread; the UI shows a loading state on the button during generation.

### 3. Brand-aligned typography

The web app uses **Space Grotesk**. PDFs register the same TTF files from `/public/fonts/` so exports visually match the product. Fonts are fetched once per session and cached in a module-level promise.

### 4. Content parity with Report Details

The PDF payload is assembled from the **same state** already fetched for `ReportDetailsPage`: `report`, `updates`, `attachments`, `voiceNote`, and `assignedUsers`. No separate API is required.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Report Details Page (React)                       │
│  fetchReportDetails() → report, updates, attachments, voiceNote,     │
│                         assignedUsers                                 │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ user clicks "Download Report"
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│              downloadReportPdf(payload)  — generateReportPdf.js       │
│  1. createPdfContext() — jsPDF instance + drawing helpers             │
│  2. ensureSpaceGroteskFonts(pdf) — load TTF from /public/fonts       │
│  3. Render sections (cover → overview → narrative → … → footers)   │
│  4. pdf.save(`Report-${report_id}.pdf`)                              │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  pdfFonts.js            attachmentUtils.js      seo/site.js
  (font registration)    (display names, types)  (SITE_NAME)
```

### Sequence

1. Page loads → Supabase fetches report graph.
2. User clicks download → `isPdfGenerating = true`.
3. `downloadReportPdf({ report, updates, attachments, voiceNote, assignedUsers })` runs.
4. `generateReportPdf` builds the document and returns a jsPDF instance.
5. `pdf.save(...)` triggers browser download.
6. `isPdfGenerating = false`; errors surface via `actionError`.

---

## Dependencies & Assets

### npm package

```json
"jspdf": "^2.5.1"
```

Install in the target platform:

```bash
npm install jspdf
```

### Static font files

Place these under `public/fonts/` (served at `/fonts/...`):

| File | Purpose |
|------|---------|
| `SpaceGrotesk-Regular.ttf` | Body text, italic fallback |
| `SpaceGrotesk-Bold.ttf` | Headings, labels, bold meta values |

Space Grotesk has no true italic cuts; jsPDF maps `italic` and `bolditalic` styles to the regular/bold files respectively (see `pdfFonts.js`).

### Shared utilities (copy or reimplement)

| Module | Role |
|--------|------|
| `src/lib/generateReportPdf.js` | PDF builder + download helper |
| `src/lib/pdfFonts.js` | One-time font registration |
| `src/lib/attachmentUtils.js` | `getAttachmentDisplayName`, `getAttachmentPreviewType` |
| `src/lib/seo/site.js` | `SITE_NAME` for cover header (customize per platform) |

---

## File Structure

```
public/
  fonts/
    SpaceGrotesk-Regular.ttf
    SpaceGrotesk-Bold.ttf

src/
  lib/
    generateReportPdf.js    # Main PDF logic
    pdfFonts.js             # Font loading for jsPDF
    attachmentUtils.js      # Filename + MIME helpers
    seo/
      site.js               # SITE_NAME constant

  views/
    dashboard/
      ReportDetailsPage.jsx # Download button + handler

app/
  dashboard/
    reports/
      [reportId]/
        page.jsx              # Next.js route wrapping ReportDetailsPage
```

---

## Data Contract

### `generateReportPdf` / `downloadReportPdf` payload

```typescript
{
  report: {
    report_id: string;           // Public-facing ID (e.g. "WB-2024-...")
    title: string;
    description: string;
    category: string;
    status: string;            // pending | under_review | assigned | ...
    urgency: string;           // critical | high | medium | low
    state: string | null;
    submitted_at: string;      // ISO timestamp
    is_anonymous: boolean;
    is_feedback: boolean;
    companies?: { company_name: string };
    company_branches?: { branch_name: string; address: string };
  };
  updates: Array<{
    id: number;
    message: string | null;
    status_update: string | null;
    timestamp: string;
    updated_by: string | null;  // null → reporter message
    updated_by_user?: { name: string };
    reply_to_message_id: number | null;
  }>;
  attachments: Array<{
    file_url: string;
    file_type?: string;
  }>;
  voiceNote: { file_url: string } | null;
  assignedUsers: Array<{ name: string }>;
}
```

### Supabase queries (from `ReportDetailsPage`)

These queries populate the payload. Reuse them on the Public Organization platform if the schema is shared.

**Report**

```javascript
supabase
  .from('reports')
  .select('*, companies(company_name), company_branches(branch_name, address)')
  .eq('report_id', reportId)
  .single();
```

**Updates (chat + activity)**

```javascript
supabase
  .from('report_updates')
  .select('*, updated_by_user:users(id, name, user_type)')
  .eq('report_id', reportData.id)
  .order('timestamp', { ascending: true });
```

**Files**

```javascript
supabase.from('files').select('*').eq('report_id', reportData.id);
```

Split voice notes from regular attachments:

```javascript
const voiceNotes = files.filter(f =>
  f.processing_type === 'voice_anonymization' ||
  f.processing_type === 'elevenlabs_voice_anonymization'
);
const regularAttachments = files.filter(f =>
  f.processing_type !== 'voice_anonymization' &&
  f.processing_type !== 'elevenlabs_voice_anonymization'
);
```

**Assignments**

```javascript
supabase
  .from('report_assignment')
  .select('user_id, assigned_user:user_id(id, name), assigned_by_user:assigned_by(id, name)')
  .eq('report_id', reportData.id);
```

### How updates are split inside the PDF

| Filter | PDF section |
|--------|-------------|
| `updates.filter(u => u.message)` | Secure communication log |
| `updates.filter(u => u.status_update)` | Activity history |

Chat bubbles treat `updated_by === null` as **Reporter**; any UUID maps to **Admin** (or `updated_by_user.name`).

---

## PDF Layout & Visual Design

### Page setup

| Constant | Value |
|----------|-------|
| Format | A4 portrait (210 × 297 mm) |
| Margins | 16 mm horizontal, 14 mm top, 20 mm bottom |
| Footer band | Y = 287 mm |
| Content bottom | Footer Y − 6 mm (pagination guard) |

### Color palette (RGB)

| Token | RGB | Usage |
|-------|-----|-------|
| `BRAND` | 67, 208, 140 | Cover bar, section accent pill, timeline dots, admin chat bubbles |
| `INK` | 15, 23, 42 | Primary text |
| `MUTED` | 100, 116, 139 | Labels, empty states, timestamps |
| `BORDER` | 226, 232, 240 | Footer rule, timeline connector |
| `SURFACE` | 248, 250, 252 | Reporter reply preview background |
| `REPORTER_BUBBLE` | 241, 245, 249 | Reporter message background |

Urgency colors are defined (`URGENCY_COLORS`) for potential badge use; the current export shows urgency as formatted text in the overview grid.

### Typography

| Element | Font | Size |
|---------|------|------|
| Cover title | Bold | 18 pt |
| Section titles | Bold | 12 pt |
| Report title | Bold | 13 pt |
| Body / meta values | Normal / Bold | 9–10 pt |
| Footer | Normal | 8 pt |

### Section rendering helpers

All drawing lives in `createPdfContext()`, which returns a small layout engine:

| Helper | Behavior |
|--------|----------|
| `ensureSpace(height)` | Adds a new page if content would cross `CONTENT_BOTTOM` |
| `drawCoverHeader(reportId, companyName)` | Full-width brand bar + metadata row |
| `drawSectionTitle(title)` | Green accent pill + bold heading |
| `drawMetaGrid(rows)` | Two-column label/value pairs with dynamic row height |
| `drawParagraph(text, options)` | Wrapped text with configurable size/color |
| `drawMessageBubble({...})` | Left/right aligned bubbles, optional reply preview |
| `drawTimelineItem({...})` | Dot + vertical line + title/subtitle/timestamp |
| `drawFooters()` | Iterates all pages; confidentiality line + `Page N of M` |

### Output filename

```
Report-{report.report_id}.pdf
```

Example: `Report-WB-2024-A1B2C3.pdf`

---

## Core Modules

### `src/lib/pdfFonts.js`

Responsible for:

1. Fetching TTF binaries from `/fonts/SpaceGrotesk-*.ttf`
2. Converting to base64 for jsPDF virtual file system
3. Registering font faces under the family name `SpaceGrotesk`
4. Caching via module-level `fontsReadyPromise` (single fetch per browser session)

```javascript
export async function ensureSpaceGroteskFonts(pdf) {
  // Loads fonts once, then pdf.setFont('SpaceGrotesk', 'normal')
}
```

**Public Organization note:** If that platform uses a different typeface, swap the TTF paths and `PDF_FONT` constant. Keep files in `public/fonts/` so `fetch()` works in both Vite and Next.js.

### `src/lib/generateReportPdf.js`

Two public exports:

```javascript
export async function generateReportPdf(payload) { /* returns jsPDF instance */ }
export async function downloadReportPdf(payload) {
  const pdf = await generateReportPdf(payload);
  pdf.save(`Report-${payload.report.report_id}.pdf`);
}
```

`generateReportPdf` is useful if you later add “email PDF” or server-side archival — call it and use `pdf.output('blob')` instead of `save()`.

### `src/lib/attachmentUtils.js`

PDF attachment lines use:

- **`getAttachmentDisplayName(file_url)`** — strips Supabase upload UUID prefix (`{uuid}-filename.ext` → `filename.ext`)
- **`getAttachmentPreviewType(file)`** — returns `image | video | audio | pdf | null` from MIME or extension

---

## UI Integration

### State

```javascript
const [isPdfGenerating, setIsPdfGenerating] = useState(false);
const [actionError, setActionError] = useState('');
```

### Handler

```javascript
const handleDownloadReportPdf = async () => {
  setIsPdfGenerating(true);
  setActionError('');
  try {
    await downloadReportPdf({
      report,
      updates,
      attachments,
      voiceNote,
      assignedUsers,
    });
  } catch (error) {
    setActionError(error.message || 'Could not generate PDF.');
  } finally {
    setIsPdfGenerating(false);
  }
};
```

### Button (with loading indicator)

```jsx
<Button
  variant="outline"
  size="sm"
  onClick={handleDownloadReportPdf}
  loading={isPdfGenerating}
>
  <Download className="mr-2 h-4 w-4" />
  Download Report
</Button>
```

Place the button in the Report Details header actions alongside delete/restore controls.

### Next.js / SSR considerations

- `generateReportPdf.js` imports `jspdf` and uses `fetch` + `btoa` — **browser only**.
- Keep the download handler in a `'use client'` component (`ReportDetailsPage.jsx` already uses `'use client'`).
- If the build warns about jsPDF during SSR, dynamically import:

```javascript
const { downloadReportPdf } = await import('@/lib/generateReportPdf');
await downloadReportPdf(payload);
```

---

## Step-by-Step Implementation (Public Organization Platform)

Follow this checklist when adding the feature to a sibling codebase.

### Phase 1 — Assets & dependencies

- [ ] `npm install jspdf`
- [ ] Copy `public/fonts/SpaceGrotesk-Regular.ttf` and `SpaceGrotesk-Bold.ttf`
- [ ] Copy `src/lib/pdfFonts.js`
- [ ] Copy `src/lib/attachmentUtils.js` (or ensure equivalent helpers exist)
- [ ] Copy `src/lib/generateReportPdf.js`

### Phase 2 — Platform branding

- [ ] Update `SITE_NAME` import in `generateReportPdf.js` to the Public Organization product name
- [ ] Optionally adjust `BRAND` RGB values to match that platform’s primary color
- [ ] Update footer confidentiality string if legal copy differs

### Phase 3 — Data wiring

- [ ] Ensure Report Details page fetches the same Supabase relations (`companies`, `company_branches`, `report_updates`, `files`, `report_assignment`)
- [ ] Split voice notes from attachments using `processing_type` filters
- [ ] Map assignments to `assignedUsers: [{ name }]`

### Phase 4 — UI

- [ ] Import `downloadReportPdf` in the report details view
- [ ] Add download button + `isPdfGenerating` loading state
- [ ] Surface errors in existing page error banner / toast pattern

### Phase 5 — Access control

- [ ] Restrict the download button to roles that can view full report details (same RLS as dashboard)
- [ ] Do **not** expose PDF export on public/anonymous track-report pages unless product requirements explicitly allow it

### Phase 6 — Verification

- [ ] Run through the [Testing Checklist](#testing-checklist) below

---

## Customization Guide

### Change platform name on cover

Edit the import in `generateReportPdf.js`:

```javascript
import { SITE_NAME } from '@/lib/seo/site';
```

For the Public Organization platform, point this at that product’s site config constant.

### Change primary green

Update `BRAND` and `ADMIN_BUBBLE` in `generateReportPdf.js`:

```javascript
const BRAND = { r: 67, g: 208, b: 140 };
```

### Add/remove overview fields

Edit the array passed to `drawMetaGrid()` inside `generateReportPdf`. Each entry is `{ label, value }`. The grid renders two columns per row.

### Add embedded attachment thumbnails (advanced)

Not implemented today. Would require:

1. Downloading blobs from Supabase storage (similar to `handleDownloadAttachment`)
2. Converting images to base64
3. Calling `pdf.addImage()` with explicit width/height and pagination

Consider file size and generation time before adding this.

### Server-side PDF generation (future)

If client-side generation becomes insufficient:

1. Move `generateReportPdf` logic to a Node service (jsPDF works in Node with font buffers instead of `fetch`)
2. Or use Puppeteer/Playwright with an HTML template
3. Return `application/pdf` from an authenticated API route

The current payload contract can remain unchanged.

---

## Security & Privacy

| Topic | Approach |
|-------|----------|
| Authorization | PDF uses data already fetched under Supabase RLS; no bypass |
| Anonymous reporters | Overview shows reward eligibility, not identity |
| Voice notes | PDF mentions existence only; audio stays in secure dashboard |
| Attachments | Filenames only — no URLs that could leak storage paths in shared PDFs |
| Confidentiality | Footer: “Confidential — for authorized internal use only” |
| Client-only | No PDF uploaded to server; reduces retention risk |

**Recommendation for Public Organization:** Keep export **staff-only**. If compliance requires audit logs, log `{ user_id, report_id, timestamp }` in an `export_events` table when download succeeds.

---

## Known Limitations

1. **No binary embeds** — Images, PDFs, video, and audio are listed by name/type only.
2. **Voice note** — Text placeholder; playback requires the dashboard.
3. **Main-thread work** — Reports with hundreds of chat messages may briefly block UI; mitigated by button loading state.
4. **Locale** — Dates use `toLocaleString(undefined, …)` (browser locale), not a fixed `en-NG` formatter.
5. **Status labels** — Known statuses map to friendly labels; unknown statuses are title-cased from snake_case.
6. **Reply preview truncation** — Parent message previews cap at 120 characters in chat bubbles.
7. **Font failure** — If TTF fetch fails, generation throws “Could not load report fonts.”

---

## Testing Checklist

### Functional

- [ ] Download succeeds for a minimal report (title + description only)
- [ ] Overview shows correct company, branch, status, urgency, assigned staff
- [ ] Anonymous vs identified reports show correct reward eligibility
- [ ] Customer feedback vs whistleblower report type label is correct
- [ ] Attachments list shows human-readable names (UUID prefix stripped)
- [ ] Attachment type labels match file MIME/extension
- [ ] Chat section renders reporter (left) and admin (right) bubbles
- [ ] Reply threading shows “Replying to earlier message” preview
- [ ] Activity history lists `status_update` entries with actor name
- [ ] Voice note section appears only when `voiceNote` is set
- [ ] Multi-page reports paginate correctly; footers show accurate page counts
- [ ] Filename matches `Report-{report_id}.pdf`

### Error handling

- [ ] Missing fonts → user-visible error
- [ ] Button shows loading state during generation
- [ ] Double-click does not produce corrupt downloads (loading disables interaction if Button supports it)

### Cross-browser

- [ ] Chrome / Edge (desktop)
- [ ] Safari (desktop + iOS) — verify font fetch and download
- [ ] Firefox

### Access

- [ ] User without report access cannot fetch data (RLS) — button should never receive valid payload
- [ ] Export not shown on unauthorized roles (if you gate the button)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| “Could not load report fonts.” | TTF missing or wrong path | Ensure files exist at `public/fonts/` and are deployed |
| PDF uses Helvetica instead of Space Grotesk | `ensureSpaceGroteskFonts` not awaited | Always `await ensureSpaceGroteskFonts(pdf)` before drawing |
| Blank PDF | jsPDF running on server | Guard with `'use client'` or dynamic import |
| Garbled attachment names | Missing `decodeURIComponent` | Use `getAttachmentDisplayName` |
| Chat shows all updates in activity | Wrong filter | Activity uses `status_update`; chat uses `message` |
| Build error: `btoa` / `window` | SSR importing jsPDF | Dynamic import inside click handler |
| Huge PDF / slow generation | Very long chat history | Consider pagination limits or server-side export |

---

## Reference — Key source files

| File | Responsibility |
|------|----------------|
| `src/lib/generateReportPdf.js` | Layout engine, section content, `downloadReportPdf` |
| `src/lib/pdfFonts.js` | Space Grotesk registration for jsPDF |
| `src/lib/attachmentUtils.js` | Display names and preview types |
| `src/views/dashboard/ReportDetailsPage.jsx` | Data fetch, download handler, UI button |
| `app/dashboard/reports/[reportId]/page.jsx` | Next.js route + metadata |
| `public/fonts/*.ttf` | Embedded typefaces |

---

## Summary

The report PDF export is a **client-side, template-driven document generator** built with jsPDF. It mirrors Report Details content in a fixed A4 layout, uses the product typeface, and downloads immediately without server round-trips. Porting to the WhistleBlower Public Organization platform is primarily a **copy-and-brand** exercise: reuse the three lib modules, wire the same Supabase payload on your details page, and adjust `SITE_NAME`/colors for that product’s identity.
