import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Settings, Sprout, Sun, Moon,
  Thermometer, Droplet, Wind, Lightbulb, ShieldCheck,
  ChevronRight, Info, LogOut, CloudOff, Activity,
  Wifi, Power, MessageSquare, ClipboardList, Microscope,
  BarChart2, UserCheck, Send, CheckCircle2, XCircle,
  RefreshCw, Zap, Bell, ExternalLink, AlertTriangle, Inbox
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
    active_model: 'qwen3-vl-4b',
    agent_bindings: {},
    models: {}
  });

  // ── Sensor sim inputs (for dashboard IoT card) ──
  const [simInputs, setSimInputs] = useState({ temperature: 24, humidity: 50, light: 220, soil_moisture: 42 });
  const [simSending, setSimSending] = useState(false);
  const [simResult, setSimResult]   = useState(null); // { ok: bool, actions: [] }

  // ── Plant selector state (for right panel on dashboard) ──
  const PLANTS  = ['Strawberry', 'Tomato', 'Lettuce', 'Orchid', 'Basil'];
  const STAGES  = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting'];
  const [selPlant, setSelPlant]  = useState('Strawberry');
  const [selStage, setSelStage]  = useState('Fruiting');
  const [selAge, setSelAge]      = useState(45);
  const [plantSaving, setPlantSaving] = useState(false);

  // ── Quick chat state removed (Telegram card now shows notifications only) ──
  // Web chatbot uses handleSendChatMessage, Telegram is push-only from dashboard


  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // ── Poll /api/status every 3s ──
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setBackendConnected(true);
        // Sync sim inputs to live sensor values
        if (d.sensors) setSimInputs({ temperature: d.sensors.temperature, humidity: d.sensors.humidity, light: d.sensors.light, soil_moisture: d.sensors.soil_moisture });
        // Sync plant panel
        setSelPlant(d.current_plant);
        setSelStage(d.growth_stage);
        setSelAge(d.age_days);
        // Sync last bot reply
        const botMsgs = (d.chat_history || []).filter(m => m.sender === 'Bot');
        if (botMsgs.length > 0) setLastBotReply(botMsgs[botMsgs.length - 1].message);
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

  // ── Toggle actuator → POST /api/actuators/toggle ──
  const handleToggleActuator = async (device, state) => {
    setData(prev => ({ ...prev, actuators: { ...prev.actuators, [device]: state } }));
    if (!backendConnected) return;
    try { await fetch(`${API_BASE}/actuators/toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device, state }) }); fetchStatus(); } catch {}
  };

  // ── Push sensor reading → POST /api/sensors ──
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

  // ── Plant select → POST /api/plant/select ──
  const handlePlantApply = async () => {
    setPlantSaving(true);
    const payload = { plant_type: selPlant, growth_stage: selStage, age_days: selAge };
    setData(prev => ({ ...prev, current_plant: selPlant, growth_stage: selStage, age_days: selAge }));
    if (!backendConnected) { setTimeout(() => setPlantSaving(false), 500); return; }
    try { await fetch(`${API_BASE}/plant/select`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); fetchStatus(); }
    catch {} finally { setPlantSaving(false); }
  };

  // ── Chat (page) ──
  const handleSendChatMessage = async (message) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setData(prev => ({ ...prev, chat_history: [...prev.chat_history, { sender: 'User', message, timestamp }] }));
    if (!backendConnected) { setTimeout(() => { setData(prev => ({ ...prev, chat_history: [...prev.chat_history, { sender: 'Bot', message: 'Offline — backend not connected.', timestamp }] })); }, 500); return; }
    try { const res = await fetch(`${API_BASE}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) }); if (res.ok) fetchStatus(); } catch {}
  };

  // ── Diagnose ──
  const handleDiagnoseLeaf = async (formData) => {
    if (!backendConnected) {
      const mock = { filename: 'leaf.png', file_size_kb: 450, diagnosis: 'Powdery Mildew Infection', status: 'Infected', severity: 'Medium', confidence: 94.2, symptoms: 'White powdery spots.', urgent_action: 'Reduce humidity.', organic_treatment: 'Neem Oil spray.', chemical_treatment: 'Sulfur fungicides.', timestamp: new Date().toLocaleDateString() };
      setData(prev => ({ ...prev, diagnostics_history: [mock, ...prev.diagnostics_history] })); return mock;
    }
    try { const res = await fetch(`${API_BASE}/diagnose`, { method: 'POST', body: formData }); if (res.ok) { const r = await res.json(); fetchStatus(); return r; } } catch {}
  };

  const sensors = data.sensors || { temperature: 24, humidity: 50, light: 220, soil_moisture: 42 };

  // ─────────────────────────────────────────────────
  // LOGIN / SIGNUP SCREEN
  // ─────────────────────────────────────────────────
  if (!loggedInEmail) {
    return (
      <div style={A.page}>
        <div style={A.card}>
          <div style={A.logo}><Sprout size={28} color="#7C3AED" /></div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={A.title}>Zentra Flora</h2>
            <p style={A.subtitle}>Automated Multi-Agent Greenhouse System</p>
          </div>
          <div style={A.tabs}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => setAuthMode(m)}
                style={{ ...A.tabBtn, borderBottom: authMode === m ? '2px solid #7C3AED' : '2px solid transparent', color: authMode === m ? '#7C3AED' : '#94A3B8', fontWeight: authMode === m ? 700 : 500 }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} style={A.form}>
              <div style={A.group}><label style={A.label}>Username or Email</label><input type="text" placeholder="username or email" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} required style={A.input} /></div>
              <div style={A.group}><label style={A.label}>Password</label><input type="password" placeholder="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required style={A.input} /></div>
              <button type="submit" disabled={authenticating} style={A.btn}>{authenticating ? 'Signing in…' : 'Sign In'}</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} style={A.form}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ ...A.group, flex: 1 }}><label style={A.label}>First Name</label><input type="text" placeholder="First" value={signupFirstName} onChange={e => setSignupFirstName(e.target.value)} required style={A.input} /></div>
                <div style={{ ...A.group, flex: 1 }}><label style={A.label}>Last Name</label><input type="text" placeholder="Last" value={signupSecondName} onChange={e => setSignupSecondName(e.target.value)} required style={A.input} /></div>
              </div>
              <div style={A.group}><label style={A.label}>Username</label><input type="text" placeholder="username" value={signupUsername} onChange={e => setSignupUsername(e.target.value)} required style={A.input} /></div>
              <div style={A.group}><label style={A.label}>Email</label><input type="email" placeholder="email address" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required style={A.input} /></div>
              <div style={A.group}><label style={A.label}>Password</label><input type="password" placeholder="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required style={A.input} /></div>
              <button type="submit" disabled={authenticating} style={A.btn}>{authenticating ? 'Creating account…' : 'Create Account'}</button>
            </form>
          )}
          <div style={A.note}><Info size={13} color="#7C3AED" /><span>After signup you'll receive a Telegram bot link: <strong>@melmalebot</strong></span></div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  // MAIN APP
  // ─────────────────────────────────────────────────
  const sidebarItems = [
    { id: 'dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
    { id: 'sensors',     icon: BarChart2,        label: 'Sensors'     },
    { id: 'tasks',       icon: ClipboardList,    label: 'Task List'   },
    { id: 'diagnostics', icon: Microscope,       label: 'Diagnostics' },
    { id: 'chat',        icon: MessageSquare,    label: 'System Chat' },
    { id: 'telegram',    icon: Bell,             label: 'Telegram'    },
    { id: 'settings',    icon: Settings,         label: 'Settings'    },
  ];

  return (
    <div style={S.root}>

      {/* ── SIDEBAR ── */}
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}><Sprout size={20} color="#7C3AED" /></div>

        <div style={S.navTrack}>
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} title={item.label} onClick={() => setActiveTab(item.id)}
                style={{ ...S.navBtn, background: active ? '#7C3AED' : 'transparent', boxShadow: active ? '0 6px 16px rgba(124,58,237,.35)' : 'none' }}>
                <Icon size={20} color={active ? '#fff' : '#94A3B8'} />
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setDarkMode(!darkMode)} style={S.themeBtn} title="Toggle theme">
            {darkMode ? <Sun size={18} color="#FBBF24" /> : <Moon size={18} color="#7C3AED" />}
          </button>
          <div style={S.avatar}><UserCheck size={16} color="#7C3AED" /><div style={S.onlineDot} /></div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={S.main}>

        {/* ══ DASHBOARD ══ */}
        {activeTab === 'dashboard' && (
          <div style={S.dashShell}>

            {/* Header */}
            <div style={S.dashHeader}>
              <div>
                <span style={S.appTitle}>Zentra Flora</span>
                {!backendConnected && <span style={S.offlinePill}><CloudOff size={11} /> Offline</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ ...S.connDot, background: backendConnected ? '#10B981' : '#EF4444' }} />
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{backendConnected ? 'API Connected' : 'Simulation Mode'}</span>
              </div>
            </div>

            {/* ── TOP ROW: hero + plant panel ── */}
            <div style={S.topRow}>

              {/* Greenhouse hero */}
              <div style={S.heroCard}>
                <div style={S.liveBadge}><div style={S.liveDot} /><span style={{ fontSize: 11, fontWeight: 700 }}>+Live</span></div>
                <div style={S.heroStatusRow}>
                  {[
                    { icon: <Thermometer size={11} />, val: `${sensors.temperature}°C`, ok: sensors.temperature >= data.targets.min_temp && sensors.temperature <= data.targets.max_temp },
                    { icon: <Droplet size={11} />,     val: `${sensors.humidity}%`,     ok: sensors.humidity >= data.targets.min_humidity && sensors.humidity <= data.targets.max_humidity },
                    { icon: <Lightbulb size={11} />,   val: `${sensors.light} lux`,     ok: sensors.light >= data.targets.min_light && sensors.light <= data.targets.max_light },
                    { icon: <Droplet size={11} />,     val: `${sensors.soil_moisture}%`, ok: sensors.soil_moisture >= data.targets.min_soil_moisture && sensors.soil_moisture <= data.targets.max_soil_moisture },
                  ].map((p, i) => (
                    <div key={i} style={{ ...S.heroPill, borderColor: p.ok ? 'transparent' : 'rgba(239,68,68,0.5)' }}>
                      {p.icon}<span style={{ fontSize: 11, fontWeight: 600, color: p.ok ? '#0F172A' : '#EF4444' }}>{p.val}</span>
                    </div>
                  ))}
                </div>
                <img src="/greenhouse_hero.png" alt="Smart Greenhouse" style={S.heroImg} />

                {/* Plant info overlay at bottom */}
                <div style={S.heroOverlay}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{data.current_plant}</span>
                  <span style={S.heroStagePill}>{data.growth_stage} · Day {data.age_days}</span>
                </div>
              </div>

              {/* ── Plant Expert Panel (right) ── */}
              <div style={S.zonesPanel}>
                <div style={S.zonesPanelHeader}>
                  <span style={S.zonesPanelTitle}>Plant Expert</span>
                  <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>PlantExpertAgent</span>
                </div>

                {/* Selectors */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  <div style={P.group}>
                    <label style={P.label}>Crop Species</label>
                    <select value={selPlant} onChange={e => setSelPlant(e.target.value)} style={P.select}>
                      {PLANTS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={P.group}>
                    <label style={P.label}>Growth Stage</label>
                    <select value={selStage} onChange={e => setSelStage(e.target.value)} style={P.select}>
                      {STAGES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={P.group}>
                    <label style={P.label}>Age (Days)</label>
                    <input type="number" min={1} value={selAge} onChange={e => setSelAge(parseInt(e.target.value) || 1)} style={P.select} />
                  </div>

                  {/* Target thresholds display */}
                  <div style={P.targets}>
                    <div style={P.targetLabel}>Current Targets</div>
                    {[
                      { label: 'Temp', val: `${data.targets.min_temp}–${data.targets.max_temp}°C` },
                      { label: 'Humidity', val: `${data.targets.min_humidity}–${data.targets.max_humidity}%` },
                      { label: 'Light', val: `${data.targets.min_light}–${data.targets.max_light} lux` },
                      { label: 'Soil', val: `${data.targets.min_soil_moisture}–${data.targets.max_soil_moisture}%` },
                    ].map(t => (
                      <div key={t.label} style={P.targetRow}>
                        <span style={{ fontSize: 11, color: '#64748B' }}>{t.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>{t.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handlePlantApply} disabled={plantSaving} style={P.applyBtn}>
                  {plantSaving ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={13} />}
                  {plantSaving ? 'Reconfiguring…' : 'Apply & Reconfigure'}
                </button>
              </div>
            </div>

            {/* ── BOTTOM ROW ── */}
            <div style={S.bottomRow}>

              {/* ── IoT Device + Sensor Push ── */}
              <div style={S.bottomCard}>
                <div style={S.cardTopRow}>
                  <div>
                    <div style={S.cardTitle}>IoT Sensor Push</div>
                    <div style={S.cardSub}>ESP32-WROOM-32 · /api/sensors</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Wifi size={14} color={backendConnected ? '#10B981' : '#94A3B8'} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: backendConnected ? '#10B981' : '#94A3B8' }}>
                      {backendConnected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* ESP32 image */}
                <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, padding: '10px 0' }}>
                  <img src="/esp32_board.png" alt="ESP32" style={{ height: 80, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }} />
                </div>

                {/* Sensor inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'temperature', label: 'Temp (°C)', icon: <Thermometer size={11} color="#7C3AED" /> },
                    { key: 'humidity',    label: 'Humidity (%)', icon: <Droplet size={11} color="#38BDF8" /> },
                    { key: 'light',       label: 'Light (lux)', icon: <Lightbulb size={11} color="#FBBF24" /> },
                    { key: 'soil_moisture', label: 'Soil (%)', icon: <Droplet size={11} color="#10B981" /> },
                  ].map(f => (
                    <div key={f.key} style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                        {f.icon}<span style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>{f.label}</span>
                      </div>
                      <input type="number" value={simInputs[f.key]}
                        onChange={e => setSimInputs(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                        style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 14, fontWeight: 800, color: '#0F172A', outline: 'none' }} />
                    </div>
                  ))}
                </div>

                <button onClick={handleSimPush} disabled={simSending} style={{ height: 38, borderRadius: 12, border: 'none', backgroundColor: '#0F172A', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {simSending ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
                  Push to Backend
                </button>

                {/* Result feedback */}
                {simResult && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, backgroundColor: simResult.ok ? '#ECFDF5' : '#FEF2F2', borderRadius: 10, padding: '8px 10px' }}>
                    {simResult.ok ? <CheckCircle2 size={13} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} /> : <XCircle size={13} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />}
                    <span style={{ fontSize: 11, color: simResult.ok ? '#065F46' : '#991B1B', fontWeight: 600 }}>
                      {simResult.ok
                        ? simResult.actions.length > 0
                          ? simResult.actions.map(a => `${a.device} ${a.action}`).join(' · ')
                          : 'Readings accepted. All in range.'
                        : 'Failed to push readings.'}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Actuator Control (ActuatorControlAgent) ── */}
              <div style={S.bottomCard}>
                <div style={S.cardTopRow}>
                  <div>
                    <div style={S.cardTitle}>Actuator Control</div>
                    <div style={S.cardSub}>ActuatorControlAgent · manual override</div>
                  </div>
                  <Power size={16} color={Object.values(data.actuators).some(Boolean) ? '#7C3AED' : '#CBD5E1'} />
                </div>

                {/* Three actuator toggle rows */}
                {[
                  { key: 'pump',        label: 'Water Pump',      sub: 'Soil moisture control',   icon: <Droplet size={20} />, onColor: '#38BDF8', onBg: '#EFF6FF' },
                  { key: 'fan',         label: 'Ventilation Fan', sub: 'Temp & humidity control', icon: <Wind size={20} />,   onColor: '#7C3AED', onBg: '#F5F3FF' },
                  { key: 'grow_lights', label: 'Grow Lights',     sub: 'Light intensity control', icon: <Sun size={20} />,    onColor: '#FBBF24', onBg: '#FFFBEB' },
                ].map(act => {
                  const on = data.actuators[act.key];
                  return (
                    <div key={act.key} style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: on ? act.onBg : '#F8FAFC', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.18s' }}
                      onClick={() => handleToggleActuator(act.key, !on)}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: on ? act.onBg : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: on ? `1.5px solid ${act.onColor}40` : '1.5px solid #E2E8F0', color: on ? act.onColor : '#CBD5E1', flexShrink: 0 }}>
                        {act.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{act.label}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{act.sub}</div>
                      </div>
                      {/* Toggle */}
                      <div style={{ width: 36, height: 20, borderRadius: 20, backgroundColor: on ? act.onColor : '#CBD5E1', padding: 2, display: 'flex', alignItems: 'center', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', transform: on ? 'translateX(16px)' : 'translateX(0)', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                      </div>
                    </div>
                  );
                })}

                <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', paddingTop: 4 }}>
                  Auto-control via ActuatorControlAgent when sensor readings are pushed
                </div>
              </div>

              {/* ── Telegram Notifications & Remote Access ── */}
              <div style={S.bottomCard}>
                <div style={S.cardTopRow}>
                  <div>
                    <div style={S.cardTitle}>Notifications</div>
                    <div style={S.cardSub}>Telegram + Email · remote access</div>
                  </div>
                  <a href="https://t.me/melmalebot" target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', textDecoration: 'none', backgroundColor: '#EFF6FF', padding: '4px 10px', borderRadius: 20, border: '1px solid #BFDBFE' }}>
                    Open Telegram →
                  </a>
                </div>

                {/* Remote access explanation */}
                <div style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: '10px 12px', border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#065F46', textTransform: 'uppercase', marginBottom: 4 }}>📱 Without Opening This App</div>
                  <p style={{ fontSize: 11, color: '#065F46', margin: 0, lineHeight: 1.5 }}>Text <strong>@melmalebot</strong> on Telegram anytime to check sensors, control actuators, or get plant health reports.</p>
                </div>

                {/* What Telegram handles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    { emoji: '🌡️', text: 'Live sensor readings on demand' },
                    { emoji: '⚠️', text: 'Auto-alerts when thresholds breached' },
                    { emoji: '💧', text: 'Pump / fan activation notifications' },
                    { emoji: '🏥', text: 'Disease detection alert with cure' },
                    { emoji: '📋', text: 'Daily task list via /tasks' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13 }}>{item.emoji}</span>
                      <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* Recent alerts */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>Recent Alerts ({data.alerts_history.length})</div>
                  {data.alerts_history.length === 0 ? (
                    <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', padding: '12px 0' }}>No alerts fired — all readings in range</div>
                  ) : (
                    data.alerts_history.slice(0, 3).map((alert, i) => (
                      <div key={i} style={{ padding: '8px 10px', backgroundColor: '#FEF3C7', borderRadius: 10, marginBottom: 5, border: '1px solid #FCD34D' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>{alert.subject}</div>
                        <div style={{ fontSize: 10, color: '#A16207', marginTop: 2 }}>{alert.timestamp}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══ SENSORS PAGE ══ */}
        {activeTab === 'sensors' && (
          <div style={S.pageShell}>
            <h2 style={S.pageTitle}>Sensor Telemetry & Plant Configuration</h2>
            {!backendConnected && <div style={S.offlineBanner}><CloudOff size={13} /> Offline mode — using mock data</div>}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 500px' }}>
                <SensorCharts history={data.sensor_history} />
              </div>
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

        {/* ══ TASKS PAGE ══ */}
        {activeTab === 'tasks' && (
          <div style={S.pageShell}>
            <h2 style={S.pageTitle}>Agri Task Schedule</h2>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Daily actions generated by <strong>TaskSchedulerAgent</strong> based on {data.current_plant} at {data.growth_stage} stage (Day {data.age_days}).</p>
            {!backendConnected && <div style={S.offlineBanner}><CloudOff size={13} /> Offline mode</div>}
            <TaskList tasks={data.tasks} currentPlant={data.current_plant} stage={data.growth_stage} ageDays={data.age_days} />
          </div>
        )}

        {/* ══ DIAGNOSTICS PAGE ══ */}
        {activeTab === 'diagnostics' && (
          <div style={S.pageShell}>
            <h2 style={S.pageTitle}>AI Leaf Diagnostics</h2>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Upload a leaf photo. The <strong>DiagnosticsAgent</strong> ({data.active_model}) will identify diseases, pests, or confirm health.</p>
            {!backendConnected && <div style={S.offlineBanner}><CloudOff size={13} /> Offline — using simulated diagnosis</div>}
            <Diagnostics onDiagnose={handleDiagnoseLeaf} history={data.diagnostics_history} />
          </div>
        )}

        {/* ══ SYSTEM CHATBOT PAGE ══ */}
        {activeTab === 'chat' && (
          <div style={S.pageShell}>
            <h2 style={S.pageTitle}>System Chatbot</h2>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              An in-app AI assistant restricted to greenhouse system queries only.
              Type commands like <code style={{ backgroundColor: '#EDE9FF', color: '#7C3AED', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>/status</code> or <code style={{ backgroundColor: '#EDE9FF', color: '#7C3AED', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>/tasks</code> to query the system.
            </p>
            {!backendConnected && <div style={S.offlineBanner}><CloudOff size={13} /> Offline mode — responses are simulated</div>}
            <ChatDrawer chatHistory={data.chat_history} onSendChatMessage={handleSendChatMessage} />
          </div>
        )}

        {/* ══ TELEGRAM PAGE ══ */}
        {activeTab === 'telegram' && (
          <div style={S.pageShell}>
            <h2 style={S.pageTitle}>Telegram Notifications</h2>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              Telegram works <strong>without opening this app</strong>. The bot sends automatic alerts and responds to commands from your phone.
            </p>
            {!backendConnected && <div style={S.offlineBanner}><CloudOff size={13} /> Backend offline — alert delivery paused</div>}

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

              {/* Bot info card */}
              <div style={{ ...S.settCard, flex: '1 1 280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#229ED9,#0088CC)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(34,158,217,0.3)', flexShrink: 0 }}>
                    <Send size={22} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>@melmalebot</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>Plant Guardian Bot</div>
                  </div>
                  <a href="https://t.me/melmalebot" target="_blank" rel="noreferrer"
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#229ED9', textDecoration: 'none', backgroundColor: '#EFF6FF', padding: '6px 12px', borderRadius: 20, border: '1px solid #BFDBFE' }}>
                    Open <ExternalLink size={11} />
                  </a>
                </div>
                <div style={{ backgroundColor: '#F0F9FF', borderRadius: 12, padding: '12px 14px', border: '1px solid #BAE6FD' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', marginBottom: 6 }}>How to connect</div>
                  <ol style={{ fontSize: 12, color: '#0C4A6E', paddingLeft: 16, margin: 0, lineHeight: 1.8 }}>
                    <li>Open Telegram and search <strong>@melmalebot</strong></li>
                    <li>Press <strong>Start</strong> to activate the bot</li>
                    <li>Type <strong>/status</strong> to get a live greenhouse report</li>
                  </ol>
                </div>
              </div>

              {/* Remote commands card */}
              <div style={{ ...S.settCard, flex: '1 1 280px' }}>
                <h3 style={S.settCardTitle}>Remote Commands</h3>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>These work from your phone without opening the web app:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { cmd: '/status',    desc: 'Full greenhouse status report' },
                    { cmd: '/temp',      desc: 'Current air temperature' },
                    { cmd: '/humidity',  desc: 'Current humidity reading' },
                    { cmd: '/soil',      desc: 'Soil moisture level' },
                    { cmd: '/tasks',     desc: 'Today\'s AI-generated task list' },
                    { cmd: '/pump_on',   desc: 'Activate water pump remotely' },
                    { cmd: '/pump_off',  desc: 'Deactivate water pump' },
                    { cmd: '/fan_on',    desc: 'Activate ventilation fan' },
                    { cmd: '/fan_off',   desc: 'Deactivate fan' },
                    { cmd: '[photo]',    desc: 'Send leaf photo for disease scan' },
                  ].map(c => (
                    <div key={c.cmd} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', backgroundColor: '#F8FAFC', borderRadius: 10 }}>
                      <code style={{ fontSize: 11, fontWeight: 800, color: '#229ED9', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: 6, fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap', flexShrink: 0 }}>{c.cmd}</code>
                      <span style={{ fontSize: 11, color: '#475569' }}>{c.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto-alerts card */}
              <div style={{ ...S.settCard, flex: '1 1 280px' }}>
                <h3 style={S.settCardTitle}>Auto Alerts</h3>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>These are sent automatically by the backend — no commands needed:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {[
                    { emoji: '⚠️', label: 'Threshold breached', desc: 'When temp/humidity/soil goes out of bounds' },
                    { emoji: '💧', label: 'Pump activated/off', desc: 'When ActuatorControlAgent triggers the pump' },
                    { emoji: '💨', label: 'Fan activated/off', desc: 'When fan is triggered by high temp or humidity' },
                    { emoji: '🌞', label: 'Grow lights toggled', desc: 'When light level goes below minimum lux' },
                    { emoji: '🏥', label: 'Disease detected', desc: 'When DiagnosticsAgent finds a disease in a leaf photo' },
                    { emoji: '🔑', label: 'User login', desc: 'When someone logs into the dashboard' },
                  ].map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{a.emoji}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{a.label}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{a.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Alert history */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>
                    Recent Alerts ({data.alerts_history.length})
                  </div>
                  {data.alerts_history.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 0' }}>
                      <Inbox size={28} color="#CBD5E1" />
                      <span style={{ fontSize: 12, color: '#94A3B8' }}>No alerts fired — all readings stable</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                      {data.alerts_history.map((alert, i) => (
                        <div key={i} style={{ padding: '8px 10px', backgroundColor: '#FFFBEB', borderRadius: 10, border: '1px solid #FDE68A' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>{alert.subject}</span>
                            <span style={{ fontSize: 10, color: '#A16207' }}>{alert.timestamp}</span>
                          </div>
                          <span style={{ fontSize: 10, color: '#78350F', fontWeight: 600 }}>via {alert.type || 'Telegram'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══ SETTINGS PAGE ══ */}
        {activeTab === 'settings' && (
          <div style={S.pageShell}>
            <h2 style={S.pageTitle}>System Settings</h2>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

              {/* Account card */}
              <div style={S.settCard}>
                <h3 style={S.settCardTitle}>Account</h3>
                <div style={S.settRow}><label style={S.settLabel}>Full Name</label><input readOnly value={loggedInUser ? `${loggedInUser.first_name} ${loggedInUser.second_name}` : ''} style={S.settInput} /></div>
                <div style={S.settRow}><label style={S.settLabel}>Username</label><input readOnly value={loggedInUser?.username || ''} style={S.settInput} /></div>
                <div style={S.settRow}><label style={S.settLabel}>Email</label><input readOnly value={loggedInEmail} style={S.settInput} /></div>
                <div style={S.settRow}>
                  <label style={S.settLabel}>Telegram Bot</label>
                  <a href="https://t.me/melmalebot" target="_blank" rel="noreferrer" style={{ color: '#7C3AED', fontSize: 13, fontWeight: 700 }}>@melmalebot</a>
                </div>
                <button onClick={handleLogout} style={S.logoutBtn}><LogOut size={13} /> Sign Out</button>
              </div>

              {/* System Status card */}
              <div style={S.settCard}>
                <h3 style={S.settCardTitle}>System Status</h3>

                {/* Services */}
                {[
                  {
                    label: 'FastAPI Backend',
                    status: backendConnected ? 'Connected ✓' : 'Offline ❌',
                    ok: backendConnected,
                    note: backendConnected ? 'Serving on http://127.0.0.1:8000' : 'Run: uvicorn main:app --reload (from backend/app)',
                  },
                  {
                    label: 'Supabase Database',
                    status: backendConnected ? (data.is_supabase_configured ? 'Connected ✓' : 'Offline ❌') : 'Offline ❌',
                    ok: backendConnected && data.is_supabase_configured,
                    note: data.is_supabase_configured ? 'Successfully authenticated and connected with Supabase credentials.' : 'Please configure SUPABASE_URL + SUPABASE_KEY in backend/.env.',
                  },
                  {
                    label: 'Telegram Bot (@melmalebot)',
                    status: backendConnected ? (data.is_telegram_configured ? (data.telegram_chat_id_set ? 'Connected ✓' : 'Token ✓ | Chat ID ⚠️ not set') : 'Offline ❌') : 'Offline ❌',
                    ok: backendConnected && data.is_telegram_configured && data.telegram_chat_id_set,
                    note: !backendConnected ? 'Backend offline.' : (!data.is_telegram_configured ? 'Set TELEGRAM_BOT_TOKEN in backend/.env.' : (!data.telegram_chat_id_set ? 'Set TELEGRAM_CHAT_ID in backend/.env. Get it by messaging @userinfobot on Telegram.' : 'Real-time alert dispatching and remote commands are active.')),
                  },
                  {
                    label: 'Local LLM (Ollama)',
                    status: backendConnected ? (data.ollama_connected ? (data.active_model_installed ? 'Connected & Loaded ✓' : 'Connected (Model not pulled) ⚠️') : 'Not running ❌') : 'Offline ❌',
                    ok: backendConnected && data.ollama_connected && data.active_model_installed,
                    note: !backendConnected ? 'Backend offline.' : (!data.ollama_connected ? 'Ollama is not running. Start Ollama on your PC to enable local agent inference.' : (data.active_model_installed ? `Successfully connected to Ollama. Active model '${data.active_model}' is ready.` : `Ollama is running, but active model '${data.active_model}' is not pulled yet. Run: ollama pull ${data.active_model.replace('-4b', ':4b').replace('-1b', ':1b')}`)),
                  },
                ].map(svc => (
                  <div key={svc.label} style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: 12, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{svc.label}</span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: svc.ok ? '#10B981' : (svc.status.includes('❌') ? '#EF4444' : '#F59E0B'),
                        backgroundColor: svc.ok ? '#ECFDF5' : (svc.status.includes('❌') ? '#FEF2F2' : '#FFFBEB'),
                        padding: '2px 8px',
                        borderRadius: 20
                      }}>
                        {svc.status}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: '#64748B', lineHeight: 1.4 }}>{svc.note}</span>
                  </div>
                ))}

                {/* Auto-detected Chat ID assistant */}
                {backendConnected && data.last_seen_chat_id && !data.telegram_chat_id_set && (
                  <div style={{ padding: '12px 14px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, marginBottom: 12, marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <AlertTriangle size={14} color="#D97706" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>Auto-detected Chat ID!</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#B45309', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                      We detected a message from Telegram Chat ID: <strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{data.last_seen_chat_id}</strong>. Click below to automatically apply it to your configurations.
                    </p>
                    <button onClick={async () => {
                      try {
                        const res = await fetch(`${API_BASE}/telegram/save_chat_id`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ chat_id: data.last_seen_chat_id })
                        });
                        if (res.ok) {
                          alert('Telegram Chat ID saved successfully! The backend will now reload and activate real-time notifications.');
                          fetchStatus();
                        } else {
                          alert('Failed to save Telegram Chat ID.');
                        }
                      } catch {
                        alert('Connection error.');
                      }
                    }} style={{
                      backgroundColor: '#D97706',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <CheckCircle2 size={12} /> Apply to .env & Reload
                    </button>
                  </div>
                )}

                {/* Model selector */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, marginTop: 4 }}>
                  <label style={S.settLabel}>Active AI Model (config only)</label>
                  <select value={data.active_model} onChange={async e => {
                    const model = e.target.value;
                    if (!backendConnected) return;
                    try { await fetch(`${API_BASE}/model/select`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model }) }); fetchStatus(); } catch {}
                  }} style={{ ...S.settInput, marginTop: 6 }}>
                    <option value="qwen3-vl-4b">Qwen 3 VL 4B — VLM (vision)</option>
                    <option value="llama3.2-1b">Llama 3.2 1B — LLM (text)</option>
                    <option value="gemma3-1b">Gemma 3 1B — LLM (text)</option>
                  </select>
                  <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 6, lineHeight: 1.5 }}>
                    To activate local LLM inference, install <a href="https://ollama.com" target="_blank" rel="noreferrer" style={{ color: '#7C3AED' }}>Ollama</a> and run: <code style={{ backgroundColor: '#EDE9FF', color: '#7C3AED', padding: '1px 5px', borderRadius: 4 }}>ollama pull {data.active_model}</code>
                  </p>
                </div>

                {/* Agent bindings */}
                {Object.entries(data.agent_bindings || {}).length > 0 && (
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                    <label style={S.settLabel}>Agent → Model Bindings</label>
                    {Object.entries(data.agent_bindings).map(([agent, model]) => (
                      <div key={agent} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F8FAFC' }}>
                        <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>{agent}</span>
                        <span style={{ fontSize: 11, color: '#7C3AED', fontWeight: 700, backgroundColor: '#EDE9FF', padding: '1px 8px', borderRadius: 6 }}>{model}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>


            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ══════════════════════ STYLES ══════════════════════ */
const S = {
  root: { display: 'flex', minHeight: '100vh', backgroundColor: '#E2EAF4', fontFamily: "'Plus Jakarta Sans', sans-serif" },

  // Sidebar
  sidebar: { width: 76, minHeight: '100vh', backgroundColor: '#E2EAF4', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24, paddingBottom: 24, gap: 0, position: 'fixed', left: 0, top: 0, zIndex: 20 },
  sidebarLogo: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(124,58,237,.1)', marginBottom: 20 },
  navTrack: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#D1DCF0', borderRadius: 36, padding: '18px 10px', width: 56, marginBottom: 20 },
  navBtn: { width: 42, height: 42, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .18s' },
  themeBtn: { width: 36, height: 36, borderRadius: '50%', border: 'none', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.08)' },
  avatar: { width: 38, height: 38, borderRadius: '50%', backgroundColor: '#EDE9FF', border: '2px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', backgroundColor: '#10B981', border: '1.5px solid #E2EAF4' },

  // Main
  main: { marginLeft: 76, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '20px 24px 28px 20px' },

  // Dashboard
  dashShell: { display: 'flex', flexDirection: 'column', gap: 14, flex: 1 },
  dashHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  appTitle: { fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', marginRight: 10 },
  offlinePill: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#D97706', backgroundColor: '#FEF3C7', padding: '3px 8px', borderRadius: 20 },
  connDot: { width: 8, height: 8, borderRadius: '50%' },

  topRow: { display: 'flex', gap: 14, flex: '0 0 auto' },

  // Hero
  heroCard: { flex: '1 1 0', borderRadius: 24, overflow: 'hidden', position: 'relative', minHeight: 240, maxHeight: 280, backgroundColor: '#4A7C9E', boxShadow: '0 6px 30px rgba(0,0,0,.10)' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', top: 0, left: 0 },
  liveBadge: { position: 'absolute', top: 14, left: 14, zIndex: 5, backgroundColor: '#fff', borderRadius: 20, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,.1)', fontSize: 12, fontWeight: 700, color: '#0F172A' },
  liveDot: { width: 7, height: 7, borderRadius: '50%', backgroundColor: '#EF4444' },
  heroStatusRow: { position: 'absolute', top: 14, right: 14, zIndex: 5, display: 'flex', gap: 6 },
  heroPill: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4, backdropFilter: 'blur(4px)', border: '1px solid transparent' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', padding: '20px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  heroStagePill: { fontSize: 11, fontWeight: 700, color: '#fff', backgroundColor: 'rgba(124,58,237,0.7)', borderRadius: 20, padding: '4px 10px', backdropFilter: 'blur(4px)' },

  // Plant panel
  zonesPanel: { width: 230, flexShrink: 0, backgroundColor: '#fff', borderRadius: 24, padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 4px 20px rgba(0,0,0,.06)' },
  zonesPanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  zonesPanelTitle: { fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: "'Outfit', sans-serif" },

  // Bottom row
  bottomRow: { display: 'flex', gap: 14, flex: '1 1 auto' },
  bottomCard: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: '18px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,.06)', minHeight: 0 },
  cardTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 14, fontWeight: 800, color: '#0F172A', fontFamily: "'Outfit', sans-serif" },
  cardSub: { fontSize: 10, color: '#94A3B8', fontWeight: 500, marginTop: 1 },

  // Inner pages
  pageShell: { display: 'flex', flexDirection: 'column', gap: 20, padding: '4px 0' },
  pageTitle: { fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 0 },
  offlineBanner: { display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#D97706' },

  // Settings
  settCard: { flex: '1 1 320px', backgroundColor: '#fff', borderRadius: 20, padding: '24px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 4px 16px rgba(0,0,0,.05)' },
  settCardTitle: { fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: "'Outfit', sans-serif" },
  settRow: { display: 'flex', flexDirection: 'column', gap: 4 },
  settLabel: { fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' },
  settInput: { height: 40, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', backgroundColor: '#F8FAFC', fontSize: 13, color: '#0F172A', outline: 'none', fontFamily: 'inherit' },
  logoutBtn: { height: 40, borderRadius: 12, border: 'none', backgroundColor: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
};

/* Plant panel sub-styles */
const P = {
  group: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' },
  select: { height: 36, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px', backgroundColor: '#F8FAFC', fontSize: 12, fontWeight: 600, color: '#0F172A', outline: 'none', fontFamily: 'inherit', width: '100%' },
  targets: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' },
  targetLabel: { fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 },
  targetRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  applyBtn: { height: 40, borderRadius: 14, border: 'none', backgroundColor: '#7C3AED', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(124,58,237,.25)', marginTop: 4 },
};

/* Auth styles */
const A = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#E2EAF4', padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 440, boxShadow: '0 20px 50px rgba(0,0,0,.10)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 },
  logo: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#EDE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,.12)' },
  title: { fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: '#0F172A', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  tabs: { display: 'flex', borderBottom: '1px solid #E2E8F0', width: '100%' },
  tabBtn: { flex: 1, paddingBottom: 12, border: 'none', borderBottom: '2px solid transparent', backgroundColor: 'transparent', fontSize: 14, cursor: 'pointer', transition: 'all .15s' },
  form: { display: 'flex', flexDirection: 'column', gap: 14, width: '100%' },
  group: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' },
  input: { height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 14px', backgroundColor: '#F8FAFC', fontSize: 14, color: '#0F172A', outline: 'none', fontWeight: 500, fontFamily: 'inherit' },
  btn: { height: 46, borderRadius: 12, border: 'none', backgroundColor: '#7C3AED', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,.28)', fontFamily: 'inherit' },
  note: { display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: '#EDE9FF', borderRadius: 10, padding: '10px 12px', fontSize: 11, color: '#475569', lineHeight: 1.4, width: '100%' },
};
