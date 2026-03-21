import React, { useState, useEffect } from 'react';
import './DayTasksPopup.css';

const DayTasksPopup = ({ date, tasks, onClose, onAddTask, onDeleteTask, onUpdateTask }) => {
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

    if (!date) return null;

    // ─── Утилиты форматирования ────────────────────────────────────────────────

    const formatDateForDisplay = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const formatTimeForDisplay = (timeValue) => {
        if (!timeValue) return '';
        let timeStr = typeof timeValue === 'string' ? timeValue.trim() : '';

        if (typeof timeValue === 'object' && timeValue?.hour !== undefined) {
            timeStr = `${String(timeValue.hour).padStart(2, '0')}:${String(timeValue.minute).padStart(2, '0')}`;
        }

        const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
        if (match) {
            return `${match[1].padStart(2, '0')}:${match[2]}`;
        }
        return timeStr || '';
    };

    const formatTimeForInput = (timeValue) => {
        return formatTimeForDisplay(timeValue); // input type="time" ожидает HH:mm
    };

    const formatDateForInput = (dateValue) => {
        if (!dateValue) return '';
        try {
            const d = new Date(dateValue);
            if (!isNaN(d)) {
                return d.toISOString().slice(0, 10);
            }
        } catch {}
        // если уже строка YYYY-MM-DD
        if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
            return dateValue.slice(0, 10);
        }
        return '';
    };

    // ─── Обработчики ───────────────────────────────────────────────────────────

    const openEditForm = (task) => {
        if (!task) return;

        const formData = {
            title: task.title || '',
            description: task.description || '',
            status: !!task.status,
            due_time: formatTimeForInput(task.due_time || task.task_time),
            priority: Number(task.priority) || 3,
            task_date: formatDateForInput(task.task_date || task.due_time || task.created_at)
        };

        setEditForm(formData);
        setSelectedTask(task);
        setIsEditing(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!selectedTask?.id) return;

        const dataToSend = {
            title: editForm.title.trim() || null,
            description: editForm.description.trim() || null,
            status: !!editForm.status,
            due_time: editForm.due_time ? `${editForm.due_time}:00` : null,
            priority: Number(editForm.priority) || null,
            // task_date обычно не меняется при редактировании, но можно передать
            task_date: editForm.task_date || null
        };

        try {
            await onUpdateTask(selectedTask.id, dataToSend);
            alert('Задача успешно обновлена!');
            console.log('Задача обновлена:', selectedTask.id, dataToSend);
            setIsEditing(false);
            setSelectedTask(null);
        } catch (err) {
            console.error('Ошибка обновления задачи:', err);
            alert('Не удалось обновить задачу\n' + (err.message || 'Неизвестная ошибка'));
        }
    };

    const handleDelete = async (taskId, e) => {
        e.stopPropagation();
        if (!window.confirm('Удалить задачу?')) return;

        try {
            await onDeleteTask(taskId);
            alert('Задача успешно удалена');
            console.log('Удалена задача:', taskId);
        } catch (err) {
            console.error('Ошибка удаления:', err);
            alert('Не удалось удалить задачу');
        }
    };

    const handleAdd = (e) => {
        e.stopPropagation();
        if (onAddTask) {
            onAddTask(date);
        }
    };

    // ─── Рендер ────────────────────────────────────────────────────────────────

    return (
        <>
            <div className="day-tasks-overlay" onClick={onClose}>
                <div className="day-tasks-modal" onClick={e => e.stopPropagation()}>
                    <div className="day-tasks-header">
                        <h2>Задачи на {date}</h2>
                        <button className="close-button" onClick={onClose}>×</button>
                    </div>

                    {(!tasks || tasks.length === 0) ? (
                        <div className="day-tasks-empty">
                            <p>На этот день задач нет</p>
                            <button className="add-task-btn" onClick={handleAdd}>
                                + Добавить задачу
                            </button>
                        </div>
                    ) : (
                        <>
                            <ul className="day-tasks-list">
                                {tasks.map(task => {
                                    const prioClass = `priority-${task.priority || 3}`;
                                    return (
                                        <li
                                            key={task.id}
                                            className={`day-task-item ${prioClass}`}
                                            onDoubleClick={() => openEditForm(task)}
                                        >
                                            <div className="day-task-main">
                                                <div className="day-task-title">{task.title || '(без названия)'}</div>
                                                <div className="day-task-actions">
                                                    {task.due_time && (
                                                        <span className="day-task-time">
                                                            {formatTimeForDisplay(task.due_time)}
                                                        </span>
                                                    )}
                                                    <button
                                                        className="edit-task-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditForm(task);
                                                        }}
                                                        title="Редактировать"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        className="delete-task-btn"
                                                        onClick={(e) => handleDelete(task.id, e)}
                                                        title="Удалить"
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
                                <button className="add-task-btn" onClick={handleAdd}>
                                    + Добавить задачу
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {isEditing && selectedTask && (
                <div className="task-detail-overlay" onClick={() => setIsEditing(false)}>
                    <div className="task-detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="task-detail-header">
                            <h2>Редактировать задачу</h2>
                            <button className="close-button" onClick={() => setIsEditing(false)}>×</button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="task-edit-form">
                            <div className="form-group">
                                <label htmlFor="edit-title">Название</label>
                                <input
                                    id="edit-title"
                                    value={editForm.title}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                    required
                                    placeholder="Название задачи"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="edit-desc">Описание</label>
                                <textarea
                                    id="edit-desc"
                                    value={editForm.description}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    placeholder="Подробности..."
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="edit-date">Дата</label>
                                <input
                                    type="date"
                                    id="edit-date"
                                    value={editForm.task_date}
                                    onChange={e => setEditForm({ ...editForm, task_date: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="edit-time">Время</label>
                                <input
                                    type="time"
                                    id="edit-time"
                                    value={editForm.due_time}
                                    onChange={e => setEditForm({ ...editForm, due_time: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="edit-priority">Приоритет</label>
                                <select
                                    id="edit-priority"
                                    value={editForm.priority}
                                    onChange={e => setEditForm({ ...editForm, priority: Number(e.target.value) })}
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
                                    checked={editForm.status}
                                    onChange={e => setEditForm({ ...editForm, status: e.target.checked })}
                                />
                                <label htmlFor="edit-status">Выполнено</label>
                            </div>

                            <div className="task-detail-footer">
                                <button type="submit" className="save-button">Сохранить</button>
                                <button type="button" className="cancel-button" onClick={() => setIsEditing(false)}>
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default DayTasksPopup;