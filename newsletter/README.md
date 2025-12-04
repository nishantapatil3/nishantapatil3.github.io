# Newsletter Posts

This directory contains markdown files for newsletter posts that are dynamically loaded on the website.

## How to Add a New Newsletter Post

1. **Create a new markdown file** in this directory with the naming format: `YYYY-MM-DD-slug.md`
   - Example: `2025-12-04-my-new-post.md`

2. **Add frontmatter** at the top of your markdown file:
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

4. **Update index.json** to include your new post:
   ```json
   [
     {
       "file": "2025-12-04-my-new-post.md",
       "title": "Your Post Title",
       "date": "2025-12-04"
     },
     {
       "file": "2025-12-03-welcome.md",
       "title": "Welcome to My Newsletter",
       "date": "2025-12-03"
     }
   ]
   ```

   **Note:** Add new posts at the top of the array. They will be automatically sorted by date on the website.

## Example Post

See `2025-12-03-welcome.md` for a complete example.

## Markdown Features Supported

- Headers (H1, H2, H3)
- Bold and italic text
- Links
- Inline code and code blocks
- Paragraphs with automatic formatting

Posts are automatically sorted by date (newest first) and rendered in the left sidebar of the website.
