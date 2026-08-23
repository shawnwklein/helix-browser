/// <reference types="vite/client" />

type ContentBounds = { x: number; y: number; width: number; height: number };

type HelixDesktop = {
  isDesktop: true;
  navigate: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stop: () => void;
  setContentBounds: (rect: ContentBounds | null) => void;
  showPage: (tabId: string, url: string) => void;
  hidePage: () => void;
  closePage: (tabId: string) => void;
  extractText: () => Promise<string>;
  onPageEvent: (
    cb: (ev: {
      type: string;
      tabId?: string;
      url?: string;
      title?: string;
      canGoBack?: boolean;
      canGoForward?: boolean;
    }) => void,
  ) => () => void;
};

interface Window {
  helix?: HelixDesktop;
}
