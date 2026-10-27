"use strict";
const CACHE="confin-static-5.3.4";
const ASSETS=[
  "./", "./index.html", "./styles.css?v=5.3.4", "./app.js?v=5.3.4",
  "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png?v=5.3.4"
];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(ASSETS);
    // Mantener la versión anterior activa hasta que el usuario decida actualizar.
  })());
});

self.addEventListener("message",event=>{
  if(event.data?.type==="SKIP_WAITING")self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE&&(key.startsWith("confin-")||key.startsWith("confin-static-"))).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.endsWith("/version.json")){
    // Nunca anunciar una versión almacenada en caché.
    event.respondWith(fetch(request,{cache:"no-store"}));
    return;
  }
  if(request.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request);
        if(response.ok){const cache=await caches.open(CACHE);await cache.put("./index.html",response.clone())}
        return response;
      }catch{
        return await caches.match("./index.html")||new Response("ConFin no está disponible sin conexión. Intenta de nuevo.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
      }
    })());
    return;
  }
  // Los archivos JS y CSS nunca reciben index.html como fallback (evita pantallas negras).
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok&&["script","style","image","manifest"].includes(request.destination)){
        const cache=await caches.open(CACHE);await cache.put(request,response.clone());
      }
      return response;
    }catch{return Response.error()}
  })());
});
