## Scope and Targets
- Fix global layout (sidebar + main content) and responsiveness across all tabs
- Pages to touch:
  - `frontend/index.html` (embedded global CSS, sidebar, main-content, breakpoints)
  - Views using Bootstrap grids: `frontend/views/*.html` — Dashboard, Reports, Payment Dashboard, Voucher List, Branches, Departments, Categories, Users, Suppliers
- Keep functionality intact; refactor CSS and minimal HTML structure only when grid semantics are required

## Issues Identified
- Sidebar overlaps content at various widths (mobile/small tablet), inconsistent offsets
- Conflicting rules between `.main-content` and `.content-section.active` producing gaps/overlaps
- Inline styles (e.g., gradients) and some fixed pixel widths causing breakage
- Reports/Payment grids not wrapping → card/table overlap
- Mobile breakpoints missing conditional offset when sidebar is visible

## Plan of Changes
### 1) Global Layout Foundation
- Define layout variables in `:root`:
  - `--sidebar-width: 260px`, `--navbar-height: 56px`
- Sidebar CSS:
  - Fixed below navbar: `position: fixed; top: var(--navbar-height); left: 0; height: calc(100vh - var(--navbar-height))`
  - Fixed width: `width/min-width/max-width: var(--sidebar-width)`; scroll: `overflow-y: auto; overflow-x: hidden`
  - Collapsed: `width/min/max: 70px`
- Main content container:
  - Always offset by sidebar: `padding-left: var(--sidebar-width)` (not margin)
  - Below navbar: `margin-top: var(--navbar-height)`; `height: auto; overflow-y: auto`
- Active section rule (applies to all tabs):
  - `.content-section.active { display: block; margin-left: 0 !important; margin-top: 0; padding: 0 20px 20px }`

### 2) Breakpoints (Apply Globally)
- Desktop (≥1200px): `--sidebar-width: 260px`
- Tablet (768–1199px): keep `--sidebar-width: 260px` for stability
- Mobile (≤767px): sidebar off-canvas (`transform: translateX(-100%)`)
  - When sidebar is visible (`.sidebar.active`), reapply content offset:
    - `body:has(.sidebar.active) .main-content, .sidebar.active ~ * .main-content { padding-left: var(--sidebar-width) !important }`

### 3) Remove Conflicts and Hard-Coded Dimensions
- Remove/override rules that set `margin-left` on `.content-section.active` to anything other than `0`
- Replace fixed px widths in CSS with `%`, `rem`, `vw/vh` for paddings, gaps, and grids where appropriate
- Avoid `position: absolute/fixed` unless necessary (keep navbar + sidebar only)

### 4) Grid and Component Responsiveness
- Reports and Payment Dashboard:
  - Ensure `.row` child columns have responsive flex-basis:
    - Base: `min-width: 220px; flex: 1 1 220px; max-width: 100%`
    - ≤991px: full-width columns
    - 992–1399px: ~50% width columns
    - ≥1400px: ~25% width columns
  - Use `.row { gap: 12px }` to prevent overlap
- Filters, Cards, Buttons, Tables:
  - Ensure filters use `row g-3` + `col-12 col-md-*`
  - Tables wrapped in `.table-responsive`; long headers wrap
  - Buttons groups wrap with `flex-wrap: wrap; gap: 8px`

### 5) Inline Style Cleanup
- Move inline gradient styles (e.g., payment summary cards) into CSS utility classes (e.g., `.bg-gradient-success`) to avoid rigid inline px assumptions

### 6) HTML Grid Tweaks (Minimal)
- Where necessary, update view files to ensure correct Bootstrap structure:
  - Use `.container-fluid > .row > .col-*` consistently
  - Replace any ad-hoc wrappers that break grid with proper columns
  - No functional JS changes; only markup for grid semantics

### 7) Step-by-Step Application
1. Update `frontend/index.html` global CSS blocks:
   - Variables, sidebar, main-content, collapsed/mobile logic, active-section, row gaps
2. Apply responsive grid rules for Reports & Payment Dashboard
3. Replace inline styles with CSS classes (utility classes added near global CSS)
4. Pass through each view (`views/*.html`) and normalize grid markup:
   - Branches, Departments, Categories, Suppliers, Users, Reports, Payment Dashboard, Voucher List
5. Convert remaining fixed px paddings/margins to responsive units
6. Verify across breakpoints: desktop, tablet, mobile; sidebar toggling states

### 8) Verification
- Manual checks on key pages (Sidebar collapsed/expanded at multiple widths)
- Confirm no horizontal scrolling and content never overlaps the sidebar
- Validate filters/cards/tables wrap as expected on mobile

### 9) Deliverables
- Updated global CSS in `frontend/index.html`
- Minor HTML grid corrections in `frontend/views/*.html`
- New small utility classes (e.g., `.bg-gradient-success`) for removing inline styles
- Short notes in code comments for future maintenance

Confirm this plan, and I will implement the changes and verify all tabs and breakpoints step-by-step.