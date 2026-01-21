# tinyfeed

A feed is a URL. Contacts live in your browser. Subscribe with any reader.

## What it is

You get a URL. You post to it. Anyone can read it. Anyone can subscribe.

No accounts. No algorithms. No engagement metrics.

## Quick start

```bash
npm install
npm run dev
```

Then visit `http://localhost:8787`

## Deploy

```bash
npm run deploy
```

## How it works

### Create

Visit the site. Click create. You get two URLs:

```
Public:  [domain]/f/x7k9m2        ← share this
Private: [domain]/f/x7k9m2#s=key  ← keep this
```

The private URL is your key. Lose it, lose access.

### Post

Open your feed with the private URL. Type something. Hit enter.

Posts are short (500 chars max). Can include a link. Newest first.

### Subscribe

Any feed reader works:

```
[domain]/f/x7k9m2.rss   ← RSS
[domain]/f/x7k9m2.json  ← JSON Feed
```

### Follow

On any feed, click "+ contact". Saved to your browser.

Visit `/home` to see posts from all your contacts merged together.

## URLs

| Path | Description |
|------|-------------|
| `/` | Landing, create feed |
| `/home` | Posts from your contacts (client-side) |
| `/contacts` | Manage contacts (client-side) |
| `/f/:id` | A feed (HTML) |
| `/f/:id.rss` | A feed (RSS) |
| `/f/:id.json` | A feed (JSON Feed) |
| `/f/:id#s=key` | A feed (write mode) |
| `/import` | Restore access with private URL |

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/feed` | Create a new feed |
| `GET` | `/api/feed/:id` | Get feed data |
| `PATCH` | `/api/feed/:id` | Update profile (requires `X-Write-Key`) |
| `POST` | `/api/feed/:id/post` | Create a post (requires `X-Write-Key`) |
| `DELETE` | `/api/feed/:id/post/:postId` | Delete a post (requires `X-Write-Key`) |
| `GET` | `/api/feed/:id/export` | Export feed (requires `X-Write-Key`) |

## Privacy

- No cookies
- No tracking
- No analytics
- Server doesn't know who follows whom
- Write key never leaves the hash fragment
- All feeds are public

## Stack

- Cloudflare Workers
- Durable Objects (one per feed)
- No database
- No auth beyond URL keys

---

*A feed is a URL. That's it.*
