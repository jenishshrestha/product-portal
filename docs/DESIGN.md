# Design System Inspired by Linear

## 1. Visual Theme & Atmosphere

Dark-mode-first product design. Near-black canvas (`#08090a`) where content emerges from darkness. Extreme precision engineering — every element in a carefully calibrated hierarchy of luminance. Semi-transparent white borders (`rgba(255,255,255,0.05)` to `rgba(255,255,255,0.08)`), soft luminous text (`#f7f8f8`).

Typography: Inter Variable with OpenType features `"cv01"` and `"ss03"`. Weights: 300 (light), 400 (reading), 510 (signature emphasis), 590 (strong emphasis). Display sizes use aggressive negative letter-spacing.

Color: Almost entirely achromatic. Single brand accent: indigo-violet (`#5e6ad2` bg, `#7170ff` interactive, `#828fff` hover). Used sparingly on CTAs, active states, brand elements only.

**Key Characteristics:**
- Dark-mode-native: `#08090a` marketing, `#0f1011` panels, `#191a1b` elevated surfaces
- Inter Variable with `"cv01", "ss03"` globally
- Signature weight 510 for most UI text
- Negative letter-spacing at display sizes (-1.584px at 72px, -1.056px at 48px)
- Brand indigo: `#5e6ad2` (bg) / `#7170ff` (accent) / `#828fff` (hover)
- Semi-transparent white borders: `rgba(255,255,255,0.05)` to `rgba(255,255,255,0.08)`
- Button backgrounds at near-zero opacity: `rgba(255,255,255,0.02)` to `rgba(255,255,255,0.05)`
- Border radius: 6px standard

## 2. Color Palette

### Background Surfaces
- **Marketing Black** (`#08090a`): Deepest background, hero sections
- **Panel Dark** (`#0f1011`): Sidebar, panel backgrounds
- **Level 3 Surface** (`#191a1b`): Cards, dropdowns, elevated areas
- **Secondary Surface** (`#28282c`): Hover states, slightly elevated

### Text & Content
- **Primary** (`#f7f8f8`): Near-white, default text
- **Secondary** (`#d0d6e0`): Body text, descriptions
- **Tertiary** (`#8a8f98`): Placeholders, metadata
- **Quaternary** (`#62666d`): Timestamps, disabled states

### Brand & Accent
- **Brand Indigo** (`#5e6ad2`): CTA backgrounds
- **Accent Violet** (`#7170ff`): Links, active states
- **Accent Hover** (`#828fff`): Hover on accent elements

### Status
- **Green** (`#27a644`): Success/active
- **Emerald** (`#10b981`): Completion badges
- **Destructive** (`#e5484d`): Error/danger

### Borders
- **Subtle** (`rgba(255,255,255,0.05)`): Default
- **Standard** (`rgba(255,255,255,0.08)`): Cards, inputs

## 3. Typography

| Role | Size | Weight | Letter Spacing |
|------|------|--------|----------------|
| Display XL | 72px | 510 | -1.584px |
| Display | 48px | 510 | -1.056px |
| Heading 1 | 32px | 400 | -0.704px |
| Heading 2 | 24px | 400 | -0.288px |
| Heading 3 | 20px | 590 | -0.24px |
| Body Large | 18px | 400 | -0.165px |
| Body | 16px | 400 | normal |
| Body Medium | 16px | 510 | normal |
| Small | 15px | 400 | -0.165px |
| Caption | 13px | 400-510 | -0.13px |
| Label | 12px | 400-590 | normal |

Three-tier weight system: 400 (read), 510 (emphasize/navigate), 590 (announce).

## 4. Component Stylings

### Buttons
- Ghost: `rgba(255,255,255,0.02)` bg, `1px solid rgb(36,40,44)`, 6px radius
- Subtle: `rgba(255,255,255,0.04)` bg, 6px radius
- Primary: `#5e6ad2` bg, white text, 6px radius
- Pill: transparent, `9999px` radius, `1px solid #23252a`

### Cards
- Background: `rgba(255,255,255,0.02)` to `rgba(255,255,255,0.05)`
- Border: `1px solid rgba(255,255,255,0.08)`
- Radius: 8px standard, 12px featured

### Inputs
- Background: `rgba(255,255,255,0.02)`
- Border: `1px solid rgba(255,255,255,0.08)`
- Padding: 12px 14px, radius 6px

## 5. Layout

- 8px spacing grid: 8, 16, 24, 32px rhythm
- Max content width: ~1200px
- Section padding: 80px+ vertical
- Border radius scale: 2px (micro) → 6px (buttons) → 8px (cards) → 12px (panels) → 9999px (pills)

## 6. Do's and Don'ts

### Do
- Use `font-feature-settings: "cv01", "ss03"` on ALL text
- Use weight 510 as default emphasis weight
- Build on near-black backgrounds
- Use semi-transparent white borders
- Reserve brand indigo for CTAs and interactive accents only
- Use `#f7f8f8` for primary text (not pure white)

### Don't
- Don't use pure `#ffffff` as primary text
- Don't use solid colored backgrounds for buttons on dark theme
- Don't apply brand indigo decoratively
- Don't use weight 700 (bold) — max is 590
- Don't introduce warm colors into UI chrome
- Don't use drop shadows for elevation on dark — use background luminance stepping
