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
  /* Additional assets form a separate, auditable ledger. Amounts remain cents
     until all account and monthly calculations have been completed. */
  function addAssetMovements(state,change,monthly,daily){
    const investments=new Map((state.investments||[]).map(a=>[a.id,{id:a.id,value:0,contributed:0,withdrawn:0,distributed:0}]));
    const receivables=new Map((state.receivables||[]).map(a=>[a.id,{id:a.id,original:toCents(a.amount),paid:0,interest:0,pending:toCents(a.amount)}]));
    for(const loan of state.receivables||[])change(loan.accountId,-toCents(loan.amount));
    const entries=[...(state.assetEntries||[])].sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.createdAt||'').localeCompare(String(b.createdAt||''))||String(a.id).localeCompare(String(b.id)));
    function income(date,amount){
      const month=date.slice(0,7);
      if(!monthly.has(month))monthly.set(month,{income:0,expense:0});
      if(!daily.has(date))daily.set(date,{income:0,expense:0});
      monthly.get(month).income=addCents(monthly.get(month).income,amount);
      daily.get(date).income=addCents(daily.get(date).income,amount);
    }
    for(const item of entries){
      const cents=toCents(item.amount);
      if(item.kind==='investment'){
        const pos=investments.get(item.targetId);
        if(!pos)throw new Error('Operación de inversión con referencia inexistente');
        switch(item.type){
          case 'contribution': change(item.accountId,-cents);pos.contributed=addCents(pos.contributed,cents);pos.value=addCents(pos.value,cents);break;
          case 'withdrawal': if(pos.value<cents)throw new Error('Retiro superior al valor de la inversión');change(item.accountId,cents);pos.withdrawn=addCents(pos.withdrawn,cents);pos.value=addCents(pos.value,-cents);break;
          case 'payout': change(item.accountId,cents);income(item.date,cents);pos.distributed=addCents(pos.distributed,cents);break;
          case 'valuation': pos.value=cents;break;
          default:throw new Error('Operación de inversión no reconocida');
        }
      }else if(item.kind==='receivable'){
        const pos=receivables.get(item.targetId);
        if(!pos)throw new Error('Abono sin cuenta por cobrar');
        if(item.type==='payment'){
          if(pos.pending<cents)throw new Error('El abono supera el importe pendiente');
          change(item.accountId,cents);pos.paid=addCents(pos.paid,cents);pos.pending=addCents(pos.pending,-cents);
        }else if(item.type==='interest'){
          change(item.accountId,cents);income(item.date,cents);pos.interest=addCents(pos.interest,cents);
        }else throw new Error('Tipo de abono no reconocido');
      }else throw new Error('Clase de operación patrimonial no válida');
    }
    for(const pos of investments.values()){
      pos.profit=addCents(addCents(pos.value,pos.withdrawn),addCents(pos.distributed,-pos.contributed));
      pos.returnPercent=pos.contributed?pos.profit/pos.contributed*100:null;
      for(const key of ['value','contributed','withdrawn','distributed','profit'])pos[key]/=100;
    }
    for(const pos of receivables.values())for(const key of ['original','paid','interest','pending'])pos[key]/=100;
    return {investmentPositions:investments,receivablePositions:receivables};
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
    const assets=addAssetMovements(state,change,monthly,daily);
    for(const map of [balances,deltas])for(const [id,n] of map)map.set(id,n/100);
    for(const map of [monthly,daily])for(const obj of map.values()){obj.income/=100;obj.expense/=100}
    for(const map of expenseByCategory.values())for(const [id,n] of map)map.set(id,n/100);
    // Returns and interest are displayed as virtual, read-only transactions.
    // Their accounting effects were posted once by addAssetMovements.
    const virtual=(state.assetEntries||[]).filter(a=>a.type==='payout'||a.type==='interest').map(a=>{
      const owner=a.kind==='investment'?(state.investments||[]).find(x=>x.id===a.targetId)?.name:(state.receivables||[]).find(x=>x.id===a.targetId)?.person;
      return {id:'asset:'+a.id,virtualAsset:true,assetRoute:a.kind==='investment'?'investments':'receivables',type:'income',date:a.date,accountId:a.accountId,categoryId:'income-returns',category:'Rendimientos',categoryEmoji:'📈',amount:a.amount,note:a.type==='payout'?`Rendimiento cobrado · ${owner||'Inversión'}`:`Interés cobrado · ${owner||'Préstamo'}`,createdAt:a.createdAt};
    });
    return {...assets,balances,deltas,monthly,daily,expenseByCategory,accounts,sorted:[...state.transactions,...virtual].sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt||'').localeCompare(String(a.createdAt||'')))};
  }
  const api=Object.freeze({MAX_CENTS,toCents,addCents,sumMoney,subtract,validMonth,shiftMonth,dateKey,validDate,metrics});
  root.ConFinCore=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
