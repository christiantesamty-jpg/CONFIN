import { getState } from "../core/store.js";
import { money, esc, monthKey, clamp } from "../core/format.js";

export function category(id) {
  return getState().categories.find((c) => c.id === id);
}

export function accountBalance(id) {
  const state = getState();
  const account = state.accounts.find((item) => item.id === id);
  let balance = Number(account?.openingBalance || 0);

  for (const transaction of state.transactions) {
    if (transaction.type === "income" && transaction.accountId === id) balance += transaction.amount;
    if (transaction.type === "expense" && transaction.accountId === id) balance -= transaction.amount;

    if (transaction.type === "transfer") {
      if (transaction.accountId === id) balance -= transaction.amount;
      if (transaction.destinationId === id) balance += transaction.amount;
    }
  }

  return balance;
}

const settingsIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.15.37.38.7.68.96.3.26.69.4 1.09.4H21v4h-.1a1.7 1.7 0 0 0-1.5.64Z"></path>
  </svg>`;

const header = (title) => `
  <header class="top">
    <div>
      <p>Hola, ${esc(getState().userName)} 👋</p>
      <h1>${title}</h1>
    </div>
    <button class="settings icon-btn" data-action="settings" aria-label="Configuración">
      ${settingsIcon}
    </button>
  </header>`;

const txRow = (transaction) => {
  const currentCategory = category(transaction.categoryId);
  const account = getState().accounts.find((item) => item.id === transaction.accountId);
  const sign = transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : "";

  return `
    <article class="tx-card">
      <div class="tx-icon">${currentCategory?.emoji || "⇆"}</div>
      <div class="grow">
        <strong>${esc(transaction.note || currentCategory?.name || "Transferencia")}</strong>
        <small>${esc(currentCategory?.name || "Transferencia")} · ${esc(account?.name || "Cuenta")} · ${esc(transaction.date)}</small>
      </div>
      <div class="tx-side">
        <b class="${transaction.type}">${sign}${money(transaction.amount)}</b>
        <div>
          <button data-edit-tx="${transaction.id}">Editar</button>
          <button class="danger-link" data-delete-tx="${transaction.id}">Borrar</button>
        </div>
      </div>
    </article>`;
};

export function home() {
  const state = getState();
  const month = monthKey();
  const transactions = state.transactions.filter((transaction) => monthKey(transaction.date) === month);
  const income = transactions.filter((transaction) => transaction.type === "income").reduce((total, transaction) => total + transaction.amount, 0);
  const expense = transactions.filter((transaction) => transaction.type === "expense").reduce((total, transaction) => total + transaction.amount, 0);
  const available = state.accounts.filter((account) => account.type !== "credit").reduce((total, account) => total + accountBalance(account.id), 0);

  return `${header("ConFin")}
    <section class="hero">
      <div class="hero-head">
        <div>
          <span>Patrimonio disponible</span>
          <strong class="fit-amount">${money(available)}</strong>
        </div>
        <button class="privacy" data-action="privacy">${state.privacy ? "Mostrar" : "Privado"}</button>
      </div>
      <div class="spark">${[25, 42, 35, 58, 49, 70, 82].map((height) => `<i style="height:${height}%"></i>`).join("")}</div>
      <footer>
        <span>${income ? `▲ ${Math.round(((income - expense) / income) * 100)}% de ahorro este mes` : "Agrega ingresos para medir tu ahorro"}</span>
        <b>MXN</b>
      </footer>
    </section>
    <div class="metric-grid">
      <article><span>↓</span><small>Ingresos</small><strong>${money(income)}</strong><em>Este mes</em></article>
      <article><span>↑</span><small>Gastos</small><strong>${money(expense)}</strong><em>Este mes</em></article>
    </div>
    <section class="section-title">
      <div><small>Actividad</small><h2>Últimos movimientos</h2></div>
      <button data-route="transactions">Ver todos</button>
    </section>
    <div class="stack">${state.transactions.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 4).map(txRow).join("") || '<div class="empty">Tu actividad aparecerá aquí.</div>'}</div>`;
}

export function transactions() {
  const state = getState();
  return `${header("Movimientos")}
    <div class="chips"><button class="active">Todos</button><button>Gastos</button><button>Ingresos</button></div>
    <div class="stack">${state.transactions.slice().sort((a, b) => b.createdAt - a.createdAt).map(txRow).join("") || '<div class="empty">No hay movimientos.</div>'}</div>`;
}

export function budgets() {
  const state = getState();
  const month = monthKey();
  const spent = (id) => state.transactions.filter((transaction) => transaction.type === "expense" && transaction.categoryId === id && monthKey(transaction.date) === month).reduce((total, transaction) => total + transaction.amount, 0);

  return `${header("Presupuestos")}
    <section class="section-title"><div><small>Control mensual</small></div><button data-action="new-budget">+ Nuevo</button></section>
    <div class="stack">${state.budgets.map((budget) => {
      const currentCategory = category(budget.categoryId);
      const used = spent(budget.categoryId);
      const percentage = clamp((used / budget.limit) * 100, 0, 100);
      return `<article class="budget"><div class="budget-top"><div><strong>${currentCategory?.emoji || "•"} ${esc(currentCategory?.name || "Categoría")}</strong><small>${money(used)} de ${money(budget.limit)}</small></div><div class="budget-actions"><button data-edit-budget="${budget.id}">Editar</button><button class="danger" data-delete-budget="${budget.id}">Borrar</button></div></div><div class="budget-meta"><span>Uso mensual</span><b>${Math.round(percentage)}%</b></div><div class="progress"><i style="width:${percentage}%"></i></div></article>`;
    }).join("") || '<div class="empty">Crea tu primer presupuesto.</div>'}</div>`;
}

export function goals() {
  const state = getState();
  return `${header("Metas")}
    <section class="section-title"><div><small>Objetivos de ahorro</small></div><button data-action="new-goal">+ Nueva</button></section>
    <div class="stack">${state.goals.map((goal) => {
      const percentage = clamp((goal.saved / goal.target) * 100, 0, 100);
      return `<article class="goal"><div><strong>${esc(goal.name)}</strong><small>${money(goal.saved)} de ${money(goal.target)}</small></div><b>${Math.round(percentage)}%</b><div class="progress"><i style="width:${percentage}%"></i></div><footer><button data-edit-goal="${goal.id}">Editar</button><button class="danger-link" data-delete-goal="${goal.id}">Borrar</button></footer></article>`;
    }).join("") || '<div class="empty">Agrega una meta de ahorro.</div>'}</div>`;
}

export function accounts() {
  const state = getState();
  const available = state.accounts.filter((account) => account.type !== "credit").reduce((total, account) => total + accountBalance(account.id), 0);
  const debt = -state.accounts.filter((account) => account.type === "credit").reduce((total, account) => total + Math.min(0, accountBalance(account.id)), 0);

  return `${header("Cuentas")}
    <section class="section-title"><div><small>Tu dinero</small></div><button data-action="new-account">+ Nueva</button></section>
    <div class="account-summary"><article><span>Disponible</span><strong class="fit-amount">${money(available)}</strong></article><article><span>Deuda crédito</span><strong class="negative fit-amount">${money(debt)}</strong></article></div>
    <div class="stack">${state.accounts.map((account) => `<article class="account"><div class="tx-icon">${account.type === "cash" ? "💵" : account.type === "credit" ? "💳" : account.type === "savings" ? "🐷" : "🏦"}</div><div class="grow"><strong>${esc(account.name)}</strong><small>${esc(account.type)}</small></div><div class="tx-side"><b>${money(accountBalance(account.id))}</b><button data-edit-account="${account.id}">Editar</button>${account.type === "credit" ? `<button data-pay-card="${account.id}">Pagar</button>` : ""}</div></article>`).join("")}</div>`;
}

export const pages = { home, transactions, budgets, goals, accounts };
