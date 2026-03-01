import React, { useState, useEffect } from 'react';
import { getDashboard } from '../api/analytics';
import { T, Card, Pill, Spinner, fmt } from '../components/ui';

const STAT_STATUSES = [
  { key:'awaiting_confirmation', label:'მოლოდინი',  color:'#c9883a' },
  { key:'confirmed',             label:'დადასტ.',   color:'#4a90b8' },
  { key:'in_production',         label:'წარმ.',     color:'#7c5cbf' },
  { key:'ready',                 label:'მზადაა',    color:'#5aaa7a' },
  { key:'delivered',             label:'გაც.',      color:'#8a9baa' },
  { key:'cancelled',             label:'გაუქმ.',    color:'#cc5555' },
];

export default function AnalyticsPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState('all'); // 'all' или 'YYYY-MM'

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
  
        if (monthFilter !== 'all') {
          const [year, month] = monthFilter.split('-').map(Number);
          const from = `${monthFilter}-01`;
          // последний день месяца
          const lastDayDate = new Date(year, month, 0);
          const to = lastDayDate.toISOString().slice(0, 10);
  
          params.from = from;
          params.to = to;
        }
  
        const r = await getDashboard(params);
        setData(r.data);
      } finally {
        setLoading(false);
      }
    };
  
    load();
  }, [monthFilter]);
    
  if (loading) return <Spinner />;
  if (!data) return <div style={{ padding:40, textAlign:'center', color:T.textLight }}>მონაცემები ვერ ჩაიტვირთა</div>;

  const { summary, topChairTypes = [], topMaterials = [], topClients = [], statusCounts = {}, debtOrders = [], monthlyStats = [] } = data;
  const maxChair = topChairTypes[0]?.count || 1;

// построим опции месяцев на основе monthlyStats
const monthOptions = [
  { value: 'all', label: 'ყველა პერიოდი' },
  ...monthlyStats
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month)) // month в формате 'YYYY-MM'
    .map(m => ({
      value: m.month,
      label: m.month, // при желании можно преобразовать в 'იანვარი 2025' и т.п.
    })),
];
  
  return (
    <div style={{ padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, gap:12 }}>
  <h2 style={{ color:T.text, margin:0, fontSize:20, fontWeight:800 }}>ანალიტიკა</h2>
  <select
    value={monthFilter}
    onChange={e => setMonthFilter(e.target.value)}
    style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:8, padding:'6px 10px', fontSize:13, color:T.text }}
  >
    {monthOptions.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
</div>

      
      {/* Summary */}
      <div className="analytics-grid-4" style={{ display:'grid', gap:14, marginBottom:20 }}>
        {[
          { l:'შემოსავ. (მიტ.)', v:fmt(summary.revenue),      icon:'💵', c:T.wood },
          { l:'ხარჯები (მიტ.)',  v:fmt(summary.costs),        icon:'🔩', c:T.warning },
          { l:'მოგება (მიტ.)',   v:fmt(summary.profit),       icon:'💰', c:T.success },
          { l:'დავალიანება',      v:fmt(summary.totalDebt),    icon:'⚠️', c:T.danger },
        ].map(m=>(
          <Card key={m.l}>
            <div style={{ fontSize:26, marginBottom:8 }}>{m.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:m.c }}>{m.v}</div>
            <div style={{ fontSize:11, color:T.textLight, marginTop:2 }}>{m.l}</div>
          </Card>
        ))}
      </div>
      <div className="analytics-grid-3" style={{ display:'grid', gap:14, marginBottom:20 }}>
        {[
          { l:'კლიენტები',     v:summary.totalClients,  c:T.info },
          { l:'ყველა შეკვ.',   v:summary.totalOrders,   c:T.text },
          { l:'აქტ. შეკვ.',   v:summary.activeOrders,  c:T.wood },
        ].map(m=>(
          <Card key={m.l} style={{ textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:900, color:m.c }}>{m.v}</div>
            <div style={{ fontSize:12, color:T.textLight }}>{m.l}</div>
          </Card>
        ))}
      </div>

      <div className="analytics-grid-2" style={{ display:'grid', gap:20, marginBottom:20 }}>
        {/* Chair types */}
        <Card>
          <h3 style={{ color:T.text, fontSize:15, margin:'0 0 16px', fontWeight:800 }}>🪑 ტოპ სკამები</h3>
          {topChairTypes.length===0&&<div style={{ color:T.textLight,fontSize:13 }}>მონაც. არ არის</div>}
          {topChairTypes.map((t,i)=>(
            <div key={t.name} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                <span style={{ color:T.text, fontWeight:600 }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':'   '} {t.name}</span>
                <span style={{ color:T.textMid }}>{t.count} ც — {fmt(t.revenue)}</span>
              </div>
              <div style={{ background:T.surfaceDeep, borderRadius:4, height:7 }}>
                <div style={{ background:`linear-gradient(90deg,${T.woodDark},${T.woodLight})`, borderRadius:4, height:7, width:`${t.count/maxChair*100}%`, transition:'width .5s' }} />
              </div>
            </div>
          ))}
        </Card>
        {/* Materials */}
        <Card>
          <h3 style={{ color:T.text, fontSize:15, margin:'0 0 16px', fontWeight:800 }}>🌳 მასალები</h3>
          {topMaterials.map(m=>(
            <div key={m.name} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${T.border}`, fontSize:13 }}>
              <span style={{ color:T.text, fontWeight:600 }}>{m.name}</span>
              <Pill color={T.wood}>{m.count} ც</Pill>
            </div>
          ))}
        </Card>
      </div>

      <div className="analytics-grid-2" style={{ display:'grid', gap:20, marginBottom:20 }}>
        {/* Debts */}
        <Card>
          <h3 style={{ color:T.text, fontSize:15, margin:'0 0 16px', fontWeight:800 }}>💸 დავალიანებები</h3>
          {debtOrders.length===0&&<div style={{ color:T.success,fontSize:13 }}>✅ დავალ. არ არის</div>}
          {debtOrders.map(o=>(
            <div key={o.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${T.border}`, fontSize:13 }}>
              <div><div style={{ color:T.text, fontWeight:600 }}>{o.orderNumber}</div></div>
              <span style={{ color:T.danger, fontWeight:700 }}>{fmt(o.debt)}</span>
            </div>
          ))}
        </Card>
        {/* Top clients */}
        <Card>
          <h3 style={{ color:T.text, fontSize:15, margin:'0 0 16px', fontWeight:800 }}>🏆 ტოპ კლიენტები</h3>
          {topClients.map((c,i)=>(
            <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
              <div style={{ fontSize:13 }}>
                <span style={{ marginRight:6 }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':'  '}</span>
                <span style={{ color:T.text, fontWeight:600 }}>{c.name}</span>
                <span style={{ color:T.textLight, fontSize:11, display:'block', marginLeft:22 }}>{c.ordersCount} შეკვ.</span>
              </div>
              <span style={{ color:T.wood, fontWeight:700, fontSize:13 }}>{fmt(c.totalSpent)}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Monthly */}
      {monthlyStats.length>0&&(
       
       <Card>
  <h3 style={{ color:T.text, fontSize:15, margin:'0 0 16px', fontWeight:800 }}>📅 თვეების სტ.</h3>
  <div style={{ overflowX:'auto' }}>
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
      <thead>
        <tr style={{ background:T.surfaceAlt }}>
          {['თვე','შეკვ.','შემოს.','მოგება'].map(h => (
            <th key={h} style={{ padding:'8px 12px', color:T.textLight, fontWeight:700, textAlign:'left' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {monthlyStats
          .filter(m => m.orders > 0)   // <-- оставляем только месяцы с заказами
          .map(m => (
            <tr key={m.month} style={{ borderBottom:`1px solid ${T.border}` }}>
              <td style={{ padding:'8px 12px', fontWeight:600 }}>{m.month}</td>
              <td style={{ padding:'8px 12px' }}>{m.orders}</td>
              <td style={{ padding:'8px 12px', color:T.wood, fontWeight:600 }}>{fmt(m.revenue)}</td>
              <td style={{ padding:'8px 12px', color:T.success, fontWeight:600 }}>{fmt(m.profit)}</td>
            </tr>
          ))
        }
      </tbody>
    </table>
  </div>
</Card>
       
      )}

      {/* Status counts */}
      <Card style={{ marginTop:20 }}>
        <h3 style={{ color:T.text, fontSize:15, margin:'0 0 16px', fontWeight:800 }}>📊 სტატუსები</h3>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {STAT_STATUSES.map(s=>{ const cnt=(statusCounts||{})[s.key]||0; return (
            <div key={s.key} style={{ background:s.color+'15', border:`1px solid ${s.color}33`, borderRadius:12, padding:'12px 20px', textAlign:'center', minWidth:110 }}>
              <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{cnt}</div>
              <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>{s.label}</div>
            </div>
          );})}
        </div>
      </Card>
    </div>
  );
}
