import React, { useState, useRef, useEffect, useContext } from 'react';
import './ChatPage.css';
import { useAuth } from '../../context/AuthContext';
import { getChatHistory, generateChatMessage } from '../../utils/api';

const ChatPage = () => {
    const { user: currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false); // Новое состояние для отслеживания генерации
    const messagesEndRef = useRef(null);

    // Загрузка истории чата при первом открытии
    useEffect(() => {
        const fetchHistory = async () => {
            if (currentUser && currentUser.id) {
                try {
                    const response = await getChatHistory(currentUser.id);
                    const formattedHistory = response.messages.map(msg => ({
                        id: Date.now() * Math.random(),
                        text: msg.content,
                        sender: msg.role === 'user' ? 'user' : 'ai',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    }));
                    setMessages(formattedHistory);
                } catch (error) {
                    console.error("Ошибка при загрузке истории чата:", error);
                }
            }
        };
        fetchHistory();
    }, [currentUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !currentUser || !currentUser.id) return;

        const newUserMessage = {
            id: Date.now(),
            text: inputText,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputText('');
        setIsGenerating(true);

        try {
            const aiResponse = await generateChatMessage(currentUser.id, inputText);
            const aiMessage = {
                id: Date.now() + 1,
                text: aiResponse,
                sender: 'ai',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Ошибка при генерации сообщения AI:", error);
            const errorMessage = {
                id: Date.now() + 1,
                text: "Произошла ошибка при получении ответа от AI.",
                sender: 'ai',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsGenerating(false);
        }
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
                                </div>
                                <div className="message-content">
                                    {message.text.split('\n').map((line, i) => (
                                        <p key={i} style={{ margin: '4px 0' }}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {isGenerating && (
                            <div className="message ai-message generating-message">
                                <div className="message-header">
                                    <span className="message-sender">AI Помощник</span>
                                    <span className="message-time">...</span>
                                </div>
                                <div className="message-content">
                                    <p>Генерация ответа...</p>
                                </div>
                            </div>
                        )}
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