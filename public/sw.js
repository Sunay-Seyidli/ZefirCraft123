// Service Worker for ZefirCraft Push & Native Mobile PWA Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
  const playerAvatarUrl = sender ? `https://mc-heads.net/avatar/${encodeURIComponent(sender)}/128` : '/logo.png';
  const options = {
    body: data.body || data.message || 'Yeni bir bildiriminiz var.',
    icon: data.icon || playerAvatarUrl,
    badge: '/badge.svg',
    tag: data.tag || `zefir_${sender || 'notif'}_${Date.now()}`,
    vibrate: [200, 100, 200],
    renotify: true,
    data: {
      url: data.url || '/#friends',
      sender: sender,
    },
    ...data.options,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle messages sent from the main application thread to show native mobile notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'ZefirCraft', {
        icon: '/logo.png',
        badge: '/badge.svg',
        vibrate: [200, 100, 200],
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
  const targetUrl = clickData.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and post a message to open the chat
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (clickData.sender) {
            client.postMessage({
              type: 'OPEN_CHAT',
              sender: clickData.sender,
            });
          }
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
