# Agent Prompt: Submit Report Page — Multi-Step Wizard Implementation

Use this prompt when replicating **the WhistleBlower.ng submit report page refactor** on another platform or codebase (e.g. a sibling app, staging fork, or greenfield rebuild).

---

## Your role

You are a senior product engineer and UI/UX designer implementing a **production-ready, mobile-first multi-step submit report wizard**. Work autonomously: audit the target codebase, implement all changes, run the build, and verify desktop + mobile flows for both **report** and **feedback** modes.

Preserve existing backend contracts (Supabase `reports` table, `files` storage, `handle-voice-note-upload` edge function, email triggers). Do not rewrite submission logic unless broken.

---

## What changed (summary)

The submit report experience was refactored from a **single long scrolling form** into a **5-step wizard** with:

- Animated step hero (title + subtitle change per step)
- Progress bar + desktop stepper + mobile dot indicator
- Per-step validation on Continue and final Submit
- Review summary with inline “Edit” jumps back to steps
- Sticky mobile footer (Back / Continue / Submit) portaled to viewport bottom
- Shared field styling (inset focus ring, no layout shift)
- Placeholder-only labels (no redundant field labels above inputs)
- Dual date picker: native `<input type="date">` on mobile, `react-datepicker` on desktop
- Optional evidence step with “Skip for now”
- Voice note upload with retry + simulated progress during submit
- URL prefill: `?company_id=` locks company; `?feedback=true` switches copy + validation

---

## Routes & entry points

| Route | Query params | Behavior |
|-------|--------------|----------|
| `/submit-report` | — | Standard anonymous report flow |
| `/submit-report?company_id={uuid}` | Pre-select & lock company AsyncSelect |
| `/submit-report?feedback=true` | Feedback mode (no password/reward step content) |

App Router page (Next.js):

```
app/(public)/submit-report/page.jsx  →  re-exports src/views/SubmitReportPage.jsx
```

---

## Architecture

```
SubmitReportPage.jsx          # State owner, submit handler, success redirect
├── SubmitReportStepHero.jsx  # Page-level animated headline per step
└── ReportFormWizard.jsx      # Step navigation, validation, footer
    ├── FormStepIndicator.jsx # Desktop stepper + mobile dots
    ├── steps/
    │   ├── OrganizationStep.jsx   # Step 1 — company search
    │   ├── ContextStep.jsx        # Step 2 — state, branch, category, date
    │   ├── StoryStep.jsx          # Step 3 — text or voice
    │   ├── EvidenceStep.jsx       # Step 4 — file upload (optional)
    │   └── (Step 5 inline)        # Review + ContactInfo + terms checkbox
    ├── FormReviewSummary.jsx
    ├── ContactInfo.jsx            # Reward option + password (embedded on step 5)
    └── WizardMobileFooter.jsx     # Fixed bottom bar on mobile (portal)
```

Supporting modules:

```
src/lib/fieldStyles.js              # Shared input/textarea/select/date classes
src/lib/reactSelectStyles.js        # react-select styles matching fieldStyles
src/lib/submitReportValidation.js   # validateStep() + validateAllSteps()
src/components/submit-report/
  submitReportStepMeta.js           # Step titles, subtitles, icons
  reportFormUtils.js                # Categories, date helpers, icon colors
  useReportFormLocation.js          # Branch/state fetching hook
  DescriptionModeSwitch.jsx         # Text vs voice toggle
  VoiceRecordingWidget.jsx          # MediaRecorder UI
  EvidenceUpload.jsx              # Drag area + file list
  SuccessView.jsx                   # Post-submit credentials + voice preview
```

---

## Wizard steps (5 total)

Define step metadata in `submitReportStepMeta.js`. Export `getSubmitReportSteps(isFeedbackMode)`.

### Standard report steps

| # | ID | Short label | Title | Subtitle |
|---|-----|-------------|-------|----------|
| 1 | organization | Organization | Which organization? | Search by company name. We never ask for your identity on this step. |
| 2 | context | Context | Incident context | Where and when did this happen? Choose the category that fits best. |
| 3 | story | Your story | Tell your story | Write a detailed report or record a voice note — your voice will be anonymized. |
| 4 | evidence | Evidence | Supporting evidence | Optional files strengthen your report. You can skip this step. |
| 5 | finish | Finish | Review & submit | Confirm your details, set secure access, and send your report. |

### Feedback mode overrides (`?feedback=true`)

Adjust titles/subtitles for steps 1–3 and 5 (see `FEEDBACK_REPORT_STEPS` in `submitReportStepMeta.js`). Step 4 unchanged.

Each step has a Lucide icon used in the hero: `Building`, `MapPin`, `FileText`, `Paperclip`, `Shield`.

---

## Form state shape

```js
{
  company: null | { value: uuid, label: string },  // react-select option
  category: '',
  title: '',
  description: '',
  stateOfIncident: '',
  branchOfIncident: '',                            // branch UUID or ''
  dateOfIncident: Date,
  reporterType: 'anonymous' | 'reward',
  anonymousPassword: '',
  confirmPassword: '',
  agreeTerms: false,
}
```

Additional page-level state:

```js
files: File[]
voiceNoteFile: null | { blob, fileName, audioFormat, duration, processedAudioBlob? }
descriptionMode: 'text' | 'voice'
isCompanyLocked: boolean
isSubmitting: boolean
isSubmitted: boolean
reportId: string
anonymousPassword: string  // plain text shown once on success screen
voiceSubmitProgress: null | number  // 0–100 simulated during voice upload
wizardHeader: { currentStep, direction, stepMeta }
```

---

## Step content requirements

### Step 1 — Organization

- `AsyncSelect` (react-select/async) for company search
- Min 3 characters before API search; placeholder: `Type your company's name...`
- `instanceId` + `inputId="companyName"` for SSR hydration stability
- SSR guard: render placeholder skeleton until `mounted` to avoid hydration mismatch
- Disabled when `isCompanyLocked` (from URL `company_id`)
- Uses `reactSelectStyles` (inset border, 48px height, matches other fields)

### Step 2 — Context

Fields (placeholder-only, no visible labels):

1. **State** — Radix Select, options from `company_branches.state` for selected company
2. **Branch** — Radix Select, filtered by company + state; disabled until state chosen
3. **Category** — different list for feedback vs report (`reportFormUtils.js`)
4. **Date** — responsive split:
   - **Mobile (`md:hidden`):** `<Input type="date" />` with `dateInputFieldClasses`, max = today
   - **Desktop (`hidden md:block`):** `react-datepicker` with `inputFieldClasses`

Show amber helper text when company has no states/branches (user may still continue if no branch applies).

Hook `useReportFormLocation(formData, handleSelectChange)` fetches states/branches and clears stale selections when company changes.

### Step 3 — Story

- `DescriptionModeSwitch`: segmented control — TEXT REPORT | VOICE REPORT
- **Text mode:** title Input + description Textarea (placeholders only)
- **Voice mode:** `VoiceRecordingWidget`; require company selected before recording
- Switching text mode clears voice note via `onVoiceNoteClear`

### Step 4 — Evidence (optional)

- `EvidenceUpload` dashed border drop zone
- Max **200MB** per file; toast on oversize
- Requires company selected before file picker opens
- Footer shows **“Skip for now”** ghost button → advances to step 5 without files

### Step 5 — Review & finish

1. `FormReviewSummary` — editable rows (Organization, Location, Category & date, Story, Evidence, Reward preference)
2. `ContactInfo` with `embedded={true}` — hidden entirely in feedback mode
3. Terms checkbox: `agreeTerms` required to enable Submit
4. Submit button runs `validateStep(5)` before native form submit

---

## Validation rules (`submitReportValidation.js`)

Implement `validateStep(step, context)` returning `{ valid, title?, description?, focusId? }`.

| Step | Rules |
|------|-------|
| 1 | `company` required → focus `#companyName` |
| 2 | `category` required; if branches exist for state, `branchOfIncident` required; reject `no-branches` placeholder value |
| 3 | Text: `title` + `description` trimmed; Voice: `voiceNoteFile` must exist |
| 4 | Always valid (optional) |
| 5 | Non-feedback: password ≥ 8 chars, passwords match; all modes: `agreeTerms === true` |

`validateAllSteps(context)` loops steps 1–5 for final submit guard.

---

## Navigation & animations

### ReportFormWizard behavior

- **Continue:** validate current step → increment step, scroll to top
- **Back:** decrement step (no re-validation)
- **Desktop stepper:** completed steps clickable to jump back
- **Progress bar:** `(currentStep / totalSteps) * 100`
- Step transitions: Framer Motion slide (`x: ±40`, opacity fade, 250ms)
- Hero syncs via `onHeaderChange({ currentStep, direction, stepMeta })`

### Mobile footer (`WizardMobileFooter.jsx`)

- `createPortal` to `document.body`
- Fixed bottom, safe-area padding, backdrop blur
- Hidden on `md+` (desktop uses sticky footer inside card)
- Class `submit-report-footer-inner` aligns horizontal padding with card shell

### Body class

While wizard mounted (not on success screen):

```js
document.body.classList.add('submit-report-flow');
// cleanup on unmount / success
```

---

## Shared field styling (`fieldStyles.js`)

All form controls should share one visual language:

```js
// Inset shadow border — no ring, no layout shift on focus
export const fieldFocusRingClasses =
  'border border-transparent shadow-[inset_0_0_0_1px_hsl(var(--input))] ... focus:shadow-[inset_0_0_0_2px_hsl(var(--primary))]';

export const inputFieldClasses = 'flex h-12 w-full rounded-md bg-background px-3 py-2 text-base ...';
export const textareaFieldClasses = 'flex min-h-[120px] w-full rounded-md ...';
export const selectTriggerFieldClasses = 'flex h-12 w-full items-center justify-between rounded-md ...';
export const dateInputFieldClasses = [inputFieldClasses, 'submit-report-date-input', ...].join(' ');
export const inputWithTrailingIconClasses = 'pr-10';  // password toggle
```

Wire into shadcn primitives:

- `Input` → `inputFieldClasses`
- `Textarea` → `textareaFieldClasses`
- `SelectTrigger` → `selectTriggerFieldClasses`

### react-select (`reactSelectStyles.js`)

Match inset focus treatment:

- `minHeight: 48px`, transparent border, inset box-shadow for default/focus
- Menu `borderRadius: 0.75rem`
- Full width container

---

## CSS layout (`index.css`)

Add under `body.submit-report-flow`:

```css
body.submit-report-flow {
  --submit-report-gutter: 1rem;
  --submit-report-footer-padding: 1rem;
  --submit-report-card-width: 56rem;
}

/* Card + hero centered to same max-width */
body.submit-report-flow .submit-report-card,
body.submit-report-flow .submit-report-hero { ... }

/* Light theme: solid card background (glass-effect alone too faint) */
html:not(.dark) body.submit-report-flow .submit-report-card.glass-effect {
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  backdrop-filter: none;
}

@media (max-width: 767px) {
  body.submit-report-flow {
    --submit-report-gutter: 0.625rem;
    --submit-report-card-width: 396px;
    --submit-report-footer-padding: 0.25rem;
  }
  /* Shell uses gutter + safe-area; disable form transform on mobile */
  #submit-report-form { transform: none !important; }
}
```

Page wrapper classes:

```jsx
<div className="submit-report-page py-20 bg-muted/30 max-md:flex-1 max-md:flex max-md:flex-col max-md:min-h-0 max-md:py-0">
  <div className="submit-report-shell main-content-container max-md:flex-1 ...">
    <SubmitReportStepHero ... />
    <motion.form id="submit-report-form" className="submit-report-card glass-effect border ...">
      <ReportFormWizard ... />
    </motion.form>
  </div>
</div>
```

---

## Submission flow (`SubmitReportPage.handleSubmit`)

1. Run `validateAllSteps()`
2. Generate report ID: `WB` + 7 random digits
3. Hash password with bcrypt (12 rounds) if not feedback mode
4. Insert into `reports`:
   - `description`: `[Voice Note: filename]` placeholder if voice mode
   - `is_voice_note`, `report_type: 'voice_note' | 'text'`
   - `is_feedback`, `is_anonymous`, `anonymous_password_hash`, etc.
5. **Voice upload** (if present):
   - Convert blob → base64 in chunks (avoid stack overflow)
   - Invoke `handle-voice-note-upload` with retry (3 attempts, exponential backoff)
   - Simulated progress bar 1→90% during upload, 100% on success
   - Roll back report row on failure
6. **Evidence files:** upload to `report_evidence` bucket, insert `files` rows
7. Show `SuccessView` with report ID + password (+ voice preview if processed)
8. Fire `triggerNewReportEmail` in background

Submit button label when submitting with voice:

```
Changing Your Voice & Submitting... {progress}%
```

---

## ContactInfo / reward section

- Two large toggle cards: anonymous vs reward-eligible
- Animated expand (`framer-motion`) reveals password fields for **both** choices (needed to track report)
- Password fields: placeholder-only, trailing eye toggle, `aria-label` on inputs and toggle buttons
- `embedded` prop removes outer padding when used inside wizard step 5

---

## Success screen (`SuccessView.jsx`)

- Staggered Framer Motion entrance
- Copy report ID + password with one-click copy
- Link to `/track-report`
- Voice note playback if `processedAudioBlob` returned from edge function
- Distinct copy for feedback vs report mode

---

## Accessibility checklist

- [ ] Every input has `aria-label` or associated visible text (placeholders are not labels — use `aria-label`)
- [ ] Step indicator has `aria-label="Form progress"` and `aria-current="step"` on active step
- [ ] Mobile footer has `role="navigation"` + `aria-label="Form navigation"`
- [ ] Password toggles have `aria-label` for show/hide
- [ ] Evidence upload region has `role="group"` + `aria-label="Evidence upload"`
- [ ] Focus management: validation failures call `document.getElementById(focusId)?.focus()`

---

## Dependencies

Ensure these packages exist:

- `react-select` / `react-select/async`
- `react-datepicker`
- `date-fns` (review summary date formatting)
- `framer-motion`
- `bcryptjs`
- `@radix-ui/react-select`, `@radix-ui/react-checkbox`
- `lucide-react`

---

## Files to create or replace

| Action | Path |
|--------|------|
| Replace | `src/views/SubmitReportPage.jsx` |
| Create | `src/components/submit-report/ReportFormWizard.jsx` |
| Create | `src/components/submit-report/SubmitReportStepHero.jsx` |
| Create | `src/components/submit-report/FormStepIndicator.jsx` |
| Create | `src/components/submit-report/FormReviewSummary.jsx` |
| Create | `src/components/submit-report/WizardMobileFooter.jsx` |
| Create | `src/components/submit-report/submitReportStepMeta.js` |
| Create | `src/components/submit-report/reportFormUtils.js` |
| Create | `src/components/submit-report/useReportFormLocation.js` |
| Create | `src/components/submit-report/steps/OrganizationStep.jsx` |
| Create | `src/components/submit-report/steps/ContextStep.jsx` |
| Create | `src/components/submit-report/steps/StoryStep.jsx` |
| Create | `src/components/submit-report/steps/EvidenceStep.jsx` |
| Update | `src/components/submit-report/ContactInfo.jsx` |
| Update | `src/components/submit-report/EvidenceUpload.jsx` |
| Update | `src/components/submit-report/DescriptionModeSwitch.jsx` |
| Update | `src/components/submit-report/SuccessView.jsx` |
| Create | `src/lib/fieldStyles.js` |
| Create | `src/lib/reactSelectStyles.js` |
| Create | `src/lib/submitReportValidation.js` |
| Update | `src/components/ui/input.jsx`, `textarea.jsx`, `select.jsx` |
| Update | `src/index.css` (submit-report-flow block) |
| Delete | `src/components/submit-report/ReportForm.jsx` (monolithic form — replaced by wizard) |

---

## Acceptance criteria (test manually)

### Desktop

- [ ] All 5 steps navigate forward/back; completed steps clickable in stepper
- [ ] Hero title/subtitle animate on step change
- [ ] Company search works (3+ chars), URL `company_id` prefill locks field
- [ ] State/branch cascade clears when company changes
- [ ] Date picker opens calendar popup on desktop
- [ ] Text report: title + description required
- [ ] Voice report: recording works; submit shows progress text
- [ ] Evidence skip works; upload enforces 200MB limit
- [ ] Review summary Edit buttons jump to correct step
- [ ] Submit blocked until terms checked; password rules enforced
- [ ] Success screen shows report ID + password

### Mobile (< 768px)

- [ ] Page fills viewport; card scrolls internally; footer stays fixed at bottom
- [ ] Dot indicator shows progress
- [ ] Native date picker used (OS calendar)
- [ ] Safe area insets respected on footer
- [ ] Back/Continue/Submit reachable without scrolling past footer

### Feedback mode (`?feedback=true`)

- [ ] Copy reflects feedback wording
- [ ] No reward/password section on step 5
- [ ] Submit reads “Submit Feedback”
- [ ] `is_feedback: true` in DB row

### Regression

- [ ] `npm run build` passes
- [ ] Email notification still fires after submit
- [ ] Track report flow works with issued credentials

---

## Copy-paste prompt (short version)

Use this condensed block if the target agent has limited context:

---

**Task:** Refactor `/submit-report` from a single long form into a **5-step mobile-first wizard** for a Next.js + Supabase whistleblower app.

**Steps:** (1) Organization — async company search, (2) Context — state/branch/category/date, (3) Story — text or anonymized voice note, (4) Evidence — optional uploads with skip, (5) Review + reward/password + terms + submit.

**UX:** Animated per-step hero headline, progress bar, desktop stepper with checkmarks, mobile dots, Framer Motion step slides, sticky mobile footer via portal, placeholder-only fields (no label clutter), shared 48px inset-focus field styles across Input/Textarea/Select/react-select.

**Mobile:** `body.submit-report-flow` CSS variables align card + footer gutters; native date input on mobile, react-datepicker on desktop; flex column layout with scrollable step body.

**Validation:** Per-step on Continue; full re-validation on Submit (`validateStep` 1–5). Voice mode requires recorded blob; step 4 always optional.

**Submit:** Insert report → upload voice via `handle-voice-note-upload` with retry + progress → upload evidence to storage → SuccessView with copy credentials → background email trigger. Support `?company_id=` lock and `?feedback=true` mode.

**Deliver:** All files listed in the implementation doc, delete old monolithic `ReportForm.jsx`, wire `fieldStyles.js` into UI primitives, pass build + acceptance checklist above.

---

## Reference implementation

The canonical source for this prompt is the **the-business-whistleblower** repository:

- `src/views/SubmitReportPage.jsx`
- `src/components/submit-report/**`
- `src/lib/fieldStyles.js`, `reactSelectStyles.js`, `submitReportValidation.js`
- `src/index.css` → `body.submit-report-flow` section

When porting, adapt import paths and routing helpers (`react-router-dom` vs Next.js) but keep behavior equivalent.
