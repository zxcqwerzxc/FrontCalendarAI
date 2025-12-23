import React, { useState } from 'react';
import './CalendarPage.css';
import Calendar from '../../components/Calendar/Calendar';
import TaskForm from '../../components/TaskForm/TaskForm'; 
import { createTask } from '../../utils/api'; 

const CalendarPage = () => {
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false); 
    const [refreshCalendar, setRefreshCalendar] = useState(false); 

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
            setRefreshCalendar(prev => !prev); 
        } catch (error) {
            console.error("Ошибка при создании задачи:", error);
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
                <Calendar refresh={refreshCalendar} /> 
            </div>
            <TaskForm 
                isOpen={isTaskFormOpen} 
                onClose={handleCloseTaskForm} 
                onSubmit={handleTaskSubmit} 
            />
        </div>
    );
};

export default CalendarPage;