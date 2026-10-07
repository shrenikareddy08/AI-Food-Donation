import React, { useState } from 'react';
import { Bot, Send, Sparkles, X, Database, CheckCircle, Clock } from 'lucide-react';
import { searchService } from '../services/searchService';

export default function AiAssistantModal({ isOpen, onClose }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your MealBridge AI Assistant. You can ask me natural questions about available donations, NGO capacities, event surplus food, or platform guidelines.',
      sources: [],
      grounded: true,
    },
  ]);

  const samplePrompts = [
    'Which NGOs can accept food for 40 children?',
    'Are there any vegetarian donations expiring today?',
    'What food surplus is available from recent events?',
    'Find high quantity cooked meals near Hyderabad NGOs.',
  ];

  if (!isOpen) return null;

  const handleSend = async (queryText = null) => {
    const q = queryText || question;
    if (!q.trim() || loading) return;

    const userMsg = { role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await searchService.queryRagAssistant(q);
      const assistantMsg = {
        role: 'assistant',
        text: res.answer,
        sources: res.sources || [],
        grounded: res.grounded,
        execTime: res.execution_time_ms,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I encountered an issue contacting the MealBridge AI engine. Please verify the backend service is running.',
          sources: [],
          grounded: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '680px',
        height: '620px',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                MealBridge Assistant
                <span style={{ fontSize: '10px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  VERIFIED ACCURACY
                </span>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                Intelligent Food Redistribution Assistant
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Body */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: '#f8fafc'
        }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                backgroundColor: msg.role === 'user' ? '#16a34a' : '#ffffff',
                color: msg.role === 'user' ? '#ffffff' : '#1e293b',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                fontSize: '14px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0'
              }}>
                {msg.text}
              </div>

              {/* Source Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '12px',
                  color: '#475569'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#0f766e', marginBottom: '6px' }}>
                    <Database size={13} />
                    Matching Food & Charity Records ({msg.sources.length} found):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {msg.sources.map((src, idx) => (
                      <div key={idx} style={{ backgroundColor: '#f1f5f9', padding: '6px 8px', borderRadius: '6px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{src.title}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{src.content_snippet}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontSize: '13px', padding: '8px' }}>
              <Sparkles size={16} className="animate-spin" />
              Searching verified records and formulating helpful response...
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        <div style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={loading}
              style={{
                fontSize: '11px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '14px',
                padding: '4px 10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                color: '#334155'
              }}
            >
              💡 {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', backgroundColor: '#ffffff' }}>
          <input
            type="text"
            placeholder="Ask about food, NGOs, event surplus, or donation requirements..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !question.trim()}
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0 18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading || !question.trim() ? 0.6 : 1
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
