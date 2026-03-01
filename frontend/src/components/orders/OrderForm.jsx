import React, { useState } from 'react';
import { Inp, Sel, Btn, SectionTitle, WoodLine, T, STATUSES, fmt } from '../ui';

const CHAIR_TYPES = [
  'სკამი-ბარი',
  'სასადილო სკამი',
  'სავარძელი',
  'საბავშვო სკამი',
  'დასაკეცი სკამი',
  'საოფისე სკამი',
  'ლაუნჯ-სავარძელი',
  'რბილი სკამი',
  'მისაღები სკამი'   // ← ДОБАВЛЕНО
];
const MATERIALS = [
  'მუხა',
  'ფერფლი',
  'ფიჭვი',
  'არყი',
  'კაკალი',
  'წიფელი',
  'MDF',
  'ლითონი',
  'ლითონი + ხე',
  'კოპიტი'   // ← ДОБАВЛЕНО
];
const COLORS      = ['ბუნებრივი','თეთრი','შავი','კაკალი','ვენგე','გათეთრებული მუხა','რუხი','ყავისფერი','მწვანე'];
const FINISHES    = ['ლაქი (მქრქალი)','ლაქი (პრიალა)','ზეთი','სახი','ბუნებრივი'];
const UPHOLSTERY  = ['ქსოვილი','ტყავი','ეკო-ტყავი','ხავერდი'];
const SOURCES     = ['სოციალური ქსელი','რეკომენდაცია','ვებსაიტი','პირდაპირი ვიზიტი','სხვა'];

let _uid = 1000;
const uid = () => 'tmp' + (_uid++);

const blankItem = () => ({
  _id: uid(), chairType:'სასადილო სკამი', quantity:1, unitPrice:'',
  material:'მუხა', color:'ბუნებრივი', finish:'ბუნებრივი',
  upholstery:'', dimensions:'', notes:'',
});



function ItemRow({ item, idx, onChange, onRemove }) {
  const isMobile = window.innerWidth <= 640;
  const total = Number(item.unitPrice || 0) * Number(item.quantity || 0);
  return (
    <div
      style={{
        background: T.surfaceAlt,
        borderRadius: 10,
        padding: 14,
        marginBottom: 10,
        border: `1px solid ${T.border}`
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 10,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 6 : 0
        }}
      >
        <span style={{ color: T.wood, fontWeight: 700, fontSize: 13 }}>
          პუნქტი {idx + 1}
        </span>
  
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {total > 0 && (
            <span style={{ color: T.success, fontWeight: 700 }}>
              {fmt(total)}
            </span>
          )}
          <Btn variant="danger" size="sm" onClick={onRemove}>
            ✕
          </Btn>
        </div>
      </div>
  
      {/* Type / Quantity / Price */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr',
          gap: 10,
          marginBottom: 10
        }}
      >
        <Sel
          label="სკამის ტიპი"
          value={item.chairType}
          onChange={v => onChange({ ...item, chairType: v })}
          options={CHAIR_TYPES}
        />
        <Inp
          label="რაოდენობა"
          type="number"
          value={item.quantity}
          onChange={v => onChange({ ...item, quantity: +v })}
        />
        <Inp
          label="ფასი/ცალი (₾)"
          type="number"
          value={item.unitPrice || ''}
          onChange={v => onChange({ ...item, unitPrice: +v })}
          placeholder="0"
        />
      </div>
  
      {/* Material / Color / Finish */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
          gap: 10,
          marginBottom: 10
        }}
      >
        <Sel
          label="მასალა"
          value={item.material}
          onChange={v => onChange({ ...item, material: v })}
          options={MATERIALS}
        />
        <Sel
          label="ფერი"
          value={item.color}
          onChange={v => onChange({ ...item, color: v })}
          options={COLORS}
        />
        <Sel
          label="დამუშ."
          value={item.finish}
          onChange={v => onChange({ ...item, finish: v })}
          options={FINISHES}
        />
      </div>
  
      {/* Upholstery / Dimensions / Notes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
          gap: 10
        }}
      >
        <Sel
          label="გახ./ქსოვ."
          value={item.upholstery || ''}
          onChange={v => onChange({ ...item, upholstery: v })}
          options={UPHOLSTERY}
          allowEmpty
        />
        <Inp
          label="ზომები (სმ)"
          value={item.dimensions}
          onChange={v => onChange({ ...item, dimensions: v })}
          placeholder="90x45x45"
        />
        <Inp
          label="შენიშვნა"
          value={item.notes}
          onChange={v => onChange({ ...item, notes: v })}
        />
      </div>
    </div>
  );
}

export default function OrderForm({ clients, initialOrder, onSave, onClose, title }) {
  const isEdit = !!initialOrder;
  const existClient = isEdit ? clients.find(c => c.id === initialOrder.clientId) : null;

  //const [tab, setTab] = useState('manual'); // или вообще уберите tab
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  const initForm = () => isEdit ? {
    clientMode:'existing', existingClientId: initialOrder.clientId || '',
    firstName:'', lastName:'', phone:'', clientType:'individual', companyName:'',
    orderType:  initialOrder.orderType  || 'our_design',
    status:     initialOrder.status     || 'awaiting_confirmation',
    deliveryDeadline: initialOrder.deliveryDeadline || '',
    paymentDeadline:  initialOrder.paymentDeadline  || '',
    paidAmount:         initialOrder.paidAmount         ?? '',
    materialCost:       initialOrder.materialCost       ?? '',
    additionalExpenses: initialOrder.additionalExpenses ?? '',
    manualTotal:        initialOrder.manualTotal        ?? '',
    useManualTotal:     initialOrder.manualTotal != null,
    additionalNotes: initialOrder.additionalNotes || '',
    source:          initialOrder.source          || '',
    items: (initialOrder.items || []).map(it => ({ _id:uid(), ...it })),
    deletedItemsHistory: initialOrder.deletedItemsHistory || [],
  } : {
    clientMode:'new', existingClientId:'',
    firstName:'', lastName:'', phone:'', clientType:'individual', companyName:'',
    orderType:'our_design', status:'awaiting_confirmation',
    deliveryDeadline:'', paymentDeadline:'',
    paidAmount:'', materialCost:'', additionalExpenses:'', manualTotal:'', useManualTotal:false,
    additionalNotes:'', source:'',
    items: [blankItem()], deletedItemsHistory:[],
  };

  const [form, setForm] = useState(initForm);
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isMobile = window.innerWidth <= 768;

const itemsTotal = form.items.reduce(
  (s, it) => s + Number(it.unitPrice || 0) * Number(it.quantity || 0),
  0
);

const displayTotal = form.useManualTotal
  ? Number(form.manualTotal || 0)
  : itemsTotal;

const displayPaid = Number(form.paidAmount || 0);

const profit = displayTotal - Number(form.materialCost || 0) - Number(form.additionalExpenses || 0);
const debt   = displayTotal - displayPaid;



  const addItem = () => F('items', [...form.items, blankItem()]);
  const updItem = (idx, it) => { const items=[...form.items]; items[idx]=it; F('items',items); };
  const delItem = (idx) => {
    const it = form.items[idx];
    const total = Number(it.unitPrice || 0) * Number(it.quantity || 0);
  
    if (!form.useManualTotal && total > 0) {
      F('deletedItemsHistory', [
        ...form.deletedItemsHistory,
        {
          chairType: it.chairType,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: total,
          paidPortion: 0, // можно вообще не отправлять, но если поле ожидается — держим 0
        },
      ]);
    }
  
    F('items', form.items.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setErr(''); setSaving(true);
    try {
      let clientId;
      if (form.clientMode==='existing') {
        clientId = form.existingClientId;
        if (!clientId) throw new Error('კლიენტი არ არის არჩეული');
      } else {
        if (!form.firstName || !form.phone) throw new Error('სახელი და ტელეფონი სავალდებულოა');
        clientId = '__new__';
      }
      if (!form.deliveryDeadline) throw new Error('შესრულების ვადა სავალდებულოა');

      const payload = {
        clientMode: form.clientMode,
        newClient: form.clientMode==='new' ? {
          firstName:form.firstName, lastName:form.lastName, phone:form.phone,
          clientType:form.clientType, companyName:form.companyName||undefined,
        } : undefined,
        clientId: form.clientMode==='existing' ? form.existingClientId : undefined,
        orderType: form.orderType, status: form.status,
        deliveryDeadline: form.deliveryDeadline,
        paymentDeadline: form.paymentDeadline||undefined,
        paidAmount: Number(form.paidAmount||0),
        materialCost: Number(form.materialCost||0),
        additionalExpenses: Number(form.additionalExpenses||0),
        manualTotal: form.useManualTotal ? Number(form.manualTotal||0) : undefined,
        additionalNotes: form.additionalNotes||undefined,
        source: form.source||undefined,
        items: form.items.map(({ _id, ...it }) => ({ ...it, quantity:Number(it.quantity), unitPrice:Number(it.unitPrice||0) })),
        deletedItemsHistory: form.deletedItemsHistory.map(h => ({
          chairType:h.chairType, quantity:Number(h.quantity), unitPrice:Number(h.unitPrice||0),
          totalPrice:Number(h.totalPrice), paidPortion:Number(h.paidPortion||0),
        })),
      };
      await onSave(payload, isEdit ? initialOrder.id : null);
    } catch(e) {
      setErr(e.message || 'შეცდომა');
    } finally {
      setSaving(false);
    }
  };

  const tabBtn = (t,lbl) => (
    <button onClick={() => setTab(t)} style={{ padding:'8px 20px', borderRadius:'8px 8px 0 0', cursor:'pointer',
      fontWeight:700, fontSize:13, background:tab===t?T.wood:'transparent', color:tab===t?'#fff':T.textMid, border:'none' }}>
      {lbl}
    </button>
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'#0000007a', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
      <div className='slide-up' style={{ background:T.bg, borderRadius:16, border:`1px solid ${T.borderStrong}`,
        width:'100%', maxWidth:820, maxHeight:'94vh', overflow:'auto', boxShadow:'0 20px 60px #0000003a' }}>

        {/* Header */}
        <div style={{ padding:'16px 22px', borderBottom:`2px solid ${T.border}`,
          display:'flex', justifyContent:'space-between', alignItems:'center',
          background:`linear-gradient(135deg,${T.woodDark}08,${T.woodLight}12)`,
          position:'sticky', top:0, zIndex:10 }}>
          <h2 style={{ color:T.text, margin:0, fontSize:18, fontWeight:800 }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:T.textLight, fontSize:24, cursor:'pointer' }}>✕</button>
        </div>

        

        <div style={{ padding:22 }}>
          {err && <div style={{ background:T.dangerBg, border:`1px solid ${T.dangerBorder}`, color:T.danger, borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:13 }}>❌ {err}</div>}


          {/* Manual Form */}
          {
            <div>
              <SectionTitle>👤 კლიენტი</SectionTitle>
              {!isEdit && (
                <div style={{ marginBottom:12 }}>
                  <Sel label='კლიენტი' value={form.clientMode} onChange={v=>F('clientMode',v)}
                    options={[{value:'new',label:'ახალი კლიენტი'},{value:'existing',label:'არსებული კლიენტი'}]} />
                </div>
              )}
              {(form.clientMode==='existing' || isEdit) ? (
                isEdit
                  ? <div style={{ background:T.surfaceAlt, borderRadius:8, padding:'10px 14px', color:T.textMid, fontSize:14 }}>
                      {existClient ? `${existClient.firstName} ${existClient.lastName} — ${existClient.phone}` : 'კლიენტი'}
                    </div>
                  : <Sel label='კლიენტი' value={form.existingClientId} onChange={v=>F('existingClientId',v)}
                      options={clients.map(c=>({value:c.id,label:`${c.firstName} ${c.lastName} (${c.phone})`}))} required />
              ) : (
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12 }}>
                  <Inp label='სახელი' value={form.firstName} onChange={v=>F('firstName',v)} required />
                  <Inp label='გვარი'  value={form.lastName}  onChange={v=>F('lastName',v)} />
                  <Inp label='ტელეფონი' value={form.phone} onChange={v=>F('phone',v)} placeholder='+99559...' required />
                  <Sel label='ტიპი' value={form.clientType} onChange={v=>F('clientType',v)}
                    options={[{value:'individual',label:'ფიზიკური პირი'},{value:'company',label:'კომპანია'}]} />
                  {form.clientType==='company' && (
                    <div style={{ gridColumn:'1/-1' }}>
                      <Inp label='კომპანიის სახელი' value={form.companyName} onChange={v=>F('companyName',v)} />
                    </div>
                  )}
                </div>
              )}

              <SectionTitle>📦 შეკვეთა</SectionTitle>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap:12, marginBottom:12 }}>
                <Sel label='სტატუსი' value={form.status} onChange={v=>F('status',v)}
                  options={STATUSES.map(s=>({value:s.key,label:s.label}))} />
                <Sel label='დიზაინის ტიპი' value={form.orderType} onChange={v=>F('orderType',v)}
                  options={[{value:'our_design',label:'ჩვენი დიზაინი'},{value:'custom_design',label:'ინდივიდუალური'}]} />
                <Sel label='წყარო' value={form.source} onChange={v=>F('source',v)} options={SOURCES} allowEmpty />
              </div>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12, marginBottom:12 }}>
                <Inp label='შესრულების ვადა' type='date' value={form.deliveryDeadline} onChange={v=>F('deliveryDeadline',v)} required />
                <Inp label='გადახდის ვადა'   type='date' value={form.paymentDeadline}  onChange={v=>F('paymentDeadline',v)} />
              </div>

              <SectionTitle>💰 ფინანსები</SectionTitle>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap:12, marginBottom:12 }}>
                <Inp label='მასალის ხარჯი (₾)'  type='number' value={form.materialCost}       onChange={v=>F('materialCost',v)} />
                <Inp label='დამატ. ხარჯი (₾)'   type='number' value={form.additionalExpenses} onChange={v=>F('additionalExpenses',v)} placeholder='0' />
                <Inp label='გადახდილია (₾)'      type='number' value={form.paidAmount}         onChange={v=>F('paidAmount',v)} />
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:T.textMid, marginBottom:12 }}>
                <input type='checkbox' checked={form.useManualTotal} onChange={e=>F('useManualTotal',e.target.checked)} style={{ width:16,height:16 }} />
                ხელით შეიყვანოთ ჯამური თანხა
              </label>
              {form.useManualTotal && (
                <div style={{ marginBottom:12 }}>
                  <Inp label='ჯამური თანხა (₾)' type='number' value={form.manualTotal||''} onChange={v=>F('manualTotal',v)} />
                </div>
              )}

              {/* Financials Preview */}
              <div style={{ background:`linear-gradient(135deg,${T.surfaceAlt},${T.bg})`, borderRadius:10, padding:14, border:`1px solid ${T.border}`, marginBottom:4 }}>
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:8, fontSize:13 }}>
                  {[
                    {label:'ჯამი',    val:fmt(displayTotal), color:T.text},
                    {label:'გადახ.',  val:fmt(displayPaid),  color:T.success},
                    {label:'ვალი',    val:fmt(debt),         color:debt>0?T.danger:T.success},
                    {label:'მოგება',  val:fmt(profit),       color:profit>0?T.success:T.danger},
                  ].map(m => (
                    <div key={m.label} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:16, fontWeight:800, color:m.color }}>{m.val}</div>
                      <div style={{ fontSize:11, color:T.textLight }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                {form.deletedItemsHistory.length > 0 && (
                  <div style={{ marginTop:10, fontSize:11, color:T.textLight, borderTop:`1px solid ${T.border}`, paddingTop:8 }}>
                    📌 წაშლილი პუნქტების ისტ.: {form.deletedItemsHistory.map(h=>`${h.quantity}× ${h.chairType} (${fmt(h.totalPrice)})`).join(' | ')}
                  </div>
                )}
              </div>

              <SectionTitle action={<Btn size='sm' variant='secondary' onClick={addItem}>+ პუნქტი</Btn>}>🪑 პუნქტები</SectionTitle>
              {form.items.length === 0 && (
                <div style={{ color:T.textLight, fontSize:13, padding:16, textAlign:'center', background:T.surfaceAlt, borderRadius:8, marginBottom:10 }}>
                  პუნქტები არ არის
                </div>
              )}
              {form.items.map((item,idx) => (
                <ItemRow key={item._id} item={item} idx={idx} onChange={it=>updItem(idx,it)} onRemove={()=>delItem(idx)} />
              ))}
              <Btn variant='secondary' onClick={addItem} fullWidth style={{ marginTop:4 }}>+ სკამის პუნქტი</Btn>

              <SectionTitle>📝 შენიშვნა</SectionTitle>
              <Inp value={form.additionalNotes} onChange={v=>F('additionalNotes',v)} rows={3} placeholder='დამატებითი ინფო...' />
            </div>
          }
        </div>

        <div style={{ padding:'14px 22px', borderTop:`1px solid ${T.border}`, display:'flex',
          justifyContent:'flex-end', gap:10, background:T.surfaceAlt, position:'sticky', bottom:0 }}>
          <Btn variant='secondary' onClick={onClose}>გაუქმება</Btn>
          <Btn onClick={handleSave} disabled={saving} size='lg'>{saving ? '⏳...' : '💾 შენახვა'}</Btn>
        </div>
      </div>
    </div>
  );
}
