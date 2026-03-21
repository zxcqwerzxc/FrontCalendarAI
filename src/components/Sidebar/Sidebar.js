import React from 'react';
import './Sidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ onProfileClick, onStatisticsClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleProfileClick = (e) => {
        if (!user) {
            e.preventDefault();
            if (onProfileClick) {
                onProfileClick();
            }
        }
    };

    const handleStatisticsClick = () => {
        // Если пользователь не авторизован — показываем модалку входа.
        if (!user) {
            if (onProfileClick) onProfileClick();
            return;
        }
        if (onStatisticsClick) onStatisticsClick();
    };

    const handleLogout = () => {
        logout();
        navigate('/'); // Редирект на календарь после выхода
    };

    return (
        <div className="sidebar">
            {/* Верхняя секция профиля — кликабельная */}
            <NavLink 
                to="/profile" 
                className="profile-link"
                onClick={handleProfileClick}
            >
                <div className="profile-section">
                    <div className="profile-icon">
                        👤
                    </div>
                    <div className="profile-text">
                        {user ? 'Профиль' : 'Войти'}
                    </div>
                </div>
            </NavLink>

            {/* Навигация — с большим отступом сверху */}
            <nav className="navigation">
                <ul>
                    <li>
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                `nav-button ${isActive ? 'active' : ''}`
                            }
                        >
                            📅 Календарь
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/chat"
                            className={({ isActive }) =>
                                `nav-button ${isActive ? 'active' : ''}`
                            }
                        >
                            💬 Чат
                        </NavLink>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="nav-button stats-button"
                            onClick={handleStatisticsClick}
                        >
                            📊 Статистика
                        </button>
                    </li>
                </ul>
            </nav>

            {/* Кнопка выхода в самом низу (только для авторизованных пользователей) */}
            {user && (
                <button className="logout-button" onClick={handleLogout}>
                    🚪 Выйти
                </button>
            )}
        </div>
    );
};

export default Sidebar;
