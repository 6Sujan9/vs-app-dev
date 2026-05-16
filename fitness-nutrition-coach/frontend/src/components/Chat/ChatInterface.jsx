import React, { useState, useRef, useEffect } from 'react';
import { chatAPI, getErrorMessage } from '../../services/api';
import '../styles/chat.css';

/**
 * Chat Interface Component
 * AI-powered chat assistant for fitness and nutrition advice
 */
const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'ai',
      content:
        "Hi! I'm your AI Fitness & Nutrition Coach. Ask me anything about workouts, meal plans, nutrition, or general fitness advice. I'm here to help you achieve your goals!",
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const trimmedInput = inputValue.trim();
    if (!trimmedInput || loading) {
      return;
    }

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setError(null);
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(trimmedInput);

      const aiMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: response.data.ai_response,
        timestamp: new Date(),
        metadata: { sources: response.data.rag_context_used || [] },
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(getErrorMessage(err));

      // Add error message to chat
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'error',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear chat history?')) {
      setMessages([
        {
          id: 'welcome',
          type: 'ai',
          content:
            "Hi! I'm your AI Fitness & Nutrition Coach. Ask me anything about workouts, meal plans, nutrition, or general fitness advice.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>AI Fitness Coach</h1>
        <button className="btn-icon" onClick={handleClearChat} title="Clear chat">
          🗑️
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message message-${message.type}`}>
            <div className="message-avatar">{message.type === 'user' ? '👤' : '🤖'}</div>
            <div className="message-content">
              <p>{message.content}</p>
              {message.metadata?.sources && (
                <div className="message-sources">
                  <small>Sources: {message.metadata.sources.join(', ')}</small>
                </div>
              )}
              <small className="message-time">
                {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message message-ai">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && <div className="chat-error">{error}</div>}

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about workouts, nutrition, goals, or anything fitness-related..."
          disabled={loading}
          className="chat-input"
          autoFocus
        />
        <button type="submit" disabled={loading || !inputValue.trim()} className="btn-send">
          ➤
        </button>
      </form>

      <div className="chat-footer">
        <p className="chat-tips">
          💡 Tip: Ask about workout plans, meal prep, goal setting, or any fitness questions!
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
