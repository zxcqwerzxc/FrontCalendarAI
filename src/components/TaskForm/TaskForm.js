import React, { useState, useEffect } from 'react';
import './TaskForm.css';

const TaskForm = ({ isOpen, onClose, onSubmit, selectedDate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(false);
    const [dueTime, setDueTime] = useState(''); // Время, до которого актуальна задача (только время, не дата)
    const [taskDate, setTaskDate] = useState(selectedDate || ''); // Дата, на какой день задача
    const [priority, setPriority] = useState(3);

    // Обновляем taskDate при изменении selectedDate
    useEffect(() => {
        if (selectedDate) {
            setTaskDate(selectedDate);
        }
    }, [selectedDate]);

    // Сбрасываем форму при закрытии
    useEffect(() => {
        if (!isOpen) {
            setTitle('');
            setDescription('');
            setStatus(false);
            setDueTime('');
            setTaskDate(selectedDate || '');
            setPriority(3);
        }
    }, [isOpen, selectedDate]); 

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const newTask = {
            title: title || null,
            description: description || null,
            status: status || null,
            due_time: dueTime || null, // Время в формате HH:mm:ss
            task_date: taskDate || null, // Дата в формате YYYY-MM-DD
            priority: priority ? parseInt(priority) : null,
            // created_at не отправляем - бэкенд сам заполняет
        };
        onSubmit(newTask);
        setTitle('');
        setDescription('');
        setStatus(false);
        setDueTime('');
        setTaskDate('');
        setPriority(3);
    };

    return (
        <div className="task-form-overlay">
            <div className="task-form-modal">
                <h2>Добавить задачу</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Название</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Описание</label>
                        <textarea
                            id="description"                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>
                    <div className="form-group checkbox-group">
                        <input
                            type="checkbox"
                            id="status"
                            checked={status}
                            onChange={(e) => setStatus(e.target.checked)}
                        />
                        <label htmlFor="status">Выполнено</label>
                    </div>
                    <div className="form-group">
                        <label htmlFor="taskDate">День для выполнения задания (который на календаре)</label> 
                        <input
                            type="date" 
                            id="taskDate"
                            value={taskDate}
                            onChange={(e) => setTaskDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="dueTime">Время, до которого актуальна задача</label>
                        <input
                            type="time" 
                            id="dueTime"
                            value={dueTime}
                            onChange={(e) => setDueTime(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="priority">Приоритет</label>
                        <select
                            id="priority"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value={1}>Высокий</option>
                            <option value={2}>Средний</option>
                            <option value={3}>Низкий</option>
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="submit-button">Добавить</button>
                        <button type="button" onClick={onClose} className="cancel-button">Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskForm;