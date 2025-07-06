import { SiteAdapter } from './site-adapter.js';
import { ChatGPTExtractor } from './chatgpt-extractor.js';
import { TwitterExtractor } from './twitter-extractor.js';

export const adapters: SiteAdapter[] = [
  new ChatGPTExtractor(),
  new TwitterExtractor(),
];

export function findAdapter(url: URL): SiteAdapter | null {
  for (const adapter of adapters) {
    if (adapter.isMatch(url)) {
      return adapter;
    }
  }
  return null;
}
