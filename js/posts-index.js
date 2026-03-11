// Posts index page loader
class PostsIndex {
    constructor() {
        this.postsDir = '../posts/';
        this.list = document.querySelector('.posts-list');
    }

    async init() {
        try {
            const posts = await this.fetchPosts();
            this.render(posts);
        } catch (error) {
            console.error('Error loading posts index:', error);
            this.renderError();
        }
    }

    async fetchPosts() {
        const response = await fetch(`${this.postsDir}index.json`);
        if (!response.ok) {
            throw new Error('Failed to fetch posts index');
        }
        return await response.json();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    async render(posts) {
        if (!this.list) return;

        this.list.innerHTML = '';

        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        for (const post of posts) {
            const item = document.createElement('article');
            item.className = 'post-item';

            const url = `./${post.slug}/`;

            item.innerHTML = `
                <h2><a href="${url}">${post.title}</a></h2>
                <time datetime="${post.date}">${this.formatDate(post.date)}</time>
            `;

            this.list.appendChild(item);
        }
    }

    renderError() {
        if (!this.list) return;
        this.list.innerHTML = '<p class="posts-error">Unable to load posts.</p>';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const loader = new PostsIndex();
        loader.init();
    });
} else {
    const loader = new PostsIndex();
    loader.init();
}
