# TravelMap Design System — Horizonte

> This document defines the canonical design system for TravelMap. It is sourced from the **Horizonte** design system defined in the Stitch MCP project (`projects/3992922722222120718`). All new UI code MUST follow these specifications.

---

## Table of Contents

1. [Brand & Style](#1-brand--style)
2. [Design Tokens](#2-design-tokens)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing Scale](#5-spacing-scale)
6. [Border Radius Scale](#6-border-radius-scale)
7. [Shadows & Elevation](#7-shadows--elevation)
8. [Component Specifications](#8-component-specifications)
9. [Layout & Grid](#9-layout--grid)
10. [Iconography](#10-iconography)
11. [Theming](#11-theming)
12. [Migration Plan](#12-migration-plan)
13. [Current State Audit](#13-current-state-audit)

---

## 1. Brand & Style

The design system is built for a modern travel experience, evoking feelings of exploration, reliability, and ease. The personality is adventurous yet structured, providing a "digital compass" for the modern traveler.

The visual style is **Corporate Modern with Glassmorphic accents**. It utilizes high-quality photography as a backdrop for interactive elements, maintaining a professional clarity while introducing depth through subtle translucency and gradients. The UI prioritizes content legibility and ease of navigation through a clean, card-based architecture that feels lightweight and expansive.

---

## 2. Design Tokens

> **Rule:** All color values, spacing, and sizing in component code MUST reference these tokens via CSS custom properties or Tailwind utility classes. Hardcoded hex values are PROHIBITED in component files.

### Token Naming Convention

```
--{category}-{property}-{variant}
```

Examples: `--color-bg-main`, `--color-text-muted`, `--radius-md`

---

## 3. Color System

### 3.1 Brand Palette

The palette is rooted in a sophisticated deep purple-to-blue gradient (`#4a569d`). This primary core is supported by functional neutrals that ensure high accessibility.

| Role | Hex | Usage |
|---|---|---|
| **Primary** | `#4a569d` | High-impact surfaces, hero section, primary buttons, active states |
| **Primary Dark** | `#323e84` | Hover states, pressed states |
| **On Primary** | `#ffffff` | Text on primary backgrounds |
| **Primary Container** | `#ccd1ff` | Container backgrounds, muted primary areas |
| **Secondary** | `#3a5d9e` | Secondary actions, badges |
| **Secondary Container** | `#97b8ff` | Muted secondary backgrounds |
| **Tertiary** | `#2b29bb` | Interactive icons, small callouts |
| **Tertiary Container** | `#4647d3` | Tertiary backgrounds |

### 3.2 Surface & Background Colors

Pure white (`#FFFFFF`) is used for primary cards, while the neutral background (`#f7f9fb`) provides subtle contrast.

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `--color-surface` | `#f7f9fb` | `bg-surface` | Page background |
| `--color-surface-dim` | `#d8dadc` | `bg-surface-dim` | Dimmed surfaces |
| `--color-surface-bright` | `#f7f9fb` | `bg-surface-bright` | Bright surfaces |
| `--color-surface-container-lowest` | `#ffffff` | `bg-surface-container-lowest` | Elevated cards |
| `--color-surface-container-low` | `#f2f4f6` | `bg-surface-container-low` | Subtle containers |
| `--color-surface-container` | `#eceef0` | `bg-surface-container` | Default containers |
| `--color-surface-container-high` | `#e6e8ea` | `bg-surface-container-high` | Elevated containers |
| `--color-surface-container-highest` | `#e0e3e5` | `bg-surface-container-highest` | Highest elevation |

### 3.3 Text Colors

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `--color-on-surface` | `#191c1e` | `text-on-surface` | Primary text |
| `--color-on-surface-variant` | `#454650` | `text-on-surface-variant` | Secondary text |
| `--color-outline` | `#767682` | `text-outline` | Muted text, borders |
| `--color-outline-variant` | `#c6c5d2` | `text-outline-variant` | Subtle borders |

### 3.4 Status Colors (Theme-Invariant)

| Token | Hex | Usage |
|---|---|---|
| `--color-error` | `#ba1a1a` | Destructive actions, errors |
| `--color-on-error` | `#ffffff` | Text on error backgrounds |
| `--color-error-container` | `#ffdad6` | Muted error background |

### 3.5 Map Status Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-map-visited` | `#4a569d` | Visited country/province fill |
| `--color-map-planned` | `#f59e0b` | Planned trip fill |
| `--color-map-home` | `#ef4444` | Home marker |
| `--color-map-highlight` | `#6366f1` | Hover/selected feature |

### 3.6 Color Usage Rules

1. **NEVER use hardcoded hex colors in component files.** Always use CSS custom properties or Tailwind utility classes that reference them.
2. **NEVER use Tailwind's `red-500`, `green-500`, etc. directly.** Use the semantic status tokens instead.
3. **The ONLY place hardcoded colors are acceptable** is the `:root` block in `app.css` where theme variables are defined.
4. **When a color is not in the token system**, add a new token rather than hardcoding.

---

## 4. Typography

### 4.1 Font Family

The system uses **Inter** exclusively to maintain a clean, systematic, and highly legible interface.

| Token | Value | Usage |
|---|---|---|
| `--font-family` | `Inter, system-ui, sans-serif` | All text |

### 4.2 Type Scale

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| **Display LG** | `48px` | 700 | `56px` | `-0.02em` | Hero headings, landing page |
| **Headline LG** | `32px` | 700 | `40px` | `-0.01em` | Page titles |
| **Headline LG (Mobile)** | `28px` | 700 | `36px` | — | Page titles on mobile |
| **Title MD** | `20px` | 600 | `28px` | — | Card titles, modal titles |
| **Body LG** | `16px` | 400 | `24px` | — | Primary body text |
| **Body SM** | `14px` | 400 | `20px` | — | Default body, card content |
| **Label Bold** | `12px` | 600 | `16px` | — | Labels, buttons, metadata |

### 4.3 Typography Rules

1. For the hero section, use `display-lg` with tight letter-spacing to create a bold, modern impact.
2. Body text should maintain a generous line height (1.5x) to ensure readability during long browsing sessions.
3. All labels and functional text (like button captions) use a slightly heavier weight to stand out against background surfaces.

---

## 5. Spacing Scale

Spacing follows a **4px baseline**. All spacing MUST use the following scale.

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--space-0` | 0 | `gap-0` | — |
| `--space-base` | `4px` | `gap-1` | Base unit |
| `--space-xs` | `8px` (2×) | `gap-2` | Compact: small button padding, tight gaps |
| `--space-sm` | `16px` (4×) | `gap-4` | Standard: card padding, section gaps |
| `--space-md` | `24px` (6×) | `gap-6` | Spacious: page section gaps, modal padding |
| `--space-lg` | `32px` (8×) | `gap-8` | Large: page margins, major sections |
| `--space-xl` | `48px` (12×) | `gap-12` | Extra: hero spacing |

### Container Defaults

| Context | Value |
|---|---|
| Container margin (mobile) | `20px` |
| Container margin (desktop) | `40px` |
| Gutter | `16px` |

### Component Spacing Defaults

| Component | Inner Padding |
|---|---|
| Button (sm) | `px-3 py-1.5` |
| Button (md) | `px-4 py-2` |
| Button (lg) | `px-6 py-3` |
| Input | `px-3 py-2` |
| Card | `p-4` or `p-5` |
| Modal | `p-5` |

---

## 6. Border Radius Scale

The shape language is friendly and contemporary using **Rounded (8px)** settings. The UI feels approachable and safe.

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--radius-sm` | `0.25rem` (4px) | `rounded-sm` | Small elements, badges |
| `--radius-base` | `0.5rem` (8px) | `rounded-lg` | Default: buttons, inputs |
| `--radius-md` | `0.75rem` (12px) | `rounded-xl` | Cards, dropdowns |
| `--radius-lg` | `1rem` (16px) | `rounded-2xl` | Modals, large containers |
| `--radius-xl` | `1.5rem` (24px) | `rounded-3xl` | Hero cards, feature containers |
| `--radius-full` | `9999px` | `rounded-full` | Pills, circular avatars |

### Component Radius Defaults

| Component | Radius |
|---|---|
| Button | `--radius-base` (8px) |
| Input / Select | `--radius-base` (8px) |
| Card | `--radius-md` (12px) |
| Modal | `--radius-lg` (16px) |
| Badge / Chip | `--radius-full` (pill) or `--radius-sm` (4px) |
| Toast | `--radius-md` (12px) |
| Images | Always follow container's corner radius |

---

## 7. Shadows & Elevation

Depth is created through a combination of **Ambient Shadows** and **Tonal Layering**.

### Elevation Levels

| Level | Description | Shadow |
|---|---|---|
| **Level 0 (Base)** | Page background (`#f7f9fb`) | None |
| **Level 1 (Cards)** | Pure white cards | `0px 4px 20px rgba(74, 86, 157, 0.08)` |
| **Level 2 (Interactive)** | Hovered/active cards | More pronounced shadow + `1px solid rgba(74, 86, 157, 0.1)` |
| **Level 3 (Overlays)** | Modals, bottom sheets | 40% blur backdrop (glassmorphism) |

### Shadow Tokens

| Token | Value |
|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` |

---

## 8. Component Specifications

### 8.1 Buttons

#### Variants

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| **Primary** | `#4a569d` (primary) | `#ffffff` | None | Primary CTA |
| **Primary Hover** | `#323e84` | `#ffffff` | None | Primary CTA hover |
| **Secondary** | Transparent | `#4a569d` | `2px solid #4a569d` | Secondary actions |
| **Ghost** | Transparent | `#4a569d` | None | Tertiary actions |

#### Sizes

| Size | Padding | Font Size | Min Height |
|---|---|---|---|
| Small (sm) | `px-3 py-1.5` | `0.75rem` (12px) | `28px` |
| Medium (md) | `px-4 py-2` | `0.875rem` (14px) | `36px` |
| Large (lg) | `px-6 py-3` | `1rem` (16px) | `44px` |

#### States

- **Hover:** Scale up slightly (1.02×) for primary; increased border opacity for secondary
- **Active:** Scale(0.98)
- **Disabled:** `opacity-50; cursor-not-allowed`

### 8.2 Inputs

| Property | Value |
|---|---|
| Background | Soft grey `#f1f5f9` (default), white on focus |
| Border | None (default); `2px solid #4a569d` (focus) |
| Border Radius | `--radius-base` (8px) |
| Padding | `0.625rem 0.75rem` |
| Font | `Inter, 0.875rem` |
| Focus Style | White background + 2px primary border + soft outer glow |

### 8.3 Modals

| Property | Value |
|---|---|
| Backdrop | 40% blur backdrop (glassmorphism) |
| Container radius | `--radius-lg` (16px) |
| Container background | White (`#ffffff`) |
| Shadow | `--shadow-xl` |
| Max width (sm) | `400px` |
| Max width (md) | `560px` |
| Max width (lg) | `720px` |

### 8.4 Cards

Feature cards are the heart of this system. They must include a centered icon in the primary color, followed by a `title-md` and `body-sm` description. Minimum internal padding: `md` (24px).

| Property | Value |
|---|---|
| Background | White (`#ffffff`) |
| Border Radius | `--radius-md` (12px) |
| Shadow | `0px 4px 20px rgba(74, 86, 157, 0.08)` |
| Padding | `--space-md` (24px) |

### 8.5 Chips / Badges

Used for categories (e.g., "Vuelos", "Hoteles"). Chips should be pill-shaped with a light tint of the primary color (10% opacity) and dark text.

| Property | Value |
|---|---|
| Shape | Pill (`--radius-full`) |
| Background | `rgba(74, 86, 157, 0.1)` |
| Text | `#191c1e` |
| Font | `12px`, 600 weight |
| Padding | `px-3 py-1` |

### 8.6 Toast Notifications

| Property | Value |
|---|---|
| Position | `fixed top-4 right-4` (desktop), `fixed top-4 left-4 right-4` (mobile) |
| Background | White (`#ffffff`) |
| Border | `1px solid #c6c5d2` |
| Radius | `--radius-md` (12px) |
| Shadow | `--shadow-lg` |
| Auto-dismiss | 4 seconds (success), 6 seconds (error) |

### 8.7 Navigation (Bottom Bar)

For mobile, a fixed bottom navigation bar with active states indicated by the primary color and a small 4px dot below the icon.

---

## 9. Layout & Grid

This design system utilizes a **Fluid Grid** model optimized for mobile-first delivery.

### Grid

| Device | Columns | Gutter | Margin |
|---|---|---|---|
| Mobile | 4 | 16px | 20px |
| Desktop | 12 | 16px | 40px |

### Page Layout

```
Page
 +- Navbar (fixed top, h-14, bg-white/95 backdrop-blur)
 +- Content (pt-14, min-h-screen)
 |   +- PageHeader (px-4 md:px-6 pt-6 pb-4)
 |   |   +- Title (headline-lg)
 |   |   +- Description (body-sm, on-surface-variant)
 |   +- PageBody (px-4 md:px-6 pb-6)
 +- BottomNav (fixed bottom, h-14, mobile only, bg-white/95 backdrop-blur)
```

### Hero Section

The hero container should occupy 40-50% of the initial viewport height, utilizing the primary gradient with center-aligned content. On mobile, the bottom edge of the hero section can feature a subtle 24px inverted radius to create a "container" feel for the content below.

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

Themes are implemented via CSS custom properties on a root-level class. Components MUST ONLY reference CSS custom properties, never hardcoded colors.

### Current Theme

TravelMap currently uses a **Light** theme as defined by the Horizonte design system:
- Surface background: `#f7f9fb`
- Card background: `#ffffff`
- Primary: `#4a569d`
- Text: `#191c1e`
- Font: Inter

### Theme Compliance Checklist

Every component MUST pass this checklist:

- [ ] No hardcoded hex, rgb, or hsl color values
- [ ] All colors reference CSS custom properties or Tailwind utilities
- [ ] Background, text, border, and accent colors all respond to theme changes
- [ ] Component renders correctly
- [ ] Status colors (error) are theme-invariant

---

## 12. Migration Plan

### Phase 1: Foundation

1. **Define CSS custom properties** in `app.css`:
   - Surface colors: `--color-surface` through `--color-surface-container-highest`
   - Text colors: `--color-on-surface`, `--color-on-surface-variant`
   - Brand colors: `--color-primary`, `--color-secondary`, `--color-tertiary`
   - Outline colors: `--color-outline`, `--color-outline-variant`
   - Status colors: `--color-error`, `--color-error-container`
   - Radius tokens: `--radius-sm` through `--radius-full`
   - Shadow tokens: `--shadow-sm` through `--shadow-xl`

2. **Update Tailwind config** to include new tokens

### Phase 2: Component-by-Component Migration

For each component, the migration follows this pattern:

1. Replace hardcoded colors with CSS custom property references
2. Replace arbitrary radius values with token scale
3. Replace arbitrary padding/margin with spacing scale
4. Verify component renders correctly

### Phase 3: Cleanup

1. Remove all `.premium-*` scoped CSS classes
2. Remove all scoped `.btn` blocks in component `<style>` sections
3. Consolidate styles to a single shared class system

---

## 13. Current State Audit

The TravelMap frontend has significant visual inconsistencies. A comprehensive audit revealed the following critical problems:

### 13.1 Button Inconsistencies

There are **20+ distinct button styles** across the application. The same semantic action (e.g., "delete") uses wildly different visual treatments depending on the page.

| Problem | Details |
|---|---|
| `btn-primary` naming collision | The global `.btn-primary` (app.css) is a **grey/muted** button (`bg-background-tertiary`), while scoped `.btn-primary` in Profile and Trip pages is **blue** (`#3b82f6`). |
| Delete/Danger styles vary | 7 different danger styles found: solid red, ghost red, semi-transparent red with 3 different opacity levels. |
| Border radius varies | Buttons use 6px, 8px, 10px, 12px, and `0.75rem` across different components. |
| Padding varies | `px-4 py-2`, `0.6rem 2rem`, `0.75rem 1rem`, `1rem 2rem`, `0.75rem 1.5rem`. |
| Hardcoded colors | Buttons in ProvinceExplorer, AlbumModal, Profile, Trip detail, and MapContainer all use hardcoded hex colors instead of CSS custom properties. |

### 13.2 Modal Inconsistencies

There are **6+ distinct modal architectures**:
- Backdrop opacity ranges from `0.6` to `0.85`
- Border radius ranges from `8px` to `32px`
- Header patterns vary (icon boxes, borders, or neither)
- Close button varies between X icon, `&times;` entity, different sizes
- Glassmorphism blur ranges from `4px` to `12px` or none

### 13.3 Hardcoded Color Problem

Many components bypass the CSS custom property theming system entirely. Variables like `--color-bg-main`, `--color-accent-primary`, `--color-border` are hardcoded as `#0f172a`, `#1e293b`, `#3b82f6`, `#334155` across multiple components.

**Impact:** Components using hardcoded dark colors don't respond to theme changes, making theming impossible without refactoring.

### Quick Reference: What to Replace

| Current Pattern | Replace With |
|---|---|
| `#0f172a` | `var(--color-surface-container-lowest)` or `var(--color-surface-container-low)` |
| `#1e293b` | `var(--color-surface-container)` |
| `#334155` | `var(--color-surface-container-high)` |
| `#3b82f6` | `var(--color-primary)` or `#4a569d` |
| `#94a3b8` | `var(--color-on-surface-variant)` |
| `#64748b` | `var(--color-outline)` |
| `#475569` | `var(--color-outline-variant)` |
| `#ef4444` | `var(--color-error)` |
| `rgba(239,68,68,0.1)` | `var(--color-error-container)` or equivalent |
| Arbitrary `border-radius` | Token from `--radius-*` scale |
| Arbitrary `padding`/`margin` | Token from `--space-*` scale |

---

*Design system version: 1.0 — Sourced from Stitch MCP project "Travelmap" (Horizonte theme)*