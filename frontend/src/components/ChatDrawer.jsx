import React, { useState, useRef, useEffect } from 'react';
import { Send, Sprout, Thermometer, Droplet, Lightbulb, Wind, Activity, Lock, AlertCircle } from 'lucide-react';

// Allowed greenhouse-only topics (restrict off-topic chat)
const SYSTEM_COMMANDS = [
  { cmd: '/status',     desc: 'Full greenhouse status report' },
  { cmd: '/temp',       desc: 'Current air temperature' },
  { cmd: '/humidity',   desc: 'Current humidity reading' },
  { cmd: '/soil',       desc: 'Soil moisture level' },
  { cmd: '/light',      desc: 'Light intensity (lux)' },
  { cmd: '/tasks',      desc: 'Today\'s agri task list' },
  { cmd: '/pump_on',    desc: 'Manually activate water pump' },
  { cmd: '/pump_off',   desc: 'Deactivate water pump' },
  { cmd: '/fan_on',     desc: 'Activate ventilation fan' },
  { cmd: '/fan_off',    desc: 'Deactivate ventilation fan' },
  { cmd: '/lights_on',  desc: 'Turn on grow lights' },
  { cmd: '/lights_off', desc: 'Turn off grow lights' },
];

const RESTRICTED_KEYWORDS = ['joke', 'story', 'movie', 'song', 'weather outside', 'news', 'recipe', 'math', 'code', 'write me', 'tell me about', 'who is', 'what is love', 'play'];

function isOffTopic(msg) {
  const lower = msg.toLowerCase();
  return RESTRICTED_KEYWORDS.some(kw => lower.includes(kw));
}

export default function ChatDrawer({ chatHistory, alertsHistory, onSendChatMessage }) {
  const [inputMsg, setInputMsg]   = useState('');
  const [blocked, setBlocked]     = useState(null); // stores blocked message text
  const chatEndRef                = useRef(null);
  const prevLengthRef             = useRef(chatHistory.length);

  useEffect(() => {
    if (chatHistory.length > prevLengthRef.current) {
      setTimeout(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 50);
    }
    prevLengthRef.current = chatHistory.length;
  }, [chatHistory.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const msg = inputMsg.trim();
    if (!msg) return;

    // Off-topic restriction
    if (isOffTopic(msg)) {
      setBlocked(msg);
      setInputMsg('');
      return;
    }
    setBlocked(null);
    setInputMsg('');
    await onSendChatMessage(msg);
  };

  const quickSend = (cmd) => {
    setBlocked(null);
    setInputMsg('');
    onSendChatMessage(cmd);
  };

  return (
    <div style={s.shell}>

      {/* ── LEFT: System Chatbot ── */}
      <div style={s.chatPanel}>

        {/* Header */}
        <div style={s.panelHeader}>
          <div style={s.botAvatarSmall}><Sprout size={16} color="#fff" /></div>
          <div>
            <div style={s.panelTitle}>Greenhouse System Assistant</div>
            <div style={s.panelSub}>Restricted to greenhouse queries only</div>
          </div>
          <div style={s.restrictedBadge}><Lock size={10} /><span>System Only</span></div>
        </div>

        {/* Chat log */}
        <div style={s.chatLog}>

          {/* Welcome message */}
          {chatHistory.length === 0 && (
            <div style={s.welcomeCard}>
              <div style={s.welcomeAvatar}><Sprout size={22} color="#fff" /></div>
              <p style={s.welcomeText}>
                👋 Hi! I'm your <strong>Greenhouse AI Assistant</strong>.<br />
                I can only answer questions about your greenhouse system.<br />
                Use the command chips below or type a query.
              </p>
            </div>
          )}

          {/* Message bubbles */}
          {chatHistory.map((chat, idx) => {
            const isBot = chat.sender === 'Bot';
            return (
              <div key={idx} style={{ ...s.msgRow, justifyContent: isBot ? 'flex-start' : 'flex-end' }}>
                {isBot && <div style={s.botDot}><Sprout size={11} color="#fff" /></div>}
                <div style={isBot ? s.botBubble : s.userBubble}>
                  <p style={{ ...s.msgText, color: isBot ? '#0F172A' : '#fff' }}>{chat.message}</p>
                  <span style={{ ...s.ts, color: isBot ? '#94A3B8' : 'rgba(255,255,255,0.6)' }}>{chat.timestamp}</span>
                </div>
              </div>
            );
          })}

          {/* Off-topic block notice */}
          {blocked && (
            <div style={s.blockedBanner}>
              <AlertCircle size={14} color="#D97706" />
              <span>❌ Off-topic blocked: "<em>{blocked}</em>". I only handle greenhouse system queries.</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick command chips */}
        <div style={s.chips}>
          {['/status', '/temp', '/humidity', '/soil', '/pump_on', '/fan_on', '/tasks'].map(cmd => (
            <button key={cmd} onClick={() => quickSend(cmd)} style={s.chip}>{cmd}</button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={s.inputRow}>
          <input
            type="text"
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            placeholder="Ask about your greenhouse… (/status, /tasks)"
            style={s.input}
          />
          <button type="submit" style={s.sendBtn}><Send size={14} color="#fff" /></button>
        </form>
      </div>

      {/* ── RIGHT: Available Commands ── */}
      <div style={s.commandsPanel}>
        <div style={s.panelTitle} style2={{ marginBottom: 8 }}>Available Commands</div>
        <p style={s.commandsDesc}>These are the only queries this assistant handles. The same commands work in Telegram (@melmalebot) remotely.</p>
        <div style={s.commandList}>
          {SYSTEM_COMMANDS.map(c => (
            <div key={c.cmd} style={s.commandRow} onClick={() => quickSend(c.cmd)}>
              <code style={s.cmdCode}>{c.cmd}</code>
              <span style={s.cmdDesc}>{c.desc}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

const s = {
  shell: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  // Chat panel
  chatPanel: {
    flex: '2 1 420px',
    backgroundColor: '#fff',
    borderRadius: 20,
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    height: 520,
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    borderBottom: '1px solid #F1F5F9',
    flexShrink: 0,
  },
  botAvatarSmall: {
    width: 34, height: 34,
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#0F172A',
    fontFamily: "'Outfit', sans-serif",
  },
  panelSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  restrictedBadge: {
    marginLeft: 'auto',
    display: 'flex', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    fontSize: 10,
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: 20,
    border: '1px solid #FCD34D',
  },

  chatLog: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 14px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  welcomeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '20px 16px',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    margin: '8px 0',
  },
  welcomeAvatar: {
    width: 52, height: 52,
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(124,58,237,0.25)',
  },
  welcomeText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 1.6,
    margin: 0,
  },

  msgRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
  },
  botDot: {
    width: 24, height: 24,
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  botBubble: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '16px 16px 16px 4px',
    padding: '10px 14px',
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: '#7C3AED',
    borderRadius: '16px 16px 4px 16px',
    padding: '10px 14px',
    maxWidth: '75%',
  },
  msgText: {
    fontSize: 13,
    lineHeight: 1.5,
    margin: 0,
    whiteSpace: 'pre-line',
  },
  ts: {
    fontSize: 9,
    display: 'block',
    marginTop: 4,
    fontWeight: 600,
  },

  blockedBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    border: '1px solid #FCD34D',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 12,
    color: '#92400E',
    lineHeight: 1.4,
  },

  chips: {
    display: 'flex',
    gap: 6,
    padding: '8px 14px',
    overflowX: 'auto',
    borderTop: '1px solid #F1F5F9',
    flexShrink: 0,
  },
  chip: {
    padding: '5px 10px',
    backgroundColor: '#EDE9FF',
    border: 'none',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    color: '#7C3AED',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  inputRow: {
    display: 'flex',
    gap: 8,
    padding: '10px 14px 14px',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    border: '1px solid #E2E8F0',
    padding: '0 14px',
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    border: 'none',
    backgroundColor: '#7C3AED',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(124,58,237,0.25)',
    flexShrink: 0,
  },

  // Commands reference panel
  commandsPanel: {
    flex: '1 1 240px',
    backgroundColor: '#fff',
    borderRadius: 20,
    border: '1px solid #E2E8F0',
    padding: '18px 16px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxHeight: 520,
    overflowY: 'auto',
  },
  commandsDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 1.5,
    margin: 0,
  },
  commandList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  commandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'background 0.15s',
    backgroundColor: 'transparent',
  },
  cmdCode: {
    fontSize: 11,
    fontWeight: 800,
    color: '#7C3AED',
    backgroundColor: '#EDE9FF',
    padding: '3px 8px',
    borderRadius: 6,
    fontFamily: "'Courier New', monospace",
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  cmdDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 1.3,
  },
};
