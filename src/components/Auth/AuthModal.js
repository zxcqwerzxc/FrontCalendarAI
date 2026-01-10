import React, { useState } from 'react';
import { createUser, loginUser } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const AuthModal = ({ onClose }) => {
    const { login } = useAuth();
    const [isRegister, setIsRegister] = useState(true);
    const [formLogin, setFormLogin] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                // ВАЛИДАЦИЯ ПРИ РЕГИСТРАЦИИ
                if (!formLogin || formLogin.length < 3) {
                    throw new Error("Логин должен содержать минимум 3 символа");
                }
                
                if (!password || password.length < 6) {
                    throw new Error("Пароль должен содержать минимум 6 символов");
                }
                
                if (password !== confirmPassword) {
                    throw new Error("Пароли не совпадают");
                }
                
                // РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ
                const data = await createUser({ login: formLogin, password });
                
                // УСПЕШНАЯ РЕГИСТРАЦИЯ
                alert('Регистрация успешна! Теперь войдите в систему.');
                // Переключаем на форму входа
                setIsRegister(false);
                // Очищаем только пароли, логин оставляем
                setPassword('');
                setConfirmPassword('');
                
            } else {
                // АВТОРИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ
                const data = await loginUser({ login: formLogin, password });
                
                // УСПЕШНАЯ АВТОРИЗАЦИЯ
                console.log('Вход успешен:', data);
                
                // Сохраняем пользователя в контексте
                const userData = {
                    id: data.user_id,
                    login: data.login,
                    description: data.description || ''
                };
                
                login(userData);
                onClose();
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message);
            // Очищаем пароли при ошибке
            setPassword('');
            if (isRegister) {
                setConfirmPassword('');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchMode = () => {
        setIsRegister(!isRegister);
        setError('');
        setPassword('');
        setConfirmPassword('');
        // Логин можно оставить, чтобы пользователю было удобно
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="close-button" onClick={onClose}>{'×'}</span>
                <h2>{isRegister ? 'Регистрация' : 'Вход'}</h2>
                
                {error && (
                    <div className="error-message">
                        <strong>Ошибка:</strong> {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Логин:</label>
                        <input
                            type="text"
                            placeholder="Введите логин"
                            value={formLogin}
                            onChange={(e) => setFormLogin(e.target.value)}
                            required
                            disabled={loading}
                            className={error && !formLogin ? 'input-error' : ''}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Пароль:</label>
                        <input
                            type="password"
                            placeholder="Введите пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className={error && !password ? 'input-error' : ''}
                        />
                    </div>
                    
                    {isRegister && (
                        <div className="form-group">
                            <label>Подтвердите пароль:</label>
                            <input
                                type="password"
                                placeholder="Подтвердите пароль"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                                className={error && password !== confirmPassword ? 'input-error' : ''}
                            />
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="submit-btn"
                    >
                        {loading ? (
                            <span className="loading">
                                <span className="spinner"></span> Обработка...
                            </span>
                        ) : (
                            isRegister ? 'Зарегистрироваться' : 'Войти'
                        )}
                    </button>
                </form>
                
                <div className="switch-mode">
                    <button 
                        onClick={handleSwitchMode}
                        disabled={loading}
                        className="switch-btn"
                    >
                        {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
