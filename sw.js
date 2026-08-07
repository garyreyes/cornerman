const CACHE_NAME = "cornerman-v13";
const APP_SHELL = [
  "./cornerman.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./css/styles.css",
  "./js/app.js",
  "./js/ui.js",
  "./js/timer.js",
  "./js/comboEngine.js",
  "./js/speech.js",
  "./js/audio.js",
  "./js/punchEditor.js",
  "./js/presetEditor.js",
  "./js/storage.js",
  "./js/state.js",
  "./js/utils.js"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(n){ return n !== CACHE_NAME; })
             .map(function(n){ return caches.delete(n); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

// Cache-first for same-origin app files; network-first (with cache fallback)
// for everything else, so a flaky/absent connection never breaks the app.
self.addEventListener("fetch", function(event){
  var req = event.request;
  var url = new URL(req.url);

  if(url.origin === self.location.origin){
    event.respondWith(
      caches.match(req).then(function(cached){
        return cached || fetch(req).then(function(res){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
          return res;
        });
      }).catch(function(){ return caches.match("./cornerman.html"); })
    );
    return;
  }

  // Cross-origin (e.g. Google Fonts): try network, fall back to cache, else ignore.
  event.respondWith(
    fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
      return res;
    }).catch(function(){ return caches.match(req); })
  );
});