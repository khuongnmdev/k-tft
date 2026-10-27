// Registers the service worker and reloads the page once a newly deployed build has taken over,
// so open tabs and the installed app never keep running an old bundle.
const CHECK_EVERY_MS = 5 * 60 * 1000;

if ('serviceWorker' in navigator) {
  // On the very first visit the worker takes control of a page that is already current: that first
  // change is skipped, every later one is a new build.
  let hasController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hasController) {
      hasController = true;
      return;
    }
    if (reloading) return;
    reloading = true;
    location.reload();
  });

  navigator.serviceWorker
    .register('sw.js')
    .then((reg) => {
      // Browsers only re-check sw.js on navigation, so a tab left open would miss a deploy.
      const check = () => reg.update().catch(() => {});
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    })
    .catch((err) => console.warn('Service worker registration failed:', err));
}
