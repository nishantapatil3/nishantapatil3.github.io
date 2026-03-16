# Posts

This directory contains folders for posts that are dynamically loaded on the website.

## How to Add a New Post

1. **Create a new folder** in this directory with the naming format: `YYYY-MM-DD`
   - Example: `2025-12-04`
   - If you have multiple posts on the same date, use `YYYY-MM-DD-2`, `YYYY-MM-DD-3`, etc.

2. **Create `index.md`** inside that folder and add frontmatter at the top:
   ```markdown
   ---
   title: Your Post Title
   date: 2025-12-04
   ---

   Your post content starts here...
   ```

3. **Write your content** using standard markdown syntax:
   - Headers: `#`, `##`, `###`
   - Bold: `**text**` or `__text__`
   - Italic: `*text*` or `_text_`
   - Links: `[text](url)`
   - Code: `` `inline code` `` or ` ```code block``` `
   - Paragraphs: Separate with blank lines

## Images (Per-Post Folder)

Put images in the same post folder and reference them by filename:

```markdown
![Diagram](diagram.png)
```

Example structure:

```
public/posts/2025-12-04/
  index.md
  index.html
  diagram.png
```

4. **Update index.json** to include your new post:
   ```json
   [
     {
       "slug": "2025-12-04",
       "title": "Your Post Title",
       "date": "2025-12-04"
     },
     {
       "slug": "2025-12-03",
       "title": "Welcome to My Posts",
       "date": "2025-12-03"
     }
   ]
   ```

   **Note:** Add new posts at the top of the array. They will be automatically sorted by date on the website.

## Import From Medium

If you want to pull posts from Medium, run:

```bash
task import-medium
```

Options:
- `node scripts/import-medium.js --limit=10` to cap imports
- `node scripts/import-medium.js --force` to overwrite existing folders
- `node scripts/import-medium.js --no-snapshot` to skip saving `source.html`

Each import saves a static HTML snapshot from Medium as `source.html` inside the post folder.
Images referenced in the Medium content are downloaded into `public/posts/<slug>/images/` and rewritten to local paths.

## Import From Outshift

The Outshift author posts are rendered client-side, so this uses Playwright to capture the article HTML.

```bash
task import-outshift
```

Options:
- `node scripts/import-outshift.js --force` to overwrite existing folders
- `node scripts/import-outshift.js --urls=<url1,url2>` to import specific posts

5. **Add `index.html`** inside the folder by copying an existing post page (template).

## Example Post

See `public/posts/2025-12-03/index.md` and `public/posts/2025-12-03/index.html` for a complete example.

## Markdown Features Supported

- Headers (H1, H2, H3)
- Bold and italic text
- Links
- Inline code and code blocks
- Paragraphs with automatic formatting

Posts are automatically sorted by date (newest first) and rendered on the homepage and the `/posts/` page.
