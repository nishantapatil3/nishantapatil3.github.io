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
  document.documentElement.dataset.theme = theme;
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    const sunIcon =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    const moonIcon =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    const nextIsLight = theme === 'dark';
    toggle.innerHTML = nextIsLight ? sunIcon : moonIcon;
    toggle.setAttribute('aria-label', nextIsLight ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

function getPreferredTheme() {
  if (typeof window === 'undefined') return 'dark';
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function getInitialTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  const fromDom = document.documentElement.dataset.theme;
  if (fromDom === 'dark' || fromDom === 'light') return fromDom;
  return getPreferredTheme();
}

function setupThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  applyTheme(getInitialTheme());

  toggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  });

  if (window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', (event) => {
      if (!localStorage.getItem('theme')) {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key === 'theme' && (event.newValue === 'dark' || event.newValue === 'light')) {
      applyTheme(event.newValue);
    }
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
