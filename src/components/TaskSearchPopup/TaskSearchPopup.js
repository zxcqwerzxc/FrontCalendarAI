import React, { useMemo, useState } from 'react';
import './TaskSearchPopup.css';

const formatDateTime = (value) => {
    if (!value) return 'Не указано';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('ru-RU');
};

const formatPriority = (priority) => {
    if (priority === 1) return 'Высокий';
    if (priority === 2) return 'Средний';
    if (priority === 3) return 'Низкий';
    return 'Не указан';
};

const getTaskDue = (task) => task?.due_date || task?.due_time || task?.task_date || null;

const TaskSearchPopup = ({ isOpen, onClose, query, loading, results }) => {
    const [selectedTask, setSelectedTask] = useState(null);

    const normalizedResults = useMemo(() => {
        return (results || []).map((task) => ({
            ...task,
            _displayDue: getTaskDue(task),
        }));
    }, [results]);

    if (!isOpen) return null;

    return (
        <div className="task-search-overlay" onClick={onClose}>
            <div className="task-search-modal" onClick={(e) => e.stopPropagation()}>
                <div className="task-search-header">
                    <h2>Поиск по названию задачи</h2>
                    <button type="button" className="task-search-close" onClick={onClose}>×</button>
                </div>

                <div className="task-search-info">
                    <div className="task-search-query">
                        Поиск по названию: <strong>{query || '—'}</strong>
                    </div>
                    <div className="task-search-count">
                        Найдено задач: <strong>{normalizedResults.length}</strong>
                    </div>
                </div>

                {loading ? (
                    <div className="task-search-empty">Поиск...</div>
                ) : normalizedResults.length === 0 ? (
                    <div className="task-search-empty">Задачи не найдены</div>
                ) : (
                    <div className="task-search-list">
                        {normalizedResults.map((task) => (
                            <button
                                key={task.id}
                                type="button"
                                className="task-search-item"
                                onClick={() => setSelectedTask(task)}
                            >
                                <div className="task-search-item-top">
                                    <span className="task-search-title">{task.title || 'Без названия'}</span>
                                    <span className={`task-search-status ${task.status ? 'done' : 'pending'}`}>
                                        {task.status ? '✓' : '○'}
                                    </span>
                                </div>
                                <div className="task-search-meta">
                                    <span>Дата: {formatDateTime(task._displayDue)}</span>
                                    <span> • Приоритет: {formatPriority(task.priority)}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedTask && (
                <div className="task-detail-overlay" onClick={() => setSelectedTask(null)}>
                    <div className="task-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="task-detail-header">
                            <h3>{selectedTask.title || 'Без названия'}</h3>
                            <button type="button" className="task-search-close" onClick={() => setSelectedTask(null)}>
                                ×
                            </button>
                        </div>
                        <div className="task-detail-grid">
                            <div><strong>ID:</strong> {selectedTask.id}</div>
                            <div><strong>Статус:</strong> {selectedTask.status ? 'Выполнено' : 'Не выполнено'}</div>
                            <div><strong>Приоритет:</strong> {formatPriority(selectedTask.priority)}</div>
                            <div><strong>Срок:</strong> {formatDateTime(getTaskDue(selectedTask))}</div>
                            <div><strong>Создано:</strong> {formatDateTime(selectedTask.created_at)}</div>
                        </div>
                        <div className="task-detail-description">
                            <strong>Описание:</strong>
                            <p>{selectedTask.description || 'Описание отсутствует'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskSearchPopup;

