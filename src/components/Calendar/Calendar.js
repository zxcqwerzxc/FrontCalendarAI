import React, { useState, useEffect } from 'react';
import './Calendar.css';
import { fetchTasks } from '../../utils/api'; 

const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const months = [
    'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
    'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
];

const Calendar = ({ refresh }) => { 
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState({}); 

    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0); 

        fetchTasks(startDate, endDate).then(data => {
            setTasks(data);
        });
    }, [currentDate, refresh]); 

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
                 <button onClick={() => changeMonth(-1)}>&lt;</button>
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
                <button onClick={() => changeMonth(1)}>&gt;</button>
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
            const dateString = new Date(year, month, day).toISOString().slice(0, 10);
            const dayTasks = tasks[dateString] || [];

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
                        <ul className="task-list">
                            {dayTasks.map((task, index) => (
                                <li 
                                    key={index} 
                                    className={`task-item priority-${task.priority}`} 
                                >
                                    {task.title} 
                                    {task.task_date && (
                                        <span className="task-time">
                                            {new Date(task.task_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
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