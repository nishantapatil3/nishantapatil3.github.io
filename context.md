# Context

Personal website built with Vite and static assets in `public/`.

## Key Directories
- `index.html`: main homepage.
- `src/`: site JS/CSS (Vite entry).
- `public/posts/`: static post pages + assets + `index.json`.

## Local Dev
- `npm install`
- `npm run dev`

## Build
- `npm run build`
- `npm run preview`

## Notes
- Homepage posts list is generated client-side from `public/posts/index.json`.
- Post pages load content from `public/posts/<slug>/index.md` via `public/posts/post.js`.

## Dependabot Tracking (gh)
- `gh repo view --json nameWithOwner`
- `gh api -H "Accept: application/vnd.github+json" "/repos/nishantapatil3/nishantapatil3.github.io/dependabot/alerts?per_page=100"`
- `gh api -H "Accept: application/vnd.github+json" "/repos/nishantapatil3/nishantapatil3.github.io/dependabot/alerts?state=open&per_page=100"`
