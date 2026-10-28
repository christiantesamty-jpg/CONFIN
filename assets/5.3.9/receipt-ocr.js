/* Receipt totals are extracted on the device. No image is uploaded. */
(function(root){
  'use strict';
  const CDN='https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
  let libraryLoad=null;
  function parseMoney(value){
    let text=String(value).replace(/[^\d.,]/g,'');
    if(!text)return null;
    const dot=text.lastIndexOf('.'),comma=text.lastIndexOf(',');
    if(dot>=0&&comma>=0){const decimal=Math.max(dot,comma);text=text.slice(0,decimal).replace(/[.,]/g,'')+'.'+text.slice(decimal+1)}
    else if(comma>=0){const tail=text.length-comma-1;text=tail===2?text.replace(/,/g,'.'):text.replace(/,/g,'')}
    else if(dot>=0){const tail=text.length-dot-1;if(tail===3)text=text.replace(/\./g,'')}
    const number=Number(text);
    return Number.isFinite(number)&&number>0&&number<=900000000000?Math.round(number*100)/100:null;
  }
  function extractTotals(text){
    const lines=String(text||'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
    const matches=[];
    const amountPattern=/(?:\$\s*)?(?:\d{1,3}(?:[, ]\d{3})+(?:[.,]\d{2})?|\d{1,7}(?:[.,]\d{2}))/g;
    const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    for(let i=0;i<lines.length;i++){
      const line=normalize(lines[i]);
      if(/\b(SUB\s*TOTAL|SUBTOTAL|IVA|IMPUESTO|DESCUENTO|CAMBIO|VUELTO|EFECTIVO|RECIBIDO|PROPINA|SALDO ANTERIOR|PAGO CON|CANTIDAD|ARTICULOS|PRODUCTOS|PIEZAS|UNIDADES)\b/.test(line))continue;
      let score=0;
      if(/(?:TOTAL|IMPORTE|NETO)\s*(?:A\s*PAGAR|PAGADO|FINAL|DE\s*COMPRA)/.test(line))score=160;
      else if(/\bGRAN\s+TOTAL\b/.test(line))score=150;
      else if(/\bTOTAL\b/.test(line))score=115;
      else if(/\bA\s*PAGAR\b/.test(line))score=105;
      else if(/\bIMPORTE\b/.test(line))score=78;
      else continue;
      let amounts=[...line.matchAll(amountPattern)].map(m=>parseMoney(m[0])).filter(n=>n!==null);
      if(!amounts.length&&i+1<lines.length){amounts=[...lines[i+1].matchAll(amountPattern)].map(m=>parseMoney(m[0])).filter(n=>n!==null);score-=15}
      if(!amounts.length)continue;
      const last=amounts[amounts.length-1];
      matches.push({amount:last,score:score+i*0.001,line:lines[i],index:i});
    }
    matches.sort((a,b)=>b.score-a.score);
    if(!matches.length)return {amount:null,reason:'No se detect\u00f3 una l\u00ednea TOTAL confiable.'};
    if(matches.length>1&&Math.floor(matches[0].score)===Math.floor(matches[1].score)&&matches[0].amount!==matches[1].amount)return {amount:null,reason:'Se encontraron varios totales diferentes. Revisa el recibo.'};
    return {amount:matches[0].amount,label:matches[0].line,confidence:Math.floor(matches[0].score)>=110?'alta':'revisar'};
  }
  function loadLibrary(){
    if(root.Tesseract?.createWorker)return Promise.resolve(root.Tesseract);
    if(libraryLoad)return libraryLoad;
    libraryLoad=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=CDN;script.async=true;script.referrerPolicy='no-referrer';
      const timer=setTimeout(()=>reject(new Error('El reconocimiento no respondi\u00f3. Ingresa el monto manualmente.')),20000);
      script.onload=()=>{clearTimeout(timer);root.Tesseract?.createWorker?resolve(root.Tesseract):reject(new Error('No se pudo cargar el reconocimiento.'))};
      script.onerror=()=>{clearTimeout(timer);reject(new Error('Sin conexi\u00f3n al motor OCR; puedes escribir el importe.'))};
      document.head.appendChild(script);
    }).catch(err=>{libraryLoad=null;throw err});
    return libraryLoad;
  }
  async function recognize(file,onStatus=()=>{}){
    if(!file||!file.type.startsWith('image/'))throw new Error('Elige una imagen de recibo.');
    if(file.size>12*1024*1024)throw new Error('Foto demasiado grande (m\u00e1ximo 12 MB).');
    onStatus('Analizando localmente. La primera vez puede descargar el motor gratuito.');
    // Native OCR, where available, requires no external library.
    if(typeof root.TextDetector==='function'&&typeof createImageBitmap==='function'){
      try{
        const bitmap=await createImageBitmap(file);
        const blocks=await new root.TextDetector().detect(bitmap);
        bitmap.close?.();
        const text=blocks.map(x=>x.rawValue).join('\n');
        if(text.trim())return {...extractTotals(text),text,engine:'native'};
      }catch(e){console.warn('Native OCR unavailable',e)}
    }
    if(!navigator.onLine)throw new Error('La primera descarga del OCR necesita Internet. Escribe el monto manualmente.');
    const tess=await loadLibrary();let worker;
    try{
      onStatus('Leyendo el recibo en tu dispositivo...');
      worker=await tess.createWorker('spa',1,{logger:m=>{if(m.status==='recognizing text')onStatus(`Leyendo imagen: ${Math.round((m.progress||0)*100)} %`)}});
      const data=await worker.recognize(file);
      const text=data?.data?.text||'';
      return {...extractTotals(text),text,engine:'tesseract'};
    }finally{await worker?.terminate?.().catch(()=>{})}
  }
  const api=Object.freeze({extractTotals,parseMoney,recognize});
  root.ConFinReceipt=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
