# DESIGN TOKENS

## Palette (Vector Flat Variant)
- `--color-bg: #1f4f5f`
- `--color-bg-elevated: #183f4d`
- `--color-surface: #2a5b6a`
- `--color-surface-alt: #244f5d`
- `--color-band: #153a47`
- `--color-border: #739ea9`
- `--color-text: #f2f5f4`
- `--color-muted: #d0dfdf`
- `--color-accent: #f2d5a2` (beige)
- `--color-accent-warm: #d87b5d` (orange)
- `--color-accent-deep: #bf6548` (deeper orange)
- `--color-accent-soft: #4b6d79`
- `--color-focus: #fff0d0`

Design direction update:
- Reduced transparency and removed glassmorphism treatments.
- Surfaces are now mostly solid fills with stronger borders.
- Hero and section styling follows a flatter vector-poster feel.
- Beige and orange accents are distributed across sections, not only hero.

## Typography
- Primary UI/headline font: `Space Grotesk` via `next/font`.
- Mono accent font: `IBM Plex Mono` via `next/font`.
- Mono usage rule:
  - Small labels (`.mono-label`)
  - One hero typewriter line
  - Footer meta line
- Body paragraphs stay in the primary sans font for readability.

## Spacing + Layout
- Max content width: `1200px`.
- Base layout rhythm follows 8px increments (`8, 16, 24, 32...`).
- Card radius: `22px`-`24px`.
- Section spacing:
  - Mobile: `py-16`
  - Desktop: `py-20` and larger hero padding.

## Pixel Accent Rules
- Pixel accents are additive, not dominant.
- `pixel-notch` uses 8px corner blocks for buttons/cards.
- Pixel icons are 6x6 grids using inline SVG rectangles.
- Pixel details are used in:
  - feature cards
  - services cards
  - logo badge
  - hero illustration edges
- Avoid pixel treatment on long text blocks.
- Avoid glass-like overlays and strong blur effects.

## Motion Rules
- Hero typewriter animation with a short line and blinking caret.
- Gentle card hover lift only (`translateY(-2px)`).
- Soft orb breathing in hero illustration.
- All animations reduce for users with `prefers-reduced-motion`.
