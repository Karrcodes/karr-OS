self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.body || 'New message received',
            icon: '/app-icon.png',
            badge: '/app-icon.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/'
            },
            actions: data.actions || []
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Notification', options)
        );
    } catch (e) {
        console.error('Push event error:', e);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
