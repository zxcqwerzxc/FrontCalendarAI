import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, loginUser } from '../../utils/api'; // Импортируем функции API
import './Auth.css';

const Auth = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setIsLoggedIn(true);
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('user');
            }
        }
    }, []);

    const handleProfileClick = () => {
        if (isLoggedIn) {
            navigate('/profile');
        } else {
            setShowModal(true);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        setIsLoggedIn(false);
        navigate('/');
    };

    const handleSuccessfulLogin = (userData) => {
        setUser(userData);
        setIsLoggedIn(true);
        setShowModal(false);
    };

    return (
        <div className="auth-container">
            <div className="profile-icon" onClick={handleProfileClick}>
                {isLoggedIn ? '👤' : '🚪'}
            </div>
            {isLoggedIn && (
                <>
                    <span className="user-login">{user?.login}</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </>
            )}
            {showModal && (
                <AuthModal 
                    onClose={() => setShowModal(false)} 
                    onLoginSuccess={handleSuccessfulLogin}
                />
            )}
        </div>
    );
};

const AuthModal = ({ onClose, onLoginSuccess }) => {
    const [isRegister, setIsRegister] = useState(true);
    const [login, setLogin] = useState('');
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
                if (!login || login.length < 3) {
                    throw new Error("Login must be at least 3 characters");
                }
                
                if (!password || password.length < 6) {
                    throw new Error("Password must be at least 6 characters");
                }
                
                if (password !== confirmPassword) {
                    throw new Error("Passwords don't match");
                }
                
                // РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ
                const data = await createUser({ login, password });
                
                // УСПЕШНАЯ РЕГИСТРАЦИЯ
                alert('Registration successful! Please log in.');
                // Переключаем на форму входа
                setIsRegister(false);
                // Очищаем только пароли, логин оставляем
                setPassword('');
                setConfirmPassword('');
                
            } else {
                // АВТОРИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ
                const data = await loginUser({ login, password });
                
                // УСПЕШНАЯ АВТОРИЗАЦИЯ
                console.log('Login successful:', data);
                
                // Сохраняем пользователя в localStorage
                localStorage.setItem('user', JSON.stringify({
                    id: data.user_id,
                    login: data.login,
                    description: data.description || ''
                }));
                
                // Оповещаем родительский компонент об успешной авторизации
                onLoginSuccess({
                    id: data.user_id,
                    login: data.login,
                    description: data.description || ''
                });
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
                <h2>{isRegister ? 'Register' : 'Login'}</h2>
                
                {error && (
                    <div className="error-message">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Login:</label>
                        <input
                            type="text"
                            placeholder="Enter login"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            required
                            disabled={loading}
                            className={error && !login ? 'input-error' : ''}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className={error && !password ? 'input-error' : ''}
                        />
                    </div>
                    
                    {isRegister && (
                        <div className="form-group">
                            <label>Confirm Password:</label>
                            <input
                                type="password"
                                placeholder="Confirm password"
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
                                <span className="spinner"></span> Processing...
                            </span>
                        ) : (
                            isRegister ? 'Register' : 'Login'
                        )}
                    </button>
                </form>
                
                <div className="switch-mode">
                    <button 
                        onClick={handleSwitchMode}
                        disabled={loading}
                        className="switch-btn"
                    >
                        {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
