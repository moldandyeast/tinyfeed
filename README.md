# tinyfeed

**A feed is a URL.**

No accounts. No algorithms. No engagement metrics.  
Just you, your thoughts, and a URL.

---

## What is this?

tinyfeed is a minimal microblogging platform where your identity is a URL.

- **Create a feed** → Get a public URL to share and a private URL to post
- **Write something** → 500 characters, optionally with a link
- **Subscribe** → Standard RSS and JSON Feed formats work with any reader
- **Follow people** → Contacts are stored in your browser, not on our servers

The server never knows who follows whom. Your write key never leaves your browser.

## Demo

```
Public URL:   https://tinyfeed.example/f/x7k9m2        ← share this
Private URL:  https://tinyfeed.example/f/x7k9m2#s=key  ← keep this secret
```

The part after `#` (the hash fragment) is your write key. It's never sent to the server—your browser uses it to authenticate API requests locally.

---

## Self-hosting

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Cloudflare](https://cloudflare.com) account (free tier works)

### Development

```bash
git clone https://github.com/moldandyeast/tinyfeed.git
cd tinyfeed
npm install
npm run dev
```

Open [http://localhost:8787](http://localhost:8787)

### Deploy to Cloudflare

```bash
npx wrangler login    # authenticate with Cloudflare
npm run deploy        # deploy to production
```

Your tinyfeed instance will be live at `https://tinyfeed.<your-subdomain>.workers.dev`

To use a custom domain, configure it in the Cloudflare dashboard.

---

## How it works

### 1. Create

Click "create your feed" on the landing page. You'll receive:

| URL | Purpose |
|-----|---------|
| `https://domain/f/abc123` | **Public** — share this with anyone |
| `https://domain/f/abc123#s=secretkey` | **Private** — bookmark this, never share it |

⚠️ **Save your private URL.** It's the only way to post to your feed. There's no password reset.

### 2. Post

Open your private URL. Write something in the composer. Press `⌘↵` (or click "post").

- **500 characters max** per post
- **Optional link** — add a URL to reference something
- **1 post per minute** — rate limited to prevent spam

### 3. Share

Give out your public URL. Anyone can:
- Read your feed in a browser
- Subscribe via RSS: `https://domain/f/abc123.rss`
- Subscribe via JSON Feed: `https://domain/f/abc123.json`

### 4. Follow

Visit any feed and click **"+ contact"**. They're saved to your browser's localStorage.

Go to `/home` to see a merged timeline of all your contacts' posts.

### 5. Export

From your feed (with private URL), click **export** to download your posts as JSON or Markdown. Your data is yours.

---

## Pages

| Path | Description |
|------|-------------|
| `/` | Landing page — create a new feed |
| `/home` | Aggregated timeline from your contacts |
| `/contacts` | Manage your contact list |
| `/f/:id` | View a feed |
| `/f/:id#s=key` | View + write to your feed |
| `/f/:id.rss` | RSS 2.0 feed |
| `/f/:id.json` | JSON Feed 1.1 |
| `/import` | Restore access with your private URL |

---

## API

All write operations require the `X-Write-Key` header.

### Create feed
```http
POST /api/feed

Response: { "id": "abc123", "writeKey": "secretkey123" }
```

### Get feed
```http
GET /api/feed/:id

Response: { "id", "name", "about", "createdAt", "posts": [...] }
```

### Update profile
```http
PATCH /api/feed/:id
X-Write-Key: secretkey123
Content-Type: application/json

{ "name": "kai", "about": "building things" }
```

### Create post
```http
POST /api/feed/:id/post
X-Write-Key: secretkey123
Content-Type: application/json

{ "content": "hello world", "url": "https://example.com" }

Response: { "id": "p1", "content", "url", "timestamp" }

Rate limit: 1 request/minute → 429 Too Many Requests
```

### Delete post
```http
DELETE /api/feed/:id/post/:postId
X-Write-Key: secretkey123
```

### Export feed
```http
GET /api/feed/:id/export?format=json
GET /api/feed/:id/export?format=md
X-Write-Key: secretkey123

Response: File download
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare Edge                         │
├─────────────────────────────────────────────────────────────┤
│  Worker                                                     │
│  ├── Router (src/index.ts)                                  │
│  ├── API handlers (src/api/handlers.ts)                     │
│  ├── HTML pages (src/pages/*.ts)                            │
│  └── Feed formats (src/formats/*.ts)                        │
├─────────────────────────────────────────────────────────────┤
│  Durable Objects                                            │
│  └── Feed (src/feed.ts) — one instance per feed             │
│      └── Stores: id, name, about, posts[], writeKeyHash     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Browser (localStorage)                  │
├─────────────────────────────────────────────────────────────┤
│  myFeed: { id, writeKey }     ← your feed credentials       │
│  contacts: [{ id, name, url }] ← people you follow          │
└─────────────────────────────────────────────────────────────┘
```

### Why this architecture?

- **Durable Objects** provide strongly consistent storage at the edge with zero cold starts for warm objects
- **URL-based auth** means no session management, no cookies, no JWTs
- **Client-side contacts** means the server has no social graph to leak or monetize
- **Hash fragment keys** (`#s=key`) are never sent to the server by browsers, keeping writes secure

---

## Constraints

| Limit | Value |
|-------|-------|
| Post content | 500 characters |
| Profile name | 30 characters |
| Profile about | 160 characters |
| Post rate | 1 per minute |
| Feed ID | 8 random characters |
| Write key | 12 random characters |
| Posts per feed | 1,000 max (oldest trimmed) |

---

## Privacy

- ✓ No cookies
- ✓ No tracking pixels
- ✓ No analytics
- ✓ No ads
- ✓ Server doesn't know who follows whom
- ✓ Write key never transmitted (stays in URL hash)
- ✓ All data exportable

**Note:** All feeds are public. Don't post anything you wouldn't want the world to see.

---

## What's intentionally not included

| Feature | Why not |
|---------|---------|
| Accounts | Your URL is your account |
| Likes | No engagement metrics |
| Follower counts | No popularity contests |
| Replies | Keep it simple; use links |
| Reposts | Share URLs the old way |
| Notifications | Check your home feed |
| Search | Not a discovery platform |
| Algorithms | Chronological only |
| Edit posts | Delete and repost |
| Media uploads | Link to images hosted elsewhere |
| Verification | No authority here |
| Blocking | Unfollow; contacts are local |

---

## Project structure

```
tinyfeed/
├── src/
│   ├── index.ts              # Worker entry, router
│   ├── feed.ts               # Durable Object class
│   ├── api/
│   │   └── handlers.ts       # API endpoint logic
│   ├── pages/
│   │   ├── landing.ts        # Home page
│   │   ├── feed.ts           # Feed view (read/write)
│   │   ├── home.ts           # Aggregated timeline
│   │   ├── contacts.ts       # Contact management
│   │   ├── import.ts         # Restore access
│   │   └── not-found.ts      # 404 page
│   ├── formats/
│   │   ├── rss.ts            # RSS 2.0 generator
│   │   └── json-feed.ts      # JSON Feed 1.1 generator
│   └── utils/
│       ├── crypto.ts         # ID generation, hashing
│       └── html.ts           # Base template, styles
├── wrangler.toml             # Cloudflare config
├── tsconfig.json
└── package.json
```

---

## Contributing

Issues and PRs welcome. Keep it minimal.

---

## License

MIT

---

<p align="center">
  <i>A feed is a URL. That's it.</i>
</p>
