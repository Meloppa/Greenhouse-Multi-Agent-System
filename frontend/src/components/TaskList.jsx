import React, { useState } from 'react';
import { CheckSquare, Calendar, ChevronRight, Check } from 'lucide-react';

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

  const getPriorityStyle = (priority) => {
    if (priority === 'High') return { bg: '#FEF2F2', color: '#EF4444' };
    if (priority === 'Medium') return { bg: '#FFFBEB', color: '#F59E0B' };
    return { bg: '#F1F5F9', color: '#64748B' };
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleCol}>
          <h3 style={styles.title}>Agri-Tasks (AI Scheduler Agent)</h3>
          <span style={styles.subtitle}>Daily action checklist generated for {currentPlant} (Day {ageDays})</span>
        </div>
        <div style={styles.ageBadge}>
          <Calendar size={12} color="#7C3AED" />
          <span style={styles.ageText}>Stage: {stage}</span>
        </div>
      </div>

      <div style={styles.list}>
        {localTasks.map((task) => {
          const pStyle = getPriorityStyle(task.priority);
          return (
            <div 
              key={task.id} 
              onClick={() => toggleTask(task.id)}
              style={{
                ...styles.taskRow,
                backgroundColor: task.completed ? '#FAF5FF' : '#FFFFFF',
                opacity: task.completed ? 0.75 : 1
              }}
            >
              {/* Checkbox circle/box */}
              <div style={{
                ...styles.checkbox,
                borderColor: task.completed ? '#7C3AED' : '#CBD5E1',
                backgroundColor: task.completed ? '#7C3AED' : 'transparent'
              }}>
                {task.completed && <Check size={12} color="#FFFFFF" />}
              </div>

              {/* Task descriptions */}
              <div style={styles.descCol}>
                <div style={styles.taskTitleRow}>
                  <span style={{
                    ...styles.taskName,
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? '#94A3B8' : '#0F172A'
                  }}>
                    {task.task}
                  </span>
                  <span style={{ ...styles.priority, backgroundColor: pStyle.bg, color: pStyle.color }}>
                    {task.priority}
                  </span>
                </div>
                
                <span style={styles.notesText}>{task.notes}</span>
                <span style={styles.categoryBadge}>#{task.category}</span>
              </div>

              <ChevronRight size={16} color="#CBD5E1" style={styles.chevron} />
            </div>
          );
        })}

        {localTasks.length === 0 && (
          <div style={styles.empty}>
            <span>All tasks completed for today.</span>
          </div>
        )}
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
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px'
  },
  titleCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
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
  ageBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F5F3FF',
    border: '1px solid #DDD6FE',
    borderRadius: '10px',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#7C3AED'
  },
  ageText: {
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  taskRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '16px',
    border: '1px solid #F1F5F9',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    ':hover': {
      borderColor: '#DDD6FE',
      transform: 'translateY(-1px)'
    }
  },
  checkbox: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '2px',
    flexShrink: 0,
    transition: 'all 0.15s ease'
  },
  descCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1
  },
  taskTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px'
  },
  taskName: {
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '1.4'
  },
  priority: {
    fontSize: '9px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '20px',
    textTransform: 'uppercase'
  },
  notesText: {
    fontSize: '11px',
    color: '#64748B',
    lineHeight: '1.4'
  },
  categoryBadge: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#7C3AED',
    marginTop: '4px',
    width: 'fit-content'
  },
  chevron: {
    alignSelf: 'center',
    flexShrink: 0
  },
  empty: {
    textAlign: 'center',
    padding: '32px',
    color: '#94A3B8',
    fontSize: '13px',
    fontWeight: '500'
  }
};
