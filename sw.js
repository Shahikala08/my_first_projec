self.addEventListener("install", (e) => {
  console.log("Service Worker installed");
});

self.addEventListener("activate", (e) => {
  console.log("Service Worker activated");
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
