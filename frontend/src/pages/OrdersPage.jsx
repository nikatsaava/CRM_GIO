import React, { useState, useEffect, useCallback } from 'react';
import { getOrders, deleteOrder, updateStatus, createOrder, updateOrder, restoreOrder, hardDeleteOrder } from '../api/orders';
import { getClients, createClient } from '../api/clients';
//import { createClient } from '../api/clients';
import { T, Badge, BadgeShort, Pill, Btn, Spinner, ConfirmModal, STATUSES, fmt, daysUntil, urgencyColor } from '../components/ui';
import OrderForm from '../components/orders/OrderForm';
import { exportOrders } from '../api/orders';

const getTotal = (order) =>
  order.manualTotal != null
    ? +order.manualTotal
    : (order.items || []).reduce((s, i) => s + (+i.unitPrice) * (+i.quantity), 0);

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deletedFilter, setDeletedFilter] = useState('active');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({
        status: statusFilter,
        search: search || undefined,
        page,
        limit,
        deleted:
          deletedFilter === 'active'
            ? undefined
            : deletedFilter === 'deleted'
              ? 'only'
              : 'all'
      });

      // если страница пустая — откат
      if (res.data.orders.length === 0 && page > 1) {
        setPage(p => p - 1);
        return;
      }

      setOrders(res.data.orders || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page, limit, deletedFilter]);

  useEffect(() => { loadData(); }, [loadData]);


  const loadPage = useCallback(async (newPage) => {
    setLoading(true);
    try {
      const res = await getOrders({
        status: statusFilter,
        search: search || undefined,
        page: newPage,
        limit,
        deleted:
          deletedFilter === 'active'
            ? undefined
            : deletedFilter === 'deleted'
              ? 'only'
              : 'all'
      });

      setOrders(res.data.orders || []);
      setTotal(res.data.total || 0);
      setPage(newPage); // ← ВАЖНО
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, limit, deletedFilter]);


  const handlePrev = () => {
    if (page > 1) setPage(p => p - 1);
  };

  const handleNext = () => {
    if (page * limit < total) setPage(p => p + 1);
  };



  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400); // 400 мс – можно настроить

    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    getClients()
      .then((r) => setClients(r.data || []))
      .catch(() => setClients([]));
  }, []);

  const handleSave = async (payload, orderId) => {
    try {
      let clientId = payload.clientId;
      if (payload.clientMode === 'new') {
        const { data: newClient } = await createClient(payload.newClient);
        clientId = newClient.id;
        setClients(prev => [newClient, ...prev]);
      }
      const orderPayload = { ...payload, clientId };
      delete orderPayload.clientMode;
      delete orderPayload.newClient;

      let saved;
      if (orderId) {
        const { data } = await updateOrder(orderId, orderPayload);
        saved = data;
      } else {
        const { data } = await createOrder(orderPayload);
        saved = data;
      }
      setOrders(prev => {
        const idx = prev.findIndex(o => o.id === saved.id);
        return idx >= 0 ? prev.map(o => o.id === saved.id ? saved : o) : [saved, ...prev];
      });
      setShowAdd(false); setEditOrder(null);
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message || 'შეცდომა');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteOrder(id);
      loadPage(page);
    } catch (e) { alert('წაშლა ვერ მოხერხდა'); }
    setConfirmDel(null);
  };

  const handleExport = async () => {
    try {
      const response = await exportOrders();
  
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
  
      const link = document.createElement('a');
      link.href = url;
      link.download = 'orders.csv';
  
      document.body.appendChild(link);
      link.click();
      link.remove();
  
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('CSV ვერ ჩაიტვირთა');
    }
  };


  const handleStatusChange = async (orderId, status) => {
    try {
      const res = await updateStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? res.data : o));
    } catch (e) { console.error(e); }
  };

  const handleRestore = async (id) => {
    try {
      await restoreOrder(id);
      loadData(page);
    } catch (e) {
      console.error(e);
    }
  };

  const urgent = orders.filter(o => daysUntil(o.deliveryDeadline) <= 7 && !['delivered', 'cancelled'].includes(o.status));

  const sortedOrders = [
    ...orders.filter(o => !o.deletedAt),
    ...orders.filter(o => o.deletedAt)
  ];

  const handleHardDelete = async (id) => {
    if (!window.confirm('Удалить заказ навсегда? Это действие нельзя отменить.')) return;

    try {
      await hardDeleteOrder(id);
      loadData(page);
    } catch (e) {
      console.error(e);
    }
  };



  return (
    <div style={{ padding: 16 }}>
      {/* Toolbar */}
      <div style={{ marginBottom: 28 }}>

{/* ROW 1 — Search + Filters */}
<div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
    marginBottom: 14
  }}
>

  {/* SEARCH */}
  <div style={{ position: 'relative' }}>
    <span
      style={{
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        color: T.textLight
      }}
    >
      🔍
    </span>

    <input
      value={searchInput}
      onChange={e => setSearchInput(e.target.value)}
      placeholder='ძებნა...'
      style={{
        width: '100%',
        background: T.surface,
        border: `1.5px solid ${T.border}`,
        borderRadius: 12,
        padding: '11px 14px 11px 36px',
        color: T.text,
        fontSize: 14,
        outline: 'none'
      }}
    />
  </div>

  {/* STATUS FILTER */}
  <select
    value={statusFilter}
    onChange={e => setStatusFilter(e.target.value)}
    style={{
      width: '100%',
      background: T.surface,
      border: `1.5px solid ${T.border}`,
      borderRadius: 12,
      padding: '11px 14px',
      color: T.text,
      fontSize: 14,
      cursor: 'pointer'
    }}
  >
    <option value='all'>ყველა სტატუსი</option>
    {STATUSES.map(s => (
      <option key={s.key} value={s.key}>{s.label}</option>
    ))}
  </select>

  {/* DELETED FILTER */}
  <select
    value={deletedFilter}
    onChange={e => setDeletedFilter(e.target.value)}
    style={{
      width: '100%',
      background: T.surface,
      border: `1.5px solid ${T.border}`,
      borderRadius: 12,
      padding: '11px 14px',
      color: T.text,
      fontSize: 14,
      cursor: 'pointer'
    }}
  >
    <option value="active">აქტიური</option>
    <option value="deleted">წაშლილი</option>
    <option value="all">ყველა</option>
  </select>

</div>

{/* ROW 2 — Buttons */}
<div className="orders-actions">

<Btn variant="secondary" onClick={handleExport}>
    <span className="btn-icon">⬇</span>
    <span className="btn-word-1"> CSV</span>
    <span className="btn-word-2"> ექსპორტი</span>
  </Btn>

  <Btn onClick={()=>setShowAdd(true)}>
    <span className="btn-icon">+</span>
    <span className="btn-word-1"> ახალი</span>
    <span className="btn-word-2"> შეკვეთა</span>
  </Btn>

</div>

</div>

      {/* Pagination */}
      {total > limit && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <div style={{ fontSize: 13, color: T.textLight }}>
            {total} შეკვეთა • გვერდი {page} / {Math.ceil(total / limit)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn
              size='sm'
              variant='secondary'
              onClick={handlePrev}
              disabled={page === 1}
            >
              « წინა
            </Btn>

            <Btn
              size='sm'
              variant='secondary'
              onClick={handleNext}
              disabled={page * limit >= total}
            >
              შემდეგი »
            </Btn>
          </div>
        </div>
      )}

      {/* Desktop Table */}

      <div style={{ position: 'relative' }}>

        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
          >
            <Spinner />
          </div>
        )}

        <div
          className="hide-sm"
          style={{
            background: T.surface,
            borderRadius: 14,
            border: `1.5px solid ${T.border}`,
            overflow: 'hidden',
            boxShadow: '0 2px 14px #0000000a'
          }}
        > </div>
        <div className="hide-sm" style={{ background: T.surface, borderRadius: 14, border: `1.5px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 2px 14px #0000000a' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surfaceAlt, borderBottom: `2px solid ${T.border}` }}>
                  {['#', 'კლიენტი', 'სკამები', 'ვადა', 'სტატუსი', 'ჯამი', 'გადახ.', ''].map(h => (
                    <th key={h} style={{ padding: '11px 14px', color: T.textLight, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan={8} style={{ padding: 50, textAlign: 'center', color: T.textLight }}>შეკვეთები ვერ მოიძებნა</td></tr>}
                {sortedOrders.map((order, idx) => {
                  const isDeleted = !!order.deletedAt;
                  const client = order.client;
                  const total = getTotal(order), paid = +order.paidAmount;
                  const profit = total - (+order.materialCost) - (+(order.additionalExpenses || 0));
                  const days = daysUntil(order.deliveryDeadline), dc = urgencyColor(order.deliveryDeadline);
                  return (

                    <tr
                      key={order.id}
                      style={{
                        borderBottom: `1px solid ${T.border}`,
                        background: isDeleted
                          ? '#fafafa'
                          : (idx % 2 === 0 ? T.surface : `${T.bg}88`),
                        opacity: isDeleted ? 0.6 : 1
                      }}
                    >
                      <td style={{ padding: '12px 14px' }}><span style={{ color: T.wood, fontWeight: 700, fontSize: 13 }}>{order.orderNumber}</span></td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{client?.firstName} {client?.lastName}</div>
                        <div style={{ color: T.textLight, fontSize: 12 }}>{client?.phone}</div>
                        {client?.companyName && <div style={{ color: T.woodLight, fontSize: 11 }}>🏢 {client.companyName}</div>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(order.items || []).map((it, i) => <Pill key={i} color={T.wood}>{it.quantity}× {it.chairType?.split(' ')[0]}</Pill>)}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: dc, fontWeight: 700, fontSize: 13 }}>{order.deliveryDeadline}</span>
                        <br /><span style={{ fontSize: 11, color: dc }}>{days < 0 ? `${-days}დ გადავ.` : days === 0 ? 'დღეს' : `${days} დღ`}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)}
                          style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontSize: 11, marginBottom: 4 }}>
                          {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                        <br /><Badge status={order.status} />
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{fmt(total)}</div>
                        <div style={{ fontSize: 11, color: T.success }}>💰 {fmt(profit)}</div>
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 13, color: paid >= total ? T.success : T.warning, fontWeight: 700 }}>{fmt(paid)}</div>
                        {paid < total && <div style={{ fontSize: 11, color: T.danger }}>ვ: {fmt(total - paid)}</div>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {!isDeleted ? (
                            <>
                              <Btn size='sm' variant='secondary' onClick={() => setEditOrder(order)}>
                                ✏️
                              </Btn>
                              <Btn size='sm' variant='danger' onClick={() => setConfirmDel(order.id)}>
                                🗑️
                              </Btn>
                            </>
                          ) : (
                            <>
                              <Btn size='sm' variant='secondary' onClick={() => handleRestore(order.id)}>
                                ♻
                              </Btn>
                              <Btn size='sm' variant='danger' onClick={() => handleHardDelete(order.id)}>
                                ❌
                              </Btn>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>



      {/* Mobile Cards */}
      <div style={{ display: 'none' }} className="show-sm">
        {sortedOrders.map((order, idx) => {
          const isDeleted = !!order.deletedAt;
          const client = order.client;
          const total = getTotal(order), paid = +order.paidAmount;
          const dc = urgencyColor(order.deliveryDeadline);
          return (
            <div key={order.id} style={{
              background: T.surface,
              borderRadius: 12,
              border: `1.5px solid ${T.border}`,
              padding: 14,
              marginBottom: 10,
              opacity: isDeleted ? 0.6 : 1,
              borderStyle: isDeleted ? 'dashed' : 'solid'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: T.wood, fontWeight: 700 }}>{order.orderNumber}</span>
                <BadgeShort status={order.status} />
              </div>
              <div style={{ fontWeight: 700, color: T.text }}>{client?.firstName} {client?.lastName}</div>
              <div style={{ color: T.textLight, fontSize: 12, marginBottom: 8 }}>{client?.phone}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {(order.items || []).map((it, i) => <Pill key={i} color={T.wood}>{it.quantity}× {it.chairType?.split(' ')[0]}</Pill>)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                <span style={{ color: dc, fontWeight: 600 }}>📅 {order.deliveryDeadline}</span>
                <span style={{ fontWeight: 700 }}>{fmt(total)}</span>
                <span style={{ color: paid >= total ? T.success : T.warning }}>{fmt(paid)}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!isDeleted ? (
                  <>
                    <Btn size='sm' variant='secondary' onClick={() => setEditOrder(order)} sx={{ flex: 1 }}>
                      ✏️ რედ.
                    </Btn>
                    <Btn size='sm' variant='danger' onClick={() => setConfirmDel(order.id)} sx={{ flex: 1 }}>
                      🗑️ წაშ.
                    </Btn>
                  </>
                ) : (
                  <>
                    <Btn size='sm' variant='secondary' onClick={() => handleRestore(order.id)} sx={{ flex: 1 }}>
                      ♻ Restore
                    </Btn>
                    <Btn size='sm' variant='danger' onClick={() => handleHardDelete(order.id)} sx={{ flex: 1 }}>
                      ❌ Forever
                    </Btn>
                  </>
                )}
              </div>
            </div>
          );
        })}


        {/* DELETED */}

        {/* {deletedOrders.length > 0 && (
    <>
      <div style={{ marginTop:20, opacity:0.6, fontWeight:600 }}>
        Deleted Orders
      </div>

      {deletedOrders.map(order => (
        <div
          key={order.id}
          style={{
            background:'#fafafa',
            border:`1px dashed ${T.border}`,
            borderRadius:12,
            padding:14,
            marginBottom:10,
            opacity:0.7
          }}
        >
          <div style={{ fontWeight:700 }}>
            {order.orderNumber}
          </div>

          <div style={{ display:'flex', gap:6 }}>
            <Btn
              size="sm"
              variant="secondary"
              onClick={() => handleRestore(order.id)}
            >
              ♻ Restore
            </Btn>

            <Btn
              size="sm"
              variant="danger"
              onClick={() => handleHardDelete(order.id)}
            >
              ❌ Delete forever
            </Btn>
          </div>
        </div>
      ))}
    </>
  )} */}



        {orders.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: T.textLight }}>შეკვეთები ვერ მოიძებნა</div>}

      </div>
      <style>{`@media(max-width:640px){.hide-sm{display:none!important}.show-sm{display:block!important}}`}</style>

      {/* Modals */}
      {showAdd && <OrderForm clients={clients} onSave={handleSave} onClose={() => setShowAdd(false)} title='ახალი შეკვეთა' />}
      {editOrder && <OrderForm initialOrder={editOrder} clients={clients} onSave={handleSave} onClose={() => setEditOrder(null)} title='შეკვეთის რედ.' />}
      {confirmDel && <ConfirmModal message={`შეკვეთა ${orders.find(o => o.id === confirmDel)?.orderNumber} წაიშლება სამუდამოდ.`} onConfirm={() => handleDelete(confirmDel)} onCancel={() => setConfirmDel(null)} />}

    </div>

  );
}
