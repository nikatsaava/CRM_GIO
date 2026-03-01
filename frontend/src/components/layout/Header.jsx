import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { T } from '../ui';

const NAV = [
  { path:'/orders',    icon:'📋', label:'შეკვეთები' },
  { path:'/clients',   icon:'👥', label:'კლიენტები' },
  { path:'/analytics', icon:'📈', label:'ანალიტიკა' },
];

export default function Header({ onNewOrder }) {
  const { logoutUser, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <header style={{
      background:T.surface, borderBottom:`2px solid ${T.border}`,
      padding:'0 16px', display:'flex', alignItems:'center', gap:8,
      position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 14px #0000000f',
      backgroundImage:`linear-gradient(135deg,${T.woodDark}06,${T.woodLight}0a)`,
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 0', marginRight:8, flexShrink:0 }}>
        <div style={{ width:34, height:34, background:`linear-gradient(135deg,${T.woodDark},${T.woodLight})`,
          borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🪑</div>
        <span style={{ fontWeight:900, fontSize:21, color:T.woodDark, letterSpacing:'-1px', fontStyle:'italic' }}>Tale</span>
      </div>

      {/* Nav */}
      <nav style={{ display:'flex', flex:1 }}>
        {NAV.map(n => (
          <button key={n.path} onClick={() => navigate(n.path)} style={{
            flex:1, padding:'14px 4px', cursor:'pointer', fontWeight:700, fontSize:13,
            background: pathname.startsWith(n.path)
              ? `linear-gradient(135deg,${T.woodDark},${T.woodLight})` : 'transparent',
            color: pathname.startsWith(n.path) ? '#fff' : T.textMid,
            border:'none', transition:'all .15s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:5,
          }}>
            <span>{n.icon}</span>
            <span className='hide-mobile'>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Actions */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
        <button onClick={onNewOrder} style={{
          background:`linear-gradient(135deg,${T.woodDark},${T.woodLight})`, color:'#fff',
          border:'none', borderRadius:8, padding:'8px 16px', fontWeight:700, fontSize:13, cursor:'pointer',
        }}>
          <span>+</span><span className='hide-mobile' style={{ marginLeft:4 }}>ახალი შეკვეთა</span>
        </button>
        <button onClick={logoutUser} title={`გამოსვლა (${user?.email})`} style={{
          background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8,
          padding:'8px 10px', cursor:'pointer', fontSize:14, color:T.textMid,
        }}>⏏️</button>
      </div>
    </header>
  );
}
