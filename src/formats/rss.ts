// RSS 2.0 feed generator

import { escapeHtml } from '../utils/html';

interface Post {
  id: string;
  content: string;
  url: string | null;
  timestamp: number;
}

interface FeedData {
  id: string;
  name: string;
  about: string;
  posts: Post[];
}

export function generateRss(feed: FeedData, baseUrl: string): string {
  const feedUrl = `${baseUrl}/f/${feed.id}`;
  const feedName = feed.name || feed.id;
  const feedDescription = feed.about || `Posts from ${feedName}`;

  const items = feed.posts.map((post) => {
    const pubDate = new Date(post.timestamp).toUTCString();
    const guid = `${feedUrl}#${post.id}`;
    const link = post.url || feedUrl;

    return `    <item>
      <title>${escapeHtml(post.content.slice(0, 100))}${post.content.length > 100 ? '...' : ''}</title>
      <description><![CDATA[${escapeHtml(post.content)}${post.url ? `\n\n→ ${escapeHtml(post.url)}` : ''}]]></description>
      <link>${escapeHtml(link)}</link>
      <guid isPermaLink="false">${escapeHtml(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
    </item>`;
  });

  const lastBuildDate = feed.posts.length > 0
    ? new Date(feed.posts[0].timestamp).toUTCString()
    : new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(feedName)}</title>
    <link>${feedUrl}</link>
    <description>${escapeHtml(feedDescription)}</description>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${feedUrl}.rss" rel="self" type="application/rss+xml"/>
${items.join('\n')}
  </channel>
</rss>`;
}
