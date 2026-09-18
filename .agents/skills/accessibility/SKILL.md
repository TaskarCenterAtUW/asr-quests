---
name: accessibility
description: "Use when implementing, reviewing, debugging, or auditing web UI accessibility; when a request mentions a11y, WCAG, ARIA, screen readers, keyboard navigation, focus management, semantic HTML, accessible forms, color contrast, captions, or inclusive React, Vue, Angular, HTML, and CSS interfaces. Target WCAG 2.2 AA."
---

<!-- @format -->

# Web Accessibility (WCAG 2.2 AA)

Use this skill for focused accessibility work. Prioritize native HTML and solve issues in a way that preserves visual design while making the interface usable with keyboards, screen readers, touch, zoom, and reduced-motion preferences.

## Workflow

1. **Identify the interaction and user-visible outcome.** Inspect the rendered structure, controls, keyboard path, dynamic content, and responsive behavior.
2. **Prefer native elements.** Use `button`, `a`, `input`, `select`, `textarea`, `details`, `dialog`, headings, lists, and landmarks before inventing ARIA widgets.
3. **Check WCAG 2.2 AA essentials.** Verify semantics, names, keyboard operation, focus behavior, error handling, contrast, and dynamic announcements.
4. **Keep behavior equivalent.** Mouse, keyboard, touch, and assistive-technology users must be able to complete the same task.
5. **Validate after changes.** Test with keyboard-only navigation, a 320 CSS-pixel viewport, 200% text zoom, and reduced motion. Where practical, also inspect with a screen reader and automated accessibility checker.

## Core Rules

### Semantic structure

- Set the document language: `<html lang="en">` (and mark passages in another language with `lang`).
- Use landmarks: `header`, `nav` with a descriptive label where needed, `main`, and `footer`.
- Include a skip link as the first focusable element, targeting the main content.
- Give each page one clear primary `h1`; nest later headings logically without level gaps.
- Use lists for lists and data tables only for tabular data. Data tables need a `caption` where useful plus correctly scoped `th` headers.
- Use descriptive link text. Avoid ambiguous labels such as “click here”, “more”, or “read more” without context.

```html
<a class="skip-link" href="#main-content">Skip to main content</a>
<header>…</header>
<nav aria-label="Primary">…</nav>
<main id="main-content" tabindex="-1">
    <h1>Page title</h1>
</main>
```

### Native controls and ARIA

Follow the five rules of ARIA:

1. Prefer native HTML controls over ARIA replacements.
2. Do not overwrite native semantics with redundant or incompatible roles.
3. Every ARIA control must be fully keyboard operable.
4. Never put `aria-hidden="true"` on, or around, a focusable control.
5. Every interactive element needs an accessible name.

- Do **not** use a clickable `div` or `span`. Use a `button` for actions and an `a` with `href` for navigation.
- Do not add redundant roles: `button` already has `role="button"`; `nav` already has `role="navigation"`.
- Icon-only buttons need an explicit name, and purely decorative icons should be hidden from assistive technology.
- If a custom ARIA pattern is genuinely necessary, implement all required properties and the full expected keyboard model. For example, a tab requires `aria-selected`, and a custom checkbox requires correct `aria-checked` state.

```html
<button type="button" aria-label="Close dialog">
    <svg aria-hidden="true" focusable="false">…</svg>
</button>
```

### Keyboard and focus

- Every function must work with a keyboard. Native buttons activate on Enter and Space; links activate on Enter.
- Keep DOM and visual focus order meaningful. Never use a positive `tabindex`; use only `0` or `-1` when required.
- Do not remove outlines unless replacing them with an equally visible `:focus-visible` indicator with at least 3:1 contrast.
- Pair hover-only disclosure and interactions with focus behavior. Content shown on hover or focus must be dismissible, hoverable, and persistent long enough to use.
- Modals must prevent background interaction, keep focus within the dialog, close on Escape except where dismissal would be destructive, and return focus to the trigger (or the best remaining logical target). Prefer the native `<dialog>` API.
- Make controls and their spacing at least 24 by 24 CSS pixels when not covered by a WCAG exception. Do not rely on drag-only gestures; provide a click/tap alternative.

```css
:focus-visible {
    outline: 3px solid #005fcc;
    outline-offset: 3px;
}

.skip-link {
    position: absolute;
    top: -5rem;
    left: 0;
    z-index: 100;
    padding: 0.5rem 1rem;
    background: #000;
    color: #fff;
}
.skip-link:focus {
    top: 0;
}
```

### Forms and validation

- Associate every input with a visible `label` (`htmlFor` in JSX). A placeholder is only a hint, never the sole label.
- Use the native `required` attribute and communicate required fields in text, not color or an asterisk alone.
- Use appropriate `type`, `name`, and `autocomplete` values for personal-data fields; never block paste or autofill for authentication.
- On validation failure, mark the control `aria-invalid="true"`, link the textual error with `aria-describedby`, and focus the first invalid field or a focused error summary.
- Use clear text to identify errors and, when possible, explain how to correct them. Confirm or make consequential submissions reversible.

```html
<label for="email">Email address</label>
<input
    id="email"
    name="email"
    type="email"
    autocomplete="email"
    aria-invalid="true"
    aria-describedby="email-error"
    required
/>
<p id="email-error" role="alert">Enter a valid email address.</p>
```

### Images, media, and dynamic content

- Give informational images concise, useful `alt` text. Use `alt=""` for decorative images. Do not omit `alt`.
- Give icon SVGs `aria-hidden="true"` when decorative; make functional icons part of the parent control’s accessible name.
- Supply synchronized captions for prerecorded video, and transcripts or appropriate alternatives for audio/video-only material.
- Do not autoplay audio. Autoplaying video must be muted and have controls.
- Announce injected success and status information with a pre-existing polite live region; use an assertive alert only for urgent errors.

```html
<p role="status" aria-live="polite">Changes saved.</p>
<p role="alert">Unable to save changes. Try again.</p>
```

### Visual design and motion

- Meet 4.5:1 contrast for normal text and 3:1 for large text. UI boundaries, meaningful icons, and focus indicators need 3:1 contrast against adjacent colors.
- Never communicate errors, status, or selected state by color alone; pair color with text, iconography, pattern, or another non-color cue.
- Use responsive layouts that reflow at 320 CSS pixels without two-dimensional scrolling. Favor flexible Grid/Flex layouts and relative typography (`rem`/`em`) over rigid dimensions.
- Preserve content and functionality at 200% text zoom and user-adjusted text spacing.
- Respect motion preferences; avoid non-essential movement for people who request reduced motion.

```css
@media (prefers-reduced-motion: no-preference) {
    .card {
        transition: transform 180ms ease;
    }
    .card:hover {
        transform: translateY(-2px);
    }
}
```

## Framework Notes

### React / Next.js

- Write `htmlFor`, not `for`, on labels.
- Keep component roots stable where practical so focus is not lost during conditional re-renders.
- Give every route a unique title and a meaningful `h1`. Ensure route changes are announced; Next.js route announcements derive from the title and heading.
- Do not inject HTML without sanitizing and validating its headings, links, images, and ARIA semantics.

### Vue

- Use a native `button` rather than `@click` on a non-interactive element.
- When `v-if` creates an important panel or dialog, move focus to it after `nextTick`; restore focus after it closes.
- Sanitize and validate `v-html` content for accessible structure.

### Angular

- Use native buttons instead of `(click)` on `div` or `span`.
- Prefer Angular CDK Dialog or apply focus trapping and restoration correctly for custom dialogs.
- Announce route changes with `LiveAnnouncer` and expose form validation through `aria-invalid` and `aria-describedby`.

## WCAG 2.2 AA Release Checklist

- [ ] Page language, landmarks, skip link, headings, and link text are meaningful.
- [ ] Controls use correct native elements, have accessible names, and work with keyboard alone.
- [ ] Focus is visible, sensibly ordered, never obscured, and restored after overlays close.
- [ ] Forms have labels, input-purpose autocomplete, linked text errors, and usable validation focus handling.
- [ ] Images and media have appropriate text alternatives and captions.
- [ ] Dynamic updates are announced without unexpectedly moving focus.
- [ ] Text meets contrast requirements; state is not color-only; controls meet non-text contrast.
- [ ] Layout reflows at 320px and at 200% zoom; touch targets are adequate.
- [ ] Animation respects `prefers-reduced-motion`.

## Severity Guidance

Treat as **blocking**: inaccessible custom controls, missing names/labels, keyboard traps, hidden focusable elements, invisible focus, missing critical image alternatives or captions, color-only essential information, and missing data-table headers.

Treat as **high priority**: skip-link absence, heading/landmark issues, unannounced dynamic changes, focus not restored after a modal, unlinked form errors, insufficient responsive reflow, and hover-only functionality.

WCAG 2.2 AA is the project target and subsumes current WCAG 2.0/2.1 AA-based obligations.
