// Feed Durable Object - stores all state for a single feed

import { hashWriteKey, verifyWriteKey, generateId } from './utils/crypto';

export interface Post {
  id: string;
  content: string;
  url: string | null;
  timestamp: number;
}

export interface FeedData {
  id: string;
  name: string;
  about: string;
  writeKeyHash: string;
  createdAt: number;
  posts: Post[];
  lastPostAt: number;
}

interface Env {
  FEED: DurableObjectNamespace;
}

export class Feed implements DurableObject {
  private state: DurableObjectState;
  private data: FeedData | null = null;

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state;
  }

  private async loadData(): Promise<FeedData | null> {
    if (this.data === null) {
      this.data = await this.state.storage.get<FeedData>('data') ?? null;
    }
    return this.data;
  }

  private async saveData(): Promise<void> {
    if (this.data) {
      await this.state.storage.put('data', this.data);
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Initialize a new feed
      if (request.method === 'POST' && path === '/init') {
        const { id, writeKey } = await request.json() as { id: string; writeKey: string };
        const writeKeyHash = await hashWriteKey(writeKey);

        this.data = {
          id,
          name: '',
          about: '',
          writeKeyHash,
          createdAt: Date.now(),
          posts: [],
          lastPostAt: 0,
        };

        await this.saveData();
        return Response.json({ ok: true });
      }

      // Get feed data
      if (request.method === 'GET' && path === '/data') {
        const data = await this.loadData();
        if (!data) {
          return Response.json({ error: 'Feed not found' }, { status: 404 });
        }

        // Return public data (no writeKeyHash)
        return Response.json({
          id: data.id,
          name: data.name,
          about: data.about,
          createdAt: data.createdAt,
          posts: data.posts,
        });
      }

      // Update profile
      if (request.method === 'PATCH' && path === '/profile') {
        const data = await this.loadData();
        if (!data) {
          return Response.json({ error: 'Feed not found' }, { status: 404 });
        }

        const writeKey = request.headers.get('X-Write-Key');
        if (!writeKey || !(await verifyWriteKey(writeKey, data.writeKeyHash))) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, about } = await request.json() as { name?: string; about?: string };

        if (name !== undefined) {
          data.name = name.slice(0, 30);
        }
        if (about !== undefined) {
          data.about = about.slice(0, 160);
        }

        await this.saveData();
        return Response.json({ ok: true });
      }

      // Create post
      if (request.method === 'POST' && path === '/post') {
        const data = await this.loadData();
        if (!data) {
          return Response.json({ error: 'Feed not found' }, { status: 404 });
        }

        const writeKey = request.headers.get('X-Write-Key');
        if (!writeKey || !(await verifyWriteKey(writeKey, data.writeKeyHash))) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit: 1 post per minute
        const now = Date.now();
        if (now - data.lastPostAt < 60000) {
          const waitSec = Math.ceil((60000 - (now - data.lastPostAt)) / 1000);
          return Response.json(
            { error: `Rate limited. Wait ${waitSec} seconds.` },
            { status: 429, headers: { 'Retry-After': String(waitSec) } }
          );
        }

        const { content, url: postUrl } = await request.json() as { content: string; url?: string };

        if (!content || content.trim().length === 0) {
          return Response.json({ error: 'Content required' }, { status: 400 });
        }

        const post: Post = {
          id: generateId(6),
          content: content.slice(0, 500),
          url: postUrl?.slice(0, 2000) || null,
          timestamp: now,
        };

        data.posts.unshift(post);
        data.lastPostAt = now;

        // Keep max 1000 posts
        if (data.posts.length > 1000) {
          data.posts = data.posts.slice(0, 1000);
        }

        await this.saveData();
        return Response.json(post);
      }

      // Delete post
      if (request.method === 'DELETE' && path.startsWith('/post/')) {
        const data = await this.loadData();
        if (!data) {
          return Response.json({ error: 'Feed not found' }, { status: 404 });
        }

        const writeKey = request.headers.get('X-Write-Key');
        if (!writeKey || !(await verifyWriteKey(writeKey, data.writeKeyHash))) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const postId = path.replace('/post/', '');
        const index = data.posts.findIndex(p => p.id === postId);

        if (index === -1) {
          return Response.json({ error: 'Post not found' }, { status: 404 });
        }

        data.posts.splice(index, 1);
        await this.saveData();

        return Response.json({ ok: true });
      }

      // Export feed
      if (request.method === 'GET' && path === '/export') {
        const data = await this.loadData();
        if (!data) {
          return Response.json({ error: 'Feed not found' }, { status: 404 });
        }

        const writeKey = request.headers.get('X-Write-Key');
        if (!writeKey || !(await verifyWriteKey(writeKey, data.writeKeyHash))) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const format = url.searchParams.get('format') || 'json';

        if (format === 'md') {
          const md = this.exportMarkdown(data);
          return new Response(md, {
            headers: {
              'Content-Type': 'text/markdown',
              'Content-Disposition': `attachment; filename="${data.id}.md"`,
            },
          });
        }

        // Default: JSON
        const json = {
          id: data.id,
          name: data.name,
          about: data.about,
          createdAt: data.createdAt,
          exportedAt: Date.now(),
          posts: data.posts,
        };

        return new Response(JSON.stringify(json, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${data.id}.json"`,
          },
        });
      }

      return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (e) {
      console.error('Feed DO error:', e);
      return Response.json({ error: 'Internal error' }, { status: 500 });
    }
  }

  private exportMarkdown(data: FeedData): string {
    const lines: string[] = [
      `# ${data.name || data.id}`,
      '',
    ];

    if (data.about) {
      lines.push(`*${data.about}*`, '');
    }

    lines.push('---', '');

    for (const post of data.posts) {
      const date = new Date(post.timestamp).toISOString().split('T')[0];
      lines.push(post.content);
      if (post.url) {
        lines.push(`→ ${post.url}`);
      }
      lines.push(`— ${date}`, '');
    }

    return lines.join('\n');
  }
}
