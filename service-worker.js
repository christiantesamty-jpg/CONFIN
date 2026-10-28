"use strict";
/**
 * ConFin 5.3.9 - Safari-safe incremental update.
 * Important: Cloudflare Pages may redirect /index.html to /.
 * Safari rejects navigation Response objects with redirected=true when
 * delivered by a Service Worker, even if the final status is 200.
 * Never cache a redirected response and never send one to respondWith().
 * This file only changes application caches. It never touches localStorage.
 */
const VERSION='5.3.9';
const CACHE=`confin-static-${VERSION}`;
const ROOT=new URL('./',self.registration.scope).href;
const ASSETS=[
  './manifest.webmanifest',
  './assets/5.3.9/boot.js',
  './assets/5.3.9/core.js',
  './assets/5.3.9/app.js',
  './assets/5.3.9/styles.css',
  './assets/5.3.9/receipt-ocr.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
const scoped=path=>new URL(path,self.registration.scope).href;

/**
 * Copy the final response into a new Response without WebKit's redirected
 * metadata. Reusing the original response (or clone()) preserves it.
 */
async function clean(response){
  if(!response || !response.ok || response.type==='opaqueredirect'){
    throw new Error('Respuesta de red incorrecta');
  }
  if(response.url && new URL(response.url).origin !== new URL(ROOT).origin){
    throw new Error('Redirección fuera del dominio de ConFin');
  }
  const headers=new Headers(response.headers);
  headers.delete('location');
  // Fetch bodies are decoded by the browser; preserve no encoding/length
  // metadata from the original HTTP transfer on the reconstructed response.
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.delete('transfer-encoding');
  headers.delete('content-range');
  const body=await response.arrayBuffer();
  return new Response(body,{
    status:response.status,
    statusText:response.statusText,
    headers
  });
}

function checkType(url,response){
  const type=(response.headers.get('content-type')||'').toLowerCase();
  if(url===ROOT && !type.includes('text/html'))throw new Error('La página principal no es HTML');
  if(/\.js$/.test(url)&& !/javascript|ecmascript/.test(type))throw new Error('Script incorrecto: '+url);
  if(/\.css$/.test(url)&&!type.includes('text/css'))throw new Error('Estilo incorrecto: '+url);
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    try{
      // Fetch the canonical root URL, never /index.html (which Pages redirects).
      // Validate every asset BEFORE activating this generation.
      for(const url of [ROOT,...ASSETS.map(scoped)]){
        const incoming=await fetch(url,{cache:'reload',redirect:'follow'});
        checkType(url,incoming);
        const safe=await clean(incoming);
        await cache.put(url,safe);
      }
    }catch(e){
      await caches.delete(CACHE);
      throw e;
    }
    // Emergency recovery: activate even when an old broken worker controls a tab.
    // Do not reload existing clients or touch any user data.
    await self.skipWaiting();
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    // Remove ONLY ConFin's historical static caches, including redirect-tainted
    // /index.html entries. The browser's localStorage/IndexedDB is untouched.
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('confin-static-')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url),scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin || !url.pathname.startsWith(scope.pathname))return;
  if(url.pathname===new URL('version.json',scope).pathname){
    event.respondWith((async()=>clean(await fetch(req,{cache:'no-store'})))());
    return;
  }
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      let response=await cache.match(ROOT);
      if(response){
        // Always rebuild: handles any unexpected cache metadata too.
        return clean(response);
      }
      // Online recovery if cache storage was cleared or installation raced.
      try{
        response=await fetch(ROOT,{cache:'no-store',redirect:'follow'});
        checkType(ROOT,response);
        const safe=await clean(response);
        await cache.put(ROOT,safe.clone());
        return safe;
      }catch(e){
        return new Response('<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#080b12;color:white;padding:2rem"><h1>ConFin no pudo cargar</h1><p>Revisa tu conexión y vuelve a abrir la app. No borres tus datos de Safari.</p></body></html>',{
          status:503,headers:{'content-type':'text/html; charset=utf-8'}
        });
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const saved=await cache.match(req);
    if(saved)return clean(saved);
    const network=await fetch(req);
    // Safari also rejects redirected non-navigation worker responses.
    if(network.redirected)return clean(network);
    return network;
  })());
});
