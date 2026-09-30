/**
 * scripts/feed/lib/rss-parser.mjs
 * Robust, dependency-free parser for RSS 2.0 and Atom feeds.
 * Strips HTML tags, decodes entities, and enforces the <= 200 character excerpt limit.
 */

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&euro;/g, '€')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export function cleanText(raw) {
  if (!raw) return '';
  // Strip CDATA wrapper if present
  let text = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  // Strip HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode HTML entities
  text = decodeEntities(text);
  // Collapse whitespace
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Creates a clean plain-text excerpt of at most 200 characters.
 */
export function createExcerpt(text, maxLength = 200) {
  const cleaned = cleanText(text);
  if (cleaned.length <= maxLength) return cleaned;
  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 140 ? truncated.slice(0, lastSpace) : truncated).trim() + '...';
}

/**
 * Parse an XML string containing RSS 2.0 or Atom.
 * Returns an array of items: { title, link, description, excerpt, pubDate, mediaUrl? }
 */
export function parseFeedXml(xmlText) {
  const items = [];
  if (!xmlText || typeof xmlText !== 'string') return items;

  const isAtom = xmlText.includes('<feed') && xmlText.includes('<entry');

  if (isAtom) {
    // Atom 1.0 parsing
    const entryRegex = /<entry[\s\S]*?>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xmlText)) !== null) {
      const block = match[1];

      const titleMatch = block.match(/<title[\s\S]*?>([\s\S]*?)<\/title>/);
      const linkMatch = block.match(/<link[\s\S]*?href=["']([^"']+)["']/);
      const updatedMatch = block.match(/<(?:updated|published)>([\s\S]*?)<\/(?:updated|published)>/);
      const summaryMatch = block.match(/<(?:summary|content)[\s\S]*?>([\s\S]*?)<\/(?:summary|content)>/);

      const title = titleMatch ? cleanText(titleMatch[1]) : '';
      const link = linkMatch ? linkMatch[1].trim() : '';
      const summaryRaw = summaryMatch ? summaryMatch[1] : '';
      const excerpt = createExcerpt(summaryRaw || title, 200);

      let pubDate = new Date();
      if (updatedMatch) {
        const parsed = new Date(cleanText(updatedMatch[1]));
        if (!isNaN(parsed.getTime())) pubDate = parsed;
      }

      if (title && link) {
        items.push({
          title,
          link,
          description: excerpt,
          excerpt,
          pubDate,
        });
      }
    }
  } else {
    // RSS 2.0 parsing
    const itemRegex = /<item[\s\S]*?>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const block = match[1];

      const titleMatch = block.match(/<title[\s\S]*?>([\s\S]*?)<\/title>/);
      const linkMatch = block.match(/<link[\s\S]*?>([\s\S]*?)<\/link>/) || block.match(/<link[\s\S]*?href=["']([^"']+)["']/);
      const descMatch = block.match(/<(?:description|content:encoded)[\s\S]*?>([\s\S]*?)<\/(?:description|content:encoded)>/);
      const dateMatch = block.match(/<(?:pubDate|dc:date)>([\s\S]*?)<\/(?:pubDate|dc:date)>/);
      const mediaMatch = block.match(/<media:content[\s\S]*?url=["']([^"']+)["']/);

      const title = titleMatch ? cleanText(titleMatch[1]) : '';
      let link = '';
      if (linkMatch) {
        link = cleanText(linkMatch[1] || linkMatch[0]);
      }
      const descRaw = descMatch ? descMatch[1] : '';
      const excerpt = createExcerpt(descRaw || title, 200);

      let pubDate = new Date();
      if (dateMatch) {
        const parsed = new Date(cleanText(dateMatch[1]));
        if (!isNaN(parsed.getTime())) pubDate = parsed;
      }

      if (title && link) {
        items.push({
          title,
          link,
          description: excerpt,
          excerpt,
          pubDate,
          mediaUrl: mediaMatch ? mediaMatch[1] : undefined,
        });
      }
    }
  }

  return items;
}
