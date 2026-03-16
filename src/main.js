const baseUrl = import.meta.env.BASE_URL || '/';
let cachedPosts = [];

function renderPosts(container, posts) {
  if (!container) return;
  container.innerHTML = '';
  posts.forEach((post) => {
    const item = document.createElement('article');
    item.className = 'post-item';
    item.innerHTML = `
        <h3><a href="${baseUrl}posts/${post.slug}/index.html">${post.title}</a></h3>
        <div class="post-meta">
          <time datetime="${post.date}">${formatDate(post.date)}</time>
          <span>•</span>
          <span>${post.readTime}</span>
        </div>
        ${post.excerpt ? `<p class="post-excerpt">${post.excerpt}</p>` : ''}
      `;
    container.appendChild(item);
  });
}

function matchesQuery(post, query) {
  if (!query) return true;
  const haystack = `${post.title} ${post.excerpt || ''}`.toLowerCase();
  return haystack.includes(query);
}

function setupSearch(container) {
  const input = document.getElementById('post-search');
  if (!input) return;
  input.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    const filtered = cachedPosts.filter((post) => matchesQuery(post, query));
    renderPosts(container, filtered);
  });
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.textContent = theme === 'dark' ? 'Light' : 'Dark';
  }
}

function setupThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const stored = localStorage.getItem('theme');
  applyTheme(stored || 'dark');

  toggle.addEventListener('click', () => {
    const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  });
}

async function loadPosts() {
  const container = document.querySelector('[data-posts]');
  if (!container) return;

  try {
    const response = await fetch(`${baseUrl}posts/index.json`);
    if (!response.ok) {
      throw new Error('Failed to fetch posts index');
    }

    const posts = await response.json();
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    cachedPosts = await Promise.all(
      posts.map(async (post) => {
        const markdown = await fetch(`${baseUrl}posts/${post.slug}/index.md`).then((res) =>
          res.ok ? res.text() : ''
        );
        const readTime = markdown ? calculateReadTime(markdown) : 'Quick read';
        const excerpt = markdown ? buildExcerpt(markdown) : '';
        return { ...post, readTime, excerpt };
      })
    );
    renderPosts(container, cachedPosts);
    setupSearch(container);
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="section-subtitle">Writing list is loading. Please refresh if it remains empty.</p>';
  }
}

function stripFrontmatter(markdown) {
  const frontmatterRegex = /^---\n[\s\S]*?\n---\n/;
  return markdown.replace(frontmatterRegex, '').trim();
}

function buildExcerpt(markdown) {
  const content = stripFrontmatter(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!content) return '';
  const sentences = content.split('. ');
  const excerpt = sentences[0].length > 180 ? content.slice(0, 180) : sentences[0];
  return `${excerpt.replace(/\s+$/, '')}${excerpt.length >= 180 ? '…' : '.'}`;
}

function calculateReadTime(markdown) {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = plainText ? plainText.split(' ').length : 0;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

setupThemeToggle();
loadPosts();
