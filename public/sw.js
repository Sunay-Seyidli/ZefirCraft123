// Service Worker for ZefirCraft Push & Native Mobile PWA Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches if any
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    ])
  );
});

// Real-time Background Web Push Event (Triggered when the site/app is completely closed or device is locked)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'ZefirCraft', body: event.data.text() };
    }
  }

  const title = data.title || 'ZefirCraft';
  const sender = data.sender || '';
  const playerAvatarUrl = sender
    ? `https://mc-heads.net/avatar/${encodeURIComponent(sender)}/128`
    : '/logo.png';

  const notificationOptions = {
    body: data.body || data.message || 'Yeni bir bildiriminiz var.',
    icon: data.icon || playerAvatarUrl,
    badge: '/badge.svg',
    tag: data.tag || `zefir_${sender || 'notif'}_${Date.now()}`,
    vibrate: [250, 100, 250, 100, 250],
    renotify: true,
    timestamp: Date.now(),
    data: {
      url: data.url || '/#friends',
      sender: sender,
      timestamp: Date.now()
    },
    ...data.options,
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// Handle messages sent from the main application thread to show native notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'ZefirCraft', {
        icon: '/logo.png',
        badge: '/badge.svg',
        vibrate: [250, 100, 250],
        renotify: true,
        ...options,
      })
    );
  }
});

// Handle Native Notification Click on Android, iOS PWA & Desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickData = event.notification.data || {};
  const targetUrl = clickData.url || '/#friends';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and post a message to open the chat or navigate
      for (const client of clientList) {
        if ('focus' in client) {
          if (clickData.sender) {
            client.postMessage({
              type: 'OPEN_CHAT',
              sender: clickData.sender,
            });
          }
          client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      // If no window is open, launch a new window with the target URL
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle Push Subscription Renewal / Expiry in Background
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    fetch('/api/push/vapid-public-key')
      .then((res) => res.json())
      .then((data) => {
        if (!data.publicKey) return;
        const padding = '='.repeat((4 - (data.publicKey.length % 4)) % 4);
        const base64 = (data.publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        return self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        });
      })
      .then((newSubscription) => {
        if (newSubscription) {
          return fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: newSubscription })
          });
        }
      })
      .catch((err) => console.warn('[SW PushSubscriptionChange Error]', err))
  );
});

