class PostPage {
  static AUTO_LANGUAGES = ['bash', 'shell', 'json', 'yaml', 'python', 'javascript', 'go', 'dockerfile', 'diff'];
  static SHELL_PATTERN =
    /^\s*(?:[$❯#]\s|\.\/|(?:git|sudo|cd|ls|l|cp|mv|curl|wget|brew|npm|npx|pip|python3?|docker|kubectl|helm|kind|task|make|qemu-img|systemctl|export)\b)/;

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

      frontmatterText.split('\n').forEach((line) => {
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
    return /<\w+[^>]*>/.test(text);
  }

  convertMarkdownToHTML(markdown) {
    if (window.marked) {
      return window.marked.parse(markdown, { gfm: true, breaks: false });
    }
    return this.convertMarkdownToHTMLFallback(markdown);
  }

  convertMarkdownToHTMLFallback(markdown) {
    let html = markdown;

    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    html = html.replace(
      /!\[([^\]]*)\]\(([^\)]+)\)/g,
      '<figure><img src="$2" alt="$1" loading="lazy" /></figure>'
    );
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');

    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    html = html
      .split('\n\n')
      .map((para) => {
        if (!para.startsWith('<') && para.trim() !== '') {
          return `<p>${para.replace(/\n/g, ' ')}</p>`;
        }
        return para;
      })
      .join('\n');

    return html;
  }

  formatDate(dateString) {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      ? new Date(`${dateString}T00:00:00`)
      : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  render(frontmatter, body) {
    if (!this.container) return;

    const title = frontmatter.title || 'Untitled Post';
    const date = frontmatter.date ? this.formatDate(frontmatter.date) : '';

    this.container.innerHTML = `
      <header>
        <h1>${title}</h1>
        ${frontmatter.date ? `<time datetime="${frontmatter.date}">${date}</time>` : ''}
      </header>
      <section class="post-body">
        ${body}
      </section>
    `;
    this.enhance(this.container.querySelector('.post-body'));
  }

  enhance(root) {
    if (!root) return;
    this.linkifyText(root);
    this.decorateLinks(root);
    this.decorateCodeBlocks(root);
  }

  linkifyText(root) {
    const urlRegex = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)]/g;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.parentElement.closest('a, pre, code')) return NodeFilter.FILTER_REJECT;
        urlRegex.lastIndex = 0;
        return urlRegex.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      const text = node.nodeValue;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      urlRegex.lastIndex = 0;
      for (const match of text.matchAll(urlRegex)) {
        fragment.append(text.slice(lastIndex, match.index));
        const link = document.createElement('a');
        link.href = match[0];
        link.textContent = match[0];
        fragment.append(link);
        lastIndex = match.index + match[0].length;
      }
      fragment.append(text.slice(lastIndex));
      node.replaceWith(fragment);
    });
  }

  decorateLinks(root) {
    root.querySelectorAll('a[href]').forEach((link) => {
      const url = new URL(link.getAttribute('href'), window.location.href);
      if (url.origin !== window.location.origin) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });
  }

  highlight(code) {
    const declared = (code.className.match(/language-([\w-]+)/) || [])[1];
    const hljs = window.hljs;
    if (!hljs) return declared;

    if (declared && hljs.getLanguage(declared)) {
      hljs.highlightElement(code);
      return declared;
    }

    // Unlabelled blocks: treat terminal sessions as bash, otherwise only guess
    // among languages these posts use and leave low-confidence matches as plain text.
    if (PostPage.SHELL_PATTERN.test(code.textContent)) {
      code.classList.add('language-bash');
      hljs.highlightElement(code);
      return 'bash';
    }

    const result = hljs.highlightAuto(code.textContent, PostPage.AUTO_LANGUAGES);
    if (result.relevance < 5) return declared;
    code.innerHTML = result.value;
    code.classList.add('hljs', `language-${result.language}`);
    return result.language;
  }

  decorateCodeBlocks(root) {
    root.querySelectorAll('pre').forEach((pre) => {
      let code = pre.querySelector('code');
      if (!code) {
        code = document.createElement('code');
        code.textContent = pre.textContent;
        pre.replaceChildren(code);
      }

      const language = this.highlight(code);
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      pre.replaceWith(wrapper);

      const toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';
      toolbar.innerHTML = `
        <span class="code-lang">${language || 'text'}</span>
        <button type="button" class="code-copy">Copy</button>
      `;
      wrapper.append(toolbar, pre);

      const button = toolbar.querySelector('.code-copy');
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(code.textContent);
          button.textContent = 'Copied';
        } catch {
          button.textContent = 'Failed';
        }
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 1500);
      });
    });
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
