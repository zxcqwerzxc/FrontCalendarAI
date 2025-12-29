import React, { useState } from 'react';
import './CalendarPage.css';
import Calendar from '../../components/Calendar/Calendar';
import TaskForm from '../../components/TaskForm/TaskForm'; 
import DayTasksPopup from '../../components/DayTasksPopup/DayTasksPopup';
import { createTask, deleteTask, updateTask } from '../../utils/api'; 

const CalendarPage = () => {
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false); 
    const [refreshCalendar, setRefreshCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null); // дата, по которой открываем попап/форму
    const [tasksByDate, setTasksByDate] = useState({}); // задачи, сгруппированные по датам

    const handleAddTaskClick = () => {
        setIsTaskFormOpen(true);
    };

    const handleCloseTaskForm = () => {
        setIsTaskFormOpen(false);
    };

    const handleTaskSubmit = async (newTask) => {
        try {
            await createTask(newTask);
            setIsTaskFormOpen(false);
            setSelectedDate(null); // Закрываем попап после добавления задачи
            setRefreshCalendar(prev => !prev); 
        } catch (error) {
            console.error("Ошибка при создании задачи:", error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await deleteTask(taskId);
            setRefreshCalendar(prev => !prev); // Обновляем календарь после удаления
        } catch (error) {
            console.error("Ошибка при удалении задачи:", error);
            alert('Ошибка при удалении задачи');
        }
    };

    const handleAddTaskFromPopup = (date) => {
        setSelectedDate(date); // Устанавливаем дату
        setIsTaskFormOpen(true); // Открываем форму
    };

    const handleUpdateTask = async (taskId, updatedData) => {
        try {
            await updateTask(taskId, updatedData);
            setRefreshCalendar(prev => !prev); // Обновляем календарь после обновления задачи
        } catch (error) {
            console.error("Ошибка при обновлении задачи:", error);
            alert('Ошибка при обновлении задачи');
            throw error; // Пробрасываем ошибку, чтобы форма могла обработать её
        }
    };

    return (
        <div className="calendar-page">
            <header className="main-header">
                <h1>каледнарь & ИИ</h1>
                <button className="add-task-button" onClick={handleAddTaskClick}>
                    <span className="add-icon">+</span> добавить задачу
                </button>
            </header>
            <div className="calendar-container">
                <Calendar
                    refresh={refreshCalendar}
                    onDayClick={setSelectedDate}  /* клик по дню устанавливает выбранную дату */
                    onTasksLoaded={setTasksByDate} /* сохраняем задачи по датам для попапа */
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
        </div>
    );
};

export default CalendarPage;