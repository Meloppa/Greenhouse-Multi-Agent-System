import React from 'react';
import { Sliders, Cpu, Power, Droplet, Wind, Sun } from 'lucide-react';

export default function IoTSimulator({ sensors, actuators, targets, onUpdateSensors, onToggleActuator }) {
  
  const handleSliderChange = (metric, value) => {
    const newReadings = {
      temperature: sensors.temperature,
      humidity: sensors.humidity,
      light: sensors.light,
      soil_moisture: sensors.soil_moisture,
      [metric]: parseFloat(value)
    };
    onUpdateSensors(newReadings);
  };

  const getStatusColor = (active) => active ? '#7C3AED' : '#94A3B8';

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>Smart Hardware IoT Simulator</h3>
        <span style={styles.subtitle}>Simulate incoming environmental readings and control actuators</span>
      </div>

      <div style={styles.simulatorGrid}>
        {/* Sliders Column */}
        <div style={styles.slidersCol}>
          <div style={styles.panelTitleRow}>
            <Sliders size={14} color="#7C3AED" />
            <span style={styles.panelTitle}>Incoming IoT Sensor Sliders</span>
          </div>

          <div style={styles.sliderList}>
            {/* Temp Slider */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.sliderName}>Air Temp</span>
                <span style={styles.sliderValue}>{sensors.temperature}°C</span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                step="0.5"
                value={sensors.temperature}
                onChange={(e) => handleSliderChange('temperature', e.target.value)}
                style={styles.rangeInput}
              />
              <span style={styles.rangeLabels}>10°C (Cold) <span>Target: {targets.min_temp}-{targets.max_temp}°C</span> 45°C (Hot)</span>
            </div>

            {/* Humidity Slider */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.sliderName}>Air Humidity</span>
                <span style={styles.sliderValue}>{sensors.humidity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="99"
                step="1"
                value={sensors.humidity}
                onChange={(e) => handleSliderChange('humidity', e.target.value)}
                style={styles.rangeInput}
              />
              <span style={styles.rangeLabels}>20% (Dry) <span>Target: {targets.min_humidity}-{targets.max_humidity}%</span> 99% (Saturated)</span>
            </div>

            {/* Soil Moisture Slider */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.sliderName}>Soil Moisture</span>
                <span style={styles.sliderValue}>{sensors.soil_moisture}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="1"
                value={sensors.soil_moisture}
                onChange={(e) => handleSliderChange('soil_moisture', e.target.value)}
                style={styles.rangeInput}
              />
              <span style={styles.rangeLabels}>10% (Arid) <span>Target: {targets.min_soil_moisture}-{targets.max_soil_moisture}%</span> 90% (Flooded)</span>
            </div>

            {/* Light Slider */}
            <div style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.sliderName}>Ambient Light</span>
                <span style={styles.sliderValue}>{sensors.light} Lux</span>
              </div>
              <input
                type="range"
                min="50"
                max="1200"
                step="10"
                value={sensors.light}
                onChange={(e) => handleSliderChange('light', e.target.value)}
                style={styles.rangeInput}
              />
              <span style={styles.rangeLabels}>50 Lux (Shade) <span>Target: {targets.min_light}-{targets.max_light} Lux</span> 1200 Lux (Sun)</span>
            </div>
          </div>
        </div>

        {/* Actuators Column */}
        <div style={styles.actuatorsCol}>
          <div style={styles.panelTitleRow}>
            <Cpu size={14} color="#7C3AED" />
            <span style={styles.panelTitle}>Actuators override (Control Agent)</span>
          </div>

          <div style={styles.actuatorList}>
            {/* Water Pump */}
            <div style={{
              ...styles.actuatorCard,
              borderColor: actuators.pump ? '#D8B4FE' : '#E2E8F0',
              backgroundColor: actuators.pump ? '#FAF5FF' : '#FFFFFF'
            }}>
              <div style={{ ...styles.actuatorIconCircle, backgroundColor: actuators.pump ? '#F5F3FF' : '#F8FAFC' }}>
                <Droplet size={18} color={actuators.pump ? '#7C3AED' : '#64748B'} />
              </div>
              <div style={styles.actuatorDetails}>
                <span style={styles.actuatorName}>Water Pump</span>
                <span style={{ 
                  ...styles.actuatorStatus, 
                  color: actuators.pump ? '#7C3AED' : '#64748B' 
                }}>
                  {actuators.pump ? 'Irrigating Soil' : 'Inactive'}
                </span>
              </div>
              <button 
                onClick={() => onToggleActuator('pump', !actuators.pump)}
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: actuators.pump ? '#7C3AED' : '#F1F5F9'
                }}
              >
                <Power size={14} color={actuators.pump ? '#FFFFFF' : '#475569'} />
              </button>
            </div>

            {/* Exhaust Fan */}
            <div style={{
              ...styles.actuatorCard,
              borderColor: actuators.fan ? '#D8B4FE' : '#E2E8F0',
              backgroundColor: actuators.fan ? '#FAF5FF' : '#FFFFFF'
            }}>
              <div style={{ ...styles.actuatorIconCircle, backgroundColor: actuators.fan ? '#F5F3FF' : '#F8FAFC' }}>
                <Wind size={18} color={actuators.fan ? '#7C3AED' : '#64748B'} />
              </div>
              <div style={styles.actuatorDetails}>
                <span style={styles.actuatorName}>Exhaust Fan</span>
                <span style={{ 
                  ...styles.actuatorStatus, 
                  color: actuators.fan ? '#7C3AED' : '#64748B' 
                }}>
                  {actuators.fan ? 'Ventilating / Cooling' : 'Inactive'}
                </span>
              </div>
              <button 
                onClick={() => onToggleActuator('fan', !actuators.fan)}
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: actuators.fan ? '#7C3AED' : '#F1F5F9'
                }}
              >
                <Power size={14} color={actuators.fan ? '#FFFFFF' : '#475569'} />
              </button>
            </div>

            {/* Grow Lights */}
            <div style={{
              ...styles.actuatorCard,
              borderColor: actuators.grow_lights ? '#D8B4FE' : '#E2E8F0',
              backgroundColor: actuators.grow_lights ? '#FAF5FF' : '#FFFFFF'
            }}>
              <div style={{ ...styles.actuatorIconCircle, backgroundColor: actuators.grow_lights ? '#F5F3FF' : '#F8FAFC' }}>
                <Sun size={18} color={actuators.grow_lights ? '#7C3AED' : '#64748B'} />
              </div>
              <div style={styles.actuatorDetails}>
                <span style={styles.actuatorName}>Grow Lights</span>
                <span style={{ 
                  ...styles.actuatorStatus, 
                  color: actuators.grow_lights ? '#7C3AED' : '#64748B' 
                }}>
                  {actuators.grow_lights ? 'Full Spectrum Active' : 'Inactive'}
                </span>
              </div>
              <button 
                onClick={() => onToggleActuator('grow_lights', !actuators.grow_lights)}
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: actuators.grow_lights ? '#7C3AED' : '#F1F5F9'
                }}
              >
                <Power size={14} color={actuators.grow_lights ? '#FFFFFF' : '#475569'} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '20px'
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: "'Outfit', sans-serif"
  },
  subtitle: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500'
  },
  simulatorGrid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap'
  },
  slidersCol: {
    flex: '1.2 1 300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  actuatorsCol: {
    flex: '1 1 260px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  panelTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '8px',
    borderBottom: '1px solid #F1F5F9'
  },
  panelTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  sliderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  sliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    fontWeight: '700'
  },
  sliderName: {
    color: '#475569'
  },
  sliderValue: {
    color: '#7C3AED'
  },
  rangeInput: {
    width: '100%',
    cursor: 'pointer',
    accentColor: '#7C3AED',
    height: '6px',
    borderRadius: '10px',
    backgroundColor: '#E2E8F0',
    border: 'none',
    outline: 'none'
  },
  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    color: '#94A3B8',
    fontWeight: '600'
  },
  actuatorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  actuatorCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 14px',
    border: '1px solid',
    borderRadius: '14px',
    gap: '12px',
    transition: 'all 0.15s ease'
  },
  actuatorIconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  actuatorDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1
  },
  actuatorName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A'
  },
  actuatorStatus: {
    fontSize: '11px',
    fontWeight: '600'
  },
  toggleBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
  }
};
