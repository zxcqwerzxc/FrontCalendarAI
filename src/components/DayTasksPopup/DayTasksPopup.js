import React, { useState } from 'react';
import './DayTasksPopup.css';

const DayTasksPopup = ({ date, tasks, onClose, onAddTask, onDeleteTask, onTaskDoubleClick }) => {
    const [selectedTask, setSelectedTask] = useState(null);

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

    const handleTaskDoubleClick = (task) => {
        if (onTaskDoubleClick) {
            onTaskDoubleClick(task);
        } else {
            setSelectedTask(task);
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
                <div className="task-detail-overlay" onClick={() => setSelectedTask(null)}>
                    <div className="task-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="task-detail-header">
                            <h2>{selectedTask.title}</h2>
                            <button className="close-button" onClick={() => setSelectedTask(null)}>×</button>
                        </div>
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
                            <button className="close-button" onClick={() => setSelectedTask(null)}>Закрыть</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DayTasksPopup;




