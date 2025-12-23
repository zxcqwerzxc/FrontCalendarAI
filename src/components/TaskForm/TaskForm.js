import React, { useState } from 'react';
import './TaskForm.css';

const TaskForm = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(false);
    const [dueDate, setDueDate] = useState('');
    const [taskDate, setTaskDate] = useState(''); // Новое поле для task_date
    const [priority, setPriority] = useState(3); 

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        const created_at_formatted = new Date().toISOString().slice(0, 19); 
        
        const newTask = {
            title,
            description,
            status,
            due_date: dueDate, 
            created_at: created_at_formatted, 
            priority: parseInt(priority),
            task_date: taskDate ? `${taskDate}T00:00:00` : null, // Отправляем как 'YYYY-MM-DDTHH:mm:ss', если taskDate есть, иначе null
        };
        onSubmit(newTask);
        setTitle('');
        setDescription('');
        setStatus(false);
        setDueDate('');
        setTaskDate(''); // Сброс нового поля
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
                        <label htmlFor="dueDate">Срок выполнения (конечная дата и время)</label>
                        <input
                            type="datetime-local" 
                            id="dueDate"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            // required // Срок выполнения может быть необязательным
                        />
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