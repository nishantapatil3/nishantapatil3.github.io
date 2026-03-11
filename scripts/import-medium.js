#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const FEED_URL = 'https://medium.com/feed/@nishant.apatil3';
const POSTS_DIR = path.join(__dirname, '..', 'posts');
const INDEX_PATH = path.join(POSTS_DIR, 'index.json');
const IMAGE_DIR_NAME = 'images';

function fetchUrl(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = typeof url === 'string' ? new URL(url) : url;
        const requestOptions = {
            hostname: options.hostname,
            path: options.pathname + (options.search || ''),
            protocol: options.protocol,
            headers
        };

        https.get(requestOptions, res => {
            if (res.statusCode !== 200) {
                reject(new Error(`Request failed: ${res.statusCode}`));
                return;
            }
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function stripCdata(text = '') {
    return text.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
}

function extractTag(item, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = item.match(regex);
    if (!match) return '';
    return stripCdata(match[1]);
}

function extractItems(xml) {
    const matches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    return matches.map(item => ({
        title: extractTag(item, 'title'),
        link: extractTag(item, 'link'),
        pubDate: extractTag(item, 'pubDate'),
        content: extractTag(item, 'content:encoded'),
        description: extractTag(item, 'description')
    }));
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function formatDate(dateString) {
    const date = new Date(dateString);
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

function buildMarkdown(item, htmlContent) {
    const date = formatDate(item.pubDate);
    const content = htmlContent || '';
    const source = item.link ? `\n\n---\n\nOriginally published on Medium: ${item.link}\n` : '';

    return `---\n` +
        `title: ${item.title}\n` +
        `date: ${date}\n` +
        `---\n\n` +
        `${content}\n` +
        `${source}`;
}

function buildPostHtml(title) {
    return `<!DOCTYPE html>\n` +
        `<html lang="en">\n\n` +
        `<head>\n` +
        `    <meta charset="utf-8">\n` +
        `    <meta name="viewport" content="width=device-width, initial-scale=1">\n` +
        `    <title>${title}</title>\n\n` +
        `    <link href="../../vendor/font-awesome/css/font-awesome.min.css" rel="stylesheet" type="text/css">\n` +
        `    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n` +
        `    <link href="../../css/posts.css" rel="stylesheet">\n` +
        `</head>\n\n` +
        `<body class="posts-page">\n` +
        `    <main class="posts-container">\n` +
        `        <nav class="posts-nav">\n` +
        `            <a href="../index.html">← Back to Posts</a>\n` +
        `        </nav>\n\n` +
        `        <article class="post-content" aria-live="polite">\n` +
        `            <p>Loading post…</p>\n` +
        `        </article>\n` +
        `    </main>\n\n` +
        `    <script src="../../js/post.js"></script>\n` +
        `</body>\n\n` +
        `</html>\n`;
}

function normalizeImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('//')) return `https:${url}`;
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

async function localizeImages(html, postDir) {
    if (!html) return { html: '', count: 0 };

    let updated = html.replace(/\s+srcset=\"[^\"]*\"/gi, '');
    updated = updated.replace(new RegExp('<img[^>]+/_/stat[^>]*>', 'gi'), '');
    const imagesDir = path.join(postDir, IMAGE_DIR_NAME);
    fs.mkdirSync(imagesDir, { recursive: true });

    const imageUrls = [];
    const imgRegex = /<img[^>]+src=\"([^\"]+)\"[^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(updated)) !== null) {
        imageUrls.push(match[1]);
    }

    const seen = new Set();
    let count = 0;

    for (const rawUrl of imageUrls) {
        const url = normalizeImageUrl(rawUrl);
        if (!url || seen.has(url)) continue;
        if (url.includes('/_/stat')) continue;
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

function loadIndex() {
    if (!fs.existsSync(INDEX_PATH)) return [];
    return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
}

function saveIndex(posts) {
    fs.writeFileSync(INDEX_PATH, JSON.stringify(posts, null, 4) + '\n');
}

async function main() {
    const args = process.argv.slice(2);
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    const force = args.includes('--force');
    const noSnapshot = args.includes('--no-snapshot');
    const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 20;

    const xml = await fetchUrl(FEED_URL);
    const items = extractItems(xml).slice(0, limit);

    const index = loadIndex();
    const existingSlugs = new Set(index.map(post => post.slug));

    let added = 0;

    for (const item of items) {
        if (!item.title || !item.pubDate) continue;

        const date = formatDate(item.pubDate);
        const folderBase = buildPostFolder(date);
        const folderName = force ? folderBase : ensureUniqueFolder(folderBase);
        const postDir = path.join(POSTS_DIR, folderName);

        if (!force && fs.existsSync(postDir)) {
            continue;
        }

        fs.mkdirSync(postDir, { recursive: true });

        const rawContent = item.content || item.description || '';
        const { html: localizedHtml } = await localizeImages(rawContent, postDir);

        const markdown = buildMarkdown(item, localizedHtml);
        fs.writeFileSync(path.join(postDir, 'index.md'), markdown);
        fs.writeFileSync(path.join(postDir, 'index.html'), buildPostHtml(item.title));

        if (!noSnapshot && item.link) {
            try {
                const html = await fetchUrl(item.link, {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                });
                fs.writeFileSync(path.join(postDir, 'source.html'), html);
            } catch (error) {
                console.warn(`Failed to snapshot ${item.link}: ${error.message}`);
            }
        }

        if (!existingSlugs.has(folderName)) {
            index.push({
                slug: folderName,
                title: item.title,
                date
            });
            existingSlugs.add(folderName);
        }

        added += 1;
    }

    index.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveIndex(index);

    console.log(`Imported ${added} posts.`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
