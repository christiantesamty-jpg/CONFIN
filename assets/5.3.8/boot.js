/* Only a startup failure screen. No reads/writes to personal data. */
(function(){
  const panel=document.getElementById('bootStatus');
  document.getElementById('bootReload')?.addEventListener('click',()=>location.reload());
  window.addEventListener('confin:ready',()=>{if(panel)panel.hidden=true});
  function failed(){
    if(window.__confinBooted)return;
    if(panel){panel.hidden=false;panel.querySelector('strong').textContent='No se pudo abrir ConFin';panel.querySelector('p').textContent='No borres Safari ni la app. Reintenta con conexi\u00f3n y verifica la publicaci\u00f3n completa. Tus datos no se han eliminado por esta pantalla.'}
  }
  window.addEventListener('error',failed,true);
  window.addEventListener('unhandledrejection',failed);
})();
