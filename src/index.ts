// tinyfeed - a feed is a url

import { Feed } from './feed';
import {
  createFeed,
  getFeed,
  updateProfile,
  createPost,
  deletePost,
  exportFeed,
  rssFeed,
  jsonFeed,
} from './api/handlers';
import { landingPage } from './pages/landing';
import { feedPage } from './pages/feed';
import { homePage } from './pages/home';
import { contactsPage } from './pages/contacts';
import { importPage } from './pages/import';
import { notFoundPage } from './pages/not-found';

export { Feed };

interface Env {
  FEED: DurableObjectNamespace;
}

type FeedData = {
  id: string;
  name: string;
  about: string;
  createdAt: number;
  posts: Array<{
    id: string;
    content: string;
    url: string | null;
    timestamp: number;
  }>;
};

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function html(content: string, status = 200): Response {
  return new Response(content, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function notFound(): Response {
  return html(notFoundPage(), 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const baseUrl = getBaseUrl(request);

    try {
      // ─────────────────────────────────────────────────────────────────────
      // API Routes
      // ─────────────────────────────────────────────────────────────────────

      // POST /api/feed - Create new feed
      if (method === 'POST' && path === '/api/feed') {
        return createFeed(request, env);
      }

      // GET /api/feed/:id - Get feed data
      const apiFeedMatch = path.match(/^\/api\/feed\/([a-z0-9]+)$/i);
      if (method === 'GET' && apiFeedMatch) {
        return getFeed(request, env, apiFeedMatch[1]);
      }

      // PATCH /api/feed/:id - Update profile
      if (method === 'PATCH' && apiFeedMatch) {
        return updateProfile(request, env, apiFeedMatch[1]);
      }

      // POST /api/feed/:id/post - Create post
      const apiPostMatch = path.match(/^\/api\/feed\/([a-z0-9]+)\/post$/i);
      if (method === 'POST' && apiPostMatch) {
        return createPost(request, env, apiPostMatch[1]);
      }

      // DELETE /api/feed/:id/post/:postId - Delete post
      const apiDeleteMatch = path.match(/^\/api\/feed\/([a-z0-9]+)\/post\/([a-z0-9]+)$/i);
      if (method === 'DELETE' && apiDeleteMatch) {
        return deletePost(request, env, apiDeleteMatch[1], apiDeleteMatch[2]);
      }

      // GET /api/feed/:id/export - Export feed
      const apiExportMatch = path.match(/^\/api\/feed\/([a-z0-9]+)\/export$/i);
      if (method === 'GET' && apiExportMatch) {
        return exportFeed(request, env, apiExportMatch[1]);
      }

      // ─────────────────────────────────────────────────────────────────────
      // Feed Formats
      // ─────────────────────────────────────────────────────────────────────

      // GET /f/:id.rss - RSS feed
      const rssMatch = path.match(/^\/f\/([a-z0-9]+)\.rss$/i);
      if (method === 'GET' && rssMatch) {
        return rssFeed(request, env, rssMatch[1]);
      }

      // GET /f/:id.json - JSON Feed
      const jsonMatch = path.match(/^\/f\/([a-z0-9]+)\.json$/i);
      if (method === 'GET' && jsonMatch) {
        return jsonFeed(request, env, jsonMatch[1]);
      }

      // ─────────────────────────────────────────────────────────────────────
      // HTML Pages
      // ─────────────────────────────────────────────────────────────────────

      // Landing page
      if (method === 'GET' && path === '/') {
        return html(landingPage(baseUrl));
      }

      // Home (aggregated feed)
      if (method === 'GET' && path === '/home') {
        return html(homePage(baseUrl));
      }

      // Contacts
      if (method === 'GET' && path === '/contacts') {
        return html(contactsPage(baseUrl));
      }

      // Import/restore
      if (method === 'GET' && path === '/import') {
        return html(importPage(baseUrl));
      }

      // Feed page
      const feedMatch = path.match(/^\/f\/([a-z0-9]+)$/i);
      if (method === 'GET' && feedMatch) {
        const feedId = feedMatch[1];
        const doId = env.FEED.idFromName(feedId);
        const stub = env.FEED.get(doId);
        const response = await stub.fetch(new Request('http://internal/data'));

        if (!response.ok) {
          return notFound();
        }

        const feed = await response.json() as FeedData;
        return html(feedPage(feed, baseUrl));
      }

      return notFound();
    } catch (e) {
      console.error('Worker error:', e);
      return new Response('internal error', { status: 500 });
    }
  },
};
