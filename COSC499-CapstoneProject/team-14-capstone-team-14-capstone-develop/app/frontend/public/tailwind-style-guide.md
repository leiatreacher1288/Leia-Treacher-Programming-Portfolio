# Tailwind Style Guide (Presets)

These are the shared class names defined in `tailwind.config.js` under `theme.extend.colors`. Use these instead of hardcoding hex values. If you need to add a custom, reusable color or font, **add it in that file**.

## Colors

### Sidebar

- `bg-sidebar-bg` → `#1E293B`
- `text-sidebar-text` → `#FFFFFF`
- `text-logo-indigo` → `#818CF8`
- `text-nav-link` → `#D1D5DB`
- `hover:bg-nav-hover` → `#334155`
- `border-select-border` → `#475569`
- `focus:border-select-border-focus` → `#6366F1`

### Main Content

- `bg-page` → `#FAFAF6`
- `text-heading` → `#1F2937`
- `bg-primary-btn` → `#6366F1`
- `hover:bg-primary-btn-hover` → `#4F46E5`
- `border-input-border` → `#D1D5DB`
- `text-search-icon` → `#9CA3AF`

### Card

- `bg-card` → `#FFFFFF`
- `text-card-subtitle` → `#6B7280`
- `text-card-info` → `#4B5563`
- `bg-accent-emerald` → `#10B981`
- `text-accent-amber` → `#F59E0B`
- `text-accent-indigo` → `#6366F1`
- `bg-secondary-btn` → `#F3F4F6`
- `hover:bg-secondary-btn-hover` → `#EEF2FF`

## Fonts

- `font-inter` → Inter (main UI font)
- `font-plex` → IBM Plex Sans

## How to Add More

When you need to reuse a color or font across the app, don’t hardcode it. Add it to the `tailwind.config.js` under `theme.extend.colors` or `theme.extend.fontFamily` and give it a readable name like `text-warning`, `bg-alert`, etc.

Then just use the class like this:

```tsx
<div className="bg-alert text-warning">...</div>
```
