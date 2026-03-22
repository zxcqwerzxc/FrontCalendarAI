import React, { useState, useEffect } from 'react';
import './TaskForm.css';

const TaskForm = ({ isOpen, onClose, onSubmit, selectedDate, initialData = null }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [priority, setPriority] = useState(3);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (selectedDate && typeof selectedDate === 'string') {
      setTaskDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setDueTime(initialData.due_time?.slice(0,5) || '');
      setTaskDate(initialData.task_date || '');
      setPriority(initialData.priority || 3);
    }
  }, [initialData]);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setDueTime('');
      setTaskDate(selectedDate || '');
      setPriority(3);
      setError('');
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Название задачи обязательно');
      return;
    }
    if (!taskDate) {
      setError('Укажите дату');
      return;
    }
    if (!dueTime) {
      setError('Укажите время');
      return;
    }
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(dueTime)) {
      setError('Время должно быть в формате ЧЧ:мм');
      return;
    }

    setError('');

    const newTask = {
      title: title.trim(),
      description: description.trim() || null,
      status: false,
      due_time: dueTime + ':00',
      task_date: taskDate,
      priority: parseInt(priority),
    };

    onSubmit(newTask, initialData?.id);
    onClose();
  };

  return (
    <div className="task-form-overlay">
      <div className="task-form-modal">
        <h2>{initialData ? 'Редактировать задачу' : 'Добавить задачу'}</h2>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Название <span className="required">*</span></label>
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
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="taskDate">Дата <span className="required">*</span></label>
            <input
              type="date"
              id="taskDate"
              value={taskDate}
              min={initialData ? undefined : today}
              onChange={(e) => setTaskDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dueTime">Время <span className="required">*</span></label>
            <input
              type="time"
              id="dueTime"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
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
            <button type="submit" className="submit-button">
              {initialData ? 'Сохранить' : 'Добавить'}
            </button>
            <button type="button" onClick={onClose} className="cancel-button">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;