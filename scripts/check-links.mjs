import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  console.error(`Dist directory not found at: ${distDir}`);
  process.exit(1);
}

// Find all HTML files in dist
function getHtmlFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getHtmlFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

const htmlFiles = getHtmlFiles(distDir);
console.log(`Analyzing ${htmlFiles.length} generated HTML files in ./dist for link validity...`);

const basePrefix = process.env.BASE_PATH || '';
const hrefRegex = /href=["']([^"']+)["']/g;

const checkedLinks = new Set();
const brokenLinks = [];

for (const filePath of htmlFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relSourcePath = path.relative(distDir, filePath);

  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    const href = match[1];

    // Skip external and special links
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('#') ||
      href.startsWith('javascript:') ||
      href.startsWith('data:')
    ) {
      continue;
    }

    // Skip files like fonts, css, js in build
    if (href.endsWith('.css') || href.endsWith('.js') || href.endsWith('.svg') || href.endsWith('.ico') || href.endsWith('.xml') || href.endsWith('.json')) {
      continue;
    }

    // Clean query and hash
    let cleanHref = href.split('?')[0].split('#')[0];

    // Strip basePrefix if present
    if (basePrefix && cleanHref.startsWith(basePrefix)) {
      cleanHref = cleanHref.slice(basePrefix.length);
      if (!cleanHref.startsWith('/')) cleanHref = `/${cleanHref}`;
    }

    const checkKey = `${relSourcePath} -> ${cleanHref}`;
    if (checkedLinks.has(checkKey)) continue;
    checkedLinks.add(checkKey);

    // Normalize path to file in dist
    let targetFile;
    if (cleanHref.endsWith('/')) {
      targetFile = path.join(distDir, cleanHref, 'index.html');
    } else if (cleanHref === '' || cleanHref === '/') {
      targetFile = path.join(distDir, 'index.html');
    } else {
      // Check both cleanHref.html and cleanHref/index.html
      const asHtml = path.join(distDir, `${cleanHref}.html`);
      const asDirIndex = path.join(distDir, cleanHref, 'index.html');
      targetFile = fs.existsSync(asHtml) ? asHtml : asDirIndex;
    }

    if (!fs.existsSync(targetFile)) {
      brokenLinks.push({
        source: relSourcePath,
        href,
        resolved: path.relative(distDir, targetFile),
      });
    }
  }
}

if (brokenLinks.length > 0) {
  console.error(`\nFound ${brokenLinks.length} broken internal links:`);
  for (const b of brokenLinks) {
    console.error(`  - ${b.source} references ${b.href} (expected at: ${b.resolved})`);
  }
  process.exit(1);
} else {
  console.log(`✓ All internal links validated successfully (${checkedLinks.size} links checked)!`);
  process.exit(0);
}
