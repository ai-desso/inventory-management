---
name: saas-sidebar-redesign
description: Redesigns a Vue 3 app's UI into a modern SaaS-style layout with a left vertical sidebar instead of a top nav, consistent spacing tokens, and a polished look. Use when asked to restyle, modernize or redesign a Vue frontend, replace a top navigation bar with a sidebar, or apply a SaaS or dashboard look.
---

# SaaS Sidebar Redesign

Converts a Vue 3 app shell from a top navigation bar to a left sidebar, adds shared design tokens, and fixes the components the move breaks. Per-view restyling is opt-in.

## Rules

- Do not hard-code this app's file names. Discover the shell, router and i18n first.
- Creating or significantly editing a `.vue` file: delegate to `vue-expert` if this repo's `CLAUDE.md` requires it. Otherwise edit directly.
- Match the component style the file already uses (`<script setup>` or `export default { setup() }`). Do not mix them within one file.
- No emojis in the UI. Icons are inline SVG.
- Do not commit. Leave changes for review.

## Step 1: Discover (read-only)

Report these before editing:

1. **Shell**: the root component (usually `App.vue`) and its top-nav template, with the `router-view`, global modals and any global state it owns.
2. **Router**: the routes file (usually `main.js` or `router/index.js`). Note routes that exist but are not linked.
3. **Global CSS**: where the unscoped styles live, and whether CSS variables already exist.
4. **i18n**: how nav labels are translated, and which labels are hard-coded.
5. **Coupled components**: anything sticky, fixed or anchored to the old nav height; dropdowns; z-index values; fixed-minimum-width grids.

Stop and report if the discovery contradicts the assumptions above, for example no router or no top nav.

## Step 2: Design tokens

- Copy `references/tokens.css` into the global stylesheet's `:root` block, or into a new `styles/tokens.css` imported once.
- Reuse the app's existing palette. Only replace a color if the app has no equivalent.
- Replace hard-coded values in the shell only in this step. View-level values stay until Step 6.

## Step 3: Sidebar shell

- Change the root layout to a row: a sidebar of `var(--sidebar-width)` and a content column with `flex: 1; min-width: 0`.
- Sidebar: `position: sticky; top: 0; height: 100vh; overflow-y: auto`. Do not set `overflow: hidden`, which clips dropdowns.
- Sidebar sections, top to bottom: brand, primary nav, footer (language switcher, profile menu).
- Nav items come from the router or a single config that is also translated. Do not keep a second hard-coded list.
- Active state comes from the router (`router-link` `active-class` or `$route`), not manual path comparison.
- `references/AppSidebar.vue.example` is a starting template. Adapt it. Do not drop it in unchanged.
- Keep every piece of state and every modal wiring from the old shell.

## Step 4: Fix coupled components

- **Sticky offsets** tied to the old nav height: set `top: 0`, or move the element into the content column.
- **Dropdowns** anchored `top: 100%; right: 0`: open upward or rightward when they sit in the sidebar footer. Keep the existing blur and `mousedown.prevent` behavior.
- **z-index**: sidebar `var(--z-sidebar)` (100). Dropdowns `var(--z-dropdown)` (1000). Modals at or above 1000. Confirm modals still cover the sidebar.
- **Fixed-minimum-width grids** (for example `minmax(450px, 1fr)`): with a sidebar, a narrow viewport can overflow. Flag them. Change them only in Step 6, or if the user asks.
- **Hard-coded nav labels**: move them to the locale files, for every locale the app ships.
- **Responsive**: below roughly 900px, the sidebar collapses to an overlay or an icon rail. Add the media query in the shell's CSS.

## Step 5: Verify

1. Build passes (`npm run build` or the project's equivalent).
2. Dev server runs. Every route renders with the sidebar, and the active link follows the route.
3. Dropdowns and modals are fully visible and not clipped.
4. Switching locale updates the nav labels.
5. At a narrow width (about 800px), the layout collapses without overlap.
6. No new hard-coded colors outside `tokens.css` in the shell.

If the browser automation MCP is unavailable, say so and ask the user to check manually. Do not claim the visual result is verified.

## Step 6: Per-view restyling (opt-in)

Only after the user confirms. Restyle one view at a time, reusing the shared classes from the global CSS (`.page-header`, `.card`, `.stat-card`, `.table-container`, `.badge`). Remove duplicated scoped definitions of those classes only when they are identical to the global ones. Report what changed per view.
