"use strict";
const VERSION="5.3.8";
const RELEASE="Personalización y patrimonio RC1";
const CF=globalThis.ConFinCore;
const BUILD="2026.10.27.paletas-patrimonio-rc1";
const MIGRATION_KEY="confin-pre-5.3.8";
const BACKUP2_KEY="confin-v4-data-backup-2";
let storageSnapshot=null;
let latestVersionInfo=null;
const KEY="confin-v4-data";
const BACKUP_KEY="confin-v4-data-backup";
const RESTORE_KEY="confin-v4-data-before-import";
const LAST_EXPORT_KEY="confin-last-export";
const SECURITY_KEY="confin-security-v1";
const OLD_KEYS=["confin-data-v1","confin-data-v2","confin-data"];
const uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;
const DEFAULT_INCOME_CATEGORIES=[
  {id:"income-payroll",name:"Nómina",emoji:"💼",color:"#10ac84",system:true},
  {id:"income-commissions",name:"Comisiones",emoji:"🤝",color:"#1dd1a1",system:true},
  {id:"income-sales",name:"Ventas",emoji:"🏷️",color:"#54a0ff",system:true},
  {id:"income-fees",name:"Honorarios",emoji:"🧑‍💻",color:"#5f27cd",system:true},
  {id:"income-bonuses",name:"Bonos",emoji:"🎁",color:"#feca57",system:true},
  {id:"income-returns",name:"Rendimientos",emoji:"📈",color:"#00d2d3",system:true},
  {id:"income-refunds",name:"Reembolsos",emoji:"↩️",color:"#48dbfb",system:true},
  {id:"income-gifts",name:"Regalos",emoji:"🎉",color:"#f368e0",system:true},
  {id:"income-other",name:"Otros ingresos",emoji:"＋",color:"#8395a7",system:true}
];
const DEFAULT_EXPENSE_CATEGORIES=[
  {id:"expense-food",name:"Alimentación",emoji:"🍽️",color:"#ff9f43",system:true},
  {id:"expense-gas",name:"Gasolina",emoji:"⛽",color:"#feca57",system:true},
  {id:"expense-transport",name:"Transporte",emoji:"🚗",color:"#54a0ff",system:true},
  {id:"expense-home",name:"Vivienda",emoji:"🏠",color:"#5f27cd",system:true},
  {id:"expense-services",name:"Servicios",emoji:"💡",color:"#00d2d3",system:true},
  {id:"expense-health",name:"Salud",emoji:"❤️",color:"#ff6b6b",system:true},
  {id:"expense-beauty",name:"Barbería / Estética",emoji:"💇🏽",color:"#ee5253",system:true},
  {id:"expense-gympass",name:"GymPass",emoji:"💪",color:"#10ac84",system:true},
  {id:"expense-entertainment",name:"Entretenimiento",emoji:"🎬",color:"#48dbfb",system:true},
  {id:"expense-shopping",name:"Compras",emoji:"🛍️",color:"#f368e0",system:true},
  {id:"expense-debt",name:"Deudas",emoji:"🧾",color:"#c8d6e5",system:true},
  {id:"expense-other",name:"Otros gastos",emoji:"•••",color:"#8395a7",system:true}
];
const LEGACY_CATEGORY_META={"Educación":{emoji:"📚",color:"#576574"},"Ahorro":{emoji:"🐷",color:"#1dd1a1"}};
function categorySlug(name){return String(name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||uid()}
function expenseCategories(){return Array.isArray(state?.expenseCategories)?state.expenseCategories:DEFAULT_EXPENSE_CATEGORIES}
function incomeCategories(){return Array.isArray(state?.incomeCategories)?state.incomeCategories:DEFAULT_INCOME_CATEGORIES}
function categoryById(id){return expenseCategories().find(c=>c.id===id)}
function incomeCategoryById(id){return incomeCategories().find(c=>c.id===id)}
function categoryByName(name){return expenseCategories().find(c=>c.name===name)}
function incomeCategoryByName(name){return incomeCategories().find(c=>c.name===name)}
function categoryName(item){if(item?.type==="transfer")return "Transferencia";if(!item)return "Otros gastos";return (item.type==="income"?incomeCategoryById(item.categoryId):categoryById(item.categoryId))?.name||item.category||(item.type==="income"?"Otros ingresos":"Otros gastos")}
function categoryIcon(item){if(typeof item==="string")return categoryByName(item)?.emoji||incomeCategoryByName(item)?.emoji||LEGACY_CATEGORY_META[item]?.emoji||"•";return (item?.type==="income"?incomeCategoryById(item?.categoryId):categoryById(item?.categoryId))?.emoji||item?.categoryEmoji||LEGACY_CATEGORY_META[item?.category]?.emoji||"•"}
function expenseCategoryOptions(){return expenseCategories().filter(c=>!c.archived)}
function incomeCategoryOptions(){return incomeCategories().filter(c=>!c.archived)}
function ensureCategoryForName(list,name,emoji,color,system=false){let c=list.find(x=>x.name.toLocaleLowerCase("es-MX")===String(name).toLocaleLowerCase("es-MX"));if(c)return c; c={id:`custom-${categorySlug(name)}-${uid().slice(0,8)}`,name:String(name),emoji:emoji||"•",color:color||"#8395a7",system,createdAt:new Date().toISOString()};list.push(c);return c}
const baseData=()=>({schema:10,investments:[],receivables:[],assetEntries:[],expenseCategories:DEFAULT_EXPENSE_CATEGORIES.map(c=>({...c})),incomeCategories:DEFAULT_INCOME_CATEGORIES.map(c=>({...c})),userName:"Christian",theme:"midnight",privacy:false,currency:"MXN",notifications:false,reminderLeadDays:3,accounts:[{id:uid(),name:"Efectivo",type:"cash",balance:0},{id:uid(),name:"Banco",type:"bank",balance:0},{id:uid(),name:"Ahorros",type:"savings",balance:0}],transactions:[],budgets:[{id:uid(),categoryId:"expense-food",category:"Alimentación",limit:5000},{id:uid(),categoryId:"expense-transport",category:"Transporte",limit:2500},{id:uid(),categoryId:"expense-entertainment",category:"Entretenimiento",limit:2000}],goals:[]});
const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const isStandalone=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
function updateDisplayProfile(){
  const root=document.documentElement,vv=window.visualViewport;
  const focused=document.activeElement?.matches('input,textarea,select');
  const scale=vv?.scale||1,keyboard=Boolean(focused&&scale<1.05&&vv&&window.innerHeight-vv.height>100);
  root.classList.toggle('keyboard-open',keyboard);
  root.dataset.screen=innerWidth<=375?'compact':innerWidth<=430?'regular':'large';
  // CSS sets the app height. Only the modal tracks the visible keyboard viewport.
  if(keyboard){root.style.setProperty('--modal-top',`${vv.offsetTop}px`);root.style.setProperty('--modal-height',`${vv.height}px`)}
  else{root.style.removeProperty('--modal-top');root.style.removeProperty('--modal-height')}
}
window.addEventListener("pageshow",updateDisplayProfile);
window.addEventListener("resize",updateDisplayProfile,{passive:true});
window.addEventListener("orientationchange",()=>setTimeout(updateDisplayProfile,250));
window.visualViewport?.addEventListener("resize",updateDisplayProfile,{passive:true});
window.visualViewport?.addEventListener("scroll",updateDisplayProfile,{passive:true});
document.addEventListener("focusin",updateDisplayProfile);
document.addEventListener("focusout",()=>setTimeout(updateDisplayProfile,80));
let state=load();let route="home";let filter="all";
let committedState=clone(state);
let lastRenderedRoute=null;
let listLimit=40,transactionSearch="",transactionMonth="all",transactionAccount="all",transactionCategory="all";
let budgetMonth="";
const routeScroll=new Map();
let historyOpen=false,historyMonth="";
let modalReturnFocus=null,unrecoverableData=false;
const savedDataRecoveryNotice=window.__confinRecovered||"";
const $=s=>document.querySelector(s);const view=$("#view"),modalRoot=$("#modalRoot"),toast=$("#toast"),lockScreen=$("#lockScreen"),unlockButton=$("#unlockButton"),disableLockButton=$("#disableLockButton"),lockMessage=$("#lockMessage");

function palette(id,name,colors){return `<button class="palette ${state.theme===id?"active":""}" data-theme="${id}" type="button"><span class="palette-dots">${colors.map(c=>`<i style="background:${c}"></i>`).join("")}</span><strong>${name}</strong></button>`}
function hideToast(){clearTimeout(showToast.t);toast?.classList.remove("show");if(toast)toast.textContent=""}
function showToast(msg){if(!toast)return;hideToast();toast.textContent=msg;toast.classList.add("show");showToast.t=setTimeout(hideToast,2200)}
function openSheet(title,body){
  hideToast();
  if(!document.documentElement.classList.contains("sheet-open"))modalReturnFocus=document.activeElement;
  document.documentElement.classList.add("sheet-open");
  if(modalRoot){
    modalRoot.innerHTML=`<div class="modal-backdrop"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle" tabindex="-1"><div class="handle" aria-hidden="true"></div><div class="sheet-head"><h2 id="sheetTitle">${esc(title)}</h2><button class="close-btn" data-close type="button" aria-label="Cerrar ventana">×</button></div>${body}</section></div>`;
    modalRoot.querySelectorAll('.field').forEach((field,index)=>{
      const input=field.querySelector('input,select,textarea'),label=field.querySelector('label');
      if(input&&label){if(!input.id)input.id=`sheet-field-${index}`;label.htmlFor=input.id}
    });
    document.querySelector('#app').inert=true;
    requestAnimationFrame(()=>modalRoot.querySelector('.sheet')?.focus({preventScroll:true}));
  }
  updateDisplayProfile();
}
function closeSheet(){
  document.querySelector('#app').inert=document.body.classList.contains('app-locked');
  document.documentElement.classList.remove("sheet-open");
  if(modalRoot)modalRoot.innerHTML="";
  if(modalReturnFocus?.isConnected)modalReturnFocus.focus({preventScroll:true});
  modalReturnFocus=null;
  const raw=localStorage.getItem(KEY);
  if(raw!==storageSnapshot){const next=raw&&parseStored(raw);if(next){state=next;committedState=clone(next);storageSnapshot=raw;invalidateMetrics();applyTheme();render()}}
}
function loadSecurity(){
  try{return {enabled:false,credentialId:"",userId:"",recoverySalt:"",recoveryHash:"",...JSON.parse(localStorage.getItem(SECURITY_KEY)||"{}")}}
  catch{return {enabled:false,credentialId:"",userId:"",recoverySalt:"",recoveryHash:""}}
}
function saveSecurity(value){localStorage.setItem(SECURITY_KEY,JSON.stringify(value))}
function bytesToBase64Url(bytes){let binary="";new Uint8Array(bytes).forEach(b=>binary+=String.fromCharCode(b));return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}
function base64UrlToBytes(value){const base64=value.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((value.length+3)%4);return Uint8Array.from(atob(base64),c=>c.charCodeAt(0))}
function randomBytes(length=32){const bytes=new Uint8Array(length);crypto.getRandomValues(bytes);return bytes}
async function faceIdAvailable(){return Boolean(window.PublicKeyCredential&&navigator.credentials&&isSecureContext&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.())}
function unlockApp(){document.querySelector('#app').inert=false;document.body.classList.remove("security-pending","app-locked");lockScreen?.setAttribute("aria-hidden","true");if(lockMessage)lockMessage.textContent="Confirma tu identidad para ver tus finanzas."}
function lockApp(){if(!loadSecurity().enabled)return unlockApp();closeSheet();hideToast();document.body.classList.remove("security-pending");document.body.classList.add("app-locked");document.querySelector("#app").inert=true;lockScreen?.setAttribute("aria-hidden","false")}
function showLockError(message){if(lockMessage)lockMessage.textContent=message}
async function digestRecoveryPin(pin,salt){
  const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);
  const result=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:base64UrlToBytes(salt),iterations:120000},base,256);
  return bytesToBase64Url(result);
}
async function chooseRecoveryPin(){
  const pin=prompt("Crea un PIN de recuperación de 6 a 12 dígitos para ConFin. Guárdalo en un lugar seguro; no es el PIN del iPhone.");
  if(pin===null)return null;
  if(!/^\d{6,12}$/.test(pin)){showToast("El PIN debe tener entre 6 y 12 números");return null}
  const repeat=prompt("Repite el PIN de recuperación:");
  if(repeat!==pin){showToast("Los códigos no coinciden");return null}
  const recoverySalt=bytesToBase64Url(randomBytes(16));
  return {recoverySalt,recoveryHash:await digestRecoveryPin(pin,recoverySalt)};
}
async function verifyRecoveryPin(security){
  if(!security.recoveryHash||!security.recoverySalt)return false;
  const pin=prompt("Escribe el PIN de recuperación de ConFin:");
  if(pin===null)return false;
  const actual=await digestRecoveryPin(pin,security.recoverySalt);
  return actual===security.recoveryHash;
}
async function authenticateFaceId(){
  const security=loadSecurity();if(!security.enabled)return unlockApp();
  if(!security.credentialId){showLockError("No hay credencial biométrica registrada. Usa tu PIN de recuperación.");return}
  try{
    unlockButton.disabled=true;unlockButton.textContent="Verificando…";
    const result=await navigator.credentials.get({publicKey:{challenge:randomBytes(),allowCredentials:[{type:"public-key",id:base64UrlToBytes(security.credentialId),transports:["internal"]}],userVerification:"required",timeout:60000}});
    if(!result||bytesToBase64Url(result.rawId)!==security.credentialId)throw new Error("Credencial distinta");
    unlockApp();
  }catch(e){if(e?.name!=="NotAllowedError")console.warn(e);showLockError("No se pudo verificar. Intenta de nuevo o usa tu PIN.")}
  finally{unlockButton.disabled=false;unlockButton.textContent="Usar Face ID"}
}
async function enableFaceId(){
  if(!(await faceIdAvailable())){showToast("La autenticación biométrica no está disponible aquí");return}
  const recovery=await chooseRecoveryPin();if(!recovery)return;
  try{
    const userId=randomBytes(16);
    const credential=await navigator.credentials.create({publicKey:{challenge:randomBytes(),rp:{name:"ConFin"},user:{id:userId,name:"confin-local",displayName:state.userName||"Usuario ConFin"},pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],authenticatorSelection:{authenticatorAttachment:"platform",residentKey:"discouraged",userVerification:"required"},timeout:60000,attestation:"none"}});
    if(!credential)throw new Error("Sin credencial");
    saveSecurity({enabled:true,credentialId:bytesToBase64Url(credential.rawId),userId:bytesToBase64Url(userId),...recovery});
    render();showToast("Bloqueo biométrico activado");
  }catch(e){if(e?.name!=="NotAllowedError")console.warn(e);showToast("No se pudo activar el bloqueo")}
}
async function setRecoveryPin(){
  const recovery=await chooseRecoveryPin();if(!recovery)return;
  saveSecurity({...loadSecurity(),...recovery});render();showToast("PIN de recuperación configurado");
}
async function toggleFaceId(){
  const security=loadSecurity();if(!security.enabled)return enableFaceId();
  if(security.recoveryHash){
    if(!await verifyRecoveryPin(security)){showToast("PIN incorrecto o cancelado");return}
  }else if(!confirm("Esta protección se creó en una versión anterior SIN PIN. ¿Desactivarla desde esta sesión desbloqueada?"))return;
  saveSecurity({enabled:false,credentialId:"",userId:"",recoverySalt:"",recoveryHash:""});render();showToast("Bloqueo desactivado");
}
async function recoverUnlock(){
  const security=loadSecurity();
  if(!security.recoveryHash){showLockError('Esta credencial antigua no tiene PIN. Desbloquea con Face ID para configurar uno. Tus datos no se han borrado.');return}
  if(Date.now()<Number(security.retryAfter||0)){showLockError('Demasiados intentos. Espera antes de volver a intentarlo.');return}
  try{
    if(!await verifyRecoveryPin(security)){
      const failed=Number(security.failedAttempts||0)+1;
      saveSecurity({...security,failedAttempts:failed,retryAfter:failed>=5?Date.now()+60000:0});
      showLockError('PIN incorrecto o cancelado. Usa Face ID o vuelve a intentarlo.');return;
    }
    saveSecurity({...security,failedAttempts:0,retryAfter:0});unlockApp();showToast('Desbloqueado con PIN');
  }catch{showLockError('No se pudo comprobar el PIN. Intenta con Face ID.')}
}
function initializeAppSecurity(){if(loadSecurity().enabled)lockApp();else unlockApp()}
function clone(v){return JSON.parse(JSON.stringify(v))}
function isPlainObject(v){return !!v&&typeof v==="object"&&!Array.isArray(v)}
function validDate(value){return CF.validDate(value)}
function validateStoredData(source,{strict=true}={}){
  const errors=[],allowedId=id=>typeof id==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,149}$/.test(id);
  const error=text=>{if(errors.length<16)errors.push(text)};
  const amount=(value,label,{positive=false,nonnegative=false}={})=>{
    if(value===null||value===''||typeof value==='boolean'||!['number','string'].includes(typeof value)){error(`${label}: importe vac\u00edo o incorrecto.`);return}
    try{const c=CF.toCents(value);if((positive&&c<=0)||(nonnegative&&c<0))error(`${label}: revisa el signo o el importe.`)}catch{error(`${label}: importe inv\u00e1lido, fuera del rango o con m\u00e1s de dos decimales.`)}
  };
  if(!isPlainObject(source))return ['El respaldo no contiene un objeto v\u00e1lido.'];
  if(Number(source.schema)>10)error('Este archivo requiere una versi\u00f3n m\u00e1s nueva de ConFin.');
  for(const key of ['accounts','transactions','budgets','goals'])if(!Array.isArray(source[key]))error(`Falta la lista ${key}.`);
  if(Number(source.schema)>=10)for(const key of ['investments','receivables','assetEntries'])if(!Array.isArray(source[key]))error(`Falta la lista patrimonial ${key}; no se puede descartar sin confirmar.`);
  if(errors.length)return errors;
  const accountIds=new Set(),categoryIds={income:new Set(),expense:new Set()};
  for(const key of ['accounts','transactions','budgets','goals','incomeCategories','expenseCategories','investments','receivables','assetEntries']){
    if(source[key]===undefined)continue;
    if(!Array.isArray(source[key])){error(`Lista no v\u00e1lida: ${key}`);continue}
    const seen=new Set();
    for(const item of source[key]){
      if(!isPlainObject(item)){error(`Registro no v\u00e1lido en ${key}`);continue}
      if(!allowedId(item.id)||seen.has(item.id))error(`ID ausente, no v\u00e1lido o repetido en ${key}.`);
      seen.add(item.id);
    }
  }
  source.accounts.forEach((a,i)=>{
    if(!isPlainObject(a))return;
    accountIds.add(a.id);
    if(typeof a.name!=='string'||!a.name.trim())error(`Cuenta ${i+1} sin nombre.`);
    if(!['cash','bank','savings','investment','credit'].includes(a.type))error(`Tipo de cuenta ${i+1} no reconocido.`);
    amount(a.balance,`Saldo ${i+1}`);
    for(const key of ['creditLimit','minimumPayment','noInterestPayment'])if(a[key]!==undefined)amount(a[key],`${key} ${i+1}`,{nonnegative:true});
    for(const key of ['cutDay','dueDay'])if(a[key]!==undefined&&(!Number.isInteger(Number(a[key]))||Number(a[key])<0||Number(a[key])>31))error(`D\u00eda de tarjeta inv\u00e1lido: ${i+1}`);
  });
  for(const kind of ['income','expense']){
    const list=source[`${kind}Categories`];if(!Array.isArray(list))continue;
    for(const c of list){
      if(!isPlainObject(c))continue;
      categoryIds[kind].add(c.id);
      if(typeof c.name!=='string'||!c.name.trim()||typeof c.emoji!=='string'||!c.emoji.trim())error('Categor\u00eda sin nombre o emoji.');
      if(c.color!==undefined&&!/^#[0-9a-f]{6}$/i.test(c.color))error('Color de categor\u00eda inv\u00e1lido.');
    }
  }
  source.transactions.forEach((t,i)=>{
    if(!isPlainObject(t))return;
    if(!['income','expense','transfer'].includes(t.type))error(`Tipo inv\u00e1lido en movimiento ${i+1}.`);
    amount(t.amount,`Movimiento ${i+1}`,{positive:true});
    if(!validDate(t.date))error(`Fecha inv\u00e1lida en movimiento ${i+1}.`);
    if(strict&&(!accountIds.has(t.accountId)||(t.type==='transfer'&&!accountIds.has(t.destinationId))))error(`Cuenta inexistente en movimiento ${i+1}.`);
    if(t.type==='transfer'&&t.accountId===t.destinationId)error(`Origen y destino iguales en movimiento ${i+1}.`);
    if(t.categoryId&&!allowedId(t.categoryId))error(`ID de categor\u00eda inv\u00e1lido en movimiento ${i+1}.`);
  });
  source.budgets.forEach((b,i)=>{if(!isPlainObject(b))return;amount(b.limit,`Presupuesto ${i+1}`,{positive:true});if(b.month&&b.month!=='recurring'&&!CF.validMonth(b.month))error('Periodo de presupuesto inv\u00e1lido.');if(b.categoryId&&!allowedId(b.categoryId))error('Referencia de presupuesto inv\u00e1lida.')});
  source.goals.forEach((g,i)=>{if(!isPlainObject(g))return;amount(g.target,`Objetivo ${i+1}`,{positive:true});amount(g.saved,`Ahorro de meta ${i+1}`,{nonnegative:true});if(typeof g.name!=='string'||!g.name.trim())error('Meta sin nombre.');if(g.targetDate&&!validDate(g.targetDate))error('Fecha de meta inv\u00e1lida.')});
  const investmentIds=new Set((source.investments||[]).map(a=>a.id));
  const receivableIds=new Set((source.receivables||[]).map(a=>a.id));
  (source.investments||[]).forEach((a,i)=>{
    if(!isPlainObject(a))return;
    if(typeof a.name!=='string'||!a.name.trim()||a.name.length>100)error(`Inversión ${i+1} sin nombre válido.`);
    if(!validDate(a.date))error(`Fecha inválida de inversión ${i+1}.`);
    if(a.archived!==undefined&&typeof a.archived!=='boolean')error('Estado de inversión incorrecto.');
  });
  (source.receivables||[]).forEach((a,i)=>{
    if(!isPlainObject(a))return;
    if(typeof a.person!=='string'||!a.person.trim()||a.person.length>100)error(`Deudor ${i+1} inválido.`);
    amount(a.amount,`Cuenta por cobrar ${i+1}`,{positive:true});
    if(!validDate(a.date)||(a.dueDate&&!validDate(a.dueDate)))error(`Fecha inválida de cuenta por cobrar ${i+1}.`);
    if(!accountIds.has(a.accountId))error(`Cuenta de origen inexistente para deuda ${i+1}.`);
  });
  (source.assetEntries||[]).forEach((a,i)=>{
    if(!isPlainObject(a))return;
    if(!validDate(a.date))error(`Fecha inválida en operación patrimonial ${i+1}.`);
    amount(a.amount,`Operación patrimonial ${i+1}`,{positive:a.type!=='valuation',nonnegative:true});
    if(a.kind==='investment'){
      if(!investmentIds.has(a.targetId)||!['contribution','withdrawal','payout','valuation'].includes(a.type))error(`Movimiento de inversión ${i+1} incorrecto.`);
    }else if(a.kind==='receivable'){
      if(!receivableIds.has(a.targetId)||!['payment','interest'].includes(a.type))error(`Abono por cobrar ${i+1} incorrecto.`);
    }else error('Clase de operación patrimonial desconocida.');
    if(a.type!=='valuation'&&!accountIds.has(a.accountId))error(`Cuenta inexistente en operación patrimonial ${i+1}.`);
  });
  return errors;
}
function normalize(raw){
  const source=clone(raw),d={...baseData(),...source};
  // Existing IDs, archived flags, emojis, colors and unknown fields are authoritative.
  const expenseSource=Array.isArray(source.expenseCategories)?source.expenseCategories:Array.isArray(source.customExpenseCategories)?[...DEFAULT_EXPENSE_CATEGORIES,...source.customExpenseCategories]:DEFAULT_EXPENSE_CATEGORIES;
  const incomeSource=Array.isArray(source.incomeCategories)?source.incomeCategories:DEFAULT_INCOME_CATEGORIES;
  d.expenseCategories=clone(expenseSource);d.incomeCategories=clone(incomeSource);
  function resolveCategory(item,kind){
    const list=kind==='income'?d.incomeCategories:d.expenseCategories;
    let c=list.find(v=>v.id===item.categoryId)||(!item.categoryId&&list.find(v=>v.name===item.category));
    if(!c){
      const name=item.category||(kind==='income'?'Otros ingresos':'Otros gastos'),meta=LEGACY_CATEGORY_META[name]||{};
      const id=item.categoryId||`legacy-${kind}-${categorySlug(name)}`;
      c={id,name,emoji:item.categoryEmoji||meta.emoji||'\u2022',color:meta.color||'#8395a7',archived:true,system:false};
      list.push(c);
    }
    return c;
  }
  d.accounts=d.accounts.map(a=>({...a,balance:CF.toCents(a.balance)/100,creditLimit:CF.toCents(a.creditLimit??0)/100,minimumPayment:CF.toCents(a.minimumPayment??0)/100,noInterestPayment:CF.toCents(a.noInterestPayment??0)/100,cutDay:Number(a.cutDay||0),dueDay:Number(a.dueDay||0),reminders:a.reminders!==false}));
  d.transactions=d.transactions.map(t=>{
    const x={...t,amount:CF.toCents(t.amount)/100};
    if(t.type!=='transfer'){const c=resolveCategory(t,t.type);x.categoryId=c.id;x.category=c.name;x.categoryEmoji=c.emoji}
    return x;
  });
  d.budgets=d.budgets.map(b=>{const c=resolveCategory(b,'expense');return {...b,categoryId:c.id,category:c.name,limit:CF.toCents(b.limit)/100}});
  d.goals=d.goals.map(g=>({...g,target:CF.toCents(g.target)/100,saved:CF.toCents(g.saved)/100}));
  d.investments=Array.isArray(source.investments)?source.investments.map(a=>({...a})):[];
  d.receivables=Array.isArray(source.receivables)?source.receivables.map(a=>({...a,amount:CF.toCents(a.amount)/100})):[];
  d.assetEntries=Array.isArray(source.assetEntries)?source.assetEntries.map(a=>({...a,amount:CF.toCents(a.amount)/100})):[];
  d.theme=['midnight','ocean','violet','sand','light','graphite','emerald','burgundy','amoled','sandlight','ivory'].includes(d.theme)?d.theme:'midnight';
  d.notifications=Boolean(d.notifications);d.privacy=Boolean(d.privacy);d.reminderLeadDays=Math.min(14,Math.max(0,Number(d.reminderLeadDays??3)||0));
  d.schema=10;
  return d;
}
function parseStored(text,{strict=true}={}){
  try{
    const raw=JSON.parse(text);if(validateStoredData(raw,{strict}).length)return null;
    const next=normalize(raw);if(validateStoredData(next,{strict}).length)return null;
    CF.metrics(next);return next;
  }catch{return null}
}
function persist(value,{keepBackup=true}={}){
  const text=JSON.stringify(value),previous=localStorage.getItem(KEY);
  if(previous!==storageSnapshot)throw new Error('Otra ventana cambi\u00f3 los datos. No se sobrescribi\u00f3 su informaci\u00f3n. Cierra este formulario y revisa los datos actualizados antes de reintentar.');
  let previousSchema=0;try{previousSchema=Number(JSON.parse(previous||"{}").schema||0)}catch{}
  if(previous&&previousSchema!==10&&!localStorage.getItem(MIGRATION_KEY)){
    localStorage.setItem(MIGRATION_KEY,previous);
    if(localStorage.getItem(MIGRATION_KEY)!==previous)throw new Error('No se pudo verificar la copia previa a la migraci\u00f3n.');
  }
  // A failed setItem leaves the previous principal unchanged. Never delete it to make room.
  localStorage.setItem(KEY,text);
  if(localStorage.getItem(KEY)!==text)throw new Error('No se pudo verificar el guardado.');
  storageSnapshot=text;
  if(keepBackup&&previous&&previous!==text&&parseStored(previous)){
    try{
      const prior=localStorage.getItem(BACKUP_KEY);
      if(prior&&prior!==previous&&parseStored(prior))localStorage.setItem(BACKUP2_KEY,prior);
      localStorage.setItem(BACKUP_KEY,previous);
    }catch(e){window.__confinBackupWarning=true;console.warn('Datos guardados; falta espacio para renovar copias locales.',e)}
  }
}
function load(){
  let existing;
  try{existing=localStorage.getItem(KEY);storageSnapshot=existing}catch(e){window.__confinStorageBlocked=true;window.__confinRecovered='Este navegador no permite acceder al almacenamiento. No registres datos hasta resolverlo.';return baseData()}
  if(existing){
    const saved=parseStored(existing);if(saved)return saved;
    // Do not replace damaged/unknown data automatically. It could contain newer operations.
    window.__confinStorageBlocked=true;
    window.__confinRecovered='No se modificaron los datos originales: necesitan recuperaci\u00f3n. Exporta el original desde Configuraci\u00f3n y revisa una copia v\u00e1lida.';
    for(const key of [BACKUP_KEY,BACKUP2_KEY,RESTORE_KEY,MIGRATION_KEY]){const text=localStorage.getItem(key),saved=text&&parseStored(text);if(saved){window.__confinRecoveryKey=key;return saved}}
    return baseData();
  }
  for(const key of OLD_KEYS){
    const old=localStorage.getItem(key);if(!old)continue;
    const saved=parseStored(old);if(saved){window.__confinLegacyKey=key;return saved}
    window.__confinStorageBlocked=true;window.__confinRecovered='Hay datos de una versi\u00f3n anterior que no pueden validarse. No se borraron.';return baseData();
  }
  return baseData();
}
function save(message){
  function failed(text){
    const form=modalRoot.querySelector('form');
    if(form){let box=form.querySelector('[data-save-error]');if(!box){box=document.createElement('p');box.dataset.saveError='true';box.setAttribute('role','alert');form.prepend(box)}box.textContent=text;box.scrollIntoView({block:'nearest'})}
    showToast(text);
  }
  if(window.__confinStorageBlocked){state=clone(committedState);invalidateMetrics();failed('Datos en recuperaci\u00f3n. Exporta el original y revisa un respaldo antes de guardar.');return false}
  try{
    const errors=validateStoredData(state);if(errors.length)throw new Error(errors[0]);
    const next=normalize(state);CF.metrics(next);
    persist(next);state=next;committedState=clone(next);invalidateMetrics();applyTheme();render();
    if(message)showToast(window.__confinBackupWarning?`${message}. Exporta una copia externa: falta espacio para copias locales.`:message);
    return true;
  }catch(e){
    state=clone(committedState);invalidateMetrics();
    const msg=e.name==='QuotaExceededError'?'No se guard\u00f3: almacenamiento lleno. El formulario conserva lo escrito; exporta un respaldo.':`No se guard\u00f3: ${e.message}`;
    failed(msg);return false;
  }
}
function applyTheme(){
  document.documentElement.dataset.theme=state.theme;
  const colors={midnight:'#080b12',ocean:'#06131a',violet:'#100b17',sand:'#17130e',light:'#f4f6fa',ivory:'#faf8f3',graphite:'#15171b',emerald:'#071913',burgundy:'#1b0c14',amoled:'#000000',sandlight:'#f6f0e5'};
  document.querySelector('meta[name="theme-color"]').content=colors[state.theme]||colors.midnight;
}
function money(n){if(state.privacy)return "$••••";return new Intl.NumberFormat("es-MX",{style:"currency",currency:state.currency||"MXN",minimumFractionDigits:2}).format(Number(n)||0)}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function localDateKey(d=new Date()){return CF.dateKey(d)}
function monthKey(s){return String(s||"").slice(0,7)}
function currentMonth(){return localDateKey().slice(0,7)}
function formatDate(s){return new Intl.DateTimeFormat("es-MX",{day:"numeric",month:"short"}).format(new Date(`${s}T12:00:00`))}
let metricsCache=null;
function invalidateMetrics(){metricsCache=null}
function getMetrics(){
  if(metricsCache?.source===state)return metricsCache;
  metricsCache={source:state,...CF.metrics(state)};
  return metricsCache;
}
function accountBalance(id){return getMetrics().balances.get(id)||0}
function transactionImpact(transaction,id){
  if(!transaction)return 0;
  const amount=Number(transaction.amount)||0;
  if(transaction.type==="income")return transaction.accountId===id?amount:0;
  if(transaction.type==="expense")return transaction.accountId===id?-amount:0;
  return (transaction.destinationId===id?amount:0)-(transaction.accountId===id?amount:0);
}
function balanceWithoutTransaction(id,transaction){return accountBalance(id)-transactionImpact(transaction,id)}
function accountTransactionDelta(id){return getMetrics().deltas.get(id)||0}
function monthTx(){return state.transactions.filter(t=>monthKey(t.date)===currentMonth())}
function monthSummary(month){return getMetrics().monthly.get(month)||{income:0,expense:0}}
function savingsRate(income,expense){return income>0?CF.subtract(income,expense)/income*100:null}
function daysUntilDay(day){
  if(!day)return null;
  const now=new Date(),y=now.getFullYear(),m=now.getMonth(),today=now.getDate();
  const clamp=(year,month)=>Math.min(Number(day),new Date(year,month+1,0).getDate());
  let target=new Date(y,m,clamp(y,m),12);
  if(target<new Date(y,m,today,12))target=new Date(y,m+1,clamp(y,m+1),12);
  return Math.round((Date.UTC(target.getFullYear(),target.getMonth(),target.getDate())-Date.UTC(y,m,today))/86400000);
}
function creditReminders(){return state.accounts.filter(a=>a.type==="credit"&&a.reminders!==false).map(a=>{const due=daysUntilDay(a.dueDay),debt=Math.max(0,-accountBalance(a.id));return {account:a,due,debt}}).filter(x=>x.debt>0&&x.due!==null&&x.due<=state.reminderLeadDays).sort((a,b)=>a.due-b.due)}
function screenProfile(){return `${isStandalone?'App instalada':'Navegador'} \u00b7 ${innerWidth} \u00d7 ${innerHeight} \u00b7 ${document.documentElement.dataset.screen||''}`}
function screenDiagnostics(){
  const box=selector=>{const r=document.querySelector(selector)?.getBoundingClientRect();return r?Object.fromEntries(['x','y','width','height','top','bottom','left','right'].map(k=>[k,Math.round(r[k]*100)/100])):null};
  const style=getComputedStyle(document.querySelector('.safe-probe')),vv=window.visualViewport;
  return {app:'ConFin',version:VERSION,build:BUILD,release:RELEASE,standalone:isStandalone,iosDetected:isIOS,userAgent:navigator.userAgent,devicePixelRatio,orientation:innerWidth>innerHeight?'horizontal':'vertical',screen:{width:screen.width,height:screen.height,viewportGap:Math.round((screen.height-innerHeight)*100)/100},statusBarStyle:document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.content,scrollModel:'document-flow + fixed nav',inner:{width:innerWidth,height:innerHeight},document:{width:document.documentElement.clientWidth,height:document.documentElement.clientHeight,scrollHeight:document.documentElement.scrollHeight},visualViewport:vv?{width:vv.width,height:vv.height,offsetTop:vv.offsetTop,offsetLeft:vv.offsetLeft,scale:vv.scale}:null,safeArea:{top:style.paddingTop,bottom:style.paddingBottom,left:style.paddingLeft,right:style.paddingRight},rectangles:{app:box('#app'),header:box('#screenHeader'),content:box('#view'),navigation:box('.bottom-nav'),modal:box('.sheet')},keyboardOpen:document.documentElement.classList.contains('keyboard-open'),exactIOSVersion:'Confirmar en Ajustes del iPhone; el user-agent puede no identificarla con exactitud'};
}
function diagnosticsSheet(){
  const report=JSON.stringify(screenDiagnostics(),null,2);
  openSheet('Diagn\u00f3stico de pantalla',`<p class="settings-note">No incluye cuentas, nombres ni importes. Copia este reporte con el teclado cerrado y repite con el teclado abierto.</p><textarea class="input diagnostic-text" readonly rows="14" aria-label="Diagn\u00f3stico copiable">${esc(report)}</textarea><button class="primary-btn" id="copyDiagnostics" type="button">Copiar diagn\u00f3stico</button>`);
  $('#copyDiagnostics').onclick=async()=>{try{await navigator.clipboard.writeText(report);showToast('Diagn\u00f3stico copiado')}catch{modalRoot.querySelector('textarea').select();showToast('Texto seleccionado; usa Copiar')}};
}
function shell(title,content,subtitle=`Hola, ${esc(state.userName||"tú")} 👋`){return `<header class="header"><div><p class="eyebrow">${subtitle}</p><h1 class="title">${title}</h1></div><div class="header-actions">${!["home","transactions","budgets","goals","accounts"].includes(route)?"":`<button class="header-add" data-action="new-movement" type="button" aria-label="Nuevo movimiento"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>`}<button class="icon-button" data-action="settings" aria-label="Configuración"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V21h-4v-.08A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.52-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 8.97 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08a1.7 1.7 0 0 0 1.03 1.52 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 7l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/></svg></button></div></header>${content}`}
function fitAmounts(){
  document.querySelectorAll('[data-fit-amount]').forEach(el=>{
    if(!el.offsetWidth)return;
    const max=Number(el.dataset.maxSize||40),min=Number(el.dataset.minSize||15);
    el.style.fontSize=`${max}px`;el.classList.remove('amount-overflow');
    let size=max;
    while(size>min&&el.scrollWidth>el.clientWidth+1){size--;el.style.fontSize=`${size}px`}
    el.classList.toggle('amount-overflow',el.scrollWidth>el.clientWidth+1);
  });
}
function render(){
  // Native document scrolling (like VapeZone Business). A fixed .view scroller
  // used to leave an unreachable bottom band in standalone iOS.
  const oldScroll=window.scrollY||document.documentElement.scrollTop||0;
  const sameRoute=lastRenderedRoute===route;
  if(lastRenderedRoute)routeScroll.set(lastRenderedRoute,oldScroll);
  document.querySelectorAll('.nav-item').forEach(b=>{const active=b.dataset.route===route;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  const fn={home:homeView,transactions:transactionsView,budgets:budgetsView,goals:goalsView,accounts:accountsView,settings:settingsView,investments:investmentsView,receivables:receivablesView,'categories-income':()=>categoryManagerView('income'),'categories-expense':()=>categoryManagerView('expense')}[route]||homeView;
  const template=document.createElement('template');template.innerHTML=fn();
  const header=template.content.querySelector('.header');
  document.querySelector('#screenHeader').replaceChildren(header);
  view.replaceChildren(template.content);
  lastRenderedRoute=route;
  renderUpdateNotice();
  const targetScroll=sameRoute?oldScroll:(routeScroll.get(route)||0);
  window.scrollTo(0,targetScroll);
  requestAnimationFrame(fitAmounts);
}
function last7DaysActivity(){
  const days=[],daily=getMetrics().daily;
  for(let i=6;i>=0;i--){
    const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);
    const item=daily.get(localDateKey(d))||{income:0,expense:0};
    days.push({label:new Intl.DateTimeFormat("es-MX",{weekday:"short"}).format(d).replace(".",""),activity:item.income+item.expense});
  }
  const max=Math.max(...days.map(d=>d.activity),1);
  return days.map(d=>({...d,height:d.activity?Math.max(18,Math.round(d.activity/max*100)):14}));
}
function monthLabel(key){
  const [y,m]=key.split("-").map(Number);
  const date=new Date(0);date.setHours(12,0,0,0);date.setFullYear(y,m-1,1);
  return new Intl.DateTimeFormat("es-MX",{month:"long",year:"numeric"}).format(date);
}
function monthControl(context,value,{allowAll=false}={}){
  const actual=CF.validMonth(value)?value:currentMonth();
  return `<div class="month-control" data-month-context="${context}"><div class="month-nav"><button class="small-btn month-arrow" type="button" data-month-step="-1" data-context="${context}" aria-label="Mes anterior">\u2039</button><button class="month-current" type="button" data-month-picker="${context}" aria-label="Elegir mes y a\u00f1o">${value==='all'?'Todos los meses':esc(monthLabel(actual))}<span aria-hidden="true">\u2304</span></button><button class="small-btn month-arrow" type="button" data-month-step="1" data-context="${context}" aria-label="Mes siguiente">\u203a</button></div><div class="month-shortcuts"><button class="text-btn" type="button" data-month-set="${currentMonth()}" data-context="${context}">Mes actual</button>${allowAll?`<button class="text-btn" type="button" data-month-set="all" data-context="${context}" aria-pressed="${value==='all'}">Todos los meses</button>`:''}</div></div>`;
}
function selectedMonth(context){return context==='history'?historyMonth:context==='budget'?budgetMonth:transactionMonth}
function setSelectedMonth(context,value){
  if(!CF.validMonth(value)&&!(context==='transactions'&&value==='all'))return;
  if(context==='history'){
    historyMonth=value;historyOpen=true;
    const control=view.querySelector('[data-month-context="history"]'),results=$('#historyResults');
    if(control)control.outerHTML=monthControl(context,value);
    if(results)results.innerHTML=historyResults();
  }else if(context==='transactions'){
    transactionMonth=value;listLimit=40;
    const control=view.querySelector('[data-month-context="transactions"]');
    if(control)control.outerHTML=monthControl(context,value,{allowAll:true});
    updateTransactionResults();
  }else if(context==='budget'){budgetMonth=value;render()}
  requestAnimationFrame(fitAmounts);
}
function monthPicker(context){
  const current=selectedMonth(context),key=CF.validMonth(current)?current:currentMonth(),[year,month]=key.split('-');
  const labels=Array.from({length:12},(_,i)=>monthLabel(`2026-${String(i+1).padStart(2,'0')}`).replace(/ de 2026$/, ''));
  openSheet('Elegir mes y a\u00f1o',`<form id="monthPickerForm" class="form"><div class="field"><label for="pickerMonth">Mes</label><select id="pickerMonth" name="month">${labels.map((label,i)=>`<option value="${String(i+1).padStart(2,'0')}" ${+month===i+1?'selected':''}>${esc(label)}</option>`).join('')}</select></div><div class="field"><label for="pickerYear">A\u00f1o</label><input class="input" id="pickerYear" name="year" type="number" inputmode="numeric" min="1" max="9999" step="1" value="${year}" required></div><p class="settings-note">Puedes elegir meses sin registros. Mostrar\u00e1n cero y no cambiar\u00e1n tus datos.</p><button class="primary-btn" type="submit">Ver mes</button></form>`);
  $('#monthPickerForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget),y=String(fd.get('year')).padStart(4,'0'),next=`${y}-${fd.get('month')}`;if(!CF.validMonth(next)){showToast('Escribe un a\u00f1o v\u00e1lido');return}closeSheet();setSelectedMonth(context,next)};
}
function historySection(){
  if(!CF.validMonth(historyMonth))historyMonth=CF.shiftMonth(currentMonth(),-1);
  return `<section class="section monthly-history"><div class="section-head"><div><p class="section-kicker">An\u00e1lisis financiero</p><h2 class="section-title">Historial mensual</h2></div></div><button class="history-toggle" type="button" data-action="toggle-history" aria-expanded="${historyOpen}" aria-controls="historyPanel"><span><strong>Consultar meses anteriores</strong><small>Ingresos, gastos y porcentaje de ahorro</small></span><span aria-hidden="true">${historyOpen?'\u2303':'\u2304'}</span></button><div class="history-panel" id="historyPanel" ${historyOpen?'':'hidden'}>${monthControl('history',historyMonth)}<div id="historyResults">${historyResults()}</div></div></section>`;
}
function historyResults(){
  const {income,expense}=monthSummary(historyMonth),saved=CF.subtract(income,expense),pct=savingsRate(income,expense);
  const categories=[...(getMetrics().expenseByCategory.get(historyMonth)||new Map())].sort((a,b)=>b[1]-a[1]);
  const max=categories[0]?.[1]||1;
  const hasData=state.transactions.some(t=>monthKey(t.date)===historyMonth)||state.assetEntries.some(t=>(t.type==='payout'||t.type==='interest')&&monthKey(t.date)===historyMonth);
  return `<div class="history-period" aria-live="polite">${esc(monthLabel(historyMonth))}</div>${!hasData?'<p class="empty-note">Sin movimientos en este mes.</p>':''}<div class="history-stats"><div><span>Ingresos</span><strong class="positive" data-stat="income" data-fit-amount data-max-size="22" data-min-size="14">${money(income)}</strong></div><div><span>Gastos</span><strong class="negative" data-stat="expense" data-fit-amount data-max-size="22" data-min-size="14">${money(expense)}</strong></div><div><span>Ahorro neto</span><strong class="${saved<0?'negative':'positive'}" data-stat="savings" data-fit-amount data-max-size="22" data-min-size="14">${money(saved)}</strong></div><div><span>Porcentaje de ahorro</span><strong data-stat="rate">${pct===null?'No calculable: sin ingresos':`${pct.toFixed(1)}%`}</strong></div></div>${categories.length?`<div class="history-breakdown"><h3>Gastos por categor\u00eda</h3>${categories.map(([id,total])=>{const cat=categoryById(id)||categoryByName(id);return `<div class="breakdown-item"><span>${esc(cat?.emoji||'\u2022')} ${esc(cat?.name||id)}</span><b>${money(total)}</b><div class="breakdown-track"><i style="width:${Math.round(total/max*100)}%"></i></div></div>`}).join('')}</div>`:''}<p class="history-hint">Las transferencias no son ingresos ni gastos.${historyMonth===currentMonth()?' El mes actual est\u00e1 en curso.':''}</p>`;
}
function homeView(){
  const current=monthSummary(currentMonth()),income=current.income,expense=current.expense;
  const available=CF.sumMoney(state.accounts.filter(a=>["cash","bank","savings"].includes(a.type)).map(a=>accountBalance(a.id)));
  const rate=savingsRate(income,expense),recent=getMetrics().sorted.slice(0,4),week=last7DaysActivity(),reminders=creditReminders();
  const rateLabel=rate===null?"Agrega ingresos para medir tu ahorro":rate>=0?`▲ ${rate.toFixed(1)}% de ahorro este mes`:`▼ ${Math.abs(rate).toFixed(1)}% de déficit este mes`;
  return shell("ConFin",`${reminders.length?`<section class="reminder-strip"><div><strong>Pago próximo</strong><span>${esc(reminders[0].account.name)} · ${reminders[0].due===0?"vence hoy":`vence en ${reminders[0].due} día${reminders[0].due===1?"":"s"}`}</span></div><b>${money(reminders[0].account.noInterestPayment||reminders[0].debt)}</b></section>`:""}<section class="hero"><div class="hero-row"><div class="hero-main"><span class="label">Dinero disponible</span><div class="hero-value" data-fit-amount data-max-size="48" data-min-size="22">${money(available)}</div></div><button class="privacy" data-action="privacy" aria-label="${state.privacy?"Mostrar cantidades":"Ocultar cantidades"}">${state.privacy?"Mostrar":"Privado"}</button></div><div class="spark" aria-label="Actividad de los últimos siete días">${week.some(d=>d.activity>0)?week.map(d=>`<span style="height:${d.height}%" title="${d.label}: ${money(d.activity)}"></span>`).join(""):`<p class="spark-empty">Sin actividad registrada esta semana</p>`}</div><div class="spark-labels">${week.map(d=>`<span>${d.label}</span>`).join("")}</div><div class="row-between"><span class="label">${rateLabel}</span><b>${state.currency}</b></div><p class="hero-caption">Efectivo, bancos y ahorros. No incluye inversiones ni límites de crédito.</p></section><section class="grid-2"><article class="stat-card"><div class="stat-icon">↓</div><div class="label">Ingresos</div><div class="stat-value" data-fit-amount data-max-size="27" data-min-size="16">${money(income)}</div><span class="positive">Este mes</span></article><article class="stat-card"><div class="stat-icon" style="color:var(--danger);background:color-mix(in srgb,var(--danger) 12%,transparent)">↑</div><div class="label">Gastos</div><div class="stat-value" data-fit-amount data-max-size="27" data-min-size="16">${money(expense)}</div><span class="negative">Este mes</span></article></section><section class="section"><div class="section-head"><div><p class="section-kicker">Actividad</p><h2 class="section-title">Últimos movimientos</h2></div><button class="link-btn" data-route-go="transactions">Ver todos</button></div><div class="list">${recent.length?recent.map(t=>txCard(t,true)).join(""):`<div class="list-card empty">Tu actividad aparecerá aquí.</div>`}</div></section>${historySection()}`);
}
function txCard(t,editable=false){
  const account=state.accounts.find(a=>a.id===t.accountId),sign=t.type==='income'?'+':t.type==='expense'?'-':'',cls=t.type==='income'?'positive':t.type==='expense'?'negative':'',name=categoryName(t),title=t.note||(t.type==='transfer'?'Transferencia':name);
  const sub=t.type==='transfer'?`${account?.name||'Cuenta'} → ${state.accounts.find(a=>a.id===t.destinationId)?.name||'Cuenta'}`:`${name} · ${account?.name||'Cuenta'}`;
  return `<article class="list-card transaction-card"><div class="tx-row"><div class="tx-left"><div class="tx-icon">${esc(t.type==='transfer'?'⇆':categoryIcon(t))}</div><div class="tx-copy"><p class="tx-title">${esc(title)}</p><span class="tx-sub">${esc(sub)} · ${formatDate(t.date)}</span></div></div><div class="amount-wrap"><span class="amount ${cls}" data-fit-amount data-max-size="18" data-min-size="12">${sign}${money(t.amount)}</span></div></div>${t.virtualAsset?`<div class="tx-actions"><button class="small-btn" data-route-go="${t.assetRoute}" type="button">Ver origen del rendimiento</button></div>`:editable?`<div class="tx-actions"><button class="small-btn" data-edit-transaction="${esc(t.id)}">Editar</button><button class="small-btn" data-repeat-transaction="${esc(t.id)}">Repetir</button><button class="small-btn danger" data-delete-transaction="${esc(t.id)}">Borrar</button></div>`:''}</article>`;
}
function transactionResults(){
  const search=transactionSearch.toLocaleLowerCase('es-MX').trim(),metrics=getMetrics();
  let tx=metrics.sorted;
  if(filter!=='all')tx=tx.filter(t=>t.type===filter);
  if(transactionMonth!=='all')tx=tx.filter(t=>monthKey(t.date)===transactionMonth);
  if(transactionAccount!=='all')tx=tx.filter(t=>t.accountId===transactionAccount||t.destinationId===transactionAccount);
  if(transactionCategory!=='all')tx=tx.filter(t=>`${t.type}:${t.categoryId}`===transactionCategory);
  if(search)tx=tx.filter(t=>[t.note,categoryName(t),metrics.accounts.get(t.accountId)?.name,metrics.accounts.get(t.destinationId)?.name,t.amount,t.date].some(x=>String(x||'').toLocaleLowerCase('es-MX').includes(search)));
  const income=CF.sumMoney(tx.filter(t=>t.type==='income').map(t=>t.amount)),expense=CF.sumMoney(tx.filter(t=>t.type==='expense').map(t=>t.amount)),rows=tx.slice(0,listLimit);
  return `<div class="result-summary"><div><small>Ingresos filtrados</small><strong class="positive" data-stat="income" data-fit-amount data-max-size="20" data-min-size="14">${money(income)}</strong></div><div><small>Gastos filtrados</small><strong class="negative" data-stat="expense" data-fit-amount data-max-size="20" data-min-size="14">${money(expense)}</strong></div></div><p class="list-count" aria-live="polite">${tx.length} movimiento${tx.length===1?'':'s'} \u00b7 ${transactionMonth==='all'?'Todos los meses':esc(monthLabel(transactionMonth))}</p><div class="list">${rows.length?rows.map(t=>txCard(t,true)).join(''):'<div class="list-card empty">No hay movimientos con estos filtros.</div>'}</div>${tx.length>listLimit?`<button class="secondary-btn load-more" data-action="more-transactions" type="button">Mostrar m\u00e1s (${tx.length-listLimit} pendientes)</button>`:''}`;
}
function transactionsView(){
  const categories=[...expenseCategories().map(c=>({...c,kind:'expense'})),...incomeCategories().map(c=>({...c,kind:'income'}))];
  return shell('Movimientos',`<div class="tabs" role="group" aria-label="Tipo de movimiento">${[['all','Todos'],['expense','Gastos'],['income','Ingresos'],['transfer','Transfer.']].map(([v,l])=>`<button class="tab ${filter===v?'active':''}" data-filter="${v}" aria-pressed="${filter===v}" type="button">${l}</button>`).join('')}</div>${monthControl('transactions',transactionMonth,{allowAll:true})}<div class="transaction-tools"><div class="field"><label for="transactionSearch">Buscar</label><input class="input" id="transactionSearch" type="search" placeholder="Nota, cuenta o categor\u00eda" value="${esc(transactionSearch)}"></div><div class="filter-grid"><div class="field"><label for="transactionAccount">Cuenta</label><select id="transactionAccount"><option value="all">Todas las cuentas</option>${state.accounts.map(a=>`<option value="${esc(a.id)}" ${a.id===transactionAccount?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div><div class="field"><label for="transactionCategory">Categor\u00eda</label><select id="transactionCategory"><option value="all">Todas las categor\u00edas</option>${categories.map(c=>`<option value="${c.kind}:${esc(c.id)}" ${`${c.kind}:${c.id}`===transactionCategory?'selected':''}>${esc(c.emoji)} ${esc(c.name)} \u00b7 ${c.kind==='income'?'Ingreso':'Gasto'}</option>`).join('')}</select></div></div><button class="text-btn" type="button" data-action="clear-filters">Limpiar filtros</button></div><div id="transactionResults">${transactionResults()}</div>`);
}
function updateTransactionResults(){const list=$('#transactionResults');if(list){list.innerHTML=transactionResults();requestAnimationFrame(fitAmounts)}}
function budgetsFor(month){
  const chosen=new Map();
  for(const b of state.budgets)if(!b.month||b.month==='recurring')chosen.set(b.categoryId,b);
  for(const b of state.budgets)if(b.month===month)chosen.set(b.categoryId,b);
  return [...chosen.values()];
}
function budgetsView(){
  if(!CF.validMonth(budgetMonth))budgetMonth=currentMonth();
  const budgets=budgetsFor(budgetMonth),total=CF.sumMoney(budgets.map(b=>b.limit)),categories=new Set(budgets.map(b=>b.categoryId));
  const monthly=getMetrics().expenseByCategory.get(budgetMonth)||new Map();
  const used=CF.sumMoney([...categories].map(id=>monthly.get(id)||0)),all=monthSummary(budgetMonth).expense,remaining=CF.subtract(total,used);
  return shell('Presupuestos',`<div class="section-head"><p class="section-kicker">Control por categor\u00eda</p><button class="link-btn" data-action="new-budget" type="button">+ Nuevo</button></div>${monthControl('budget',budgetMonth)}<article class="hero budget-summary"><div class="budget-summary-grid"><div><span class="label">Presupuestado</span><strong data-fit-amount data-max-size="26" data-min-size="14">${money(total)}</strong></div><div><span class="label">Usado en presupuestos</span><strong data-fit-amount data-max-size="26" data-min-size="14">${money(used)}</strong></div><div><span class="label">${remaining<0?'Exceso':'Restante'}</span><strong class="${remaining<0?'negative':'positive'}" data-fit-amount data-max-size="26" data-min-size="14">${money(Math.abs(remaining))}</strong></div></div><p class="budget-context">Gastos fuera del presupuesto: ${money(Math.max(0,CF.subtract(all,used)))}</p></article><div class="list">${budgets.length?budgets.map(b=>{const c=categoryById(b.categoryId),spent=monthly.get(b.categoryId)||0,pct=b.limit?spent/b.limit*100:0;return `<article class="list-card budget-card"><div class="budget-top"><div class="budget-copy"><div class="budget-title">${esc(c?.emoji||'\u2022')} ${esc(c?.name||b.category)}</div><div class="budget-meta">${money(spent)} de ${money(b.limit)}<br>${b.month&&b.month!=='recurring'?'Solo '+esc(monthLabel(b.month)):'Plantilla mensual'}</div></div><div class="budget-actions"><button type="button" class="small-btn" data-edit-budget="${esc(b.id)}">Editar</button><button type="button" class="small-btn danger" data-delete-budget="${esc(b.id)}">Borrar</button></div></div><div class="row-between budget-usage"><span class="label">Uso mensual</span><span class="percent ${pct>100?'negative':''}">${pct.toFixed(1)}%</span></div><div class="progress"><span style="width:${Math.min(100,pct)}%"></span></div></article>`}).join(''):'<div class="list-card empty">No hay presupuestos para este mes.</div>'}</div>`);
}
function goalsView(){
  const total=CF.sumMoney(state.goals.map(g=>g.target)),saved=CF.sumMoney(state.goals.map(g=>g.saved));
  return shell('Metas',`<div class="section-head"><p class="section-kicker">Objetivos de ahorro</p><button class="link-btn" data-action="new-goal" type="button">+ Nueva</button></div><article class="hero"><span class="label">Ahorrado en metas</span><div class="hero-value" data-fit-amount data-max-size="40" data-min-size="18">${money(saved)}</div><div class="row-between"><span class="label">Objetivo total</span><b>${money(total)}</b></div><p class="hero-caption">Seguimiento manual. Estos importes no se suman otra vez a tus cuentas ni a tu patrimonio.</p></article><div class="list">${state.goals.length?state.goals.map(g=>{const pct=g.target?g.saved/g.target*100:0;return `<article class="list-card"><div class="budget-top"><div><div class="budget-title">\ud83c\udfaf ${esc(g.name)}</div><div class="budget-meta">${money(g.saved)} de ${money(g.target)}${g.targetDate?` \u00b7 ${formatDate(g.targetDate)}`:''}</div></div><div class="budget-actions"><button class="small-btn" data-edit-goal="${esc(g.id)}" type="button">Editar</button><button class="small-btn danger" data-delete-goal="${esc(g.id)}" type="button">Borrar</button></div></div><div class="row-between budget-usage"><span class="label">Pendiente: ${money(Math.max(0,CF.subtract(g.target,g.saved)))}</span><strong class="percent">${pct.toFixed(1)}%</strong></div><div class="progress"><span style="width:${Math.min(100,pct)}%"></span></div></article>`}).join(''):'<div class="list-card empty">Crea una meta para comenzar.</div>'}</div>`);
}
/* Investments and receivables: separate subledgers; no fictitious expenses for principal transfers. */
function availableCashAccounts(){return state.accounts.filter(a=>['cash','bank','savings'].includes(a.type))}
function cashAccountOptions(selected=''){
  return availableCashAccounts().map(a=>`<option value="${esc(a.id)}" ${selected===a.id?'selected':''}>${esc(a.name)} · ${money(accountBalance(a.id))}</option>`).join('');
}
function assetMoney(input,{allowZero=false}={}){
  const cents=CF.toCents(input);
  if(cents<0||(!allowZero&&cents===0))throw new Error('Escribe un importe válido mayor a cero y con máximo dos decimales.');
  return cents/100;
}
function investmentTotals(){
  const list=[...getMetrics().investmentPositions.values()];
  return {value:CF.sumMoney(list.map(x=>x.value)),contributed:CF.sumMoney(list.map(x=>x.contributed)),profit:CF.sumMoney(list.map(x=>x.profit)),distributed:CF.sumMoney(list.map(x=>x.distributed))};
}
function receivableTotals(){
  const list=[...getMetrics().receivablePositions.values()];
  return {pending:CF.sumMoney(list.map(x=>x.pending)),active:list.filter(x=>x.pending>0).length};
}
function assetEntryList(kind,id){
  const events=state.assetEntries.filter(a=>a.kind===kind&&a.targetId===id).sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  const labels={contribution:'Aportación',withdrawal:'Retiro',payout:'Rendimiento cobrado',valuation:'Valor actualizado',payment:'Abono al capital',interest:'Interés cobrado'};
  return events.length?`<details class="asset-history"><summary>Historial de operaciones (${events.length})</summary><div class="asset-history-items">${events.map(a=>`<div class="asset-history-line"><span><strong>${labels[a.type]||'Operación'}</strong><small>${formatDate(a.date)}${a.note?' · '+esc(a.note):''}</small></span><b>${money(a.amount)}</b></div>`).join('')}</div></details>`:'';
}
function investmentsView(){
  const totals=investmentTotals();
  const active=state.investments.filter(x=>!x.archived),archived=state.investments.filter(x=>x.archived);
  const cards=list=>list.map(a=>{
    const p=getMetrics().investmentPositions.get(a.id)||{value:0,contributed:0,profit:0,returnPercent:null,distributed:0};
    return `<article class="list-card asset-card"><div class="asset-heading"><div><span class="asset-type">${esc(a.kind||'Otra inversión')}</span><h3>${esc(a.name)}</h3></div><b class="asset-current" data-fit-amount data-max-size="25" data-min-size="15">${money(p.value)}</b></div><div class="asset-metrics"><span>Capital aportado <b>${money(p.contributed)}</b></span><span>Resultado total <b class="${p.profit<0?'negative':'positive'}">${money(p.profit)}</b></span><span>Rendimiento simple <b>${p.returnPercent===null?'No calculable':`${p.returnPercent.toFixed(2)}%`}</b></span><span>Rendimientos cobrados <b>${money(p.distributed)}</b></span></div>${a.notes?`<p class="settings-note">${esc(a.notes)}</p>`:''}${!a.archived?`<div class="asset-actions"><button class="small-btn" data-investment-entry="contribution" data-investment-id="${esc(a.id)}">Aportar</button><button class="small-btn" data-investment-entry="withdrawal" data-investment-id="${esc(a.id)}">Retirar</button><button class="small-btn" data-investment-entry="valuation" data-investment-id="${esc(a.id)}">Actualizar valor</button><button class="small-btn" data-investment-entry="payout" data-investment-id="${esc(a.id)}">Cobrar rendimiento</button></div>`:''}<div class="asset-secondary"><button class="text-btn" data-edit-investment="${esc(a.id)}">Editar datos</button><button class="text-btn" data-archive-investment="${esc(a.id)}">${a.archived?'Reactivar':'Archivar'}</button>${state.assetEntries.filter(e=>e.kind==='investment'&&e.targetId===a.id).length===1&&p.value===p.contributed?`<button class="text-btn negative" data-delete-investment="${esc(a.id)}">Anular registro</button>`:''}</div>${assetEntryList('investment',a.id)}</article>`;
  }).join('');
  return shell('Inversiones',`<button class="back-link" data-route-go="accounts" type="button">‹ Volver a Cuentas</button><div class="section-head"><div><p class="section-kicker">Tu capital invertido</p><h2 class="section-title">Portafolio</h2></div><button class="link-btn" data-action="new-investment">+ Agregar</button></div><section class="asset-summary"><div><span>Valor actual</span><strong data-fit-amount data-max-size="29" data-min-size="16">${money(totals.value)}</strong></div><div><span>Total aportado</span><strong>${money(totals.contributed)}</strong></div><div><span>Resultado acumulado</span><strong class="${totals.profit<0?'negative':'positive'}">${money(totals.profit)}</strong></div></section><p class="settings-note">El rendimiento es una variación total simple, no una tasa anualizada. El valor de mercado se captura manualmente; no incluye movimientos de bancos conectados.</p><div class="list">${active.length?cards(active):'<div class="list-card empty">No tienes inversiones activas. Agrega una para empezar.</div>'}</div>${archived.length?`<details class="asset-archived"><summary>Inversiones archivadas (${archived.length})</summary><div class="list">${cards(archived)}</div></details>`:''}`);
}
function receivablesView(){
  const totals=receivableTotals();
  const rows=state.receivables.slice().sort((a,b)=>b.date.localeCompare(a.date));
  const cards=rows.map(a=>{
    const p=getMetrics().receivablePositions.get(a.id)||{pending:a.amount,paid:0,original:a.amount,interest:0};
    const due=a.dueDate&&a.dueDate<localDateKey()&&p.pending>0;
    const status=p.pending<=0?'Liquidado':due?'Vencido':p.paid>0?'Abonado parcialmente':'Pendiente';
    return `<article class="list-card asset-card"><div class="asset-heading"><div><span class="asset-type">${esc(a.concept||'Préstamo personal')}</span><h3>${esc(a.person)}</h3></div><span class="status-pill ${p.pending<=0?'paid':due?'late':''}">${status}</span></div><div class="asset-metrics"><span>Monto original <b>${money(p.original)}</b></span><span>Abonado <b>${money(p.paid)}</b></span><span>Por cobrar <b class="${p.pending>0?'positive':''}">${money(p.pending)}</b></span><span>Intereses cobrados <b>${money(p.interest)}</b></span></div>${a.dueDate?`<p class="settings-note">Fecha esperada de pago: ${formatDate(a.dueDate)}</p>`:''}${a.notes?`<p class="settings-note">${esc(a.notes)}</p>`:''}<div class="asset-actions">${p.pending>0?`<button class="small-btn" data-receivable-entry="payment" data-receivable-id="${esc(a.id)}">Registrar abono</button>`:''}<button class="small-btn" data-receivable-entry="interest" data-receivable-id="${esc(a.id)}">Registrar interés</button><button class="small-btn" data-edit-receivable="${esc(a.id)}">Editar detalles</button>${!state.assetEntries.some(e=>e.kind==='receivable'&&e.targetId===a.id)?`<button class="small-btn danger" data-delete-receivable="${esc(a.id)}">Anular préstamo</button>`:''}</div>${assetEntryList('receivable',a.id)}</article>`;
  }).join('');
  return shell('Cuentas por cobrar',`<button class="back-link" data-route-go="accounts" type="button">‹ Volver a Cuentas</button><div class="section-head"><div><p class="section-kicker">Control de préstamos</p><h2 class="section-title">Dinero pendiente</h2></div><button class="link-btn" data-action="new-receivable">+ Registrar</button></div>${totals.pending>0?`<section class="asset-summary"><div><span>Total por cobrar</span><strong data-fit-amount data-max-size="28" data-min-size="15">${money(totals.pending)}</strong></div><div><span>Registros pendientes</span><strong>${totals.active}</strong></div></section>`:''}<p class="settings-note">Los préstamos y la devolución de capital no son ingresos ni gastos ordinarios. Los intereses efectivamente cobrados sí se registran como ingresos.</p><div class="list">${cards||'<div class="list-card empty">No tienes cuentas por cobrar. Puedes registrar la primera desde aquí.</div>'}</div>`);
}
function investmentSheet(existing){
  const inv=existing||{id:uid(),name:'',kind:'CETES',date:localDateKey(),notes:'',archived:false};
  openSheet(existing?'Editar inversión':'Nueva inversión',`<form id="investmentForm" class="form"><div class="field"><label>Nombre</label><input class="input" name="name" maxlength="100" value="${esc(inv.name)}" placeholder="Ej. CETES 28 días" required></div><div class="field"><label>Tipo</label><select name="kind">${['CETES','Fondos de inversión','Acciones','Criptomonedas','Depósitos a plazo','Otros'].map(k=>`<option value="${esc(k)}" ${inv.kind===k?'selected':''}>${esc(k)}</option>`).join('')}</select></div><div class="field"><label>Fecha inicial</label><input type="date" class="input" name="date" value="${esc(inv.date)}" required ${existing?'disabled':''}></div>${!existing?`<div class="field"><label>Capital inicial</label><input class="input" type="text" inputmode="decimal" name="amount" value="" placeholder="0.00" required></div><div class="field"><label>Cuenta de origen</label><select name="accountId">${cashAccountOptions()}</select></div>`:''}<div class="field"><label>Notas (opcional)</label><textarea class="input" name="notes" rows="2" maxlength="300">${esc(inv.notes||'')}</textarea></div><p class="settings-note">${existing?'Para cambiar importes utiliza Aportar, Retirar o Actualizar valor.':'El capital se descontará de la cuenta elegida, sin crear un gasto.'}</p><button class="primary-btn" type="submit">Guardar inversión</button></form>`);
  $('#investmentForm').onsubmit=e=>{
    e.preventDefault();const f=new FormData(e.currentTarget);const name=String(f.get('name')||'').trim();if(!name){showToast('Escribe un nombre');return}
    const next={...inv,name,kind:String(f.get('kind')),notes:String(f.get('notes')||'').trim()};
    if(!existing){
      let amount;try{amount=assetMoney(f.get('amount'))}catch(error){showToast(error.message);return}
      const accountId=String(f.get('accountId')),account=availableCashAccounts().find(a=>a.id===accountId);
      if(!account||!validDate(f.get('date'))){showToast('Selecciona fecha y cuenta válidas');return}
      if(CF.toCents(accountBalance(accountId))<CF.toCents(amount)){showToast('Saldo insuficiente en la cuenta elegida');return}
      next.date=String(f.get('date'));
      state.investments.push(next);
      state.assetEntries.push({id:uid(),kind:'investment',type:'contribution',targetId:next.id,amount,accountId,date:next.date,createdAt:new Date().toISOString()});
    }else state.investments=state.investments.map(x=>x.id===inv.id?next:x);
    if(save(existing?'Inversión actualizada':'Inversión registrada'))closeSheet();
  };
}
function investmentEntrySheet(id,type){
  const inv=state.investments.find(a=>a.id===id);if(!inv||inv.archived)return;
  const p=getMetrics().investmentPositions.get(id);
  const labels={contribution:'Aportar capital',withdrawal:'Retirar capital',payout:'Cobrar rendimiento',valuation:'Actualizar valor actual'};
  if(!labels[type])return;
  openSheet(labels[type],`<form id="investmentEntryForm" class="form"><p class="settings-note"><strong>${esc(inv.name)}</strong> · Valor actual: ${money(p.value)}</p><div class="field"><label>${type==='valuation'?'Nuevo valor total':'Importe'}</label><input class="input" name="amount" inputmode="decimal" type="text" placeholder="0.00" ${type==='valuation'?`value="${p.value}"`:''} required></div>${type!=='valuation'?`<div class="field"><label>${type==='contribution'?'Cuenta de origen':'Cuenta destino'}</label><select name="accountId">${cashAccountOptions()}</select></div>`:''}<div class="field"><label>Fecha</label><input class="input" type="date" name="date" value="${localDateKey()}" required></div><div class="field"><label>Nota (opcional)</label><input class="input" name="note" maxlength="200"></div><p class="settings-note">${type==='valuation'?'Actualizar el valor no mueve dinero ni registra ingreso.':type==='payout'?'El rendimiento cobrado aumenta la cuenta y cuenta como ingreso. Si sale del capital de la inversión, registra primero un retiro.':'Esta operación transfiere patrimonio sin contar como ingreso o gasto.'}</p><button class="primary-btn" type="submit">Guardar operación</button></form>`);
  $('#investmentEntryForm').onsubmit=e=>{
    e.preventDefault();const f=new FormData(e.currentTarget);let amount;
    try{amount=assetMoney(f.get('amount'),{allowZero:type==='valuation'})}catch(error){showToast(error.message);return}
    const accountId=String(f.get('accountId')||''),date=String(f.get('date'));
    if(!validDate(date)){showToast('Selecciona una fecha válida');return}
    if(type!=='valuation'&&!availableCashAccounts().some(x=>x.id===accountId)){showToast('Cuenta no válida');return}
    if(type==='contribution'&&CF.toCents(accountBalance(accountId))<CF.toCents(amount)){showToast('Saldo insuficiente');return}
    if(type==='withdrawal'&&CF.toCents(amount)>CF.toCents(p.value)){showToast('No puedes retirar más del valor actual');return}
    const entry={id:uid(),kind:'investment',type,targetId:id,amount,accountId:type==='valuation'?undefined:accountId,date,note:String(f.get('note')||'').trim(),createdAt:new Date().toISOString()};
    state.assetEntries.push(entry);
    if(save('Operación registrada'))closeSheet();
  };
}
function receivableSheet(existing){
  const loan=existing||{id:uid(),person:'',concept:'Préstamo personal',amount:0,date:localDateKey(),dueDate:'',accountId:availableCashAccounts()[0]?.id,notes:''};
  openSheet(existing?'Editar cuenta por cobrar':'Registrar dinero por cobrar',`<form id="receivableForm" class="form"><div class="field"><label>Persona que debe</label><input class="input" name="person" maxlength="100" value="${esc(loan.person)}" placeholder="Ej. Juan" required></div><div class="field"><label>Concepto</label><input class="input" name="concept" maxlength="140" value="${esc(loan.concept)}" required></div>${existing?`<p class="settings-note">Préstamo original: ${money(loan.amount)} · ${formatDate(loan.date)}. El importe original y la cuenta no pueden cambiarse después de registrarse.</p>`:`<div class="field"><label>Cantidad original</label><input class="input" type="text" inputmode="decimal" name="amount" placeholder="0.00" required></div><div class="field"><label>Cuenta de origen</label><select name="accountId">${cashAccountOptions(loan.accountId)}</select></div><div class="field"><label>Fecha del préstamo</label><input class="input" name="date" type="date" value="${esc(loan.date)}" required></div>`}<div class="field"><label>Fecha esperada de pago (opcional)</label><input class="input" name="dueDate" type="date" value="${esc(loan.dueDate||'')}"></div><div class="field"><label>Observaciones</label><textarea class="input" name="notes" maxlength="300" rows="2">${esc(loan.notes||'')}</textarea></div><p class="settings-note">Al registrar el préstamo baja el dinero disponible y aumenta por cobrar. No es un gasto.</p><button class="primary-btn" type="submit">Guardar</button></form>`);
  $('#receivableForm').onsubmit=e=>{
    e.preventDefault();const f=new FormData(e.currentTarget);const person=String(f.get('person')||'').trim(),concept=String(f.get('concept')||'').trim(),dueDate=String(f.get('dueDate')||'');
    if(!person||!concept||(dueDate&&!validDate(dueDate))){showToast('Revisa el nombre, concepto y fecha');return}
    const next={...loan,person,concept,notes:String(f.get('notes')||'').trim(),dueDate};
    if(!existing){
      let amount;try{amount=assetMoney(f.get('amount'))}catch(error){showToast(error.message);return}
      const accountId=String(f.get('accountId')),date=String(f.get('date'));
      if(!validDate(date)||!availableCashAccounts().some(a=>a.id===accountId)){showToast('Cuenta o fecha inválida');return}
      if(CF.toCents(accountBalance(accountId))<CF.toCents(amount)){showToast('Saldo insuficiente');return}
      Object.assign(next,{amount,accountId,date});state.receivables.push(next);
    }else state.receivables=state.receivables.map(x=>x.id===loan.id?next:x);
    if(save(existing?'Registro actualizado':'Dinero por cobrar registrado'))closeSheet();
  };
}
function receivableEntrySheet(id,type){
  const loan=state.receivables.find(a=>a.id===id),p=getMetrics().receivablePositions.get(id);
  if(!loan||!p||!['payment','interest'].includes(type))return;
  if(type==='payment'&&p.pending<=0){showToast('Este préstamo está liquidado');return}
  const title=type==='payment'?'Registrar abono':'Registrar interés cobrado';
  openSheet(title,`<form id="receivableEntryForm" class="form"><p class="settings-note">${esc(loan.person)} · Pendiente: ${money(p.pending)}</p><div class="field"><label>${type==='payment'?'Abono al capital':'Interés recibido'}</label><input class="input" name="amount" type="text" inputmode="decimal" placeholder="0.00" required></div><div class="field"><label>Cuenta que recibe</label><select name="accountId">${cashAccountOptions(loan.accountId)}</select></div><div class="field"><label>Fecha</label><input class="input" name="date" type="date" value="${localDateKey()}" required></div><div class="field"><label>Nota (opcional)</label><input class="input" name="note" maxlength="200"></div><p class="settings-note">${type==='payment'?'Recuperar capital disminuye lo que te deben; no crea un ingreso ordinario.':'Los intereses realmente cobrados sí cuentan como ingreso del mes.'}</p><button class="primary-btn" type="submit">Guardar abono</button></form>`);
  $('#receivableEntryForm').onsubmit=e=>{
    e.preventDefault();const f=new FormData(e.currentTarget);let amount;
    try{amount=assetMoney(f.get('amount'))}catch(error){showToast(error.message);return}
    const accountId=String(f.get('accountId')),date=String(f.get('date'));
    if(!validDate(date)||!availableCashAccounts().some(a=>a.id===accountId)){showToast('Cuenta o fecha inválida');return}
    if(type==='payment'&&CF.toCents(amount)>CF.toCents(p.pending)){showToast('El abono supera el saldo pendiente');return}
    state.assetEntries.push({id:uid(),kind:'receivable',type,targetId:id,amount,accountId,date,note:String(f.get('note')||'').trim(),createdAt:new Date().toISOString()});
    if(save('Abono guardado'))closeSheet();
  };
}
function archiveInvestment(id){
  const inv=state.investments.find(x=>x.id===id);if(!inv)return;
  const pos=getMetrics().investmentPositions.get(id);
  if(!inv.archived&&CF.toCents(pos.value)>0){showToast('Retira el valor restante antes de archivar');return}
  inv.archived=!inv.archived;save(inv.archived?'Inversión archivada':'Inversión reactivada');
}

function cancelInvestment(id){
  const inv=state.investments.find(x=>x.id===id),entries=state.assetEntries.filter(x=>x.kind==='investment'&&x.targetId===id);
  const pos=getMetrics().investmentPositions.get(id);
  if(!inv||entries.length!==1||entries[0].type!=='contribution'||CF.toCents(pos.value)!==CF.toCents(entries[0].amount)){
    showToast('Solo puede anularse una inversión sin operaciones adicionales. Para otras, retira el saldo y archívala.');return;
  }
  if(!confirm(`¿Anular ${inv.name}? Deshace la aportación registrada y regresa su importe al saldo calculado de la cuenta de origen.`))return;
  state.investments=state.investments.filter(x=>x.id!==id);
  state.assetEntries=state.assetEntries.filter(x=>x.id!==entries[0].id);
  save('Inversión anulada sin alterar otras operaciones');
}
function cancelReceivable(id){
  const loan=state.receivables.find(x=>x.id===id);
  if(!loan||state.assetEntries.some(x=>x.kind==='receivable'&&x.targetId===id)){
    showToast('Este préstamo tiene abonos registrados. No puede anularse; conserva su historial.');return;
  }
  if(!confirm(`¿Anular el préstamo a ${loan.person}? Se revertirá su efecto sobre el saldo de la cuenta de origen.`))return;
  state.receivables=state.receivables.filter(x=>x.id!==id);
  save('Préstamo anulado');
}
function accountsView(){
  const available=CF.sumMoney(state.accounts.filter(a=>['cash','bank','savings'].includes(a.type)).map(a=>accountBalance(a.id)));
  const debt=CF.sumMoney(state.accounts.filter(a=>a.type==='credit').map(a=>Math.max(0,-accountBalance(a.id))));
  const legacy=CF.sumMoney(state.accounts.filter(a=>a.type==='investment').map(a=>accountBalance(a.id)));
  const invested=CF.sumMoney([legacy,investmentTotals().value]);
  const pending=receivableTotals(),net=CF.sumMoney([CF.sumMoney(state.accounts.map(a=>accountBalance(a.id))),investmentTotals().value,pending.pending]);
  const hasReceivableHistory=state.receivables.length>0;
  return shell('Cuentas',`<div class="section-head"><p class="section-kicker">Tu dinero</p><button class="link-btn" data-action="new-account" type="button">+ Nueva</button></div><section class="grid-2 account-summary"><article class="stat-card"><div class="label">Disponible</div><div class="stat-value account-summary-value" data-fit-amount data-max-size="27" data-min-size="14">${money(available)}</div><small class="label">Efectivo, bancos y ahorros</small></article><article class="stat-card"><div class="label">Deuda de crédito</div><div class="stat-value account-summary-value negative" data-fit-amount data-max-size="27" data-min-size="14">${money(debt)}</div></article></section><section class="asset-overview"><h2 class="section-title">Resumen patrimonial</h2><div class="asset-summary asset-summary-compact"><div><span>Patrimonio neto</span><strong data-fit-amount data-max-size="28" data-min-size="15">${money(net)}</strong></div>${invested!==0?`<div><span>Inversiones</span><strong>${money(invested)}</strong></div>`:''}${pending.pending>0?`<div><span>Por cobrar</span><strong>${money(pending.pending)}</strong></div>`:''}</div><p class="settings-note">Patrimonio = saldos de cuentas, inversiones y dinero pendiente de cobrar. La deuda de crédito ya se resta mediante su saldo negativo.</p></section><div class="asset-directory"><button class="directory-card" type="button" data-route-go="investments"><span class="directory-symbol" aria-hidden="true">📈</span><span><strong>Inversiones</strong><small>Capital, rendimientos y valor actual</small></span><b aria-hidden="true">›</b></button>${pending.pending>0?`<button class="directory-card" type="button" data-route-go="receivables"><span class="directory-symbol" aria-hidden="true">🤝</span><span><strong>Cuentas por cobrar</strong><small>${money(pending.pending)} pendiente · ${pending.active} activas</small></span><b aria-hidden="true">›</b></button>`:`${hasReceivableHistory?`<button class="directory-card" type="button" data-route-go="receivables"><span class="directory-symbol" aria-hidden="true">📜</span><span><strong>Historial de cobros</strong><small>Préstamos liquidados y sus abonos</small></span><b aria-hidden="true">›</b></button>`:''}<button class="secondary-btn receivable-create" type="button" data-action="new-receivable">+ Registrar dinero por cobrar</button>`}</div><div class="section-head"><h2 class="section-title">Tus cuentas</h2></div><div class="list">${state.accounts.map(accountCard).join('')||'<div class="list-card empty">Agrega tu primera cuenta.</div>'}</div>`);
}
function accountCard(a){const b=accountBalance(a.id),icon={cash:"💵",bank:"🏦",savings:"🐷",investment:"📈",credit:"💳"}[a.type]||"🏦";if(a.type==="credit"){const debt=Math.max(0,-b),available=Math.max(0,CF.subtract(a.creditLimit,debt)+Math.max(0,b)),pct=a.creditLimit?Math.round(debt/a.creditLimit*100):0,due=daysUntilDay(a.dueDay);return `<article class="list-card credit-card"><div class="row-between"><div class="tx-left"><div class="tx-icon">${icon}</div><div><p class="tx-title">${esc(a.name)}</p><span class="tx-sub">Corte día ${a.cutDay||"—"} · Pago día ${a.dueDay||"—"}</span></div></div><div class="credit-card-actions"><button class="small-btn" data-pay-credit="${a.id}">Pagar</button><button class="small-btn" data-edit-account="${a.id}">Editar</button></div></div><div class="credit-metrics"><div><span>Deuda actual</span><b>${money(debt)}</b></div><div><span>Crédito disponible</span><b>${money(available)}</b></div></div><div class="row-between"><span class="label">Uso de línea</span><span class="percent">${pct}%</span></div><div class="progress"><span style="width:${Math.min(100,pct)}%"></span></div><div class="credit-payments"><span>Pago mínimo <b>${money(a.minimumPayment)}</b></span><span>Para no generar intereses <b>${money(a.noInterestPayment||0)}</b></span></div><p class="settings-note">Pagos mínimo y para no generar intereses: captura manual según tu estado de cuenta.${b>0?` Saldo a favor: ${money(b)}`:""}</p>${due!==null?`<div class="due-pill ${due<=state.reminderLeadDays?"urgent":""}">${due===0?"Vence hoy":`Faltan ${due} días para pagar`}</div>`:""}</article>`}return `<article class="list-card account-row"><div class="tx-left"><div class="tx-icon">${icon}</div><div><p class="tx-title">${esc(a.name)}</p><span class="tx-sub">${{cash:"Efectivo",bank:"Banco",savings:"Ahorro",investment:"Inversión"}[a.type]||"Cuenta"}</span></div></div><div style="text-align:right"><b>${money(b)}</b><div><button class="text-btn" data-edit-account="${a.id}">Editar</button></div></div></article>`}
function categorySettingsSection(kind,title,note,categories){
  const row=c=>`<div class="setting-row"><div><strong><span class="category-color" style="background:${esc(c.color||'#8395a7')}"></span>${esc(c.emoji)} ${esc(c.name)}</strong><small>${c.archived?'Archivada':c.system?'Predeterminada':'Personalizada'}</small></div><div class="actions"><button class="small-btn" type="button" data-edit-${kind}-category="${esc(c.id)}">Editar</button><button class="small-btn" type="button" data-archive-category="${esc(c.id)}" data-kind="${kind}">${c.archived?'Reactivar':'Archivar'}</button>${!c.system?`<button class="small-btn danger" type="button" data-delete-${kind}-category="${esc(c.id)}">Borrar</button>`:''}</div></div>`;
  const archived=categories.filter(c=>c.archived);
  return `<section class="settings-group category-settings"><div class="category-section-head"><div class="category-section-copy"><h3>${esc(title)}</h3><p class="settings-note">${esc(note)} Archivar oculta la categor\u00eda para nuevos movimientos, sin borrar el historial.</p></div><button class="small-btn category-add-btn" data-action="new-${kind}-category" type="button">+ Agregar</button></div><div class="category-list">${categories.filter(c=>!c.archived).map(row).join('')}</div>${archived.length?`<details class="archived-categories"><summary>Archivadas (${archived.length})</summary>${archived.map(row).join('')}</details>`:''}</section>`;
}
function categoryManagerView(kind){
  const isIncome=kind==='income';
  return shell(isIncome?'Ingresos':'Gastos',`<button class="back-link" data-route-go="settings" type="button">‹ Volver a Configuración</button>${categorySettingsSection(kind,isIncome?'Categorías de ingresos':'Categorías de gastos','Edita nombre, emoji y color sin afectar tus movimientos.',isIncome?incomeCategories():expenseCategories())}`);
}
function toggleCategoryArchive(kind,id){
  const list=kind==='income'?state.incomeCategories:state.expenseCategories,c=list.find(x=>x.id===id);if(!c)return;
  if(!c.archived&&list.filter(x=>!x.archived).length<=1){showToast('Conserva al menos una categor\u00eda activa');return}
  c.archived=!c.archived;save(c.archived?'Categor\u00eda archivada':'Categor\u00eda reactivada');
}
function settingsView(){
  return shell('Configuración',`<section class="settings-group"><h3>Perfil y privacidad</h3><div class="setting-row"><div><strong>Nombre</strong><small>${esc(state.userName)}</small></div><button class="small-btn" data-action="edit-name">Editar</button></div><div class="setting-row"><div><strong>Ocultar saldos</strong><small>Privacidad de cantidades</small></div><button class="switch ${state.privacy?'on':''}" data-action="privacy" aria-label="Ocultar saldos"></button></div><div class="setting-row"><div><strong>Face ID</strong><small>Bloqueo local; no cifra tu información</small></div><button class="switch ${loadSecurity().enabled?'on':''}" data-action="face-id" aria-label="Activar Face ID"></button></div>${loadSecurity().enabled&&!loadSecurity().recoveryHash?`<div class="setting-row"><div><strong>PIN de recuperación</strong><small>Configura recuperación por seguridad</small></div><button class="small-btn" data-action="set-recovery-pin">Configurar</button></div>`:''}</section><section class="settings-group"><h3>Apariencia</h3><p class="settings-note">Elige una paleta. La vista previa muestra fondo, tarjeta y acento antes de aplicarla.</p><div class="palette-grid">${palette('midnight','Midnight Premium',['#080b12','#121823','#65e998'])}${palette('graphite','Graphite',['#15171b','#272b31','#e3e6ea'])}${palette('ocean','Ocean Blue',['#06131a','#0d2530','#66dfff'])}${palette('emerald','Emerald',['#071913','#10352a','#5debab'])}${palette('ivory','Ivory',['#faf8f3','#fff','#386a55'])}${palette('light','Claro',['#f4f6fa','#fff','#117442'])}${palette('burgundy','Burgundy',['#1b0c14','#311c2b','#ff9ab6'])}${palette('amoled','AMOLED Black',['#000','#151515','#5cec9d'])}${palette('sandlight','Sand claro',['#f6f0e5','#fffaf2','#80542b'])}${palette('violet','Violeta',['#100b17','#21172d','#c7a8ff'])}${palette('sand','Bronce oscuro',['#17130e','#2a2117','#f3d18a'])}</div></section><section class="settings-group"><h3>Categorías</h3><button class="directory-card" type="button" data-route-go="categories-income"><span class="directory-symbol" aria-hidden="true">💵</span><span><strong>Categorías de ingresos</strong><small>${incomeCategories().filter(c=>!c.archived).length} activas · crear, editar y archivar</small></span><b aria-hidden="true">›</b></button><button class="directory-card" type="button" data-route-go="categories-expense"><span class="directory-symbol" aria-hidden="true">🧾</span><span><strong>Categorías de gastos</strong><small>${expenseCategories().filter(c=>!c.archived).length} activas · crear, editar y archivar</small></span><b aria-hidden="true">›</b></button></section><section class="settings-group"><h3>Respaldo y datos</h3><div class="setting-row"><div><strong>Exportar respaldo</strong><small>Movimientos, cuentas, inversiones, cobros y categorías</small></div><button class="small-btn" data-action="export">Exportar</button></div><div class="setting-row"><div><strong>Importar respaldo</strong><small>Muestra una vista previa antes de reemplazar</small></div><button class="small-btn" data-action="import">Importar</button></div><div class="setting-row"><div><strong>Exportar categorías</strong><small>Solo nombres, emojis y colores</small></div><button class="small-btn" data-action="export-categories">Exportar</button></div><div class="setting-row"><div><strong>Importar categorías</strong><small>Sin afectar movimientos</small></div><button class="small-btn" data-action="import-categories">Importar</button></div>${(localStorage.getItem(RESTORE_KEY)||localStorage.getItem(BACKUP_KEY)||localStorage.getItem(MIGRATION_KEY))?`<div class="setting-row"><div><strong>Recuperar datos anteriores</strong><small>Copias previas al guardado o importación</small></div><button class="small-btn" data-action="restore-previous">Revisar</button></div>`:''}<div class="setting-row"><div><strong>Restablecer aplicación</strong><small>Requiere confirmación y respaldo</small></div><button class="small-btn danger" data-action="reset">Borrar</button></div></section><section class="settings-group"><h3>Aplicación</h3><div class="setting-row"><div><strong>Buscar actualización</strong><small>Versión ${VERSION}</small></div><button class="small-btn" data-action="check-update">Buscar</button></div><div class="setting-row"><div><strong>Diagnóstico de pantalla</strong><small>${screenProfile()}</small></div><button class="small-btn" data-action="diagnostics">Ver medidas</button></div><div class="setting-row"><div><strong>ConFin</strong><small>Versión ${VERSION} · ${RELEASE}</small></div><span aria-hidden="true">✓</span></div></section><section class="settings-group"><h3>Privacidad de tus datos</h3><p class="settings-note">Los datos permanecen exclusivamente en este navegador y dominio. Cada iPhone es independiente. Exporta respaldos externos. Face ID es un bloqueo de privacidad y no cifra el almacenamiento.</p></section>`);
}
function movementSheet(existing=null,preset={}){
  existing=existing&&['income','expense','transfer'].includes(existing.type)?existing:null;
  const id=existing?.id||uid();let type=existing?.type||preset.type||'expense',submitted=false;
  const draft={amount:existing?.amount??preset.amount??'',accountId:existing?.accountId||preset.accountId||state.accounts.find(a=>a.type!=='credit')?.id||state.accounts[0]?.id,destinationId:existing?.destinationId||preset.destinationId,date:existing?.date||localDateKey(),note:existing?.note||preset.note||''};
  let expenseCatId=existing?.type==='expense'?existing.categoryId:preset.expenseCatId||expenseCategoryOptions()[0]?.id;
  let incomeCatId=existing?.type==='income'?existing.categoryId:preset.incomeCatId||incomeCategoryOptions()[0]?.id;
  const capture=()=>{const form=$('#movementForm');if(form)for(const [key,value] of new FormData(form))draft[key]=value};
  const draw=()=>{
    const selected=type==='income'?incomeCatId:expenseCatId,cats=(type==='income'?incomeCategories():expenseCategories()).filter(c=>!c.archived||c.id===selected);
    if(!draft.destinationId)draft.destinationId=state.accounts.find(a=>a.id!==draft.accountId)?.id;
    openSheet(existing?'Editar movimiento':preset.repeat?'Repetir movimiento':preset.destinationId?'Pagar tarjeta':'Nuevo movimiento',`<form id="movementForm" class="form"><div class="segmented" role="group" aria-label="Tipo">${[['expense','Gasto'],['income','Ingreso'],['transfer','Transferencia']].map(([v,l])=>`<button type="button" class="segment ${type===v?'active':''}" data-move-type="${v}" aria-pressed="${type===v}">${l}</button>`).join('')}</div><div class="field"><label for="txAmount">Monto</label><input id="txAmount" class="input amount-input" name="amount" type="text" inputmode="decimal" value="${esc(draft.amount)}" placeholder="0.00" autocomplete="off" required><small class="field-note">MXN. Usa punto para centavos.</small></div>${type!=='transfer'?`<div class="field"><label>Categor\u00eda</label><div class="category-grid">${cats.map(c=>`<button type="button" class="category-btn ${selected===c.id?'active':''}" data-movement-category="${esc(c.id)}" aria-pressed="${selected===c.id}"><b>${esc(c.emoji)}</b><span>${esc(c.name)}${c.archived?' (archivada)':''}</span></button>`).join('')}</div></div>`:''}<div class="field"><label for="txAccount">${type==='transfer'?'Cuenta origen':'Cuenta'}</label><select id="txAccount" name="accountId" required>${state.accounts.map(a=>`<option value="${esc(a.id)}" ${a.id===draft.accountId?'selected':''}>${esc(a.name)} \u00b7 ${a.type==='credit'?'Cr\u00e9dito':money(accountBalance(a.id))}</option>`).join('')}</select></div>${type==='transfer'?`<div class="field"><label for="txDestination">Cuenta destino</label><select id="txDestination" name="destinationId" required>${state.accounts.map(a=>`<option value="${esc(a.id)}" ${a.id===draft.destinationId?'selected':''}>${esc(a.name)}${a.type==='credit'?` \u00b7 Deuda ${money(Math.max(0,-accountBalance(a.id)))}`:''}</option>`).join('')}</select><small class="field-note">Las transferencias no generan ingresos ni gastos. Los pagos no pueden exceder la deuda pendiente.</small></div>`:''}<div class="form-grid"><div class="field"><label for="txDate">Fecha</label><input class="input" id="txDate" name="date" type="date" value="${esc(draft.date)}" required></div><div class="field"><label for="txNote">Nota</label><input class="input" id="txNote" name="note" value="${esc(draft.note)}" maxlength="250" placeholder="Opcional"></div></div><button class="primary-btn" type="submit">${existing?'Guardar cambios':'Guardar movimiento'}</button></form>`);
    modalRoot.querySelectorAll('[data-move-type]').forEach(b=>b.onclick=()=>{capture();type=b.dataset.moveType;draw()});
    modalRoot.querySelectorAll('[data-movement-category]').forEach(b=>b.onclick=()=>{if(type==='income')incomeCatId=b.dataset.movementCategory;else expenseCatId=b.dataset.movementCategory;modalRoot.querySelectorAll('.category-btn').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))})});
    $('#movementForm').onsubmit=e=>{
      e.preventDefault();if(submitted)return;capture();
      let amount;try{amount=CF.toCents(draft.amount)/100;if(amount<=0)throw new Error()}catch{showToast('Revisa el importe: positivo, hasta dos decimales y dentro del rango');return}
      if(!validDate(draft.date)){showToast('Selecciona una fecha v\u00e1lida');return}
      const accountId=draft.accountId,destinationId=draft.destinationId,source=state.accounts.find(a=>a.id===accountId),destination=state.accounts.find(a=>a.id===destinationId);
      if(!source||(type==='transfer'&&!destination)){showToast('Selecciona cuentas v\u00e1lidas');return}
      if(type==='transfer'&&accountId===destinationId){showToast('Elige cuentas diferentes');return}
      if(type==='transfer'&&source.type!=='credit'&&CF.toCents(balanceWithoutTransaction(accountId,existing))<CF.toCents(amount)){showToast('La cuenta de origen no tiene saldo suficiente');return}
      if(type==='transfer'&&destination.type==='credit'&&CF.toCents(amount)>CF.toCents(Math.max(0,-balanceWithoutTransaction(destinationId,existing)))){showToast('El pago supera la deuda pendiente');return}
      const c=type==='expense'?categoryById(expenseCatId):type==='income'?incomeCategoryById(incomeCatId):null;
      if(type!=='transfer'&&!c){showToast('Selecciona una categor\u00eda');return}
      const obj={...(existing||{}),id,type,amount,categoryId:c?.id||null,category:type==='transfer'?'Transferencia':c.name,categoryEmoji:c?.emoji||null,accountId,destinationId:type==='transfer'?destinationId:null,date:draft.date,note:String(draft.note||'').trim(),createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
      if(existing)state.transactions=state.transactions.map(t=>t.id===id?obj:t);else if(!state.transactions.some(t=>t.id===id))state.transactions.push(obj);
      submitted=true;
      if(save(existing?'Movimiento actualizado':'Movimiento guardado'))closeSheet();else submitted=false;
    };
  };draw();
}
function budgetSheet(existing){
  const all=expenseCategories(),selected=existing?.categoryId||expenseCategoryOptions()[0]?.id;
  const categories=all.filter(c=>!c.archived||c.id===selected),b=existing||{id:uid(),categoryId:selected,limit:'',month:budgetMonth||currentMonth()};
  openSheet(existing?'Editar presupuesto':'Nuevo presupuesto',`<form id="budgetForm" class="form"><div class="field"><label for="budgetCategory">Categor\u00eda</label><select id="budgetCategory" name="categoryId" required>${categories.map(c=>`<option value="${esc(c.id)}" ${c.id===selected?'selected':''}>${esc(c.emoji)} ${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label for="budgetLimit">L\u00edmite</label><input id="budgetLimit" class="input" name="limit" type="number" inputmode="decimal" min="0.01" step="0.01" value="${b.limit}" required></div><div class="field"><label for="budgetScope">Aplicar a</label><select id="budgetScope" name="scope"><option value="single" ${b.month&&b.month!=='recurring'?'selected':''}>Un mes espec\u00edfico</option><option value="recurring" ${!b.month||b.month==='recurring'?'selected':''}>Plantilla para todos los meses</option></select></div><div class="field" id="budgetPeriod"><label for="budgetMonthInput">Mes y a\u00f1o</label><input class="input" id="budgetMonthInput" name="month" type="month" value="${CF.validMonth(b.month)?b.month:budgetMonth||currentMonth()}"></div><p class="settings-note">Un presupuesto espec\u00edfico reemplaza la plantilla de esa categor\u00eda en ese mes. Editar una plantilla modifica todos los meses sin presupuesto espec\u00edfico.</p><button class="primary-btn" type="submit">Guardar presupuesto</button></form>`);
  const sync=()=>{$('#budgetPeriod').hidden=$('#budgetScope').value==='recurring'};$('#budgetScope').onchange=sync;sync();
  $('#budgetForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),c=categoryById(f.get('categoryId')),month=f.get('scope')==='recurring'?'recurring':f.get('month');
    if(!c||(month!=='recurring'&&!CF.validMonth(month))){showToast('Revisa categor\u00eda y mes');return}
    let limit;try{limit=CF.toCents(f.get('limit'))/100;if(limit<=0)throw new Error()}catch{showToast('Escribe un l\u00edmite positivo con hasta dos decimales');return}
    if(state.budgets.some(x=>x.id!==b.id&&x.categoryId===c.id&&(x.month||'recurring')===month)){showToast('Ya existe un presupuesto de esa categor\u00eda y periodo');return}
    const obj={...b,categoryId:c.id,category:c.name,limit,month};
    if(existing)state.budgets=state.budgets.map(x=>x.id===b.id?obj:x);else state.budgets.push(obj);
    if(save('Presupuesto guardado'))closeSheet();
  };
}
function goalSheet(existing){const g=existing||{id:uid(),name:"",target:"",saved:0};const targetValue=g.target||"",savedValue=g.saved||"";openSheet(existing?"Editar meta":"Nueva meta",`<form id="goalForm" class="form" novalidate><div class="field"><label for="goalName">Nombre</label><input class="input" id="goalName" name="name" type="text" value="${esc(g.name)}" placeholder="Ej. Viaje" autocomplete="off" required></div><div class="field"><label for="goalTarget">Objetivo</label><input class="input money-field" id="goalTarget" name="target" type="text" inputmode="decimal" value="${targetValue}" placeholder="0.00" autocomplete="off" enterkeyhint="next" required></div><div class="field"><label for="goalSaved">Ahorrado</label><input class="input money-field" id="goalSaved" name="saved" type="text" inputmode="decimal" value="${savedValue}" placeholder="0.00" autocomplete="off" enterkeyhint="done"></div><div class="field"><label for="goalTargetDate">Fecha objetivo (opcional)</label><input class="input" id="goalTargetDate" name="targetDate" type="date" value="${esc(g.targetDate||'')}"></div><p class="settings-note">Cantidad ahorrada informativa: no mueve dinero entre cuentas.</p><p class="form-error" id="goalError" role="alert" hidden></p><button class="primary-btn" type="submit">Guardar meta</button></form>`);const form=$("#goalForm"),error=$("#goalError"),parseAmount=value=>Number(String(value||"").trim().replace(/\s/g,"").replace(/,/g,""));form.onsubmit=e=>{e.preventDefault();const f=new FormData(form),name=String(f.get("name")||"").trim(),target=parseAmount(f.get("target")),saved=parseAmount(f.get("saved"));error.hidden=true;if(!name){error.textContent="Escribe un nombre para la meta.";error.hidden=false;$("#goalName").focus();return}if(!Number.isFinite(target)||target<=0){error.textContent="Escribe un objetivo mayor a $0.00.";error.hidden=false;$("#goalTarget").focus();return}if(!Number.isFinite(saved)||saved<0){error.textContent="El monto ahorrado no puede ser negativo.";error.hidden=false;$("#goalSaved").focus();return}const obj={...g,name,target,saved,targetDate:String(f.get("targetDate")||"")};if(existing)state.goals=state.goals.map(x=>x.id===g.id?obj:x);else state.goals.push(obj);if(save(existing?"Meta actualizada":"Meta guardada"))closeSheet()}}
function accountSheet(existing){
  const a=existing||{id:uid(),name:"",type:"bank",balance:0,creditLimit:0,cutDay:0,dueDay:0,minimumPayment:0,noInterestPayment:0,reminders:true};
  const currentDebt=a.type==="credit"?Math.max(0,-accountBalance(a.id)):0;
  openSheet(existing?"Editar cuenta":"Nueva cuenta",`<form id="accountForm" class="form"><div class="field"><label>Nombre</label><input class="input" name="name" value="${esc(a.name)}" placeholder="Ej. BBVA Azul" required></div><div class="field"><label>Tipo</label><select name="type" id="accountType">${[["cash","Efectivo"],["bank","Banco"],["savings","Ahorro"],["investment","Inversión"],["credit","Tarjeta de crédito"]].map(([v,l])=>`<option value="${v}" ${a.type===v?"selected":""}>${l}</option>`).join("")}</select></div><div class="field" id="standardBalanceField" style="display:${a.type==="credit"?"none":"block"}"><label>Saldo inicial (no saldo actual)</label><input class="input" name="balance" type="number" step=".01" value="${a.type==="credit"?0:a.balance}"></div><div id="creditFields" style="display:${a.type==="credit"?"grid":"none"};gap:16px"><div class="field"><label>Deuda actual</label><input class="input" name="currentDebt" type="number" min="0" step=".01" value="${currentDebt}"><small class="field-note">Escribe lo que debes hoy. Los pagos desde otra cuenta reducirán esta deuda automáticamente.</small></div><div class="field"><label>Límite de crédito</label><input class="input" name="creditLimit" type="number" min="0" step=".01" value="${a.creditLimit}"></div><div class="form-grid"><div class="field"><label>Día de corte</label><input class="input" name="cutDay" type="number" min="1" max="31" value="${a.cutDay||""}"></div><div class="field"><label>Día límite de pago</label><input class="input" name="dueDay" type="number" min="1" max="31" value="${a.dueDay||""}"></div></div><div class="form-grid"><div class="field"><label>Pago mínimo</label><input class="input" name="minimumPayment" type="number" min="0" step=".01" value="${a.minimumPayment||0}"></div><div class="field"><label>Pago para no generar intereses</label><input class="input" name="noInterestPayment" type="number" min="0" step=".01" value="${a.noInterestPayment||0}"></div></div><label class="check-row"><input type="checkbox" name="reminders" ${a.reminders!==false?"checked":""}> Recordarme antes de la fecha límite</label></div><button class="primary-btn">Guardar cuenta</button>${existing&&state.accounts.length>1?`<button type="button" class="secondary-btn negative" id="deleteAccount">Eliminar cuenta</button>`:""}</form>`);
  if(existing&&(state.transactions.some(t=>t.accountId===a.id||t.destinationId===a.id)||state.receivables.some(x=>x.accountId===a.id)||state.assetEntries.some(x=>x.accountId===a.id))){$("#accountType").insertAdjacentHTML("afterend",'<small class="field-note">Cambiar tipo a una cuenta con movimientos requiere una cuenta nueva.</small>')}
  const syncType=()=>{const credit=$("#accountType").value==="credit";$("#creditFields").style.display=credit?"grid":"none";$("#standardBalanceField").style.display=credit?"none":"block"};
  $("#accountType").onchange=syncType;
  $("#accountForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),type=f.get("type");if(existing&&type!==existing.type&&(state.transactions.some(t=>t.accountId===a.id||t.destinationId===a.id)||state.receivables.some(x=>x.accountId===a.id)||state.assetEntries.some(x=>x.accountId===a.id))){showToast("No cambies el tipo de una cuenta con movimientos; crea otra cuenta.");return}const desiredDebt=Math.max(0,Number(f.get("currentDebt")||0)),delta=existing?accountTransactionDelta(a.id):0,balance=type==="credit"?(existing&&accountBalance(a.id)>0&&desiredDebt===0?a.balance:-desiredDebt-delta):Number(f.get("balance")||0),obj={...a,name:String(f.get("name")||"").trim(),type,balance,creditLimit:Number(f.get("creditLimit")||0),cutDay:Number(f.get("cutDay")||0),dueDay:Number(f.get("dueDay")||0),minimumPayment:Number(f.get("minimumPayment")||0),noInterestPayment:Number(f.get("noInterestPayment")||0),reminders:f.get("reminders")==="on"};if(existing)state.accounts=state.accounts.map(x=>x.id===a.id?obj:x);else state.accounts.push(obj);if(save("Cuenta guardada"))closeSheet()};
  const del=$("#deleteAccount");if(del)del.onclick=()=>{const links=(state.transactions.filter(t=>t.accountId===a.id||t.destinationId===a.id).length+state.receivables.filter(x=>x.accountId===a.id).length+state.assetEntries.filter(x=>x.accountId===a.id).length);if(links){alert(`Esta cuenta tiene ${links} movimientos relacionados. Para conservar tus saldos e historial no puede eliminarse. Puedes editar su nombre.`);return}if(confirm("¿Eliminar esta cuenta sin movimientos relacionados?")){state.accounts=state.accounts.filter(x=>x.id!==a.id);if(save("Cuenta eliminada"))closeSheet()}}
}
function categorySheet(kind,existing){const isIncome=kind==="income",list=isIncome?incomeCategories():expenseCategories(),c=existing||{id:`custom-${kind}-${uid()}`,name:"",emoji:"",color:"#8395a7",system:false};openSheet(existing?"Editar categoría":`Nueva categoría de ${isIncome?"ingreso":"gasto"}`,`<form id="categoryForm" class="form"><div class="field"><label>Emoji</label><input class="input emoji-input" name="emoji" value="${esc(c.emoji)}" placeholder="Ej. ${isIncome?"💵":"🐶"}" required></div><div class="field"><label>Nombre</label><input class="input" name="name" value="${esc(c.name)}" placeholder="Ej. ${isIncome?"Freelance":"Mascotas"}" maxlength="40" required></div><div class="field"><label>Color</label><input class="input color-input" name="color" type="color" value="${esc(c.color||"#8395a7")}"></div><button class="primary-btn">${existing?"Guardar cambios":"Agregar categoría"}</button></form>`);$("#categoryForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),name=String(f.get("name")||"").trim(),emoji=String(f.get("emoji")||"").trim(),color=String(f.get("color")||"#8395a7");if(!name||!emoji){showToast("Escribe un nombre y un emoji");return}if(list.some(x=>x.id!==c.id&&x.name.toLocaleLowerCase("es-MX")===name.toLocaleLowerCase("es-MX"))){showToast("Ya existe una categoría con ese nombre");return}const obj={...c,name,emoji,color,createdAt:c.createdAt||new Date().toISOString()};if(isIncome)state.incomeCategories=existing?state.incomeCategories.map(x=>x.id===c.id?obj:x):[...state.incomeCategories,obj];else state.expenseCategories=existing?state.expenseCategories.map(x=>x.id===c.id?obj:x):[...state.expenseCategories,obj];state.transactions=state.transactions.map(t=>t.type===kind&&t.categoryId===c.id?{...t,category:name,categoryEmoji:emoji}:t);if(!isIncome)state.budgets=state.budgets.map(b=>b.categoryId===c.id?{...b,category:name}:b);if(save(existing?"Categoría actualizada":"Categoría agregada"))closeSheet()}}
function deleteCategoryFlow(kind,c){const isIncome=kind==="income",txCount=state.transactions.filter(t=>t.type===kind&&t.categoryId===c.id).length,budgetCount=isIncome?0:state.budgets.filter(b=>b.categoryId===c.id).length;if(!txCount&&!budgetCount){if(confirm(`¿Borrar ${c.emoji} ${c.name}?`)){if(isIncome)state.incomeCategories=state.incomeCategories.filter(x=>x.id!==c.id);else state.expenseCategories=state.expenseCategories.filter(x=>x.id!==c.id);save("Categoría eliminada")}return}const choices=(isIncome?incomeCategoryOptions():expenseCategoryOptions()).filter(x=>x.id!==c.id);openSheet("Reasignar categoría",`<form id="reassignCategoryForm" class="form"><p class="settings-note">${esc(c.emoji)} ${esc(c.name)} se usa en ${txCount} movimiento(s)${budgetCount?` y ${budgetCount} presupuesto(s)`:""}. Elige otra categoría para conservar todo.</p><div class="field"><label>Mover a</label><select name="targetId">${choices.map(x=>`<option value="${x.id}">${esc(x.emoji)} ${esc(x.name)}</option>`).join("")}</select></div><button class="primary-btn">Reasignar y eliminar</button></form>`);$("#reassignCategoryForm").onsubmit=e=>{e.preventDefault();const target=(isIncome?incomeCategoryById:categoryById)(new FormData(e.currentTarget).get("targetId"));if(!target)return;if(!isIncome&&state.budgets.some(b=>b.categoryId===c.id&&state.budgets.some(other=>other.categoryId===target.id&&(other.month||'recurring')===(b.month||'recurring')))){showToast('Hay presupuestos que se duplicar\u00edan. Edita esos presupuestos o archiva la categor\u00eda.');return}state.transactions=state.transactions.map(t=>t.type===kind&&t.categoryId===c.id?{...t,categoryId:target.id,category:target.name,categoryEmoji:target.emoji}:t);if(!isIncome)state.budgets=state.budgets.map(b=>b.categoryId===c.id?{...b,categoryId:target.id,category:target.name}:b);if(isIncome)state.incomeCategories=state.incomeCategories.filter(x=>x.id!==c.id);else state.expenseCategories=state.expenseCategories.filter(x=>x.id!==c.id);if(save("Categoría reasignada y eliminada"))closeSheet()}}
let pendingImport=null;
function downloadJSON(payload,name){
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const link=document.createElement("a"),url=URL.createObjectURL(blob);
  link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function exportBackup(){
  if(window.__confinStorageBlocked)return exportOriginalData();
  const safe=clone(state);delete safe.security;delete safe.credentialId;delete safe.recoveryHash;delete safe.recoverySalt;
  downloadJSON({app:'ConFin',version:VERSION,exportedAt:new Date().toISOString(),data:safe},`ConFin-respaldo-${localDateKey()}-${Date.now()}.json`);
  try{localStorage.setItem(LAST_EXPORT_KEY,new Date().toISOString())}catch{}
  showToast('Descarga iniciada. Comprueba el archivo en Archivos.');
}
function exportOriginalData(){
  const text=localStorage.getItem(KEY)||localStorage.getItem(window.__confinLegacyKey)||'';
  downloadJSON({app:'ConFin',type:'recovery-original',version:VERSION,createdAt:new Date().toISOString(),rawData:text},`ConFin-original-recuperacion-${localDateKey()}.json`);
  showToast('Se export\u00f3 el original sin alterarlo. No es un respaldo listo para importar.');
}
function exportCategories(){
  downloadJSON({app:"ConFin",type:"categories",version:VERSION,expenseCategories:state.expenseCategories,incomeCategories:state.incomeCategories},`ConFin-categorias-${localDateKey()}.json`);
  showToast("Archivo de categorías generado");
}
function countsOf(d){
  return `Cuentas: ${d.accounts.length} · Movimientos: ${d.transactions.length} · Inversiones: ${(d.investments||[]).length} · Por cobrar: ${(d.receivables||[]).length} · Abonos y operaciones: ${(d.assetEntries||[]).length} · Presupuestos: ${d.budgets.length} · Metas: ${d.goals.length} · Categorías: ${(d.expenseCategories?.length||0)+(d.incomeCategories?.length||0)}`;
}
function previewImport(next,title="Revisar restauración"){
  pendingImport=clone(next);
  openSheet(title,`<div class="import-preview"><p>El archivo pasó la validación de estructura. <strong>Esta operación reemplaza todos tus datos locales.</strong> No sincroniza dispositivos.</p><div class="preview-box"><span>En este teléfono ahora</span><p>${esc(countsOf(state))}</p></div><div class="preview-box"><span>Contenido del archivo</span><p>${esc(countsOf(next))}</p></div><p>Antes de continuar, exporta un respaldo y comprueba que se descargó correctamente.</p><button class="primary-btn" type="button" data-action="confirm-import">Sí, reemplazar datos</button><button class="secondary-btn" type="button" data-close>Cancelar</button></div>`);
}
function saveRestorePoint(){
  const text=localStorage.getItem(KEY);
  if(text){localStorage.setItem(RESTORE_KEY,text);if(localStorage.getItem(RESTORE_KEY)!==text)throw new Error('No se verific\u00f3 la copia anterior.')}
}
function confirmPendingImport(){
  if(!pendingImport||!confirm('Se reemplazar\u00e1n los datos de este dispositivo. \u00bfYa guardaste un respaldo y deseas continuar?'))return;
  try{saveRestorePoint()}catch{showToast('No hay espacio para conservar el original. Exporta una copia antes de continuar.');return}
  const oldBlocked=window.__confinStorageBlocked,before=clone(state);
  window.__confinStorageBlocked=false;state=clone(pendingImport);
  // Replacement is explicit, but a concurrent change still requires another preview.
  const ok=save(`Respaldo restaurado: ${state.transactions.length} movimientos`);
  if(!ok){window.__confinStorageBlocked=oldBlocked;state=before;return}
  pendingImport=null;window.__confinRecoveryKey=null;closeSheet();route='home';render();
}
function okMessage(before,after){return `Respaldo restaurado: ${after.transactions.length} movimientos`}
function previewPrevious(){
  const choices=[RESTORE_KEY,BACKUP_KEY,BACKUP2_KEY,MIGRATION_KEY].map(key=>({key,text:localStorage.getItem(key)})).filter(x=>x.text).map(x=>({...x,data:parseStored(x.text)})).filter(x=>x.data);
  if(!choices.length){showToast('No hay copias locales v\u00e1lidas. Usa un respaldo externo.');return}
  openSheet('Copias locales',`<p class="settings-note">Son estados anteriores, no una nube. Restaurarlos reemplaza los movimientos actuales. Exporta antes.</p><div class="list">${choices.map((c,i)=>`<button class="secondary-btn" type="button" data-recovery-index="${i}">${i===0?'Copia disponible':'Copia anterior'}<small class="field-note">${esc(countsOf(c.data))}</small></button>`).join('')}</div>`);
  modalRoot.querySelectorAll('[data-recovery-index]').forEach(button=>button.onclick=()=>previewImport(choices[+button.dataset.recoveryIndex].data));
}
function resetApplication(){
  const answer=prompt("Para borrar los datos locales, escribe exactamente BORRAR. Antes guarda un respaldo en Archivos:");
  if(answer!=="BORRAR")return;
  try{saveRestorePoint()}catch{showToast("No hay espacio para la copia de recuperación. Exporta primero.");return}
  const previous=clone(state);state=baseData();
  if(save("Aplicación restablecida")){route="home";render()}
  else state=previous;
}
function settingsAction(action){
  if(action==="new-movement")movementSheet();
  if(action==="new-investment")investmentSheet();
  if(action==="new-receivable")receivableSheet();
  if(action==="privacy"){state.privacy=!state.privacy;save()}
  if(action==="settings"){route="settings";render()}
  if(action==="edit-name"){const n=prompt("Tu nombre",state.userName);if(n?.trim()){state.userName=n.trim();save("Nombre actualizado")}}
  if(action==="notifications")toggleNotifications();
  if(action==="face-id")toggleFaceId().catch(()=>showToast("No se pudo configurar el acceso en este navegador"));
  if(action==="set-recovery-pin")setRecoveryPin().catch(()=>showToast("No se pudo configurar el PIN; no se ha cambiado tu acceso"));
  if(action==="export")exportBackup();
  if(action==="import")$("#importFile")?.click();
  if(action==="export-categories")exportCategories();
  if(action==="import-categories")$("#importCategoriesFile")?.click();
  if(action==="confirm-import")confirmPendingImport();
  if(action==="restore-previous")previewPrevious();
  if(action==="reset")resetApplication();
  if(action==='toggle-history'){historyOpen=!historyOpen;const panel=$('#historyPanel'),button=view.querySelector('[data-action="toggle-history"]');if(panel)panel.hidden=!historyOpen;if(button){button.setAttribute('aria-expanded',String(historyOpen));button.lastElementChild.textContent=historyOpen?'\u2303':'\u2304'}requestAnimationFrame(fitAmounts)}
  if(action==='clear-filters'){filter='all';transactionSearch='';transactionMonth='all';transactionAccount='all';transactionCategory='all';listLimit=40;render()}
  if(action==='diagnostics')diagnosticsSheet();
  if(action==='export-original')exportOriginalData();
  if(action==='show-update')showUpdateDetails();
  if(action==="more-transactions"){listLimit+=40;const el=$("#transactionResults");if(el){el.innerHTML=transactionResults();requestAnimationFrame(fitAmounts)}}
  if(action==="update-app")refreshApplication();
  if(action==="check-update")checkForUpdates(true);
}
function compareVersions(a,b){const pa=String(a).split(".").map(Number),pb=String(b).split(".").map(Number);for(let i=0;i<Math.max(pa.length,pb.length);i++){const d=(pa[i]||0)-(pb[i]||0);if(d)return d}return 0}
async function checkForUpdates(manual=false){
  if(!manual&&Date.now()-(checkForUpdates.last||0)<60000)return;
  checkForUpdates.last=Date.now();
  try{
    const r=await fetch(`version.json?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error();
    const info=await r.json();
    if(compareVersions(info.version,VERSION)>0){latestVersionInfo=info;renderUpdateNotice();if(manual&&!modalRoot.firstElementChild)showUpdateDetails()}
    else if(manual)showToast('ConFin est\u00e1 actualizado');
  }catch{if(manual)showToast('No se pudo consultar la versi\u00f3n. Puedes seguir usando ConFin.')}
}
function renderUpdateNotice(){
  const host=$('#updateNotice');if(!host)return;
  if(window.__confinStorageBlocked){host.innerHTML='<button class="update-banner" data-action="export-original" type="button">Datos en recuperaci\u00f3n. Exportar original</button>';return}
  host.innerHTML=latestVersionInfo?`<button class="update-banner" data-action="show-update" type="button">Nueva versi\u00f3n ${esc(latestVersionInfo.version)} disponible \u00b7 Ver novedades</button>`:'';
}
function showUpdateDetails(){
  if(!latestVersionInfo)return;
  if(modalRoot.querySelector('form')){showToast('Guarda o cierra el formulario antes de actualizar.');return}
  const info=latestVersionInfo;
  openSheet('Nueva versi\u00f3n disponible',`<div class="update-card"><p>ConFin ${esc(info.version)}</p><p>${esc(info.message||'Mejoras disponibles.')}</p><ul class="update-list">${(Array.isArray(info.changes)?info.changes:[]).map(c=>`<li>${esc(c)}</li>`).join('')}</ul><button class="primary-btn" data-action="update-app" type="button">Actualizar ahora</button><button class="secondary-btn" data-close type="button">M\u00e1s tarde</button><p class="settings-note">La actualizaci\u00f3n no borra tus datos. Conserva tambi\u00e9n un respaldo externo.</p></div>`);
}
async function refreshApplication(){
  if(modalRoot.querySelector('form')){showToast('Guarda o cancela el formulario primero.');return}
  const button=modalRoot.querySelector('[data-action="update-app"]');if(button)button.disabled=true;
  try{
    if('serviceWorker' in navigator){
      const registration=await navigator.serviceWorker.getRegistration();
      if(registration){
        await registration.update();
        if(registration.installing)await new Promise((resolve,reject)=>{
          const worker=registration.installing,timer=setTimeout(()=>reject(new Error('La descarga todav\u00eda no termina. Reintenta con conexi\u00f3n.')),20000);
          const changed=()=>{if(worker.state==='installed'){clearTimeout(timer);resolve()}else if(worker.state==='redundant'){clearTimeout(timer);reject(new Error('La descarga fall\u00f3. La versi\u00f3n actual sigue disponible.'))}};
          worker.addEventListener('statechange',changed);changed();
        });
        if(registration.waiting)await new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>reject(new Error('La nueva versi\u00f3n a\u00fan no est\u00e1 activa.')),15000);
          navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timer);resolve()},{once:true});
          registration.waiting.postMessage({type:'SKIP_WAITING'});
        });
      }
    }
    location.reload();
  }catch(e){showToast(e.message||'No se complet\u00f3 la actualizaci\u00f3n; tus datos no se modificaron.');if(button)button.disabled=false}
}
async function notifyLocally(title,body){
  if(!('Notification' in window)||Notification.permission!=='granted')return false;
  try{
    const registration='serviceWorker' in navigator?await navigator.serviceWorker.getRegistration():null;
    if(registration?.active&&registration.showNotification){await registration.showNotification(title,{body,icon:'icons/icon-192.png'});return true}
    new Notification(title,{body,icon:'icons/icon-192.png'});return true;
  }catch{return false}
}
async function toggleNotifications(){
  if(state.notifications){state.notifications=false;save('Notificaciones desactivadas');return}
  if(!('Notification' in window)){showToast('Este dispositivo no admite notificaciones web');return}
  try{state.notifications=(await Notification.requestPermission())==='granted';
    if(!save(state.notifications?'Permiso de notificaciones concedido':'Permiso no concedido'))return;
    if(state.notifications&&!(await notifyLocally('ConFin','Avisos locales al abrir la app. No son recordatorios con la app cerrada.')))showToast('El navegador no pudo mostrar la prueba. Los avisos siguen dentro de ConFin.');
  }catch{showToast('No se pudo activar este permiso; puedes seguir usando ConFin.')}
}
async function checkDueNotifications(){
  try{
    const list=creditReminders();if(!state.notifications||!('Notification' in window)||Notification.permission!=='granted'||!list.length)return;
    const key=`confin-notified-${localDateKey()}`;if(sessionStorage.getItem(key))return;
    const r=list[0],shown=await notifyLocally(`Pago pr\u00f3ximo: ${r.account.name}`,r.due===0?'Tu pago vence hoy.':`Tu pago vence en ${r.due} d\u00edas.`);
    if(shown)sessionStorage.setItem(key,'1');
  }catch{/* Optional notification must never interrupt the app. */}
}

document.addEventListener('change',e=>{
  if(e.target.matches('[data-action="lead-days"]')){state.reminderLeadDays=Number(e.target.value);save('Recordatorio actualizado')}
  if(e.target.id==='transactionAccount'){transactionAccount=e.target.value;listLimit=40;updateTransactionResults()}
  if(e.target.id==='transactionCategory'){transactionCategory=e.target.value;listLimit=40;updateTransactionResults()}
});
document.addEventListener("input",e=>{
  if(e.target.id==="transactionSearch"){
    transactionSearch=e.target.value;listLimit=40;
    const list=$("#transactionResults");if(list){list.innerHTML=transactionResults();requestAnimationFrame(fitAmounts)}
  }
});
document.addEventListener("click",e=>{
  if(document.body.classList.contains('app-locked')&&!e.target.closest('#lockScreen'))return;
  const step=e.target.closest('[data-month-step]');
  if(step){const context=step.dataset.context,current=selectedMonth(context);setSelectedMonth(context,current==='all'?currentMonth():CF.shiftMonth(current,Number(step.dataset.monthStep)));return}
  const pick=e.target.closest('[data-month-picker]');if(pick){monthPicker(pick.dataset.monthPicker);return}
  const set=e.target.closest('[data-month-set]');if(set){setSelectedMonth(set.dataset.context,set.dataset.monthSet);return}
  const archive=e.target.closest('[data-archive-category]');
  if(archive){toggleCategoryArchive(archive.dataset.kind,archive.dataset.archiveCategory);return}
  const nav=e.target.closest("[data-route]");
  if(nav){hideToast();closeSheet();route=nav.dataset.route;render();return}
  const go=e.target.closest("[data-route-go]");
  if(go){hideToast();closeSheet();route=go.dataset.routeGo;render();return}
  const close=e.target.closest("[data-close]");
  if(close||e.target.classList.contains("modal-backdrop")){pendingImport=null;closeSheet();return}
  const action=e.target.closest("[data-action]")?.dataset.action;
  if(action){
    if(action==="new-budget")budgetSheet();
    else if(action==="new-goal")goalSheet();
    else if(action==="new-account")accountSheet();
    else if(action==="new-expense-category")categorySheet("expense");
    else if(action==="new-income-category")categorySheet("income");
    else settingsAction(action);
    return;
  }
  const filt=e.target.closest("[data-filter]");
  if(filt){filter=filt.dataset.filter;listLimit=40;render();return}
  const repeat=e.target.closest("[data-repeat-transaction]");
  if(repeat){
    const old=state.transactions.find(x=>x.id===repeat.dataset.repeatTransaction);
    if(old)movementSheet(null,{repeat:true,type:old.type,amount:old.amount,accountId:old.accountId,destinationId:old.destinationId,expenseCatId:old.type==="expense"?old.categoryId:null,incomeCatId:old.type==="income"?old.categoryId:null,note:old.note});
    return;
  }
  const et=e.target.closest("[data-edit-transaction]");
  if(et){movementSheet(state.transactions.find(x=>x.id===et.dataset.editTransaction));return}
  const dt=e.target.closest("[data-delete-transaction]");
  if(dt&&confirm("¿Borrar este movimiento?")){
    state.transactions=state.transactions.filter(x=>x.id!==dt.dataset.deleteTransaction);save("Movimiento eliminado");return;
  }
  const eb=e.target.closest("[data-edit-budget]");
  if(eb){budgetSheet(state.budgets.find(x=>x.id===eb.dataset.editBudget));return}
  const db=e.target.closest("[data-delete-budget]");
  if(db&&confirm("¿Borrar este presupuesto? Tus movimientos no se eliminarán.")){
    state.budgets=state.budgets.filter(x=>x.id!==db.dataset.deleteBudget);save("Presupuesto eliminado");return;
  }
  const eg=e.target.closest("[data-edit-goal]");
  if(eg){goalSheet(state.goals.find(x=>x.id===eg.dataset.editGoal));return}
  const dg=e.target.closest("[data-delete-goal]");
  if(dg&&confirm("¿Borrar esta meta?")){
    state.goals=state.goals.filter(x=>x.id!==dg.dataset.deleteGoal);save("Meta eliminada");return;
  }
  const ec=e.target.closest("[data-edit-expense-category]");
  if(ec){categorySheet("expense",categoryById(ec.dataset.editExpenseCategory));return}
  const dc=e.target.closest("[data-delete-expense-category]");
  if(dc){const c=categoryById(dc.dataset.deleteExpenseCategory);if(c&&!c.system)deleteCategoryFlow("expense",c);return}
  const ic=e.target.closest("[data-edit-income-category]");
  if(ic){categorySheet("income",incomeCategoryById(ic.dataset.editIncomeCategory));return}
  const dic=e.target.closest("[data-delete-income-category]");
  if(dic){const c=incomeCategoryById(dic.dataset.deleteIncomeCategory);if(c&&!c.system)deleteCategoryFlow("income",c);return}
  const pc=e.target.closest("[data-pay-credit]");
  if(pc){const card=state.accounts.find(x=>x.id===pc.dataset.payCredit);movementSheet(null,{type:"transfer",destinationId:card?.id,note:card?`Pago ${card.name}`:"Pago de tarjeta"});return}
  const ie=e.target.closest('[data-investment-entry]');
  if(ie){investmentEntrySheet(ie.dataset.investmentId,ie.dataset.investmentEntry);return}
  const ei=e.target.closest('[data-edit-investment]');
  if(ei){investmentSheet(state.investments.find(a=>a.id===ei.dataset.editInvestment));return}
  const di=e.target.closest('[data-delete-investment]');
  if(di){cancelInvestment(di.dataset.deleteInvestment);return}
  const dr=e.target.closest('[data-delete-receivable]');
  if(dr){cancelReceivable(dr.dataset.deleteReceivable);return}
  const ai=e.target.closest('[data-archive-investment]');
  if(ai){archiveInvestment(ai.dataset.archiveInvestment);return}
  const re=e.target.closest('[data-receivable-entry]');
  if(re){receivableEntrySheet(re.dataset.receivableId,re.dataset.receivableEntry);return}
  const er=e.target.closest('[data-edit-receivable]');
  if(er){receivableSheet(state.receivables.find(a=>a.id===er.dataset.editReceivable));return}
  const ea=e.target.closest("[data-edit-account]");
  if(ea){accountSheet(state.accounts.find(x=>x.id===ea.dataset.editAccount));return}
  const th=e.target.closest("button[data-theme]");
  if(th){hideToast();state.theme=th.dataset.theme;save()}
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&document.querySelector(".modal-backdrop")){pendingImport=null;closeSheet();return}
  if(e.key!=="Tab")return;
  const dialog=modalRoot?.querySelector('[role="dialog"]');if(!dialog)return;
  const elements=[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(el=>el.offsetParent!==null);
  if(!elements.length)return;
  if(e.shiftKey&&document.activeElement===elements[0]){e.preventDefault();elements.at(-1).focus()}
  else if(!e.shiftKey&&document.activeElement===elements.at(-1)){e.preventDefault();elements[0].focus()}
});

$("#importFile").addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    if(file.size>15*1024*1024)throw new Error("Archivo demasiado grande");
    const parsed=JSON.parse(await file.text());
    const raw=parsed?.data||parsed;
    const errors=validateStoredData(raw,{strict:true});
    if(errors.length)throw new Error(errors.join(" "));
    previewImport(normalize(raw));
  }catch(error){console.warn("Importación rechazada",error);alert(`Este respaldo no es válido: ${error.message}. No se modificó tu información.`)}
  finally{e.target.value=""}
});
$("#importCategoriesFile")?.addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    const parsed=JSON.parse(await file.text());
    if(parsed.app!=="ConFin"||parsed.type!=="categories"||![parsed.incomeCategories,parsed.expenseCategories].every(Array.isArray))throw new Error("No es un respaldo de categorías");
    for(const key of ["incomeCategories","expenseCategories"]){
      if(parsed[key].some(c=>!isPlainObject(c)||!c.id||typeof c.name!=="string"||!c.name.trim()||!/^#[0-9a-f]{6}$/i.test(c.color||"")))throw new Error("Categorías incompletas");
    }
    if(!confirm(`¿Incorporar ${parsed.incomeCategories.length} categorías de ingresos y ${parsed.expenseCategories.length} categorías de gastos? No se reemplazarán movimientos ni cuentas.`))return;
    for(const key of ["incomeCategories","expenseCategories"]){
      const merged=state[key].map(c=>({...c}));
      for(const imported of parsed[key]){
        const pos=merged.findIndex(c=>c.id===imported.id||c.name.toLocaleLowerCase("es-MX")===imported.name.toLocaleLowerCase("es-MX"));
        if(pos>=0){merged[pos]={...merged[pos],name:imported.name,emoji:imported.emoji||merged[pos].emoji,color:imported.color,system:merged[pos].system};}
        else merged.push({...imported,system:false});
      }
      state[key]=merged;
    }
    save("Categorías sincronizadas sin modificar movimientos");
  }catch(error){alert(`No se importaron categorías: ${error.message}`)}
  finally{e.target.value=""}
});
applyTheme();render();initializeAppSecurity();
let hiddenAt=0;
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")hiddenAt=Date.now();else if(loadSecurity().enabled&&Date.now()-hiddenAt>30000)lockApp()});
unlockButton?.addEventListener("click",authenticateFaceId);
disableLockButton?.addEventListener("click",recoverUnlock);
setTimeout(checkDueNotifications,500);setTimeout(()=>checkForUpdates(false),1800);
if(savedDataRecoveryNotice)setTimeout(()=>alert(savedDataRecoveryNotice),600);
window.addEventListener("focus",()=>{if(document.visibilityState==="visible")checkForUpdates(false)});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js",{updateViaCache:"none"}).catch(()=>showToast("No se pudo preparar el modo sin Internet")));

// Cross-tab changes refresh idle views; open forms retain their draft and cannot overwrite newer data.
window.addEventListener('storage',event=>{
  if(event.key===SECURITY_KEY){if(loadSecurity().enabled)lockApp();return}
  if(event.key!==KEY||event.newValue===storageSnapshot)return;
  if(modalRoot.querySelector('form')){showToast('Otra ventana cambi\u00f3 los datos. Conserva tu borrador y revisa los cambios antes de guardar.');return}
  const next=event.newValue&&parseStored(event.newValue);
  if(!next){window.__confinStorageBlocked=true;renderUpdateNotice();return}
  state=next;committedState=clone(next);storageSnapshot=event.newValue;invalidateMetrics();applyTheme();render();
});
window.addEventListener('resize',()=>requestAnimationFrame(fitAmounts),{passive:true});
document.fonts?.ready.then(()=>fitAmounts());
updateDisplayProfile();

window.__confinBooted=true;
window.dispatchEvent(new Event("confin:ready"));
