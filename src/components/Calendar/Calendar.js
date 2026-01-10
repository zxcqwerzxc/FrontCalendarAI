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
        console.log('Calendar useEffect triggered. User:', user, 'Refresh:', refresh);
        
        // Если пользователь не авторизован, не загружаем задачи
        if (!user) {
            console.log('User is not authenticated, returning empty tasks');
            setTasks({});
            if (onTasksLoaded) {
                onTasksLoaded({});
            }
            return;
        }

        console.log('Fetching tasks for user ID:', user.id, 'User:', user);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0); 
        console.log('Date range:', startDate, 'to', endDate);

        fetchTasks(startDate, endDate).then(data => {
            console.log('Tasks fetched successfully:', data);
            console.log('Task count:', data ? Object.keys(data).length : 0, 'dates');
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

            // Подсчитываем количество задач по приоритетам
            const priorityCounts = {
                high: dayTasks.filter(task => task.priority === 1).length,    // Красный - высокий приоритет
                medium: dayTasks.filter(task => task.priority === 2).length,  // Желтый - средний приоритет
                low: dayTasks.filter(task => task.priority === 3).length       // Зеленый - низкий приоритет
            };

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
                                {priorityCounts.high > 0 && (
                                    <span className="priority-badge priority-high" title={`${priorityCounts.high} задача(и) с высоким приоритетом`}>
                                        {priorityCounts.high}
                                    </span>
                                )}
                                {priorityCounts.medium > 0 && (
                                    <span className="priority-badge priority-medium" title={`${priorityCounts.medium} задача(и) со средним приоритетом`}>
                                        {priorityCounts.medium}
                                    </span>
                                )}
                                {priorityCounts.low > 0 && (
                                    <span className="priority-badge priority-low" title={`${priorityCounts.low} задача(и) с низким приоритетом`}>
                                        {priorityCounts.low}
                                    </span>
                                )}
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
