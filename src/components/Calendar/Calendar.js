import React, { useState, useEffect } from 'react';
import './Calendar.css';
import { fetchTasks } from '../../utils/api'; 
import { useAuth } from '../../context/AuthContext';

const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const months = [
    'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
    'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
];

const Calendar = ({ refresh, onDayClick, onTasksLoaded }) => { 
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState({}); 
    const { user } = useAuth();

    useEffect(() => {
        // Если пользователь не авторизован, не загружаем задачи
        if (!user) {
            setTasks({});
            if (onTasksLoaded) {
                onTasksLoaded({});
            }
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0); 

        fetchTasks(startDate, endDate).then(data => {
            setTasks(data);
            if (onTasksLoaded) {
                onTasksLoaded(data);
            }
        }).catch(error => {
            console.error('Error fetching tasks:', error);
        });
    }, [currentDate, refresh, user]); 

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const renderHeader = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        return (
            <div className="calendar-header">
                 <button onClick={() => changeMonth(-1)}>{'<'}</button>
                <select
                    value={month}
                    onChange={(e) => changeMonth(0, parseInt(e.target.value))}
                >
                    {months.map((m, index) => (
                        <option key={m} value={index}>{m}</option>
                    ))}
                </select>
                <select
                    value={year}
                    onChange={(e) => changeYear(parseInt(e.target.value))}
                >
                    {Array.from({ length: 10 }, (_, i) => year - 5 + i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
                <button onClick={() => changeMonth(1)}>{'>'}</button>
            </div>
        );
    };

    const renderDaysOfWeek = () => {
        return (
            <div className="days-of-week">
                {daysOfWeek.map(day => <div key={day}>{day}</div>)}
            </div>
        );
    };

    const renderCells = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const numDays = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const cells = [];

        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="empty-cell"></div>);
        }

        for (let day = 1; day <= numDays; day++) {
            // Используем локальные компоненты даты, чтобы избежать сдвига из-за часового пояса
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = tasks[dateString] || [];

            const priorityIndicators = [];
            const highPriorityTasks = dayTasks.filter(task => task.priority === 1);
            const mediumPriorityTasks = dayTasks.filter(task => task.priority === 2);
            const lowPriorityTasks = dayTasks.filter(task => task.priority === 3);

            if (highPriorityTasks.length > 0) {
                priorityIndicators.push({ priority: 1, count: highPriorityTasks.length, earliestTime: Math.min(...highPriorityTasks.map(t => new Date(t.task_time).getTime())) });
            }
            if (mediumPriorityTasks.length > 0) {
                priorityIndicators.push({ priority: 2, count: mediumPriorityTasks.length, earliestTime: Math.min(...mediumPriorityTasks.map(t => new Date(t.task_time).getTime())) });
            }
            if (lowPriorityTasks.length > 0) {
                priorityIndicators.push({ priority: 3, count: lowPriorityTasks.length, earliestTime: Math.min(...lowPriorityTasks.map(t => new Date(t.task_time).getTime())) });
            }

            // Сортируем индикаторы по самому раннему времени задачи
            priorityIndicators.sort((a, b) => a.earliestTime - b.earliestTime);

            const isToday = day === new Date().getDate() &&
                            month === new Date().getMonth() &&
                            year === new Date().getFullYear();
            const isSelected = day === currentDate.getDate() &&
                                month === currentDate.getMonth() &&
                                year === currentDate.getFullYear();
            
            cells.push(
                <div 
                    key={day} 
                    className={`calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectDate(day)}
                >
                    <span className="day-number">{day}</span> 
                    {dayTasks.length > 0 && (
                        <>
                            <div className="total-tasks-count" title={`Всего задач: ${dayTasks.length}`}>
                                {dayTasks.length}
                            </div>
                            <div className="priority-indicators">
                                {priorityIndicators.map((indicator) => (
                                    <span 
                                        key={indicator.priority} 
                                        className={`priority-badge priority-${indicator.priority === 1 ? 'high' : indicator.priority === 2 ? 'medium' : 'low'}`}
                                        title={`${indicator.count} задача(и) с ${indicator.priority === 1 ? 'высоким' : indicator.priority === 2 ? 'средним' : 'низким'} приоритетом`}
                                    >
                                        {indicator.count}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            );
        }

        return <div className="calendar-grid">{cells}</div>;
    };

    const changeMonth = (offset, newMonth = null) => {
        const newDate = new Date(currentDate);
        if (newMonth !== null) {
            newDate.setMonth(newMonth);
        } else {
            newDate.setMonth(newDate.getMonth() + offset);
        }
        setCurrentDate(newDate);
    };

    const changeYear = (newYear) => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(newYear);
        setCurrentDate(newDate);
    };

    const selectDate = (day) => {
        const newDate = new Date(currentDate);
        newDate.setDate(day);
        setCurrentDate(newDate);

        // Сообщаем наружу выбранную дату (в формате YYYY-MM-DD)
        // Используем локальные компоненты даты, чтобы избежать сдвига из-за часового пояса
        if (onDayClick) {
            const year = newDate.getFullYear();
            const month = String(newDate.getMonth() + 1).padStart(2, '0');
            const dayStr = String(newDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${dayStr}`;
            onDayClick(dateString);
        }
    };

    return (
        <div className="calendar">
            {renderHeader()}
            {renderDaysOfWeek()}
            {renderCells()}
        </div>
    );
};

export default Calendar;
