import React, { useState, useEffect, useCallback } from 'react';
import { fetchHospitals, fetchSOS } from '../api/hospitalService';
import { getFavorites, addFavorite, removeFavorite } from '../services/favoritesService';
import { addSearchToHistory, getSearchSuggestions } from '../services/searchHistoryService';
import { logSearch, logHospitalClick, logFavoriteAction } from '../utils/analytics';
import { retryWithBackoff, getErrorMessage, isOnline } from '../utils/errorRecovery';
import { SettingsModal } from '../components/SettingsModal';
import { AboutAppModal } from '../components/AboutAppModal';

const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f5f7fa; color: #111827; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .fade-up { animation: fadeUp 0.3s ease forwards; }
    @keyframes shimmer { 0% { background-position:-600px 0; } 100% { background-position:600px 0; } }
    .skeleton {
      background: linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%);
      background-size: 600px 100%;
      animation: shimmer 1.3s infinite;
      border-radius: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `}</style>
);

const fmtDist = km =>
  km == null || km >= 9999 ? 'N/A' : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

const BUSY_CFG = {
  busy:     { color: '#b91c1c', bg: '#fef2f2', dot: '#ef4444', label: 'Peak Hours'    },
  moderate: { color: '#b45309', bg: '#fffbeb', dot: '#f59e0b', label: 'Moderate Wait' },
  quiet:    { color: '#15803d', bg: '#f0fdf4', dot: '#22c55e', label: 'Usually Quiet' },
};
const OPEN_CFG = {
  green: { bg: '#f0fdf4', text: '#15803d' },
  red:   { bg: '#fef2f2', text: '#b91c1c' },
  gray:  { bg: '#f9fafb', text: '#6b7280' },
};

const SYMPTOM_SUGGESTIONS  = ['Fever', 'Headache', 'Chest Pain', 'Back Pain', 'Diabetes', 'Eye Problem', 'Dental', 'MRI Scan', 'Blood Test', 'Pregnancy'];
const HOSPITAL_SUGGESTIONS = ['Apollo Hospital', 'KIMS Hospital', 'Yashoda Hospital', 'Care Hospital', 'Medicover', 'Aster Prime', 'Rainbow Hospital', 'Continental Hospital'];

/* ─── Skeleton ──────────────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #e5e7eb', marginBottom:12 }}>
    <div style={{ display:'flex', gap:16 }}>
      <div className="skeleton" style={{ width:64, height:64, borderRadius:12, flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <div className="skeleton" style={{ width:'50%', height:18, marginBottom:10 }} />
        <div className="skeleton" style={{ width:'30%', height:13, marginBottom:8 }} />
        <div className="skeleton" style={{ width:'65%', height:13 }} />
      </div>
      <div style={{ width:110 }}>
        <div className="skeleton" style={{ width:'100%', height:38, borderRadius:9 }} />
      </div>
    </div>
    <div style={{ height:1, background:'#f3f4f6', margin:'16px 0' }} />
    <div style={{ display:'flex', gap:8 }}>
      <div className="skeleton" style={{ width:100, height:28, borderRadius:99 }} />
      <div className="skeleton" style={{ width:80,  height:28, borderRadius:99 }} />
    </div>
  </div>
);

/* ─── SOS Modal ─────────────────────────────────────────────────────────── */
const SOSModal = ({ data, onClose }) => {
  if (!data) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', width:'100%', maxWidth:560, borderRadius:'20px 20px 0 0', padding:28, boxShadow:'0 -8px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontWeight:800, fontSize:20, color:'#dc2626' }}>!</span>
          </div>
          <div>
            <p style={{ fontWeight:800, fontSize:18, color:'#dc2626' }}>Emergency Response</p>
            <p style={{ fontSize:13, color:'#6b7280' }}>Nearest hospitals — 24/7 priority first</p>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:320, overflowY:'auto' }}>
          {data.nearest?.map((h, i) => (
            <div key={h.id} style={{ border: i===0 ? '1.5px solid #fca5a5' : '1px solid #e5e7eb', borderRadius:12, padding:16, background: i===0 ? '#fff7f7' : '#fafafa' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <div>
                  <p style={{ fontWeight:700, fontSize:15 }}>{h.name}</p>
                  <p style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{h.address}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontWeight:700, fontSize:14 }}>{fmtDist(h.distance_km)}</p>
                  <p style={{ fontSize:12, color:'#9ca3af' }}>{h.eta} away</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                {h.is_24_7 && <span style={{ fontSize:11, fontWeight:700, background:'#dcfce7', color:'#15803d', padding:'2px 8px', borderRadius:99 }}>24 / 7</span>}
                {h.phone !== 'N/A' && <span style={{ fontSize:11, color:'#2563eb', fontWeight:600 }}>{h.phone}</span>}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {[['Uber', h.ride_links?.uber, '#111827', '#fff'], ['Ola', h.ride_links?.ola, '#15803d', '#fff'], ['Maps', h.ride_links?.google_maps, '#2563eb', '#fff']].map(([label, href, bg, fg]) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer"
                    style={{ flex:1, textAlign:'center', fontSize:12, fontWeight:700, padding:'8px 0', borderRadius:8, background:bg, color:fg, textDecoration:'none' }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop:16, width:'100%', padding:'12px 0', borderRadius:10, background:'#f3f4f6', border:'none', fontWeight:700, fontSize:14, color:'#374151', cursor:'pointer', fontFamily:'inherit' }}>
          Close
        </button>
      </div>
    </div>
  );
};

/* ─── Compare Modal ─────────────────────────────────────────────────────── */
const CompareModal = ({ items, onClose }) => {
  const [a, b] = items;
  const rows = [
    ['AI Score',  `${Math.round(a.ai_recommendation_score * 100)}%`, `${Math.round(b.ai_recommendation_score * 100)}%`],
    ['Rating',    `${a['Rating (out of 5)']} / 5`,  `${b['Rating (out of 5)']} / 5`],
    ['Reviews',   `${a['Number of Reviews']}`,       `${b['Number of Reviews']}`],
    ['Distance',  fmtDist(a.distance_km),             fmtDist(b.distance_km)],
    ['ETA',       a.eta,                              b.eta],
    ['Status',    a.open_status?.label ?? 'Unknown',  b.open_status?.label ?? 'Unknown'],
  ];
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:520, boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }}>
        <p style={{ fontWeight:800, fontSize:20, marginBottom:20 }}>Compare Hospitals</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
          <div />
          {[a, b].map((h, i) => (
            <div key={i} style={{ background: i===0 ? '#eff6ff' : '#f9fafb', borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
              <p style={{ fontSize:12, fontWeight:700, color: i===0 ? '#1d4ed8' : '#374151', lineHeight:1.3 }}>{h.DiagnosticCentreName}</p>
            </div>
          ))}
        </div>
        {rows.map(([label, va, vb]) => (
          <div key={label} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, padding:'10px 0', borderBottom:'1px solid #f3f4f6' }}>
            <span style={{ fontSize:12, color:'#6b7280', fontWeight:600, alignSelf:'center' }}>{label}</span>
            <span style={{ fontSize:13, fontWeight:700, textAlign:'center', color:'#1d4ed8' }}>{va}</span>
            <span style={{ fontSize:13, fontWeight:700, textAlign:'center', color:'#374151' }}>{vb}</span>
          </div>
        ))}
        <button onClick={onClose} style={{ marginTop:20, width:'100%', padding:'13px 0', borderRadius:10, background:'#1d4ed8', border:'none', fontWeight:700, fontSize:14, color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>Done</button>
      </div>
    </div>
  );
};

/* ─── Saved Drawer ──────────────────────────────────────────────────────── */
const SavedDrawer = ({ saved, onClose, onRemove }) => (
  <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', justifyContent:'flex-end' }}>
    <div onClick={e => e.stopPropagation()} style={{ background:'#fff', width:360, height:'100%', overflowY:'auto', padding:24, boxShadow:'-8px 0 40px rgba(0,0,0,0.12)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <p style={{ fontWeight:800, fontSize:20 }}>Saved Places</p>
        <button onClick={onClose} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#6b7280', lineHeight:1 }}>×</button>
      </div>
      {saved.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af' }}>
          <div style={{ width:56, height:56, borderRadius:16, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:22, fontWeight:800, color:'#d1d5db' }}>H</div>
          <p style={{ fontWeight:600, fontSize:15, marginBottom:6, color:'#374151' }}>No saved places yet</p>
          <p style={{ fontSize:13 }}>Click Save on any card to add it here</p>
        </div>
      ) : saved.map(h => (
        <div key={h.id} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:16, marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{h.DiagnosticCentreName}</p>
              <p style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>{h.DiagnosticCentreAddress}</p>
              <p style={{ fontSize:12, color:'#2563eb', fontWeight:600 }}>{fmtDist(h.distance_km)} — {h['Rating (out of 5)']} / 5</p>
            </div>
            <button onClick={() => onRemove(h.id)} style={{ background:'none', border:'none', fontSize:13, cursor:'pointer', color:'#dc2626', marginLeft:8, fontWeight:700, fontFamily:'inherit' }}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ─── Hospital Card ─────────────────────────────────────────────────────── */
const HospitalCard = ({ item, index, selected, onSelect, savedIds, onSave }) => {
  const isBest  = index === 0;
  const busy    = BUSY_CFG[item.busy_status?.status] || BUSY_CFG.quiet;
  const openClr = OPEN_CFG[item.open_status?.color]  || OPEN_CFG.gray;
  const isSaved = savedIds?.has(item.id);
  const score   = Math.round((item.ai_recommendation_score ?? 0) * 100);
  const rating  = item['Rating (out of 5)'] ?? 0;
  const reviews = item['Number of Reviews'] ?? 0;
  const initials = (item.DiagnosticCentreName || 'MC').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarBgs = ['#dbeafe','#dcfce7','#fef3c7','#fce7f3','#ede9fe'];
  const avatarBg  = avatarBgs[item.id % avatarBgs.length];

  return (
    <div className="fade-up" style={{ animationDelay:`${index * 40}ms` }}>
      <div
        className={`hospital-card ${isBest ? 'best-accent' : ''}`}
        style={{ border: selected ? '1.5px solid #2563eb' : '1px solid #e5e7eb', marginBottom:12, transition:'box-shadow 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(11,18,32,0.09)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
      >
        <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
          <div style={{ width:64, height:64, borderRadius:14, background:avatarBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20, fontWeight:800, color:'#374151', border:'1px solid rgba(0,0,0,0.06)' }}>
            {initials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:5 }}>
              {isBest && <span style={{ fontSize:10, fontWeight:800, background:'#eff6ff', color:'#2563eb', padding:'2px 8px', borderRadius:99, letterSpacing:'0.04em' }}>Best Match</span>}
              {item.verified && <span style={{ fontSize:10, fontWeight:800, background:'#f0fdf4', color:'#15803d', padding:'2px 8px', borderRadius:99 }}>VERIFIED</span>}
              <span style={{ fontSize:11, fontWeight:700, background: openClr.bg, color: openClr.text, padding:'2px 8px', borderRadius:99 }}>
                {item.open_status?.label ?? 'Hours Unknown'}
              </span>
            </div>
            <h3 className="hospital-name" style={{ marginBottom:3 }}>{item.DiagnosticCentreName}</h3>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:8 }}>
              {item.amenity_type ? item.amenity_type.charAt(0).toUpperCase() + item.amenity_type.slice(1) : 'Medical Center'}
              {item.DiagnosticCentreAddress && item.DiagnosticCentreAddress !== 'Nearby' ? ` — ${item.DiagnosticCentreAddress}` : ''}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#111827' }}>
                <span style={{ color:'#f59e0b' }}>★</span> {rating}
                <span style={{ fontSize:12, color:'#9ca3af', fontWeight:400 }}> ({reviews})</span>
              </span>
              <span style={{ width:1, height:14, background:'#e5e7eb' }} />
              <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{fmtDist(item.distance_km)}</span>
              <span style={{ width:1, height:14, background:'#e5e7eb' }} />
              <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{item.eta} away</span>
              <span style={{ width:1, height:14, background:'#e5e7eb' }} />
              <span style={{ fontSize:13, fontWeight:700, color:'#2563eb' }}>AI {score}%</span>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
            <button onClick={() => onSave?.(item)}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:700, color: isSaved ? '#dc2626' : '#9ca3af', fontFamily:'inherit' }}>
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button onClick={() => onSelect?.(item)}
              style={{ fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:8, cursor:'pointer', border: selected ? '1.5px solid #2563eb' : '1.5px solid #e5e7eb', background: selected ? '#eff6ff' : '#fff', color: selected ? '#1d4ed8' : '#6b7280', fontFamily:'inherit', transition:'all 0.15s' }}>
              {selected ? 'Selected' : 'Compare'}
            </button>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                {item.facility_tags?.slice(0, 3).map((t, i) => (
              <span key={i} className="specialty-chip">{t.label}</span>
            ))}
          </div>
            
          </div>

          {/* Contact Details Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {item.phone && item.phone !== 'N/A' ? (
              <a
                href={`tel:${item.phone}`}
                onClick={() => logHospitalClick(item.id)}
                title="Call hospital"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 99,
                  background: '#eff6ff',
                  color: '#2563eb',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Call {item.phone}
              </a>
            ) : null}

            {item.website && item.website !== 'N/A' && item.website !== '#' ? (
              <a
                href={item.website}
                target="_blank"
                rel="noreferrer"
                onClick={() => logHospitalClick(item.id)}
                title="Visit website"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 99,
                  background: '#f0fdf4',
                  color: '#111827',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Website
              </a>
            ) : null}
          </div>

          {/* Opening Hours */}
        {/* Opening Hours */}
        {item.opening_hours && Array.isArray(item.opening_hours) && item.opening_hours.length > 0 && (
          <div style={{ background:'#f9fafb', borderRadius:8, padding:'10px 12px', marginTop:12, fontSize:12, color:'#6b7280' }}>
            <p style={{ fontWeight:700, marginBottom:4, color:'#374151' }}>Hours:</p>
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {item.opening_hours.slice(0, 2).map((hour, i) => (
                <div key={i} style={{ fontSize:11, color:'#6b7280' }}>{hour}</div>
              ))}
              {item.opening_hours.length > 2 && (
                <div style={{ fontSize:11, color:'#9ca3af', fontStyle:'italic' }}>+{item.opening_hours.length - 2} more...</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ height:1, background:'#f3f4f6', margin:'16px 0' }} />

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', gap:8 }}>
          <a href={item.ride_links?.google_maps} target="_blank" rel="noreferrer"
            style={{ fontSize:13, fontWeight:700, padding:'9px 18px', borderRadius:9, background:'#2563eb', color:'#fff', textDecoration:'none', whiteSpace:'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background='#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.background='#2563eb'}>
            Get Directions
          </a>
          <a href={item.ride_links?.uber}
            style={{ fontSize:13, fontWeight:700, padding:'9px 16px', borderRadius:9, background:'#f9fafb', color:'#111827', textDecoration:'none', border:'1px solid #e5e7eb' }}
            onMouseEnter={e => e.currentTarget.style.background='#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background='#f9fafb'}>
            Uber
          </a>
          <a href={item.ride_links?.ola}
            style={{ fontSize:13, fontWeight:700, padding:'9px 16px', borderRadius:9, background:'#f0fdf4', color:'#15803d', textDecoration:'none', border:'1px solid #bbf7d0' }}
            onMouseEnter={e => e.currentTarget.style.background='#dcfce7'}
            onMouseLeave={e => e.currentTarget.style.background='#f0fdf4'}>
            Ola
          </a>
        </div>
      </div>
    </div>
  );
};

/* ─── HOME SCREEN ───────────────────────────────────────────────────────── */
export default function HomeScreen() {
  const [searchMode, setSearchMode] = useState('symptoms');
  const [query, setQuery]           = useState('');
  const [hospitals, setHospitals]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosData, setSosData]       = useState(null);
  const [specHint, setSpecHint]     = useState(null);
  const [corrected, setCorrected]   = useState('');
  const [totalResults, setTotal]    = useState(0);
  const [sortBy, setSortBy]         = useState('ai');
  const [filterOpen, setFilterOpen] = useState(false);
  const [compareList, setCompare]   = useState([]);
  const [showCompare, setShowCmp]   = useState(false);
  const [showSaved, setShowSaved]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved]           = useState(() => {
    try { return getFavorites(); } catch { return []; }
  });

  const savedIds = new Set(saved.map(s => s.id));

  useEffect(() => {
    try { localStorage.setItem('mc_saved', JSON.stringify(saved)); } catch {}
  }, [saved]);

  useEffect(() => { doSearch('', 'symptoms'); }, []);

  const getPos = () => new Promise((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
  );

  const doSearch = useCallback(async (overrideQuery, overrideMode) => {
    setLoading(true);
    try {
      if (!isOnline()) {
        alert('No internet connection. Retrying...');
        return;
      }
      
      const pos  = await getPos();
      const q    = overrideQuery  !== undefined ? overrideQuery  : query;
      const mode = overrideMode   !== undefined ? overrideMode   : searchMode;
      
      // Log analytics
      logSearch(q || 'default', mode);
      
      // Add to search history
      if (q && q.trim()) {
        addSearchToHistory(q);
      }
      
      // Fetch with retry
      const data = await retryWithBackoff(
        () => fetchHospitals(pos.coords.latitude, pos.coords.longitude, q, mode),
        3
      );
      
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setHospitals(list);
      setTotal(data.total_results ?? list.length);
      setSpecHint(data.specialty_hint ?? null);
      setCorrected(data.query_corrected ?? '');
    } catch (err) { 
      alert(getErrorMessage(err) || 'Please enable location.');
    }
    finally { setLoading(false); }
  }, [query, searchMode]);

  const doSOS = async () => {
    setSosLoading(true);
    try {
      const pos  = await getPos();
      const data = await retryWithBackoff(
        () => fetchSOS(pos.coords.latitude, pos.coords.longitude),
        3
      );
      logSearch('SOS', 'emergency');
      setSosData(data);
    } catch (err) { 
      alert(getErrorMessage(err) || 'SOS failed. Check connection.');
    }
    finally { setSosLoading(false); }
  };

  const handleSuggestion = (s) => {
    setQuery(s);
    doSearch(s, searchMode);
  };

  const handleModeSwitch = (mode) => {
    setSearchMode(mode);
    setQuery('');
    setHospitals([]);
    setTotal(0);
    setSpecHint(null);
    setCorrected('');
  };

  const toggleSave = (item) => {
    if (saved.some(s => s.id === item.id)) {
      removeFavorite(item.id);
      logFavoriteAction(item.id, 'removed');
      setSaved(p => p.filter(s => s.id !== item.id));
    } else {
      addFavorite(item);
      logFavoriteAction(item.id, 'added');
      setSaved(p => [...p, item]);
    }
  };
  const toggleCompare = item => setCompare(p => {
    if (p.some(c => c.id === item.id)) return p.filter(c => c.id !== item.id);
    return p.length >= 2 ? [p[1], item] : [...p, item];
  });

  const displayed = [...hospitals]
    .filter(h => !filterOpen || h.open_status?.is_open === true)
    .sort((a, b) => {
      if (sortBy === 'distance') return a.distance_km - b.distance_km;
      if (sortBy === 'rating')   return b['Rating (out of 5)'] - a['Rating (out of 5)'];
      return b.ai_recommendation_score - a.ai_recommendation_score;
    });

  const suggestions  = searchMode === 'symptoms' ? SYMPTOM_SUGGESTIONS : HOSPITAL_SUGGESTIONS;
  const placeholder  = searchMode === 'symptoms'
    ? 'Search by symptom or service (e.g. fever, MRI, dental)...'
    : 'Search by hospital name (e.g. Apollo, KIMS, Yashoda)...';

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7fa', fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
      <Fonts />

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:960, margin:'0 auto', padding:'0 24px' }}>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0 12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ color:'#fff', fontSize:15, fontWeight:800 }}>T</span>
              </div>
              <div>
                <p style={{ fontWeight:800, fontSize:20, color:'#111827', lineHeight:1 }}>TriageGo</p>
                <p style={{ fontSize:11, color:'#9ca3af', fontWeight:500 }}>AI-Ranked Medical Centers</p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={() => setShowSaved(true)}
                style={{ position:'relative', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:9, padding:'7px 16px', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700, color:'#374151' }}>
                Saved Places
                {saved.length > 0 && (
                  <span style={{ position:'absolute', top:-6, right:-6, background:'#dc2626', color:'#fff', fontSize:9, fontWeight:800, width:17, height:17, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {saved.length}
                  </span>
                )}
              </button>
              
              {/* Hamburger Menu */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(!menuOpen)}
                  style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:9, padding:'8px 12px', cursor:'pointer', fontFamily:'inherit', fontSize:18, color:'#374151', display:'flex', alignItems:'center', justifyContent:'center', width:40, height:40 }}>
                  ≡
                </button>
                
                {/* Dropdown Menu */}
                {menuOpen && (
                  <div onClick={() => setMenuOpen(false)} style={{ position:'fixed', inset:0, zIndex:9997 }} />
                )}
                {menuOpen && (
                  <div onClick={(e) => e.stopPropagation()} style={{ position:'absolute', top:'100%', right:0, marginTop:4, background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', minWidth:200, zIndex:9998, overflow:'hidden' }}>
                    <button onClick={() => { setShowSettings(true); setMenuOpen(false); }}
                      style={{ width:'100%', textAlign:'left', padding:'12px 16px', background:'none', border:'none', fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer', fontFamily:'inherit', borderBottom:'1px solid #f3f4f6', transition:'background 0.2s', display:'flex', alignItems:'center', gap:8 }}>
                      Settings & Profile
                    </button>
                    <button onClick={() => { logFavoriteAction('view_favorites'); setShowSaved(true); setMenuOpen(false); }}
                      style={{ width:'100%', textAlign:'left', padding:'12px 16px', background:'none', border:'none', fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer', fontFamily:'inherit', borderBottom:'1px solid #f3f4f6', transition:'background 0.2s', display:'flex', alignItems:'center', gap:8 }}>
                      My Favorites
                    </button>
                    <button onClick={() => { setShowAbout(true); setMenuOpen(false); }}
                      style={{ width:'100%', textAlign:'left', padding:'12px 16px', background:'none', border:'none', fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer', fontFamily:'inherit', borderBottom:'1px solid #f3f4f6', transition:'background 0.2s', display:'flex', alignItems:'center', gap:8 }}>
                      About App
                    </button>
                    <button onClick={() => { setMenuOpen(false); }}
                      style={{ width:'100%', textAlign:'left', padding:'12px 16px', background:'none', border:'none', fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer', fontFamily:'inherit', borderBottom:'1px solid #f3f4f6', transition:'background 0.2s', display:'flex', alignItems:'center', gap:8 }}>
                      Support
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mode tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid #e5e7eb' }}>
            {[['symptoms','Search by Symptoms / Services'], ['hospitals','Search by Hospital Name']].map(([mode, label]) => (
              <button key={mode} onClick={() => handleModeSwitch(mode)}
                style={{ fontSize:13, fontWeight:700, padding:'10px 20px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', color: searchMode===mode ? '#2563eb' : '#6b7280', borderBottom: searchMode===mode ? '2px solid #2563eb' : '2px solid transparent', marginBottom:-1, transition:'color 0.15s' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="hero-search" style={{ display:'flex', gap:10, paddingTop:14, paddingBottom:12 }}>
            <div style={{ flex:1, position:'relative' }}>
              <input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                onFocus={e => { e.target.style.borderColor='#2563eb'; e.target.style.boxShadow='0 0 0 6px rgba(15,118,110,0.06)'; }}
                onBlur={e  => { e.target.style.borderColor='#e5e7eb';  e.target.style.boxShadow='none'; }}
                style={{ width:'100%', padding:'11px 40px 11px 16px', border:'1.5px solid #e5e7eb', borderRadius:12, fontSize:14, outline:'none', fontFamily:'inherit', color:'#111827', background:'#fff', transition:'border-color 0.15s, box-shadow 0.15s' }}
              />
              {query && (
                <button onClick={() => setQuery('')}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#9ca3af', lineHeight:1 }}>
                  ×
                </button>
              )}
            </div>
            <button onClick={() => doSearch()}
              style={{ padding:'11px 28px', borderRadius:10, background:'#2563eb', color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s', whiteSpace:'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.background='#1d4ed8'}
              onMouseLeave={e => e.currentTarget.style.background='#2563eb'}>
              Search
            </button>
          </div>

          {/* Quick suggestions (specialty chips) */}
          <div className="specialty-chips" style={{ paddingBottom:14, display:'flex', gap:8, flexWrap:'wrap' }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => handleSuggestion(s)}
                className={query===s ? 'chip chip--active' : 'chip'}
                style={{ whiteSpace:'nowrap', cursor:'pointer', padding:'6px 12px', borderRadius:999, border:'1px solid #e5e7eb', background: query===s ? '#111827' : '#fff', color: query===s ? '#fff' : '#374151', fontWeight:700 }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth:960, margin:'0 auto', padding:'20px 24px' }}>

        {specHint && (
          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 16px', marginBottom:12 }}>
            <p style={{ fontSize:13, color:'#1d4ed8', fontWeight:600 }}>Looking for a <strong>{specHint}</strong>? Results filtered accordingly.</p>
          </div>
        )}
        {corrected && corrected !== query && query && searchMode === 'symptoms' && (
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'8px 16px', marginBottom:12 }}>
            <p style={{ fontSize:13, color:'#92400e', fontWeight:600 }}>Showing results for: <strong>{corrected}</strong></p>
          </div>
        )}

        {/* Toolbar */}
        {(hospitals.length > 0 || loading) && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
            <p style={{ fontSize:14, color:'#374151', fontWeight:600 }}>
              {loading ? 'Searching...' : <><strong style={{ color:'#111827' }}>{totalResults}</strong> hospitals found near you</>}
            </p>
            <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:'#9ca3af', fontWeight:600, marginRight:2 }}>Sort:</span>
              {[['ai','AI Score'], ['distance','Nearest'], ['rating','Rating']].map(([k, label]) => (
                <button key={k} onClick={() => setSortBy(k)}
                  style={{ fontSize:12, fontWeight:700, padding:'6px 14px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', border: sortBy===k ? 'none' : '1px solid #e5e7eb', background: sortBy===k ? '#111827' : '#fff', color: sortBy===k ? '#fff' : '#374151', transition:'all 0.15s' }}>
                  {label}
                </button>
              ))}
              <button onClick={() => setFilterOpen(p => !p)}
                style={{ fontSize:12, fontWeight:700, padding:'6px 14px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', border: filterOpen ? 'none' : '1px solid #e5e7eb', background: filterOpen ? '#16a34a' : '#fff', color: filterOpen ? '#fff' : '#374151', transition:'all 0.15s' }}>
                Open Now
              </button>
            </div>
          </div>
        )}

        {/* Compare bar */}
        {compareList.length > 0 && (
          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:12, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <p style={{ fontSize:13, fontWeight:700, color:'#1d4ed8' }}>
              {compareList.length === 1 ? 'Select one more hospital to compare' : `${compareList[0].DiagnosticCentreName} vs ${compareList[1].DiagnosticCentreName}`}
            </p>
            <div style={{ display:'flex', gap:8 }}>
              {compareList.length === 2 && (
                <button onClick={() => setShowCmp(true)}
                  style={{ fontSize:12, fontWeight:800, padding:'7px 16px', borderRadius:8, background:'#1d4ed8', color:'#fff', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                  Compare Now
                </button>
              )}
              <button onClick={() => setCompare([])}
                style={{ fontSize:12, fontWeight:700, padding:'7px 12px', borderRadius:8, background:'none', color:'#6b7280', border:'1px solid #e5e7eb', cursor:'pointer', fontFamily:'inherit' }}>
                Clear
              </button>
            </div>
          </div>
        )}

        {loading && [1, 2, 3].map(i => <SkeletonCard key={i} />)}

        {!loading && hospitals.length === 0 && (
          <div style={{ textAlign:'center', padding:'64px 0', color:'#9ca3af' }}>
            <div style={{ width:72, height:72, borderRadius:20, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:26, fontWeight:800, color:'#d1d5db' }}>H</div>
            <p style={{ fontWeight:700, fontSize:18, color:'#374151', marginBottom:8 }}>
              {searchMode === 'symptoms' ? 'Search by symptom or service' : 'Search for a hospital by name'}
            </p>
            <p style={{ fontSize:14, maxWidth:360, margin:'0 auto', lineHeight:1.6 }}>
              {searchMode === 'symptoms'
                ? 'Type a symptom like fever, or a service like MRI or blood test'
                : 'Type the full or partial name of a hospital — e.g. Yashoda, Apollo, KIMS'}
            </p>
          </div>
        )}

        {!loading && displayed.length === 0 && hospitals.length > 0 && (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <p style={{ fontSize:16, color:'#374151', fontWeight:600, marginBottom:8 }}>No open centers found right now.</p>
            <button onClick={() => setFilterOpen(false)}
              style={{ fontSize:13, fontWeight:700, color:'#2563eb', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
              Show all results
            </button>
          </div>
        )}

        {!loading && displayed.map((item, i) => (
          <HospitalCard key={item.id} item={item} index={i}
            selected={compareList.some(c => c.id === item.id)}
            onSelect={toggleCompare}
            savedIds={savedIds}
            onSave={toggleSave}
          />
        ))}
      </div>

      {/* SOS */}
      <button onClick={doSOS} disabled={sosLoading}
        style={{ position:'fixed', bottom:28, right:28, zIndex:999, background:'#dc2626', color:'#fff', fontWeight:800, fontSize:14, padding:'14px 24px', borderRadius:14, border:'none', cursor:'pointer', boxShadow:'0 8px 32px rgba(220,38,38,0.4)', display:'flex', alignItems:'center', gap:8, transition:'background 0.15s', fontFamily:'inherit' }}
        onMouseEnter={e => e.currentTarget.style.background='#b91c1c'}
        onMouseLeave={e => e.currentTarget.style.background='#dc2626'}>
        {sosLoading
          ? <span style={{ width:16, height:16, border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />
          : <span style={{ width:8, height:8, borderRadius:'50%', background:'rgba(255,255,255,0.7)', display:'inline-block' }} />}
        SOS Emergency
      </button>

      {sosData     && <SOSModal     data={sosData}  onClose={() => setSosData(null)} />}
      {showCompare && compareList.length === 2 && <CompareModal items={compareList} onClose={() => setShowCmp(false)} />}
      {showSaved   && <SavedDrawer  saved={saved}   onClose={() => setShowSaved(false)} onRemove={id => setSaved(p => p.filter(s => s.id !== id))} />}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <AboutAppModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}