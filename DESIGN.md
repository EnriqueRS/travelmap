# DESIGN.md - TravelMap Design System

> This document defines the canonical design system for TravelMap. All new UI code MUST follow these specifications. When AI agents or developers generate UI, they MUST reference this document to ensure visual consistency across the application.

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Design Tokens](#2-design-tokens)
3. [Typography](#3-typography)
4. [Color System](#4-color-system)
5. [Spacing Scale](#5-spacing-scale)
6. [Border Radius Scale](#6-border-radius-scale)
7. [Shadows](#7-shadows)
8. [Component Specifications](#8-component-specifications)
9. [Layout Patterns](#9-layout-patterns)
10. [Iconography](#10-iconography)
11. [Theming](#11-theming)
12. [Migration Plan](#12-migration-plan)

---

## 1. Current State Audit

The TravelMap frontend has significant visual inconsistencies. A comprehensive audit revealed the following critical problems:

### 1.1 Button Inconsistencies

There are **20+ distinct button styles** across the application. The same semantic action (e.g., "delete") uses wildly different visual treatments depending on the page.

| Problem | Details |
|---|---|
| `btn-primary` naming collision | The global `.btn-primary` (app.css) is a **grey/muted** button (`bg-background-tertiary`), while scoped `.btn-primary` in Profile and Trip pages is **blue** (`#3b82f6`). The actual blue primary action button globally is `.btn-accent`. This is extremely confusing. |
| Delete/Danger styles vary | 7 different danger styles found: solid red, ghost red, semi-transparent red (with 3 different opacity levels: 0.1, 0.15, 0.2), different border opacities, different text colors (`#ef4444` vs `#f87171`), different radius (6px, 8px, 12px). |
| Border radius varies | Buttons use 6px, 8px, 10px, 12px, and `0.75rem` across different components. |
| Padding varies | `px-4 py-2`, `0.6rem 2rem`, `0.75rem 1rem`, `1rem 2rem`, `0.75rem 1.5rem` -- no consistent scale. |
| Hardcoded colors | Buttons in ProvinceExplorer, AlbumModal, Profile, Trip detail, and MapContainer all use hardcoded hex colors instead of CSS custom properties. |

**Specific examples of the same action with different styling:**

- **Delete trip** in Trip detail: `rgba(239,68,68,0.1)` bg, `#f87171` text, `1px solid rgba(239,68,68,0.2)` border, `12px` radius
- **Delete photo** in AlbumModal: `#ef4444` solid bg, `white` text, no border, `8px` radius
- **Unlink album** in Trip detail: `bg-red-500/10` bg, `text-red-500` text, `border-red-500/20` border, Tailwind radius
- **Logout** in Navbar: `rgba(239,68,68,0.1)` bg, `#ef4444` text, `border: transparent`, `8px` radius

### 1.2 Modal Inconsistencies

There are **6+ distinct modal architectures**:

| Problem | Details |
|---|---|
| Backdrop opacity | Ranges from `0.6` to `0.85` -- some use `bg-black/60`, others `rgba(2,6,23,0.85)`, others `rgba(0,0,0,0.8)` |
| Border radius | Ranges from `8px` to `32px` across modals |
| Header pattern | Some have icon boxes, some have borders, some have neither -- no consistent header structure |
| Close button | Varies between an X icon, `&times;` text entity, different sizes and positions |
| Glassmorphism | Some modals use `backdrop-filter: blur(12px)`, others use `blur(4px)`, others `blur(8px)`, some none |

### 1.3 Input Field Inconsistencies

There are **7+ distinct input implementations**:

| Pattern | Location | Background | Border | Focus Style |
|---|---|---|---|---|
| `.input-box` (global) | New trip, LocationPicker | `bg-background-tertiary` | `border-border` | `ring-2 ring-accent-primary` |
| `.premium-input` | Map modal, Trip edit | `#141c2f` | `1px solid #1e293b` | `border-color: #3b82f6` (no ring) |
| `.auth-input-wrap` | Login/Register | `rgba(30,41,59,0.8)` | `1px solid rgba(71,85,105,0.6)` | `box-shadow: 0 0 0 2px rgba(59,130,246,0.25)` |
| `.form-group-modern` | Profile | `#0f172a` | `1px solid #334155` | `box-shadow: 0 0 0 2px rgba(59,130,246,0.2)` |
| `.custom-input` | DatePicker | `#0f172a` | `1px solid #475569` | `border-color: #60a5fa; background: #1e293b` |

### 1.4 Card Inconsistencies

There are **8+ distinct card patterns**:

| Problem | Details |
|---|---|
| Background color | Uses `#0f172a`, `#141c2f`, `#1e293b`, `var(--color-bg-secondary)`, `rgba(30,41,59,0.4)` -- all slightly different dark shades |
| Border radius | `8px`, `12px`, `16px` used interchangeably |
| Border color | `#334155`, `#1e293b`, `#475569`, `var(--color-border)` all used |
| Hover effects | Some cards have shadow transitions, some have scale transforms, some have none |

### 1.5 Hardcoded Color Problem

This is the most critical issue. Many components bypass the CSS custom property theming system entirely:

| Variable | Hardcoded As | Found In |
|---|---|---|
| `--color-bg-main` (`#0f172a`) | `#0f172a` | ProvinceExplorer, Map, DatePicker, Profile, AlbumModal, Trip detail |
| `--color-bg-secondary` (`#1e293b`) | `#1e293b` | ProvinceExplorer, AlbumModal, Profile |
| `--color-bg-tertiary` (`#334155`) | `#141c2f`, `#334155` | ProvinceExplorer, Map modals |
| `--color-text-muted` (`#64748b`) | `#64748b` | ProvinceExplorer, ProvinceMultiSelect, Toast, AlbumModal |
| `--color-accent-primary` (`#3b82f6`) | `#3b82f6`, `#60a5fa` | Used interchangeably |
| `--color-border` (`#334155`) | `#334155`, `#1e293b`, `#475569` | Mixed across files |

**Impact:** The Light theme and Neon Obsidian theme are functionally broken for ProvinceExplorer, AlbumModal, Toast, DatePicker, Login, Register, and the Landing page because these components use hardcoded dark colors that don't respond to theme changes.

### 1.6 Typography Inconsistencies

| Element | Size Range Found | Weight Range |
|---|---|---|
| h1 | `1.25rem` to `4rem` (5x variance) | normal to 800 |
| Form labels | `0.7rem` to `0.875rem` | 500 to 700 |
| Body text | `0.8rem` to `1rem` | 400 to 500 |

### 1.7 Border Radius Inconsistencies

No consistent radius scale exists. The following values appear across the codebase:

- **Buttons:** 4px, 6px, 8px, 10px, 12px, 9999px (pill)
- **Inputs:** 8px, 10px, 12px
- **Cards:** 8px, 12px, 16px, 20px, 24px, 28px
- **Modals:** 8px, 16px, 20px, 24px, 28px, 32px
- **Badges/Pills:** 4px, 6px, 8px, 9999px

---

## 2. Design Tokens

> **Rule:** All color values, spacing, and sizing in component code MUST reference these tokens via CSS custom properties or Tailwind utility classes. Hardcoded hex values are PROHIBITED in component files.

### Token Naming Convention

```
--{category}-{property}-{variant}
```

Examples: `--color-bg-main`, `--color-text-muted`, `--radius-md`

---

## 3. Typography

### Font Families

| Token | Value | Usage |
|---|---|---|
| `--font-heading` | `"Plus Jakarta Sans", system-ui, sans-serif` | All headings (h1-h6), card titles, modal titles |
| `--font-body` | `Inter, system-ui, sans-serif` | Body text, labels, inputs, buttons, all non-heading text |
| `--font-mono` | `"JetBrains Mono", "Fira Code", monospace` | Code, coordinates, technical data |

### Type Scale

| Level | Size | Weight | Line Height | Tailwind | Usage |
|---|---|---|---|---|---|
| Display | `2.25rem` (36px) | 700 | 1.2 | -- | Landing hero only |
| h1 | `1.875rem` (30px) | 700 | 1.3 | `text-3xl` | Page titles |
| h2 | `1.5rem` (24px) | 600 | 1.3 | `text-2xl` | Section titles, modal titles |
| h3 | `1.25rem` (20px) | 600 | 1.4 | `text-xl` | Card titles, subsections |
| h4 | `1.125rem` (18px) | 600 | 1.4 | `text-lg` | Small section headers |
| Body large | `1rem` (16px) | 400 | 1.5 | `text-base` | Primary body text |
| Body | `0.875rem` (14px) | 400 | 1.5 | `text-sm` | Default body, card content |
| Caption | `0.75rem` (12px) | 500 | 1.5 | `text-xs` | Timestamps, metadata, helper text |

### Font Weights

| Token | Value | Usage |
|---|---|---|
| Normal | 400 | Body text |
| Medium | 500 | Labels, buttons, emphasis |
| Semibold | 600 | Subheadings, card titles |
| Bold | 700 | Page headings, hero text |

---

## 4. Color System

### 4.1 Semantic Color Tokens (Theme-Aware)

These tokens MUST be the only colors used in component code. They map to different values per theme.

#### Background

| Token | Default (Sea Blue) | Light | Neon Obsidian | Tailwind |
|---|---|---|---|---|
| `--color-bg-main` | `#0f172a` | `#f8fafc` | `#050505` | `bg-background-main` |
| `--color-bg-secondary` | `#1e293b` | `#ffffff` | `#0a0a0a` | `bg-background-secondary` |
| `--color-bg-tertiary` | `#334155` | `#f1f5f9` | `#141414` | `bg-background-tertiary` |
| `--color-bg-elevated` | `#1e293b` | `#ffffff` | `#141414` | `bg-background-elevated` |

> `--color-bg-elevated` is NEW. Used for popover, dropdown, and floating element backgrounds. In dark themes it equals `secondary`, in light themes it is white (with shadow).

#### Text

| Token | Default (Sea Blue) | Light | Neon Obsidian | Tailwind |
|---|---|---|---|---|
| `--color-text-primary` | `#f8fafc` | `#0f172a` | `#ffffff` | `text-text-primary` |
| `--color-text-secondary` | `#94a3b8` | `#475569` | `#a3a3a3` | `text-text-secondary` |
| `--color-text-muted` | `#64748b` | `#64748b` | `#737373` | `text-text-muted` |
| `--color-text-inverse` | `#0f172a` | `#f8fafc` | `#050505` | `text-text-inverse` |

> `--color-text-inverse` is NEW. Used for text on accent-colored backgrounds (white text on blue buttons, etc.).

#### Accent / Brand

| Token | Default (Sea Blue) | Light | Neon Obsidian | Tailwind |
|---|---|---|---|---|
| `--color-accent-primary` | `#3b82f6` | `#0ea5e9` | `#00f0ff` | `bg-accent-primary` |
| `--color-accent-hover` | `#2563eb` | `#0284c7` | `#ff003c` | `bg-accent-hover` |
| `--color-accent-muted` | `rgba(59,130,246,0.15)` | `rgba(14,165,233,0.15)` | `rgba(0,240,255,0.15)` | -- |
| `--color-accent-text` | `#60a5fa` | `#0284c7` | `#00f0ff` | -- |

> `--color-accent-muted` and `--color-accent-text` are NEW. Used for subtle accent highlights and accent-colored text links.

#### Border

| Token | Default (Sea Blue) | Light | Neon Obsidian | Tailwind |
|---|---|---|---|---|
| `--color-border` | `#334155` | `#e2e8f0` | `#262626` | `border-border` |
| `--color-border-light` | `#475569` | `#cbd5e1` | `#404040` | `border-border-light` |

#### Status Colors (Theme-Invariant)

These colors MUST NOT change across themes. They convey fixed semantic meaning.

| Token | Value | Usage | Tailwind |
|---|---|---|---|
| `--color-danger` | `#ef4444` | Destructive actions, errors | -- |
| `--color-danger-hover` | `#dc2626` | Destructive action hover | -- |
| `--color-danger-muted` | `rgba(239,68,68,0.1)` | Muted danger background | -- |
| `--color-danger-border` | `rgba(239,68,68,0.2)` | Muted danger border | -- |
| `--color-danger-text` | `#f87171` | Danger text on dark bg | -- |
| `--color-success` | `#10b981` | Success states, confirmations | -- |
| `--color-success-muted` | `rgba(16,185,129,0.1)` | Muted success background | -- |
| `--color-warning` | `#f59e0b` | Warning states | -- |
| `--color-warning-muted` | `rgba(245,158,11,0.1)` | Muted warning background | -- |
| `--color-info` | `#3b82f6` | Informational | -- |

#### Map Status Colors

| Token | Value | Usage |
|---|---|---|
| `--color-map-visited` | `#3b82f6` | Visited country/province fill |
| `--color-map-planned` | `#f59e0b` | Planned trip fill |
| `--color-map-home` | `#ef4444` | Home marker |
| `--color-map-highlight` | `#60a5fa` | Hover/selected feature |

### 4.2 Color Usage Rules

1. **NEVER use hardcoded hex colors in component files.** Always use CSS custom properties or Tailwind utility classes that reference them.
2. **NEVER use Tailwind's `red-500`, `green-500`, etc. directly.** Use the semantic status tokens (`--color-danger`, `--color-success`) instead.
3. **The ONLY place hardcoded colors are acceptable** is the `:root` block in `app.css` where theme variables are defined.
4. **When a color is not in the token system**, add a new token rather than hardcoding.

---

## 5. Spacing Scale

All spacing MUST use the following scale. Arbitrary values are PROHIBITED.

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--space-0` | 0 | `0` | -- |
| `--space-1` | `0.25rem` (4px) | `p-1`, `gap-1` | Tight: icon padding, badge inner |
| `--space-2` | `0.5rem` (8px) | `p-2`, `gap-2` | Compact: small button padding, tight gaps |
| `--space-3` | `0.75rem` (12px) | `p-3`, `gap-3` | Default: input padding, list item gaps |
| `--space-4` | `1rem` (16px) | `p-4`, `gap-4` | Standard: card padding, section gaps |
| `--space-5` | `1.25rem` (20px) | `p-5`, `gap-5` | Relaxed: larger card padding |
| `--space-6` | `1.5rem` (24px) | `p-6`, `gap-6` | Spacious: page section gaps, modal padding |
| `--space-8` | `2rem` (32px) | `p-8`, `gap-8` | Large: page margins, major sections |
| `--space-10` | `2.5rem` (40px) | `p-10`, `gap-10` | Extra: hero spacing |
| `--space-12` | `3rem` (48px) | `p-12`, `gap-12` | Maximum: page-level gaps |

### Component Spacing Defaults

| Component | Inner Padding | Gap Between Children |
|---|---|---|
| Button (sm) | `px-3 py-1.5` | `gap-1.5` |
| Button (md) | `px-4 py-2` | `gap-2` |
| Button (lg) | `px-6 py-3` | `gap-2` |
| Input | `px-3 py-2` | -- |
| Card | `p-4` or `p-5` | `gap-3` |
| Modal header | `p-5 pb-4` | -- |
| Modal body | `p-5 pt-0` | `gap-4` |
| Modal footer | `p-5 pt-4` | `gap-3` |
| Page section | `py-6` | `gap-6` |

---

## 6. Border Radius Scale

All border-radius values MUST use the following scale. Arbitrary values are PROHIBITED.

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--radius-none` | 0 | `rounded-none` | -- |
| `--radius-sm` | `0.25rem` (4px) | `rounded-sm` | Small elements: badges, chip labels, Neon Obsidian buttons |
| `--radius-md` | `0.375rem` (6px) | `rounded-md` | Inputs, small cards |
| `--radius-base` | `0.5rem` (8px) | `rounded-lg` | Default: buttons, inputs, small cards, avatars |
| `--radius-lg` | `0.75rem` (12px) | `rounded-xl` | Cards, dropdowns, large buttons |
| `--radius-xl` | `1rem` (16px) | `rounded-2xl` | Modals, large containers |
| `--radius-2xl` | `1.5rem` (24px) | `rounded-3xl` | Hero cards, feature containers |
| `--radius-full` | `9999px` | `rounded-full` | Pills, circular avatars |

### Component Radius Defaults

| Component | Radius |
|---|---|
| Button | `--radius-base` (8px) |
| Input / Select | `--radius-base` (8px) |
| Card | `--radius-lg` (12px) |
| Modal | `--radius-xl` (16px) |
| Badge / Chip | `--radius-full` (pill) or `--radius-sm` (4px) |
| Toast | `--radius-lg` (12px) |
| Dropdown | `--radius-lg` (12px) |
| Avatar | `--radius-full` (circle) |

---

## 7. Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle: resting cards |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` | Default: elevated cards, dropdowns |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | Prominent: modals, popovers |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` | Maximum: floating elements |

For dark themes, shadows should use `rgba(0,0,0,0.3)` to `rgba(0,0,0,0.5)` for visibility.

---

## 8. Component Specifications

### 8.1 Buttons

There are exactly **5 button variants**. No other button styles are permitted.

#### Variants

| Variant | CSS Class | Background | Text | Border | Shadow | Usage |
|---|---|---|---|---|---|---|
| **Primary** (accent) | `.btn-primary` | `var(--color-accent-primary)` | `var(--color-text-inverse)` | `1px solid var(--color-accent-primary)` | `--shadow-md` | Primary CTA: "Save", "Create", "Submit" |
| **Secondary** | `.btn-secondary` | `var(--color-bg-tertiary)` | `var(--color-text-primary)` | `1px solid var(--color-border)` | `--shadow-sm` | Secondary actions: "Cancel", "Close", alternative |
| **Ghost** | `.btn-ghost` | `transparent` | `var(--color-text-secondary)` | `1px solid transparent` | none | Tertiary: toolbar actions, inline links |
| **Danger** | `.btn-danger` | `var(--color-danger-muted)` | `var(--color-danger-text)` | `1px solid var(--color-danger-border)` | none | Destructive: "Delete", "Remove", "Logout" |
| **Danger Solid** | `.btn-danger-solid` | `var(--color-danger)` | `#ffffff` | `1px solid var(--color-danger)` | `--shadow-sm` | Confirmation of destructive action |

> **CRITICAL: The current global `.btn-primary` (which is grey/muted) is being renamed to `.btn-secondary`.** The blue/accent button becomes the new `.btn-primary`. This aligns with industry conventions where "primary" means the main action.

#### Sizes

| Size | Padding | Font Size | Min Height | Gap |
|---|---|---|---|---|
| Small (sm) | `px-3 py-1.5` | `0.75rem` (12px) | `28px` | `0.375rem` |
| Medium (md) | `px-4 py-2` | `0.875rem` (14px) | `36px` | `0.5rem` |
| Large (lg) | `px-6 py-2.5` | `1rem` (16px) | `44px` | `0.5rem` |

#### States

| State | Primary | Secondary | Ghost | Danger |
|---|---|---|---|---|
| **Hover** | `bg: var(--color-accent-hover)` | `bg: var(--color-border)` | `bg: var(--color-bg-tertiary); color: var(--color-text-primary)` | `bg: rgba(239,68,68,0.2)` |
| **Active** | scale(0.98) | scale(0.98) | scale(0.98) | scale(0.98) |
| **Focus** | `ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-main` | same | same | `ring-2 ring-red-500 ring-offset-2` |
| **Disabled** | `opacity-50; cursor-not-allowed` | same | same | same |
| **Loading** | Show spinner, disable interaction | same | same | same |

#### Button with Icon

- Icon position: left of text by default
- Icon size: matches font size (16px for md)
- Gap between icon and text: `--space-2` (8px)
- Icon-only button: square padding, `aria-label` required

#### Button Rules

1. Every button MUST have a `size` prop defaulting to `md`.
2. Every button MUST have a `variant` prop defaulting to `primary`.
3. Danger solid variant is ONLY for confirmation dialogs, not for initial delete buttons.
4. Icons in buttons MUST come from `lucide-svelte` only.
5. No emoji in buttons.

### 8.2 Inputs

There is exactly **1 input variant** with consistent styling.

| Property | Value |
|---|---|
| CSS Class | `.input-box` |
| Background | `var(--color-bg-tertiary)` |
| Border | `1px solid var(--color-border)` |
| Border Radius | `var(--radius-base)` (8px) |
| Padding | `0.625rem 0.75rem` (py-2.5 px-3) |
| Font | `var(--font-body)`, `0.875rem` |
| Text Color | `var(--color-text-primary)` |
| Placeholder Color | `var(--color-text-muted)` |

#### Input States

| State | Border | Ring | Background |
|---|---|---|---|
| **Default** | `var(--color-border)` | none | `var(--color-bg-tertiary)` |
| **Hover** | `var(--color-border-light)` | none | `var(--color-bg-tertiary)` |
| **Focus** | `var(--color-accent-primary)` | `ring-2 ring-accent-primary/20` | `var(--color-bg-tertiary)` |
| **Error** | `var(--color-danger)` | `ring-2 ring-red-500/20` | `var(--color-bg-tertiary)` |
| **Disabled** | `var(--color-border)` | none | `var(--color-bg-secondary)` + `opacity-60` |

#### Input with Label

- Label uses `.form-label`: `block text-sm font-medium text-text-secondary mb-1`
- Error message: `text-xs text-red-400 mt-1`

### 8.3 Modals

There is exactly **1 modal system** with consistent behavior.

| Property | Value |
|---|---|
| Backdrop | `bg-black/60 backdrop-blur-sm` |
| Container radius | `--radius-xl` (16px) |
| Container background | `var(--color-bg-secondary)` |
| Container border | `1px solid var(--color-border)` |
| Max width (sm) | `400px` |
| Max width (md) | `560px` |
| Max width (lg) | `720px` |
| Max width (full) | `90vw` |

#### Modal Structure

```
ModalOverlay
  +- ModalContainer (centered, max-w-*)
     +- ModalHeader (px-5 py-4, border-bottom: 1px solid var(--color-border))
     |   +- ModalTitle (text-lg font-semibold text-text-primary)
     |   +- ModalCloseButton (absolute top-4 right-4, btn-ghost with X icon)
     +- ModalBody (px-5 py-4)
     +- ModalFooter (px-5 py-4, border-top: 1px solid var(--color-border), flex justify-end gap-3)
```

#### Mobile Bottom Sheet Variant

On mobile (`< 768px`), modals SHOULD render as bottom sheets:
- Position: `fixed bottom-0 left-0 right-0`
- Top radius: `--radius-2xl` (24px)
- Max height: `85vh`
- Drag handle: centered bar `w-10 h-1 bg-border-light rounded-full` at top

#### Modal Rules

1. All modals MUST use the same `ModalOverlay` + `ModalContainer` wrapper.
2. Close button is ALWAYS an X icon from `lucide-svelte`, positioned `top-4 right-4`.
3. No `&times;` HTML entity -- always use the Lucide `X` icon.
4. Backdrop blur is ALWAYS `4px` (not 8px, not 12px).
5. Backdrop opacity is ALWAYS `0.6` (not 0.85, not 0.8).

### 8.4 Cards

There are exactly **2 card variants**.

| Variant | CSS Class | Background | Border | Radius | Shadow | Usage |
|---|---|---|---|---|---|---|
| **Default** | `.card` | `var(--color-bg-secondary)` | `1px solid var(--color-border)` | `--radius-lg` (12px) | `--shadow-sm` | Standard card |
| **Elevated** | `.card-elevated` | `var(--color-bg-elevated)` | `1px solid var(--color-border-light)` | `--radius-lg` (12px) | `--shadow-md` | Floating cards, popovers |

#### Card Structure

```
Card
 +- CardHeader (px-4 py-3, optional border-bottom)
 |   +- CardTitle (text-base font-semibold)
 |   +- CardDescription (text-sm text-text-secondary)
 +- CardBody (px-4 py-4)
 +- CardFooter (px-4 py-3, optional border-top)
```

### 8.5 Badges / Chips

| Variant | Background | Text | Border | Radius | Usage |
|---|---|---|---|---|---|
| **Default** | `var(--color-bg-tertiary)` | `var(--color-text-secondary)` | `1px solid var(--color-border)` | `--radius-sm` (4px) | Neutral tags |
| **Accent** | `var(--color-accent-muted)` | `var(--color-accent-text)` | `1px solid var(--color-accent-primary)` | `--radius-sm` | Highlighted tags |
| **Danger** | `var(--color-danger-muted)` | `var(--color-danger-text)` | `1px solid var(--color-danger-border)` | `--radius-sm` | Error/danger tags |
| **Pill** | `var(--color-bg-tertiary)` | `var(--color-text-primary)` | `1px solid var(--color-border)` | `--radius-full` | Selectable filter chips |

Badge padding: `px-2 py-0.5`, font size: `0.75rem`, font weight: 500.

### 8.6 Toast Notifications

| Property | Value |
|---|---|
| Position | `fixed top-4 right-4` (desktop), `fixed top-4 left-4 right-4` (mobile) |
| Background | `var(--color-bg-elevated)` |
| Border | `1px solid var(--color-border)` |
| Radius | `--radius-lg` (12px) |
| Shadow | `--shadow-lg` |
| Success icon color | `var(--color-success)` |
| Error icon color | `var(--color-danger)` |
| Warning icon color | `var(--color-warning)` |
| Auto-dismiss | 4 seconds (success), 6 seconds (error) |

### 8.7 Select / Dropdown

- Uses `.input-box` base styling
- Dropdown panel: `var(--color-bg-elevated)` bg, `--radius-lg` radius, `--shadow-lg` shadow
- Selected item: `var(--color-accent-muted)` bg, `var(--color-accent-text)` text
- Hover item: `var(--color-bg-tertiary)` bg

### 8.8 Scrollbar

All scrollable containers MUST use a single, consistent scrollbar style:

```css
scrollbar-width: thin;
scrollbar-color: var(--color-border-light) transparent;
```

WebKit:
```css
&::-webkit-scrollbar { width: 6px; }
&::-webkit-scrollbar-track { background: transparent; }
&::-webkit-scrollbar-thumb { background-color: var(--color-border-light); border-radius: 10px; }
```

---

## 9. Layout Patterns

### Page Layout

```
Page
 +- Navbar (fixed top, h-14 or h-16, bg-background-main/95 backdrop-blur)
 +- Content (pt-14 or pt-16, min-h-screen)
 |   +- PageHeader (px-4 md:px-6 pt-6 pb-4)
 |   |   +- Title (h1, text-2xl font-bold)
 |   |   +- Description (text-sm text-text-secondary)
 |   +- PageBody (px-4 md:px-6 pb-6)
 +- BottomNav (fixed bottom, h-14, mobile only, bg-background-main/95 backdrop-blur)
```

### Grid Patterns

| Layout | Mobile | Desktop |
|---|---|---|
| Card grid | 1 column | 2-3 columns, `gap-4` |
| Form grid | 1 column | 2 columns for short fields |
| Stats grid | 2 columns | 3-4 columns |

### Responsive Breakpoints

| Breakpoint | Min Width | Target |
|---|---|---|
| `sm` | 640px | Large phones landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |

---

## 10. Iconography

- **Icon library:** `lucide-svelte` ONLY. No other icon libraries, no emoji as icons.
- **Default size:** 20px (`w-5 h-5`) for inline, 16px (`w-4 h-4`) for buttons, 24px (`w-6 h-6`) for standalone.
- **Stroke width:** 2 (lucide default)
- **Color:** Inherit from parent unless intentionally different.
- **Interactive icons** (clickable): MUST have `cursor-pointer` and appropriate hover states.

---

## 11. Theming

### Theme Architecture

Themes are implemented via CSS custom properties on a root-level class (`:root`, `.theme-light`, `.theme-neon-obsidian`). Components MUST ONLY reference CSS custom properties, never hardcoded colors.

### Theme-Specific Overrides

The Neon Obsidian theme has specific visual treatments that override base components:

| Component | Override |
|---|---|
| Card | Glassmorphism: `background: rgba(10,10,10,0.7); backdrop-filter: blur(12px); border: 1px solid rgba(0,240,255,0.2)` |
| Button Primary | Outline style: transparent bg, cyan border, glow shadow |
| Inputs | Sharper radius: `--radius-sm` (4px) instead of `--radius-base` (8px) |
| Accent hover | Cyberpunk magenta (`--color-accent-hover: #ff003c`) |

### Theme Compliance Checklist

Every component MUST pass this checklist:

- [ ] No hardcoded hex, rgb, or hsl color values
- [ ] All colors reference CSS custom properties or Tailwind utilities
- [ ] Background, text, border, and accent colors all respond to theme changes
- [ ] Component renders correctly in all 3 themes (Sea Blue, Light, Neon Obsidian)
- [ ] Status colors (danger, success, warning) are theme-invariant

---

## 12. Migration Plan

### Phase 1: Foundation (No visual changes yet)

1. **Add missing CSS custom properties** to `:root` in `app.css`:
   - `--color-bg-elevated`
   - `--color-text-inverse`
   - `--color-accent-muted`, `--color-accent-text`
   - `--color-danger` through `--color-danger-border`
   - `--color-success`, `--color-success-muted`
   - `--color-warning`, `--color-warning-muted`
   - `--color-bg-main` through `--color-border` in `.theme-light` and `.theme-neon-obsidian` for the new tokens
   - `--radius-sm` through `--radius-full`
   - `--shadow-sm` through `--shadow-xl`

2. **Rename button classes** in `app.css`:
   - `.btn-primary` (grey) becomes `.btn-secondary`
   - `.btn-accent` (blue) becomes `.btn-primary`
   - `.btn-ghost` stays `.btn-ghost`
   - `.btn-danger` stays `.btn-danger`
   - Add `.btn-danger-solid`

3. **Update Tailwind config** to include new tokens

### Phase 2: Component-by-Component Migration

For each component, the migration follows this pattern:

1. Replace hardcoded colors with CSS custom property references
2. Replace arbitrary radius values with token scale
3. Replace arbitrary padding/margin with spacing scale
4. Update button variants to new naming
5. Verify component renders correctly in all 3 themes

**Priority order for migration** (highest impact first):

| Priority | Component | Current Problems | Files |
|---|---|---|---|
| 1 | ProvinceExplorer | Fully hardcoded, breaks theming | `ProvinceExplorer.svelte` |
| 2 | AlbumModal | Fully hardcoded | `AlbumModal.svelte` |
| 3 | Profile page | 3+ button varieties, 2+ input styles | `profile/+page.svelte` |
| 4 | Trip detail | 4+ button styles, inconsistent cards | `trips/[id]/+page.svelte` |
| 5 | Map modals (location/trip) | `.premium-*` classes with hardcoded values | Map modal components |
| 6 | MapContainer | Hardcoded Leaflet popup styles | `MapContainer.svelte` |
| 7 | Login/Register | Hardcoded auth styles | `login/+page.svelte`, `register/+page.svelte` |
| 8 | Landing page | Separate button system | `+page.svelte` |
| 9 | Trips list | Multiple card/button styles | `trips/+page.svelte` |
| 10 | Toast | Hardcoded colors | Toast component |
| 11 | DatePicker | Hardcoded flatpickr overrides | DatePicker component |
| 12 | CountryPicker/ProvinceMultiSelect | Mix of variables and hardcoded | Select components |

### Phase 3: Cleanup

1. Remove all `.premium-*` scoped CSS classes -- they should use the canonical `.btn-primary`, `.input-box`, etc.
2. Remove all scoped `.btn` blocks in component `<style>` sections
3. Remove the `#141c2f` color from the codebase entirely
4. Consolidate scrollbar styles to a single shared class
5. Verify all 3 themes render correctly on every page
6. Add visual regression tests (if applicable)

### Quick Reference: What to Replace

| Current Pattern | Replace With |
|---|---|
| `#0f172a` | `var(--color-bg-main)` or `bg-background-main` |
| `#1e293b` | `var(--color-bg-secondary)` or `bg-background-secondary` |
| `#334155` | `var(--color-bg-tertiary)` or `var(--color-border)` |
| `#141c2f` | `var(--color-bg-main)` (closest match) |
| `#3b82f6` | `var(--color-accent-primary)` or `bg-accent-primary` |
| `#60a5fa` | `var(--color-accent-text)` |
| `#94a3b8` | `var(--color-text-secondary)` or `text-text-secondary` |
| `#64748b` | `var(--color-text-muted)` or `text-text-muted` |
| `#475569` | `var(--color-border-light)` or `border-border-light` |
| `#ef4444` / `#f87171` | `var(--color-danger)` / `var(--color-danger-text)` |
| `rgba(239,68,68,0.1)` | `var(--color-danger-muted)` |
| `rgba(239,68,68,0.2)` | `var(--color-danger-border)` |
| `.btn-accent` | `.btn-primary` (after Phase 1 rename) |
| `.btn-primary` (grey) | `.btn-secondary` (after Phase 1 rename) |
| `.premium-input` | `.input-box` |
| `.btn-save-premium` | `.btn-primary` |
| `.btn-cancel-premium` | `.btn-secondary` |
| `.btn-delete-premium` | `.btn-danger` |
| `.btn-danger` (solid red in AlbumModal) | `.btn-danger-solid` |
| `.logout-btn` | `.btn-danger` |
| Arbitrary `border-radius` values | Token from `--radius-*` scale |
| Arbitrary `padding`/`margin` values | Token from `--space-*` scale |
