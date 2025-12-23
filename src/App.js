import React from 'react';
import './App.css';
import Sidebar from './components/Sidebar/Sidebar';
import CalendarPage from './pages/CalendarPage/CalendarPage';

function App() {
  return (
    <div className="App">
      <Sidebar />
      <CalendarPage />
    </div>
  );
}

export default App;
