import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User } from 'lucide-react';
import './AIAssistant.css';

// Simple markdown formatter to handle bold and basic code blocks
const formatMessage = (text) => {
  if (!text) return { __html: '' };
  let html = text
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
  return { __html: html };
};

const AIAssistant = ({ user }) => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `Hi ${user?.name?.split(' ')[0] || 'there'}! I am SkillForge AI, your expert mentor. I can provide personalized course recommendations, explain complex concepts, or help you map out your learning journey. Ask me anything!`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const quickActions = [
    "Recommend a beginner Python course",
    "How do I transition to Data Science?",
    "Explain useLayoutEffect vs useEffect",
    "What are the prerequisites for Machine Learning?"
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sf_token')}`
        },
        body: JSON.stringify({
          messages: newMessages,
          context: "General Mentorship & Course Recommendations"
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...newMessages, { role: 'ai', content: data.response }]);
      } else {
        setMessages([...newMessages, { role: 'ai', content: "I'm having trouble connecting to my brain right now. Please try again later." }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([...newMessages, { role: 'ai', content: "An error occurred while trying to reach the server. Make sure the backend is running!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-assistant-container">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-icon">
          <Bot size={24} />
        </div>
        <div className="ai-header-info">
          <h2>SkillForge AI</h2>
          <p>Expert Mentor & Course Guide</p>
        </div>
        <div className="ai-status">Online</div>
      </div>

      {/* Chat Area */}
      <div className="ai-chat-area">
        {messages.map((msg, idx) => (
          <div key={idx} className={`ai-message-row ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div 
              className="message-bubble markdown-body"
              dangerouslySetInnerHTML={formatMessage(msg.content)}
            />
          </div>
        ))}
        
        {isLoading && (
          <div className="ai-message-row ai">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-bubble">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="ai-input-container">
        <div className="quick-actions">
          {quickActions.map((action, idx) => (
            <div 
              key={idx} 
              className="action-pill"
              onClick={() => handleSendMessage(action)}
            >
              {action}
            </div>
          ))}
        </div>
        
        <div className="chat-input-wrapper">
          <input 
            type="text"
            placeholder="Ask about courses, career paths, or coding concepts..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(inputValue);
            }}
            disabled={isLoading}
          />
          <button 
            className="send-button"
            onClick={() => handleSendMessage(inputValue)}
            disabled={isLoading || !inputValue.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
