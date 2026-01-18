# Design Consistency Audit Findings

## Current State Observations

| Page | Header Style | Card Style | Color Palette | Width Control |
| :--- | :--- | :--- | :--- | :--- |
| **Main Dashboard** | CSS Modules (blue) | Modules (soft shadows) | Google Blue | Centered 600px |
| **Banking Home** | Inline Styles | Inline Styles | Mixed (Blue, Green, Amber) | Centered 600px |
| **Accounts Page** | Inline Styles | Table/Card Mix | Blue 500 equivalent | Full width container |
| **Settings** | Global/Mixed | Mixed | Inconsistent | Varies |

## Issues Identified
1. **Heading Mismatch**: Some pages use `<h1>` with icons, others use custom divs for titles. Font sizes vary between pages.
2. **Button Proliferation**: Some buttons use standard CSS classes (`btn-primary`), others use inline style objects with manual hover logic.
3. **Card Inconsistency**: Border-radius and padding vary. Some cards have 10px padding, others 16px.
4. **Empty Components**: `Button.tsx`, `Card.tsx`, and `Table.tsx` are currently empty files, yet their functionality is implemented inline in pages.
5. **Mobile View**: Some tables overflow on very narrow screens (320px).

## Recommended Design Tokens
- **Primary Color**: `#1a73e8` (Google Blue)
- **Success Color**: `#1e8e3e` (Google Green)
- **Error Color**: `#d93025` (Google Red)
- **Border Radius**: `12px` (Modern/Premium)
- **Spacing Unit**: `8px` base
- **Max Width**: `600px` for all content containers on desktop.
