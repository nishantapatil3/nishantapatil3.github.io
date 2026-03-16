# Repo Quick Look

This repo is a Vite-powered personal portfolio + writing hub. The main page is built in `index.html` with styles and scripts in `src/`, and posts are served from `public/posts`.

## What runs the site
- `index.html`: Main landing page with About, Focus, Writing, Chatbot, and Contact sections.
- `src/styles.css`: Design system and layout.
- `src/main.js`: Posts loader + reveal animations.
- `public/posts/index.html`: Posts listing page.
- `public/posts/post.js`: Single-post renderer.

## Typical tasks
- Run locally: `npm run dev` (http://localhost:5173).
- Add a post: create `public/posts/YYYY-MM-DD/index.md`, then update `public/posts/index.json`.
- Update homepage content: edit `index.html` or styles in `src/styles.css`.

## Content model
- Posts are markdown files with frontmatter (`title`, `date`).
- The homepage and `/posts/` page fetch `public/posts/index.json` and render links client-side.

## Key paths
- `public/posts/README.md`: how to add posts.
- `public/img/`: static images.
- `.github/workflows/pages.yml`: GitHub Pages build/deploy.
