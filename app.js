
const KEY = "confin-data-v1";

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
  goals: []
};

const expenseCategories = ["Alimentación","Gasolina","Transporte","Vivienda","Servicios","Salud","Entretenimiento","Compras","Educación","Deudas","Ahorro","Otros gastos"];
const incomeCategories = ["Nómina","Comisiones","Ventas","Honorarios","Bonos","Rendimientos","Reembolsos","Regalos","Otros ingresos"];
const icons = {
  "Alimentación":"🍽️","Gasolina":"⛽","Transporte":"🚗","Vivienda":"🏠","Servicios":"💡","Salud":"❤️",
  "Entretenimiento":"🎬","Compras":"🛍️","Educación":"📚","Deudas":"🧾","Ahorro":"🐷","Otros gastos":"•",
  "Nómina":"💼","Comisiones":"🤝","Ventas":"🏷️","Honorarios":"🧑‍💻","Bonos":"🎁","Rendimientos":"📈",
  "Reembolsos":"↩️","Regalos":"🎉","Otros ingresos":"＋"
};

let data = loadData();
let currentType = "expense";
let currentFilter = "all";

function loadData(){
  try {
    return JSON.parse(localStorage.getItem(KEY)) || structuredClone(defaultData);
  } catch {
    return structuredClone(defaultData);
  }
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
  savingsMonth.textContent = money(income-expense);
  budgetRemaining.textContent = money(remaining);
  budgetTotal.textContent = money(totalBudget);
  budgetRemaining2.textContent = money(remaining);

  const byCat = {};
  monthTx.filter(t=>t.type==="expense").forEach(t=>byCat[t.category]=(byCat[t.category]||0)+Number(t.amount));
  const chart = document.getElementById("categoryChart");
  const entries = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  if(!entries.length){
    chart.className="category-chart empty-state";
    chart.textContent="Registra tu primer gasto para ver el resumen.";
  }else{
    chart.className="category-chart";
    const max = entries[0][1];
    chart.innerHTML = entries.map(([cat,val])=>`
      <div class="category-row">
        <div class="category-meta"><span>${icons[cat]||"•"} ${escapeHtml(cat)}</span><strong>${money(val)}</strong></div>
        <div class="bar"><span style="width:${Math.max(6,val/max*100)}%"></span></div>
      </div>`).join("");
  }
}

function renderTransactions(){
  const list = document.getElementById("transactionsList");
  let txs = [...data.transactions].sort((a,b)=>b.date.localeCompare(a.date));
  if(currentFilter!=="all") txs=txs.filter(t=>t.type===currentFilter);
  if(!txs.length){
    list.innerHTML=`<div class="list-card empty-state">No hay movimientos todavía.</div>`;
    return;
  }
  list.innerHTML=txs.map(tx=>{
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
        <div><p class="tx-title">${escapeHtml(title)}</p><span class="tx-sub">${escapeHtml(subtitle)} · ${tx.date}</span></div>
      </div>
      <span class="tx-amount ${cls}">${sign}${money(tx.amount)}</span>
    </article>`;
  }).join("");
}

function renderAccounts(){
  const list=document.getElementById("accountsList");
  list.innerHTML=data.accounts.map(a=>`
    <article class="list-card account-row">
      <div class="tx-left">
        <div class="tx-icon">${a.type==="cash"?"💵":a.type==="savings"?"🐷":a.type==="credit"?"💳":"🏦"}</div>
        <div><p class="tx-title">${escapeHtml(a.name)}</p><span class="tx-sub">${accountTypeName(a.type)}</span></div>
      </div>
      <strong>${money(accountBalance(a.id))}</strong>
    </article>`).join("") || `<div class="list-card empty-state">Agrega tu primera cuenta.</div>`;
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
}
function renderAll(){
  renderDashboard(); renderTransactions(); renderAccounts(); renderBudgets(); renderGoals(); renderSelects();
}

document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.dataset.view===btn.dataset.target));
  pageTitle.textContent = btn.dataset.target==="inicio" ? "ConFin" : btn.querySelector("small").textContent;
}));

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
  data.transactions.push({
    id:crypto.randomUUID(),
    type:currentType,
    amount,
    category:currentType==="transfer"?"Transferencia":txCategory.value,
    accountId:txAccount.value,
    destinationId:currentType==="transfer"?txDestination.value:null,
    date:txDate.value,
    note:txNote.value.trim()
  });
  transactionForm.reset();
  txDate.valueAsDate=new Date();
  closeModals();
  saveData();
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
addAccountButton.addEventListener("click",()=>openSimpleDialog("Nueva cuenta",`
  <label><span>Nombre</span><input name="name" required placeholder="Ej. BBVA"></label>
  <label><span>Tipo</span><select name="type"><option value="cash">Efectivo</option><option value="bank">Banco</option><option value="savings">Ahorro</option><option value="credit">Tarjeta de crédito</option><option value="investment">Inversión</option></select></label>
  <label><span>Saldo inicial</span><input name="balance" type="number" step="0.01" value="0"></label>`,
  fd=>data.accounts.push({id:crypto.randomUUID(),name:fd.get("name"),type:fd.get("type"),balance:Number(fd.get("balance")||0)})));

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
    data=imported; saveData(); alert("Respaldo importado correctamente.");
  }catch{alert("El archivo no es un respaldo válido de ConFin.");}
  e.target.value="";
});
resetButton.addEventListener("click",()=>{
  if(confirm("Esto borrará todos tus datos de ConFin en este dispositivo. ¿Continuar?")){
    data=structuredClone(defaultData); saveData(); closeModals();
  }
});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
}
renderAll();
