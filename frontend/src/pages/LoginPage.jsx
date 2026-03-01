import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { login } from '../api/auth';
import { T } from '../components/ui';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await login(email, password);
      setAuth(data.access_token, data.user);
      navigate('/orders');
    } catch(err) {
      setError(err.response?.data?.message || 'შეყვანის შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20,
      backgroundImage:`radial-gradient(ellipse at 30% 60%, ${T.woodLight}18 0%, transparent 60%)` }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:60, height:60, background:`linear-gradient(135deg,${T.woodDark},${T.woodLight})`,
            borderRadius:16, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:32, marginBottom:12 }}>🪑</div>
          <h1 style={{ fontSize:36, fontWeight:900, color:T.woodDark, letterSpacing:'-2px', fontStyle:'italic' }}>Tale</h1>
          <p style={{ color:T.textLight, fontSize:14, marginTop:4 }}>სკამების წარმოების CRM</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background:T.surface, borderRadius:16, padding:32,
          boxShadow:'0 8px 40px #0000001a', border:`1.5px solid ${T.border}` }}>
          <h2 style={{ color:T.text, margin:'0 0 24px', fontSize:18, fontWeight:800 }}>შესვლა</h2>

          {error && (
            <div style={{ background:T.dangerBg, border:`1px solid ${T.dangerBorder}`, color:T.danger,
              borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13 }}>❌ {error}</div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:24 }}>
            <div>
              <label style={{ fontSize:11, color:T.textLight, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:5 }}>Email</label>
              <input type='email' value={email} onChange={e=>setEmail(e.target.value)} required placeholder='admin@tale.ge'
                style={{ width:'100%', background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:8,
                  padding:'10px 14px', color:T.text, fontSize:15, outline:'none', boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=T.wood} onBlur={e=>e.target.style.borderColor=T.border} />
            </div>
            <div>
              <label style={{ fontSize:11, color:T.textLight, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:5 }}>პაროლი</label>
              <input type='password' value={password} onChange={e=>setPassword(e.target.value)} required placeholder='••••••••'
                style={{ width:'100%', background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:8,
                  padding:'10px 14px', color:T.text, fontSize:15, outline:'none', boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=T.wood} onBlur={e=>e.target.style.borderColor=T.border} />
            </div>
          </div>

          <button type='submit' disabled={loading} style={{
            width:'100%', background:`linear-gradient(135deg,${T.woodDark},${T.woodLight})`,
            color:'#fff', border:'none', borderRadius:10, padding:'12px', fontSize:16,
            fontWeight:800, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
            {loading ? '⏳ შედის...' : 'შესვლა →'}
          </button>
        </form>
      </div>
    </div>
  );
}
