import React, { useState, useRef, useEffect } from 'react';
import './ChatPage.css';

const ChatPage = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Привет! Я AI-помощник для управления календарем.\nПока я в разработке, но вы можете писать сообщения — скоро я научусь отвечать и помогать с расписанием!",
            sender: 'ai',
            timestamp: '10:00',
        }
    ]);

    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        // Добавляем сообщение пользователя
        const newUserMessage = {
            id: Date.now(),
            text: inputText,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputText('');

        // Через секунду добавляем фиксированный ответ от AI
        setTimeout(() => {
            const devMessage = {
                id: Date.now() + 1,
                text: "AI-помощник сейчас в разработке.\nСкоро сможет отвечать на ваши запросы о календаре!",
                sender: 'ai',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, devMessage]);
        }, 800);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const quickActions = [
        "Добавить встречу",
        "Показать расписание",
        "Найти свободное время",
        "Перенести событие"
    ];

    const handleQuickAction = (text) => {
        setInputText(text + " — ");
    };

    return (
        <div className="chat-page">
            <div className="chat-header">
                <div className="chat-title">
                    <h1>AI Помощник Календаря</h1>
                </div>
              
            </div>

            <div className="chat-container">
                {/* Основной чат — слева */}
                <div className="chat-main">
                    <div className="messages-container">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
                            >
                                <div className="message-header">
                                    <span className="message-sender">
                                        {message.sender === 'user' ? 'Вы' : 'AI Помощник'}
                                    </span>
                                    <span className="message-time">{message.timestamp}</span>
                                </div>
                                <div className="message-content">
                                    {message.text.split('\n').map((line, i) => (
                                        <p key={i} style={{ margin: '4px 0' }}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="message-input-form" onSubmit={handleSendMessage}>
                        <div className="input-wrapper">
                            <textarea
                                className="message-input"
                                placeholder="Напишите сообщение или выберите быстрое действие справа →"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyPress}
                                rows="1"
                            />
                            <button
                                type="submit"
                                className="send-button"
                                disabled={!inputText.trim()}
                            >
                                ➤
                            </button>
                        </div>
                    </form>
                </div>

                {/* Боковая панель — теперь СПРАВА */}
                <div className="chat-sidebar">
                    <div className="sidebar-section">
                        <h3>📅 Сегодня в календаре</h3>
                        <div className="calendar-preview">
                            <div className="calendar-event">
                                <span className="event-time">10:00</span>
                                <span className="event-title">Совещание команды</span>
                            </div>
                            <div className="calendar-event">
                                <span className="event-time">14:00</span>
                                <span className="event-title">Обед</span>
                            </div>
                            <div className="calendar-event">
                                <span className="event-time">16:30</span>
                                <span className="event-title">Встреча с клиентом</span>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <h3>⚡ Быстрые действия</h3>
                        <div className="quick-actions">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    className="quick-action-btn"
                                    onClick={() => handleQuickAction(action)}
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <h3>ℹ️ Возможности AI (скоро)</h3>
                        <ul className="ai-capabilities">
                            <li>Добавление и редактирование событий</li>
                            <li>Поиск свободного времени</li>
                            <li>Напоминания о встречах</li>
                            <li>Анализ расписания</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;