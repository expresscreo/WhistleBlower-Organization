# Agent Prompt: Remove Toast Notifications → Inline Error Notifications

Use this prompt when migrating **WhistleBlower.ng — For Business** (`business.whistleblower.ng`) away from floating toast notifications and onto the app's **inline error notification system**.

This applies to the full organization app: public submit/track flows, auth, and the multi-tenant dashboard.

---

## Your role

You are a senior product engineer standardizing user feedback across the app. Work autonomously:

1. Audit the codebase for any toast usage (`toast()`, `useToast`, `<Toaster />`, Sonner, react-hot-toast, etc.).
2. Replace transient toast feedback with the correct inline component from `src/components/ui/form-feedback.jsx`.
3. Remove dead toast infrastructure (imports, providers, dependencies).
4. Update stale documentation that still references toasts.
5. Run the build and spot-check desktop + mobile on representative flows.

**Do not introduce a new toast library.** The target pattern is contextual, accessible inline feedback — not floating overlays.

---

## Why we removed toasts

| Toast problems | Inline error notifications fix |
|----------------|--------------------------------|
| Errors appear far from the action that caused them | `FieldError` renders next to the field, button, or form section |
| Success toasts disappear before users finish reading | `FieldSuccess` stays visible until the next action clears it |
| Page-load failures feel disconnected from the page | `PageErrorBanner` sits at the top of the content area with a title |
| Toasts stack, overlap, and fight for attention on mobile | One error per context; no global notification host |
| Harder to test and localize consistently | Single component API, shared styling, `role="alert"` |

---

## Current state (audit checklist)

Run these searches before changing anything:

```bash
rg -i "toast|useToast|Toaster|sonner|react-hot-toast" src/ app/
rg "use-toast|toaster" src/ app/
grep -E "sonner|react-hot-toast" package.json
```

**Expected result in this repo:** no toast library in `package.json`, no `<Toaster />` in `app/providers.jsx`, and no `toast()` calls under `src/` or `app/`. Production code already uses inline notifications.

**Stale references still exist in docs only:**

| File | What it says |
|------|--------------|
| `docs/CHAT_FEATURE_DOCUMENTATION.md` | `useToast`, `toast({ variant: 'destructive' })` for chat send failures |
| `docs/NEXTJS_MIGRATION_AGENT_PROMPT.md` | Lists `<Toaster />` in providers |
| `docs/SUBMIT_REPORT_PAGE_IMPLEMENTATION_PROMPT.md` | "toast on oversize" for 200MB file limit |

Live implementations already use `FieldError` (e.g. `EvidenceUpload.jsx`, `Chat.jsx`). Update docs to match code when you touch them.

---

## Error notification API

**Source of truth:** `src/components/ui/form-feedback.jsx`

```jsx
import {
  FieldError,
  FieldSuccess,
  FormFeedback,
  PageErrorBanner,
  fieldErrorAlertClasses,
} from '@/components/ui/form-feedback';
```

| Component | When to use | Renders | A11y |
|-----------|-------------|---------|------|
| `FieldError` | Validation errors, action failures tied to a field or button | Red pill under the control | `role="alert"` |
| `FieldSuccess` | Confirmations tied to a field or action (save, copy, resend) | Green text under the control | `role="status"` |
| `FormFeedback` | Both error + success in one spot (dialogs, compact forms) | `FieldError` + `FieldSuccess` | Both roles |
| `PageErrorBanner` | Initial fetch / page-level load failure | Red pill at top of page content | `role="alert"` + optional `title` |
| `fieldErrorAlertClasses` | Custom inline alert that must match the design system | CSS class string | — |

Shared error styling:

```js
'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 text-center dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200'
```

---

## Decision matrix: which component?

```
Is it a page-level fetch/load failure (data never rendered)?
  └─ YES → PageErrorBanner (with title)
  └─ NO ↓

Is it tied to a specific field, form section, dialog, or button?
  └─ YES → FieldError (and FieldSuccess if there's a paired success message)
  └─ NO ↓

Is it persistent contextual info (account suspended, password reset done)?
  └─ YES → Radix Alert (`src/components/ui/alert.jsx`) — NOT a toast replacement
  └─ NO ↓

Is it a destructive confirmation?
  └─ YES → AlertDialog — keep as-is
```

**Keep using `Alert` for informational banners**, not transient errors. Example: login "password updated" green banner on `LoginPage.jsx`, billing "Account Suspended" on `BillingPage.jsx`.

**Do not conflate with email notifications:** `notification_settings`, `SettingsPage` notification tab, Supabase email triggers, and dashboard chat **badge counts** are separate systems. Do not migrate those to `FieldError`.

---

## Migration patterns

### Pattern 1 — Form / action error (most common)

**Before (toast):**

```jsx
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();
const [loading, setLoading] = useState(false);

const handleSave = async () => {
  const { error } = await supabase.from('companies').update(payload).eq('id', id);
  if (error) {
    toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    return;
  }
  toast({ title: 'Saved', description: 'Company updated.' });
};
```

**After (inline):**

```jsx
import { FieldError, FieldSuccess } from '@/components/ui/form-feedback';

const [feedback, setFeedback] = useState({ error: '', success: '' });
const [loading, setLoading] = useState(false);

const handleSave = async () => {
  setFeedback({ error: '', success: '' });
  const { error } = await supabase.from('companies').update(payload).eq('id', id);
  if (error) {
    setFeedback({ error: error.message, success: '' });
    return;
  }
  setFeedback({ error: '', success: 'Company updated.' });
};

// JSX — place directly under the submit button or form footer
<FieldError message={feedback.error} />
<FieldSuccess message={feedback.success} />
```

**Rules:**

- Clear feedback at the start of every retry (`setFeedback({ error: '', success: '' })`).
- Render the component **in the same visual group** as the triggering control.
- Prefer one `feedback` object over many loose strings when error and success share a spot.

---

### Pattern 2 — Page load failure

**Before (toast on mount):**

```jsx
useEffect(() => {
  fetchReports().then(({ data, error }) => {
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else setReports(data);
  });
}, []);
```

**After:**

```jsx
const [fetchError, setFetchError] = useState('');

useEffect(() => {
  setFetchError('');
  fetchReports().then(({ data, error }) => {
    if (error) {
      setFetchError(error.message);
      return;
    }
    setReports(data);
  });
}, []);

// Top of page content, below the page heading
<PageErrorBanner error={fetchError} title="Could not load reports" />
```

Reference: `src/views/dashboard/ReportsPage.jsx`.

---

### Pattern 3 — Field-scoped validation (wizard / multi-field forms)

**Before (toast on Continue):**

```jsx
if (!formData.company) {
  toast({ title: 'Required', description: 'Please select a company.', variant: 'destructive' });
  return;
}
```

**After:**

```jsx
const [fieldError, setFieldError] = useState({ message: '', focusId: null });

const runValidation = (step) => {
  const result = validateStep(step, context);
  if (!result.valid) {
    setFieldError({ message: result.description, focusId: result.focusId ?? null });
    if (result.focusId) document.getElementById(result.focusId)?.focus?.();
    return false;
  }
  setFieldError({ message: '', focusId: null });
  return true;
};

const errorFor = (focusId) =>
  fieldError.focusId === focusId ? fieldError.message : '';

// Pass errorFor('company_id') into OrganizationStep, etc.
<FieldError message={errorFor('company_id')} />
```

Reference: `src/components/submit-report/ReportFormWizard.jsx`.

---

### Pattern 4 — Dialog / modal actions

Place feedback **inside the dialog body**, above `DialogFooter`:

```jsx
<DialogContent>
  <DialogHeader>...</DialogHeader>
  <div className="grid gap-4 py-4">
    <Input ... />
    <FieldError message={formError} />
    <FieldSuccess message={formSuccess} />
  </div>
  <DialogFooter>...</DialogFooter>
</DialogContent>
```

Reference: `src/views/auth/LoginPage.jsx` (`ResendConfirmationModal`), `src/components/dashboard/users/UserFormDialog.jsx`.

---

### Pattern 5 — Copy-to-clipboard

Use `useCopyFeedback` and render `FieldError` beside the copy button — not a toast.

```jsx
import { useCopyFeedback } from '@/hooks/useCopyFeedback';
import { FieldError } from '@/components/ui/form-feedback';

const { copy, isCopied, copyError } = useCopyFeedback();

<Button onClick={() => copy(text, 'paycode')}>
  {isCopied('paycode') ? 'Copied' : 'Copy'}
</Button>
<FieldError message={copyError} />
```

Reference: `src/hooks/useCopyFeedback.js`, `src/views/dashboard/RewardPage.jsx`.

For copy **success**, prefer inline button label change (`Copied`) over `FieldSuccess`.

---

### Pattern 6 — Chat / realtime send failures

**Before (toast):**

```jsx
if (error) {
  toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
}
```

**After:**

```jsx
const [messageError, setMessageError] = useState('');

const handleSendMessage = async () => {
  setMessageError('');
  const { error } = await publicSupabase.from('report_updates').insert(messageData).select().single();
  if (error) {
    setMessageError(error.message);
    return;
  }
  // ...
};

// Below the message input / send button
<FieldError message={messageError} />
```

Reference: `src/components/track-report/Chat.jsx`.

For **incoming admin messages**, use existing UI (`newMessageCount` badge, scroll-to-bottom) — do not add a toast for "New message received".

---

### Pattern 7 — File upload validation

**Before (toast on oversize):**

```jsx
if (file.size > MAX_BYTES) {
  toast({ title: 'File too large', description: `${file.name} exceeds 200MB`, variant: 'destructive' });
}
```

**After:**

```jsx
const [uploadError, setUploadError] = useState('');

if (invalidFiles.length > 0) {
  setUploadError(`The following files exceed the ${MAX_FILE_SIZE_MB}MB limit: ${fileList}`);
}

<FieldError message={uploadError} className="mt-3" />
```

Reference: `src/components/submit-report/EvidenceUpload.jsx`.

---

## Remove toast infrastructure

If you find toast code in a fork or older branch, remove it completely:

1. **Delete** (if present):
   - `src/components/ui/use-toast.js` (or `.ts`)
   - `src/components/ui/toaster.jsx`
   - Any `src/lib/notify.js` wrapper around toast
2. **Remove from `app/providers.jsx`:** `<Toaster />` import and JSX
3. **Remove from `package.json`:** `sonner`, `@radix-ui/react-toast`, `react-hot-toast`, or shadcn toast deps
4. **Remove all imports:** `useToast`, `toast`, `Toaster`
5. **Run:** `npm run build` — fix any broken imports

**Do not leave a hybrid** (Toaster mounted + inline errors). One feedback system only.

---

## App areas and file inventory

Every file below should use `form-feedback` components — **not toasts**. Use this as a migration checklist when auditing forks or new features.

### Auth (`src/views/auth/`)

| File | Components | Notes |
|------|------------|-------|
| `LoginPage.jsx` | `FieldError`, `FieldSuccess`, `Alert` | Auth errors inline; green `Alert` for post-reset banner |
| `RegisterPage.jsx` | `FieldError`, `FieldSuccess` | Payment + company validation |
| `ForgotPasswordPage.jsx` | `FieldError`, `FieldSuccess` | |
| `ResetPasswordPage.jsx` | `FieldError` | |
| `AuthConfirmPage.jsx` | `FieldError` | |

### Public — submit report (`src/views/`, `src/components/submit-report/`)

| File | Components | Notes |
|------|------------|-------|
| `SubmitReportPage.jsx` | `FieldError` | Submit-level failures |
| `ReportFormWizard.jsx` | `FieldError` | Step validation + focus |
| `OrganizationStep.jsx` | via `errorFor()` | Company select |
| `ContextStep.jsx` | `FieldError` | Branch, category |
| `StoryStep.jsx` | `FieldError` | Description / voice |
| `EvidenceUpload.jsx` | `FieldError` | File size / upload |
| `ContactInfo.jsx` | `FieldError` | Password fields |
| `TermsConsent.jsx` | `FieldError` | Checkbox |
| `VoiceRecordingWidget.jsx` | `FieldError` | Mic / upload |
| `SuccessView.jsx` | `FieldError` | Copy credentials |

### Public — track report (`src/views/`, `src/components/track-report/`)

| File | Components | Notes |
|------|------------|-------|
| `TrackReportPage.jsx` | `FieldError` | Data fetch |
| `SearchForm.jsx` | `FieldError` | Lookup |
| `VerificationForm.jsx` | `FieldError`, `FieldSuccess` | |
| `Chat.jsx` | `FieldError` | Send failures |
| `UpdateReport.jsx` | `FieldError` | |
| `RewardSection.jsx` | `FieldError` | Claim + copy |

### Public — other

| File | Components |
|------|------------|
| `ContactUsPage.jsx` | `FieldError`, `FieldSuccess` |

### Dashboard pages (`src/views/dashboard/`)

| File | Components | Typical `PageErrorBanner` title |
|------|------------|--------------------------------|
| `OverviewPage.jsx` | `PageErrorBanner` | Could not load overview |
| `ReportsPage.jsx` | `PageErrorBanner` | Could not load reports |
| `ReportDetailsPage.jsx` | `FieldError`, `PageErrorBanner` | Could not load report |
| `CustomerFeedbacksPage.jsx` | `PageErrorBanner` | Could not load feedbacks |
| `TriagePage.jsx` | `PageErrorBanner`, `FieldError` | Could not load triage |
| `TrashedReportsPage.jsx` | `PageErrorBanner`, `FieldError` | Could not load trashed reports |
| `UserManagementPage.jsx` | `PageErrorBanner`, `FieldError` | Could not load users |
| `CompaniesManagementPage.jsx` | `PageErrorBanner`, `FieldError` | Could not load companies |
| `BranchManagementPage.jsx` | `PageErrorBanner`, `FieldError` | Could not load branches |
| `PlanManagementPage.jsx` | `PageErrorBanner`, `FieldError` | |
| `PlanFeaturesPage.jsx` | `PageErrorBanner`, `FieldError` | |
| `BillingPage.jsx` | `PageErrorBanner`, `FieldError`, `FieldSuccess`, `Alert` | Suspension uses `Alert`, not toast |
| `RewardPage.jsx` | `PageErrorBanner`, `FieldError`, `FieldSuccess` | |
| `AuditLogsPage.jsx` | `PageErrorBanner` | |
| `SettingsPage.jsx` | `FieldError`, `FieldSuccess` | |
| `ContactSupportPage.jsx` | `PageErrorBanner`, `FieldError` | Support chat |

### Dashboard components (`src/components/dashboard/`)

| File | Components |
|------|------------|
| `users/UserFormDialog.jsx` | `FieldError` |
| `users/DeleteUserAlert.jsx` | `FieldError` |
| `companies/CompanyFormDialog.jsx` | `FieldError` |
| `settings/CompanyLogoUpload.jsx` | `FieldError`, `FieldSuccess` |
| `support/NewTicketDialog.jsx` | `FieldError` |
| `EmailTestComponent.jsx` | `FieldError`, `FieldSuccess` |
| `VoiceNotePlayer.jsx` | `FieldError` |
| `EmailQueueMonitor.jsx` | `FieldError` |

### Shared UI

| File | Components | Notes |
|------|------------|-------|
| `EmailVerificationBanner.jsx` | `FieldError`, `FieldSuccess` | Commented out in layout; keep pattern if re-enabled |

---

## Styling and placement rules

1. **Errors near cause:** `FieldError` goes directly under the input, checkbox, upload zone, or submit button — not fixed to the viewport.
2. **Page errors above content:** `PageErrorBanner` goes after the page `<h1>` block, before cards/tables.
3. **Don't duplicate:** If `PageErrorBanner` is shown, don't also toast the same error.
4. **Clear on retry:** Always reset error state when the user submits again or navigates away.
5. **Loading states:** Use `Button loading={isLoading}` (see `BUTTON_LOADING_DOTS_PROMPT.md`) — don't use toasts for "Loading...".
6. **Dark mode:** Rely on `fieldErrorAlertClasses`; don't hand-roll red backgrounds.
7. **Optional `className`:** Use `className="mb-2"`, `className="mt-3"`, etc. for spacing — don't change core colors.

---

## Documentation updates

When migrating, update these docs to match inline patterns:

| Doc | Change |
|-----|--------|
| `docs/CHAT_FEATURE_DOCUMENTATION.md` | Replace all `toast()` / `useToast` examples with `messageError` + `FieldError` |
| `docs/NEXTJS_MIGRATION_AGENT_PROMPT.md` | Remove `<Toaster />` from providers list |
| `docs/SUBMIT_REPORT_PAGE_IMPLEMENTATION_PROMPT.md` | Change "toast on oversize" → `FieldError` in `EvidenceUpload.jsx` |

---

## Verification checklist

After migration, confirm:

- [ ] `rg -i "toast|useToast|Toaster|sonner" src/ app/` returns **zero** matches
- [ ] No toast packages in `package.json`
- [ ] `app/providers.jsx` has **no** `<Toaster />`
- [ ] `npm run build` passes
- [ ] **Auth:** wrong password shows `FieldError` on login form, not a floating toast
- [ ] **Submit report:** oversize file shows error under upload area; step validation shows error on the active step
- [ ] **Track report:** chat send failure shows `FieldError` below input
- [ ] **Dashboard:** failed list fetch shows `PageErrorBanner` with title; save actions show inline success/error
- [ ] **Mobile:** errors are visible without scrolling to a corner toast stack
- [ ] **a11y:** error nodes expose `role="alert"` (inspect with devtools)

---

## Quick reference

| User feedback need | Use | Do not use |
|--------------------|-----|------------|
| Field validation | `FieldError` | Toast |
| Save / submit result | `FieldError` + `FieldSuccess` | Toast |
| Page failed to load | `PageErrorBanner` | Toast on mount |
| Account suspended / info banner | `Alert` | Toast |
| Delete confirmation | `AlertDialog` | Toast |
| Email preferences | Settings UI + Supabase | Toast |
| Unread chat count | Badge on report row / sidebar dot | Toast |

**Canonical import:**

```jsx
import { FieldError, FieldSuccess, PageErrorBanner } from '@/components/ui/form-feedback';
```
