export interface SiteAdapter {
  readonly name: import('../../types/index.js').Platform;
  isMatch(url: URL): boolean;
  start(cb?: (chunk: import('../../types/index.js').ExtractedContent) => void): void;
  stop(): void;
}
