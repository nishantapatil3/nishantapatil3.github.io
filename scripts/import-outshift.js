#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { chromium } = require('playwright');

const POSTS_DIR = path.join(__dirname, '..', 'public', 'posts');
const INDEX_PATH = path.join(POSTS_DIR, 'index.json');
const IMAGE_DIR_NAME = 'images';

const DEFAULT_URLS = [
    'https://outshift.cisco.com/blog/post-quantum-cryptography-the-path-to-becoming-quantum-safe',
    'https://outshift.cisco.com/blog/progressive-delivery-calisti',
    'https://outshift.cisco.com/blog/spire-federation-kind'
];

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function buildPostFolder(date) {
    if (!date) return '0000-00-00';
    return date;
}

function ensureUniqueFolder(baseName) {
    const basePath = path.join(POSTS_DIR, baseName);
    if (!fs.existsSync(basePath)) return baseName;
    let i = 2;
    while (fs.existsSync(path.join(POSTS_DIR, `${baseName}-${i}`))) {
        i += 1;
    }
    return `${baseName}-${i}`;
}

function buildMarkdown({ title, date, html, sourceUrl }) {
    const source = sourceUrl ? `\n\n---\n\nReposted from Outshift: ${sourceUrl}\n` : '';
    return `---\n` +
        `title: ${title}\n` +
        (date ? `date: ${date}\n` : '') +
        `---\n\n` +
        `${html}\n` +
        `${source}`;
}

function buildPostHtml(title) {
    return `<!doctype html>\n` +
        `<html lang="en">\n` +
        `  <head>\n` +
        `    <meta charset="utf-8" />\n` +
        `    <meta name="viewport" content="width=device-width, initial-scale=1" />\n` +
        `    <title>${title}</title>\n` +
        `    <link rel="stylesheet" href="/posts/site.css" />\n` +
        `  </head>\n` +
        `  <body class="post-page">\n` +
        `    <header class="site-header">\n` +
        `      <div class="container">\n` +
        `        <a class="nav-link" href="/posts/">← Back to writing</a>\n` +
        `      </div>\n` +
        `    </header>\n\n` +
        `    <main class="container">\n` +
        `      <article class="post-content" aria-live="polite">\n` +
        `        <p>Loading post…</p>\n` +
        `      </article>\n` +
        `    </main>\n\n` +
        `    <footer class="site-footer">\n` +
        `      <div class="container">Designed &amp; built by Nishant Patil.</div>\n` +
        `    </footer>\n\n` +
        `    <script src="/posts/post.js"></script>\n` +
        `  </body>\n` +
        `</html>\n`;
}

function loadIndex() {
    if (!fs.existsSync(INDEX_PATH)) return [];
    return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
}

function saveIndex(posts) {
    fs.writeFileSync(INDEX_PATH, JSON.stringify(posts, null, 4) + '\n');
}

function normalizeImageUrl(url, baseUrl) {
    if (!url) return '';
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return new URL(url, baseUrl).toString();
    return url;
}

function safeFilename(name) {
    return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
}

function downloadFile(url, destPath, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'http:' ? http : https;
        const request = client.get(url, res => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                file.close();
                fs.unlink(destPath, () => {
                    if (redirectCount >= 3) {
                        reject(new Error(`Too many redirects for ${url}`));
                        return;
                    }
                    const nextUrl = new URL(res.headers.location, url).toString();
                    resolve(downloadFile(nextUrl, destPath, redirectCount + 1));
                });
                return;
            }
            if (res.statusCode !== 200) {
                file.close();
                fs.unlink(destPath, () => reject(new Error(`Download failed: ${res.statusCode}`)));
                return;
            }
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
        });
        request.on('error', err => {
            file.close();
            fs.unlink(destPath, () => reject(err));
        });
    });
}

async function localizeImages(html, postDir, baseUrl) {
    if (!html) return { html: '', count: 0 };

    let updated = html.replace(/\s+srcset="[^"]*"/gi, '');
    const imagesDir = path.join(postDir, IMAGE_DIR_NAME);
    fs.mkdirSync(imagesDir, { recursive: true });

    const imageUrls = [];
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(updated)) !== null) {
        imageUrls.push(match[1]);
    }

    const seen = new Set();
    let count = 0;

    for (const rawUrl of imageUrls) {
        const url = normalizeImageUrl(rawUrl, baseUrl);
        if (!url || seen.has(url)) continue;
        seen.add(url);

        let filename = '';
        try {
            const urlObj = new URL(url);
            const base = safeFilename(path.basename(urlObj.pathname)) || `image-${count + 1}`;
            let ext = path.extname(base);
            if (!ext) ext = '.jpg';
            filename = base.endsWith(ext) ? base : `${base}${ext}`;
        } catch (error) {
            filename = `image-${count + 1}.jpg`;
        }

        const destPath = path.join(imagesDir, filename);

        try {
            await downloadFile(url, destPath);
            const relativePath = `${IMAGE_DIR_NAME}/${filename}`;
            const safeUrl = rawUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            updated = updated.replace(new RegExp(safeUrl, 'g'), relativePath);
            count += 1;
        } catch (error) {
            console.warn(`Failed to download image ${url}: ${error.message}`);
        }
    }

    return { html: updated, count };
}

async function extractPostData(page) {
    return await page.evaluate(() => {
        const title = document.querySelector('h1')?.innerText?.trim() || document.title || 'Untitled';

        const metaTime = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
            document.querySelector('meta[name="article:published_time"]')?.getAttribute('content') ||
            document.querySelector('time[datetime]')?.getAttribute('datetime') ||
            '';

        const preferred =
            document.querySelector('.prose') ||
            document.querySelector('article') ||
            document.querySelector('[data-testid="blog-content"]') ||
            document.querySelector('main');

        const main = preferred || document.body;
        const candidates = Array.from(main.querySelectorAll('article, section, div'));

        let best = null;
        let bestScore = 0;

        for (const el of candidates) {
            const pCount = el.querySelectorAll('p').length;
            const textLen = (el.innerText || '').length;
            const score = pCount * 50 + textLen;
            if (score > bestScore) {
                bestScore = score;
                best = el;
            }
        }

        const contentHtml = best ? best.innerHTML : main.innerHTML;

        return { title, metaTime, contentHtml };
    });
}

async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const urlsArg = args.find(arg => arg.startsWith('--urls='));
    const urls = urlsArg ? urlsArg.replace('--urls=', '').split(',').map(s => s.trim()).filter(Boolean) : DEFAULT_URLS;

    const index = loadIndex();
    const existingSlugs = new Set(index.map(post => post.slug));

    const browser = await chromium.launch();
    const page = await browser.newPage();

    let added = 0;

    for (const url of urls) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);
        const publishedDate = await page.evaluate(() => {
            const text = document.body ? document.body.textContent || '' : '';
            const match = text.match(/Published on\s+(\d{2}\/\d{2}\/\d{4})/i);
            return match ? match[1] : '';
        });

        const { title, metaTime, contentHtml } = await extractPostData(page);
        const dateText = publishedDate || metaTime;
        const date = formatDate(dateText);
        if (!date) {
            console.warn(`No publish date found for ${url}`);
        }

        const folderBase = buildPostFolder(date);
        const folderName = force ? folderBase : ensureUniqueFolder(folderBase);
        const postDir = path.join(POSTS_DIR, folderName);

        if (!force && fs.existsSync(postDir)) {
            continue;
        }

        fs.mkdirSync(postDir, { recursive: true });

        const { html: localizedHtml } = await localizeImages(contentHtml, postDir, url);
        const markdown = buildMarkdown({ title, date, html: localizedHtml, sourceUrl: url });

        fs.writeFileSync(path.join(postDir, 'index.md'), markdown);
        fs.writeFileSync(path.join(postDir, 'index.html'), buildPostHtml(title));

        if (!existingSlugs.has(folderName)) {
            index.push({ slug: folderName, title, date: date || '0000-00-00' });
            existingSlugs.add(folderName);
        }

        added += 1;
    }

    await browser.close();

    index.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveIndex(index);

    console.log(`Imported ${added} posts.`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
