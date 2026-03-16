# Repository Structure

## Top-level
- `index.html`: Main entry (Vite HTML).
- `src/`: Source assets for Vite (CSS + JS).
- `public/`: Static assets copied as-is (posts, images, etc.).
- `.github/workflows/pages.yml`: GitHub Pages build/deploy workflow.
- `vite.config.js`: Vite build configuration.
- `package.json`: Build scripts and dependencies.

## Posts flow
1. Add `public/posts/YYYY-MM-DD/index.md` with frontmatter.
2. Add entry to `public/posts/index.json` (newest at top).
3. The homepage and `/posts/` page fetch `public/posts/index.json` and render entries client-side.

## Build/serve flow
- `npm run dev` runs the Vite dev server.
- `npm run build` outputs production files to `dist/`.
- GitHub Actions builds and deploys `dist/` to GitHub Pages.
