import React, { useState } from 'react';
import './CalendarPage.css';
import Calendar from '../../components/Calendar/Calendar';
import TaskForm from '../../components/TaskForm/TaskForm'; 
import DayTasksPopup from '../../components/DayTasksPopup/DayTasksPopup';
import TaskSearchPopup from '../../components/TaskSearchPopup/TaskSearchPopup';
import { createTask, deleteTask, updateTask, searchTasksByTitle } from '../../utils/api'; 

const CalendarPage = () => {
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false); 
    const [refreshCalendar, setRefreshCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [tasksByDate, setTasksByDate] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);

    const formatDateToString = (date) => {
        if (!date) return null;
        if (typeof date === 'string') return date;
        if (date instanceof Date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return null;
    };

    const handleDayClick = (date) => {
        const dateStr = formatDateToString(date);
        console.log('📅 Выбрана дата:', dateStr);
        setSelectedDate(dateStr);
    };

    const handleAddTaskClick = () => {
        setSelectedDate(null);
        setIsTaskFormOpen(true);
    };

    const handleCloseTaskForm = () => {
        setIsTaskFormOpen(false);
    };

    const handleTaskSubmit = async (newTask, taskId) => {
        try {
            if (taskId) {
                console.log('🔄 Обновление задачи:', taskId, newTask);
                await updateTask(taskId, newTask);
                console.log('✅ Задача обновлена');
            } else {
                console.log('➕ Создание задачи:', newTask);
                await createTask(newTask);
                console.log('✅ Задача создана');
            }
            
            setRefreshCalendar(prev => !prev);
            
        } catch (error) {
            console.error("❌ Ошибка при сохранении задачи:", error);
            alert('Не удалось сохранить задачу');
        } finally {
            setIsTaskFormOpen(false);
            setSelectedDate(null);
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await deleteTask(taskId);
            setRefreshCalendar(prev => !prev);
        } catch (error) {
            console.error("❌ Ошибка при удалении задачи:", error);
            alert('Ошибка при удалении задачи');
        }
    };

    const handleAddTaskFromPopup = (date) => {
        const dateStr = formatDateToString(date);
        console.log('📝 Добавление задачи для даты:', dateStr);
        setSelectedDate(dateStr);
        setIsTaskFormOpen(true);
    };

    const handleUpdateTask = async (taskId, updatedData) => {
        try {
            await updateTask(taskId, updatedData);
            setRefreshCalendar(prev => !prev);
        } catch (error) {
            console.error("❌ Ошибка при обновлении задачи:", error);
            alert('Ошибка при обновлении задачи');
            throw error;
        }
    };

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        const normalized = searchQuery.trim();
        if (!normalized) {
            setSearchResults([]);
            setIsSearchPopupOpen(true);
            return;
        }

        setIsSearchLoading(true);
        setIsSearchPopupOpen(true);
        try {
            const results = await searchTasksByTitle(normalized, 20);
            setSearchResults(results || []);
        } catch (error) {
            console.error("❌ Ошибка при поиске задач:", error);
            setSearchResults([]);
            alert('Ошибка при поиске задач');
        } finally {
            setIsSearchLoading(false);
        }
    };

    return (
        <div className="calendar-page">
            <header className="main-header">
                <h1>Календарь & ИИ</h1>
                <div className="header-actions">
                    <form className="task-search-form" onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Поиск задачи по названию"
                            className="task-search-input"
                        />
                        <button type="submit" className="task-search-button">Поиск</button>
                    </form>
                    <button className="add-task-button" onClick={handleAddTaskClick}>
                        <span className="add-icon">+</span> добавить задачу
                    </button>
                </div>
            </header>
            <div className="calendar-container">
                <Calendar
                    refresh={refreshCalendar}
                    onDayClick={handleDayClick}
                    onTasksLoaded={setTasksByDate}
                /> 
            </div>
            <DayTasksPopup
                date={selectedDate}
                tasks={selectedDate ? (tasksByDate[selectedDate] || []) : []}
                onClose={() => setSelectedDate(null)}
                onAddTask={handleAddTaskFromPopup}
                onDeleteTask={handleDeleteTask}
                onUpdateTask={handleUpdateTask}
            />
            <TaskForm 
                isOpen={isTaskFormOpen} 
                onClose={handleCloseTaskForm} 
                onSubmit={handleTaskSubmit}
                selectedDate={selectedDate}
            />
            <TaskSearchPopup
                isOpen={isSearchPopupOpen}
                onClose={() => setIsSearchPopupOpen(false)}
                query={searchQuery}
                loading={isSearchLoading}
                results={searchResults}
            />
        </div>
    );
};

export default CalendarPage;