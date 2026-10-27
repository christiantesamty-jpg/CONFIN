/* Pure financial/date functions. No DOM, storage or device assumptions. */
(function(root){
  'use strict';
  const MAX_CENTS=90000000000000;
  function toCents(value){
    const n=typeof value==='number'?value:Number(String(value??'').replace(/,/g,'').trim());
    if(!Number.isFinite(n))throw new RangeError('Importe no v\u00e1lido');
    const cents=Math.round(n*100);
    if(!Number.isSafeInteger(cents)||Math.abs(cents)>MAX_CENTS||Math.abs(n*100-cents)>0.001)throw new RangeError('Usa hasta dos decimales y un importe dentro del rango admitido');
    return cents;
  }
  function addCents(a,b){const n=a+b;if(!Number.isSafeInteger(n)||Math.abs(n)>MAX_CENTS)throw new RangeError('El total supera el rango seguro');return n}
  function sumMoney(values){return values.reduce((a,n)=>addCents(a,toCents(n)),0)/100}
  function subtract(a,b){return addCents(toCents(a),-toCents(b))/100}
  function validMonth(value){return typeof value==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(value)&&+value.slice(0,4)>=1&&+value.slice(0,4)<=9999}
  function shiftMonth(value,delta){
    if(!validMonth(value)||!Number.isInteger(delta))throw new Error('Mes no v\u00e1lido');
    const [y,m]=value.split('-').map(Number),absolute=y*12+m-1+delta;
    const year=Math.floor(absolute/12),month=absolute%12+1;
    if(year<1||year>9999)return value;
    return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}`;
  }
  function dateKey(d=new Date()){return `${String(d.getFullYear()).padStart(4,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function validDate(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!validMonth(value.slice(0,7)))return false;
    const [y,m,d]=value.split('-').map(Number);const date=new Date(0);date.setHours(12,0,0,0);date.setFullYear(y,m-1,d);
    return dateKey(date)===value;
  }
  function metrics(state){
    const balances=new Map(),deltas=new Map(),monthly=new Map(),daily=new Map(),expenseByCategory=new Map();
    const accounts=new Map(state.accounts.map(a=>[a.id,a]));
    state.accounts.forEach(a=>{balances.set(a.id,toCents(a.balance));deltas.set(a.id,0)});
    function change(id,cents){if(!accounts.has(id))throw new Error('Movimiento con cuenta inexistente');balances.set(id,addCents(balances.get(id),cents));deltas.set(id,addCents(deltas.get(id),cents))}
    for(const t of state.transactions){
      const amount=toCents(t.amount);
      if(t.type==='income')change(t.accountId,amount);
      else if(t.type==='expense')change(t.accountId,-amount);
      else if(t.type==='transfer'){change(t.accountId,-amount);change(t.destinationId,amount);continue}
      else throw new Error('Tipo de movimiento no v\u00e1lido');
      const month=t.date.slice(0,7);
      if(!monthly.has(month))monthly.set(month,{income:0,expense:0});
      if(!daily.has(t.date))daily.set(t.date,{income:0,expense:0});
      monthly.get(month)[t.type]=addCents(monthly.get(month)[t.type],amount);
      daily.get(t.date)[t.type]=addCents(daily.get(t.date)[t.type],amount);
      if(t.type==='expense'){
        if(!expenseByCategory.has(month))expenseByCategory.set(month,new Map());
        const map=expenseByCategory.get(month),id=t.categoryId||t.category;
        map.set(id,addCents(map.get(id)||0,amount));
      }
    }
    for(const map of [balances,deltas])for(const [id,n] of map)map.set(id,n/100);
    for(const map of [monthly,daily])for(const obj of map.values()){obj.income/=100;obj.expense/=100}
    for(const map of expenseByCategory.values())for(const [id,n] of map)map.set(id,n/100);
    return {balances,deltas,monthly,daily,expenseByCategory,accounts,sorted:[...state.transactions].sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt||'').localeCompare(String(a.createdAt||'')))};
  }
  const api=Object.freeze({MAX_CENTS,toCents,addCents,sumMoney,subtract,validMonth,shiftMonth,dateKey,validDate,metrics});
  root.ConFinCore=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
