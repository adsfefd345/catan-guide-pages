(() => {
  'use strict';
  // UI prototype only. Never use this local flag to grant access to private data.
  // Replace this adapter with a verified account provider when real authentication is added.
  const storageKey = 'catan-demo-login';
  let loggedIn = false;
  try { loggedIn = localStorage.getItem(storageKey) === 'true'; } catch {}
  const listeners = new Set();
  const getState = () => ({ loggedIn, mode: 'demo' });
  function update(next) {
    loggedIn = next;
    try { localStorage.setItem(storageKey, String(loggedIn)); } catch {}
    listeners.forEach(listener => listener(getState()));
    return getState();
  }
  window.CatanAuth = Object.freeze({
    getState,
    login: () => update(true),
    logout: () => update(false),
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    loggedIn = event.key === storageKey && event.newValue === 'true';
    listeners.forEach(listener => listener(getState()));
  });
})();
