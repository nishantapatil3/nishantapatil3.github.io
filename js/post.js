// Single post renderer
class PostPage {
    constructor() {
        this.container = document.querySelector('.post-content');
    }

    async init() {
        try {
            const markdown = await this.fetchMarkdown();
            const { frontmatter, body } = this.parseMarkdown(markdown);
            this.render(frontmatter, body);
        } catch (error) {
            console.error('Error loading post:', error);
            this.renderError();
        }
    }

    async fetchMarkdown() {
        const response = await fetch('./index.md');
        if (!response.ok) {
            throw new Error('Failed to fetch post markdown');
        }
        return await response.text();
    }

    parseMarkdown(content) {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);

        let frontmatter = {};
        let body = content;

        if (match) {
            const frontmatterText = match[1];
            body = match[2];

            frontmatterText.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split(':');
                if (key && valueParts.length) {
                    frontmatter[key.trim()] = valueParts.join(':').trim();
                }
            });
        }

        const trimmedBody = body.trim();
        if (this.isHtmlContent(trimmedBody)) {
            body = trimmedBody;
        } else {
            body = this.convertMarkdownToHTML(trimmedBody);
        }

        return { frontmatter, body };
    }

    isHtmlContent(text) {
        return /<\\w+[^>]*>/.test(text);
    }

    convertMarkdownToHTML(markdown) {
        let html = markdown;

        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');

        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');

        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        html = html.split('\n\n').map(para => {
            if (!para.startsWith('<') && para.trim() !== '') {
                return `<p>${para.replace(/\n/g, ' ')}</p>`;
            }
            return para;
        }).join('\n');

        return html;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    render(frontmatter, body) {
        if (!this.container) return;

        const title = frontmatter.title || 'Untitled Post';
        const date = frontmatter.date ? this.formatDate(frontmatter.date) : '';

        this.container.innerHTML = `
            <header class="post-header">
                <h1>${title}</h1>
                ${frontmatter.date ? `<time datetime="${frontmatter.date}">${date}</time>` : ''}
            </header>
            <section class="post-body">
                ${body}
            </section>
        `;
    }

    renderError() {
        if (!this.container) return;
        this.container.innerHTML = '<p class="posts-error">Unable to load this post.</p>';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const page = new PostPage();
        page.init();
    });
} else {
    const page = new PostPage();
    page.init();
}
