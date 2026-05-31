import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HeaderBanner from './components/HeaderBanner';
import StatCard from './components/StatCard';
import SensorCharts from './components/SensorCharts';
import GrowthStage from './components/GrowthStage';
import TaskList from './components/TaskList';
import Diagnostics from './components/Diagnostics';
import IoTSimulator from './components/IoTSimulator';
import ChatDrawer from './components/ChatDrawer';
import { 
  Sprout, 
  LogOut, 
  ShieldCheck, 
  CloudOff, 
  Info, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Activity, 
  ChevronRight, 
  Thermometer, 
  Droplet, 
  Sun as SunIcon, 
  Wind,
  CheckCircle,
  Clock,
  Radio,
  Sliders,
  Cpu
} from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Custom smart-home mockup control states
  const [pumpPressure, setPumpPressure] = useState(65);
  const [fanSpeed, setFanSpeed] = useState(45);
  const [lightDimmer, setLightDimmer] = useState(80);
  const [mediaPlaying, setMediaPlaying] = useState(true);
  const [audioMuted, setAudioMuted] = useState(false);
  const [selectedZone, setSelectedZone] = useState('Tomato');

  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const saved = localStorage.getItem('zentra_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [loggedInEmail, setLoggedInEmail] = useState(() => {
    try {
      const saved = localStorage.getItem('zentra_user_profile');
      if (saved) {
        const u = JSON.parse(saved);
        return u.email || '';
      }
    } catch (e) {}
    return localStorage.getItem('zentra_user_email') || '';
  });

  const [authMode, setAuthMode] = useState('login');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupSecondName, setSignupSecondName] = useState('');
  
  const [authenticating, setAuthenticating] = useState(false);

  // Authentication Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    const ident = loginIdentifier.trim();
    const pass = loginPassword.trim();
    
    if (!ident || !pass) {
      alert("Please enter both your identifier (email or username) and password.");
      return;
    }
    setAuthenticating(true);

    if (!backendConnected) {
      // Offline preview mode login
      setTimeout(() => {
        const profile = {
          username: ident.includes('@') ? ident.split('@')[0] : ident,
          email: ident.includes('@') ? ident : `${ident}@zentra.com`,
          first_name: ident.charAt(0).toUpperCase() + ident.slice(1),
          second_name: "Developer"
        };
        localStorage.setItem('zentra_user_profile', JSON.stringify(profile));
        localStorage.setItem('zentra_user_email', profile.email);
        setLoggedInUser(profile);
        setLoggedInEmail(profile.email);
        setAuthenticating(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: ident, password: pass })
      });
      if (res.ok) {
        const payload = await res.json();
        const profile = payload.user;
        localStorage.setItem('zentra_user_profile', JSON.stringify(profile));
        localStorage.setItem('zentra_user_email', profile.email);
        setLoggedInUser(profile);
        setLoggedInEmail(profile.email);
      } else {
        const err = await res.json();
        alert(err.detail || "Authentication failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Authentication connection failed.");
    } finally {
      setAuthenticating(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const uname = signupUsername.trim();
    const emailVal = signupEmail.trim().toLowerCase();
    const pass = signupPassword.trim();
    const fname = signupFirstName.trim();
    const sname = signupSecondName.trim();

    if (!uname || !emailVal || !pass || !fname || !sname) {
      alert("Please fill in all the registration fields.");
      return;
    }
    setAuthenticating(true);

    if (!backendConnected) {
      setTimeout(() => {
        const profile = {
          username: uname,
          email: emailVal,
          first_name: fname,
          second_name: sname
        };
        localStorage.setItem('zentra_user_profile', JSON.stringify(profile));
        localStorage.setItem('zentra_user_email', profile.email);
        setLoggedInUser(profile);
        setLoggedInEmail(profile.email);
        setAuthenticating(false);
        alert("Registered successfully inside Offline Mock Mode!");
      }, 600);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: uname,
          password: pass,
          email: emailVal,
          first_name: fname,
          second_name: sname
        })
      });
      if (res.ok) {
        const payload = await res.json();
        const profile = payload.user;
        localStorage.setItem('zentra_user_profile', JSON.stringify(profile));
        localStorage.setItem('zentra_user_email', profile.email);
        setLoggedInUser(profile);
        setLoggedInEmail(profile.email);
        alert("Account registered successfully! Welcome email sent.");
      } else {
        const err = await res.json();
        alert(err.detail || "Registration failed.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Registration connection failed.");
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zentra_user_profile');
    localStorage.removeItem('zentra_user_email');
    setLoggedInUser(null);
    setLoggedInEmail('');
  };

  // Toggle dark mode class on document body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Global system data state container
  const [data, setData] = useState({
    current_plant: "Strawberry",
    growth_stage: "Fruiting",
    age_days: 45,
    sensors: { temperature: 24.5, humidity: 65, light: 450, soil_moisture: 42 },
    targets: { min_temp: 18, max_temp: 26, min_humidity: 60, max_humidity: 80, min_light: 300, max_light: 800, min_soil_moisture: 50, max_soil_moisture: 70 },
    actuators: { pump: false, fan: false, grow_lights: false },
    sensor_history: [],
    chat_history: [],
    alerts_history: [],
    diagnostics_history: [],
    tasks: []
  });

  // Pull telemetry payload from the API
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        setBackendConnected(true);
      }
    } catch (err) {
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 3000);
    return () => clearInterval(timer);
  }, []);

  // API Mutator Calls
  const handleSelectPlant = async (plantPayload) => {
    setData(prev => ({
      ...prev,
      current_plant: plantPayload.plant_type,
      growth_stage: plantPayload.growth_stage,
      age_days: plantPayload.age_days
    }));

    if (!backendConnected) return;

    try {
      const res = await fetch(`${API_BASE}/plant/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plantPayload)
      });
      if (res.ok) {
        fetchStatus();
      }
    } catch (err) {
      console.error("Select plant error:", err);
    }
  };

  const handleUpdateSensors = async (sensorPayload) => {
    setData(prev => ({
      ...prev,
      sensors: sensorPayload
    }));

    if (!backendConnected) {
      const temp = sensorPayload.temperature;
      const moist = sensorPayload.soil_moisture;
      const humidity = sensorPayload.humidity;
      const light = sensorPayload.light;
      
      const t = data.targets;
      setData(prev => ({
        ...prev,
        actuators: {
          pump: moist < t.min_soil_moisture,
          fan: temp > t.max_temp || humidity > t.max_humidity,
          grow_lights: light < t.min_light
        }
      }));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/sensors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sensorPayload)
      });
      if (res.ok) {
        fetchStatus();
      }
    } catch (err) {
      console.error("Update sensors error:", err);
    }
  };

  const handleToggleActuator = async (device, state) => {
    setData(prev => ({
      ...prev,
      actuators: {
        ...prev.actuators,
        [device]: state
      }
    }));

    if (!backendConnected) return;

    try {
      const res = await fetch(`${API_BASE}/actuators/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device, state })
      });
      if (res.ok) {
        fetchStatus();
      }
    } catch (err) {
      console.error("Toggle actuator error:", err);
    }
  };

  const handleDiagnoseLeaf = async (formData) => {
    if (!backendConnected) {
      const mockResult = {
        filename: "leaf_sample.png",
        file_size_kb: 450,
        diagnosis: "Powdery Mildew Infection (Podosphaera macularis)",
        status: "Infected",
        severity: "Medium",
        confidence: 94.2,
        symptoms: "White powder spots covering top foliage, leaf distortion.",
        urgent_action: "Reduce humidity, isolate pots, and increase fan speed.",
        organic_treatment: "Spray with organic cold-pressed Neem Oil formula.",
        chemical_treatment: "Sulfur-based fungicides.",
        timestamp: "Offline Mock Mode"
      };
      
      setData(prev => ({
        ...prev,
        diagnostics_history: [mockResult, ...prev.diagnostics_history]
      }));
      return mockResult;
    }

    try {
      const res = await fetch(`${API_BASE}/diagnose`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const report = await res.json();
        fetchStatus();
        return report;
      }
    } catch (err) {
      console.error("Diagnostics upload error:", err);
    }
  };

  const handleSendChatMessage = async (message) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'User', message, timestamp };
    
    setData(prev => ({
      ...prev,
      chat_history: [...prev.chat_history, userMsg]
    }));

    if (!backendConnected) {
      setTimeout(() => {
        let reply = "I am currently running in Offline Preview. Please boot the FastAPI Python backend to connect my active reasoning engine.";
        if (message.toLowerCase() === "/status") {
          reply = `Offline Status: managing ${data.current_plant} - current soil moisture is ${data.sensors.soil_moisture}%`;
        }
        setData(prev => ({
          ...prev,
          chat_history: [...prev.chat_history, { sender: 'Bot', message: reply, timestamp }]
        }));
      }, 600);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (res.ok) {
        fetchStatus();
      }
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  const handleSelectModel = async (modelName) => {
    setData(prev => ({ ...prev, active_model: modelName }));
    if (!backendConnected) return;
    try {
      await fetch(`${API_BASE}/model/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      });
      fetchStatus();
    } catch (err) {}
  };

  const handleBindAgentModel = async (agentName, modelName) => {
    setData(prev => ({
      ...prev,
      agent_bindings: { ...prev.agent_bindings, [agentName]: modelName }
    }));
    if (!backendConnected) return;
    try {
      await fetch(`${API_BASE}/model/bind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentName, model: modelName })
      });
      fetchStatus();
    } catch (err) {}
  };

  // Switch crop target parameters on Zone select click
  const handleZoneSelect = (zoneName) => {
    setSelectedZone(zoneName);
    let plantName = "Strawberry";
    let growthStage = "Fruiting";
    let age = 45;
    
    if (zoneName === 'Tomato') {
      plantName = 'Tomato';
      growthStage = 'Vegetative';
      age = 30;
    } else if (zoneName === 'Lettuce') {
      plantName = 'Lettuce';
      growthStage = 'Sprouting';
      age = 12;
    } else if (zoneName === 'Herbs') {
      plantName = 'Herbs';
      growthStage = 'Budding';
      age = 22;
    }

    handleSelectPlant({
      plant_type: plantName,
      growth_stage: growthStage,
      age_days: age
    });
  };

  // Helper metric state counters
  const sensors = data.sensors || { temperature: 24.5, humidity: 65, light: 450, soil_moisture: 42 };
  const totalTasks = data.tasks.length;
  const completedTasksCount = data.tasks.filter(t => t.completed).length;
  const tasksValue = totalTasks > 0 ? `${completedTasksCount}/${totalTasks}` : "0/0";
  const tasksPct = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 100;
  const activeActuatorsCount = (data.actuators.pump ? 1 : 0) + (data.actuators.fan ? 1 : 0) + (data.actuators.grow_lights ? 1 : 0);

  if (!loggedInEmail) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <div style={styles.authLogo}>
            <Sprout size={28} color="var(--color-primary)" />
          </div>

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h2 style={styles.authHeading}>Welcome to Zentra Flora</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              Automated AI Multi-Agent Greenhouse Portal
            </p>
          </div>

          {/* Form Tabs */}
          <div style={styles.authTabs}>
            <button 
              type="button"
              onClick={() => setAuthMode('login')} 
              style={{
                ...styles.authTabBtn,
                borderBottom: authMode === 'login' ? '2px solid var(--color-primary)' : 'none',
                fontWeight: authMode === 'login' ? '700' : '500',
                color: authMode === 'login' ? 'var(--color-text-title)' : 'var(--color-text-muted)'
              }}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => setAuthMode('signup')} 
              style={{
                ...styles.authTabBtn,
                borderBottom: authMode === 'signup' ? '2px solid var(--color-primary)' : 'none',
                fontWeight: authMode === 'signup' ? '700' : '500',
                color: authMode === 'signup' ? 'var(--color-text-title)' : 'var(--color-text-muted)'
              }}
            >
              Sign Up
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} style={styles.authForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Username or Email</label>
                <input
                  type="text"
                  placeholder="enter your username or email..."
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Password</label>
                <input
                  type="password"
                  placeholder="enter your account password..."
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={styles.formInput}
                />
              </div>

              <button type="submit" disabled={authenticating} style={styles.authSubmitBtn}>
                {authenticating ? 'Authenticating...' : 'Sign In & Synchronize'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} style={styles.authForm}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formLabel}>First Name</label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={signupFirstName}
                    onChange={(e) => setSignupFirstName(e.target.value)}
                    required
                    style={styles.formInput}
                  />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formLabel}>Second Name</label>
                  <input
                    type="text"
                    placeholder="Second Name"
                    value={signupSecondName}
                    onChange={(e) => setSignupSecondName(e.target.value)}
                    required
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Username</label>
                <input
                  type="text"
                  placeholder="choose username..."
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  required
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Email Address</label>
                <input
                  type="email"
                  placeholder="enter email address..."
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Password</label>
                <input
                  type="password"
                  placeholder="create password..."
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  style={styles.formInput}
                />
              </div>

              <button type="submit" disabled={authenticating} style={styles.authSubmitBtn}>
                {authenticating ? 'Registering...' : 'Create Account & Register'}
              </button>
            </form>
          )}

          <div style={styles.authNoteCard}>
            <Info size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <span>
              Registration dispatches a welcoming message containing the system chatbot subscription channel link: <strong>https://t.me/melmalebot</strong>.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Main Panel Content Area */}
      <main style={styles.mainContent}>
        {/* Offline Alert Indicator */}
        {!backendConnected && (
          <div style={styles.offlineBanner}>
            <CloudOff size={16} />
            <span>
              FastAPI backend is offline. Running in <strong>Offline Interactive Mock Mode</strong> with cached models.
            </span>
          </div>
        )}

        {/* Dynamic router based on active Sidebar state */}
        {activeTab === 'settings' ? (
          <div style={styles.settingsPage}>
            <h2 style={styles.pageTitle}>System Configurations</h2>
            <div style={styles.settingsGrid}>
              
              {/* Model Select Card */}
              <div style={styles.settingsCard}>
                <h3>System AI Core Model</h3>
                <p style={styles.note}>Define the backing AI Model running active reasoning routines inside Zentra Flora agents.</p>
                
                <div style={styles.fieldRow}>
                  <label>Selected LLM / VLM Core</label>
                  <select 
                    value={data.active_model || 'qwen3-vl-4b'}
                    onChange={(e) => handleSelectModel(e.target.value)}
                    style={{ ...styles.fieldInput, backgroundColor: 'var(--color-bg-base)', cursor: 'pointer', fontWeight: '600' }}
                  >
                    <option value="qwen3-vl-4b">Qwen 3 VL 4B (VLM)</option>
                    <option value="llama3.2-1b">Llama 3.2 1B (LLM)</option>
                    <option value="gemma3-1b">Gemma 3 1B (LLM)</option>
                  </select>
                </div>
              </div>

              {/* Agent-Specific Model Bindings Card */}
              <div style={styles.settingsCard}>
                <h3>Agent-Specific AI Models</h3>
                <p style={styles.note}>Fine-tune your agricultural agents by assigning specialized LLMs or VLMs per task.</p>
                
                <div style={styles.fieldRow}>
                  <label style={{ fontWeight: '600' }}>Diagnostics Agent (Vision)</label>
                  <select 
                    value={(data.agent_bindings && data.agent_bindings.vision) || 'qwen3-vl-4b'}
                    onChange={(e) => handleBindAgentModel('vision', e.target.value)}
                    style={{ ...styles.fieldInput, backgroundColor: 'var(--color-bg-base)', cursor: 'pointer' }}
                  >
                    <option value="qwen3-vl-4b">Qwen 3 VL 4B (VLM - Recommended)</option>
                    <option value="llama3.2-1b">Llama 3.2 1B (LLM)</option>
                    <option value="gemma3-1b">Gemma 3 1B (LLM)</option>
                  </select>
                </div>

                <div style={styles.fieldRow}>
                  <label style={{ fontWeight: '600' }}>Plant Expert Agent</label>
                  <select 
                    value={(data.agent_bindings && data.agent_bindings.expert) || 'gemma3-1b'}
                    onChange={(e) => handleBindAgentModel('expert', e.target.value)}
                    style={{ ...styles.fieldInput, backgroundColor: 'var(--color-bg-base)', cursor: 'pointer' }}
                  >
                    <option value="gemma3-1b">Gemma 3 1B (LLM - Recommended)</option>
                    <option value="qwen3-vl-4b">Qwen 3 VL 4B (VLM)</option>
                    <option value="llama3.2-1b">Llama 3.2 1B (LLM)</option>
                  </select>
                </div>
              </div>

              {/* Suppabase & Vercel Card */}
              <div style={styles.settingsCard}>
                <h3>Cloud Integrations</h3>
                <div style={styles.fieldRow}>
                  <label>Supabase Database Connection</label>
                  <input type="text" value={backendConnected ? "Connected (Supabase Real-Time)" : "supabase-mock-active (Simulation)"} style={styles.fieldInput} readOnly />
                </div>
                <div style={styles.fieldRow}>
                  <label>Vercel Deployments Integrations</label>
                  <input type="text" value={backendConnected ? "Active (Vercel Project linked)" : "vercel-linked-deployment (Simulation)"} style={styles.fieldInput} readOnly />
                </div>
              </div>

              {/* User Profile Card */}
              <div style={styles.settingsCard}>
                <h3>User Authentication</h3>
                <div style={styles.fieldRow}>
                  <label>Full Name</label>
                  <input type="text" value={loggedInUser ? `${loggedInUser.first_name} ${loggedInUser.second_name}` : 'Developer Account'} style={styles.fieldInput} readOnly />
                </div>
                <div style={styles.fieldRow}>
                  <label>Signed In As (Email)</label>
                  <input type="text" value={loggedInEmail} style={styles.fieldInput} readOnly />
                </div>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                  <LogOut size={14} />
                  <span>Sign Out / Lock Portal</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top Mockup Dashboard Shell */}
            <div className="mockup-dashboard-frame">
              {/* Mockup Header Bar */}
              <div style={styles.mockupHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={styles.mockupLiveBadge}></div>
                  <span style={styles.mockupLiveText}>Live Feed</span>
                </div>

                <div style={styles.mockupHeaderTitle}>
                  🌿 ZENTRA GREENHOUSE DASHBOARD ({data.current_plant.toUpperCase()})
                </div>

                {/* Status Capsules */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={styles.mockupHeaderPill}>
                    <Thermometer size={12} color="var(--color-primary)" />
                    <span>{sensors.temperature}°C</span>
                  </div>
                  <div style={styles.mockupHeaderPill}>
                    <Droplet size={12} color="#38BDF8" />
                    <span>{sensors.humidity}%</span>
                  </div>
                  <div style={styles.mockupHeaderPill}>
                    <SunIcon size={12} color="var(--color-warning)" />
                    <span>{sensors.light} lx</span>
                  </div>
                </div>
              </div>

              {/* Mockup Body Content */}
              <div style={styles.mockupBody}>
                {/* 1. Interactive SVG Greenhouse Animation Hero Panel (70%) */}
                <div style={styles.greenhouseHeroCol}>
                  <div style={styles.heroPanelOverlay}>
                    {/* Live overlay tag info */}
                    <div style={styles.heroOverlayBadge}>
                      <Activity size={12} color="var(--color-success)" />
                      <span>{data.current_plant} • {data.growth_stage}</span>
                    </div>

                    <div style={styles.heroOverlayTargets}>
                      <span>Target Moisture: {data.targets.min_soil_moisture}% - {data.targets.max_soil_moisture}%</span>
                    </div>
                  </div>

                  {/* SVG Greenhouse Illustration */}
                  <svg viewBox="0 0 800 420" style={styles.greenhouseSvg}>
                    {/* Sky Background Gradient */}
                    <defs>
                      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={darkMode ? "#1E1E38" : "#E0F2FE"} />
                        <stop offset="100%" stopColor={darkMode ? "#0F172A" : "#F0F9FF"} />
                      </linearGradient>
                      <linearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#78350F" />
                        <stop offset="100%" stopColor="#451A03" />
                      </linearGradient>
                      <linearGradient id="glowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#C084FC" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <rect width="800" height="420" fill="url(#skyGrad)" rx="24" />

                    {/* Solar Sun/Moon Ray Visual */}
                    {darkMode ? (
                      <circle cx="700" cy="80" r="22" fill="#E2E8F0" opacity="0.8" filter="drop-shadow(0 0 8px #94A3B8)" />
                    ) : (
                      <>
                        <circle cx="700" cy="80" r="30" fill="#FDE047" opacity="0.15" />
                        <circle cx="700" cy="80" r="20" fill="#FACC15" filter="drop-shadow(0 0 10px #EAB308)" />
                      </>
                    )}

                    {/* Brick Wall Background Grid lines */}
                    <path d="M 0,160 L 800,160 M 0,220 L 800,220 M 0,280 L 800,280" stroke={darkMode ? "#1E293B" : "#E2E8F0"} strokeWidth="1" strokeDasharray="5,5" />

                    {/* Grow Light Full-Spectrum Neon Beam Overlay */}
                    {data.actuators.grow_lights && (
                      <polygon 
                        points="250,90 550,90 620,380 180,380" 
                        fill="url(#glowGrad)" 
                        style={{
                          animation: 'glow-pulse 3s infinite ease-in-out',
                          opacity: lightDimmer / 100
                        }} 
                      />
                    )}

                    {/* Soil Foundation */}
                    <rect x="100" y="340" width="600" height="50" fill="url(#soilGrad)" rx="10" />
                    <rect x="90" y="330" width="620" height="10" fill="#15803D" rx="4" /> {/* Grass line */}

                    {/* Smart Grow Lights Fixtures */}
                    <rect x="250" y="80" width="300" height="10" fill="#475569" rx="4" />
                    <line x1="250" y1="80" x2="160" y2="40" stroke="#475569" strokeWidth="2" />
                    <line x1="550" y1="80" x2="640" y2="40" stroke="#475569" strokeWidth="2" />
                    {/* Glowing LED segments */}
                    <rect x="270" y="88" width="50" height="4" fill={data.actuators.grow_lights ? "#F472B6" : "#64748B"} rx="2" />
                    <rect x="340" y="88" width="50" height="4" fill={data.actuators.grow_lights ? "#A855F7" : "#64748B"} rx="2" />
                    <rect x="410" y="88" width="50" height="4" fill={data.actuators.grow_lights ? "#38BDF8" : "#64748B"} rx="2" />
                    <rect x="480" y="88" width="50" height="4" fill={data.actuators.grow_lights ? "#F472B6" : "#64748B"} rx="2" />

                    {/* Water Droplets Mist Simulation */}
                    {data.actuators.pump && (
                      <>
                        <circle cx="280" cy="220" r="3" fill="#38BDF8" style={{ animation: 'mist-float 2s infinite ease-in-out', animationDelay: '0s' }} />
                        <circle cx="380" cy="180" r="4" fill="#38BDF8" style={{ animation: 'mist-float 2.5s infinite ease-in-out', animationDelay: '0.4s' }} />
                        <circle cx="480" cy="240" r="3" fill="#38BDF8" style={{ animation: 'mist-float 1.8s infinite ease-in-out', animationDelay: '0.2s' }} />
                        <circle cx="320" cy="260" r="4" fill="#38BDF8" style={{ animation: 'mist-float 2.2s infinite ease-in-out', animationDelay: '0.6s' }} />
                        <circle cx="440" cy="200" r="3" fill="#38BDF8" style={{ animation: 'mist-float 2.4s infinite ease-in-out', animationDelay: '0.8s' }} />
                      </>
                    )}

                    {/* Spinning Exhaust Fan Assembly */}
                    <g transform="translate(620, 140)">
                      <circle cx="0" cy="0" r="28" fill="#334155" stroke="#475569" strokeWidth="3" />
                      {/* Grille lines */}
                      <line x1="-28" y1="0" x2="28" y2="0" stroke="#1E293B" strokeWidth="1" />
                      <line x1="0" y1="-28" x2="0" y2="28" stroke="#1E293B" strokeWidth="1" />
                      {/* Fan blades */}
                      <g style={{
                        transformOrigin: '0px 0px',
                        animation: data.actuators.fan ? `spin ${2 / (fanSpeed / 50)}s linear infinite` : 'none'
                      }}>
                        <path d="M 0,0 Q -8,-20 0,-25 Q 8,-20 0,0" fill="#E2E8F0" />
                        <path d="M 0,0 Q 20,-8 25,0 Q 20,8 0,0" fill="#CBD5E1" />
                        <path d="M 0,0 Q 8,20 0,25 Q -8,20 0,0" fill="#E2E8F0" />
                        <path d="M 0,0 Q -20,8 -25,0 Q -20,-8 0,0" fill="#CBD5E1" />
                      </g>
                      <circle cx="0" cy="0" r="6" fill="#475569" />
                      {/* Airflow waves indicators */}
                      {data.actuators.fan && (
                        <path d="M -40,-15 Q -55,-10 -60,-15 M -40,0 Q -55,5 -60,0 M -40,15 Q -55,20 -60,15" stroke="#38BDF8" strokeWidth="2" fill="none" opacity="0.7" />
                      )}
                    </g>

                    {/* Central Growing Crop Plant drawing (Tomato/Strawberry vines) */}
                    <g transform="translate(400, 330)" style={{ animation: 'breath 4s infinite ease-in-out' }}>
                      {/* Root pot */}
                      <path d="M -45,0 L -35,20 L 35,20 L 45,0 Z" fill="#D97706" stroke="#B45309" strokeWidth="2" />
                      {/* Stem */}
                      <path d="M 0,0 Q -10,-60 0,-110 Q 15,-150 0,-180" fill="none" stroke="#166534" strokeWidth="6" strokeLinecap="round" />
                      <path d="M 0,0 Q 12,-40 25,-65" fill="none" stroke="#166534" strokeWidth="4" strokeLinecap="round" />
                      <path d="M 0,-110 Q -20,-130 -35,-140" fill="none" stroke="#166534" strokeWidth="4" strokeLinecap="round" />

                      {/* Leaves */}
                      {/* Leaf Left Bottom */}
                      <path d="M -8,-35 Q -32,-35 -38,-50 Q -25,-60 -8,-35" fill="#15803D" stroke="#14532D" strokeWidth="1" />
                      {/* Leaf Right Middle */}
                      <path d="M 12,-55 Q 38,-45 45,-60 Q 25,-75 12,-55" fill="#166534" stroke="#14532D" strokeWidth="1" />
                      {/* Leaf Left Top */}
                      <path d="M -10,-115 Q -38,-115 -42,-132 Q -22,-140 -10,-115" fill="#15803D" stroke="#14532D" strokeWidth="1" />
                      {/* Leaf Top center */}
                      <path d="M 0,-180 Q -15,-205 0,-215 Q 15,-205 0,-180" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />

                      {/* Red Fruit Berries / Tomatoes */}
                      {data.current_plant === 'Strawberry' ? (
                        <>
                          {/* Strawberries */}
                          <path d="M -15,-65 C -25,-65 -28,-78 -18,-82 C -8,-78 -5,-65 -15,-65" fill="#EF4444" />
                          <circle cx="-16" cy="-72" r="0.8" fill="#FDE047" /><circle cx="-13" cy="-75" r="0.8" fill="#FDE047" />
                          <path d="M 22,-85 C 12,-85 9,-98 19,-102 C 29,-98 32,-85 22,-85" fill="#EF4444" />
                          <circle cx="20" cy="-92" r="0.8" fill="#FDE047" /><circle cx="23" cy="-95" r="0.8" fill="#FDE047" />
                        </>
                      ) : data.current_plant === 'Tomato' ? (
                        <>
                          {/* Round Tomatoes */}
                          <circle cx="-18" cy="-72" r="10" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
                          <path d="M-18,-82 L-16,-85" stroke="#15803D" strokeWidth="2" />
                          <circle cx="22" cy="-90" r="12" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
                          <path d="M22,-102 L24,-105" stroke="#15803D" strokeWidth="2" />
                        </>
                      ) : null}
                    </g>

                    {/* Front Greenhouse Glass Frame Overlay */}
                    <rect x="80" y="30" width="640" height="340" fill="none" stroke={darkMode ? "#475569" : "#94A3B8"} strokeWidth="5" rx="16" />
                    <line x1="80" y1="160" x2="720" y2="160" stroke={darkMode ? "#475569" : "#94A3B8"} strokeWidth="2" />
                    <line x1="400" y1="30" x2="400" y2="370" stroke={darkMode ? "#475569" : "#94A3B8"} strokeWidth="3" />
                  </svg>
                </div>

                {/* 2. Active crop Zones Selector Sidebar Panel (30%) */}
                <div style={styles.zonesCol}>
                  <div style={styles.zonesHeader}>
                    <h3 style={styles.zonesTitle}>Greenhouse Zones</h3>
                    <span style={styles.zonesSubtitle}>Switch active hardware bounds</span>
                  </div>

                  <div style={styles.zonesList}>
                    {[
                      { id: 'Tomato', name: 'Tomato Zone', icon: Sprout, desc: 'Vegetative growth config', target: '20-28°C' },
                      { id: 'Lettuce', name: 'Lettuce Zone', icon: Sprout, desc: 'Sprouting water config', target: '15-22°C' },
                      { id: 'Strawberry', name: 'Strawberry Zone', icon: Sprout, desc: 'Ideal fruiting config', target: '18-26°C' },
                      { id: 'Herbs', name: 'Herbs Zone', icon: Sprout, desc: 'Dynamic herb targets', target: '16-24°C' }
                    ].map(zone => {
                      const Icon = zone.icon;
                      const isSelected = selectedZone === zone.id;
                      return (
                        <div 
                          key={zone.id}
                          onClick={() => handleZoneSelect(zone.id)}
                          style={{
                            ...styles.zoneCard,
                            backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--color-bg-base)',
                            borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)'
                          }}
                        >
                          <div style={{
                            ...styles.zoneIconBox,
                            backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                            color: isSelected ? '#FFFFFF' : 'var(--color-text-muted)'
                          }}>
                            <Icon size={16} />
                          </div>

                          <div style={styles.zoneDetails}>
                            <span style={{
                              ...styles.zoneName,
                              color: isSelected ? 'var(--color-primary)' : 'var(--color-text-title)'
                            }}>{zone.name}</span>
                            <span style={styles.zoneDesc}>{zone.desc} | {zone.target}</span>
                          </div>

                          <ChevronRight size={14} color={isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => alert("Multi-agent zone auto-balancer instantiated.")}
                    style={styles.mockupAddRoomBtn}
                  >
                    + BIND NEW AGENT ZONE
                  </button>
                </div>
              </div>

              {/* Mockup Bottom Row Grid */}
              <div style={styles.mockupBottomRow}>
                {/* A. Left Card: IoT ESP32 Arduino Monitor (40%) */}
                <div style={styles.mockupBottomColLeft}>
                  <IoTSimulator 
                    sensors={data.sensors} 
                    actuators={data.actuators} 
                    targets={data.targets} 
                    onUpdateSensors={handleUpdateSensors}
                    onToggleActuator={handleToggleActuator}
                  />
                </div>

                {/* B. Center Card: Smart Actuator Dimmer Control Hub (30%) */}
                <div style={styles.mockupBottomColCenter}>
                  <div style={styles.mockupActuatorCard}>
                    <div style={styles.mockupActuatorHeader}>
                      <Sliders size={18} color="var(--color-primary)" />
                      <div>
                        <h3 style={styles.mockupActuatorTitle}>Actuators Dimmer</h3>
                        <span style={styles.mockupActuatorSub}>Control physical variable output rates</span>
                      </div>
                    </div>

                    <div style={styles.dimmerControlsList}>
                      {/* Grow Light Dimmer */}
                      <div style={styles.dimmerGroup}>
                        <div style={styles.dimmerHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <SunIcon size={14} color={data.actuators.grow_lights ? 'var(--color-warning)' : 'var(--color-text-muted)'} />
                            <span style={styles.dimmerLabel}>Grow Lights Dimmer</span>
                          </div>
                          <span style={styles.dimmerVal}>{lightDimmer}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="100" 
                          value={lightDimmer} 
                          onChange={(e) => {
                            setLightDimmer(parseInt(e.target.value));
                            if (!data.actuators.grow_lights) handleToggleActuator('grow_lights', true);
                          }}
                          style={styles.dimmerInput}
                        />
                        <button 
                          onClick={() => handleToggleActuator('grow_lights', !data.actuators.grow_lights)}
                          style={{
                            ...styles.mockupActuatorSwitchBtn,
                            backgroundColor: data.actuators.grow_lights ? 'var(--color-primary)' : 'var(--color-bg-base)',
                            color: data.actuators.grow_lights ? '#FFFFFF' : 'var(--color-text-muted)'
                          }}
                        >
                          {data.actuators.grow_lights ? "🟢 DISPATCHING FULL SPECTRUM" : "🔴 DEVICE STANDBY"}
                        </button>
                      </div>

                      {/* Ventilation Fan speed */}
                      <div style={styles.dimmerGroup}>
                        <div style={styles.dimmerHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Wind size={14} color={data.actuators.fan ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                            <span style={styles.dimmerLabel}>Ventilation Velocity</span>
                          </div>
                          <span style={styles.dimmerVal}>{fanSpeed}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="100" 
                          value={fanSpeed} 
                          onChange={(e) => {
                            setFanSpeed(parseInt(e.target.value));
                            if (!data.actuators.fan) handleToggleActuator('fan', true);
                          }}
                          style={styles.dimmerInput}
                        />
                        <button 
                          onClick={() => handleToggleActuator('fan', !data.actuators.fan)}
                          style={{
                            ...styles.mockupActuatorSwitchBtn,
                            backgroundColor: data.actuators.fan ? 'var(--color-primary)' : 'var(--color-bg-base)',
                            color: data.actuators.fan ? '#FFFFFF' : 'var(--color-text-muted)'
                          }}
                        >
                          {data.actuators.fan ? "🟢 ACTIVE VENTILATION" : "🔴 DEVICE STANDBY"}
                        </button>
                      </div>

                      {/* Pump Flow speed */}
                      <div style={styles.dimmerGroup}>
                        <div style={styles.dimmerHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Droplet size={14} color={data.actuators.pump ? '#38BDF8' : 'var(--color-text-muted)'} />
                            <span style={styles.dimmerLabel}>Water Pump Flow</span>
                          </div>
                          <span style={styles.dimmerVal}>{pumpPressure}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="100" 
                          value={pumpPressure} 
                          onChange={(e) => {
                            setPumpPressure(parseInt(e.target.value));
                            if (!data.actuators.pump) handleToggleActuator('pump', true);
                          }}
                          style={styles.dimmerInput}
                        />
                        <button 
                          onClick={() => handleToggleActuator('pump', !data.actuators.pump)}
                          style={{
                            ...styles.mockupActuatorSwitchBtn,
                            backgroundColor: data.actuators.pump ? 'var(--color-primary)' : 'var(--color-bg-base)',
                            color: data.actuators.pump ? '#FFFFFF' : 'var(--color-text-muted)'
                          }}
                        >
                          {data.actuators.pump ? "🟢 SOIL IRRIGATION ACTIVE" : "🔴 DEVICE STANDBY"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* C. Right Card: AI Agent Speech Synthesizer & Media Player (30%) */}
                <div style={styles.mockupBottomColRight}>
                  <div style={styles.mockupPlayerCard}>
                    <div style={styles.mockupPlayerHeader}>
                      <Radio size={18} color="var(--color-primary)" />
                      <div>
                        <h3 style={styles.mockupPlayerTitle}>AI Speech Synthesizer</h3>
                        <span style={styles.mockupPlayerSub}>Agent voice response monitor</span>
                      </div>
                    </div>

                    <div style={styles.playerBody}>
                      {/* Vinyl spinning disc representing active voice engine */}
                      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                        <div className={`media-disc ${mediaPlaying ? 'spinning' : ''}`} style={{ width: '90px', height: '90px' }}>
                          {/* Inner center labels */}
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '3px solid #FFFFFF'
                          }}>
                            <Sprout size={12} color="#FFFFFF" />
                          </div>
                        </div>
                      </div>

                      {/* Track name / active AI status */}
                      <div style={{ textAlign: 'center', margin: '4px 0' }}>
                        <div style={styles.playerTrackName}>
                          {data.current_plant} Guardian Agent
                        </div>
                        <div style={styles.playerModelBadge}>
                          Core: {data.active_model || 'qwen3-vl-4b'} VLM
                        </div>
                      </div>

                      {/* Soundwave voice frequencies visualization */}
                      <div style={styles.soundwaveTrack}>
                        <div className="speech-visualizer-bar" style={{ animationDelay: '0.1s', height: mediaPlaying ? '24px' : '6px' }}></div>
                        <div className="speech-visualizer-bar" style={{ animationDelay: '0.3s', height: mediaPlaying ? '32px' : '4px' }}></div>
                        <div className="speech-visualizer-bar" style={{ animationDelay: '0.5s', height: mediaPlaying ? '18px' : '5px' }}></div>
                        <div className="speech-visualizer-bar" style={{ animationDelay: '0.2s', height: mediaPlaying ? '28px' : '8px' }}></div>
                        <div className="speech-visualizer-bar" style={{ animationDelay: '0.4s', height: mediaPlaying ? '14px' : '4px' }}></div>
                        <div className="speech-visualizer-bar" style={{ animationDelay: '0.6s', height: mediaPlaying ? '22px' : '6px' }}></div>
                      </div>

                      {/* Controls Row */}
                      <div style={styles.playerControls}>
                        <button 
                          onClick={() => setAudioMuted(!audioMuted)} 
                          style={styles.playerBtnCircle}
                          title={audioMuted ? "Unmute vocal alarms" : "Mute vocal alarms"}
                        >
                          {audioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>

                        <button 
                          onClick={() => setMediaPlaying(!mediaPlaying)} 
                          style={{
                            ...styles.playerBtnPlay,
                            backgroundColor: 'var(--color-primary)',
                            color: '#FFFFFF'
                          }}
                          title={mediaPlaying ? "Pause voice output" : "Resume voice output"}
                        >
                          {mediaPlaying ? <Pause size={18} fill="#FFFFFF" /> : <Play size={18} fill="#FFFFFF" />}
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '9px', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                          <span>0:34</span>
                          <span style={{ borderBottom: '1px solid var(--color-border)', width: '22px', margin: '2px 0' }}></span>
                          <span>2:27</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Factual Information & Functional panels stacked below */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
              <div style={styles.splitRow}>
                <div style={styles.chartsCol}>
                  <SensorCharts history={data.sensor_history} />
                </div>
                <div style={styles.stagesCol}>
                  <GrowthStage
                    currentPlant={data.current_plant}
                    growthStage={data.growth_stage}
                    ageDays={data.age_days}
                    sensors={data.sensors}
                    targets={data.targets}
                    onSelectPlant={handleSelectPlant}
                  />
                </div>
              </div>

              <div style={styles.splitHalfRow}>
                <div style={styles.halfCol}>
                  <TaskList 
                    tasks={data.tasks} 
                    currentPlant={data.current_plant} 
                    stage={data.growth_stage} 
                    ageDays={data.age_days}
                  />
                </div>
                <div style={styles.halfCol}>
                  <Diagnostics 
                    onDiagnose={handleDiagnoseLeaf} 
                    history={data.diagnostics_history} 
                  />
                </div>
              </div>

              <div style={styles.splitRow}>
                <div style={{ flex: 1 }}>
                  <ChatDrawer
                    chatHistory={data.chat_history}
                    alertsHistory={data.alerts_history}
                    onSendChatMessage={handleSendChatMessage}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg-base)',
    transition: 'background-color 0.2s'
  },
  mainContent: {
    marginLeft: '108px', // Perfect slim capsule sidebar gap
    flex: 1,
    padding: '24px 32px 32px 32px',
    maxWidth: '100%',
    width: 'calc(100% - 108px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  offlineBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FEF3C7',
    border: '1px solid #FCD34D',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#D97706'
  },
  splitRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  chartsCol: {
    flex: '1.8 1 500px'
  },
  stagesCol: {
    flex: '1 1 300px'
  },
  splitHalfRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  halfCol: {
    flex: '1 1 450px'
  },
  settingsPage: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--color-text-title)'
  },
  settingsGrid: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  settingsCard: {
    flex: '1 1 340px',
    backgroundColor: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'background-color 0.2s, border 0.2s'
  },
  fieldRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  fieldInput: {
    height: '42px',
    borderRadius: '10px',
    border: '1px solid var(--color-border)',
    padding: '0 14px',
    backgroundColor: 'var(--color-bg-base)',
    fontSize: '13px',
    color: 'var(--color-text-body)',
    outline: 'none',
    transition: 'background-color 0.2s, border 0.2s, color 0.2s'
  },
  note: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    lineHeight: '1.4'
  },
  logoutBtn: {
    height: '42px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '12px',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
  },

  /* Auth Screens Styles */
  authPage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg-base)',
    padding: '24px',
    fontFamily: 'var(--font-primary)'
  },
  authCard: {
    backgroundColor: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: 'var(--shadow-premium)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    transition: 'background-color 0.2s, border 0.2s'
  },
  authLogo: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    backgroundColor: 'var(--color-primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
    transition: 'background-color 0.2s'
  },
  authHeading: {
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--color-text-title)'
  },
  authTabs: {
    display: 'flex',
    borderBottom: '1px solid var(--color-border)',
    width: '100%',
    marginBottom: '8px',
    transition: 'border 0.2s'
  },
  authTabBtn: {
    flex: 1,
    paddingBottom: '12px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'color 0.2s'
  },
  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  formLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase'
  },
  formInput: {
    height: '44px',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    padding: '0 16px',
    backgroundColor: 'var(--color-bg-base)',
    fontSize: '14px',
    color: 'var(--color-text-body)',
    outline: 'none',
    fontWeight: '500',
    transition: 'background-color 0.2s, border 0.2s, color 0.2s'
  },
  authSubmitBtn: {
    height: '46px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(109, 40, 217, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  authNoteCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--color-primary-light)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '11px',
    color: 'var(--color-text-body)',
    lineHeight: '1.4',
    transition: 'background-color 0.2s, border 0.2s'
  },

  /* Smart Mockup Dashboard Frame Styles */
  mockupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--color-bg-sidebar)',
    borderBottom: '1px solid var(--color-border)',
    padding: '16px 24px',
    height: '56px',
    transition: 'background-color 0.2s, border 0.2s'
  },
  mockupLiveBadge: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-danger)',
    animation: 'pulse-ring 1.5s infinite ease-in-out'
  },
  mockupLiveText: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-title)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  mockupHeaderTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    color: 'var(--color-text-title)'
  },
  mockupHeaderPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '20px',
    backgroundColor: 'var(--color-bg-base)',
    border: '1px solid var(--color-border)',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-body)',
    transition: 'background-color 0.2s, border 0.2s'
  },
  mockupBody: {
    display: 'flex',
    backgroundColor: 'var(--color-bg-base)',
    minHeight: '400px',
    flexWrap: 'wrap',
    transition: 'background-color 0.2s'
  },
  greenhouseHeroCol: {
    flex: '1.8 1 500px',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    minHeight: '380px',
    transition: 'background-color 0.2s, border 0.2s'
  },
  heroPanelOverlay: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    right: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    pointerEvents: 'none',
    zIndex: 5
  },
  heroOverlayBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255,255,255,0.9)',
    border: '1px solid var(--color-border)',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-title)'
  },
  heroOverlayTargets: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    color: '#FFFFFF',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: '700'
  },
  greenhouseSvg: {
    width: '100%',
    height: '100%',
    maxHeight: '380px',
    borderRadius: '16px'
  },
  zonesCol: {
    flex: '1 1 250px',
    backgroundColor: 'var(--color-bg-sidebar)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    transition: 'background-color 0.2s'
  },
  zonesHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginBottom: '16px'
  },
  zonesTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: 'var(--color-text-title)'
  },
  zonesSubtitle: {
    fontSize: '10px',
    color: 'var(--color-text-muted)',
    fontWeight: '600'
  },
  zonesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  zoneCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 14px',
    border: '1px solid',
    borderRadius: '16px',
    cursor: 'pointer',
    gap: '10px',
    transition: 'all 0.2s ease-in-out'
  },
  zoneIconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  zoneDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1
  },
  zoneName: {
    fontSize: '12.5px',
    fontWeight: '700'
  },
  zoneDesc: {
    fontSize: '10px',
    color: 'var(--color-text-muted)'
  },
  mockupAddRoomBtn: {
    marginTop: 'auto',
    height: '42px',
    borderRadius: '14px',
    border: '1px dashed var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-body)',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  /* Bottom Row Mockup shell grids */
  mockupBottomRow: {
    display: 'flex',
    borderTop: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-sidebar)',
    flexWrap: 'wrap',
    transition: 'border 0.2s, background-color 0.2s'
  },
  mockupBottomColLeft: {
    flex: '1.4 1 360px',
    borderRight: '1px solid var(--color-border)',
    padding: '20px',
    transition: 'border 0.2s'
  },
  mockupBottomColCenter: {
    flex: '1 1 270px',
    borderRight: '1px solid var(--color-border)',
    padding: '20px',
    transition: 'border 0.2s'
  },
  mockupBottomColRight: {
    flex: '1 1 270px',
    padding: '20px'
  },

  /* Center bottom Actuator sliders card */
  mockupActuatorCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  mockupActuatorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  mockupActuatorTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: 'var(--color-text-title)'
  },
  mockupActuatorSub: {
    fontSize: '10px',
    color: 'var(--color-text-muted)',
    fontWeight: '500'
  },
  dimmerControlsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  dimmerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  dimmerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11.5px',
    fontWeight: '700'
  },
  dimmerLabel: {
    color: 'var(--color-text-body)'
  },
  dimmerVal: {
    color: 'var(--color-primary)'
  },
  dimmerInput: {
    width: '100%',
    cursor: 'pointer',
    accentColor: 'var(--color-primary)',
    height: '4px',
    backgroundColor: 'var(--color-bg-base)',
    border: 'none',
    outline: 'none'
  },
  mockupActuatorSwitchBtn: {
    height: '28px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '9.5px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    marginTop: '2px',
    transition: 'all 0.15s'
  },

  /* Right bottom Player card styles */
  mockupPlayerCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  mockupPlayerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  mockupPlayerTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: 'var(--color-text-title)'
  },
  mockupPlayerSub: {
    fontSize: '10px',
    color: 'var(--color-text-muted)',
    fontWeight: '500'
  },
  playerBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  playerTrackName: {
    fontSize: '13px',
    fontWeight: '800',
    color: 'var(--color-text-title)'
  },
  playerModelBadge: {
    fontSize: '10px',
    color: 'var(--color-primary)',
    fontWeight: '700'
  },
  soundwaveTrack: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '4px',
    height: '36px',
    margin: '4px 0'
  },
  playerControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px'
  },
  playerBtnCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-body)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  playerBtnPlay: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(124, 58, 237, 0.25)'
  }
};
