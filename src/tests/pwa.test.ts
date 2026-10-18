import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { registerServiceWorker } from '../pwa';

const ROOT_DIR = path.resolve(__dirname, '../..');

function createSwHarness() {
  const listeners: Record<string, (event: any) => void> = {};
  const cacheStore = new Map<string, any>();

  const mockCache = {
    addAll: vi.fn(async (urls: string[]) => {
      for (const u of urls) {
        cacheStore.set(u, { status: 200, url: u, body: `cached:${u}` });
      }
    }),
    put: vi.fn(async (req: { url?: string } | string, res: any) => {
      const key = typeof req === 'string' ? req : new URL(req.url!).pathname;
      cacheStore.set(key, res);
    }),
  };

  const mockCaches = {
    open: vi.fn(async () => mockCache),
    keys: vi.fn(async () => ['tala-pwa-v1', 'old-cache']),
    delete: vi.fn(async () => true),
    match: vi.fn(async (req: { url?: string } | string) => {
      const key = typeof req === 'string' ? req : new URL(req.url!).pathname;
      return cacheStore.get(key);
    }),
  };

  const fetchMock = vi.fn();

  const selfObj = {
    location: { origin: 'https://tala.example.com' },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
    addEventListener: vi.fn((type: string, handler: (event: any) => void) => {
      listeners[type] = handler;
    }),
  };

  const swCode = fs.readFileSync(path.join(ROOT_DIR, 'public', 'sw.js'), 'utf-8');
  const context = vm.createContext({
    self: selfObj,
    caches: mockCaches,
    fetch: fetchMock,
    URL,
    Response: {
      error: () => ({ status: 0, type: 'error' }),
    },
    Promise,
  });

  vm.runInContext(swCode, context);

  return { listeners, mockCache, mockCaches, cacheStore, fetchMock, selfObj };
}

describe('PWA Manifest & Assets', () => {
  it('validates public/manifest.webmanifest structure and fields', () => {
    const manifestPath = path.join(ROOT_DIR, 'public', 'manifest.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);

    expect(manifest.name).toBe('Tala AI');
    expect(manifest.short_name).toBe('Tala');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#020617');
    expect(manifest.background_color).toBe('#020617');
    expect(Array.isArray(manifest.icons)).toBe(true);

    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');

    const maskable = manifest.icons.find(
      (i: { purpose?: string }) => i.purpose && i.purpose.includes('maskable')
    );
    expect(maskable).toBeDefined();

    for (const icon of manifest.icons) {
      const iconFile = path.join(ROOT_DIR, 'public', icon.src.replace(/^\//, ''));
      expect(fs.existsSync(iconFile)).toBe(true);
      const buf = fs.readFileSync(iconFile);
      expect(buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
    }
  });

  it('includes service worker and PWA meta tags in index.html', () => {
    const swPath = path.join(ROOT_DIR, 'public', 'sw.js');
    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain('skipWaiting');
    expect(swContent).toContain('clients.claim');
    expect(swContent).toContain('/index.html');
    expect(swContent).toContain('/manifest.webmanifest');
    expect(swContent).toContain('/icons/icon-192.png');
    expect(swContent).toContain("url.pathname.startsWith('/api/')");
    expect(swContent).toContain("event.request.mode === 'navigate'");

    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
    expect(indexHtml).toContain('rel="manifest"');
    expect(indexHtml).toContain('name="theme-color"');
    expect(indexHtml).toContain('rel="apple-touch-icon"');
  });
});

describe('Service Worker Fetch Behavior', () => {
  it('ignores /api/* and cross-origin requests completely', () => {
    const { listeners, fetchMock } = createSwHarness();

    const apiRespondWith = vi.fn();
    listeners.fetch({
      request: {
        method: 'GET',
        url: 'https://tala.example.com/api/transcribe',
        mode: 'cors',
      },
      respondWith: apiRespondWith,
    });
    expect(apiRespondWith).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    const crossOriginRespondWith = vi.fn();
    listeners.fetch({
      request: {
        method: 'GET',
        url: 'https://external.example.org/data.json',
        mode: 'cors',
      },
      respondWith: crossOriginRespondWith,
    });
    expect(crossOriginRespondWith).not.toHaveBeenCalled();
  });

  it('falls back to /index.html only for navigate requests when offline, and fails naturally for uncached assets', async () => {
    const { listeners, fetchMock, cacheStore } = createSwHarness();

    let installPromise: Promise<any> | undefined;
    listeners.install({
      waitUntil: (p: Promise<any>) => {
        installPromise = p;
      },
    });
    await installPromise;
    expect(cacheStore.has('/index.html')).toBe(true);
    expect(cacheStore.has('/icons/icon-192.png')).toBe(true);

    // Offline network failure
    fetchMock.mockRejectedValue(new Error('Network offline'));

    // 1. Navigate request -> falls back to cached /index.html
    let navResponsePromise: Promise<any> | undefined;
    listeners.fetch({
      request: {
        method: 'GET',
        url: 'https://tala.example.com/meetings/123',
        mode: 'navigate',
      },
      respondWith: (p: Promise<any>) => {
        navResponsePromise = p;
      },
    });
    const navRes = await navResponsePromise;
    expect(navRes).toEqual(cacheStore.get('/index.html'));

    // 2. Non-navigate uncached asset -> does NOT return /index.html, fails with error response
    let assetResponsePromise: Promise<any> | undefined;
    listeners.fetch({
      request: {
        method: 'GET',
        url: 'https://tala.example.com/assets/missing-chunk.js',
        mode: 'no-cors',
      },
      respondWith: (p: Promise<any>) => {
        assetResponsePromise = p;
      },
    });
    const assetRes = await assetResponsePromise;
    expect(assetRes).not.toEqual(cacheStore.get('/index.html'));
    expect(assetRes.type).toBe('error');
  });

  it('caches /assets/* on first successful fetch and serves from cache when offline on second visit', async () => {
    const { listeners, fetchMock } = createSwHarness();
    const fakeAssetResponse = {
      status: 200,
      type: 'basic',
      body: 'console.log("app")',
      clone() {
        return { ...this };
      },
    };
    fetchMock.mockResolvedValueOnce(fakeAssetResponse);

    let firstVisitPromise: Promise<any> | undefined;
    listeners.fetch({
      request: {
        method: 'GET',
        url: 'https://tala.example.com/assets/index-abc123.js',
        mode: 'cors',
      },
      respondWith: (p: Promise<any>) => {
        firstVisitPromise = p;
      },
    });
    const firstRes = await firstVisitPromise;
    expect(firstRes.body).toBe('console.log("app")');

    // Second visit offline
    fetchMock.mockRejectedValueOnce(new Error('Offline'));
    let secondVisitPromise: Promise<any> | undefined;
    listeners.fetch({
      request: {
        method: 'GET',
        url: 'https://tala.example.com/assets/index-abc123.js',
        mode: 'cors',
      },
      respondWith: (p: Promise<any>) => {
        secondVisitPromise = p;
      },
    });
    const secondRes = await secondVisitPromise;
    expect(secondRes.body).toBe('console.log("app")');
  });
});

describe('Service Worker Registration Guard', () => {
  it('does not register service worker when isProd is false', async () => {
    const registerMock = vi.fn().mockResolvedValue({ scope: '/' });
    const mockNav = {
      serviceWorker: { register: registerMock } as unknown as ServiceWorkerContainer,
    };

    const result = await registerServiceWorker(false, mockNav);
    expect(result).toBeUndefined();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('registers /sw.js when isProd is true and serviceWorker is supported', async () => {
    const fakeReg = { scope: '/' } as ServiceWorkerRegistration;
    const registerMock = vi.fn().mockResolvedValue(fakeReg);
    const mockNav = {
      serviceWorker: { register: registerMock } as unknown as ServiceWorkerContainer,
    };

    const result = await registerServiceWorker(true, mockNav);
    expect(registerMock).toHaveBeenCalledWith('/sw.js');
    expect(result).toBe(fakeReg);
  });

  it('guards main.tsx with import.meta.env.PROD', () => {
    const mainTsx = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.tsx'), 'utf-8');
    expect(mainTsx).toContain('import.meta.env.PROD');
    expect(mainTsx).toContain('registerServiceWorker');
  });
});
