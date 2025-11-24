## Diagnosis
- The dashboard looks correct, but other tabs show: (1) large empty space at the top and (2) content hidden under the fixed sidebar.
- Causes found:
  - Multiple, conflicting margin rules: some sections set `margin-left: 0 !important` while the app relies on `var(--sidebar-width)`.
  - The sidebar toggle code sets inline `marginLeft` on `.main-content` and `.content-section`, which overrides CSS and creates inconsistent offsets across tabs.
  - Some tabs (e.g., Branches/Users/Groups) have first-child elements with default margins, producing a visible top gap.

## Implementation Plan
1. Normalize offsets globally
- Set a single source of truth for spacing:
  - `.main-content { margin-left: var(--sidebar-width); margin-top: var(--navbar-height); }`
  - `.content-section.active { display: block; margin-left: var(--sidebar-width) !important; padding-top: 0; }`
  - Mobile breakpoint (`max-width: 768px`): force both to `margin-left: 0`.
  - Collapsed sidebar: override both to `margin-left: 70px`.

2. Remove inline JS margin hacks
- In the sidebar toggle logic, stop setting `mainContent.style.marginLeft` and `section.style.marginLeft`.
- Only update `document.documentElement.style.setProperty('--sidebar-width', ...)` and let CSS handle layout.

3. Eliminate top gap across all tabs
- Ensure:
  - `.nav.nav-tabs { margin-top: 0 !important; }`
  - `.content-section > *:first-child, .content-section .dashboard-header:first-child { margin-top: 0; padding-top: 0; }`
- Remove any section-specific top margins that reintroduce spacing for Branches/Groups/Users/Settings.

4. Unify breakpoints for `--sidebar-width`
- Define consistent values:
  - `768–1024px`: `--sidebar-width: 240px`
  - `≥1400px`: `--sidebar-width: 280px`
  - `≥1920px`: `--sidebar-width: 300px`
- Verify `.content-section.active` and `.main-content` margins read the variable everywhere.

5. Verification
- Test the following:
  - Dashboard, Branches, Groups, Users, Settings, Payment Dashboard, Voucher List.
  - Collapsed vs expanded sidebar.
  - Mobile widths.
- Confirm no top gap and no overlap; content always starts to the right of the sidebar.

## Notes
- API errors (`ERR_ABORTED`) are unrelated to CSS but will block data from rendering; they won’t affect the layout fixes.

Confirm this plan and I’ll apply the changes and verify across all tabs.