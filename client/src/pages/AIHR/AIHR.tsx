import { useState } from 'react';
import { askAIAgent } from '../../services/aiApi';
import Button from '../../components/Button/Button';

interface Message {
  role: 'assistant' | 'user';
  text: string;
}

export default function AIHR() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Xin chào! Bạn muốn tra cứu thông tin nhân sự gì hôm nay?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await askAIAgent({ question: userMsg.text });
      setMessages((prev) => [...prev, { role: 'assistant', text: reply.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Xin lỗi, hiện chưa thể trả lời câu hỏi này.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
        AI HR Agent
      </h1>
      <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: 14 }}>
        Tra cứu thông tin nhân sự bằng ngôn ngữ tự nhiên (tuân thủ quyền truy cập dữ liệu của bạn)
      </p>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          height: 520,
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingBottom: 16,
          }}
        >
          {messages.map((m, i) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={i}
                style={{
                  maxWidth: '75%',
                  padding: '10px 16px',
                  borderRadius: 12,
                  fontSize: 14,
                  lineHeight: 1.5,
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  background: isUser ? '#2563eb' : '#f1f5f9',
                  color: isUser ? '#ffffff' : '#1e293b',
                }}
              >
                {m.text}
              </div>
            );
          })}
          {loading && (
            <div
              style={{
                alignSelf: 'flex-start',
                background: '#f1f5f9',
                color: '#64748b',
                padding: '10px 16px',
                borderRadius: 12,
                fontSize: 14,
              }}
            >
              Đang trả lời...
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            borderTop: '1px solid #e5e7eb',
            paddingTop: 16,
          }}
        >
          <input
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="VD: Số ngày phép còn lại của tôi là bao nhiêu?"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            Gửi
          </Button>
        </div>
      </div>
    </div>
  );
}
