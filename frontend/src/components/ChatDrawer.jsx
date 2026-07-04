import React, { useState, useRef, useEffect } from 'react';
import { Send, Leaf, Globe, AlertCircle, Search, X } from 'lucide-react';

const SYSTEM_COMMANDS = [
  { cmd: '/status',      desc: 'Full greenhouse status report' },
  { cmd: '/temp',        desc: 'Current air temperature' },
  { cmd: '/humidity',    desc: 'Current humidity reading' },
  { cmd: '/soil',        desc: 'Soil moisture level' },
  { cmd: '/light',       desc: 'Light intensity (%)' },
  { cmd: '/tasks',       desc: "Today's agri task list" },
  { cmd: '/pump_on',     desc: 'Manually activate water pump' },
  { cmd: '/pump_off',    desc: 'Deactivate water pump' },
  { cmd: '/fan_on',      desc: 'Activate ventilation fan' },
  { cmd: '/fan_off',     desc: 'Deactivate ventilation fan' },
  { cmd: '/led1_on',     desc: 'Turn on LED D1' },
  { cmd: '/led1_off',    desc: 'Turn off LED D1' },
  { cmd: '/led_all_on',  desc: 'Turn on all LEDs' },
  { cmd: '/led_all_off', desc: 'Turn off all LEDs' },
];

export default function ChatDrawer({ chatHistory, onSendChatMessage, searchEnabled }) {
  const [inputMsg, setInputMsg]     = useState('');
  const [useSearch, setUseSearch]   = useState(false);
  const chatEndRef                  = useRef(null);
  const prevLengthRef               = useRef(chatHistory.length);

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
    setInputMsg('');
    await onSendChatMessage(msg, useSearch);
  };

  const quickSend = (cmd) => {
    setInputMsg('');
    onSendChatMessage(cmd, false);
  };

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>

      {/* ── CHAT PANEL ── */}
      <div style={{
        flex: '2 1 400px',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        height: 'min(520px, 75vh)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Leaf size={15} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-title)' }}>Greenhouse Assistant</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>Powered by gemma3:1b</div>
          </div>
          {/* Web search toggle */}
          {searchEnabled && (
            <button
              onClick={() => setUseSearch(s => !s)}
              title={useSearch ? 'Web search ON — disable' : 'Enable web search for this message'}
              style={{
                marginLeft: 'auto',
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: useSearch ? 'var(--color-primary-medium)' : 'var(--color-border)',
                backgroundColor: useSearch ? 'var(--color-primary-light)' : 'transparent',
                color: useSearch ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}>
              <Globe size={12} />
              {useSearch ? 'Web: ON' : 'Web Search'}
            </button>
          )}
        </div>

        {/* Chat log */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Welcome */}
          {chatHistory.length === 0 && (
            <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, padding: '20px 16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-title)' }}>Greenhouse AI Assistant</div>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6, lineHeight: 1.6 }}>
                  Ask me about your plants, sensors, schedules, or treatments.<br />
                  {searchEnabled && <>Toggle <strong>Web Search</strong> to fetch real-time info.</>}
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {chatHistory.map((chat, idx) => {
            const isBot = chat.sender === 'Bot';
            const hasSearchTag = chat.message?.includes('📡 *Sources searched:');
            const displayMsg = chat.message?.replace(/\n\n📡 \*Sources searched:.*$/, '') || '';
            const srcMatch = chat.message?.match(/📡 \*Sources searched: (\d+)/);
            const srcCount = srcMatch ? parseInt(srcMatch[1]) : 0;

            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-end', gap: 7, justifyContent: isBot ? 'flex-start' : 'flex-end' }}>
                {isBot && (
                  <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Leaf size={11} color="#fff" />
                  </div>
                )}
                <div style={{
                  backgroundColor: isBot ? 'var(--color-bg-base)' : 'var(--color-primary)',
                  border: isBot ? '1px solid var(--color-border)' : 'none',
                  borderRadius: isBot ? '10px 10px 10px 3px' : '10px 10px 3px 10px',
                  padding: '9px 13px',
                  maxWidth: '78%',
                }}>
                  <p style={{ fontSize: 13, lineHeight: 1.55, margin: 0, whiteSpace: 'pre-line', color: isBot ? 'var(--color-text-body)' : '#fff' }}>
                    {displayMsg}
                  </p>
                  {hasSearchTag && srcCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 10, color: isBot ? 'var(--color-primary)' : 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                      <Globe size={10} /> {srcCount} web sources used
                    </div>
                  )}
                  <span style={{ fontSize: 10, display: 'block', marginTop: 4, color: isBot ? 'var(--color-text-muted)' : 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                    {chat.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          <div ref={chatEndRef} />
        </div>

        {/* Quick commands */}
        <div style={{ display: 'flex', gap: 5, padding: '7px 14px', overflowX: 'auto', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          {['/status', '/temp', '/humidity', '/soil', '/pump_on', '/fan_on', '/tasks'].map(cmd => (
            <button key={cmd} onClick={() => quickSend(cmd)}
              style={{ padding: '4px 9px', backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-medium)', borderRadius: 20, fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {cmd}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, padding: '10px 14px 13px', flexShrink: 0 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              placeholder={useSearch ? 'Ask with web search…' : 'Ask about your greenhouse…'}
              className="zentra-input"
            />
            {useSearch && (
              <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                <Globe size={12} color="var(--color-primary)" />
              </div>
            )}
          </div>
          <button type="submit"
            style={{ width: 38, height: 38, borderRadius: 8, border: 'none', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Send size={14} color="#fff" />
          </button>
        </form>
      </div>

      {/* ── COMMANDS PANEL ── */}
      <div style={{
        flex: '1 1 220px',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '16px',
        maxHeight: 'min(520px, 75vh)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-title)' }}>Commands</div>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
          Click any command to send it directly to the Greenhouse Assistant.
        </p>

        {searchEnabled && (
          <div style={{ padding: '9px 11px', backgroundColor: 'var(--color-primary-light)', borderRadius: 8, border: '1px solid var(--color-primary-medium)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Globe size={12} color="var(--color-primary)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>Web Search</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-body)', margin: 0, lineHeight: 1.4 }}>
              Toggle the web search button to fetch real-time agricultural info from DuckDuckGo.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SYSTEM_COMMANDS.map(c => (
            <div key={c.cmd}
              onClick={() => quickSend(c.cmd)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', transition: 'background 0.1s', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary-medium)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
              <code style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', flexShrink: 0 }}>{c.cmd}</code>
              <span style={{ fontSize: 11, color: 'var(--color-text-body)' }}>{c.desc}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
