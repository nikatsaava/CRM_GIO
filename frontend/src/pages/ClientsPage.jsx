import React, { useState, useEffect } from 'react';
import { getOrdersByClient } from '../api/orders';
import {
  getClients,
  deleteClient,
  getDeletedClients,
  restoreClient,
  hardDeleteClient,
} from '../api/clients';

import { getOrders, updateStatus, updateOrder } from '../api/orders';
import { T, Pill, Btn, WoodLine, Modal, ModalHeader, ModalFooter, Badge, Sel, Spinner, STATUSES, fmt, urgencyColor, daysUntil } from '../components/ui';
import OrderForm from '../components/orders/OrderForm';

const getTotal = (order) =>
  order.manualTotal != null
    ? +order.manualTotal
    : (order.items || []).reduce((s, i) => s + (+i.unitPrice) * (+i.quantity), 0);

    function ClientOrdersModal({ client, clients, onClose, onSaved, onStatusChange }) {
      const [loading, setLoading] = useState(true);
      const [orders, setOrders] = useState([]);   

useEffect(() => {
  if (!client) return;

  setLoading(true);
  getOrdersByClient(client.id)
    .then(res => setOrders(res.data))
    .finally(() => setLoading(false));
}, [client]);

const handleStatusChangeLocal = async (orderId, status) => {
  const { data } = await updateStatus(orderId, status);
  setOrders(prev => prev.map(o => o.id === orderId ? data : o));
};

const cOrders = orders
.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));  const [editOrder, setEditOrder] = useState(null);
  const totalSpent = cOrders.reduce((s,o)=>s+getTotal(o),0);
  const totalPaid  = cOrders.reduce((s,o)=>s+(+o.paidAmount),0);



  const handleSaveOrder = async (payload, orderId) => {
    const { data } = await updateOrder(orderId, payload);
    onSaved(data);
    setEditOrder(null);
  };

  return (
    <>
      <Modal onClose={onClose} maxWidth={700}>
        <ModalHeader onClose={onClose}>{client.firstName} {client.lastName}</ModalHeader>
        <div style={{ padding:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }} className="grid2-sm">
            {[{l:'შეკვეთები',v:cOrders.length,c:T.wood},{l:'ჯამი',v:fmt(totalSpent),c:T.text},{l:'გადახდილი',v:fmt(totalPaid),c:T.success},{l:'ვალი',v:fmt(totalSpent-totalPaid),c:totalSpent-totalPaid>0?T.danger:T.success}].map(m=>(
              <div key={m.l} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'12px 8px', textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, color:m.c }}>{m.v}</div>
                <div style={{ fontSize:11, color:T.textLight }}>{m.l}</div>
              </div>
            ))}
          </div>
          {loading ? (
  <div style={{ padding:40, textAlign:'center' }}>
    <Spinner />
  </div>
) : (
  <>
    {cOrders.length === 0 && (
      <div style={{ textAlign:'center', padding:40, color:T.textLight }}>
        შეკვეთები არ არის
      </div>
    )}

    {cOrders.map(order => {
      const total = getTotal(order);
      const paid = +order.paidAmount;
      const profit = total - (+order.materialCost) - (+(order.additionalExpenses || 0));
      const dc = urgencyColor(order.deliveryDeadline);

      return (
        <div
          key={order.id}
          style={{
            background:T.surface,
            borderRadius:12,
            padding:16,
            marginBottom:14,
            border:`1.5px solid ${T.border}`
          }}
        >
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ color:T.wood, fontWeight:800 }}>{order.orderNumber}</span>
              <Badge status={order.status} />
            </div>
            <Btn size='sm' variant='secondary' onClick={()=>setEditOrder(order)}>✏️ რედ.</Btn>
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
            {(order.items || []).map((it,i) =>
              <Pill key={i} color={T.wood}>
                {it.quantity}× {it.chairType}
              </Pill>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, fontSize:12, marginBottom:10 }} className="grid2-sm">
            <div>
              <span style={{ color:T.textLight }}>ვადა </span>
              <span style={{ color:dc,fontWeight:700 }}>{order.deliveryDeadline}</span>
            </div>
            <div>
              <span style={{ color:T.textLight }}>ჯამი </span>
              <span style={{ fontWeight:700 }}>{fmt(total)}</span>
            </div>
            <div>
              <span style={{ color:T.textLight }}>გადახ. </span>
              <span style={{ color:paid>=total?T.success:T.warning,fontWeight:700 }}>{fmt(paid)}</span>
            </div>
            <div>
              <span style={{ color:T.textLight }}>მოგ. </span>
              <span style={{ color:T.success,fontWeight:700 }}>{fmt(profit)}</span>
            </div>
          </div>

          {order.additionalNotes && (
            <div style={{ fontSize:12, color:T.textMid, background:T.surfaceAlt, borderRadius:6, padding:'5px 10px', marginBottom:10 }}>
              📝 {order.additionalNotes}
            </div>
          )}

          <Sel
            label=''
            value={order.status}
            onChange={v=>handleStatusChangeLocal(order.id,v)}
            options={STATUSES.map(s=>({value:s.key,label:s.label}))}
          />
        </div>
      );
    })}
  </>
)}
        </div>
      </Modal>
      {editOrder&&<OrderForm initialOrder={editOrder} clients={clients} onSave={handleSaveOrder} onClose={()=>setEditOrder(null)} title='შეკვეთის რედ.' />}
    
    </>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [deletedClients, setDeletedClients] = useState([]);
  
  const [initialLoading, setInitialLoading] = useState(true); // 👈 только первый заход
  const [loading, setLoading] = useState(false);              // 👈 поиск/обновления
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);
  

  useEffect(() => {
    let alive = true;
  
    // первый заход — большой спиннер
    if (initialLoading) {
      setInitialLoading(true);
    } else {
      // последующие запросы (поиск) — маленький спиннер в input
      setLoading(true);
    }
  
    Promise.all([
      getClients(search || undefined),
      getDeletedClients(search || undefined),
    ])
      .then(([cl, del]) => {
        if (!alive) return;
        setClients(cl.data);
        setDeletedClients(del.data);
      })
      .finally(() => {
        if (!alive) return;
        setInitialLoading(false);
        setLoading(false);
      });
  
    return () => { alive = false; };
  }, [search, initialLoading]);

  const filtered = clients.filter(c=>{
    const q=search.trim().toLowerCase();
    return !q || (c.firstName+' '+c.lastName).toLowerCase().includes(q) || c.phone.includes(q) || (c.companyName||'').toLowerCase().includes(q);
  }).sort((a,b)=>a.firstName.localeCompare(b.firstName,'ka'));

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateStatus(orderId, status);
    } catch {}
  };

  // if (loading) return <Spinner />;

  const handleSoftDelete = async (id) => {
    await deleteClient(id);
    const victim = clients.find(c => c.id === id);
  
    setClients(prev => prev.filter(c => c.id !== id));
  
    if (victim) setDeletedClients(prev => [victim, ...prev]);
  };
  
  const handleRestore = async (id) => {
    await restoreClient(id);
  
    const restored = deletedClients.find(c => c.id === id);
  
    setDeletedClients(prev => prev.filter(c => c.id !== id));
  
    if (restored) {
      setClients(prev => [restored, ...prev]);
    }
  };
  
  const handleHardDelete = async (id) => {
    await hardDeleteClient(id);
    setDeletedClients(prev => prev.filter(c => c.id !== id));
  };

  if (initialLoading) return <Spinner />;
  return (
    <div style={{ padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <h2 style={{ color:T.text, margin:0, fontSize:20, fontWeight:800 }}>კლიენტები ({clients.length})</h2>
        <div style={{ width:'100%' }} className="full-sm">
        <div style={{ width:'100%' }} className="full-sm">
  <div style={{ position:'relative' }}>
    <span
      style={{
        position:'absolute',
        left:11,
        top:'50%',
        transform:'translateY(-50%)',
        color:T.textLight,
        pointerEvents:'none',
      }}
    >
      🔍
    </span>


    <input
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
      placeholder="ძებნა..."
      style={{
        width:'100%',
        background:T.surface,
        border:`1.5px solid ${T.border}`,
        borderRadius:9,
        padding:'9px 36px 9px 34px', // место справа под спиннер
        color:T.text,
        fontSize:14,
        outline:'none',
        boxSizing:'border-box',
      }}
    />
  </div>
</div>
</div>

      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:14 }}>
        {filtered.map(c=>{
       
          return (
            <div key={c.id} style={{ background:T.surface, borderRadius:14, border:`1.5px solid ${T.border}`, padding:18, boxShadow:'0 2px 14px #0000000c' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:T.text }}>{c.firstName} {c.lastName}</div>
                  <div style={{ color:T.textMid, fontSize:13, marginTop:2 }}>{c.phone}</div>
                  {c.companyName&&<div style={{ color:T.woodLight, fontSize:12, marginTop:2 }}>🏢 {c.companyName}</div>}
                </div>
                <Pill color={c.clientType==='company'?T.wood:T.info}>{c.clientType==='company'?'კომ.':'ფიზ.'}</Pill>
                <Btn size='sm' variant='danger' onClick={() => handleSoftDelete(c.id)}>🗑️</Btn>
              </div>
              <WoodLine />

              <Btn onClick={()=>setViewing(c)} fullWidth>📋 შეკვეთების ნახვა</Btn>
            </div>
          );
        })}
        {filtered.length===0&&<div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:T.textLight }}>კლიენტი ვერ მოიძებნა</div>}
      </div> 
      {deletedClients.length > 0 && (
      <div style={{ marginTop:32 }}>
        <h3 style={{ color:T.text, marginBottom:12, fontSize:16, fontWeight:800 }}>
          ახლახან წაშლილი
        </h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:14 }}>
          {deletedClients.map(c => (
            <div
              key={c.id}
              style={{
                background:T.surface,
                borderRadius:14,
                border:`1.5px dashed ${T.border}`,
                padding:18,
                opacity:0.8,
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:T.text }}>{c.firstName} {c.lastName}</div>
                  <div style={{ color:T.textMid, fontSize:13, marginTop:2 }}>{c.phone}</div>
                  {c.companyName && <div style={{ color:T.woodLight, fontSize:12, marginTop:2 }}>🏢 {c.companyName}</div>}
                </div>
              </div>
              <WoodLine />
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
                <Btn size='sm' variant='secondary' onClick={() => handleRestore(c.id)}>↩️ აღდგენა</Btn>
                <Btn size='sm' variant='danger' onClick={() => handleHardDelete(c.id)}>❌ სამუდამოდ</Btn>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
      {viewing&&<ClientOrdersModal
  client={viewing}
  clients={clients}
  onClose={()=>setViewing(null)}
  onSaved={()=>{}}
  onStatusChange={handleStatusChange}
/>}
           </div>
  );
}
