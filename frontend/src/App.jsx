import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Settings, Sprout, Sun, Moon,
  Thermometer, Droplet, Wind, Lightbulb,
  ChevronRight, Info, LogOut, CloudOff,
  Wifi, Power, MessageSquare, ClipboardList, Microscope,
  BarChart2, Send, CheckCircle2, XCircle,
  RefreshCw, Bell, ExternalLink, AlertTriangle,
  Search, Globe, Leaf
} from 'lucide-react';
import SensorCharts from './components/SensorCharts';
import GrowthStage from './components/GrowthStage';
import TaskList from './components/TaskList';
import Diagnostics from './components/Diagnostics';
import ChatDrawer from './components/ChatDrawer';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function App() {
  // ── Navigation ──
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode]   = useState(false);

  // ── Backend connection ──
  const [backendConnected, setBackendConnected] = useState(false);

  // ── Auth ──
  const [loggedInUser, setLoggedInUser]     = useState(() => { try { const s = localStorage.getItem('zentra_user_profile'); return s ? JSON.parse(s) : null; } catch { return null; } });
  const [loggedInEmail, setLoggedInEmail]   = useState(() => { try { const s = localStorage.getItem('zentra_user_profile'); if (s) return JSON.parse(s).email || ''; } catch {} return localStorage.getItem('zentra_user_email') || ''; });
  const [authMode, setAuthMode]             = useState('login');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword]   = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail]       = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupSecondName, setSignupSecondName] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  // ── Global state from /api/status ──
  const [data, setData] = useState({
    current_plant: 'Strawberry',
    growth_stage: 'Fruiting',
    age_days: 45,
    sensors: { temperature: 24, humidity: 50, light: 220, soil_moisture: 42 },
    targets: { min_temp: 16, max_temp: 23, min_humidity: 50, max_humidity: 60, min_light: 600, max_light: 1000, min_soil_moisture: 50, max_soil_moisture: 60 },
    actuators: { pump: false, fan: false, grow_lights: false },
    sensor_history: [],
    chat_history: [],
    alerts_history: [],
    diagnostics_history: [],
    tasks: [],
    active_model: 'gemma3:1b',
    agent_bindings: {},
    models: {},
    search_enabled: true,
    esp8266: { photoresistor: 0, led1: false, led2: false, led3: false, last_seen: null }
  });

  // ── Sensor sim inputs ──
  const [simInputs, setSimInputs] = useState({ temperature: 24, humidity: 50, light: 220, soil_moisture: 42 });
  const [simSending, setSimSending] = useState(false);
  const [simResult, setSimResult]   = useState(null);

  // ── Plant selector ──
  const PLANTS  = ['Strawberry', 'Tomato', 'Lettuce', 'Orchid', 'Basil'];
  const STAGES  = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting'];
  const [selPlant, setSelPlant]  = useState('Strawberry');
  const [selStage, setSelStage]  = useState('Fruiting');
  const [selAge, setSelAge]      = useState(45);
  const [plantSaving, setPlantSaving] = useState(false);

  // ── Web search ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setBackendConnected(true);
        if (d.sensors) setSimInputs({ temperature: d.sensors.temperature, humidity: d.sensors.humidity, light: d.sensors.light, soil_moisture: d.sensors.soil_moisture });
        setSelPlant(d.current_plant);
        setSelStage(d.growth_stage);
        setSelAge(d.age_days);
      }
    } catch { setBackendConnected(false); }
  };

  useEffect(() => { fetchStatus(); const t = setInterval(fetchStatus, 3000); return () => clearInterval(t); }, []);

  // ── Auth handlers ──
  const handleLogin = async (e) => {
    e.preventDefault();
    const ident = loginIdentifier.trim(), pass = loginPassword.trim();
    if (!ident || !pass) return alert('Enter identifier and password.');
    setAuthenticating(true);
    if (!backendConnected) {
      setTimeout(() => {
        const profile = { username: ident.split('@')[0], email: ident.includes('@') ? ident : `${ident}@zentra.com`, first_name: ident.charAt(0).toUpperCase() + ident.slice(1), second_name: 'User' };
        localStorage.setItem('zentra_user_profile', JSON.stringify(profile));
        localStorage.setItem('zentra_user_email', profile.email);
        setLoggedInUser(profile); setLoggedInEmail(profile.email); setAuthenticating(false);
      }, 600);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: ident, password: pass }) });
      if (res.ok) { const { user } = await res.json(); localStorage.setItem('zentra_user_profile', JSON.stringify(user)); localStorage.setItem('zentra_user_email', user.email); setLoggedInUser(user); setLoggedInEmail(user.email); }
      else alert((await res.json()).detail || 'Auth failed.');
    } catch { alert('Connection failed.'); }
    finally { setAuthenticating(false); }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const uname = signupUsername.trim(), emailVal = signupEmail.trim().toLowerCase(), pass = signupPassword.trim(), fname = signupFirstName.trim(), sname = signupSecondName.trim();
    if (!uname || !emailVal || !pass || !fname || !sname) return alert('Fill in all fields.');
    setAuthenticating(true);
    if (!backendConnected) {
      setTimeout(() => {
        const profile = { username: uname, email: emailVal, first_name: fname, second_name: sname };
        localStorage.setItem('zentra_user_profile', JSON.stringify(profile));
        localStorage.setItem('zentra_user_email', profile.email);
        setLoggedInUser(profile); setLoggedInEmail(profile.email); setAuthenticating(false);
      }, 600);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: uname, password: pass, email: emailVal, first_name: fname, second_name: sname }) });
      if (res.ok) { const { user } = await res.json(); localStorage.setItem('zentra_user_profile', JSON.stringify(user)); localStorage.setItem('zentra_user_email', user.email); setLoggedInUser(user); setLoggedInEmail(user.email); }
      else alert((await res.json()).detail || 'Registration failed.');
    } catch { alert('Connection failed.'); }
    finally { setAuthenticating(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('zentra_user_profile'); localStorage.removeItem('zentra_user_email');
    setLoggedInUser(null); setLoggedInEmail('');
  };

  const handleToggleActuator = async (device, state) => {
    setData(prev => ({ ...prev, actuators: { ...prev.actuators, [device]: state } }));
    if (!backendConnected) return;
    try { await fetch(`${API_BASE}/actuators/toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device, state }) }); fetchStatus(); } catch {}
  };

  const handleLedControl = async (led, state) => {
    const ledUpdate = led === 'all'
      ? { led1: state, led2: state, led3: state }
      : { [led]: state };
    setData(prev => ({ ...prev, esp8266: { ...prev.esp8266, ...ledUpdate } }));
    if (!backendConnected) return;
    try {
      await fetch(`${API_BASE}/esp8266/led`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ led, state }) });
      fetchStatus();
    } catch {}
  };

  const handleSimPush = async () => {
    setSimSending(true); setSimResult(null);
    if (!backendConnected) { setTimeout(() => { setSimSending(false); setSimResult({ ok: true, actions: [] }); }, 600); return; }
    try {
      const res = await fetch(`${API_BASE}/sensors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(simInputs) });
      if (res.ok) { const r = await res.json(); setSimResult({ ok: true, actions: r.triggered_actions || [] }); fetchStatus(); }
      else setSimResult({ ok: false, actions: [] });
    } catch { setSimResult({ ok: false, actions: [] }); }
    finally { setSimSending(false); }
  };

  const handlePlantApply = async () => {
    setPlantSaving(true);
    const payload = { plant_type: selPlant, growth_stage: selStage, age_days: selAge };
    setData(prev => ({ ...prev, current_plant: selPlant, growth_stage: selStage, age_days: selAge }));
    if (!backendConnected) { setTimeout(() => setPlantSaving(false), 500); return; }
    try { await fetch(`${API_BASE}/plant/select`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); fetchStatus(); }
    catch {} finally { setPlantSaving(false); }
  };

  const handleSendChatMessage = async (message, useSearch = false) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setData(prev => ({ ...prev, chat_history: [...prev.chat_history, { sender: 'User', message, timestamp }] }));
    if (!backendConnected) {
      setTimeout(() => { setData(prev => ({ ...prev, chat_history: [...prev.chat_history, { sender: 'Bot', message: 'Offline — backend not connected.', timestamp }] })); }, 500);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, use_search: useSearch }) });
      if (res.ok) fetchStatus();
    } catch {}
  };

  const handleDiagnoseLeaf = async (formData) => {
    if (!backendConnected) {
      const mock = {
        filename: 'leaf.png', file_size_kb: 450, diagnosis: 'Powdery Mildew Infection',
        status: 'Infected', category: 'Disease', severity: 'Medium', confidence: 94.2,
        symptoms: 'White powdery spots on leaf surface.',
        urgent_action: 'Reduce humidity and improve air circulation.',
        organic_treatment: 'Neem oil spray, potassium bicarbonate.',
        chemical_treatment: 'Sulfur-based fungicide.',
        prevention: 'Maintain spacing, avoid overhead watering.',
        affected_area_pct: 20, recovery_days: 10,
        timestamp: new Date().toLocaleDateString()
      };
      setData(prev => ({ ...prev, diagnostics_history: [mock, ...prev.diagnostics_history] }));
      return mock;
    }
    try {
      const res = await fetch(`${API_BASE}/diagnose`, { method: 'POST', body: formData });
      if (res.ok) { const r = await res.json(); fetchStatus(); return r; }
    } catch {}
  };

  const handleWebSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true); setSearchError(''); setSearchResults([]);
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}&max_results=5`);
      if (res.ok) {
        const r = await res.json();
        setSearchResults(r.results || []);
        if ((r.results || []).length === 0) setSearchError('No results found. Try a different query.');
      } else {
        const err = await res.json();
        setSearchError(err.detail || 'Search failed.');
      }
    } catch { setSearchError('Search unavailable. Ensure backend is running.'); }
    finally { setSearching(false); }
  };

  const sensors  = data.sensors  || { temperature: 24, humidity: 50, light: 220, soil_moisture: 42 };
  const esp8266  = data.esp8266  || { photoresistor: 0, led1: false, led2: false, led3: false, last_seen: null };

  // ── Helpers ──
  const isInRange = (val, min, max) => val >= min && val <= max;

  // ─────────────────────────────────────────────────
  // LOGIN / SIGNUP SCREEN
  // ─────────────────────────────────────────────────
  if (!loggedInEmail) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--color-bg-base)', padding: 24 }}>
        <div className="glass-card" style={{ padding: '36px 32px', width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: 'var(--shadow-premium)' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Leaf size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-title)', letterSpacing: '-0.02em' }}>Zentra Flora</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Greenhouse Dashboard</div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => setAuthMode(m)}
                style={{ flex: 1, paddingBottom: 10, border: 'none', borderBottom: authMode === m ? '2px solid var(--color-primary)' : '2px solid transparent', backgroundColor: 'transparent', fontSize: 13, cursor: 'pointer', color: authMode === m ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: authMode === m ? 600 : 400, fontFamily: 'inherit', marginBottom: -1 }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username or Email</label>
                <input type="text" placeholder="username or email" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} required className="zentra-input" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                <input type="password" placeholder="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="zentra-input" />
              </div>
              <button type="submit" disabled={authenticating} className="zentra-btn" style={{ marginTop: 4 }}>{authenticating ? 'Signing in…' : 'Sign In'}</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>First</label>
                  <input type="text" placeholder="First name" value={signupFirstName} onChange={e => setSignupFirstName(e.target.value)} required className="zentra-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last</label>
                  <input type="text" placeholder="Last name" value={signupSecondName} onChange={e => setSignupSecondName(e.target.value)} required className="zentra-input" />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
                <input type="text" placeholder="username" value={signupUsername} onChange={e => setSignupUsername(e.target.value)} required className="zentra-input" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input type="email" placeholder="email@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required className="zentra-input" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                <input type="password" placeholder="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required className="zentra-input" />
              </div>
              <button type="submit" disabled={authenticating} className="zentra-btn" style={{ marginTop: 4 }}>{authenticating ? 'Creating account…' : 'Create Account'}</button>
            </form>
          )}

          <div className="info-banner neutral" style={{ fontSize: 11 }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--color-text-muted)' }} />
            <span>Default credentials: <strong>admin</strong> / <strong>password123</strong></span>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  // SIDEBAR ITEMS
  // ─────────────────────────────────────────────────
  const sidebarItems = [
    { id: 'dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
    { id: 'sensors',     icon: BarChart2,        label: 'Sensors'     },
    { id: 'tasks',       icon: ClipboardList,    label: 'Tasks'       },
    { id: 'diagnostics', icon: Microscope,       label: 'Diagnostics' },
    { id: 'chat',        icon: MessageSquare,    label: 'Chat'        },
    { id: 'search',      icon: Globe,            label: 'Web Search'  },
    { id: 'telegram',    icon: Bell,             label: 'Telegram'    },
    { id: 'settings',    icon: Settings,         label: 'Settings'    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg-base)', fontFamily: 'var(--font-primary)' }}>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar-capsule">
        <div className="sidebar-logo">
          <Leaf size={18} color="#fff" />
        </div>

        <div className="sidebar-track">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} title={item.label} onClick={() => setActiveTab(item.id)}
                className={`sidebar-circle-btn ${active ? 'active' : ''}`}>
                <Icon size={18} />
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setDarkMode(!darkMode)} className="sidebar-circle-btn" title="Toggle theme">
            {darkMode ? <Sun size={17} color="var(--amber-400)" /> : <Moon size={17} />}
          </button>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title={loggedInUser?.username || 'User'}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
              {(loggedInUser?.first_name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{ marginLeft: 64, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '18px 22px 24px' }}>

        {/* ══ DASHBOARD ══ */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-grid">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-title)', letterSpacing: '-0.02em' }}>Overview</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 10 }}>
                  {data.current_plant} · {data.growth_stage} · Day {data.age_days}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!backendConnected && <span className="status-badge offline"><CloudOff size={11} />Offline</span>}
                <span className={`status-badge ${backendConnected ? 'online' : 'offline'}`}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor', animation: backendConnected ? 'pulse-dot 2s infinite' : 'none' }} />
                  {backendConnected ? 'Live' : 'Sim'}
                </span>
              </div>
            </div>

            {/* ── Sensor quick stats row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[
                { label: 'Temperature', val: `${sensors.temperature}°C`, icon: <Thermometer size={14} />, ok: isInRange(sensors.temperature, data.targets.min_temp, data.targets.max_temp) },
                { label: 'Humidity',    val: `${sensors.humidity}%`,     icon: <Droplet size={14} />,    ok: isInRange(sensors.humidity,    data.targets.min_humidity, data.targets.max_humidity) },
                { label: 'Light',       val: `${sensors.light} lux`,     icon: <Lightbulb size={14} />,  ok: isInRange(sensors.light,       data.targets.min_light,    data.targets.max_light) },
                { label: 'Soil',        val: `${sensors.soil_moisture}%`,icon: <Droplet size={14} />,    ok: isInRange(sensors.soil_moisture, data.targets.min_soil_moisture, data.targets.max_soil_moisture) },
              ].map((s, i) => (
                <div key={i} className="zentra-card" style={{ gap: 8, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: s.ok ? 'var(--color-primary)' : 'var(--color-danger)' }}>{s.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: s.ok ? 'var(--color-success)' : 'var(--color-danger)', backgroundColor: s.ok ? 'var(--color-success-light)' : 'var(--color-danger-light)', padding: '2px 7px', borderRadius: 20 }}>
                      {s.ok ? 'OK' : 'OUT'}
                    </span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-title)', letterSpacing: '-0.02em' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Top row */}
            <div className="dashboard-row-top">
              {/* Greenhouse hero card — CSS gradient */}
              <div className="zentra-card" style={{ overflow: 'hidden', position: 'relative', minHeight: 220, padding: 0 }}>
                {/* Full green gradient background */}
                <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, background: 'linear-gradient(145deg, #1a2e0a 0%, #2d5016 40%, #4a7c20 100%)' }}>
                  {/* Subtle dot pattern */}
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                </div>
                {/* Top-left: Live badge */}
                <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5 }}>
                  <span style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 20, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse-dot 1.5s infinite' }} />
                    Live
                  </span>
                </div>
                {/* Top-right: Ollama badge */}
                <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 5 }}>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(6px)' }}>
                    {data.ollama_connected ? '🟢 Ollama Online' : '⚪ Ollama Offline'}
                  </span>
                </div>
                {/* Bottom: Plant name + sensor chips */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5, padding: '14px 16px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                    {data.current_plant}
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 400, marginLeft: 8 }}>{data.growth_stage} · Day {data.age_days}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {[
                      { label: '🌡', val: `${sensors.temperature}°C` },
                      { label: '💧', val: `${sensors.humidity}%` },
                      { label: '☀', val: `${sensors.light} lux` },
                      { label: '🪴', val: `${sensors.soil_moisture}%` },
                    ].map((s, i) => (
                      <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '4px 10px', display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span style={{ fontSize: 13 }}>{s.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Plant Expert panel */}
              <div className="zentra-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-title)' }}>Plant Expert</div>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-base)', padding: '2px 7px', borderRadius: 20, border: '1px solid var(--color-border)' }}>PlantExpertAgent</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {[
                    { label: 'Crop', val: selPlant, setter: setSelPlant, options: PLANTS },
                    { label: 'Stage', val: selStage, setter: setSelStage, options: STAGES },
                  ].map(f => (
                    <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                      <div className="zentra-select-container">
                        <select value={f.val} onChange={e => f.setter(e.target.value)} className="zentra-select">
                          {f.options.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Age (days)</label>
                    <div className="zentra-select-container">
                      <input type="number" min={1} value={selAge} onChange={e => setSelAge(parseInt(e.target.value) || 1)} className="zentra-select" style={{ border: 'none', background: 'transparent' }} />
                    </div>
                  </div>

                  {/* Targets */}
                  <div style={{ backgroundColor: 'var(--color-bg-base)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Targets</div>
                    {[
                      { label: 'Temp',     val: `${data.targets.min_temp}–${data.targets.max_temp}°C` },
                      { label: 'Humidity', val: `${data.targets.min_humidity}–${data.targets.max_humidity}%` },
                      { label: 'Light',    val: `${data.targets.min_light}–${data.targets.max_light} lux` },
                      { label: 'Soil',     val: `${data.targets.min_soil_moisture}–${data.targets.max_soil_moisture}%` },
                    ].map(t => (
                      <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-body)' }}>{t.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>{t.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handlePlantApply} disabled={plantSaving} className="zentra-btn">
                  {plantSaving ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <ChevronRight size={13} />}
                  {plantSaving ? 'Reconfiguring…' : 'Apply Configuration'}
                </button>
              </div>
            </div>

            {/* Bottom row */}
            <div className="dashboard-row-bottom">
              {/* IoT Push */}
              <div className="zentra-card hardware-glow-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-title)' }}>IoT Sensor Push</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>ESP32 · /api/sensors</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: backendConnected ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                    <Wifi size={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />{backendConnected ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'temperature', label: 'Temp °C',  icon: <Thermometer size={12} color="var(--color-primary)" /> },
                    { key: 'humidity',    label: 'Humidity %', icon: <Droplet size={12} color="var(--sky-400)" /> },
                    { key: 'light',       label: 'Light lux',  icon: <Lightbulb size={12} color="var(--amber-400)" /> },
                    { key: 'soil_moisture', label: 'Soil %',  icon: <Droplet size={12} color="var(--green-500)" /> },
                  ].map(f => (
                    <div key={f.key} style={{ backgroundColor: 'var(--color-bg-base)', borderRadius: 8, padding: '9px 11px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        {f.icon}<span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)' }}>{f.label}</span>
                      </div>
                      <input type="number" value={simInputs[f.key]}
                        onChange={e => setSimInputs(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                        style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 16, fontWeight: 700, color: 'var(--color-text-title)', outline: 'none' }} />
                    </div>
                  ))}
                </div>

                <button onClick={handleSimPush} disabled={simSending} className="zentra-btn">
                  {simSending ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
                  Push Readings
                </button>

                {simResult && (
                  <div className={`info-banner ${simResult.ok ? 'success' : 'danger'}`}>
                    {simResult.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span style={{ fontSize: 11 }}>
                      {simResult.ok
                        ? simResult.actions.length > 0
                          ? simResult.actions.map(a => `${a.device} ${a.action}`).join(' · ')
                          : 'Accepted — all values in range.'
                        : 'Failed to push readings.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Actuator Control */}
              <div className="zentra-card hardware-glow-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-title)' }}>Actuators</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>Manual override · ActuatorControlAgent</div>
                  </div>
                  <Power size={15} color={Object.values(data.actuators).some(Boolean) ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                </div>

                {[
                  { key: 'pump',        label: 'Water Pump',      sub: 'Soil moisture',   icon: <Droplet size={16} /> },
                  { key: 'fan',         label: 'Ventilation Fan', sub: 'Temp & humidity', icon: <Wind size={16} /> },
                  { key: 'grow_lights', label: 'Grow Lights',     sub: 'Light intensity', icon: <Sun size={16} /> },
                ].map(act => {
                  const on = data.actuators[act.key];
                  return (
                    <div key={act.key} className={`actuator-row-interactive ${on ? 'active' : ''}`}
                      onClick={() => handleToggleActuator(act.key, !on)}>
                      <div className="actuator-icon-circle">{act.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-title)' }}>{act.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{act.sub}</div>
                      </div>
                      <div style={{ width: 34, height: 19, borderRadius: 20, backgroundColor: on ? 'var(--color-primary)' : 'var(--color-border)', padding: 2, display: 'flex', alignItems: 'center', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ width: 15, height: 15, borderRadius: '50%', backgroundColor: '#fff', transform: on ? 'translateX(15px)' : 'translateX(0)', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                      </div>
                    </div>
                  );
                })}

                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  Auto-controlled by ActuatorControlAgent on sensor push
                </div>
              </div>

              {/* Alerts */}
              <div className="zentra-card hardware-glow-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-title)' }}>Notifications</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>Telegram + Email</div>
                  </div>
                  <a href="https://t.me/melmalebot" target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', backgroundColor: 'var(--color-primary-light)', padding: '3px 9px', borderRadius: 20, border: '1px solid var(--color-primary-medium)' }}>
                    Telegram →
                  </a>
                </div>

                <div className="info-banner success" style={{ fontSize: 11 }}>
                  <CheckCircle2 size={12} />
                  <span>Remote control via <strong>@melmalebot</strong> — send /status, /pump_on, or a leaf photo.</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Recent ({data.alerts_history.length})
                  </div>
                  {data.alerts_history.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0' }}>No alerts — all parameters stable</div>
                  ) : (
                    data.alerts_history.slice(0, 4).map((alert, i) => (
                      <div key={i} className="info-banner warning" style={{ marginBottom: 6, fontSize: 11 }}>
                        <AlertTriangle size={11} style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{alert.subject}</div>
                          <div style={{ opacity: 0.7, marginTop: 1 }}>{alert.timestamp}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── ESP8266 Hardware Section ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Wifi size={14} color="var(--color-text-muted)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ESP8266 Hardware Node</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, border: '1px solid var(--color-border)',
                  color: esp8266.last_seen ? 'var(--color-success)' : 'var(--color-text-muted)',
                  backgroundColor: esp8266.last_seen ? 'var(--color-success-light)' : 'var(--color-bg-base)' }}>
                  {esp8266.last_seen ? 'Connected' : 'No Signal'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

                {/* Photoresistor card */}
                <div className="zentra-card hardware-glow-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-title)' }}>Photoresistor</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>A0 · Real-time ADC reading</div>
                    </div>
                    <Sun size={18} color="var(--amber-400)" />
                  </div>

                  <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
                    <div style={{ fontSize: 38, fontWeight: 800, color: 'var(--color-text-title)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {esp8266.photoresistor}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>/ 1023 raw ADC</div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 5 }}>
                      <span>Dark</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {Math.round(esp8266.photoresistor / 1023 * 100)}% light
                      </span>
                      <span>Bright</span>
                    </div>
                    <div style={{ height: 8, backgroundColor: 'var(--color-bg-base)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round(esp8266.photoresistor / 1023 * 100)}%`,
                        background: 'linear-gradient(90deg, #166534, #4ade80)',
                        borderRadius: 4,
                        transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>

                  {esp8266.last_seen ? (
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right' }}>
                      Last push: {esp8266.last_seen}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                      Waiting for ESP8266 push…
                    </div>
                  )}
                </div>

                {/* LED Control card */}
                <div className="zentra-card hardware-glow-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-title)' }}>LED Control</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>D1 · D2 · D3 GPIO pins</div>
                    </div>
                    <Lightbulb size={18} color={[esp8266.led1, esp8266.led2, esp8266.led3].some(Boolean) ? 'var(--amber-400)' : 'var(--color-text-muted)'} />
                  </div>

                  {[
                    { key: 'led1', label: 'LED D1', sub: 'GPIO5 (D1)' },
                    { key: 'led2', label: 'LED D2', sub: 'GPIO4 (D2)' },
                    { key: 'led3', label: 'LED D3', sub: 'GPIO0 (D3)' },
                  ].map(led => {
                    const on = esp8266[led.key];
                    return (
                      <div key={led.key}
                        className={`actuator-row-interactive ${on ? 'active' : ''}`}
                        onClick={() => handleLedControl(led.key, !on)}>
                        <div className="actuator-icon-circle">
                          <div style={{
                            width: 10, height: 10, borderRadius: '50%',
                            backgroundColor: on ? 'var(--amber-400)' : 'var(--color-border)',
                            transition: 'background 0.2s, box-shadow 0.2s',
                            boxShadow: on ? '0 0 7px var(--amber-400)' : 'none'
                          }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-title)' }}>{led.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{led.sub}</div>
                        </div>
                        <div style={{ width: 34, height: 19, borderRadius: 20, backgroundColor: on ? 'var(--color-primary)' : 'var(--color-border)', padding: 2, display: 'flex', alignItems: 'center', transition: 'background 0.2s', flexShrink: 0 }}>
                          <div style={{ width: 15, height: 15, borderRadius: '50%', backgroundColor: '#fff', transform: on ? 'translateX(15px)' : 'translateX(0)', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleLedControl('all', true)} className="zentra-btn" style={{ flex: 1, fontSize: 12, padding: '8px 12px' }}>
                      <Lightbulb size={12} /> All ON
                    </button>
                    <button onClick={() => handleLedControl('all', false)} className="zentra-btn-secondary" style={{ flex: 1, fontSize: 12, padding: '8px 12px' }}>
                      All OFF
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ══ SENSORS ══ */}
        {activeTab === 'sensors' && (
          <div className="page-shell">
            <div>
              <h2 className="page-title">Sensor Telemetry</h2>
              <p className="page-subtitle">Real-time sensor data and plant configuration</p>
            </div>
            {!backendConnected && <div className="info-banner warning"><CloudOff size={13} />Offline mode — using simulated data</div>}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 500px' }}><SensorCharts history={data.sensor_history} /></div>
              <div style={{ flex: '1 1 300px' }}>
                <GrowthStage currentPlant={data.current_plant} growthStage={data.growth_stage} ageDays={data.age_days} sensors={data.sensors} targets={data.targets}
                  onSelectPlant={async (payload) => {
                    setData(prev => ({ ...prev, current_plant: payload.plant_type, growth_stage: payload.growth_stage, age_days: payload.age_days }));
                    if (!backendConnected) return;
                    try { await fetch(`${API_BASE}/plant/select`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); fetchStatus(); } catch {}
                  }} />
              </div>
            </div>
          </div>
        )}

        {/* ══ TASKS ══ */}
        {activeTab === 'tasks' && (
          <div className="page-shell">
            <div>
              <h2 className="page-title">Task Schedule</h2>
              <p className="page-subtitle">Daily tasks by <strong>TaskSchedulerAgent</strong> (llama3.2:1b) for {data.current_plant} · {data.growth_stage} · Day {data.age_days}</p>
            </div>
            {!backendConnected && <div className="info-banner warning"><CloudOff size={13} />Offline mode</div>}
            <TaskList tasks={data.tasks} currentPlant={data.current_plant} stage={data.growth_stage} ageDays={data.age_days} />
          </div>
        )}

        {/* ══ DIAGNOSTICS ══ */}
        {activeTab === 'diagnostics' && (
          <div className="page-shell">
            <div>
              <h2 className="page-title">Plant Health Diagnostics</h2>
              <p className="page-subtitle">Upload a leaf photo — <strong>qwen3-vl:4b</strong> will analyze for disease, pests, nutrient deficiency, and abiotic stress.</p>
            </div>
            {!backendConnected && <div className="info-banner warning"><CloudOff size={13} />Offline — using simulated diagnosis</div>}
            <Diagnostics onDiagnose={handleDiagnoseLeaf} history={data.diagnostics_history} />
          </div>
        )}

        {/* ══ CHAT ══ */}
        {activeTab === 'chat' && (
          <div className="page-shell">
            <div>
              <h2 className="page-title">System Chat</h2>
              <p className="page-subtitle">AI greenhouse assistant powered by <strong>gemma3:1b</strong>. Enable web search to fetch real-time plant care info.</p>
            </div>
            {!backendConnected && <div className="info-banner warning"><CloudOff size={13} />Offline — responses are simulated</div>}
            <ChatDrawer chatHistory={data.chat_history} onSendChatMessage={handleSendChatMessage} searchEnabled={data.search_enabled} />
          </div>
        )}

        {/* ══ WEB SEARCH ══ */}
        {activeTab === 'search' && (
          <div className="page-shell">
            <div>
              <h2 className="page-title">Web Search</h2>
              <p className="page-subtitle">Search the web for agricultural info, plant care guides, and treatment methods.</p>
            </div>

            {/* Search bar */}
            <div className="zentra-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    placeholder="e.g. tomato blight treatment, powdery mildew organic cure..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleWebSearch()}
                    className="zentra-input"
                    style={{ paddingLeft: 36 }}
                  />
                </div>
                <button onClick={handleWebSearch} disabled={searching || !backendConnected} className="zentra-btn" style={{ width: 100, flexShrink: 0 }}>
                  {searching ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={13} />}
                  {searching ? 'Searching' : 'Search'}
                </button>
              </div>
              {!backendConnected && (
                <div className="info-banner warning" style={{ fontSize: 11 }}>
                  <CloudOff size={12} />Backend offline — web search requires the backend server.
                </div>
              )}
            </div>

            {/* Error */}
            {searchError && (
              <div className="info-banner danger"><AlertTriangle size={13} />{searchError}</div>
            )}

            {/* Results */}
            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "<strong>{searchQuery}</strong>"
                </div>
                {searchResults.map((r, i) => (
                  <div key={i} className="search-result-item">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <a href={r.url} target="_blank" rel="noreferrer"
                          style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', lineHeight: 1.4 }}>
                          {r.title}
                        </a>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, marginBottom: 6 }}>{r.url}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-body)', lineHeight: 1.6 }}>{r.snippet}</div>
                      </div>
                      <a href={r.url} target="_blank" rel="noreferrer" style={{ flexShrink: 0, color: 'var(--color-text-muted)', marginTop: 3 }}>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick search suggestions */}
            {searchResults.length === 0 && !searchError && !searching && (
              <div className="zentra-card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 10 }}>Suggested searches</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    'tomato leaf blight treatment',
                    'powdery mildew organic cure',
                    'strawberry nutrient deficiency',
                    'spider mites greenhouse control',
                    'nitrogen deficiency symptoms',
                    'overwatering plant signs',
                  ].map(q => (
                    <button key={q} className="tag-selector-btn" onClick={async () => {
                      setSearchQuery(q);
                      setSearching(true); setSearchError(''); setSearchResults([]);
                      try {
                        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}&max_results=5`);
                        if (res.ok) { const r = await res.json(); setSearchResults(r.results || []); if ((r.results||[]).length === 0) setSearchError('No results found.'); }
                        else { const err = await res.json(); setSearchError(err.detail || 'Search failed.'); }
                      } catch { setSearchError('Search unavailable. Ensure backend is running.'); }
                      finally { setSearching(false); }
                    }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TELEGRAM ══ */}
        {activeTab === 'telegram' && (
          <div className="page-shell">
            <div>
              <h2 className="page-title">Telegram Notifications</h2>
              <p className="page-subtitle">Remote monitoring and control via Telegram bot — works without opening the app.</p>
            </div>
            {!backendConnected && <div className="info-banner warning"><CloudOff size={13} />Backend offline — alert delivery paused</div>}

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* Bot card */}
              <div className="zentra-card" style={{ flex: '1 1 280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#229ED9,#0088CC)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Send size={20} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-title)' }}>@melmalebot</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Plant Guardian Bot</div>
                  </div>
                  <a href="https://t.me/melmalebot" target="_blank" rel="noreferrer" className="zentra-btn-secondary" style={{ marginLeft: 'auto', padding: '0 12px', height: 34, fontSize: 12, textDecoration: 'none' }}>
                    Open <ExternalLink size={11} />
                  </a>
                </div>
                <div className="info-banner success" style={{ fontSize: 11 }}>
                  <Info size={12} />
                  <ol style={{ paddingLeft: 14, margin: 0, lineHeight: 1.8 }}>
                    <li>Search <strong>@melmalebot</strong> on Telegram</li>
                    <li>Press <strong>Start</strong></li>
                    <li>Type <strong>/status</strong> for a live report</li>
                  </ol>
                </div>
              </div>

              {/* Commands */}
              <div className="zentra-card" style={{ flex: '1 1 280px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-title)' }}>Remote Commands</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { cmd: '/status',   desc: 'Full greenhouse status report' },
                    { cmd: '/temp',     desc: 'Current air temperature' },
                    { cmd: '/humidity', desc: 'Current humidity reading' },
                    { cmd: '/soil',     desc: 'Soil moisture level' },
                    { cmd: '/tasks',    desc: "Today's AI task list" },
                    { cmd: '/pump_on',  desc: 'Activate water pump' },
                    { cmd: '/pump_off', desc: 'Deactivate water pump' },
                    { cmd: '/fan_on',   desc: 'Activate ventilation fan' },
                    { cmd: '/fan_off',  desc: 'Deactivate fan' },
                    { cmd: '[photo]',   desc: 'Send leaf photo for VLM disease scan' },
                  ].map(c => (
                    <div key={c.cmd} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', backgroundColor: 'var(--color-bg-base)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                      <code style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', padding: '2px 7px', borderRadius: 4, fontFamily: 'monospace', flexShrink: 0 }}>{c.cmd}</code>
                      <span style={{ fontSize: 12, color: 'var(--color-text-body)' }}>{c.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto alerts */}
              <div className="zentra-card" style={{ flex: '1 1 280px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-title)' }}>Auto Alerts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { emoji: '⚠️', label: 'Threshold breach',  desc: 'When temp/humidity/soil goes out of bounds' },
                    { emoji: '💧', label: 'Pump state change', desc: 'When ActuatorControlAgent triggers the pump' },
                    { emoji: '💨', label: 'Fan state change',  desc: 'When fan is triggered by high temp or humidity' },
                    { emoji: '🌞', label: 'Lights toggled',    desc: 'When light level drops below minimum lux' },
                    { emoji: '🔬', label: 'Disease detected',  desc: 'When qwen3-vl:4b finds disease in a leaf photo' },
                    { emoji: '🔑', label: 'User login',        desc: 'When someone logs into the dashboard' },
                  ].map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{a.emoji}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-title)' }}>{a.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{a.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {activeTab === 'settings' && (
          <div className="page-shell">
            <div>
              <h2 className="page-title">Settings</h2>
              <p className="page-subtitle">System configuration, connection status, and AI model assignments</p>
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* Account */}
              <div className="zentra-card" style={{ flex: '1 1 300px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-title)' }}>Account</h3>
                {[
                  { label: 'Full Name', val: loggedInUser ? `${loggedInUser.first_name} ${loggedInUser.second_name}` : '' },
                  { label: 'Username',  val: loggedInUser?.username || '' },
                  { label: 'Email',     val: loggedInEmail },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                    <input readOnly value={f.val} className="zentra-input" />
                  </div>
                ))}
                <button onClick={handleLogout} className="zentra-btn" style={{ backgroundColor: 'var(--red-600)' }}>
                  <LogOut size={13} /> Sign Out
                </button>
              </div>

              {/* System Status */}
              <div className="zentra-card" style={{ flex: '1 1 300px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-title)' }}>System Status</h3>
                {[
                  {
                    label: 'FastAPI Backend',
                    ok: backendConnected,
                    status: backendConnected ? 'Connected' : 'Offline',
                    note: backendConnected ? 'http://127.0.0.1:8000' : 'Run: uvicorn app.main:app --reload',
                  },
                  {
                    label: 'Supabase Database',
                    ok: backendConnected && data.is_supabase_configured,
                    status: backendConnected ? (data.is_supabase_configured ? 'Connected' : 'Not configured') : 'Offline',
                    note: data.is_supabase_configured ? 'Database connected.' : 'Set SUPABASE_URL + SUPABASE_KEY in .env',
                  },
                  {
                    label: 'Telegram Bot',
                    ok: backendConnected && data.is_telegram_configured && data.telegram_chat_id_set,
                    status: backendConnected ? (data.is_telegram_configured ? (data.telegram_chat_id_set ? 'Active' : 'Chat ID missing') : 'Not configured') : 'Offline',
                    note: !data.is_telegram_configured ? 'Set TELEGRAM_BOT_TOKEN in .env' : (!data.telegram_chat_id_set ? 'Set TELEGRAM_CHAT_ID or send /start to bot' : 'Alert dispatching active.'),
                  },
                  {
                    label: 'Ollama (Local LLM)',
                    ok: backendConnected && data.ollama_connected && data.active_model_installed,
                    status: backendConnected ? (data.ollama_connected ? (data.active_model_installed ? 'Connected' : 'Model not pulled') : 'Not running') : 'Offline',
                    note: !data.ollama_connected ? 'Start Ollama on your PC.' : (data.active_model_installed ? `Model '${data.active_model}' ready.` : `Run: ollama pull ${data.active_model}`),
                  },
                  {
                    label: 'Web Search (DuckDuckGo)',
                    ok: data.search_enabled && backendConnected,
                    status: data.search_enabled ? 'Enabled' : 'Disabled',
                    note: data.search_enabled ? 'Agricultural web search active. No API key required.' : 'Set SEARCH_ENABLED=true in .env',
                  },
                ].map(svc => (
                  <div key={svc.label} style={{ padding: '10px 12px', backgroundColor: 'var(--color-bg-base)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-title)' }}>{svc.label}</span>
                      <span className={`status-badge ${svc.ok ? 'online' : svc.status.includes('missing') || svc.status.includes('not') ? 'warning' : 'offline'}`}>{svc.status}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{svc.note}</span>
                  </div>
                ))}

                {/* Auto-detected chat ID */}
                {backendConnected && data.last_seen_chat_id && !data.telegram_chat_id_set && (
                  <div className="info-banner warning">
                    <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Telegram Chat ID detected: <code>{data.last_seen_chat_id}</code></div>
                      <button onClick={async () => {
                        try {
                          const res = await fetch(`${API_BASE}/telegram/save_chat_id`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: data.last_seen_chat_id }) });
                          if (res.ok) { alert('Chat ID saved!'); fetchStatus(); }
                          else alert('Failed to save Chat ID.');
                        } catch { alert('Connection error.'); }
                      }} className="zentra-btn" style={{ height: 30, fontSize: 11 }}>
                        <CheckCircle2 size={11} /> Apply to .env
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Model Bindings */}
              <div className="zentra-card" style={{ flex: '1 1 300px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-title)' }}>AI Model Bindings</h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Each agent is assigned its best-fit Ollama model.</p>

                {/* Available models */}
                {Object.entries(data.models || {}).map(([key, m]) => (
                  <div key={key} style={{ padding: '10px 12px', backgroundColor: 'var(--color-bg-base)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-title)' }}>{m.name || key}</span>
                      <span style={{ fontSize: 10, color: m.is_vision_capable ? 'var(--color-primary)' : 'var(--color-text-muted)', backgroundColor: m.is_vision_capable ? 'var(--color-primary-light)' : 'var(--color-bg-card)', padding: '2px 7px', borderRadius: 20, border: '1px solid var(--color-border)', fontWeight: 600 }}>
                        {m.is_vision_capable ? '👁 VLM' : '💬 LLM'}
                      </span>
                    </div>
                    <code style={{ fontSize: 11, color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-card)', padding: '1px 6px', borderRadius: 4 }}>{key}</code>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 5, lineHeight: 1.4 }}>{m.description}</p>
                  </div>
                ))}

                {/* Current bindings */}
                {Object.entries(data.agent_bindings || {}).length > 0 && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Active Bindings</div>
                    {Object.entries(data.agent_bindings).map(([agent, model]) => (
                      <div key={agent} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-bg-base)' }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-body)', fontWeight: 500, textTransform: 'capitalize' }}>{agent}</span>
                        <code style={{ fontSize: 11, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', padding: '2px 8px', borderRadius: 4 }}>{model}</code>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    Pull models with:<br />
                    <code style={{ color: 'var(--color-primary)' }}>ollama pull qwen3-vl:4b</code><br />
                    <code style={{ color: 'var(--color-primary)' }}>ollama pull gemma3:1b</code><br />
                    <code style={{ color: 'var(--color-primary)' }}>ollama pull llama3.2:1b</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
