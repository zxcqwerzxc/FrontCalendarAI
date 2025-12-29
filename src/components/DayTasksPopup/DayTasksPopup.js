import React, { useState, useEffect } from 'react';
import './DayTasksPopup.css';

const DayTasksPopup = ({ date, tasks, onClose, onAddTask, onDeleteTask, onTaskDoubleClick, onUpdateTask }) => {
    const [selectedTask, setSelectedTask] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        status: false,
        due_time: '',
        priority: 3,
        task_date: ''
    });

    // Отладка: логируем состояние формы при изменении
    useEffect(() => {
        if (isEditing) {
            console.log('Режим редактирования активен');
            console.log('Выбранная задача:', selectedTask);
            console.log('Данные формы:', editForm);
        }
    }, [isEditing, selectedTask, editForm]);

    if (!date) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        // Если это только дата в формате YYYY-MM-DD
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('ru-RU', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            });
        }
        // Иначе парсим как дату+время
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (timeValue) => {
        if (!timeValue) return '';
        
        // Если это объект времени (например, из Python time)
        if (typeof timeValue === 'object' && timeValue !== null) {
            // Проверяем наличие свойств hour, minute, second
            if ('hour' in timeValue && 'minute' in timeValue) {
                const hours = String(timeValue.hour || 0).padStart(2, '0');
                const minutes = String(timeValue.minute || 0).padStart(2, '0');
                return `${hours}:${minutes}`;
            }
            // Если это объект Date
            if (timeValue instanceof Date) {
                return timeValue.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            }
        }
        
        // Если это строка
        if (typeof timeValue === 'string') {
            // Убираем лишние пробелы
            const trimmed = timeValue.trim();
            if (trimmed) {
                const parts = trimmed.split(':');
                if (parts.length >= 2) {
                    // Форматируем часы и минуты с ведущими нулями
                    const hours = parts[0].padStart(2, '0');
                    const minutes = parts[1].padStart(2, '0');
                    return `${hours}:${minutes}`;
                }
            }
        }
        
        return String(timeValue);
    };

    // Функция для преобразования времени в формат HH:mm для input type="time"
    const formatTimeForInput = (timeValue) => {
        if (!timeValue) return '';
        const formatted = formatTime(timeValue);
        // Убеждаемся, что формат правильный для input type="time" (HH:mm)
        if (formatted && formatted.match(/^\d{2}:\d{2}$/)) {
            return formatted;
        }
        // Если формат другой, пытаемся извлечь часы и минуты
        const parts = String(timeValue).split(':');
        if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
        return '';
    };

    // Функция для форматирования даты для input type="date"
    const formatDateForInput = (dateValue) => {
        if (!dateValue) return '';
        // Если это уже строка в формате YYYY-MM-DD
        if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
            return dateValue.slice(0, 10);
        }
        // Иначе пытаемся распарсить дату
        try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (e) {
            console.error('Ошибка при форматировании даты:', e);
        }
        return '';
    };

    const handleTaskDoubleClick = (task) => {
        if (onTaskDoubleClick) {
            onTaskDoubleClick(task);
        } else {
            setSelectedTask(task);
            setIsEditing(false);
            // Заполняем форму текущими значениями задачи
            const formData = {
                title: task.title || '',
                description: task.description || '',
                status: task.status || false,
                due_time: formatTimeForInput(task.due_time),
                priority: task.priority || 3,
                task_date: formatDateForInput(task.task_date)
            };
            console.log('handleTaskDoubleClick: Выбранная задача:', task);
            console.log('handleTaskDoubleClick: Данные формы (после установки):', formData);
            setEditForm(formData);

        }
    };

    const handleEditClick = (task, e) => {
        e.stopPropagation();
        const formData = {
            title: task.title || '',
            description: task.description || '',
            status: task.status || false,
            due_time: formatTimeForInput(task.due_time),
            priority: task.priority || 3,
            task_date: formatDateForInput(task.task_date)
        };
        console.log('Редактирование задачи:', task);
        console.log('Данные формы:', formData);
        console.log('handleEditClick: Выбранная задача:', task);
        console.log('handleEditClick: Данные формы (после установки):', formData);
        setSelectedTask(task);
        setEditForm(formData);
        setIsEditing(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!selectedTask || !selectedTask.id) return;

        try {
            if (onUpdateTask) {
                await onUpdateTask(selectedTask.id, editForm);
                setIsEditing(false);
                setSelectedTask(null);
            }
        } catch (error) {
            console.error("Ошибка при сохранении изменений:", error);
            alert('Ошибка при сохранении изменений');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setSelectedTask(null);
    };

    const handleStartEdit = () => {
        if (selectedTask) {
            // Заполняем форму текущими значениями задачи перед открытием редактирования
            const formData = {
                title: selectedTask.title || '',
                description: selectedTask.description || '',
                status: selectedTask.status || false,
                due_time: formatTimeForInput(selectedTask.due_time),
                priority: selectedTask.priority || 3,
                task_date: formatDateForInput(selectedTask.task_date)
            };
            console.log('Начало редактирования:', selectedTask);
            console.log('Данные формы:', formData);
            setEditForm(formData);
            setIsEditing(true);
        }
    };

    const handleDeleteTask = async (taskId, e) => {
        e.stopPropagation();
        if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
            if (onDeleteTask) {
                await onDeleteTask(taskId);
            }
        }
    };

    const handleAddTask = (e) => {
        e.stopPropagation();
        if (onAddTask) {
            onAddTask(date);
        }
    };

    return (
        <>
            <div className="day-tasks-overlay" onClick={onClose}>
                <div className="day-tasks-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="day-tasks-header">
                        <h2>Задачи на {date}</h2>
                        <button className="close-button" onClick={onClose}>×</button>
                    </div>
                    {(!tasks || tasks.length === 0) ? (
                        <div className="day-tasks-empty">
                            <p>На этот день задач нет</p>
                            <button className="add-task-btn" onClick={handleAddTask}>
                                + Добавить задачу
                            </button>
                        </div>
                    ) : (
                        <>
                            <ul className="day-tasks-list">
                                {[...tasks]
                                    // Сортируем задачи по приоритету: сначала высокий (1), потом средний (2), потом низкий (3)
                                    .sort((a, b) => {
                                        const priorityA = a.priority || 3; // Если приоритет не указан, считаем низким
                                        const priorityB = b.priority || 3;
                                        return priorityA - priorityB; // Сортировка по возрастанию: 1, 2, 3
                                    })
                                    .map((task, index) => {
                                        // Определяем класс приоритета для фона
                                        const priorityClass = `priority-${task.priority || 3}`;
                                        return (
                                            <li 
                                                key={task.id || index} 
                                                className={`day-task-item ${priorityClass}`}
                                                onDoubleClick={() => handleTaskDoubleClick(task)}
                                            >
                                                <div className="day-task-main">
                                                    <div className="day-task-title">{task.title}</div>
                                                    <div className="day-task-actions">
                                                        {task.due_time && (
                                                            <div className="day-task-time">
                                                                {formatTime(task.due_time)}
                                                            </div>
                                                        )}
                                                        <button 
                                                            className="edit-task-btn"
                                                            onClick={(e) => handleEditClick(task, e)}
                                                            title="Редактировать задачу"
                                                        >
                                                            ✎
                                                        </button>
                                                        <button 
                                                            className="delete-task-btn"
                                                            onClick={(e) => handleDeleteTask(task.id, e)}
                                                            title="Удалить задачу"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </div>
                                                {task.description && (
                                                    <div className="day-task-description">{task.description}</div>
                                                )}
                                            </li>
                                        );
                                    })}
                            </ul>
                            <div className="day-tasks-footer">
                                <button className="add-task-btn" onClick={handleAddTask}>
                                    + Добавить задачу
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {selectedTask && (
                <div className="task-detail-overlay" onClick={isEditing ? undefined : () => setSelectedTask(null)}>
                    <div className="task-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="task-detail-header">
                            <h2>{isEditing ? 'Редактировать задачу' : selectedTask.title}</h2>
                            <button className="close-button" onClick={isEditing ? handleCancelEdit : () => setSelectedTask(null)}>×</button>
                        </div>
                        {isEditing ? (
                            <form onSubmit={handleSaveEdit} className="task-edit-form">
                                <div className="form-group">
                                    <label htmlFor="edit-title">Название</label>
                                    <input
                                        type="text"
                                        id="edit-title"
                                        value={editForm.title || ''}
                                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                        required
                                        placeholder="Введите название задачи"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="edit-description">Описание</label>
                                    <textarea
                                        id="edit-description"
                                        value={editForm.description || ''}
                                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                        placeholder="Введите описание задачи"
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="edit-task-date">Дата выполнения</label>
                                    <input
                                        type="date"
                                        id="edit-task-date"
                                        value={editForm.task_date || ''}
                                        onChange={(e) => setEditForm({...editForm, task_date: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="edit-due-time">Время актуальности</label>
                                    <input
                                        type="time"
                                        id="edit-due-time"
                                        value={editForm.due_time || ''}
                                        onChange={(e) => setEditForm({...editForm, due_time: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="edit-priority">Приоритет</label>
                                    <select
                                        id="edit-priority"
                                        value={editForm.priority || 3}
                                        onChange={(e) => setEditForm({...editForm, priority: parseInt(e.target.value)})}
                                    >
                                        <option value={1}>Высокий</option>
                                        <option value={2}>Средний</option>
                                        <option value={3}>Низкий</option>
                                    </select>
                                </div>
                                <div className="form-group checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="edit-status"
                                        checked={editForm.status || false}
                                        onChange={(e) => setEditForm({...editForm, status: e.target.checked})}
                                    />
                                    <label htmlFor="edit-status">Выполнено</label>
                                </div>
                                <div className="task-detail-footer">
                                    <button type="submit" className="save-button">Сохранить</button>
                                    <button type="button" onClick={handleCancelEdit} className="cancel-button">Отмена</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="task-detail-content">
                                    {selectedTask.description && (
                                        <div className="task-detail-section">
                                            <h3>Описание:</h3>
                                            <p>{selectedTask.description}</p>
                                        </div>
                                    )}
                                    {selectedTask.task_date && (
                                        <div className="task-detail-section">
                                            <h3>Дата выполнения:</h3>
                                            <p>{formatDate(selectedTask.task_date)}</p>
                                        </div>
                                    )}
                                    {(() => {
                                        // Проверяем наличие due_time более надежно
                                        const dueTime = selectedTask.due_time;
                                        const hasDueTime = dueTime !== null && 
                                                          dueTime !== undefined && 
                                                          dueTime !== '' && 
                                                          String(dueTime).trim() !== '';
                                        
                                        if (hasDueTime) {
                                            const formattedTime = formatTime(dueTime);
                                            return (
                                                <div className="task-detail-section">
                                                    <h3>Время актуальности:</h3>
                                                    <p style={{ fontSize: '16px', fontWeight: '500', color: '#007bff' }}>
                                                        {formattedTime || 'Не удалось отформатировать время'}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                    <div className="task-detail-section">
                                        <h3>Приоритет:</h3>
                                        <p>
                                            {selectedTask.priority === 1 ? 'Высокий' : 
                                             selectedTask.priority === 2 ? 'Средний' : 'Низкий'}
                                        </p>
                                    </div>
                                    <div className="task-detail-section">
                                        <h3>Статус:</h3>
                                        <p>{selectedTask.status ? 'Выполнено' : 'Не выполнено'}</p>
                                    </div>
                                </div>
                                <div className="task-detail-footer">
                                    <button className="edit-button" onClick={handleStartEdit}>Редактировать</button>
                                    <button className="close-button" onClick={() => setSelectedTask(null)}>Закрыть</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default DayTasksPopup;




