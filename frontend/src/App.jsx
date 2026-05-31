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
import { ShieldCheck, CloudOff, Info } from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);

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
      console.warn("FastAPI backend is offline. Running in dashboard mock preview mode.");
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // 3 seconds refresh polling loop to watch simulator slider actions live!
    const timer = setInterval(fetchStatus, 3000);
    return () => clearInterval(timer);
  }, []);

  // API Mutator Calls
  const handleSelectPlant = async (plantPayload) => {
    // Optimistic state updates
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
    // Optimistic state updates
    setData(prev => ({
      ...prev,
      sensors: sensorPayload
    }));

    if (!backendConnected) {
      // Simulate Actuator Control locally if backend is offline
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
    // Optimistic update
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
      // Offline local simulation
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
    // Optimistic update
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'User', message, timestamp };
    
    setData(prev => ({
      ...prev,
      chat_history: [...prev.chat_history, userMsg]
    }));

    if (!backendConnected) {
      // Local chatbot responses
      setTimeout(() => {
        let reply = "I am currently running in Offline Preview. Please boot the FastAPI Python backend to connect my active reasoning engine.";
        if (message.toLowerCase() === "/status") {
          reply = `Offline Status: managing ${data.current_plant} - current soil moisture is ${data.sensors.soil_moisture}%`;
        }
        setData(prev => ({
          ...prev,
          chat_history: [...prev.chat_history, { sender: 'Bot', message: reply, timestamp }]
        }));
      }, 800);
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

  // Helper metric states
  const totalTasks = data.tasks.length;
  const completedTasksCount = data.tasks.filter(t => t.completed).length;
  const tasksValue = totalTasks > 0 ? `${completedTasksCount}/${totalTasks}` : "0/0";
  const tasksPct = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 100;

  const activeActuatorsCount = (data.actuators.pump ? 1 : 0) + (data.actuators.fan ? 1 : 0) + (data.actuators.grow_lights ? 1 : 0);

  return (
    <div style={styles.appContainer}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Panel Content Area */}
      <main style={styles.mainContent}>
        {/* Offline Alert Indicator */}
        {!backendConnected && (
          <div style={styles.offlineBanner}>
            <CloudOff size={16} />
            <span>
              FastAPI backend is not running at <code>http://localhost:8000</code>. Dashboard is loaded in <strong>Offline Interactive Mock Mode</strong>.
            </span>
          </div>
        )}

        {/* Dynamic router based on active Sidebar state */}
        {activeTab === 'settings' ? (
          <div style={styles.settingsPage}>
            <h2>System Configurations</h2>
            <div style={styles.settingsGrid}>
              <div style={styles.settingsCard}>
                <h3>Notifications Credentials</h3>
                <div style={styles.fieldRow}>
                  <label>Telegram Bot Token</label>
                  <input type="text" placeholder="123456789:ABCdefGhIJKlmnoPQ..." style={styles.fieldInput} readOnly />
                </div>
                <div style={styles.fieldRow}>
                  <label>Target Chat ID</label>
                  <input type="text" placeholder="-100123456789" style={styles.fieldInput} readOnly />
                </div>
                <p style={styles.note}>Configure environmental variables in a <code>.env</code> file in the backend directory to activate live notification APIs.</p>
              </div>

              <div style={styles.settingsCard}>
                <h3>SMTP Email Credentials</h3>
                <div style={styles.fieldRow}>
                  <label>SMTP Host</label>
                  <input type="text" placeholder="smtp.gmail.com" style={styles.fieldInput} readOnly />
                </div>
                <div style={styles.fieldRow}>
                  <label>Port</label>
                  <input type="text" placeholder="587" style={styles.fieldInput} readOnly />
                </div>
                <div style={styles.fieldRow}>
                  <label>Email Address</label>
                  <input type="text" placeholder="alerts@greenhouse.com" style={styles.fieldInput} readOnly />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top Header Banner containing illustrations */}
            <HeaderBanner 
              plantName={data.current_plant} 
              stage={data.growth_stage} 
              onExport={() => alert("Telemetry history reports exported successfully.")}
            />

            {/* Metrics cards row matching Zentra layout */}
            <div style={styles.statGrid}>
              <StatCard 
                type="health"
                title="Greenhouse Health"
                value="98.4%"
                change="+1.2%"
                trendUp={true}
                description="Vegetative performance rating"
              />
              <StatCard 
                type="actuators"
                title="Active Actuators"
                value={`${activeActuatorsCount} Devices`}
                change={null}
                trendUp={true}
                description={`Pump: ${data.actuators.pump ? 'ON' : 'OFF'} | Fan: ${data.actuators.fan ? 'ON' : 'OFF'}`}
              />
              <StatCard 
                type="water"
                title="Soil Hydration Status"
                value={`${data.sensors.soil_moisture}%`}
                change={data.sensors.soil_moisture < data.targets.min_soil_moisture ? "Low" : "Ideal"}
                trendUp={data.sensors.soil_moisture >= data.targets.min_soil_moisture}
                description={`Range Target: ${data.targets.min_soil_moisture}% - ${data.targets.max_soil_moisture}%`}
              />
              <StatCard 
                type="tasks"
                title="Scheduler Progress"
                value={tasksValue}
                change={`+${tasksPct}%`}
                trendUp={true}
                description="Daily chores completed ratio"
              />
            </div>

            {/* Split layout grids */}
            <div style={styles.splitRow}>
              {/* Telemetry charts (70%) */}
              <div style={styles.chartsCol}>
                <SensorCharts history={data.sensor_history} />
              </div>
              
              {/* Target reconfigurator (30%) */}
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

            {/* Chores list & Diagnostics center side-by-side */}
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

            {/* Simulation Slider tools & simulated Telegram/Alert panels */}
            <div style={styles.splitHalfRow}>
              <div style={styles.halfCol}>
                <IoTSimulator
                  sensors={data.sensors}
                  actuators={data.actuators}
                  targets={data.targets}
                  onUpdateSensors={handleUpdateSensors}
                  onToggleActuator={handleToggleActuator}
                />
              </div>
              <div style={styles.halfCol}>
                <ChatDrawer
                  chatHistory={data.chat_history}
                  alertsHistory={data.alerts_history}
                  onSendChatMessage={handleSendChatMessage}
                />
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
    backgroundColor: '#F8F9FD'
  },
  mainContent: {
    marginLeft: '260px', // Matches sidebar width
    flex: 1,
    padding: '32px',
    maxWidth: '1300px',
    marginRight: 'auto',
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
  statGrid: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
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
  settingsGrid: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  settingsCard: {
    flex: '1 1 340px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  fieldRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  fieldInput: {
    height: '42px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    padding: '0 14px',
    backgroundColor: '#F8FAFC',
    fontSize: '13px',
    color: '#64748B',
    outline: 'none'
  },
  note: {
    fontSize: '11px',
    color: '#94A3B8',
    lineHeight: '1.4'
  }
};
