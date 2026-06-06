# AI Agent Prompt: Button Loading State (3 Dots)

Copy and paste the prompt below to your AI coding assistant to implement the HeySpender-style **three-dot loading indicator** on buttons (e.g. login, submit, OAuth). Use this in any React + Tailwind project.

---

## Prompt

```
Implement a button loading state that replaces the button label with three animated dots while an async action runs (e.g. form submit, login, OAuth).

Match this behavior and visual spec exactly:

## Visual design

- **Three small circles** in a horizontal row, evenly spaced
- Each dot: **10×10px** (`w-2.5 h-2.5`), **perfectly round** (`rounded-full`), `aspect-square`, `flex-shrink-0`
- Color: **`currentColor`** (`bg-current`) so dots inherit the button’s text color (works on light/dark/brand buttons)
- Gap between dots: **6px** (`gap-1.5`)
- Animation: **opacity pulse only** (do NOT scale or translate dots — scaling distorts circles)
  - Keyframes: at 0%, 80%, 100% → opacity 0.35; at 40% → opacity 1
  - Duration: **0.6s**, easing: **ease-in-out**, infinite
  - Stagger: dot 1 → 0ms, dot 2 → 150ms, dot 3 → 300ms (`animation-delay`)
- Container: `inline-flex items-center` with `role="status"` and `aria-label="Loading"`

## Button integration

Add a `loading` boolean prop to your shared Button component:

1. When `loading={true}`:
   - Replace **all** button children (label, icons) with the three-dot loader
   - Wrap dots in: `<span className="inline-flex min-h-[1.25em] items-center justify-center">`
   - Set `disabled={disabled || loading}`
   - Add `aria-busy={loading || undefined}`
   - Add `cursor-wait` while loading
2. When `loading={false}`: render children normally
3. Optional `loadingClassName` prop to tweak dot color/size (e.g. `scale-[0.85]` for smaller buttons)

Do NOT show both label and dots at once. Do NOT use a generic browser spinner or "Loading..." text inside the button.

## CSS (required)

Define a utility class and keyframes (Tailwind example):

```css
@keyframes loading-dot {
  0%, 80%, 100% { opacity: 0.35; }
  40% { opacity: 1; }
}

.animate-loading-dot {
  animation: loading-dot 0.6s ease-in-out infinite;
}
```

In Tailwind v4+, register `animate-loading-dot` in your theme if needed. Each dot span uses `animate-loading-dot` plus inline `animation-delay`.

## LoadingDots component (reference)

```jsx
const LoadingDots = ({ className, ...props }) => (
  <span
    className={cn('inline-flex items-center gap-1.5', className)}
    role="status"
    aria-label="Loading"
    {...props}
  >
    <span className="w-2.5 h-2.5 min-w-2.5 min-h-2.5 flex-shrink-0 aspect-square rounded-full bg-current animate-loading-dot [animation-delay:0ms]" />
    <span className="w-2.5 h-2.5 min-w-2.5 min-h-2.5 flex-shrink-0 aspect-square rounded-full bg-current animate-loading-dot [animation-delay:150ms]" />
    <span className="w-2.5 h-2.5 min-w-2.5 min-h-2.5 flex-shrink-0 aspect-square rounded-full bg-current animate-loading-dot [animation-delay:300ms]" />
  </span>
);
```

## Button usage (reference)

```jsx
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    await signIn(credentials);
  } finally {
    setLoading(false);
  }
};

<Button type="submit" loading={loading} className="w-full">
  LOGIN
</Button>
```

While `loading` is true, the user sees only the three pulsing dots inside the same button shell (same size, colors, border-radius). The label "LOGIN" is hidden.

## Accessibility

- Outer dots wrapper: `role="status"` + `aria-label="Loading"`
- Button: `aria-busy="true"` when loading
- Button remains `disabled` during loading to prevent double submit

## Standalone / full-page loading (optional)

The same `LoadingDots` component can be used outside buttons (e.g. auth callback page). Scale with `className` e.g. `scale-[1.75] text-brand-purple-dark` — dots still use `currentColor`.

## Do NOT

- Use scale/transform animations on dots (breaks round shape)
- Leave the button enabled while loading
- Show a second spinner elsewhere on the same button
- Use `asChild` (Radix Slot) together with `loading` — render a real `<button>` when loading

## Stack assumptions

- React 18+
- Tailwind CSS
- Optional: `cn()` from clsx/tailwind-merge, CVA for button variants

Implement: (1) `LoadingDots` component, (2) `@keyframes loading-dot` + `.animate-loading-dot`, (3) `loading` prop on Button, (4) wire one form (e.g. login) with `useState` loading flag and `finally` to clear loading.
```

---

## Reference implementation (HeySpender)

| Piece | Location |
|-------|----------|
| `LoadingDots` component | `src/components/ui/loading-dots.jsx` |
| Button `loading` prop | `src/components/ui/button.jsx` |
| Keyframes + utility | `src/app/globals.css` (`@keyframes loading-dot`, `.animate-loading-dot`) |
| Login button usage | `src/app/auth/login/page.tsx` — `<Button loading={loading} ...>` |
| Dialog actions | `src/components/ui/alert-dialog.jsx` — same pattern on `AlertDialogAction` |

### Login flow (simplified)

```tsx
const [loading, setLoading] = useState(false);

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    await signInWithPassword({ email, password });
    router.push('/dashboard');
  } catch (err) {
    setLoginError(err.message);
  } finally {
    setLoading(false);
  }
};

<Button type="submit" loading={loading} variant="custom" className="w-full ...">
  <span className="uppercase">LOGIN</span>
</Button>
```

When `loading` is true, children (`LOGIN`) are not rendered; only `LoadingDots` with `text-current` appears.

---

## Usage

1. Open your AI coding assistant in the **target** project.
2. Paste the prompt from the **Prompt** section above.
3. Adjust brand/color class names if needed; dots automatically match button text via `currentColor`.
4. Verify: submit form → label disappears → three dots pulse in sequence → button disabled → loading clears on success or error.
