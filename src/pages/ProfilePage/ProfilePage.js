import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchUserParams, updateUserParams } from '../../utils/api'; // Добавляем импорты
import './ProfilePage.css';

const ProfilePage = () => {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false); // Новое состояние для кнопки "Сохранить"
  const [activeTab, setActiveTab] = useState('profile');
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Закрытие меню при клике вне области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowLogoutMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    console.log('ProfilePage useEffect triggered. authUser:', authUser); // Логирование authUser
    if (authUser) {
      setUser({
        ...authUser,
        lastActive: 'Только что',
      });
      const loadUserParams = async () => {
        if (!authUser.id) { // Добавлена проверка на authUser.id
          console.log('authUser.id is not available, skipping fetchUserParams.');
          setDescription('');
          return;
        }
        try {
          console.log('Fetching user params for user ID:', authUser.id); // Логирование user ID
          const params = await fetchUserParams(authUser.id);
          console.log('Fetched user params:', params); // Логирование полученных параметров
          setDescription(params || '');
        } catch (error) {
          console.error('Ошибка при загрузке описания профиля:', error);
          setDescription('');
        }
      };
      loadUserParams();
    } else {
      console.log('User not authenticated, navigating to /');
      navigate('/');
    }
    setIsLoading(false);
  }, [authUser, navigate]); // Добавил authUser в массив зависимостей

  const handleLogout = () => {
    logout();
    setShowLogoutMenu(false);
    navigate('/');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!oldPassword) {
      setMessage('❌ Введите текущий пароль');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('❌ Новый пароль должен быть не менее 6 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('❌ Пароли не совпадают');
      return;
    }
    if (oldPassword === newPassword) {
      setMessage('❌ Новый пароль не должен совпадать со старым');
      return;
    }

    try {
      setIsUpdatingPassword(true);

      const response = await fetch(`http://localhost:8000/api/v1/user/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          login: user.login,
          password: newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Ошибка изменения пароля');
      }

      setMessage('✅ Пароль успешно изменён!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDescriptionSave = async (e) => { // Делаем функцию асинхронной
    e.preventDefault();
    setMessage('');
    if (!authUser || !authUser.id) {
      setMessage('❌ Пользователь не авторизован.');
      return;
    }

    try {
      setIsSavingDescription(true); // Устанавливаем состояние загрузки
      await updateUserParams(authUser.id, description);
      setMessage('✅ Описание успешно сохранено!');
    } catch (error) {
      console.error('Ошибка при сохранении описания:', error);
      setMessage(`❌ Ошибка при сохранении описания: ${error.message}`);
    } finally {
      setIsSavingDescription(false); // Снимаем состояние загрузки
    }
  };

  const getInitials = (login) => {
    return login ? login.charAt(0).toUpperCase() : '?';
  };

  if (isLoading || !user) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  return (
    <div className="profile-fullscreen-container">
      <div className="profile-header-full">
        <div className="header-top">
          <div className="profile-avatar-big">{getInitials(user.login)}</div>

          <div className="user-info-with-menu" ref={menuRef}>
            <div
              className="user-name-wrapper"
              onClick={(e) => {
                e.stopPropagation();
                setShowLogoutMenu((prev) => !prev);
              }}
            >
              <h1>{user.login}</h1>
              <span className="dropdown-arrow">▼</span>
            </div>

            {showLogoutMenu && (
              <div className="profile-dropdown">
                <button
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="desktop-nav">
          <button
            className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Профиль
          </button>
          <button
            className={`nav-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            📊 Активность
          </button>
        </div>
      </div>

      <div className="profile-main-content">
        {message && (
          <div
            className={`message-full ${
              message.includes('✅') ? 'message-success' : 'message-error'
            }`}
          >
            {message}
          </div>
        )}

        {activeTab === 'profile' && (
          <>
            <div className="welcome-section">
              <h2>👋 Привет, {user.login}!</h2>
              <p>Это твой личный профиль</p>
            </div>

            {/* Основная информация */}
            <div className="content-section-full">
              <div className="section-title">
                <span className="icon">👤</span>
                <span>Основная информация</span>
              </div>

              <div className="form-group-full">
                <label className="form-label">Логин</label>
                <input
                  type="text"
                  className="form-input-full"
                  value={user.login}
                  readOnly
                />
              </div>

              <div className="form-group-full">
                <label className="form-label">Последняя активность</label>
                <input
                  type="text"
                  className="form-input-full"
                  value={user.lastActive}
                  readOnly
                />
              </div>
            </div>

            {/* Смена пароля */}
            <div className="content-section-full">
              <div className="section-title">
                <span className="icon">🔒</span>
                <span>Смена пароля</span>
              </div>

              <form onSubmit={handlePasswordChange}>
                <div className="form-group-full">
                  <label className="form-label">Текущий пароль</label>
                  <input
                    type="password"
                    className="form-input-full"
                    placeholder="Введите старый пароль"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    disabled={isUpdatingPassword}
                  />
                </div>

                <div className="form-group-full">
                  <label className="form-label">Новый пароль</label>
                  <input
                    type="password"
                    className="form-input-full"
                    placeholder="Минимум 6 символов"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isUpdatingPassword}
                  />
                </div>

                <div className="form-group-full">
                  <label className="form-label">Подтвердите новый пароль</label>
                  <input
                    type="password"
                    className="form-input-full"
                    placeholder="Повторите новый пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isUpdatingPassword}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-full"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? 'Изменение...' : 'Изменить пароль'}
                </button>
              </form>
            </div>

            {/* О себе */}
            <div className="content-section-full">
              <div className="section-title">
                <span className="icon">📝</span>
                <span>О себе</span>
              </div>

              <form onSubmit={handleDescriptionSave}>
                <div className="form-group-full">
                  <label className="form-label">Описание профиля</label>
                  <textarea
                    className="form-textarea-full"
                    placeholder="Расскажите немного о себе..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                  />
                </div>

                <button type="submit" className="btn-full" disabled={isSavingDescription}>
                  {isSavingDescription ? 'Сохранение...' : 'Сохранить'}
                </button>
              </form>
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <div className="content-section-full">
            <div className="section-title">
              <span className="icon">📊</span>
              <span>Активность</span>
            </div>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">👤</div>
                <div className="activity-content">
                  <div className="activity-title">Просмотр профиля</div>
                  <div className="activity-time">Только что</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
