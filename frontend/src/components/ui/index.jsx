import React, { useState } from 'react';

export const T = {
  bg:'#faf8f5', surface:'#fff', surfaceAlt:'#f5f0ea', surfaceDeep:'#ede5d8',
  border:'#e8ddd0', borderStrong:'#d4c4ae',
  wood:'#8b5e3c', woodLight:'#c4956a', woodDark:'#5c3d22',
  text:'#2c1e0f', textMid:'#6b5040', textLight:'#9c8070',
  danger:'#cc4444', dangerBg:'#fff0f0', dangerBorder:'#ffcccc',
  success:'#4a8c5c', successBg:'#f0faf4', successBorder:'#aadcb8',
  warning:'#c9883a', warningBg:'#fff8f0', warningBorder:'#f5cfa0',
  info:'#4a7a9b',
};

export const STATUSES = [
  { key:'awaiting_confirmation', label:'დასტურის მოლოდინში', short:'მოლოდინი', color:'#c9883a' },
  { key:'confirmed',             label:'დადასტურებული',       short:'დადასტ.',  color:'#4a90b8' },
  { key:'in_production',         label:'წარმოებაში',          short:'წარმოება', color:'#7c5cbf' },
  { key:'ready',                 label:'გასაცემად მზადაა',    short:'მზადაა',   color:'#5aaa7a' },
  { key:'delivered',             label:'გაცემულია',           short:'გაცემული', color:'#8a9baa' },
  { key:'cancelled',             label:'გაუქმებული',          short:'გაუქმდა',  color:'#cc5555' },
];

export const statusObj = (k) => STATUSES.find(s => s.key === k) || STATUSES[0];
export const fmt = (n) => new Intl.NumberFormat('ka-GE').format(n || 0) + ' ₾';
export const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
export const urgencyColor = (d) => {
  const days = daysUntil(d);
  return days < 0 ? T.danger : days <= 3 ? '#e06030' : days <= 7 ? T.warning : T.success;
};

export function Badge({ status }) {
  const s = statusObj(status);
  return (
    <span style={{ background: s.color+'20', color: s.color, border: `1px solid ${s.color}44`,
      padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  );
}

export function BadgeShort({ status }) {
  const s = statusObj(status);
  return (
    <span style={{ background: s.color+'20', color: s.color, border:`1px solid ${s.color}44`,
      padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>
      {s.short}
    </span>
  );
}

export function Pill({ color, children }) {
  return (
    <span style={{ background: color+'18', color, border:`1px solid ${color}30`,
      padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600 }}>
      {children}
    </span>
  );
}

export function Inp({ label, value, onChange, type='text', placeholder='', disabled=false, rows, required=false }) {
  const [focused, setFocused] = useState(false);
  const base = {
    background: disabled ? T.surfaceAlt : T.surface,
    border: `1.5px solid ${focused ? T.wood : T.border}`,
    borderRadius:8, padding:'9px 12px', color:T.text, fontSize:14,
    outline:'none', width:'100%', transition:'border .15s', opacity: disabled ? 0.6 : 1,
  };
  const props = {
    value: value ?? '', onChange: e => onChange(e.target.value),
    placeholder, disabled, required,
    onFocus: () => setFocused(true),
    onBlur:  () => setFocused(false),
    style: base,
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && (
        <label style={{ fontSize:11, color:T.textLight, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px' }}>
          {label}{required && <span style={{ color:T.danger }}> *</span>}
        </label>
      )}
      {rows ? <textarea {...props} rows={rows} style={{ ...base, resize:'vertical', lineHeight:1.5, fontFamily:'inherit' }} />
             : <input   {...props} type={type} />}
    </div>
  );
}

export function Sel({ label, value, onChange, options, allowEmpty=false, required=false }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && (
        <label style={{ fontSize:11, color:T.textLight, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px' }}>
          {label}{required && <span style={{ color:T.danger }}> *</span>}
        </label>
      )}
      <select value={value ?? ''} onChange={e => onChange(e.target.value)} required={required}
        style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:8,
          padding:'9px 12px', color:T.text, fontSize:14, outline:'none', width:'100%', cursor:'pointer' }}>
        {allowEmpty && <option value=''>—</option>}
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

const BTN = {
  primary:   { bg:`linear-gradient(135deg,${T.woodDark},${T.woodLight})`, color:'#fff', border:'none' },
  secondary: { bg:T.surface,    color:T.textMid,  border:`1.5px solid ${T.border}` },
  danger:    { bg:T.dangerBg,   color:T.danger,   border:`1.5px solid ${T.dangerBorder}` },
  ghost:     { bg:'transparent',color:T.wood,     border:'none' },
  success:   { bg:T.successBg,  color:T.success,  border:`1.5px solid ${T.successBorder}` },
};

export function Btn({ children, onClick, variant='primary', size='md', disabled=false, style:sx={}, type='button', fullWidth=false }) {
  const s = BTN[variant] || BTN.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      background:s.bg, color:s.color, border:s.border||'none', borderRadius:8,
      padding: size==='sm' ? '5px 12px' : size==='lg' ? '11px 28px' : '9px 18px',
      fontSize: size==='sm' ? 12 : 14, fontWeight:700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, transition:'all .15s', whiteSpace:'nowrap',
      width: fullWidth ? '100%' : undefined, ...sx,
    }}>{children}</button>
  );
}

export function Card({ children, style }) {
  return (
    <div className='fade-in' style={{ background:T.surface, borderRadius:14, border:`1.5px solid ${T.border}`,
      padding:20, boxShadow:'0 2px 14px #0000000c', ...style }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0 12px' }}>
      <span style={{ color:T.wood, fontSize:15, fontWeight:800 }}>{children}</span>
      <div style={{ flex:1, height:1, background:T.border }} />
      {action}
    </div>
  );
}

export function WoodLine() {
  return <div style={{ height:2, background:`linear-gradient(90deg,transparent,${T.wood}55,${T.woodLight},${T.wood}55,transparent)`, margin:'14px 0' }} />;
}

export function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
      <div style={{ width:36, height:36, border:`3px solid ${T.border}`,
        borderTopColor:T.wood, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'#0000008a', zIndex:2000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className='slide-up' style={{ background:T.surface, borderRadius:14, padding:28,
        maxWidth:380, width:'100%', boxShadow:'0 20px 60px #00000040', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🗑️</div>
        <div style={{ color:T.text, fontSize:16, fontWeight:700, marginBottom:8 }}>დარწმუნებული ხართ?</div>
        <div style={{ color:T.textMid, fontSize:14, marginBottom:24 }}>{message}</div>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <Btn variant='secondary' onClick={onCancel}>გაუქმება</Btn>
          <Btn variant='danger'    onClick={onConfirm}>წაშლა</Btn>
        </div>
      </div>
    </div>
  );
}

export function Toast({ message, type='success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const color = type === 'error' ? T.danger : type === 'warning' ? T.warning : T.success;
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:3000,
      background:T.surface, border:`2px solid ${color}`, borderRadius:10,
      padding:'12px 20px', boxShadow:'0 8px 30px #00000020', color, fontWeight:700, fontSize:14,
      display:'flex', alignItems:'center', gap:10, animation:'slideUp .2s ease' }}>
      <span>{type==='error'?'❌':type==='warning'?'⚠️':'✅'}</span>
      {message}
      <button onClick={onClose} style={{ background:'none', border:'none', color, cursor:'pointer', fontSize:16, marginLeft:8 }}>✕</button>
    </div>
  );
}

// Re-export for import convenience
import { useEffect } from 'react';

// Constants used by old OrderForm and ClientsPage
export const CHAIR_TYPES = ['სკამი-ბარი','სასადილო სკამი','სავარძელი','საბავშვო სკამი','დასაკეცი სკამი','საოფისე სკამი','ლაუნჯ-სავარძელი','რბილი სკამი'];
export const MATERIALS   = ['მუხა','ფერფლი','ფიჭვი','არყი','კაკალი','წიფელი','MDF','ლითონი','ლითონი + ხე'];
export const COLORS      = ['ბუნებრივი','თეთრი','შავი','კაკალი','ვენგე','გათეთრებული მუხა','რუხი','ყავისფერი','მწვანე'];
export const FINISHES    = ['ლაქი (მქრქალი)','ლაქი (პრიალა)','ზეთი','სახი','ბუნებრივი'];
export const UPHOLSTERY  = ['ქსოვილი','ტყავი','ეკო-ტყავი','ხავერდი'];
export const SOURCES     = ['სოციალური ქსელი','რეკომენდაცია','ვებსაიტი','პირდაპირი ვიზიტი','სხვა'];

// Alert component
export function Alert({ type = 'info', children }) {
  const colors = {
    info:    { bg: '#f0f6ff', border: '#bbd4f8', color: T.info },
    success: { bg: T.successBg, border: T.successBorder, color: T.success },
    warning: { bg: T.warningBg, border: T.warningBorder, color: T.warning },
    error:   { bg: T.dangerBg,  border: T.dangerBorder,  color: T.danger },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>
      {children}
    </div>
  );
}

// Modal components
export function Modal({ children, onClose, maxWidth = 600 }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'#0000008a', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div className='slide-up' style={{ background:T.surface, borderRadius:14, border:`1.5px solid ${T.border}`,
        width:'100%', maxWidth, maxHeight:'92vh', overflow:'auto', boxShadow:'0 20px 60px #00000040' }}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ children, onClose }) {
  return (
    <div style={{ padding:'16px 22px', borderBottom:`2px solid ${T.border}`,
      display:'flex', justifyContent:'space-between', alignItems:'center',
      background:`linear-gradient(135deg,${T.woodDark}08,${T.woodLight}12)`,
      position:'sticky', top:0, zIndex:10 }}>
      <h2 style={{ color:T.text, margin:0, fontSize:18, fontWeight:800 }}>{children}</h2>
      {onClose && (
        <button onClick={onClose} style={{ background:'none', border:'none',
          color:T.textLight, fontSize:24, cursor:'pointer' }}>✕</button>
      )}
    </div>
  );
}

export function ModalFooter({ children }) {
  return (
    <div style={{ padding:'14px 22px', borderTop:`1px solid ${T.border}`,
      display:'flex', justifyContent:'flex-end', gap:10,
      background:T.surfaceAlt, position:'sticky', bottom:0 }}>
      {children}
    </div>
  );
}
