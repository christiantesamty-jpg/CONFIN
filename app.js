"use strict";
const VERSION="5.3.4";
const BUILD="2026.10.27.integridad";
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
function categoryName(item){if(!item)return "Otros gastos";return (item.type==="income"?incomeCategoryById(item.categoryId):categoryById(item.categoryId))?.name||item.category||(item.type==="income"?"Otros ingresos":"Otros gastos")}
function categoryIcon(item){if(typeof item==="string")return categoryByName(item)?.emoji||incomeCategoryByName(item)?.emoji||LEGACY_CATEGORY_META[item]?.emoji||"•";return (item?.type==="income"?incomeCategoryById(item?.categoryId):categoryById(item?.categoryId))?.emoji||item?.categoryEmoji||LEGACY_CATEGORY_META[item?.category]?.emoji||"•"}
function expenseCategoryOptions(){return expenseCategories().filter(c=>!c.archived)}
function incomeCategoryOptions(){return incomeCategories().filter(c=>!c.archived)}
function ensureCategoryForName(list,name,emoji,color,system=false){let c=list.find(x=>x.name.toLocaleLowerCase("es-MX")===String(name).toLocaleLowerCase("es-MX"));if(c)return c; c={id:`custom-${categorySlug(name)}-${uid().slice(0,8)}`,name:String(name),emoji:emoji||"•",color:color||"#8395a7",system,createdAt:new Date().toISOString()};list.push(c);return c}
const baseData=()=>({schema:8,expenseCategories:DEFAULT_EXPENSE_CATEGORIES.map(c=>({...c})),incomeCategories:DEFAULT_INCOME_CATEGORIES.map(c=>({...c})),userName:"Christian",theme:"midnight",privacy:false,currency:"MXN",notifications:false,reminderLeadDays:3,accounts:[{id:uid(),name:"Efectivo",type:"cash",balance:0},{id:uid(),name:"Banco",type:"bank",balance:0},{id:uid(),name:"Ahorros",type:"savings",balance:0}],transactions:[],budgets:[{id:uid(),categoryId:"expense-food",category:"Alimentación",limit:5000},{id:uid(),categoryId:"expense-transport",category:"Transporte",limit:2500},{id:uid(),categoryId:"expense-entertainment",category:"Entretenimiento",limit:2000}],goals:[]});
const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const isStandalone=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
function updateDisplayProfile(){
  // Una sola fuente de medidas: viewport CSS para el marco fijo; visualViewport para formularios/teclado.
  const root=document.documentElement;
  root.classList.toggle("ios-standalone",Boolean(isIOS&&isStandalone));
  const width=Math.round(window.innerWidth||root.clientWidth||390);
  const height=Math.round(window.innerHeight||root.clientHeight||800);
  const visible=Math.round(window.visualViewport?.height||height);
  root.dataset.screen=width<=375?"compact":width<=390?"regular":width<=430?"large":"xlarge";
  root.style.setProperty("--viewport-height",`${height}px`);
  root.style.setProperty("--visual-height",`${visible}px`);
  root.style.setProperty("--screen-width",`${width}px`);
  const keyboardOpen=["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)&&height-visible>120;
  root.classList.toggle("keyboard-open",keyboardOpen);
  root.style.setProperty("--keyboard-offset",`${keyboardOpen?Math.max(0,height-visible):0}px`);
}
updateDisplayProfile();
window.addEventListener("pageshow",updateDisplayProfile);
window.addEventListener("resize",updateDisplayProfile,{passive:true});
window.addEventListener("orientationchange",()=>setTimeout(updateDisplayProfile,250));
window.visualViewport?.addEventListener("resize",updateDisplayProfile,{passive:true});
document.addEventListener("focusin",updateDisplayProfile);
document.addEventListener("focusout",()=>setTimeout(updateDisplayProfile,80));
let state=load();let route="home";let filter="all";
let committedState=clone(state);
let lastRenderedRoute=null;
let listLimit=40,transactionSearch="",transactionMonth="all";
let historyOpen=false,historyMonth="";
let modalReturnFocus=null,unrecoverableData=false;
const savedDataRecoveryNotice=window.__confinRecovered||"";
const $=s=>document.querySelector(s);const view=$("#view"),modalRoot=$("#modalRoot"),fab=$("#fab"),toast=$("#toast"),lockScreen=$("#lockScreen"),unlockButton=$("#unlockButton"),disableLockButton=$("#disableLockButton"),lockMessage=$("#lockMessage");

function palette(id,name,colors){return `<button class="palette ${state.theme===id?"active":""}" data-theme="${id}" type="button"><span class="palette-dots">${colors.map(c=>`<i style="background:${c}"></i>`).join("")}</span><strong>${name}</strong></button>`}
function hideToast(){clearTimeout(showToast.t);toast?.classList.remove("show");if(toast)toast.textContent=""}
function showToast(msg){if(!toast)return;hideToast();toast.textContent=msg;toast.classList.add("show");showToast.t=setTimeout(hideToast,2200)}
function openSheet(title,body){
  hideToast();
  if(!document.documentElement.classList.contains("sheet-open"))modalReturnFocus=document.activeElement;
  document.documentElement.classList.add("sheet-open");
  if(modalRoot){
    modalRoot.innerHTML=`<div class="modal-backdrop"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle" tabindex="-1"><div class="handle" aria-hidden="true"></div><div class="sheet-head"><h2 id="sheetTitle">${esc(title)}</h2><button class="close-btn" data-close type="button" aria-label="Cerrar ventana">×</button></div>${body}</section></div>`;
    requestAnimationFrame(()=>modalRoot.querySelector('.sheet')?.focus({preventScroll:true}));
  }
  updateDisplayProfile();
}
function closeSheet(){
  document.documentElement.classList.remove("sheet-open");
  if(modalRoot)modalRoot.innerHTML="";
  if(modalReturnFocus?.isConnected)modalReturnFocus.focus({preventScroll:true});
  modalReturnFocus=null;
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
function unlockApp(){document.body.classList.remove("security-pending","app-locked");lockScreen?.setAttribute("aria-hidden","true");if(lockMessage)lockMessage.textContent="Confirma tu identidad para ver tus finanzas."}
function lockApp(){if(!loadSecurity().enabled)return unlockApp();closeSheet();hideToast();document.body.classList.remove("security-pending");document.body.classList.add("app-locked");lockScreen?.setAttribute("aria-hidden","false")}
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
  if(security.recoveryHash){
    if(!await verifyRecoveryPin(security)){showLockError("PIN incorrecto. Intenta de nuevo o usa Face ID.");return}
    unlockApp();showToast("Desbloqueado con el PIN de recuperación");return;
  }
  // Compatibilidad sólo con instalaciones ANTERIORES a esta versión, cuando no existía PIN.
  if(confirm("Esta instalación antigua no tiene PIN de recuperación. La protección anterior no era fuerte. ¿Recuperar acceso al dispositivo y configurar el nuevo bloqueo?")){
    saveSecurity({enabled:false,credentialId:"",userId:"",recoverySalt:"",recoveryHash:""});unlockApp();route="settings";render();showToast("Configura Face ID con un PIN de recuperación");
  }
}
function initializeAppSecurity(){if(loadSecurity().enabled)lockApp();else unlockApp()}
function clone(v){return JSON.parse(JSON.stringify(v))}
function isPlainObject(v){return !!v&&typeof v==="object"&&!Array.isArray(v)}
function validDate(value){
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const d=new Date(`${value}T12:00:00`);
  return !Number.isNaN(+d)&&localDateKey(d)===value;
}
function validateStoredData(source,{strict=true}={}){
  const errors=[];
  if(!isPlainObject(source))return ["El respaldo no contiene un objeto de datos válido."];
  for(const field of ["accounts","transactions","budgets","goals"]){
    if(!Array.isArray(source[field]))errors.push(`Falta la lista de ${field}.`);
  }
  if(errors.length)return errors;
  const ids=new Set(),accounts=new Set();
  source.accounts.forEach((a,i)=>{
    if(!isPlainObject(a)||!a.id||typeof a.name!=="string"||!a.name.trim())errors.push(`Cuenta ${i+1} incompleta.`);
    else if(accounts.has(a.id))errors.push("Hay cuentas con ID duplicado.");
    else accounts.add(a.id);
    if(!Number.isFinite(Number(a?.balance)))errors.push(`Saldo inválido en cuenta ${i+1}.`);
  });
  source.transactions.forEach((t,i)=>{
    if(!isPlainObject(t)||!t.id||ids.has(t.id))errors.push(`Movimiento ${i+1} inválido o repetido.`);
    if(t?.id)ids.add(t.id);
    if(!["income","expense","transfer"].includes(t?.type))errors.push(`Tipo inválido en movimiento ${i+1}.`);
    if(!Number.isFinite(Number(t?.amount))||Number(t?.amount)<=0)errors.push(`Monto inválido en movimiento ${i+1}.`);
    if(!validDate(t?.date))errors.push(`Fecha inválida en movimiento ${i+1}.`);
    if(strict&&(!accounts.has(t?.accountId)||(t?.type==="transfer"&&!accounts.has(t?.destinationId))))errors.push(`Cuenta inexistente en movimiento ${i+1}.`);
  });
  source.budgets.forEach((b,i)=>{
    if(!isPlainObject(b)||!Number.isFinite(Number(b.limit))||Number(b.limit)<0)errors.push(`Presupuesto ${i+1} inválido.`);
  });
  source.goals.forEach((g,i)=>{
    if(!isPlainObject(g)||!Number.isFinite(Number(g.target))||Number(g.target)<0||!Number.isFinite(Number(g.saved))||Number(g.saved)<0)errors.push(`Meta ${i+1} inválida.`);
  });
  for(const field of ["incomeCategories","expenseCategories"]){
    if(source[field]!==undefined){
      if(!Array.isArray(source[field]))errors.push(`Las ${field} no tienen un formato válido.`);
      else if(source[field].some(c=>!isPlainObject(c)||typeof c.name!=="string"||!c.name.trim()))errors.push(`Categoría sin nombre en ${field}.`);
    }
  }
  return errors.slice(0,12);
}
function normalize(raw){
  const source=isPlainObject(raw)?clone(raw):{};
  const d={...baseData(),...source};
  d.accounts=Array.isArray(d.accounts)?d.accounts:[];
  d.transactions=Array.isArray(d.transactions)?d.transactions:[];
  d.budgets=Array.isArray(d.budgets)?d.budgets:[];
  d.goals=Array.isArray(d.goals)?d.goals:[];
  const migratedExpenses=DEFAULT_EXPENSE_CATEGORIES.map(c=>({...c}));
  const priorExpenses=Array.isArray(source.expenseCategories)?source.expenseCategories:Array.isArray(source.customExpenseCategories)?source.customExpenseCategories:[];
  priorExpenses.forEach(c=>{
    if(!c?.name)return;
    const existing=migratedExpenses.find(x=>x.id===c.id||x.name.toLocaleLowerCase("es-MX")===String(c.name).toLocaleLowerCase("es-MX"));
    if(existing)Object.assign(existing,{...c,id:existing.id,system:existing.system||!!c.system});
    else migratedExpenses.push({id:c.id||`custom-expense-${categorySlug(c.name)}-${uid().slice(0,8)}`,name:String(c.name).trim(),emoji:String(c.emoji||"•").trim()||"•",color:c.color||"#8395a7",system:false,createdAt:c.createdAt||new Date().toISOString()});
  });
  const migratedIncome=DEFAULT_INCOME_CATEGORIES.map(c=>({...c}));
  const priorIncome=Array.isArray(source.incomeCategories)?source.incomeCategories:[];
  priorIncome.forEach(c=>{
    if(!c?.name)return;
    const existing=migratedIncome.find(x=>x.id===c.id||x.name.toLocaleLowerCase("es-MX")===String(c.name).toLocaleLowerCase("es-MX"));
    if(existing)Object.assign(existing,{...c,id:existing.id,system:existing.system||!!c.system});
    else migratedIncome.push({id:c.id||`custom-income-${categorySlug(c.name)}-${uid().slice(0,8)}`,name:String(c.name).trim(),emoji:String(c.emoji||"•"),color:c.color||"#8395a7",system:false,createdAt:c.createdAt||new Date().toISOString()});
  });
  d.theme=["midnight","ocean","violet","sand","light"].includes(d.theme)?d.theme:"midnight";
  d.privacy=!!d.privacy;
  d.notifications=!!d.notifications;
  d.reminderLeadDays=Math.min(14,Math.max(0,Number(d.reminderLeadDays??3)||0));
  d.accounts=d.accounts.map(a=>({...a,id:a.id||uid(),name:a.name||"Cuenta",type:a.type||"bank",balance:Number(a.balance||0),creditLimit:Number(a.creditLimit||0),cutDay:Number(a.cutDay||0),dueDay:Number(a.dueDay||0),minimumPayment:Number(a.minimumPayment||0),noInterestPayment:Number(a.noInterestPayment||0),reminders:a.reminders!==false}));
  d.transactions=d.transactions.map(t=>{
    const x={...t,id:t.id||uid(),amount:Number(t.amount||0)};
    if(x.type==="expense"){
      let c=migratedExpenses.find(v=>v.id===x.categoryId)||migratedExpenses.find(v=>v.name===x.category);
      if(!c){const meta=LEGACY_CATEGORY_META[x.category]||{};c=ensureCategoryForName(migratedExpenses,x.category||"Otros gastos",x.categoryEmoji||meta.emoji,meta.color,false);c.archived=true}
      x.categoryId=c.id;x.category=c.name;x.categoryEmoji=c.emoji;
    }else if(x.type==="income"){
      let c=migratedIncome.find(v=>v.id===x.categoryId)||migratedIncome.find(v=>v.name===x.category);
      if(!c)c=ensureCategoryForName(migratedIncome,x.category||"Otros ingresos",x.categoryEmoji||"•","#8395a7",false);
      x.categoryId=c.id;x.category=c.name;x.categoryEmoji=c.emoji;
    }
    return x;
  });
  d.budgets=d.budgets.map(b=>{let c=migratedExpenses.find(v=>v.id===b.categoryId)||migratedExpenses.find(v=>v.name===b.category);if(!c)c=ensureCategoryForName(migratedExpenses,b.category||"Otros gastos",LEGACY_CATEGORY_META[b.category]?.emoji,LEGACY_CATEGORY_META[b.category]?.color,false);return {...b,id:b.id||uid(),categoryId:c.id,category:c.name,limit:Number(b.limit||0)}});
  d.goals=d.goals.map(g=>({...g,id:g.id||uid(),target:Number(g.target||0),saved:Number(g.saved||0)}));
  d.expenseCategories=migratedExpenses;
  d.incomeCategories=migratedIncome;
  delete d.customExpenseCategories;
  d.schema=8;
  return d;
}
function parseStored(text,{strict=false}={}){
  try{const raw=JSON.parse(text);if(validateStoredData(raw,{strict}).length)return null;return normalize(raw)}catch{return null}
}
function persist(value,{keepBackup=true}={}){
  const text=JSON.stringify(value),previous=localStorage.getItem(KEY);
  if(keepBackup&&previous&&previous!==text&&parseStored(previous,{strict:false})){
    // Nunca colocar un principal corrupto encima del último respaldo válido.
    localStorage.setItem(BACKUP_KEY,previous);
  }
  localStorage.setItem(KEY,text);
  if(localStorage.getItem(KEY)!==text)throw new Error("El guardado no pasó la verificación de lectura.");
}
function load(){
  const existing=localStorage.getItem(KEY);
  if(existing){
    const saved=parseStored(existing);
    if(saved)return saved; // leer no debe sobrescribir el respaldo con un principal corrupto
    const previous=localStorage.getItem(BACKUP_KEY);
    const recovered=previous&&parseStored(previous);
    if(recovered){
      try{localStorage.setItem(KEY,JSON.stringify(recovered));}catch(e){console.warn("No se pudo reparar el principal",e)}
      window.__confinRecovered="Se recuperaron los datos de la última copia local válida. Exporta un respaldo ahora.";
      return recovered;
    }
    window.__confinRecovered="Los datos existentes no se pudieron leer. NO registres movimientos nuevos; importa un respaldo antes de continuar.";
    window.__confinStorageBlocked=true;
    return baseData();
  }
  for(const oldKey of OLD_KEYS){
    const old=localStorage.getItem(oldKey),migrated=old&&parseStored(old);
    if(migrated){
      try{persist(migrated,{keepBackup:false})}catch(e){console.warn("Migración en espera",e)}
      return migrated;
    }
  }
  return baseData();
}
function save(message){
  if(window.__confinStorageBlocked){showToast("Datos en recuperación. Importa primero un respaldo.");return false}
  try{
    const next=normalize(state);
    const errors=validateStoredData(next);
    if(errors.length)throw new Error(errors[0]);
    persist(next);
    state=next;
    committedState=clone(next);
    invalidateMetrics();
    applyTheme();render();
    if(message)showToast(message);
    return true;
  }catch(e){
    console.error("No se pudo guardar",e);
    state=clone(committedState);
    invalidateMetrics();
    applyTheme();render();
    showToast("No se guardó. Tus datos anteriores siguen protegidos; exporta un respaldo.");
    return false;
  }
}
function applyTheme(){document.documentElement.dataset.theme=state.theme;const colors={midnight:"#080b12",ocean:"#06131a",violet:"#100b17",sand:"#17130e",light:"#f4f6fa"};document.querySelector('meta[name="theme-color"]').content=colors[state.theme]}
function money(n){if(state.privacy)return "$••••";return new Intl.NumberFormat("es-MX",{style:"currency",currency:state.currency||"MXN",minimumFractionDigits:2}).format(Number(n)||0)}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function localDateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function monthKey(s){return String(s||"").slice(0,7)}
function currentMonth(){return localDateKey().slice(0,7)}
function formatDate(s){return new Intl.DateTimeFormat("es-MX",{day:"numeric",month:"short"}).format(new Date(`${s}T12:00:00`))}
let metricsCache=null;
function invalidateMetrics(){metricsCache=null}
function getMetrics(){
  if(metricsCache?.source===state)return metricsCache;
  const balances=new Map(state.accounts.map(a=>[a.id,Number(a.balance)||0]));
  const deltas=new Map(state.accounts.map(a=>[a.id,0]));
  const monthly=new Map(),daily=new Map(),expenseByCategory=new Map();
  for(const t of state.transactions){
    const amount=Number(t.amount)||0;
    const change=(id,delta)=>{
      if(!id||!balances.has(id))return;
      balances.set(id,balances.get(id)+delta);
      deltas.set(id,(deltas.get(id)||0)+delta);
    };
    if(t.type==="income")change(t.accountId,amount);
    else if(t.type==="expense")change(t.accountId,-amount);
    else if(t.type==="transfer"){change(t.accountId,-amount);change(t.destinationId,amount)}
    const month=monthKey(t.date);
    if(t.type==="transfer"||!/^\d{4}-\d{2}$/.test(month))continue;
    if(!monthly.has(month))monthly.set(month,{income:0,expense:0});
    const m=monthly.get(month);m[t.type]+=amount;
    if(!daily.has(t.date))daily.set(t.date,{income:0,expense:0});
    daily.get(t.date)[t.type]+=amount;
    if(t.type==="expense"){
      if(!expenseByCategory.has(month))expenseByCategory.set(month,new Map());
      const map=expenseByCategory.get(month);
      const id=t.categoryId||categoryByName(t.category)?.id||t.category||"expense-other";
      map.set(id,(map.get(id)||0)+amount);
    }
  }
  const sorted=[...state.transactions].sort((a,b)=>b.date.localeCompare(a.date));
  metricsCache={source:state,balances,deltas,monthly,daily,expenseByCategory,sorted};
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
function savingsRate(income,expense){return income>0?(income-expense)/income*100:null}
function daysUntilDay(day){if(!day)return null;const now=new Date(),target=new Date(now.getFullYear(),now.getMonth(),Math.min(day,new Date(now.getFullYear(),now.getMonth()+1,0).getDate()),12);if(target<new Date(now.getFullYear(),now.getMonth(),now.getDate(),12))target.setMonth(target.getMonth()+1);return Math.ceil((target-new Date(now.getFullYear(),now.getMonth(),now.getDate(),12))/86400000)}
function creditReminders(){return state.accounts.filter(a=>a.type==="credit"&&a.reminders!==false).map(a=>{const due=daysUntilDay(a.dueDay),debt=Math.max(0,-accountBalance(a.id));return {account:a,due,debt}}).filter(x=>x.debt>0&&x.due!==null&&x.due<=state.reminderLeadDays).sort((a,b)=>a.due-b.due)}
function screenProfile(){const w=Math.round(window.innerWidth),h=Math.round(window.innerHeight),sh=Math.round(window.screen?.height||h),profile=document.documentElement.dataset.screen||"regular";return `${isStandalone?"App instalada":"Navegador"} · vista ${w} × ${h} · pantalla ${sh} · ${profile}`}
function shell(title,content,subtitle=`Hola, ${esc(state.userName||"tú")} 👋`){return `<header class="header"><div><p class="eyebrow">${subtitle}</p><h1 class="title">${title}</h1></div><div class="header-actions">${route==="settings"?"":`<button class="header-add" data-action="new-movement" type="button" aria-label="Nuevo movimiento"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>`}<button class="icon-button" data-action="settings" aria-label="Configuración"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V21h-4v-.08A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.52-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 8.97 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08a1.7 1.7 0 0 0 1.03 1.52 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 7l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/></svg></button></div></header>${content}`}
function fitAmounts(){
  document.querySelectorAll("[data-fit-amount]").forEach(el=>{
    const max=Number(el.dataset.maxSize||48),min=Number(el.dataset.minSize||20);
    el.style.fontSize=`${max}px`;
    let size=max;
    while(size>min&&el.scrollWidth>el.clientWidth+1){size--;el.style.fontSize=`${size}px`}
  });
}
function render(){
  const oldScroll=view.scrollTop,sameRoute=lastRenderedRoute===route;
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.route===route));
  fab.classList.toggle("hidden",route==="settings");
  const fn={home:homeView,transactions:transactionsView,budgets:budgetsView,goals:goalsView,accounts:accountsView,settings:settingsView}[route]||homeView;
  view.innerHTML=fn();
  view.scrollTop=sameRoute?oldScroll:0;
  lastRenderedRoute=route;
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
  return new Intl.DateTimeFormat("es-MX",{month:"long",year:"numeric"}).format(new Date(y,m-1,1,12));
}
function historicalMonths(){
  const current=currentMonth(),months=[...new Set(state.transactions.map(t=>monthKey(t.date)))].filter(m=>/^\d{4}-\d{2}$/.test(m)&&m<current).sort().reverse();
  if(months.length)return months;
  const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-1);
  return [localDateKey(d).slice(0,7)];
}
function historySection(){
  const months=historicalMonths();
  if(!months.includes(historyMonth))historyMonth=months[0];
  const {income,expense}=monthSummary(historyMonth),saved=income-expense,pct=savingsRate(income,expense);
  const categories=[...(getMetrics().expenseByCategory.get(historyMonth)||new Map())].sort((a,b)=>b[1]-a[1]).slice(0,5);
  const max=categories[0]?.[1]||1;
  return `<section class="section monthly-history"><div class="section-head"><div><p class="section-kicker">Análisis financiero</p><h2 class="section-title">Historial mensual</h2></div></div><button class="history-toggle" type="button" data-action="toggle-history" aria-expanded="${historyOpen}"><span><strong>Consultar meses anteriores</strong><small>Ingresos, gastos y porcentaje de ahorro</small></span><span aria-hidden="true">${historyOpen?"⌃":"⌄"}</span></button>${historyOpen?`<div class="history-panel"><label class="history-label" for="historyMonth">Selecciona un mes</label><select class="input" id="historyMonth" aria-label="Mes del historial">${months.map(m=>`<option value="${m}" ${m===historyMonth?"selected":""}>${esc(monthLabel(m))}</option>`).join("")}</select><div class="history-stats"><div><span>Ingresos</span><strong class="positive">${money(income)}</strong></div><div><span>Gastos</span><strong class="negative">${money(expense)}</strong></div><div><span>Ahorro neto</span><strong class="${saved<0?"negative":"positive"}">${money(saved)}</strong></div><div><span>Porcentaje de ahorro</span><strong>${pct===null?"Sin ingresos":`${pct.toFixed(1)}%`}</strong></div></div>${categories.length?`<div class="history-breakdown"><h3>Gastos destacados</h3>${categories.map(([id,total])=>{const cat=categoryById(id)||categoryByName(id);return `<div class="breakdown-item"><span>${esc(cat?.emoji||"•")} ${esc(cat?.name||id)}</span><b>${money(total)}</b><div class="breakdown-track"><i style="width:${Math.round(total/max*100)}%"></i></div></div>`}).join("")}</div>`:"<p class=\"settings-note\">Sin gastos registrados en este mes.</p>"}<p class="history-hint">Las transferencias entre cuentas propias no se cuentan como ingresos ni gastos.</p></div>`:""}</section>`;
}
function homeView(){
  const current=monthSummary(currentMonth()),income=current.income,expense=current.expense;
  const available=state.accounts.filter(a=>a.type!=="credit").reduce((sum,a)=>sum+accountBalance(a.id),0);
  const rate=savingsRate(income,expense),recent=getMetrics().sorted.slice(0,4),week=last7DaysActivity(),reminders=creditReminders();
  const rateLabel=rate===null?"Agrega ingresos para medir tu ahorro":rate>=0?`▲ ${rate.toFixed(1)}% de ahorro este mes`:`▼ ${Math.abs(rate).toFixed(1)}% de déficit este mes`;
  return shell("ConFin",`${reminders.length?`<section class="reminder-strip"><div><strong>Pago próximo</strong><span>${esc(reminders[0].account.name)} · ${reminders[0].due===0?"vence hoy":`vence en ${reminders[0].due} día${reminders[0].due===1?"":"s"}`}</span></div><b>${money(reminders[0].account.noInterestPayment||reminders[0].debt)}</b></section>`:""}<section class="hero"><div class="hero-row"><div class="hero-main"><span class="label">Dinero disponible</span><div class="hero-value" data-fit-amount data-max-size="48" data-min-size="22">${money(available)}</div></div><button class="privacy" data-action="privacy" aria-label="${state.privacy?"Mostrar cantidades":"Ocultar cantidades"}">${state.privacy?"Mostrar":"Privado"}</button></div><div class="spark" aria-label="Actividad de los últimos siete días">${week.some(d=>d.activity>0)?week.map(d=>`<span style="height:${d.height}%" title="${d.label}: ${money(d.activity)}"></span>`).join(""):`<p class="spark-empty">Sin actividad registrada esta semana</p>`}</div><div class="spark-labels">${week.map(d=>`<span>${d.label}</span>`).join("")}</div><div class="row-between"><span class="label">${rateLabel}</span><b>${state.currency}</b></div></section><section class="grid-2"><article class="stat-card"><div class="stat-icon">↓</div><div class="label">Ingresos</div><div class="stat-value" data-fit-amount data-max-size="27" data-min-size="16">${money(income)}</div><span class="positive">Este mes</span></article><article class="stat-card"><div class="stat-icon" style="color:var(--danger);background:color-mix(in srgb,var(--danger) 12%,transparent)">↑</div><div class="label">Gastos</div><div class="stat-value" data-fit-amount data-max-size="27" data-min-size="16">${money(expense)}</div><span class="negative">Este mes</span></article></section><section class="section"><div class="section-head"><div><p class="section-kicker">Actividad</p><h2 class="section-title">Últimos movimientos</h2></div><button class="link-btn" data-route-go="transactions">Ver todos</button></div><div class="list">${recent.length?recent.map(t=>txCard(t,true)).join(""):`<div class="list-card empty">Tu actividad aparecerá aquí.</div>`}</div></section>${historySection()}`);
}
function txCard(t,editable=false){const account=state.accounts.find(a=>a.id===t.accountId),sign=t.type==="income"?"+":t.type==="expense"?"-":"",cls=t.type==="income"?"positive":t.type==="expense"?"negative":"",name=t.type==="expense"?categoryName(t):t.category,title=t.note||(t.type==="transfer"?"Transferencia":name),sub=t.type==="transfer"?`${account?.name||"Cuenta"} → ${state.accounts.find(a=>a.id===t.destinationId)?.name||"Cuenta"}`:`${name} · ${account?.name||"Cuenta"}`;return `<article class="list-card transaction-card"><div class="tx-row"><div class="tx-left"><div class="tx-icon">${esc(t.type==="transfer"?"⇆":categoryIcon(t))}</div><div class="tx-copy"><p class="tx-title">${esc(title)}</p><span class="tx-sub">${esc(sub)} · ${formatDate(t.date)}</span></div></div><div class="amount-wrap"><span class="amount ${cls}" data-fit-amount data-max-size="18" data-min-size="12">${sign}${money(t.amount)}</span></div></div>${editable?`<div class="tx-actions"><button class="small-btn" data-edit-transaction="${t.id}">Editar</button><button class="small-btn" data-repeat-transaction="${t.id}">Repetir</button><button class="small-btn danger" data-delete-transaction="${t.id}">Borrar</button></div>`:""}</article>`}
function transactionResults(){
  const search=transactionSearch.toLocaleLowerCase("es-MX").trim();
  let tx=getMetrics().sorted;
  if(filter!=="all")tx=tx.filter(t=>t.type===filter);
  if(transactionMonth!=="all")tx=tx.filter(t=>monthKey(t.date)===transactionMonth);
  if(search)tx=tx.filter(t=>{
    const acc=state.accounts.find(a=>a.id===t.accountId);
    return [t.note,t.category,categoryName(t),acc?.name,t.amount,t.date].some(x=>String(x||"").toLocaleLowerCase("es-MX").includes(search));
  });
  const rows=tx.slice(0,listLimit);
  return `<p class="list-count">${tx.length} movimiento${tx.length===1?"":"s"}</p><div class="list">${rows.length?rows.map(t=>txCard(t,true)).join(""):`<div class="list-card empty">No hay movimientos con estos filtros.</div>`}</div>${tx.length>listLimit?`<button class="secondary-btn load-more" data-action="more-transactions" type="button">Mostrar más (${tx.length-listLimit} pendientes)</button>`:""}`;
}
function transactionsView(){
  const months=[...new Set(state.transactions.map(t=>monthKey(t.date)))].filter(m=>/^\d{4}-\d{2}$/.test(m)).sort().reverse();
  return shell("Movimientos",`<div class="tabs" role="group" aria-label="Tipo de movimiento">${[["all","Todos"],["expense","Gastos"],["income","Ingresos"],["transfer","Transfer."]].map(([v,l])=>`<button class="tab ${filter===v?"active":""}" data-filter="${v}" aria-pressed="${filter===v}">${l}</button>`).join("")}</div><div class="transaction-tools"><input class="input" id="transactionSearch" type="search" placeholder="Buscar movimiento…" aria-label="Buscar movimiento" value="${esc(transactionSearch)}"><select class="input" id="transactionMonth" aria-label="Filtrar por mes"><option value="all">Todos los meses</option>${months.map(m=>`<option value="${m}" ${m===transactionMonth?"selected":""}>${esc(monthLabel(m))}</option>`).join("")}</select></div><div id="transactionResults">${transactionResults()}</div>`);
}
function budgetsView(){
  const total=state.budgets.reduce((sum,b)=>sum+(Number(b.limit)||0),0);
  const categories=new Set(state.budgets.map(b=>b.categoryId));
  const monthly=getMetrics().expenseByCategory.get(currentMonth())||new Map();
  const used=[...categories].reduce((sum,id)=>sum+(monthly.get(id)||0),0);
  const spentAll=monthSummary(currentMonth()).expense;
  const remaining=total-used;
  return shell("Presupuestos",`<div class="section-head"><p class="section-kicker">Control mensual</p><button class="link-btn" data-action="new-budget">+ Nuevo</button></div><article class="hero budget-summary"><div class="budget-summary-grid"><div><span class="label">Presupuestado</span><strong>${money(total)}</strong></div><div><span class="label">Usado en presupuestos</span><strong>${money(used)}</strong></div><div><span class="label">Restante</span><strong class="${remaining<0?"negative":"positive"}">${money(remaining)}</strong></div></div><p class="budget-context">Gastos fuera del presupuesto: ${money(Math.max(0,spentAll-used))}</p></article><div class="list">${state.budgets.length?state.budgets.map(b=>{const c=categoryById(b.categoryId)||categoryByName(b.category),used=monthly.get(b.categoryId)||0,pct=b.limit?Math.min(100,Math.round(used/b.limit*100)):0;return `<article class="list-card budget-card"><div class="budget-top"><div class="budget-copy"><div class="budget-title">${esc(c?.emoji||categoryIcon(b.category))} ${esc(c?.name||b.category)}</div><div class="budget-meta">${money(used)} de ${money(b.limit)}</div></div><div class="budget-actions"><button class="small-btn" data-edit-budget="${b.id}">Editar</button><button class="small-btn danger" data-delete-budget="${b.id}">Borrar</button></div></div><div class="row-between budget-usage"><span class="label">Uso mensual</span><span class="percent">${pct}%</span></div><div class="progress"><span style="width:${pct}%"></span></div></article>`}).join(""):`<div class="list-card empty">Crea tu primer presupuesto.</div>`}</div>`);
}
function goalsView(){const total=state.goals.reduce((s,g)=>s+g.target,0),saved=state.goals.reduce((s,g)=>s+g.saved,0);return shell("Metas",`<div class="section-head"><p class="section-kicker">Objetivos de ahorro</p><button class="link-btn" data-action="new-goal">+ Nueva</button></div><article class="hero"><span class="label">Ahorrado en metas</span><div class="hero-value">${money(saved)}</div><div class="row-between"><span class="label">Objetivo total</span><b>${money(total)}</b></div></article><div class="list">${state.goals.length?state.goals.map(g=>{const pct=g.target?Math.min(100,Math.round(g.saved/g.target*100)):0;return `<article class="list-card"><div class="row-between"><div><div class="budget-title">🎯 ${esc(g.name)}</div><div class="budget-meta">${money(g.saved)} de ${money(g.target)}</div></div><div class="actions"><button class="small-btn" data-edit-goal="${g.id}">Editar</button><button class="small-btn danger" data-delete-goal="${g.id}">Borrar</button></div></div><div class="progress"><span style="width:${pct}%"></span></div></article>`}).join(""):`<div class="list-card empty">Crea una meta para comenzar.</div>`}</div>`)}
function accountsView(){const available=state.accounts.filter(a=>a.type!=="credit").reduce((s,a)=>s+accountBalance(a.id),0),debt=state.accounts.filter(a=>a.type==="credit").reduce((s,a)=>s+Math.max(0,-accountBalance(a.id)),0);return shell("Cuentas",`<div class="section-head"><p class="section-kicker">Tu dinero</p><button class="link-btn" data-action="new-account">+ Nueva</button></div><section class="grid-2 account-summary"><article class="stat-card"><div class="label">Disponible</div><div class="stat-value account-summary-value" data-fit-amount data-max-size="27" data-min-size="15">${money(available)}</div></article><article class="stat-card"><div class="label">Deuda crédito</div><div class="stat-value account-summary-value negative" data-fit-amount data-max-size="27" data-min-size="15">${money(debt)}</div></article></section><div class="list">${state.accounts.map(a=>accountCard(a)).join("")||`<div class="list-card empty">Agrega tu primera cuenta.</div>`}</div>`)}
function accountCard(a){const b=accountBalance(a.id),icon={cash:"💵",bank:"🏦",savings:"🐷",investment:"📈",credit:"💳"}[a.type]||"🏦";if(a.type==="credit"){const debt=Math.max(0,-b),available=Math.max(0,a.creditLimit-debt),pct=a.creditLimit?Math.min(100,Math.round(debt/a.creditLimit*100)):0,due=daysUntilDay(a.dueDay);return `<article class="list-card credit-card"><div class="row-between"><div class="tx-left"><div class="tx-icon">${icon}</div><div><p class="tx-title">${esc(a.name)}</p><span class="tx-sub">Corte día ${a.cutDay||"—"} · Pago día ${a.dueDay||"—"}</span></div></div><div class="credit-card-actions"><button class="small-btn" data-pay-credit="${a.id}">Pagar</button><button class="small-btn" data-edit-account="${a.id}">Editar</button></div></div><div class="credit-metrics"><div><span>Deuda actual</span><b>${money(debt)}</b></div><div><span>Crédito disponible</span><b>${money(available)}</b></div></div><div class="row-between"><span class="label">Uso de línea</span><span class="percent">${pct}%</span></div><div class="progress"><span style="width:${pct}%"></span></div><div class="credit-payments"><span>Pago mínimo <b>${money(a.minimumPayment)}</b></span><span>Para no generar intereses <b>${money(a.noInterestPayment||debt)}</b></span></div>${due!==null?`<div class="due-pill ${due<=state.reminderLeadDays?"urgent":""}">${due===0?"Vence hoy":`Faltan ${due} días para pagar`}</div>`:""}</article>`}return `<article class="list-card account-row"><div class="tx-left"><div class="tx-icon">${icon}</div><div><p class="tx-title">${esc(a.name)}</p><span class="tx-sub">${{cash:"Efectivo",bank:"Banco",savings:"Ahorro",investment:"Inversión"}[a.type]||"Cuenta"}</span></div></div><div style="text-align:right"><b>${money(b)}</b><div><button class="text-btn" data-edit-account="${a.id}">Editar</button></div></div></article>`}
function categorySettingsSection(kind,title,note,categories){const prefix=kind==="income"?"income":"expense";return `<section class="settings-group category-settings"><div class="category-section-head"><div class="category-section-copy"><h3>${title}</h3><p class="settings-note">${note}</p></div><button class="small-btn category-add-btn" data-action="new-${prefix}-category">+ Agregar</button></div><div class="category-list">${categories.filter(c=>!c.archived).map(c=>`<div class="setting-row"><div><strong><span class="category-color" style="background:${esc(c.color||"#8395a7")}"></span>${esc(c.emoji)} ${esc(c.name)}</strong><small>${c.system?"Predeterminada":"Personalizada"}</small></div><div class="actions"><button class="small-btn" data-edit-${prefix}-category="${c.id}">Editar</button>${c.system?"":`<button class="small-btn danger" data-delete-${prefix}-category="${c.id}">Borrar</button>`}</div></div>`).join("")}</div></section>`}
function settingsView(){return shell("Configuración",`<section class="settings-group"><h3>Perfil y privacidad</h3><div class="setting-row"><div><strong>Nombre</strong><small>${esc(state.userName)}</small></div><button class="small-btn" data-action="edit-name">Editar</button></div><div class="setting-row"><div><strong>Ocultar saldos</strong><small>Modo privacidad</small></div><button class="switch ${state.privacy?"on":""}" data-action="privacy" aria-label="Ocultar saldos"></button></div><div class="setting-row"><div><strong>Face ID</strong><small>Bloqueo de privacidad local; no cifra tu información</small></div><button class="switch ${loadSecurity().enabled?"on":""}" data-action="face-id" aria-label="Activar Face ID"></button></div>${loadSecurity().enabled&&!loadSecurity().recoveryHash?`<div class="setting-row"><div><strong>PIN de recuperación</strong><small>Configúralo para no perder acceso si falla Face ID</small></div><button class="small-btn" data-action="set-recovery-pin">Configurar</button></div>`:""}</section><section class="settings-group"><h3>Apariencia</h3><div class="palette-grid">${palette("midnight","Medianoche",["#080b12","#121823","#57e78c"])}${palette("ocean","Océano",["#06131a","#0d2530","#47d8ff"])}${palette("violet","Violeta",["#100b17","#21172d","#b38cff"])}${palette("sand","Arena",["#17130e","#2a2117","#f3c86a"])}${palette("light","Claro",["#f4f6fa","#ffffff","#18b967"])}</div></section>${categorySettingsSection("expense","Categorías de gastos","Tus categorías, emojis y colores se guardan dentro del respaldo y no se reemplazan al actualizar.",expenseCategories())}${categorySettingsSection("income","Categorías de ingresos","También puedes crear, editar y respaldar categorías de ingresos personalizadas.",incomeCategories())}<section class="settings-group"><h3>Datos</h3><div class="setting-row"><div><strong>Exportar respaldo</strong><small>Guárdalo en Archivos o iCloud Drive; no es automático</small></div><button class="small-btn" data-action="export">Exportar</button></div><div class="setting-row"><div><strong>Importar respaldo</strong><small>Reemplaza los datos después de mostrar una vista previa</small></div><button class="small-btn" data-action="import">Importar</button></div><div class="setting-row"><div><strong>Exportar categorías</strong><small>Solo nombres, emojis y colores; sin movimientos</small></div><button class="small-btn" data-action="export-categories">Exportar</button></div><div class="setting-row"><div><strong>Importar categorías</strong><small>Agrega o actualiza categorías sin tocar las cuentas</small></div><button class="small-btn" data-action="import-categories">Importar</button></div>${localStorage.getItem(RESTORE_KEY)?`<div class="setting-row"><div><strong>Recuperar datos anteriores</strong><small>Estado guardado antes de la última importación o borrado</small></div><button class="small-btn" data-action="restore-previous">Revisar</button></div>`:""}<div class="setting-row"><div><strong>Restablecer aplicación</strong><small>Requiere escribir BORRAR y conservar un respaldo</small></div><button class="small-btn danger" data-action="reset">Borrar</button></div></section><section class="settings-group"><h3>Aplicación</h3><div class="setting-row"><div><strong>Buscar actualización</strong><small>Versión instalada ${VERSION}</small></div><button class="small-btn" data-action="check-update">Buscar</button></div></section><section class="settings-group"><h3>Seguridad de tus datos</h3><p class="settings-note">ConFin guarda la información en este navegador y dominio. Cada iPhone tiene datos independientes. Si borras Safari, cambias de dominio o dispositivo, deberás importar un archivo de respaldo. Face ID es una barrera de privacidad local, no cifrado de datos.</p>${localStorage.getItem(LAST_EXPORT_KEY)?`<p class="settings-note">Última exportación iniciada: ${esc(new Date(localStorage.getItem(LAST_EXPORT_KEY)).toLocaleDateString("es-MX"))}. Verifica que el archivo esté guardado en Archivos.</p>`:""}</section><section class="settings-group"><h3>Diagnóstico de pantalla</h3><div class="setting-row"><div><strong>Perfil adaptable</strong><small>${screenProfile()}</small></div><span>✓</span></div><div class="setting-row"><div><strong>ConFin</strong><small>Versión ${VERSION} · Compilación ${BUILD}</small></div><span>✓</span></div></section>`) }
function movementSheet(existing=null,preset={}){
  existing=existing&&["income","expense","transfer"].includes(existing.type)?existing:null;
  let type=existing?.type||preset.type||"expense";
  let expenseCatId=existing?.type==="expense"?(existing.categoryId||categoryByName(existing.category)?.id):preset.expenseCatId||expenseCategoryOptions()[0]?.id;
  let incomeCatId=existing?.type==="income"?(existing.categoryId||incomeCategoryByName(existing.category)?.id):preset.incomeCatId||incomeCategoryOptions()[0]?.id;
  const draw=()=>{const cats=type==="income"?incomeCategoryOptions():expenseCategoryOptions(),selectedAccount=existing?.accountId||preset.accountId||state.accounts.find(a=>a.type!=="credit")?.id||state.accounts[0]?.id,selectedDestination=existing?.destinationId||preset.destinationId||state.accounts.find(a=>a.id!==selectedAccount)?.id;
    openSheet(existing?"Editar movimiento":preset.repeat?"Repetir movimiento":preset.destinationId?"Pagar tarjeta":"Nuevo movimiento",`<form id="movementForm" class="form"><div class="segmented">${[["expense","Gasto"],["income","Ingreso"],["transfer","Transferencia"]].map(([v,l])=>`<button type="button" class="segment ${type===v?"active":""}" data-move-type="${v}">${l}</button>`).join("")}</div><div class="field"><label>Monto</label><input class="input amount-input" name="amount" type="number" min="0.01" step="0.01" inputmode="decimal" value="${existing?.amount||preset.amount||""}" placeholder="$0.00" required></div>${type!=="transfer"?`<div class="field"><label>Categoría</label><div class="category-grid">${cats.map(c=>`<button type="button" class="category-btn ${(type==="income"?incomeCatId:expenseCatId)===c.id?"active":""}" data-movement-category="${c.id}"><b>${esc(c.emoji)}</b><span>${esc(c.name)}</span></button>`).join("")}</div></div>`:""}<div class="field"><label>${type==="transfer"?"Cuenta origen":"Cuenta"}</label><select name="accountId" required>${state.accounts.map(a=>`<option value="${a.id}" ${a.id===selectedAccount?"selected":""}>${esc(a.name)} · ${money(accountBalance(a.id))}${a.type==="credit"?" · Crédito":""}</option>`).join("")}</select></div>${type==="transfer"?`<div class="field"><label>Cuenta destino</label><select name="destinationId" required>${state.accounts.map(a=>`<option value="${a.id}" ${a.id===selectedDestination?"selected":""}>${esc(a.name)}${a.type==="credit"?` · Deuda ${money(Math.max(0,-accountBalance(a.id)))}`:` · ${money(accountBalance(a.id))}`}</option>`).join("")}</select></div>`:""}<div class="form-grid"><div class="field"><label>Fecha</label><input class="input" name="date" type="date" value="${existing?.date||localDateKey()}" required></div><div class="field"><label>Nota</label><input class="input" name="note" value="${esc(existing?.note||preset.note||"")}" placeholder="Opcional"></div></div><button class="primary-btn">${existing?"Guardar cambios":preset.repeat?"Guardar movimiento":preset.destinationId?"Registrar pago":"Guardar movimiento"}</button></form>`);
    modalRoot.querySelectorAll("[data-move-type]").forEach(b=>b.onclick=()=>{type=b.dataset.moveType;if(type==="expense"&&!expenseCatId)expenseCatId=expenseCategoryOptions()[0]?.id;if(type==="income"&&!incomeCatId)incomeCatId=incomeCategoryOptions()[0]?.id;draw()});
    modalRoot.querySelectorAll("[data-movement-category]").forEach(b=>b.onclick=()=>{if(type==="income")incomeCatId=b.dataset.movementCategory;else expenseCatId=b.dataset.movementCategory;modalRoot.querySelectorAll(".category-btn").forEach(x=>x.classList.toggle("active",x===b))});
    $("#movementForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),amount=Number(f.get("amount"));if(!Number.isFinite(amount)||amount<=0||!validDate(f.get("date"))){showToast("Revisa monto y fecha");return}const accountId=f.get("accountId"),destinationId=f.get("destinationId"),source=state.accounts.find(a=>a.id===accountId),destination=state.accounts.find(a=>a.id===destinationId);if(type==="transfer"&&accountId===destinationId){showToast("Selecciona cuentas diferentes");return}if(!source||(type==="transfer"&&!destination)){showToast("Selecciona cuentas válidas");return}if(type==="transfer"&&source?.type!=="credit"&&balanceWithoutTransaction(accountId,existing)<amount){showToast("La cuenta de origen no tiene saldo suficiente");return}if(type==="transfer"&&destination?.type==="credit"&&amount>Math.max(0,-balanceWithoutTransaction(destinationId,existing))){showToast("El pago supera la deuda pendiente");return}const c=type==="expense"?categoryById(expenseCatId):type==="income"?incomeCategoryById(incomeCatId):null;if(type!=="transfer"&&!c){showToast("Selecciona una categoría");return}const obj={id:existing?.id||uid(),type,amount,categoryId:type==="transfer"?null:c.id,category:type==="transfer"?"Transferencia":c.name,categoryEmoji:type==="transfer"?null:c.emoji,accountId,destinationId:type==="transfer"?destinationId:null,date:f.get("date"),note:String(f.get("note")||"").trim()};if(existing)state.transactions=state.transactions.map(t=>t.id===existing.id?obj:t);else state.transactions.push(obj);if(save(existing?"Movimiento actualizado":destination?.type==="credit"?"Pago de tarjeta registrado":"Movimiento guardado"))closeSheet()};
  };draw()
}
function budgetSheet(existing){const categories=expenseCategoryOptions(),selected=existing?.categoryId||categoryByName(existing?.category)?.id||categories[0]?.id,b=existing||{id:uid(),categoryId:selected,limit:""};openSheet(existing?"Editar presupuesto":"Nuevo presupuesto",`<form id="budgetForm" class="form"><div class="field"><label>Categoría</label><select name="categoryId">${categories.map(c=>`<option value="${c.id}" ${c.id===selected?"selected":""}>${esc(c.emoji)} ${esc(c.name)}</option>`).join("")}</select></div><div class="field"><label>Límite mensual</label><input class="input" name="limit" type="number" min="1" step="0.01" value="${b.limit}" required></div><button class="primary-btn">${existing?"Guardar cambios":"Crear presupuesto"}</button></form>`);$("#budgetForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),c=categoryById(f.get("categoryId")),obj={...b,categoryId:c.id,category:c.name,limit:Number(f.get("limit"))};if(state.budgets.some(x=>x.id!==b.id&&x.categoryId===c.id)){showToast("Ya existe un presupuesto para esta categoría");return}if(existing)state.budgets=state.budgets.map(x=>x.id===b.id?obj:x);else state.budgets.push(obj);if(save(existing?"Presupuesto actualizado":"Presupuesto creado"))closeSheet()}}
function goalSheet(existing){const g=existing||{id:uid(),name:"",target:"",saved:0};const targetValue=g.target||"",savedValue=g.saved||"";openSheet(existing?"Editar meta":"Nueva meta",`<form id="goalForm" class="form" novalidate><div class="field"><label for="goalName">Nombre</label><input class="input" id="goalName" name="name" type="text" value="${esc(g.name)}" placeholder="Ej. Viaje" autocomplete="off" required></div><div class="field"><label for="goalTarget">Objetivo</label><input class="input money-field" id="goalTarget" name="target" type="text" inputmode="decimal" value="${targetValue}" placeholder="0.00" autocomplete="off" enterkeyhint="next" required></div><div class="field"><label for="goalSaved">Ahorrado</label><input class="input money-field" id="goalSaved" name="saved" type="text" inputmode="decimal" value="${savedValue}" placeholder="0.00" autocomplete="off" enterkeyhint="done"></div><p class="form-error" id="goalError" role="alert" hidden></p><button class="primary-btn" type="submit">Guardar meta</button></form>`);const form=$("#goalForm"),error=$("#goalError"),parseAmount=value=>Number(String(value||"").trim().replace(/\s/g,"").replace(/,/g,""));form.onsubmit=e=>{e.preventDefault();const f=new FormData(form),name=String(f.get("name")||"").trim(),target=parseAmount(f.get("target")),saved=parseAmount(f.get("saved"));error.hidden=true;if(!name){error.textContent="Escribe un nombre para la meta.";error.hidden=false;$("#goalName").focus();return}if(!Number.isFinite(target)||target<=0){error.textContent="Escribe un objetivo mayor a $0.00.";error.hidden=false;$("#goalTarget").focus();return}if(!Number.isFinite(saved)||saved<0){error.textContent="El monto ahorrado no puede ser negativo.";error.hidden=false;$("#goalSaved").focus();return}const obj={...g,name,target,saved};if(existing)state.goals=state.goals.map(x=>x.id===g.id?obj:x);else state.goals.push(obj);if(save(existing?"Meta actualizada":"Meta guardada"))closeSheet()}}
function accountSheet(existing){
  const a=existing||{id:uid(),name:"",type:"bank",balance:0,creditLimit:0,cutDay:0,dueDay:0,minimumPayment:0,noInterestPayment:0,reminders:true};
  const currentDebt=a.type==="credit"?Math.max(0,-accountBalance(a.id)):0;
  openSheet(existing?"Editar cuenta":"Nueva cuenta",`<form id="accountForm" class="form"><div class="field"><label>Nombre</label><input class="input" name="name" value="${esc(a.name)}" placeholder="Ej. BBVA Azul" required></div><div class="field"><label>Tipo</label><select name="type" id="accountType">${[["cash","Efectivo"],["bank","Banco"],["savings","Ahorro"],["investment","Inversión"],["credit","Tarjeta de crédito"]].map(([v,l])=>`<option value="${v}" ${a.type===v?"selected":""}>${l}</option>`).join("")}</select></div><div class="field" id="standardBalanceField" style="display:${a.type==="credit"?"none":"block"}"><label>Saldo inicial</label><input class="input" name="balance" type="number" step=".01" value="${a.type==="credit"?0:a.balance}"></div><div id="creditFields" style="display:${a.type==="credit"?"grid":"none"};gap:16px"><div class="field"><label>Deuda actual</label><input class="input" name="currentDebt" type="number" min="0" step=".01" value="${currentDebt}"><small class="field-note">Escribe lo que debes hoy. Los pagos desde otra cuenta reducirán esta deuda automáticamente.</small></div><div class="field"><label>Límite de crédito</label><input class="input" name="creditLimit" type="number" min="0" step=".01" value="${a.creditLimit}"></div><div class="form-grid"><div class="field"><label>Día de corte</label><input class="input" name="cutDay" type="number" min="1" max="31" value="${a.cutDay||""}"></div><div class="field"><label>Día límite de pago</label><input class="input" name="dueDay" type="number" min="1" max="31" value="${a.dueDay||""}"></div></div><div class="form-grid"><div class="field"><label>Pago mínimo</label><input class="input" name="minimumPayment" type="number" min="0" step=".01" value="${a.minimumPayment||0}"></div><div class="field"><label>Pago para no generar intereses</label><input class="input" name="noInterestPayment" type="number" min="0" step=".01" value="${a.noInterestPayment||0}"></div></div><label class="check-row"><input type="checkbox" name="reminders" ${a.reminders!==false?"checked":""}> Recordarme antes de la fecha límite</label></div><button class="primary-btn">Guardar cuenta</button>${existing&&state.accounts.length>1?`<button type="button" class="secondary-btn negative" id="deleteAccount">Eliminar cuenta</button>`:""}</form>`);
  const syncType=()=>{const credit=$("#accountType").value==="credit";$("#creditFields").style.display=credit?"grid":"none";$("#standardBalanceField").style.display=credit?"none":"block"};
  $("#accountType").onchange=syncType;
  $("#accountForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),type=f.get("type"),desiredDebt=Math.max(0,Number(f.get("currentDebt")||0)),delta=existing?accountTransactionDelta(a.id):0,balance=type==="credit"?-desiredDebt-delta:Number(f.get("balance")||0),obj={...a,name:String(f.get("name")||"").trim(),type,balance,creditLimit:Number(f.get("creditLimit")||0),cutDay:Number(f.get("cutDay")||0),dueDay:Number(f.get("dueDay")||0),minimumPayment:Number(f.get("minimumPayment")||0),noInterestPayment:Number(f.get("noInterestPayment")||0),reminders:f.get("reminders")==="on"};if(existing)state.accounts=state.accounts.map(x=>x.id===a.id?obj:x);else state.accounts.push(obj);if(save("Cuenta guardada"))closeSheet()};
  const del=$("#deleteAccount");if(del)del.onclick=()=>{const links=state.transactions.filter(t=>t.accountId===a.id||t.destinationId===a.id).length;if(links){alert(`Esta cuenta tiene ${links} movimientos relacionados. Para conservar tus saldos e historial no puede eliminarse. Puedes editar su nombre.`);return}if(confirm("¿Eliminar esta cuenta sin movimientos relacionados?")){state.accounts=state.accounts.filter(x=>x.id!==a.id);if(save("Cuenta eliminada"))closeSheet()}}
}
function categorySheet(kind,existing){const isIncome=kind==="income",list=isIncome?incomeCategories():expenseCategories(),c=existing||{id:`custom-${kind}-${uid()}`,name:"",emoji:"",color:"#8395a7",system:false};openSheet(existing?"Editar categoría":`Nueva categoría de ${isIncome?"ingreso":"gasto"}`,`<form id="categoryForm" class="form"><div class="field"><label>Emoji</label><input class="input emoji-input" name="emoji" value="${esc(c.emoji)}" placeholder="Ej. ${isIncome?"💵":"🐶"}" required></div><div class="field"><label>Nombre</label><input class="input" name="name" value="${esc(c.name)}" placeholder="Ej. ${isIncome?"Freelance":"Mascotas"}" maxlength="40" required></div><div class="field"><label>Color</label><input class="input color-input" name="color" type="color" value="${esc(c.color||"#8395a7")}"></div><button class="primary-btn">${existing?"Guardar cambios":"Agregar categoría"}</button></form>`);$("#categoryForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),name=String(f.get("name")||"").trim(),emoji=String(f.get("emoji")||"").trim(),color=String(f.get("color")||"#8395a7");if(!name||!emoji){showToast("Escribe un nombre y un emoji");return}if(list.some(x=>x.id!==c.id&&x.name.toLocaleLowerCase("es-MX")===name.toLocaleLowerCase("es-MX"))){showToast("Ya existe una categoría con ese nombre");return}const obj={...c,name,emoji,color,createdAt:c.createdAt||new Date().toISOString()};if(isIncome)state.incomeCategories=existing?state.incomeCategories.map(x=>x.id===c.id?obj:x):[...state.incomeCategories,obj];else state.expenseCategories=existing?state.expenseCategories.map(x=>x.id===c.id?obj:x):[...state.expenseCategories,obj];state.transactions=state.transactions.map(t=>t.type===kind&&t.categoryId===c.id?{...t,category:name,categoryEmoji:emoji}:t);if(!isIncome)state.budgets=state.budgets.map(b=>b.categoryId===c.id?{...b,category:name}:b);if(save(existing?"Categoría actualizada":"Categoría agregada"))closeSheet()}}
function deleteCategoryFlow(kind,c){const isIncome=kind==="income",txCount=state.transactions.filter(t=>t.type===kind&&t.categoryId===c.id).length,budgetCount=isIncome?0:state.budgets.filter(b=>b.categoryId===c.id).length;if(!txCount&&!budgetCount){if(confirm(`¿Borrar ${c.emoji} ${c.name}?`)){if(isIncome)state.incomeCategories=state.incomeCategories.filter(x=>x.id!==c.id);else state.expenseCategories=state.expenseCategories.filter(x=>x.id!==c.id);save("Categoría eliminada")}return}const choices=(isIncome?incomeCategoryOptions():expenseCategoryOptions()).filter(x=>x.id!==c.id);openSheet("Reasignar categoría",`<form id="reassignCategoryForm" class="form"><p class="settings-note">${esc(c.emoji)} ${esc(c.name)} se usa en ${txCount} movimiento(s)${budgetCount?` y ${budgetCount} presupuesto(s)`:""}. Elige otra categoría para conservar todo.</p><div class="field"><label>Mover a</label><select name="targetId">${choices.map(x=>`<option value="${x.id}">${esc(x.emoji)} ${esc(x.name)}</option>`).join("")}</select></div><button class="primary-btn">Reasignar y eliminar</button></form>`);$("#reassignCategoryForm").onsubmit=e=>{e.preventDefault();const target=(isIncome?incomeCategoryById:categoryById)(new FormData(e.currentTarget).get("targetId"));if(!target)return;state.transactions=state.transactions.map(t=>t.type===kind&&t.categoryId===c.id?{...t,categoryId:target.id,category:target.name,categoryEmoji:target.emoji}:t);if(!isIncome)state.budgets=state.budgets.map(b=>b.categoryId===c.id?{...b,categoryId:target.id,category:target.name}:b);if(isIncome)state.incomeCategories=state.incomeCategories.filter(x=>x.id!==c.id);else state.expenseCategories=state.expenseCategories.filter(x=>x.id!==c.id);if(save("Categoría reasignada y eliminada"))closeSheet()}}
let pendingImport=null;
function downloadJSON(payload,name){
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const link=document.createElement("a"),url=URL.createObjectURL(blob);
  link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function exportBackup(){
  if(window.__confinStorageBlocked){showToast("Datos bloqueados para evitar pérdida. Recupera un respaldo.");return}
  downloadJSON({app:"ConFin",version:VERSION,exportedAt:new Date().toISOString(),data:state},`ConFin-respaldo-${localDateKey()}.json`);
  try{localStorage.setItem(LAST_EXPORT_KEY,new Date().toISOString())}catch{}
  showToast("Descarga iniciada. Confirma el archivo en Archivos.");
}
function exportCategories(){
  downloadJSON({app:"ConFin",type:"categories",version:VERSION,expenseCategories:state.expenseCategories,incomeCategories:state.incomeCategories},`ConFin-categorias-${localDateKey()}.json`);
  showToast("Archivo de categorías generado");
}
function countsOf(d){
  return `Cuentas: ${d.accounts.length} · Movimientos: ${d.transactions.length} · Presupuestos: ${d.budgets.length} · Metas: ${d.goals.length} · Categorías: ${(d.expenseCategories?.length||0)+(d.incomeCategories?.length||0)}`;
}
function previewImport(next,title="Revisar restauración"){
  pendingImport=clone(next);
  openSheet(title,`<div class="import-preview"><p>El archivo pasó la validación de estructura. <strong>Esta operación reemplaza todos tus datos locales.</strong> No sincroniza dispositivos.</p><div class="preview-box"><span>En este teléfono ahora</span><p>${esc(countsOf(state))}</p></div><div class="preview-box"><span>Contenido del archivo</span><p>${esc(countsOf(next))}</p></div><p>Antes de continuar, exporta un respaldo y comprueba que se descargó correctamente.</p><button class="primary-btn" type="button" data-action="confirm-import">Sí, reemplazar datos</button><button class="secondary-btn" type="button" data-close>Cancelar</button></div>`);
}
function saveRestorePoint(){
  const text=localStorage.getItem(KEY);
  if(text&&parseStored(text))localStorage.setItem(RESTORE_KEY,text);
}
function confirmPendingImport(){
  if(!pendingImport)return;
  if(!confirm("¿CONFIRMAS que se reemplazarán todos los movimientos, cuentas y metas de este dispositivo?"))return;
  try{saveRestorePoint()}catch(e){showToast("No hay espacio para un punto de recuperación. Exporta antes un respaldo.");return}
  const before=clone(state),blocked=window.__confinStorageBlocked;
  window.__confinStorageBlocked=false;
  state=clone(pendingImport);
  const ok=save(okMessage(before,state));
  if(!ok)window.__confinStorageBlocked=blocked;
  if(ok){window.__confinStorageBlocked=false;pendingImport=null;closeSheet();route="home";render()}
}
function okMessage(before,after){return `Respaldo restaurado: ${after.transactions.length} movimientos`}
function previewPrevious(){
  const previous=localStorage.getItem(RESTORE_KEY);
  const parsed=previous&&parseStored(previous,{strict:true});
  if(!parsed){showToast("No hay una copia anterior válida");return}
  previewImport(parsed,"Recuperar datos anteriores");
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
  if(action==="privacy"){state.privacy=!state.privacy;save()}
  if(action==="settings"){route="settings";render()}
  if(action==="edit-name"){const n=prompt("Tu nombre",state.userName);if(n?.trim()){state.userName=n.trim();save("Nombre actualizado")}}
  if(action==="notifications")toggleNotifications();
  if(action==="face-id")toggleFaceId();
  if(action==="set-recovery-pin")setRecoveryPin();
  if(action==="export")exportBackup();
  if(action==="import")$("#importFile")?.click();
  if(action==="export-categories")exportCategories();
  if(action==="import-categories")$("#importCategoriesFile")?.click();
  if(action==="confirm-import")confirmPendingImport();
  if(action==="restore-previous")previewPrevious();
  if(action==="reset")resetApplication();
  if(action==="toggle-history"){historyOpen=!historyOpen;render()}
  if(action==="more-transactions"){listLimit+=40;const el=$("#transactionResults");if(el){el.innerHTML=transactionResults();requestAnimationFrame(fitAmounts)}}
  if(action==="update-app")refreshApplication();
  if(action==="check-update")checkForUpdates(true);
}
function compareVersions(a,b){const pa=String(a).split(".").map(Number),pb=String(b).split(".").map(Number);for(let i=0;i<Math.max(pa.length,pb.length);i++){const d=(pa[i]||0)-(pb[i]||0);if(d)return d}return 0}
async function checkForUpdates(manual=false){try{const r=await fetch(`version.json?t=${Date.now()}`,{cache:"no-store"});if(!r.ok)throw new Error();const info=await r.json();if(compareVersions(info.version,VERSION)>0){openSheet("Nueva versión disponible",`<div class="update-card"><p class="eyebrow">ConFin ${esc(info.version)}</p><h2>Es necesario actualizar</h2><p>${esc(info.message||"Hay mejoras y correcciones disponibles.")}</p>${Array.isArray(info.changes)?`<ul class="update-list">${info.changes.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}<button class="primary-btn" data-action="update-app">Actualizar ahora</button><button class="secondary-btn" data-close>Más tarde</button></div>`)}else if(manual)showToast("ConFin está actualizado")}catch(e){if(manual)showToast("No se pudo comprobar la actualización")}}
async function refreshApplication(){
  try{
    if("serviceWorker" in navigator){
      const registration=await navigator.serviceWorker.getRegistration();
      if(registration){
        await registration.update();
        if(registration.waiting){
          registration.waiting.postMessage({type:"SKIP_WAITING"});
          await new Promise(resolve=>{const timer=setTimeout(resolve,1200);navigator.serviceWorker.addEventListener("controllerchange",()=>{clearTimeout(timer);resolve()},{once:true})});
        }
      }
    }
    location.replace(`${location.pathname}?updated=${Date.now()}`);
  }catch(e){console.warn("Actualización",e);location.reload()}
}
async function toggleNotifications(){if(state.notifications){state.notifications=false;save("Notificaciones desactivadas");return}if(!("Notification" in window)){showToast("Este dispositivo no admite notificaciones web");return}const permission=await Notification.requestPermission();state.notifications=permission==="granted";save(state.notifications?"Notificaciones activadas":"Permiso no concedido");if(state.notifications)new Notification("ConFin",{body:"Las notificaciones están activadas.",icon:"icons/icon-192.png"})}
function checkDueNotifications(){const list=creditReminders();if(!state.notifications||Notification.permission!=="granted"||!list.length)return;const key=`confin-notified-${localDateKey()}`;if(sessionStorage.getItem(key))return;const r=list[0];new Notification(`Pago próximo: ${r.account.name}`,{body:r.due===0?"Tu pago vence hoy.":`Tu pago vence en ${r.due} días.`,icon:"icons/icon-192.png"});sessionStorage.setItem(key,"1")}
document.addEventListener("change",e=>{
  if(e.target.matches('[data-action="lead-days"]')){
    state.reminderLeadDays=Number(e.target.value);save("Recordatorio actualizado");
  }
  if(e.target.id==="transactionMonth"){
    transactionMonth=e.target.value;listLimit=40;
    const list=$("#transactionResults");if(list){list.innerHTML=transactionResults();requestAnimationFrame(fitAmounts)}
  }
  if(e.target.id==="historyMonth"){
    historyMonth=e.target.value;historyOpen=true;render();
  }
});
document.addEventListener("input",e=>{
  if(e.target.id==="transactionSearch"){
    transactionSearch=e.target.value;listLimit=40;
    const list=$("#transactionResults");if(list){list.innerHTML=transactionResults();requestAnimationFrame(fitAmounts)}
  }
});
document.addEventListener("click",e=>{
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
  const ea=e.target.closest("[data-edit-account]");
  if(ea){accountSheet(state.accounts.find(x=>x.id===ea.dataset.editAccount));return}
  const th=e.target.closest("[data-theme]");
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
fab.addEventListener("click",()=>movementSheet());
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
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js?v=5.3.4"));
