// API route handlers

import { generateFeedId, generateWriteKey } from '../utils/crypto';
import { generateRss } from '../formats/rss';
import { generateJsonFeed } from '../formats/json-feed';

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

function getFeedDO(env: Env, feedId: string): DurableObjectStub {
  const doId = env.FEED.idFromName(feedId);
  return env.FEED.get(doId);
}

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

// POST /api/feed - Create a new feed
export async function createFeed(request: Request, env: Env): Promise<Response> {
  const feedId = generateFeedId();
  const writeKey = generateWriteKey();

  const stub = getFeedDO(env, feedId);
  const response = await stub.fetch(new Request('http://internal/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: feedId, writeKey }),
  }));

  if (!response.ok) {
    return Response.json({ error: 'Failed to create feed' }, { status: 500 });
  }

  return Response.json({ id: feedId, writeKey });
}

// GET /api/feed/:id - Get feed data
export async function getFeed(request: Request, env: Env, feedId: string): Promise<Response> {
  const stub = getFeedDO(env, feedId);
  const response = await stub.fetch(new Request('http://internal/data'));
  return response;
}

// PATCH /api/feed/:id - Update profile
export async function updateProfile(request: Request, env: Env, feedId: string): Promise<Response> {
  const writeKey = request.headers.get('X-Write-Key');
  if (!writeKey) {
    return Response.json({ error: 'Write key required' }, { status: 401 });
  }

  const body = await request.text();
  const stub = getFeedDO(env, feedId);
  return stub.fetch(new Request('http://internal/profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Write-Key': writeKey,
    },
    body,
  }));
}

// POST /api/feed/:id/post - Create a post
export async function createPost(request: Request, env: Env, feedId: string): Promise<Response> {
  const writeKey = request.headers.get('X-Write-Key');
  if (!writeKey) {
    return Response.json({ error: 'Write key required' }, { status: 401 });
  }

  const body = await request.text();
  const stub = getFeedDO(env, feedId);
  return stub.fetch(new Request('http://internal/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Write-Key': writeKey,
    },
    body,
  }));
}

// DELETE /api/feed/:id/post/:postId - Delete a post
export async function deletePost(request: Request, env: Env, feedId: string, postId: string): Promise<Response> {
  const writeKey = request.headers.get('X-Write-Key');
  if (!writeKey) {
    return Response.json({ error: 'Write key required' }, { status: 401 });
  }

  const stub = getFeedDO(env, feedId);
  return stub.fetch(new Request(`http://internal/post/${postId}`, {
    method: 'DELETE',
    headers: { 'X-Write-Key': writeKey },
  }));
}

// GET /api/feed/:id/export - Export feed data
export async function exportFeed(request: Request, env: Env, feedId: string): Promise<Response> {
  const writeKey = request.headers.get('X-Write-Key');
  if (!writeKey) {
    return Response.json({ error: 'Write key required' }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'json';

  const stub = getFeedDO(env, feedId);
  return stub.fetch(new Request(`http://internal/export?format=${format}`, {
    method: 'GET',
    headers: { 'X-Write-Key': writeKey },
  }));
}

// GET /f/:id.rss - RSS feed
export async function rssFeed(request: Request, env: Env, feedId: string): Promise<Response> {
  const stub = getFeedDO(env, feedId);
  const response = await stub.fetch(new Request('http://internal/data'));

  if (!response.ok) {
    return new Response('Feed not found', { status: 404 });
  }

  const feed = await response.json() as FeedData;
  const baseUrl = getBaseUrl(request);
  const rss = generateRss(feed, baseUrl);

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

// GET /f/:id.json - JSON Feed
export async function jsonFeed(request: Request, env: Env, feedId: string): Promise<Response> {
  const stub = getFeedDO(env, feedId);
  const response = await stub.fetch(new Request('http://internal/data'));

  if (!response.ok) {
    return new Response('Feed not found', { status: 404 });
  }

  const feed = await response.json() as FeedData;
  const baseUrl = getBaseUrl(request);
  const json = generateJsonFeed(feed, baseUrl);

  return new Response(json, {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
