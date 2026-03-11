# Repository Structure

## Top-level
- `index.html`: Primary site content.
- `visitor-analytics.html`: Standalone analytics dashboard page.
- `posts/index.html`: Posts listing page.
- `css/`: Compiled CSS files (main: `grayscale.css`).
- `less/`: LESS source for the theme.
- `js/`: Front-end JavaScript (posts loader + helpers).
- `img/`: Site imagery and backgrounds.
- `vendor/`: Third-party libraries (font-awesome).
- `posts/`: Post folders and `index.json` feed for the sidebar.
- `gulpfile.js`: Build tasks for LESS compilation and vendor copying.
- `package.json`: Dev dependencies and local server scripts.

## Posts flow
1. Add `posts/YYYY-MM-DD/index.md` with frontmatter.
2. Add entry to `posts/index.json` (newest at top).
3. `js/newsletter.js` fetches the index + markdown files at runtime and renders them.

## Build/serve flow
- `npm start` runs `python3 -m http.server 8000`.
- Gulp tasks:
  - `less`: compiles `less/grayscale.less` -> `css/grayscale.css`.
  - `copy`: syncs font-awesome assets to `vendor/`.

## Analytics page
- `visitor-analytics.html` runs a self-contained Plotly dashboard using simulated data in JS.
