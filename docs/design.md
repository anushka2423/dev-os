---
# ==============================================================================
# allNeurons Design System
# ==============================================================================
meta:
  name: "allNeurons Design System"
  version: "1.3.0"
  updated: "2026-10-05"
  units: "px (unless stated)"
  source: "Three reference screenshots captured at 2x density. Hex values are sampled pixels."
  character: >-
    Two modes: (1) App UI — flat, light, data-dense, neutral grey, single dark-blue primary,
    no gradients, no shadows. (2) Landing page — dark hero with gradient accents, bold display
    type, generous whitespace, enterprise B2B aesthetic.
  inferred-note: "Keys marked '# inferred' are not visible in the references; they are the minimum needed for real use."

# ------------------------------------------------------------------------------
# 1. COLOR
# ------------------------------------------------------------------------------
color:
  neutral:
    bg-page:    { value: "#FAFAFA", usage: "Page background, table headers, nested table area, total rows, neutral tiles" }
    bg-surface: { value: "#FFFFFF", usage: "Cards, table rows, modals, inputs, buttons, dropdown menus" }
    ink-900:    { value: "#080A0E", usage: "Headings, metrics, table cells, names, button labels" }
    ink-600:    { value: "#4A4C4F", usage: "Secondary text, card labels, captions, sort icons, chevrons, close icon" }
    ink-400:    { value: "#8F9193", usage: "Tertiary text, placeholders, overline headers, N/A, empty dash" }
    line-100:   { value: "#F0F0F1", usage: "Card/table borders, row dividers, progress track, default avatar, close-button fill" }
    line-200:   { value: "#DADADB", usage: "Control borders: segmented control, inputs, selects, checkboxes, dropdown menu, secondary button" }

  primary:
    blue-600: { value: "#125ACB", role: "PRIMARY", usage: "Primary button, active segment, checked checkbox, outline-button border, primary bar, KPI accent" }
    blue-700: { value: "#0E469E", usage: "Links, meta text, chip/tag text, selected dropdown option text, primary hover" }
    blue-400: { value: "#6196EA", usage: "Modal outline, link-style numeric cells" }
    blue-300: { value: "#91B7F0", usage: "Banner border, neutral tile border, KPI accent variant, focus ring" }
    blue-50:  { value: "#E6EFFC", usage: "Banner, modal header, chips, soft tags, sorted header, selected option, outline hover" }

  status:
    success:
      green-700: { value: "#0D720B", usage: "Badge text" }
      green-600: { value: "#10930E", usage: "Positive trend text and icon" }
      green-500: { value: "#12A10D", usage: "Status dot, chart series" }
      green-300: { value: "#92D490", usage: "Outline badge border, positive tile border, KPI accent" }
      green-50:  { value: "#E7F7E7", usage: "Soft success badge fill" }
    danger:
      red-700: { value: "#942529", usage: "Badge text" }
      red-600: { value: "#BE3033", usage: "Negative trend text and icon" }
      red-500: { value: "#D23438", usage: "Outline badge border, negative tile border" }
      red-dot: { value: "#EF4444", usage: "Status dot" }
    warning:
      orange-500: { value: "#FA9200", usage: "KPI accent, chart series" }

  # Landing page dark surfaces
  dark:
    bg-base:    { value: "#080C14", usage: "Landing page page background" }
    bg-surface: { value: "#0F1624", usage: "Dark cards, nav, footer" }
    bg-raised:  { value: "#161F30", usage: "Elevated dark cards, hover states" }
    ink-100:    { value: "#FFFFFF", usage: "Primary headings on dark" }
    ink-300:    { value: "#C8D0DC", usage: "Body text on dark" }
    ink-500:    { value: "#7A8799", usage: "Muted text, captions on dark" }
    border:     { value: "rgba(255,255,255,0.08)", usage: "Subtle borders on dark surfaces" }
    border-mid: { value: "rgba(255,255,255,0.14)", usage: "Card borders, dividers on dark" }

  # Landing page gradients
  gradient:
    hero:        { value: "linear-gradient(135deg, #0E1E3D 0%, #080C14 60%)", usage: "Hero section background" }
    accent:      { value: "linear-gradient(135deg, #125ACB 0%, #3B82F6 100%)", usage: "CTA buttons, highlighted text" }
    glow-blue:   { value: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(18,90,203,0.30) 0%, transparent 70%)", usage: "Hero top glow overlay" }
    card-border: { value: "linear-gradient(135deg, rgba(18,90,203,0.5), rgba(255,255,255,0.05))", usage: "Gradient card borders" }
    text-accent: { value: "linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)", usage: "Gradient hero headline accent words" }

  data-series: ["#125ACB", "#FA9200", "#12A10D", "#6B4FB8", "#C239B3"]

  avatar:
    default: { fill: "#F0F0F1", text: "#080A0E" }
    filled:  { fills: ["#4A4C4F", "#7C3AED", "#079669"], text: "#FFFFFF" }

  overlay:
    scrim: "rgba(8, 10, 14, 0.20)"

  rules:
    - "blue-600 (#125ACB) is the only brand color."
    - "Green, red and orange carry meaning (status, trend, category); never decorative."
    - "No gradients, tinted shadows or new hues."

# ------------------------------------------------------------------------------
# 2. TYPOGRAPHY
# ------------------------------------------------------------------------------
typography:
  family: "Inter Display"
  css-family: "'Inter Display', 'Inter', system-ui, -apple-system, sans-serif"
  google-fonts: "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap"
  font-variation-settings: '"opsz" 32'
  numeric: "tabular-nums"
  weights: { regular: 400, medium: 500, semibold: 600 }

  size-rules:
    minimum: 14              # every UI text: tables, badges, chips, buttons, inputs, dropdowns, labels, headers
    row-title-minimum: 16    # primary name/title in table and list rows
    numeric-weight-minimum: 500   # numbers in tables/lists are never regular 400
    small-descriptive: 12    # ONLY: email/secondary line under a name, "Viewing:" date line, unit suffix ("total")
    forbidden-sizes: [13, 11, 10]
    forbidden-styles: ["700 weight", "italic"]

  # Landing page display scale (dark surfaces)
  landing-roles:
    display-xl:   { size: 72, line-height: 78, weight: 700, tracking: "-0.04em", color: dark.ink-100, note: "Hero headline — mobile scales to 40px" }
    display-lg:   { size: 56, line-height: 62, weight: 700, tracking: "-0.03em", color: dark.ink-100 }
    display-md:   { size: 40, line-height: 48, weight: 700, tracking: "-0.025em", color: dark.ink-100 }
    eyebrow:      { size: 13, line-height: 18, weight: 600, tracking: "0.08em", transform: uppercase, color: blue-400, note: "All-caps label above headline" }
    hero-body:    { size: 18, line-height: 28, weight: 400, color: dark.ink-300 }
    section-head: { size: 36, line-height: 44, weight: 700, tracking: "-0.025em", color: dark.ink-100 }
    card-title:   { size: 20, line-height: 28, weight: 600, color: dark.ink-100 }
    card-body:    { size: 15, line-height: 24, weight: 400, color: dark.ink-300 }
    nav-link:     { size: 15, line-height: 20, weight: 500, color: dark.ink-300, hover: dark.ink-100 }
    footer-label: { size: 13, line-height: 20, weight: 500, color: dark.ink-500 }

  roles:
    page-title:        { size: 30, line-height: 36, weight: 600, tracking: "-0.02em", color: ink-900 }
    metric:            { size: 24, line-height: 30, weight: 600, tracking: "-0.02em", color: ink-900, highlight: blue-700 }
    section-title:     { size: 15, line-height: 20, weight: 600, color: ink-900 }
    subsection-title:  { size: 14, line-height: 20, weight: 600, color: ink-900 }
    group-label:       { size: 14, line-height: 20, weight: 500, color: ink-600 }
    body:              { size: 14, line-height: 20, weight: 400, color: ink-900 }
    row-title:         { size: 16, line-height: 22, weight: 600, color: ink-900 }   # primary name in a table/list row (minimum 16)
    numeric-cell:      { size: 14, line-height: 20, weight: 500, color: ink-900, numeric: tabular-nums }   # numbers, counts, %, currency in tables (minimum medium)
    emphasis:          { size: 14, line-height: 20, weight: 500, color: ink-900 }
    secondary:         { size: 14, line-height: 20, weight: 400, color: ink-600 }
    tertiary:          { size: 14, line-height: 20, weight: 400, color: ink-400 }
    link:              { size: 14, line-height: 20, weight: 400, color: blue-700, hover: blue-600 }
    button-label:      { size: 14, line-height: 20, weight: 500 }
    badge:             { size: 14, line-height: 20, weight: 400 }
    overline:          { size: 14, line-height: 20, weight: 500, transform: uppercase, tracking: "0.02em", color: ink-400 }
    small-descriptive: { size: 12, line-height: 16, weight: 400, color: [ink-600, ink-400] }

# ------------------------------------------------------------------------------
# 3. SPACING
# ------------------------------------------------------------------------------
spacing:
  base: 4
  scale: [2, 4, 8, 12, 16, 20, 24, 32, 48]
  gutter: { desktop: 32, tablet: 24, mobile: 16 }
  gaps:
    kpi-cards: 8
    stat-tiles: 12
    toolbar-controls: 8
    icon-to-label: 8
    banner-icon-to-text: 12
    checkbox-to-label: 8
    dropdown-options: 2
  padding:
    kpi-card: 12
    stat-tile: 16
    modal-header: 20
    modal-body: 20
    button: "0 16"
    input: "0 12"
    dropdown-menu: 4
    dropdown-option: "0 12"
  page-rhythm:
    back-link-to-title: 20
    title-to-subtitle: 12
    subtitle-to-meta: 8
    header-to-segmented-control: 24
    segmented-control-to-date-line: 8
    date-line-to-kpi-row: 24
    kpi-row-to-banner: 36
    banner-to-section-header: 16
    section-header-to-chips: 8
    chips-to-table: 8
  progress-item: { label-to-bar: 12, bar-to-caption: 12, between-items: 24 }
  density: "Medium-high: tight 8px card gaps, generous 69px table rows."

# ------------------------------------------------------------------------------
# 4. RADIUS
# ------------------------------------------------------------------------------
radius:
  xs: 4        # segmented control + segment, stat tiles, soft tags, size box, checkbox, dropdown option
  sm: 6        # banner, 28px secondary button
  md: 8        # 36px buttons, inputs, selects, dropdown menu, modal tables
  lg: 12       # KPI cards, primary table, modal
  pill: 999    # outline badges, filter chips, progress bars
  circle: "50%"  # avatars, close button, status dots

# ------------------------------------------------------------------------------
# 5. BORDERS & ELEVATION
# ------------------------------------------------------------------------------
border:
  width: 1          # hairline everywhere
  style: solid
  exceptions: ["KPI accent bar: 2px"]
  default: line-100
  control: line-200
  semantic:
    outline-button: blue-600
    banner: blue-300
    neutral-tile: blue-300
    positive: green-300
    negative: red-500
    modal: blue-400
  tables: "Horizontal dividers only; no vertical rules."

elevation:
  shadow: none
  rule: "Separation comes from #FAFAFA vs #FFFFFF contrast and hairline borders. Modals use the scrim plus a 1px blue-400 outline. Dropdown menus use a 1px line-200 border."

# ------------------------------------------------------------------------------
# 6. ICONS
# ------------------------------------------------------------------------------
icons:
  style: "Lucide-style line icons"
  stroke: 2            # on 24 grid
  caps: round
  joins: round
  color: currentColor
  default-color: ink-600
  sizes: { small: 14, default: 16, large: 20, close: 18, checkbox-check: 12 }
  filled-exceptions: ["sort carets"]
  placement: { leading-gap: 8, trailing-gap: 8 }
  rule: "Icons are functional only; never decorative."

# ------------------------------------------------------------------------------
# 7. STATES (shared)
# ------------------------------------------------------------------------------
states:
  hover:
    primary-button: { fill: blue-700 }
    outline-button: { fill: blue-50 }          # inferred
    secondary-button: { fill: bg-page }        # inferred
    neutral-control: { fill: bg-page }         # inferred
    text-action: { color: blue-600 }           # inferred
    table-row: { fill: bg-page }               # inferred
    dropdown-option: { fill: bg-page }
  focus-ring: "2px solid blue-300, 1px offset"  # inferred
  disabled: { opacity: 0.4, cursor: not-allowed } # inferred
  selected: { fill: blue-50, text: blue-700 }

# ------------------------------------------------------------------------------
# 8. COMPONENTS
# ------------------------------------------------------------------------------
components:

  # ---------- Buttons ----------
  button:
    primary:
      height: 36
      padding: "0 16"
      radius: md
      fill: blue-600            # #125ACB
      border: "1px blue-600"
      label: { size: 14, weight: 500, color: "#FFFFFF" }
      icon: 16
      gap: 8
      hover: { fill: blue-700, border: blue-700 }
      usage: "Single main call to action. One per view."
    outline-primary:
      height: 36
      padding: "0 16"
      radius: md
      fill: bg-surface
      border: "1px blue-600"
      label: { size: 14, weight: 500, color: ink-900, filter-variant-color: blue-600 }
      icon: 16
      gap: 8
      hover: { fill: blue-50 }
      usage: "Toolbar actions (Expand all) and filter dropdown triggers (Status (2))."
    secondary:
      height: 28
      padding: "0 8"
      radius: sm
      fill: bg-surface
      border: "1px line-200"
      label: { size: 14, weight: 500, color: ink-900 }
      icons: { leading: 16, trailing-chevron: 14 }
      hover: { fill: bg-page }
      usage: "Utility actions in page header (Export)."
    text-action:
      label: { size: 14, weight: 500, color: ink-900 }
      hover: { color: blue-600 }
      usage: "Card links (View breakdown)."
    icon-close:
      size: 30
      radius: circle
      fill: line-100
      icon: { size: 18, color: ink-600 }
    icon-dismiss:
      icon: { size: 20, color: blue-600 }

  # ---------- Segmented control ----------
  segmented-control:
    container: { height: 32, padding: 2, gap: 0, radius: xs, fill: bg-surface, border: "1px line-200" }
    segment:   { height: 28, padding: "0 16", label: { size: 14, weight: 400 } }
    active:    { fill: blue-600, color: "#FFFFFF", radius: xs }   # same color as primary button
    inactive:  { fill: transparent, color: ink-600, hover-color: ink-900 }
    trailing-icon: { size: 16, gap: 8 }

  # ---------- Inputs ----------
  search-input:
    height: 36
    width: 210            # fluid on mobile
    padding: "0 12"
    radius: md
    fill: bg-surface
    border: "1px line-200"
    icon: { name: search, size: 16, color: ink-400, gap: 8 }
    text: { size: 14, color: ink-900 }
    placeholder: { size: 14, color: ink-400 }
    focus: { border: blue-600, ring: "2px blue-300" }   # inferred

  # ---------- Dropdown (custom) ----------
  dropdown:
    rule: "Always custom. Never use the native OS/browser <select> popup."
    trigger:
      neutral:
        height: 36
        padding: "0 12"
        radius: md
        fill: bg-surface
        border: "1px line-200"
        prefix: { size: 14, color: ink-600 }          # e.g. "Sort:"
        value: { size: 14, weight: 400, color: ink-900 }
        chevron: { name: chevron-down, size: 16, color: ink-600 }
        gap: 8
        hover: { fill: bg-page }
      filter:
        extends: button.outline-primary
        label: { size: 14, weight: 500, color: blue-600 }
        count-format: "Label (n)"                        # e.g. "Status (2)"
        chevron: { name: chevron-down, size: 16, color: blue-600 }
      open: { chevron-rotation: 180 }                    # inferred
    menu:
      fill: bg-surface
      border: "1px line-200"
      radius: md
      padding: 4
      offset: 4               # below trigger
      min-width: 220          # or trigger width, whichever is larger
      max-height: 320         # then scroll
      option-gap: 2
      shadow: none
      align: { select: left, toolbar-filter: right }
    option:
      height: 36
      padding: "0 12"
      radius: xs
      fill: bg-surface
      label: { size: 14, weight: 400, color: ink-900 }
      hover: { fill: bg-page }
      single-select-selected:
        fill: blue-50
        label-color: blue-700
        check-icon: { size: 16, color: blue-600, align: right }
      multi-select:
        leading: checkbox
        gap: 8
        checked-row-fill: unchanged
    footer-action:
      divider: "1px line-100"
      label: "Clear selection"
      height: 36
      text: { size: 14, color: blue-600 }
      hover: { fill: blue-50 }
    behavior:
      close-on-outside-click: true
      close-on-escape: true
      single-select-closes-on-pick: true
      multi-select-stays-open: true

  # ---------- Checkbox (custom) ----------
  checkbox:
    rule: "Always custom. Never the default browser checkbox."
    box: { size: 16, radius: xs }
    unchecked:     { fill: "#FFFFFF", border: "1px line-200" }
    checked:       { fill: blue-600, border: "1px blue-600", icon: { name: check, size: 12, stroke: 3, color: "#FFFFFF" } }
    indeterminate: { fill: blue-600, border: "1px blue-600", mark: "8x2 white dash" }   # inferred
    hover:         { border: blue-600 }                                                 # inferred
    focus:         { ring: "2px blue-300" }                                             # inferred
    disabled:      { opacity: 0.4 }                                                     # inferred
    label: { size: 14, weight: 400, color: ink-900, gap: 8 }
    hit-target: 36            # whole row is clickable

  # ---------- Badges ----------
  badge:
    common: { height: 22, text-size: 14, text-weight: 400, white-space: nowrap }
    outline-success:
      padding: "0 10"
      radius: pill
      fill: transparent
      border: "1px green-300"
      text-color: green-700
      examples: ["Active", "claude-opus-5-5"]
    outline-danger:
      padding: "0 10"
      radius: pill
      fill: transparent
      border: "1px red-500"
      text-color: red-700
      examples: ["Inactive"]
    soft-info:
      padding: "0 6"
      radius: xs
      fill: blue-50
      border: none
      text-color: blue-700
      examples: ["Feature", "unlinked_prs"]
    soft-success:
      padding: "0 6"
      radius: xs
      fill: green-50
      border: none
      text-color: green-700
      examples: ["In Review", "Merged"]
    size-box:
      size: 24
      radius: xs
      fill: none
      border: "1px line-200"
      text: { size: 14, color: ink-600 }
      examples: ["S", "M", "L", "XL"]
    filter-chip:
      height: 28
      padding: "0 12"
      radius: pill
      fill: blue-50
      border: none
      text: { size: 14, color: blue-700 }
      remove-icon: { name: x, size: 14, color: blue-600 }
      gap: 8
      label-prefix: { text: "SHOWING", style: overline }
    status-dot:
      size: 8
      radius: circle
      fill: { positive: green-500, negative: red-dot }
      gap: 8
      text: { size: 14, color: ink-900 }

  # ---------- Cards ----------
  kpi-card:
    fill: bg-surface
    border: "1px line-100"
    radius: lg
    padding: 12
    min-height: 135
    shadow: none
    accent-bar: { width: 2, inset: 12, gap-to-content: 12, colors: [blue-600, blue-300, green-300, orange-500], meaning: "category, not status" }
    stack:
      - { part: label, size: 14, color: ink-600 }
      - { part: value, gap-before: 4, size: 24, weight: 600, color: ink-900 }
      - { part: trend, gap-before: 4, icon: 14, size: 14, positive: green-600, negative: red-600, suffix: "vs prior period", suffix-color: ink-900, neutral: "New (ink-600)" }
      - { part: text-action, gap-before: 12 }

  stat-tile:
    min-height: 100
    padding: 16
    radius: xs
    variants:
      positive:     { border: green-300, fill: bg-surface }
      negative:     { border: red-500,   fill: bg-surface }
      neutral-blue: { border: blue-300,  fill: bg-surface }
      neutral:      { border: line-100,  fill: bg-page }
    stack:
      - { part: label,   size: 14, weight: 400, color: ink-600 }
      - { part: value,   size: 24, weight: 600, color: ink-900 }
      - { part: caption, size: 14, weight: 400, color: ink-900 }

  banner:
    min-height: 50
    width: "100%"
    padding: "0 16"
    radius: sm
    fill: blue-50
    border: "1px blue-300"
    icon: { name: star, size: 20, style: outline, color: blue-600, gap: 12 }
    text: { size: 14, color: blue-700 }
    dismiss: { name: x, size: 20, color: blue-600, align: right }

  # ---------- Tables ----------
  data-table:
    container: { fill: bg-surface, border: "1px line-100", radius: lg, overflow: hidden }
    header:
      height: 46
      fill: bg-page
      label: { size: 14, weight: 500, color: ink-900 }
      sort-icon: { size: 16, color: ink-600, gap: 8 }
      sorted: { fill: blue-50, sort-icon-color: blue-700 }
    row:
      min-height: 69
      fill: bg-surface
      divider: "1px line-100"
      text: { size: 14, weight: 400, color: ink-900 }
      numeric-text: { role: numeric-cell, size: 14, weight: 500, color: ink-900 }   # counts, LoC, %, currency, dates-as-values
      padding: { first-cell: "0 16 0 24", cell: "0 16" }
      hover: { fill: bg-page }
    identity-cell:
      chevron: { size: 16, color: ink-600 }
      avatar: { size: 40, fill: line-100, initial: { size: 14, weight: 500 } }
      gap: 12
      name: { role: row-title, size: 16, line-height: 22, weight: 600, color: ink-900 }
      secondary-line: { size: 12, line-height: 16, color: ink-600, gap-from-name: 2 }   # small-descriptive exception
    empty-value: { text: "—", color: ink-400 }
    not-applicable: { text: "N/A", color: ink-400 }

  nested-table:
    fill: bg-page
    inset: 24
    header: { height: 44, style: overline, color: ink-400 }
    row: { min-height: 46, text: { size: 14, color: ink-900 }, numeric-text: { size: 14, weight: 500 }, divider: "1px line-100" }
    id-link: { size: 14, color: blue-700 }

  modal-table:
    container: { radius: md, border: "1px line-100" }
    header: { height: 40, fill: bg-page, style: overline, color: ink-600 }
    row: { min-height: 50, text: { size: 14, color: ink-900 }, numeric-text: { size: 14, weight: 500 } }
    numbers: right-aligned
    total-row: { fill: bg-page, weight: 600 }
    avatar: { size: 28, fills: avatar.filled, initial: { size: 14, weight: 600, color: "#FFFFFF" } }

  # ---------- Data viz ----------
  progress-row:
    name: { size: 14, weight: 500, color: ink-900 }
    value: { size: 14, color: ink-600 }
    percent: { size: 14, color: ink-400 }
    track: { height: 8, fill: line-100, radius: pill }
    bar: { colors: data-series, radius: pill }
    caption: { size: 14, color: ink-600 }

  # ---------- Overlays ----------
  modal:
    width: { max: 920, min: 780 }
    fill: bg-surface
    border: "1px blue-400"
    radius: lg
    shadow: none
    backdrop: overlay.scrim
    header:
      fill: blue-50
      padding: 20
      title: { size: 15, weight: 600, color: ink-900 }
      subtitle: { size: 14, color: ink-400 }
      metric: { size: 24, weight: 600 }
      unit: { size: 12, color: ink-400 }   # small-descriptive exception
      close-gap: 16
    body: { padding: 20, section-gap: 20 }
    footer-note: { text: { size: 14, color: ink-600 }, divider: "1px line-100", space-before: 24 }
    mobile: { inset: 16, tiles: "1 column" }

  # ---------- Page header ----------
  page-header:
    back-link: { icon: 16, text: { size: 14, color: ink-600 }, gap: 8 }
    left: [page-title, subtitle (secondary), meta-link (link)]
    right-cluster:
      refresh-icon: 14
      updated-text: { size: 14, color: ink-400 }
      gap: 12
      action: button.secondary
    date-line: { size: 12, color: ink-600, align: right }   # small-descriptive exception

# ------------------------------------------------------------------------------
# 9. LANDING PAGE COMPONENTS
# ------------------------------------------------------------------------------
landing:

  # ---------- Navigation ----------
  nav:
    height: 64
    fill: "rgba(8,12,20,0.80)"
    backdrop-filter: "blur(12px)"
    border-bottom: "1px solid rgba(255,255,255,0.06)"
    position: sticky-top
    logo: { height: 28 }
    links: { gap: 32, style: nav-link }
    cta:
      primary:
        height: 38
        padding: "0 20"
        radius: md
        background: gradient.accent
        label: { size: 14, weight: 600, color: "#FFFFFF" }
      ghost:
        height: 38
        padding: "0 20"
        radius: md
        fill: transparent
        border: "1px solid rgba(255,255,255,0.14)"
        label: { size: 14, weight: 500, color: dark.ink-100 }
        hover: { fill: "rgba(255,255,255,0.06)" }

  # ---------- Hero ----------
  hero:
    background: gradient.hero
    glow: gradient.glow-blue
    padding: { top: 120, bottom: 100 }
    max-width: 960          # centered content column
    eyebrow: { style: landing-roles.eyebrow, gap-below: 20 }
    headline:
      style: display-xl
      accent-word: { background: gradient.text-accent, background-clip: text, color: transparent }
    subhead: { style: hero-body, max-width: 600, gap-above: 20 }
    cta-row:
      gap-above: 40
      gap-between: 16
      primary: nav.cta.primary with height 48 and font-size 16
      secondary: nav.cta.ghost with height 48 and font-size 16
    social-proof:
      gap-above: 56
      pattern: "Trusted by X enterprises · SOC2 · GDPR · ISO 27001"
      logos: { height: 24, opacity: 0.50, gap: 32, filter: grayscale }

  # ---------- Feature cards ----------
  feature-card:
    fill: dark.bg-surface
    border: "1px solid dark.border-mid"
    radius: lg
    padding: 28
    hover: { fill: dark.bg-raised, border: "1px solid rgba(18,90,203,0.40)", transition: "200ms ease" }
    icon-badge:
      size: 44
      radius: sm
      fill: "rgba(18,90,203,0.15)"
      icon: { size: 20, color: blue-400 }
      gap-below: 16
    title: { style: card-title, gap-below: 8 }
    body:  { style: card-body }
    grid: { columns: { desktop: 3, tablet: 2, mobile: 1 }, gap: 20 }

  # ---------- Problem / solution pairing ----------
  problem-solution:
    background: dark.bg-base
    section-padding: { top: 96, bottom: 96 }
    eyebrow: landing-roles.eyebrow
    headline: landing-roles.section-head
    subhead: landing-roles.hero-body
    items: { max: 4, layout: "2-column grid on desktop, stacked on mobile" }
    item:
      number: { size: 13, weight: 600, color: blue-400 }
      title:  { style: card-title }
      body:   { style: card-body }

  # ---------- Testimonial ----------
  testimonial:
    background: dark.bg-surface
    border: "1px solid dark.border-mid"
    radius: lg
    padding: 40
    quote: { size: 22, line-height: 32, weight: 400, color: dark.ink-100, style: italic }
    attribution:
      avatar: { size: 40, radius: circle }
      name:   { size: 15, weight: 600, color: dark.ink-100 }
      role:   { size: 14, color: dark.ink-500 }
      gap: 12

  # ---------- Trust / security badges ----------
  trust-bar:
    background: "rgba(255,255,255,0.02)"
    border-top: "1px solid dark.border"
    border-bottom: "1px solid dark.border"
    padding: { top: 20, bottom: 20 }
    badge:
      fill: "rgba(255,255,255,0.05)"
      border: "1px solid dark.border-mid"
      radius: sm
      padding: "6 14"
      icon: { size: 16, color: blue-400 }
      label: { size: 13, weight: 500, color: dark.ink-300 }
      gap: 8

  # ---------- CTA section ----------
  cta-section:
    background: "linear-gradient(135deg, #0E1E3D 0%, #0F1A2E 100%)"
    border: "1px solid rgba(18,90,203,0.30)"
    radius: xl       # 20
    padding: { desktop: "80 64", mobile: "48 24" }
    headline: landing-roles.section-head
    subhead: landing-roles.hero-body
    buttons: hero.cta-row

  # ---------- FAQ ----------
  faq:
    background: dark.bg-base
    item:
      border-bottom: "1px solid dark.border"
      padding: { top: 20, bottom: 20 }
      question: { size: 17, weight: 600, color: dark.ink-100 }
      answer:   { size: 15, line-height: 24, color: dark.ink-300 }
      icon: { name: chevron-down, size: 18, color: dark.ink-500, rotates-open: true }

  # ---------- Footer ----------
  footer:
    fill: dark.bg-surface
    border-top: "1px solid dark.border"
    padding: { top: 64, bottom: 48 }
    logo-tagline: { size: 14, color: dark.ink-500, gap-above: 8 }
    column-head: { size: 12, weight: 600, tracking: "0.06em", transform: uppercase, color: dark.ink-500 }
    link: { size: 14, color: dark.ink-300, hover: dark.ink-100 }
    legal: { size: 13, color: dark.ink-500 }

  # ---------- Landing responsive ----------
  responsive:
    mobile-hero-headline: display-md    # drops from display-xl at < 720
    section-padding-mobile: { top: 64, bottom: 64 }
    feature-card-grid-mobile: 1
    nav-mobile: { hamburger: true, menu-fill: dark.bg-surface }

# ------------------------------------------------------------------------------
# 11. LAYOUT (App UI)
# ------------------------------------------------------------------------------
layout:
  container: { width: "100%", max-width: none, centered: false }
  content-width: "100%"
  gutter: { desktop: 32, tablet: 24, mobile: 16 }
  only-width-capped-element: "modal (max 920)"
  composition: [page-header, segmented-control, date-line, kpi-row, banner, section-header, filter-chips, data-table]
  kpi-row: { columns: 6, gap: 8, equal-height: true }
  section-header: "Title + description left; toolbar (Expand all, Search, Sort, Filters) right, one row."
  modal-grid: { columns: [2, 3], gap: 12 }
  alignment: "Every block starts on the gutter. Compact-table numbers right-aligned; primary-table numbers left-aligned."

# ------------------------------------------------------------------------------
# 12. HIERARCHY
# ------------------------------------------------------------------------------
hierarchy:
  type-order:
    - "1. Page title 30/600 and metrics 24/600"
    - "2. Section and modal titles 15/600"
    - "3. Row titles 16/600; numbers 14/500; text data 14/400, ink-900"
    - "4. Labels and descriptions 14, ink-600"
    - "5. Overlines 14 uppercase ink-400; small descriptive 12"
  color-attention: [blue, "green / red", neutrals]
  badges: "Sit below surrounding data: 22px, light borders or tints, regular weight."

# ------------------------------------------------------------------------------
# 13. RESPONSIVE
# ------------------------------------------------------------------------------
responsive:
  breakpoints: { mobile: "< 720", tablet: "720 - 1199", desktop: ">= 1200" }
  rule: "Colors, radii, borders and type roles never change. Only layout reflows. Width is always 100%."
  desktop: { gutter: 32, page-title: 30, kpi-columns: 6, header-cluster: right, toolbar: right, table: full, modal: "920 max, centered", segmented-control: inline }
  tablet:  { gutter: 24, page-title: 28, kpi-columns: 3, header-cluster: right, toolbar: "wraps under title", table: "horizontal scroll, min 960", modal: "100% - 32", segmented-control: inline }
  mobile:  { gutter: 16, page-title: 24, kpi-columns: "2 (1 below 400)", header-cluster: "wraps below subtitle", toolbar: "full width; search fills row", table: "horizontal scroll, first column kept", modal: "full width, 16 inset, tiles stack", segmented-control: "horizontal scroll if needed", dropdown-menu: "full trigger width" }
  touch-target-min: 36

# ------------------------------------------------------------------------------
# 14. RULES
# ------------------------------------------------------------------------------
rules:
  app-ui:
    do:
      - "Use hairline borders and #FAFAFA / #FFFFFF contrast for structure."
      - "Keep page and content at width 100%; never a fixed or max-width page container."
      - "Use #125ACB as the only primary color (primary button, active segment, checked checkbox)."
      - "Keep all UI text at 14px or larger; row titles 16px/600; table numbers at least 500; 12px only for small descriptive text."
      - "Use the custom dropdown and checkbox everywhere."
    dont:
      - "Add shadows, gradients, new hues, 700 weight or new radii."
      - "Use 13px or smaller text in tables, badges, chips, buttons or menus."
      - "Use native OS select menus or default browser checkboxes."
      - "Use more than one filled primary button per view."
      - "Use icons as decoration or add illustrations."
  landing-page:
    do:
      - "Use dark.bg-base (#080C14) as the base; bg-surface (#0F1624) for cards and nav."
      - "Use gradient.accent on the primary CTA button; gradient.text-accent to highlight one or two words in the hero headline."
      - "Apply gradient.glow-blue as an overlay at the top of the hero for ambient depth."
      - "Use backdrop-filter blur(12px) on the sticky nav to create the frosted-glass effect."
      - "Scale hero headline to display-xl (72px) on desktop, display-md (40px) on mobile."
      - "Keep landing text on dark using dark.ink-100 for headings, dark.ink-300 for body, dark.ink-500 for muted."
      - "Apply hover transitions (200ms ease) on feature cards — border color shifts to blue on hover."
      - "Use the trust-bar component for SOC2/GDPR/ISO badges immediately below or above the hero."
    dont:
      - "Mix app-UI light surfaces with landing dark surfaces in the same section."
      - "Add more than two gradient types per section."
      - "Make body text smaller than 15px on landing pages."
      - "Use the app-UI flat style (white background, no gradients) for the landing hero."
---

# allNeurons Design System

All tokens and component specs are in the YAML front matter above. Reference them by path, for example `color.primary.blue-600`, `components.dropdown.option`, `components.checkbox.checked`.

## Changelog

**1.3.0**
- Added `color.dark.*` tokens for dark surface backgrounds (bg-base, bg-surface, bg-raised, ink-100/300/500, border tokens).
- Added `color.gradient.*` tokens: hero background, accent button, blue glow overlay, card border, and text-accent gradient.
- Added `typography.landing-roles.*`: display-xl/lg/md, eyebrow, hero-body, section-head, card-title/body, nav-link, footer-label.
- Added section 9 `landing.*` with full component specs: nav, hero, feature-card, problem-solution, testimonial, trust-bar, cta-section, faq, footer, and landing responsive rules.
- Split `rules` into `app-ui` and `landing-page` subsections.

**1.2.2**
- Added the `typography.roles.numeric-cell` role at 14/500. Numbers in tables and lists (counts, LoC, %, currency) are always medium (500) or heavier, never regular. Empty "—" stays 400 in ink-400.

**1.2.1**
- Added the `typography.roles.row-title` role at 16/600, used for the primary name in table and list rows (`data-table.identity-cell.name`). Row titles are never smaller than 16px.

**1.2.0**
- Set a 14px minimum for all UI text. 12px is now only for small descriptive text, and 13px is removed.
- Added the custom `components.dropdown`: triggers, menu, options, single- and multi-select, footer action and behavior.
- Added the custom `components.checkbox`: unchecked, checked, indeterminate, hover, focus and disabled.
- Added a shared `states` block.
- Restructured the color tokens into `success`, `danger` and `warning` groups.
- Set radius tokens to `xs`, `sm`, `md`, `lg`, `pill` and `circle`.

**1.1.0**
- Added the filled `components.button.primary` (`#125ACB`, with `blue-700` on hover), limited to one per view.
- Made the layout full width at every breakpoint.
