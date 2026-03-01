import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { T } from '../ui';

const NAV = [
  { path:'/orders',    icon:'📋', label:'შეკვეთები' },
  { path:'/clients',   icon:'👥', label:'კლიენტები' },
  { path:'/analytics', icon:'📈', label:'ანალიტიკა' },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight:'100vh', background:T.bg }}>
      {/* HEADER */}
      <header style={{
    background: T.surface,
    borderBottom: `1px solid ${T.border}`,
    padding: '0 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(6px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
  }}>
        {/* Logo */}
        <div
  onClick={() => navigate('/orders')}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    marginRight: 12,
    cursor: 'pointer'
  }}
>
<svg width="42" height="42" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="woodGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={T.woodLight} />
      <stop offset="100%" stopColor={T.woodDark} />
    </linearGradient>
  </defs>

  {/* Спинка */}
  <rect
    x="22"
    y="8"
    width="20"
    height="18"
    rx="4"
    fill={T.woodDark}
  />

  {/* Сиденье */}
  <rect
    x="18"
    y="26"
    width="28"
    height="8"
    rx="3"
    fill="url(#woodGrad)"
  />

  {/* Задняя левая ножка */}
  <rect
    x="22"
    y="34"
    width="4"
    height="20"
    rx="2"
    fill={T.woodDark}
  />

  {/* Задняя правая ножка */}
  <rect
    x="38"
    y="34"
    width="4"
    height="20"
    rx="2"
    fill={T.woodDark}
  />

  {/* Передняя перекладина (глубина) */}
  <rect
    x="20"
    y="34"
    width="24"
    height="4"
    rx="2"
    fill={T.woodLight}
  />
</svg>

  <div style={{ lineHeight: 1 }}>
    <div style={{
      fontSize: 20,
      fontWeight: 800,
      letterSpacing: '-0.5px',
      color: T.woodDark
    }}>
      Tale
    </div>
    <div style={{
      fontSize: 11,
      color: T.textLight,
      fontWeight: 500,
      marginTop: 2
    }}>
    </div>
  </div>
</div>
        {/* Nav */}
        <div style={{ display:'flex', flex:1 }}>
          {NAV.map(n=>{
              const active = location.pathname === n.path;
            return (
              <button key={n.path} onClick={()=>navigate(n.path)} style={{
                flex:1,
                padding:'10px 6px',
                cursor:'pointer',
                fontWeight:600,
                fontSize:13,
                borderRadius:12,
                border:'none',
                transition:'all .18s ease',
                background: active
                  ? `linear-gradient(135deg,${T.woodDark},${T.woodLight})`
                  : 'transparent',
                color: active ? '#fff' : T.textMid,
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:6
              }}>
                <span>{n.icon}</span><span className="hide-sm">{n.label}</span>
              </button>
            );
          })}
        </div>
        {/* User menu */}
        <div style={{ position:'relative', marginLeft:8 }}>
          <button onClick={()=>setMenuOpen(m=>!m)} style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 12px', cursor:'pointer', fontSize:13, color:T.textMid, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
            <span>👤</span><span className="hide-sm">{user?.username}</span>
          </button>
          {menuOpen && (
            <div style={{ position:'absolute', right:0, top:'110%', background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, boxShadow:'0 8px 24px #00000015', minWidth:160, zIndex:200 }}>
              <button onClick={()=>{ setMenuOpen(false); navigate('/settings'); }} style={{ display:'block', width:'100%', padding:'10px 14px', textAlign:'left', background:'none', border:'none', cursor:'pointer', color:T.text, fontSize:13, fontWeight:600 }}>⚙️ პარამეტრები</button>
              <div style={{ height:1, background:T.border, margin:'4px 0' }} />
              <button onClick={handleLogout} style={{ display:'block', width:'100%', padding:'10px 14px', textAlign:'left', background:'none', border:'none', cursor:'pointer', color:T.danger, fontSize:13, fontWeight:600 }}>🚪 გასვლა</button>
            </div>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

