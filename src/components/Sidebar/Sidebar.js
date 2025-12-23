import React from 'react';
import './Sidebar.css';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <div className="profile-section">
                <span className="profile-icon"></span>
                <span className="profile-text">профиль</span>
            </div>
            <nav className="navigation">
                <ul>
                    <li><button className="nav-button active">календарь</button></li>
                    <li><button className="nav-button">чат</button></li>
                    <li><button className="nav-button">статистика</button></li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;