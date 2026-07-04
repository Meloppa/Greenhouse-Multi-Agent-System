import React from 'react';
import { Sprout, Settings, Calendar } from 'lucide-react';
import { PLANTS as plants, STAGES as stages, getRecommendedAge } from '../plantData';

export default function GrowthStage({
  currentPlant,
  growthStage,
  ageDays,
  sensors,
  targets,
  onSelectPlant
}) {
  const handlePlantChange = (e) => {
    onSelectPlant({ plant_type: e.target.value, growth_stage: growthStage, age_days: getRecommendedAge(e.target.value, growthStage) });
  };

  const handleStageChange = (e) => {
    onSelectPlant({ plant_type: currentPlant, growth_stage: e.target.value, age_days: getRecommendedAge(currentPlant, e.target.value) });
  };

  const handleAgeChange = (e) => {
    const age = parseInt(e.target.value) || 1;
    onSelectPlant({ plant_type: currentPlant, growth_stage: growthStage, age_days: age });
  };

  // Helper to draw clean progress bars
  const renderProgress = (label, current, min, max, unit) => {
    // calculate simple percentage alignment
    const pct = Math.min(100, Math.max(0, (current / (max * 1.5)) * 100));
    const isOk = current >= min && current <= max;

    return (
      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ color: 'var(--color-text-body)' }}>{label}</span>
          <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            color: isOk ? 'var(--color-success)' : 'var(--color-danger)' 
          }}>
            {current}{unit} <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>({min}-{max}{unit})</span>
          </span>
        </div>
        <div className="chart-hover-bg" style={{ position: 'relative', height: '8px', backgroundColor: 'var(--color-bg-base)', borderRadius: '10px', overflow: 'hidden' }}>
          {/* Ideal range indicator layer */}
          <div style={{
            position: 'absolute',
            height: '100%',
            backgroundColor: 'var(--color-primary-light)',
            borderLeft: '1px solid var(--color-primary-medium)',
            borderRight: '1px solid var(--color-primary-medium)',
            left: `${(min / (max * 1.5)) * 100}%`,
            width: `${((max - min) / (max * 1.5)) * 100}%`,
            transition: 'all 0.2s'
          }}></div>
          
          {/* Current reading fill */}
          <div style={{
            position: 'absolute',
            height: '100%',
            borderRadius: '10px',
            top: 0,
            left: 0,
            width: `${pct}%`,
            backgroundColor: isOk ? 'var(--color-primary)' : 'var(--color-danger)',
            transition: 'width 0.5s ease-out, background-color 0.3s ease'
          }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="zentra-card">
      <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-title)' }}>
        Plant Expert Reconfigurator
      </h3>
      
      {/* Selection Control Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Crop Species</label>
          <div className="zentra-select-container">
            <Sprout size={14} color="#64748B" style={{ marginRight: '6px' }} />
            <select 
              value={currentPlant} 
              onChange={handlePlantChange}
              className="zentra-select"
            >
              {plants.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Growth Phase</label>
          <div className="zentra-select-container">
            <Settings size={14} color="#64748B" style={{ marginRight: '6px' }} />
            <select 
              value={growthStage} 
              onChange={handleStageChange}
              className="zentra-select"
            >
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Age (Days) · AI recommended</label>
          <div className="zentra-select-container">
            <Calendar size={14} color="#64748B" style={{ marginRight: '6px' }} />
            <input 
              type="number" 
              value={ageDays} 
              onChange={handleAgeChange}
              className="zentra-select"
              min="1"
            />
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderBottom: '1px solid var(--color-border)' }} />

      {/* Target parameters compared against current sensor logs */}
      <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Target Parameters vs Live
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {renderProgress("Air Temp", sensors.temperature, targets.min_temp, targets.max_temp, "°C")}
        {renderProgress("Air Humidity", sensors.humidity, targets.min_humidity, targets.max_humidity, "%")}
        {renderProgress("Ambient Light", sensors.light, targets.min_light, targets.max_light, "%")}
        {renderProgress("Soil Moisture", sensors.soil_moisture, targets.min_soil_moisture, targets.max_soil_moisture, "%")}
      </div>
    </div>
  );
}
