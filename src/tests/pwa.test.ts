import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { registerServiceWorker } from '../pwa';

const ROOT_DIR = path.resolve(__dirname, '../..');

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
      // Verify PNG signature
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

    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
    expect(indexHtml).toContain('rel="manifest"');
    expect(indexHtml).toContain('name="theme-color"');
    expect(indexHtml).toContain('rel="apple-touch-icon"');
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
