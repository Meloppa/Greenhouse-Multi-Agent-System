import React, { useState } from 'react';
import { Calendar, ChevronRight, Check } from 'lucide-react';

export default function TaskList({ tasks, currentPlant, stage, ageDays }) {
  const [localTasks, setLocalTasks] = useState([]);

  // Sync props tasks to local state to allow instant checks clicking
  React.useEffect(() => {
    setLocalTasks(tasks || []);
  }, [tasks]);

  const toggleTask = (id) => {
    setLocalTasks(prev => 
      prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  };

  const getPriorityColors = (priority) => {
    if (priority === 'High') return { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' };
    if (priority === 'Medium') return { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' };
    return { bg: 'var(--color-bg-base)', color: 'var(--color-text-muted)' };
  };

  return (
    <div className="zentra-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-title)' }}>
            Agri-Tasks (AI Scheduler Agent)
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '500' }}>
            Daily action checklist generated for {currentPlant} (Day {ageDays})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-medium)', borderRadius: '10px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', color: 'var(--color-primary)' }}>
          <Calendar size={12} color="var(--color-primary)" />
          <span>Stage: {stage}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {localTasks.map((task) => {
          const pStyle = getPriorityColors(task.priority);
          return (
            <div 
              key={task.id} 
              onClick={() => toggleTask(task.id)}
              className={`task-row-item ${task.completed ? 'completed' : ''}`}
              style={{
                backgroundColor: task.completed ? 'var(--color-primary-light)' : 'var(--color-bg-card)',
                opacity: task.completed ? 0.75 : 1
              }}
            >
              {/* Checkbox circle/box */}
              <div 
                className="task-checkbox-box"
                style={{
                  borderColor: task.completed ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: task.completed ? 'var(--color-primary)' : 'transparent'
                }}
              >
                {task.completed && <Check size={12} color="#FFFFFF" />}
              </div>

              {/* Task descriptions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    lineHeight: '1.4',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? 'var(--color-text-muted)' : 'var(--color-text-title)',
                    transition: 'color 0.2s'
                  }}>
                    {task.task}
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', backgroundColor: pStyle.bg, color: pStyle.color, flexShrink: 0 }}>
                    {task.priority}
                  </span>
                </div>
                
                <span style={{ fontSize: '11px', color: 'var(--color-text-body)', lineHeight: '1.4' }}>{task.notes}</span>
                <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--color-primary)', marginTop: '4px', width: 'fit-content' }}>#{task.category}</span>
              </div>

              <ChevronRight size={16} color="#CBD5E1" style={{ alignSelf: 'center', flexShrink: 0 }} />
            </div>
          );
        })}

        {localTasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: '500' }}>
            <span>All tasks completed for today.</span>
          </div>
        )}
      </div>
    </div>
  );
}
