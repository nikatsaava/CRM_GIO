import React, { useState, useEffect } from 'react';
import { T, Inp, Sel, Btn, Modal, ModalHeader, ModalFooter, SectionTitle, CHAIR_TYPES, MATERIALS, COLORS, FINISHES, UPHOLSTERY, SOURCES, STATUSES, fmt } from './ui';
import api from '../api/client';

const blankItem = () => ({ _key: Math.random().toString(36).slice(2), chairType:'სასადილო სკამი', quantity:1, unitPrice:'', material:'მუხა', color:'ბუნებრივი', finish:'ბუნებრივი', upholstery:'', dimensions:'', notes:'' });

async function parseWithAI(text) {
  const today = new Date().toISOString().split('T')[0];
  const prompt = `დღეს არის ${today}. ამოიღე შეკვეთის ინფო. მხოლოდ JSON, markdown გარეშე:\n\nტექსტი: "${text}"\n\n{"client":{"firstName":"","lastName":"","phone":"","clientType":"individual","companyName":""},"order":{"orderType":"our_design","deliveryDeadline":"YYYY-MM-DD","paymentDeadline":null,"totalAmount":null,"paidAmount":0,"materialCost":null,"additionalExpenses":0,"additionalNotes":"","source":""},"items":[{"chairType":"","quantity":1,"unitPrice":null,"material":"","color":"","dimensions":"","notes":""}]}`;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1500, messages:[{role:'user',content:prompt}] })
    });
    const data = await res.json();
    const raw = data.content?.map(b=>b.text||'').join('').trim();
    return JSON.parse(raw.replace(/```json|```/g,'').trim());
  } catch { return null; }
}

function ItemRow({ item, idx, onChange, onRemove }) {
  const total = (+(item.unitPrice||0)) * (+(item.quantity||0));
  return (
    <div style={{ background:T.surfaceAlt, borderRadius:10, padding:14, marginBottom:10, border:`1px solid ${T.border}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <span style={{ color:T.wood, fontWeight:700, fontSize:13 }}>პუნქტი {idx+1}</span>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {total>0 && <span style={{ color:T.success, fontWeight:700 }}>{fmt(total)}</span>}
          <Btn variant='danger' size='sm' onClick={onRemove}>✕ წაშლა</Btn>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10, marginBottom:10 }} className="grid2-sm">
        <Sel label='სკამის ტიპი' value={item.chairType} onChange={v=>onChange({...item,chairType:v})} options={CHAIR_TYPES} />
        <Inp label='რაოდ.' type='number' value={item.quantity} onChange={v=>onChange({...item,quantity:+v})} />
        <Inp label='ფასი/ც (₾)' type='number' value={item.unitPrice||''} onChange={v=>onChange({...item,unitPrice:+v})} placeholder='0' />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }} className="grid2-sm">
        <Sel label='მასალა' value={item.material} onChange={v=>onChange({...item,material:v})} options={MATERIALS} />
        <Sel label='ფერი' value={item.color} onChange={v=>onChange({...item,color:v})} options={COLORS} />
        <Sel label='დამუშავება' value={item.finish} onChange={v=>onChange({...item,finish:v})} options={FINISHES} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }} className="grid2-sm">
        <Sel label='გახუება' value={item.upholstery||''} onChange={v=>onChange({...item,upholstery:v})} options={UPHOLSTERY} allowEmpty />
        <Inp label='ზომები' value={item.dimensions} onChange={v=>onChange({...item,dimensions:v})} placeholder='90x45x45 სმ' />
        <Inp label='შენიშვნა' value={item.notes} onChange={v=>onChange({...item,notes:v})} />
      </div>
    </div>
  );
}

export default function OrderForm({ order, clients, onSave, onClose }) {
  const isEdit = !!order;
  const [tab, setTab] = useState(isEdit ? 'manual' : 'ai');
  const [aiText, setAiText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const initForm = () => ({
    clientMode: isEdit ? 'existing' : 'new',
    existingClientId: isEdit ? order.clientId : '',
    firstName:'', lastName:'', phone:'', clientType:'individual', companyName:'',
    orderType: order?.orderType || 'our_design',
    status: order?.status || 'awaiting_confirmation',
    deliveryDeadline: order?.deliveryDeadline || '',
    paymentDeadline: order?.paymentDeadline || '',
    totalAmount: order?.totalAmount || '',
    paidAmount: order?.paidAmount || '',
    materialCost: order?.materialCost || '',
    additionalExpenses: order?.additionalExpenses || '',
    additionalNotes: order?.additionalNotes || '',
    source: order?.source || '',
    items: (order?.items||[]).map(it=>({...it, _key:it.id||Math.random().toString(36).slice(2)})),
    deletedItemsHistory: order?.deletedItemsHistory || [],
  });

  const [form, setForm] = useState(initForm);
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const itemsTotal = form.items.reduce((s,it)=>s+(+(it.unitPrice||0))*(+(it.quantity||0)),0);
  const histTotal  = (form.deletedItemsHistory||[]).reduce((s,h)=>s+(h.totalPrice||0),0);
  const displayTotal = +(form.totalAmount||0) || (itemsTotal + histTotal);
  const displayPaid  = +(form.paidAmount||0);
  const profit = displayTotal - (+(form.materialCost||0)) - (+(form.additionalExpenses||0));
  const debt   = displayTotal - displayPaid;

  const handleParse = async () => {
    setParsing(true); setError('');
    const r = await parseWithAI(aiText);
    setParsing(false);
    if (!r) { setError('ტექსტის ამოცნობა ვერ მოხერხდა.'); return; }
    setForm(f=>({
      ...f, clientMode:'new',
      firstName:r.client?.firstName||'', lastName:r.client?.lastName||'',
      phone:r.client?.phone||'', clientType:r.client?.clientType||'individual',
      companyName:r.client?.companyName||'',
      orderType:r.order?.orderType||'our_design',
      deliveryDeadline:r.order?.deliveryDeadline||'',
      paymentDeadline:r.order?.paymentDeadline||'',
      paidAmount:r.order?.paidAmount||0,
      totalAmount:r.order?.totalAmount||'',
      materialCost:r.order?.materialCost||'',
      additionalExpenses:r.order?.additionalExpenses||0,
      additionalNotes:r.order?.additionalNotes||'',
      source:r.order?.source||'',
      items:r.items?.map(it=>({...blankItem(),...it,_key:Math.random().toString(36).slice(2)})) || [blankItem()],
    }));
    setTab('manual');
  };

  const addItem = () => setForm(f=>({...f,items:[...f.items,blankItem()]}));
  const updateItem = (idx,it) => setForm(f=>{ const items=[...f.items]; items[idx]=it; return {...f,items}; });
  const removeItem = (idx) => {
    const it = form.items[idx];
    const total = (+(it.unitPrice||0))*(+(it.quantity||0));
    const hist = total>0 ? [{
      chairType:it.chairType, quantity:it.quantity, unitPrice:it.unitPrice,
      totalPrice:total, paidPortion: displayTotal>0 ? Math.round(total/displayTotal*displayPaid*100)/100 : 0,
      deletedAt: new Date().toISOString()
    }] : [];
    setForm(f=>({ ...f, items:f.items.filter((_,i)=>i!==idx), deletedItemsHistory:[...f.deletedItemsHistory,...hist] }));
  };

  const handleSave = async () => {
    if (!form.deliveryDeadline) { setError('შესრულების ვადა სავალდებულოა'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        orderType:form.orderType, status:form.status,
        deliveryDeadline:form.deliveryDeadline, paymentDeadline:form.paymentDeadline||null,
        totalAmount:+(form.totalAmount||0), paidAmount:+(form.paidAmount||0),
        materialCost:+(form.materialCost||0), additionalExpenses:+(form.additionalExpenses||0),
        additionalNotes:form.additionalNotes, source:form.source,
        deletedItemsHistory:form.deletedItemsHistory,
        items:form.items.map(it=>({ chairType:it.chairType, quantity:+it.quantity, unitPrice:+(it.unitPrice||0), material:it.material, color:it.color, finish:it.finish, upholstery:it.upholstery, dimensions:it.dimensions, notes:it.notes })),
      };
      if (isEdit) {
        payload.clientId = form.existingClientId || order.clientId;
        const res = await api.put(`/orders/${order.id}`, payload);
        onSave(res.data);
      } else {
        if (form.clientMode === 'existing') {
          payload.clientId = form.existingClientId;
        } else {
          payload.client = { firstName:form.firstName, lastName:form.lastName, phone:form.phone, clientType:form.clientType, companyName:form.companyName };
        }
        const res = await api.post('/orders', payload);
        onSave(res.data);
      }
    } catch(e) {
      setError(e.response?.data?.message || 'შეცდომა შენახვისას');
    } finally { setSaving(false); }
  };

  const tabBtn = (t,lbl) => (
    <button onClick={()=>setTab(t)} style={{ padding:'8px 20px', borderRadius:'8px 8px 0 0', cursor:'pointer', fontWeight:700, fontSize:13, background:tab===t?T.wood:'transparent', color:tab===t?'#fff':T.textMid, border:'none' }}>{lbl}</button>
  );

  const existClient = clients?.find(c=>c.id===form.existingClientId);

  return (
    <Modal onClose={onClose} maxWidth={820}>
      <ModalHeader title={isEdit?`რედაქტირება — ${order.orderNumber}`:'ახალი შეკვეთა'} onClose={onClose} />
      {!isEdit && <div style={{ padding:'0 22px', display:'flex', gap:4, borderBottom:`1px solid ${T.border}`, background:T.surfaceAlt }}>{tabBtn('ai','🤖 AI-შეყვანა')}{tabBtn('manual','✍️ ხელით')}</div>}
      <div style={{ padding:22 }}>
        {error && <div style={{ background:T.dangerBg, border:`1px solid ${T.dangerBorder}`, borderRadius:8, padding:'10px 14px', color:T.danger, fontSize:13, marginBottom:16 }}>{error}</div>}
        {/* AI TAB */}
        {tab==='ai' && !isEdit && (
          <div>
            <p style={{ color:T.textMid, fontSize:13, marginBottom:12, lineHeight:1.7 }}>შეიყვანეთ შეკვეთა თავისუფალი ტექსტით — AI ავტომატურად შეავსებს ველებს.</p>
            <textarea value={aiText} onChange={e=>setAiText(e.target.value)} rows={6}
              placeholder='მაგ: გიორგი ბერიძე. +99559xxxxxxx. 3 სკამი-ბარი მუხისა, კაკლის ფერი. ვადა 15 მარტი. ჯამი 850₾. გადახდილია 300₾.'
              style={{ width:'100%', background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:10, padding:14, color:T.text, fontSize:14, resize:'vertical', outline:'none', lineHeight:1.6, fontFamily:'inherit' }} />
            <div style={{ marginTop:12, display:'flex', gap:12, alignItems:'center' }}>
              <Btn onClick={handleParse} disabled={!aiText.trim()||parsing}>{parsing?'⏳ იტვირთება...':'🔍 ტექსტის ამოცნობა'}</Btn>
            </div>
          </div>
        )}
        {/* MANUAL TAB */}
        {(tab==='manual'||isEdit) && (
          <div>
            <SectionTitle>👤 კლიენტი</SectionTitle>
            {!isEdit && <div style={{ marginBottom:12 }}><Sel label='კლიენტის ტიპი' value={form.clientMode} onChange={v=>setF('clientMode',v)} options={[{value:'new',label:'ახალი კლიენტი'},{value:'existing',label:'არსებული კლიენტი'}]} /></div>}
            {(form.clientMode==='existing'||isEdit) ? (
              isEdit
                ? <div style={{ background:T.surfaceAlt, borderRadius:8, padding:'10px 14px', color:T.textMid, fontSize:14 }}>{existClient?`${existClient.firstName} ${existClient.lastName} — ${existClient.phone}`:order.client?`${order.client.firstName} ${order.client.lastName}`:'კლიენტი'}</div>
                : <Sel label='კლიენტი' value={form.existingClientId} onChange={v=>setF('existingClientId',v)} options={(clients||[]).map(c=>({value:c.id,label:`${c.firstName} ${c.lastName} (${c.phone})`}))} />
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }} className="grid1-sm">
                <Inp label='სახელი' required value={form.firstName} onChange={v=>setF('firstName',v)} />
                <Inp label='გვარი' value={form.lastName} onChange={v=>setF('lastName',v)} />
                <Inp label='ტელეფონი' required value={form.phone} onChange={v=>setF('phone',v)} placeholder='+99559...' />
                <Sel label='ტიპი' value={form.clientType} onChange={v=>setF('clientType',v)} options={[{value:'individual',label:'ფიზიკური პირი'},{value:'company',label:'კომპანია'}]} />
                {form.clientType==='company'&&<div style={{gridColumn:'1/-1'}}><Inp label='კომპანია' value={form.companyName} onChange={v=>setF('companyName',v)} /></div>}
              </div>
            )}
            <SectionTitle>📦 შეკვეთის ინფო</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }} className="grid2-sm">
              <Sel label='სტატუსი' value={form.status} onChange={v=>setF('status',v)} options={STATUSES.map(s=>({value:s.key,label:s.label}))} />
              <Sel label='დიზაინი' value={form.orderType} onChange={v=>setF('orderType',v)} options={[{value:'our_design',label:'ჩვენი'},{value:'custom_design',label:'ინდ.'}]} />
              <Sel label='წყარო' value={form.source} onChange={v=>setF('source',v)} options={SOURCES} allowEmpty />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }} className="grid1-sm">
              <Inp label='შესრულების ვადა *' type='date' value={form.deliveryDeadline} onChange={v=>setF('deliveryDeadline',v)} />
              <Inp label='გადახდის ვადა' type='date' value={form.paymentDeadline} onChange={v=>setF('paymentDeadline',v)} />
            </div>
            <SectionTitle>💰 ფინანსები</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:12 }} className="grid2-sm">
              <Inp label='ჯამი (₾)' type='number' value={form.totalAmount} onChange={v=>setF('totalAmount',v)} placeholder='ავტო' />
              <Inp label='გადახდილი (₾)' type='number' value={form.paidAmount} onChange={v=>setF('paidAmount',v)} />
              <Inp label='მასალა (₾)' type='number' value={form.materialCost} onChange={v=>setF('materialCost',v)} />
              <Inp label='დამ. ხარჯი (₾)' type='number' value={form.additionalExpenses} onChange={v=>setF('additionalExpenses',v)} placeholder='0' />
            </div>
            <div style={{ background:`linear-gradient(135deg,${T.surfaceAlt},${T.bg})`, borderRadius:10, padding:14, border:`1px solid ${T.border}`, marginBottom:4 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, fontSize:13 }} className="grid2-sm">
                {[{l:'ჯამი',val:fmt(displayTotal),c:T.text},{l:'გადახ.',val:fmt(displayPaid),c:T.success},{l:'ვალი',val:fmt(debt),c:debt>0?T.danger:T.success},{l:'მოგება',val:fmt(profit),c:profit>0?T.success:T.danger}].map(m=>(
                  <div key={m.l} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:16, fontWeight:800, color:m.c }}>{m.val}</div>
                    <div style={{ fontSize:11, color:T.textLight }}>{m.l}</div>
                  </div>
                ))}
              </div>
              {form.deletedItemsHistory?.length>0&&<div style={{ marginTop:10, fontSize:11, color:T.textLight, borderTop:`1px solid ${T.border}`, paddingTop:8 }}>📌 წაშლილი: {form.deletedItemsHistory.map(h=>`${h.quantity}× ${h.chairType} (${fmt(h.totalPrice)})`).join(' | ')}</div>}
            </div>
            <SectionTitle action={<Btn size='sm' variant='secondary' onClick={addItem}>+ პუნქტი</Btn>}>🪑 სკამები</SectionTitle>
            {form.items.length===0&&<div style={{ color:T.textLight, fontSize:13, padding:16, textAlign:'center', background:T.surfaceAlt, borderRadius:8, marginBottom:10 }}>პუნქტები არ არის</div>}
            {form.items.map((item,idx)=><ItemRow key={item._key||idx} item={item} idx={idx} onChange={it=>updateItem(idx,it)} onRemove={()=>removeItem(idx)} />)}
            <Btn variant='secondary' onClick={addItem} fullWidth>+ სკამის პუნქტის დამატება</Btn>
            <SectionTitle>📝 შენიშვნა</SectionTitle>
            <Inp value={form.additionalNotes} onChange={v=>setF('additionalNotes',v)} rows={3} placeholder='დამატებითი ინფორმაცია...' />
          </div>
        )}
      </div>
      <ModalFooter>
        <Btn variant='secondary' onClick={onClose}>გაუქმება</Btn>
        <Btn onClick={handleSave} disabled={saving}>{saving?'ინახება...':'💾 შენახვა'}</Btn>
      </ModalFooter>
    </Modal>
  );
}
