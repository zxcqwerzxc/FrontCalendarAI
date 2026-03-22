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
    const [viewMode, setViewMode] = useState('month');
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setTasks({});
            if (onTasksLoaded) onTasksLoaded({});
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        fetchTasks(startDate, endDate).then(data => {
            setTasks(data);
            if (onTasksLoaded) onTasksLoaded(data);
        }).catch(error => {
            console.error('Error fetching tasks:', error);
        });
    }, [currentDate, refresh, user, onTasksLoaded]);

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
                <div className="view-toggle">
                    <button 
                        className={viewMode === 'month' ? 'active' : ''} 
                        onClick={() => setViewMode('month')}
                    >
                        📅 Месяц
                    </button>
                    <button 
                        className={viewMode === 'week' ? 'active' : ''} 
                        onClick={() => setViewMode('week')}
                    >
                        📆 Неделя
                    </button>
                </div>
                
                <div className="nav-controls">
                    <button onClick={() => changeMonth(-1)} className="nav-btn">←</button>
                    <div className="date-selectors">
                        <select value={month} onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value), 1))}>
                            {months.map((m, idx) => (
                                <option key={idx} value={idx}>{m}</option>
                            ))}
                        </select>
                        <select value={year} onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1))}>
                            {Array.from({ length: 7 }, (_, i) => year - 3 + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={() => changeMonth(1)} className="nav-btn">→</button>
                    <button onClick={goToToday} className="today-btn">Сегодня</button>
                </div>
            </div>
        );
    };

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const selectDate = (day) => {
        const newDate = new Date(currentDate);
        newDate.setDate(day);
        setCurrentDate(newDate);
        
        if (onDayClick) {
            const year = newDate.getFullYear();
            const month = String(newDate.getMonth() + 1).padStart(2, '0');
            const dayStr = String(newDate.getDate()).padStart(2, '0');
            onDayClick(`${year}-${month}-${dayStr}`);
        }
    };

    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const numDays = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const cells = [];

        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="empty-cell"></div>);
        }

        for (let day = 1; day <= numDays; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = tasks[dateString] || [];
            
            const highPriority = dayTasks.filter(t => t.priority === 1).length;
            const mediumPriority = dayTasks.filter(t => t.priority === 2).length;
            const lowPriority = dayTasks.filter(t => t.priority === 3 || !t.priority).length;
            const totalTasks = dayTasks.length;

            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const isSelected = day === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear();
            
            cells.push(
                <div 
                    key={day} 
                    className={`calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectDate(day)}
                >
                    <span className="day-number">{day}</span>
                    {totalTasks > 0 && (
                        <>
                            <div className="total-tasks" title={`Всего задач: ${totalTasks}`}>
                                {totalTasks}
                            </div>
                            <div className="priority-badges">
                                {highPriority > 0 && (
                                    <span className="badge high" title={`Высокий: ${highPriority}`}>
                                        {highPriority}
                                    </span>
                                )}
                                {mediumPriority > 0 && (
                                    <span className="badge medium" title={`Средний: ${mediumPriority}`}>
                                        {mediumPriority}
                                    </span>
                                )}
                                {lowPriority > 0 && (
                                    <span className="badge low" title={`Низкий: ${lowPriority}`}>
                                        {lowPriority}
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

    const renderWeekView = () => {
        const getWeekStart = (date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDay() === 0 ? 6 : day - 1;
            d.setDate(d.getDate() - diff);
            return d;
        };

        const getWeekDays = () => {
            const weekStart = getWeekStart(currentDate);
            const days = [];
            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                days.push(day);
            }
            return days;
        };

        const weekDays = getWeekDays();
        
        return (
            <div className="week-view">
                {weekDays.map((day, index) => {
                    const year = day.getFullYear();
                    const month = day.getMonth();
                    const dayNum = day.getDate();
                    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayTasks = tasks[dateString] || [];
                    
                    const highPriority = dayTasks.filter(t => t.priority === 1).length;
                    const mediumPriority = dayTasks.filter(t => t.priority === 2).length;
                    const lowPriority = dayTasks.filter(t => t.priority === 3 || !t.priority).length;
                    const totalTasks = dayTasks.length;
                    
                    const isToday = dateString === new Date().toISOString().split('T')[0];
                    
                    return (
                        <div 
                            key={index} 
                            className={`week-cell ${isToday ? 'today' : ''}`}
                            onClick={() => {
                                if (onDayClick) onDayClick(dateString);
                            }}
                        >
                            <div className="week-day-name">{daysOfWeek[index]}</div>
                            <div className="week-day-number">{dayNum}</div>
                            <div className="week-month">{months[month]}</div>
                            {totalTasks > 0 && (
                                <>
                                    <div className="week-total">{totalTasks}</div>
                                    <div className="week-badges">
                                        {highPriority > 0 && <span className="badge high">{highPriority}</span>}
                                        {mediumPriority > 0 && <span className="badge medium">{mediumPriority}</span>}
                                        {lowPriority > 0 && <span className="badge low">{lowPriority}</span>}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="calendar">
            {renderHeader()}
            <div className="weekdays-header">
                {daysOfWeek.map(day => <div key={day}>{day}</div>)}
            </div>
            {viewMode === 'month' ? renderMonthView() : renderWeekView()}
        </div>
    );
};

export default Calendar;