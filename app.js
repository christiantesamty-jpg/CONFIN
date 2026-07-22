
const KEY = "confin-data-v1";
const APP_VERSION = "3.2";

const defaultData = {
  userName: "Christian",
  accounts: [
    { id: crypto.randomUUID(), name: "Efectivo", type: "cash", balance: 0 },
    { id: crypto.randomUUID(), name: "Banco", type: "bank", balance: 0 },
    { id: crypto.randomUUID(), name: "Ahorros", type: "savings", balance: 0 }
  ],
  transactions: [],
  budgets: [
    { id: crypto.randomUUID(), category: "Alimentación", limit: 5000 },
    { id: crypto.randomUUID(), category: "Transporte", limit: 2500 },
    { id: crypto.randomUUID(), category: "Entretenimiento", limit: 2000 }
  ],
  goals: [],
  theme: "midnight"
};

const expenseCategories = ["Alimentación","Gasolina","Transporte","Vivienda","Servicios","Salud","Entretenimiento","Compras","Educación","Deudas","Ahorro","Otros gastos"];
const incomeCategories = ["Nómina","Comisiones","Ventas","Honorarios","Bonos","Rendimientos","Reembolsos","Regalos","Otros ingresos"];
const icons = {
  "Alimentación":"🍽️","Gasolina":"⛽","Transporte":"🚗","Vivienda":"🏠","Servicios":"💡","Salud":"❤️",
  "Entretenimiento":"🎬","Compras":"🛍️","Educación":"📚","Deudas":"🧾","Ahorro":"🐷","Otros gastos":"•",
  "Nómina":"💼","Comisiones":"🤝","Ventas":"🏷️","Honorarios":"🧑‍💻","Bonos":"🎁","Rendimientos":"📈",
  "Reembolsos":"↩️","Regalos":"🎉","Otros ingresos":"＋"
};

let data = normalizeData(loadData());
let currentType = "expense";
let currentFilter = "all";

function applyTheme(theme){
  const selected=["midnight","ocean","violet","sand","light"].includes(theme)?theme:"midnight";
  document.documentElement.dataset.theme=selected;
  const themeColor={midnight:"#090b10",ocean:"#07131a",violet:"#100b18",sand:"#17130e",light:"#f4f6f8"}[selected];
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content",themeColor);
  document.querySelectorAll(".palette-option").forEach(btn=>btn.classList.toggle("active",btn.dataset.theme===selected));
}

// iOS PWA: let CSS own the viewport height. visualViewport can report a shortened
// value in standalone mode and create a false empty strip at the bottom.
applyTheme(data.theme);

function loadData(){
  try {
    return JSON.parse(localStorage.getItem(KEY)) || structuredClone(defaultData);
  } catch {
    return structuredClone(defaultData);
  }
}

function normalizeData(source){
  const normalized = source && typeof source === "object" ? source : structuredClone(defaultData);
  normalized.accounts = Array.isArray(normalized.accounts) ? normalized.accounts : [];
  normalized.transactions = Array.isArray(normalized.transactions) ? normalized.transactions : [];
  normalized.budgets = Array.isArray(normalized.budgets) ? normalized.budgets : [];
  normalized.goals = Array.isArray(normalized.goals) ? normalized.goals : [];
  normalized.theme = ["midnight","ocean","violet","sand","light"].includes(normalized.theme) ? normalized.theme : "midnight";
  normalized.accounts = normalized.accounts.map(a=>({
    ...a,
    balance:Number(a.balance||0),
    creditLimit:Number(a.creditLimit||0),
    cutDay:Number(a.cutDay||0),
    dueDay:Number(a.dueDay||0)
  }));
  return normalized;
}

function saveData(){
  localStorage.setItem(KEY, JSON.stringify(data));
  renderAll();
}
function money(value){
  return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:2}).format(Number(value)||0);
}
function monthKey(dateStr){
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function currentMonthKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function escapeHtml(s=""){
  return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
}

function accountBalance(accountId){
  const account = data.accounts.find(a=>a.id===accountId);
  let balance = Number(account?.balance||0);
  for(const tx of data.transactions){
    if(tx.type==="income" && tx.accountId===accountId) balance += Number(tx.amount);
    if(tx.type==="expense" && tx.accountId===accountId) balance -= Number(tx.amount);
    if(tx.type==="transfer"){
      if(tx.accountId===accountId) balance -= Number(tx.amount);
      if(tx.destinationId===accountId) balance += Number(tx.amount);
    }
  }
  return balance;
}

function renderDashboard(){
  document.getElementById("greeting").textContent = `Hola, ${data.userName || "tú"} 👋`;
  document.getElementById("avatarInitial").textContent = (data.userName || "C").trim().charAt(0).toUpperCase();
  const balances = data.accounts.map(a=>({a,b:accountBalance(a.id)}));
  const available = balances.filter(x=>x.a.type!=="credit").reduce((s,x)=>s+x.b,0);
  const month = currentMonthKey();
  const monthTx = data.transactions.filter(t=>monthKey(t.date)===month);
  const income = monthTx.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
  const expense = monthTx.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
  const totalBudget = data.budgets.reduce((s,b)=>s+Number(b.limit),0);
  const remaining = totalBudget-expense;

  availableAmount.textContent = money(available);
  incomeMonth.textContent = money(income);
  expenseMonth.textContent = money(expense);
  budgetTotal.textContent = money(totalBudget);
  budgetRemaining2.textContent = money(remaining);
  const savingsRate = income > 0 ? Math.round(((income-expense)/income)*100) : 0;
  document.getElementById("monthlyChange").textContent = income > 0
    ? `${savingsRate >= 0 ? "▲" : "▼"} ${Math.abs(savingsRate)}% de ahorro este mes`
    : "Agrega ingresos para medir tu ahorro";

  renderRecentTransactions();
  const topExpense = monthTx.filter(t=>t.type==="expense").sort((a,b)=>Number(b.amount)-Number(a.amount))[0];
  document.getElementById("dailyTip").textContent = topExpense
    ? `Tu gasto individual más alto del mes es ${money(topExpense.amount)} en ${topExpense.category}.`
    : "Registra tus movimientos al momento para mantener tus saldos al día.";
}


function transactionMarkup(tx){
  const account=data.accounts.find(a=>a.id===tx.accountId);
  const sign=tx.type==="income"?"+":tx.type==="expense"?"-":"";
  const cls=tx.type==="income"?"positive":tx.type==="expense"?"negative":"";
  const title=tx.note || (tx.type==="transfer"?"Transferencia":tx.category);
  const subtitle=tx.type==="transfer"
    ? `${account?.name||"Cuenta"} → ${data.accounts.find(a=>a.id===tx.destinationId)?.name||"Cuenta"}`
    : `${tx.category} · ${account?.name||"Cuenta"}`;
  return `<article class="list-card transaction-row">
    <div class="tx-left">
      <div class="tx-icon">${tx.type==="transfer"?"⇆":icons[tx.category]||"•"}</div>
      <div><p class="tx-title">${escapeHtml(title)}</p><span class="tx-sub">${escapeHtml(subtitle)} · ${formatDate(tx.date)}</span></div>
    </div>
    <span class="tx-amount ${cls}">${sign}${money(tx.amount)}</span>
  </article>`;
}
function formatDate(dateStr){
  const d=new Date(dateStr+"T12:00:00");
  return new Intl.DateTimeFormat("es-MX",{day:"numeric",month:"short"}).format(d);
}
function renderRecentTransactions(){
  const list=document.getElementById("recentTransactions");
  const txs=[...data.transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
  list.innerHTML=txs.length?txs.map(transactionMarkup).join(""):`<div class="list-card empty-state">Tu actividad aparecerá aquí.</div>`;
}

function renderTransactions(){
  const list = document.getElementById("transactionsList");
  let txs = [...data.transactions].sort((a,b)=>b.date.localeCompare(a.date));
  if(currentFilter!=="all") txs=txs.filter(t=>t.type===currentFilter);
  if(!txs.length){
    list.innerHTML=`<div class="list-card empty-state">No hay movimientos todavía.</div>`;
    return;
  }
  list.innerHTML=txs.map(transactionMarkup).join("");
}

function renderAccounts(){
  const list=document.getElementById("accountsList");
  const available=data.accounts.filter(a=>a.type!=="credit").reduce((sum,a)=>sum+accountBalance(a.id),0);
  const creditDebt=data.accounts.filter(a=>a.type==="credit").reduce((sum,a)=>sum+Math.max(0,-accountBalance(a.id)),0);
  const availableEl=document.getElementById("accountsAvailable");
  const debtEl=document.getElementById("creditDebtTotal");
  if(availableEl) availableEl.textContent=money(available);
  if(debtEl) debtEl.textContent=money(creditDebt);

  list.innerHTML=data.accounts.map(a=>{
    const balance=accountBalance(a.id);
    if(a.type==="credit"){
      const debt=Math.max(0,-balance);
      const limit=Number(a.creditLimit||0);
      const utilization=limit?Math.min(100,debt/limit*100):0;
      const availableCredit=Math.max(0,limit-debt);
      return `<article class="list-card credit-card-item">
        <div class="credit-top">
          <div><p class="tx-title">💳 ${escapeHtml(a.name)}</p><span class="tx-sub">Tarjeta de crédito</span></div>
          <span class="credit-badge">CRÉDITO</span>
        </div>
        <strong class="credit-debt">${money(debt)}</strong>
        <div class="credit-meta">Saldo utilizado · ${Math.round(utilization)}% del límite</div>
        <div class="progress credit-progress"><span style="width:${utilization}%"></span></div>
        <div class="credit-bottom">
          <div>Disponible<b>${money(availableCredit)}</b></div>
          <div>Corte<b>${a.cutDay?`Día ${a.cutDay}`:"Sin fecha"}</b></div>
          <div>Pago límite<b>${a.dueDay?`Día ${a.dueDay}`:"Sin fecha"}</b></div>
        </div>
      </article>`;
    }
    return `<article class="list-card account-row">
      <div class="tx-left">
        <div class="tx-icon">${a.type==="cash"?"💵":a.type==="savings"?"🐷":a.type==="investment"?"📈":"🏦"}</div>
        <div><p class="tx-title">${escapeHtml(a.name)}</p><span class="tx-sub">${accountTypeName(a.type)}</span></div>
      </div>
      <strong>${money(balance)}</strong>
    </article>`;
  }).join("") || `<div class="list-card empty-state">Agrega tu primera cuenta.</div>`;
}

function accountTypeName(type){
  return ({cash:"Efectivo",bank:"Banco",savings:"Ahorro",credit:"Tarjeta de crédito",investment:"Inversión"})[type]||"Cuenta";
}

function spentForCategory(category){
  const month=currentMonthKey();
  return data.transactions.filter(t=>t.type==="expense"&&t.category===category&&monthKey(t.date)===month)
    .reduce((s,t)=>s+Number(t.amount),0);
}
function renderBudgets(){
  const list=document.getElementById("budgetsList");
  list.innerHTML=data.budgets.map(b=>{
    const spent=spentForCategory(b.category);
    const pct=Math.min(100,b.limit?spent/b.limit*100:0);
    return `<article class="list-card">
      <div class="account-row">
        <div><p class="tx-title">${icons[b.category]||"•"} ${escapeHtml(b.category)}</p><span class="tx-sub">${money(spent)} de ${money(b.limit)}</span></div>
        <strong class="${spent>b.limit?"negative":"positive"}">${Math.round(pct)}%</strong>
      </div>
      <div class="progress"><span style="width:${pct}%;background:${spent>b.limit?"var(--danger)":"var(--accent)"}"></span></div>
    </article>`;
  }).join("") || `<div class="list-card empty-state">Crea tu primer presupuesto.</div>`;
}
function renderGoals(){
  const list=document.getElementById("goalsList");
  list.innerHTML=data.goals.map(g=>{
    const pct=Math.min(100,g.target?g.saved/g.target*100:0);
    return `<article class="list-card">
      <div class="account-row">
        <div><p class="tx-title">◎ ${escapeHtml(g.name)}</p><span class="tx-sub">${money(g.saved)} de ${money(g.target)}</span></div>
        <strong>${Math.round(pct)}%</strong>
      </div>
      <div class="progress"><span style="width:${pct}%"></span></div>
    </article>`;
  }).join("") || `<div class="list-card empty-state">Agrega una meta de ahorro.</div>`;
}
function renderSelects(){
  const accountOptions=data.accounts.map(a=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join("");
  txAccount.innerHTML=accountOptions;
  txDestination.innerHTML=accountOptions;
  renderCategoryOptions();
}
function renderCategoryOptions(){
  const list = currentType === "income" ? incomeCategories : expenseCategories;
  txCategory.innerHTML=list.map(c=>`<option>${c}</option>`).join("");
  const grid=document.getElementById("categoryGrid");
  if(!grid) return;
  grid.innerHTML=list.map((c,i)=>`<button type="button" class="category-option ${i===0?"active":""}" data-category="${escapeHtml(c)}"><b>${icons[c]||"•"}</b><span>${escapeHtml(c)}</span></button>`).join("");
  grid.querySelectorAll(".category-option").forEach(btn=>btn.addEventListener("click",()=>{
    grid.querySelectorAll(".category-option").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    txCategory.value=btn.dataset.category;
  }));
}
function renderAll(){
  renderDashboard(); renderTransactions(); renderAccounts(); renderBudgets(); renderGoals(); renderSelects(); updateNotificationUI();
}

function navigateTo(target){
  const btn=document.querySelector(`.nav-item[data-target="${target}"]`);
  if(!btn) return;
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.dataset.view===btn.dataset.target));
  pageTitle.textContent = btn.dataset.target==="inicio" ? "ConFin" : btn.querySelector("small").textContent;
  document.getElementById("appMain").scrollTo({top:0,behavior:"instant"});
}
document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>navigateTo(btn.dataset.target)));
document.getElementById("seeAllTransactions").addEventListener("click",()=>navigateTo("movimientos"));

function openModal(el){
  modalBackdrop.classList.remove("hidden");
  el.classList.remove("hidden");
}
function closeModals(){
  modalBackdrop.classList.add("hidden");
  quickSheet.classList.add("hidden");
  simpleDialog.classList.add("hidden");
  settingsDialog.classList.add("hidden");
}
fab.addEventListener("click",()=>openModal(quickSheet));
document.querySelector(".close-sheet").addEventListener("click",closeModals);
closeDialog.addEventListener("click",closeModals);
closeSettings.addEventListener("click",closeModals);
modalBackdrop.addEventListener("click",closeModals);
settingsButton.addEventListener("click",()=>{
  userNameInput.value=data.userName||"";
  applyTheme(data.theme);
  openModal(settingsDialog);
});

document.querySelectorAll(".segment").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".segment").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  currentType=btn.dataset.type;
  renderCategoryOptions();
  categoryField.classList.toggle("hidden",currentType==="transfer");
  destinationField.classList.toggle("hidden",currentType!=="transfer");
}));

transactionForm.addEventListener("submit",e=>{
  e.preventDefault();
  const amount=Number(txAmount.value);
  if(!amount||amount<=0) return;
  if(currentType==="transfer" && txAccount.value===txDestination.value){
    alert("La cuenta origen y destino deben ser diferentes.");
    return;
  }
  const savedCategory=currentType==="transfer"?"Transferencia":txCategory.value;
  data.transactions.push({
    id:crypto.randomUUID(),
    type:currentType,
    amount,
    category:savedCategory,
    accountId:txAccount.value,
    destinationId:currentType==="transfer"?txDestination.value:null,
    date:txDate.value,
    note:txNote.value.trim()
  });
  transactionForm.reset();
  txDate.valueAsDate=new Date();
  closeModals();
  saveData();
  const savedType=currentType;
  showToast(savedType==="income"?"Ingreso guardado":savedType==="expense"?"Gasto guardado":"Transferencia guardada");
  if(savedType==="expense"){
    const budget=data.budgets.find(b=>b.category===savedCategory);
    if(budget){
      const spent=spentForCategory(budget.category);
      const pct=budget.limit?Math.round(spent/budget.limit*100):0;
      if(pct>=80) showAppNotification("Presupuesto de "+budget.category,pct>=100?"Ya alcanzaste o superaste tu presupuesto mensual.":"Ya utilizaste "+pct+"% de tu presupuesto mensual.");
    }
  }
});
txDate.valueAsDate=new Date();

document.querySelectorAll(".chip").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".chip").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  currentFilter=btn.dataset.filter;
  renderTransactions();
}));
clearFilters.addEventListener("click",()=>{
  currentFilter="all";
  document.querySelectorAll(".chip").forEach(b=>b.classList.toggle("active",b.dataset.filter==="all"));
  renderTransactions();
});

function openSimpleDialog(title, fields, onSubmit){
  dialogTitle.textContent=title;
  simpleForm.innerHTML=fields+`<button class="primary-button" type="submit">Guardar</button>`;
  simpleForm.onsubmit=e=>{e.preventDefault();onSubmit(new FormData(simpleForm));closeModals();saveData();};
  openModal(simpleDialog);
}
addAccountButton.addEventListener("click",()=>{
  openSimpleDialog("Nueva cuenta",`
    <label><span>Nombre</span><input name="name" required placeholder="Ej. BBVA, Nu o Efectivo"></label>
    <label><span>Tipo</span><select name="type" id="newAccountType"><option value="cash">Efectivo</option><option value="bank">Cuenta bancaria</option><option value="savings">Ahorro</option><option value="credit">Tarjeta de crédito</option><option value="investment">Inversión</option></select></label>
    <label><span id="initialBalanceLabel">Saldo inicial</span><input name="balance" type="number" step="0.01" value="0"></label>
    <div class="credit-fields hidden" id="creditAccountFields">
      <p class="field-help">Estos datos permiten calcular el crédito disponible y mostrar tus fechas importantes.</p>
      <label><span>Límite de crédito</span><input name="creditLimit" type="number" min="0" step="0.01" placeholder="0.00"></label>
      <div class="field-row">
        <label><span>Día de corte</span><input name="cutDay" type="number" min="1" max="31" placeholder="15"></label>
        <label><span>Día límite de pago</span><input name="dueDay" type="number" min="1" max="31" placeholder="5"></label>
      </div>
    </div>`,
    fd=>data.accounts.push({
      id:crypto.randomUUID(),name:fd.get("name"),type:fd.get("type"),balance:Number(fd.get("balance")||0),
      creditLimit:Number(fd.get("creditLimit")||0),cutDay:Number(fd.get("cutDay")||0),dueDay:Number(fd.get("dueDay")||0)
    })
  );
  const typeSelect=document.getElementById("newAccountType");
  const creditFields=document.getElementById("creditAccountFields");
  const balanceLabel=document.getElementById("initialBalanceLabel");
  const syncAccountFields=()=>{
    const isCredit=typeSelect.value==="credit";
    creditFields.classList.toggle("hidden",!isCredit);
    balanceLabel.textContent=isCredit?"Saldo inicial (usa negativo si ya debes)":"Saldo inicial";
  };
  typeSelect.addEventListener("change",syncAccountFields);
  syncAccountFields();
});

addBudgetButton.addEventListener("click",()=>openSimpleDialog("Nuevo presupuesto",`
  <label><span>Categoría</span><select name="category">${expenseCategories.map(c=>`<option>${c}</option>`).join("")}</select></label>
  <label><span>Límite mensual</span><input name="limit" type="number" min="1" step="0.01" required></label>`,
  fd=>data.budgets.push({id:crypto.randomUUID(),category:fd.get("category"),limit:Number(fd.get("limit"))})));

addGoalButton.addEventListener("click",()=>openSimpleDialog("Nueva meta",`
  <label><span>Nombre</span><input name="name" required placeholder="Ej. Fondo de emergencia"></label>
  <label><span>Meta</span><input name="target" type="number" min="1" step="0.01" required></label>
  <label><span>Ahorrado actualmente</span><input name="saved" type="number" min="0" step="0.01" value="0"></label>`,
  fd=>data.goals.push({id:crypto.randomUUID(),name:fd.get("name"),target:Number(fd.get("target")),saved:Number(fd.get("saved")||0)})));

saveNameButton.addEventListener("click",()=>{
  data.userName=userNameInput.value.trim()||"Usuario";
  saveData();
});
document.querySelectorAll(".palette-option").forEach(button=>button.addEventListener("click",()=>{
  data.theme=button.dataset.theme;
  applyTheme(data.theme);
  localStorage.setItem(KEY,JSON.stringify(data));
  showToast("Paleta actualizada");
}));

function notificationsSupported(){
  return "Notification" in window && "serviceWorker" in navigator;
}
function updateNotificationUI(){
  const status=document.getElementById("notificationStatus");
  const button=document.getElementById("notificationButton");
  if(!status||!button) return;
  if(!notificationsSupported()){
    status.textContent="No disponibles en este dispositivo";
    button.textContent="No disponible";
    button.disabled=true;
    return;
  }
  const enabled=data.notificationsEnabled===true && Notification.permission==="granted";
  status.textContent=enabled?"Activadas en este iPhone":Notification.permission==="denied"?"Bloqueadas en Ajustes":"Desactivadas";
  button.textContent=enabled?"Probar":"Activar";
}
async function showAppNotification(title,body){
  if(!notificationsSupported()||Notification.permission!=="granted"||data.notificationsEnabled!==true) return;
  const registration=await navigator.serviceWorker.ready;
  await registration.showNotification(title,{body,icon:"./icons/icon-192.png",badge:"./icons/icon-192.png",tag:"confin-update"});
}
document.getElementById("notificationButton").addEventListener("click",async()=>{
  if(!notificationsSupported()) return;
  if(Notification.permission!=="granted"){
    const permission=await Notification.requestPermission();
    if(permission!=="granted"){ updateNotificationUI(); showToast("No se concedió permiso"); return; }
  }
  data.notificationsEnabled=true;
  localStorage.setItem(KEY,JSON.stringify(data));
  updateNotificationUI();
  await showAppNotification("ConFin","Las notificaciones quedaron activadas correctamente.");
});

exportButton.addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=`confin-respaldo-${new Date().toISOString().slice(0,10)}.json`;a.click();
  URL.revokeObjectURL(url);
});
importInput.addEventListener("change",async e=>{
  const file=e.target.files[0]; if(!file) return;
  try{
    const imported=JSON.parse(await file.text());
    if(!imported.accounts||!imported.transactions) throw new Error();
    data=normalizeData(imported); saveData(); alert("Respaldo importado correctamente.");
  }catch{alert("El archivo no es un respaldo válido de ConFin.");}
  e.target.value="";
});
resetButton.addEventListener("click",()=>{
  if(confirm("Esto borrará todos tus datos de ConFin en este dispositivo. ¿Continuar?")){
    data=structuredClone(defaultData); saveData(); closeModals();
  }
});

function showToast(message){
  const toast=document.getElementById("toast");
  toast.textContent=message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>toast.classList.add("hidden"),1800);
}

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
}
renderAll();
