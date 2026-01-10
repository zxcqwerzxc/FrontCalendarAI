import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import './App.css';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar/Sidebar';
import AuthModal from './components/Auth/AuthModal';
import CalendarPage from './pages/CalendarPage/CalendarPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import ChatPage from './pages/Chat/ChatPage';

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Sidebar onProfileClick={() => setShowAuthModal(true)} />
          <Routes>
            <Route path="/" element={<CalendarPage />} />
            <Route path="/profile" element={<ProfilePage/>} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
          
          {/* Модальное окно авторизации */}
          {showAuthModal && (
            <AuthModal 
              onClose={() => setShowAuthModal(false)} 
            />
          )}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
