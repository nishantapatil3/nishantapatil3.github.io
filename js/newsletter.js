// Newsletter dynamic loader
class NewsletterLoader {
    constructor() {
        this.newsletterDir = 'newsletter/';
        this.postsContainer = document.querySelector('.newsletter-posts');
    }

    async init() {
        try {
            const posts = await this.fetchPosts();
            this.renderPosts(posts);
        } catch (error) {
            console.error('Error loading newsletter posts:', error);
            this.renderError();
        }
    }

    async fetchPosts() {
        const response = await fetch(`${this.newsletterDir}index.json`);
        if (!response.ok) {
            throw new Error('Failed to fetch newsletter index');
        }
        return await response.json();
    }

    async fetchMarkdown(filename) {
        const response = await fetch(`${this.newsletterDir}${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${filename}`);
        }
        return await response.text();
    }

    parseMarkdown(content) {
        // Extract frontmatter
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

        // Simple markdown parsing
        body = this.convertMarkdownToHTML(body.trim());

        return { frontmatter, body };
    }

    convertMarkdownToHTML(markdown) {
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');

        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Line breaks and paragraphs
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

    async renderPosts(posts) {
        if (!this.postsContainer) return;

        this.postsContainer.innerHTML = '';

        // Sort posts by date (newest first)
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        for (const post of posts) {
            try {
                const markdown = await this.fetchMarkdown(post.file);
                const { frontmatter, body } = this.parseMarkdown(markdown);

                const article = document.createElement('article');
                article.className = 'newsletter-post';

                const title = frontmatter.title || post.title;
                const date = frontmatter.date || post.date;

                article.innerHTML = `
                    <div class="post-header">
                        <h3>${title}</h3>
                        <time datetime="${date}">${this.formatDate(date)}</time>
                    </div>
                    <div class="post-content">
                        ${body}
                    </div>
                `;

                this.postsContainer.appendChild(article);
            } catch (error) {
                console.error(`Error rendering post ${post.file}:`, error);
            }
        }
    }

    renderError() {
        if (!this.postsContainer) return;

        this.postsContainer.innerHTML = `
            <article class="newsletter-post">
                <div class="post-content">
                    <p>Unable to load newsletter posts. Please check back later.</p>
                </div>
            </article>
        `;
    }
}

// Initialize newsletter loader when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const loader = new NewsletterLoader();
        loader.init();
    });
} else {
    const loader = new NewsletterLoader();
    loader.init();
}
