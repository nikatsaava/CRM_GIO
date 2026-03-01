import React, { useState } from 'react';
import { changePassword } from '../api/auth';
import { T, Inp, Btn, Card } from '../components/ui';

export default function SettingsPage() {
  const [oldPw, setOldPw]   = useState('');
  const [newPw, setNewPw]   = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [msg, setMsg]       = useState('');
  const [err, setErr]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    e.preventDefault();
    if (newPw !== newPw2) { setErr('ახალი პაროლები არ ემთხვევა'); return; }
    if (newPw.length < 6) { setErr('პაროლი მინ. 6 სიმბოლო'); return; }
    setLoading(true); setErr(''); setMsg('');
    try {
      await changePassword(oldPw, newPw);
      setMsg('პაროლი წარმატებით შეიცვალა');
      setOldPw(''); setNewPw(''); setNewPw2('');
    } catch(e) { setErr(e.response?.data?.message||'შეცდომა'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding:24, maxWidth:480 }}>
      <h2 style={{ color:T.text, margin:'0 0 24px', fontWeight:800 }}>⚙️ პარამეტრები</h2>
      <Card>
        <h3 style={{ color:T.text, margin:'0 0 20px', fontSize:15, fontWeight:800 }}>🔒 პაროლის შეცვლა</h3>
        {msg&&<div style={{ background:T.successBg, border:`1px solid ${T.successBorder}`, borderRadius:8, padding:'10px 14px', color:T.success, fontSize:13, marginBottom:16 }}>{msg}</div>}
        {err&&<div style={{ background:T.dangerBg, border:`1px solid ${T.dangerBorder}`, borderRadius:8, padding:'10px 14px', color:T.danger, fontSize:13, marginBottom:16 }}>{err}</div>}
        <form onSubmit={handleChange}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Inp label='ძველი პაროლი' type='password' value={oldPw} onChange={setOldPw} required />
            <Inp label='ახალი პაროლი' type='password' value={newPw} onChange={setNewPw} required />
            <Inp label='ახალი პაროლი (გამეორება)' type='password' value={newPw2} onChange={setNewPw2} required />
            <Btn type='submit' disabled={loading}>{loading?'ინახება...':'შეცვლა'}</Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}
