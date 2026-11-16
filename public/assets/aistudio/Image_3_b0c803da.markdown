---
name: GridPulse
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#5a4136'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#8e7164'
  outline-variant: '#e2bfb0'
  surface-tint: '#a04100'
  primary: '#a04100'
  on-primary: '#ffffff'
  primary-container: '#ff6b00'
  on-primary-container: '#572000'
  inverse-primary: '#ffb693'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#9d4300'
  on-tertiary: '#ffffff'
  tertiary-container: '#f77214'
  on-tertiary-container: '#562100'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783200'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-display:
    fontFamily: JetBrains Mono
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.03em
  data-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  data-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-lg:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an accessible, data-driven, and trustworthy dashboard experience tailored specifically for newcomers to the wholesale and retail electricity markets. The aesthetic blends **Modern Corporate Clarity** with **Functional Data Precision**.

- **Brand Personality**: Pragmatic, dynamic, illuminating, and authoritative. It strips away Byzantine trading interfaces in favor of immediate, intuitive comprehension.
- **Target Audience**: Energy market novices, small-scale independent power producers (solar/wind operators), commercial facility managers, and curious retail prosumers looking to track SMP (System Marginal Price) and REC (Renewable Energy Certificate) pricing.
- **Emotional Response**: Confidence and transparency. Users should feel that energy trading and hourly fluctuations are transparent, controllable, and easy to interpret at a glance.
- **Visual Direction**: Crisp, bright surfaces layered with subtle micro-textures, purposeful high-contrast accenting, and clear structural hierarchy. Avoid gratuitous ornamental flourishes; every pixel serves metric legibility.

## Colors

The palette is engineered to guide rapid scanning through high-chroma kinetic accents balanced against deep institutional anchoring tones.

- **Primary (`#FF6B00`)**: The core energetic beacon representing live electricity flow, peak demand warnings, primary action states, and real-time market movement.
- **Secondary (`#0F172A`)**: The deep navy/slate backbone representing institutional certainty, primary structural text, sidebar navigation anchors, and foundational card frames.
- **Tertiary (`#F97316`)**: An amber-orange gradient partner for heatmaps, progressive states, and secondary visual indicators in multi-layered area charts.
- **Neutral (`#64748B`)**: Refined cool slate for axis lines, metric labels, baseline dividers, and secondary telemetry metadata.
- **Canvas & Containers**:
  - Global Surface Canvas: `#F8FAFC`
  - Elevated Metric Containers: `#FFFFFF`
  - Subtle Inset Wells: `#F1F5F9`
  - Border Accents: `#E2E8F0`

### Semantic Rules
- **Bullish / Price Surge**: `#EF4444` (Direct red tone reserved for price spikes above peak thresholds).
- **Bearish / Off-Peak Dip**: `#10B981` (Emerald green for valley hours / lower cost opportunities).
- Never use the primary orange (`#FF6B00`) for destructive actions; destructive actions must use absolute crimson (`#DC2626`).

## Typography

Typography is split strictly between structural narrative (`Hanken Grotesk`) and data verification (`JetBrains Mono`).

- **Editorial & Navigational Layers**: `Hanken Grotesk` balances geometric rigidity with open apertures, providing rapid legibility at both massive headline scales and dense UI groupings.
- **Financial & Electrical Units**: All numeric representations (kWh, MWh, KRW/kWh, SMP, REC metrics, and timestamps) are mandated to render in `JetBrains Mono` to prevent horizontal layout jank during live data streaming and ticker updates.
- **Korean Localization**: Pair with system fallback fonts (`Pretendard`, `-apple-system`) while preserving optical alignment with `JetBrains Mono` numerals.

## Layout & Spacing

The layout follows an asynchronous 12-column responsive fluid grid designed around dynamic telemetry inspection.

- **Desktop (>= 1280px)**: 12-column layout with a fixed 260px collapsible telemetry sidebar, `2rem` outer page margins, and `1.5rem` gutters. Primary KPI cards occupy 3 or 4 columns; interactive multi-hour timeline charts occupy 8 or 12 columns.
- **Tablet (768px - 1279px)**: 8-column layout. Metric cards scale to 4 columns (2-by-2 arrangement). Sidebar transforms into a persistent horizontal quick-access utility bar.
- **Mobile (< 768px)**: 4-column layout with `1rem` outer canvas padding. KPI cards reflow to single-column full-width stacks. Timeline visualizers reduce granular x-axis subdivisions into grouped 4-hour time blocks with swipeable scrubber navigation.
- **Vertical Spacing Cadence**: Component sections must enforce `space-xl` separation. Within composite cards, the gap between the header, data ticker, and visualization graph must adhere strictly to `space-md`.

## Elevation & Depth

Visual hierarchy uses a refined **Tonal Surface Layering** model paired with ultra-diffused atmospheric shadows. Avoid dark, heavy dropshadows to preserve the clean, clinical daylight atmosphere.

- **Surface Level 0 (Base)**: `#F8FAFC` — Canvas base layer.
- **Surface Level 1 (Card & Module Foundation)**: `#FFFFFF` with a hairline stroke `1px solid #E2E8F0`. Dropshadow: `0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)`.
- **Surface Level 2 (Interactive Hover / Segmented Controls)**: `#FFFFFF` with stroke `1px solid #CBD5E1`. Dropshadow: `0 8px 20px -4px rgba(15, 23, 42, 0.06), 0 4px 8px -2px rgba(15, 23, 42, 0.03)`.
- **Surface Level 3 (Real-Time Flyouts & Popovers)**: `#FFFFFF` with a primary edge illumination: `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(255, 107, 0, 0.05)`.
- **Active Focus Rings**: Consistent double-layer ring: `0 0 0 2px #FFFFFF, 0 0 0 4px #FF6B00`.

## Shapes

The design uses balanced rounded geometry (`roundedness: 2`, `8px / 0.5rem` base radius) to create a clean, contemporary feel without appearing whimsical.

- **Micro Controls (Badges, Checkboxes, Toggle Sliders)**: `4px` (`0.25rem`) corner radius for sharp structural recognition.
- **Standard Controls (Buttons, Inputs, Metric Chips)**: `8px` (`0.5rem`) corner radius.
- **Data Containers (Cards, Chart Panels, Tables)**: `12px` or `16px` (`rounded-lg`, `rounded-xl`) corner radius.
- **Status Indicators (Live Signals, Trading Status)**: Full circular pills (`9999px`) to immediately communicate real-time connectivity status.

## Components

### Buttons
- **Primary**: Solid background `#FF6B00`, text `#FFFFFF`, font weight `600`. Subtle hover state shifts to `#F97316` with a micro translateY(-1px). Active state transitions to `#EA580C`.
- **Secondary**: Surface `#FFFFFF`, border `1px solid #CBD5E1`, text `#0F172A`. Hover background transforms into `#F8FAFC`.
- **Ghost / Utility**: Text `#64748B`, zero initial border or background, transitions to background `#F1F5F9` on hover.

### Metric KPI Cards
- Base container: `#FFFFFF` wrapped in `1px solid #E2E8F0` with `1rem` internal padding.
- Header: Micro uppercase label (`label-sm`) in `#64748B` accompanied by an informational tooltip icon.
- Value Cluster: Massive mono display (`data-display`) rendered in `#0F172A`. The currency or unit denominator (`KRW/kWh`) sits aligned with the baseline in `body-sm` `#64748B`.
- Delta Chip: Integrated pill showing `+8.4%` (Soft red `#FEE2E2` fill, `#DC2626` text) or `-3.2%` (Soft emerald `#D1FAE5` fill, `#059669` text).

### Chips & Badges
- **Live Status Chip**: Pill-shaped badge containing a pulsing 6px dot (`#FF6B00`) and the text "실시간 SMP" in `JetBrains Mono` 11px uppercase.
- **Peak Indicator Chip**: High-contrast badge with `#FFF7ED` background, `#C2410C` text, and a `1px solid #FFEDD5` border indicating peak hours.

### Input Fields & Selectors
- Background `#FFFFFF`, border `1px solid #E2E8F0`, typography `body-md` in `#0F172A`.
- Placeholder text in `#94A3B8`.
- Focus state explicitly draws the brand ring: `border-color: #FF6B00` accompanied by `box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.15)`.

### Form Controls (Checkboxes & Radios)
- Box dimensions: 18px × 18px.
- Unchecked: `#FFFFFF` fill with `1.5px solid #CBD5E1`.
- Checked: `#FF6B00` fill with solid white check mark / interior pip, accompanied by instantaneous zero-latency state transition.

### Chart Telemetry Canvas
- **Grid Lines**: Horizontal rules set to `#F1F5F9`, zero vertical grid lines to maintain clean scanning.
- **Price Curve**: 2.5px solid line in `#FF6B00` featuring an underlying linear gradient fading from `rgba(255, 107, 0, 0.22)` at the peak down to `rgba(255, 107, 0, 0.00)` at the x-axis base.
- **Crosshair Tooltip**: Direct overlay box styled in `#0F172A` with `#FFFFFF` text and dual numeric rows featuring mono alignment for time and rate.