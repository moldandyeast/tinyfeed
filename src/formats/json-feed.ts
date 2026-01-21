// JSON Feed 1.1 generator
// https://www.jsonfeed.org/version/1.1/

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

interface JsonFeedItem {
  id: string;
  content_text: string;
  url?: string;
  external_url?: string;
  date_published: string;
}

interface JsonFeed {
  version: string;
  title: string;
  home_page_url: string;
  feed_url: string;
  description?: string;
  items: JsonFeedItem[];
}

export function generateJsonFeed(feed: FeedData, baseUrl: string): string {
  const feedUrl = `${baseUrl}/f/${feed.id}`;
  const feedName = feed.name || feed.id;

  const items: JsonFeedItem[] = feed.posts.map((post) => {
    const item: JsonFeedItem = {
      id: post.id,
      content_text: post.content,
      url: `${feedUrl}#${post.id}`,
      date_published: new Date(post.timestamp).toISOString(),
    };

    if (post.url) {
      item.external_url = post.url;
    }

    return item;
  });

  const jsonFeed: JsonFeed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: feedName,
    home_page_url: feedUrl,
    feed_url: `${feedUrl}.json`,
    items,
  };

  if (feed.about) {
    jsonFeed.description = feed.about;
  }

  return JSON.stringify(jsonFeed, null, 2);
}
