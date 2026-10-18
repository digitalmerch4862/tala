export async function registerServiceWorker(
  isProd: boolean = import.meta.env.PROD,
  nav: Pick<Navigator, 'serviceWorker'> | undefined = typeof navigator !== 'undefined' ? navigator : undefined
): Promise<ServiceWorkerRegistration | undefined> {
  if (!isProd) {
    return undefined;
  }
  if (!nav || !('serviceWorker' in nav) || !nav.serviceWorker) {
    return undefined;
  }
  try {
    return await nav.serviceWorker.register('/sw.js');
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return undefined;
  }
}
