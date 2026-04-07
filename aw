dso after I deploy the vercel I got this error
is this the reason why I have a bugf I can't log in or that my flash card is not showing 
because of tghis
[SW] Installing service worker...
sw.js:20 [SW] Caching static assets
sw.js:30 [SW] Activating service worker...
sw.js:49 Uncaught TypeError: self.clients.claimClients is not a function
    at sw.js:49:16
(anonymous) @ sw.js:49
sw.js:33 [SW] Found caches: (2) ['prepwise-assets-v2', 'prepwise-offline-v2']
sw.js:36 [SW] Deleting cache: prepwise-assets-v2
sw.js:36 [SW] Deleting cache: prepwise-offline-v2
sw.js:41 [SW] All caches cleared

when it should be like this

