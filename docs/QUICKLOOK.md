# Repo Quick Look

This repo is a static personal portfolio + posts sidebar site built from the Start Bootstrap Grayscale theme. Content is mostly in plain HTML/CSS/JS, with a small client-side loader for posts.

## What runs the site
- `index.html`: Main landing page with About, Posts sidebar, Chatbot iframe, and Contact section.
- `posts/index.html`: Posts listing page with links to individual posts.
- `css/grayscale.css`: Main compiled stylesheet used by the site.
- `js/newsletter.js`: Client-side loader that reads `posts/index.json` and renders markdown posts into the sidebar.
- `visitor-analytics.html`: Separate dashboard page with Plotly charts (uses generated demo data in-browser).

## Typical tasks
- Run locally: `npm start` (serves on http://localhost:8000).
- Add a post: create `posts/YYYY-MM-DD/index.md`, then update `posts/index.json`.
- Update homepage content: edit `index.html`.

## Content model
- Posts are markdown files with frontmatter (`title`, `date`).
- The loader uses a simple markdown parser (headers, bold/italic, links, code) and renders into the left sidebar.

## Build tools (optional)
- `gulpfile.js` provides LESS compilation.
- Source styles are in `less/`; compiled CSS lives in `css/`.
- Vendor assets are pinned in `vendor/` (font-awesome).

## Key paths
- `posts/README.md`: how to add posts.
- `img/`: images used by the theme.
- `vendor/`: bootstrap, jquery, font-awesome.

## Notes / gotchas
- Post loading depends on a local server (fetching local files), so open via `http://localhost` instead of `file://`.
- `visitor-analytics.html` uses simulated data, not live analytics.
