import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchTasks } from '../../utils/api';
import './StatisticsPopup.css';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PRIORITIES = [
    { id: 1, label: 'Высокий', color: '#ff4444' },
    { id: 2, label: 'Средний', color: '#ffaa00' },
    { id: 3, label: 'Низкий', color: '#44aa44' },
];

const pad2 = (n) => String(n).padStart(2, '0');

const toISODate = (d) => {
    const year = d.getFullYear();
    const month = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    return `${year}-${month}-${day}`;
};

const parseISODateLocal = (iso) => {
    if (!iso || typeof iso !== 'string') return null;
    const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    // month: 1..12 => monthIndex: 0..11
    return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const formatRuDate = (d) => {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
};

const diffDaysInclusive = (fromD, toD) => {
    if (!(fromD instanceof Date) || !(toD instanceof Date)) return 0;
    const from = new Date(fromD);
    const to = new Date(toD);
    const msPerDay = 24 * 60 * 60 * 1000;
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0);
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 0, 0, 0, 0);
    return Math.floor((end - start) / msPerDay) + 1;
};

const parseDueHour = (dueTime) => {
    if (!dueTime) return null;
    const parts = String(dueTime).trim().split(':');
    if (parts.length < 1) return null;
    const hour = Number(parts[0]);
    if (Number.isNaN(hour) || hour < 0 || hour > 23) return null;
    return hour;
};

const StatisticsPopup = ({ onClose }) => {
    const reportRef = useRef(null);

    const today = new Date();
    const defaultToStr = toISODate(today);
    const defaultFromStr = toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6));

    const [dateFromStr, setDateFromStr] = useState(defaultFromStr);
    const [dateToStr, setDateToStr] = useState(defaultToStr);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [tasksByDate, setTasksByDate] = useState({});
    const [error, setError] = useState('');

    const { dateFrom, dateTo, dateRangeLabel, isDateRangeValid } = useMemo(() => {
        const from = parseISODateLocal(dateFromStr);
        const to = parseISODateLocal(dateToStr);

        if (!from || !to) {
            return {
                dateFrom: null,
                dateTo: null,
                dateRangeLabel: 'Период не задан',
                isDateRangeValid: false,
            };
        }

        if (from > to) {
            return {
                dateFrom: from,
                dateTo: to,
                dateRangeLabel: 'Неверный период',
                isDateRangeValid: false,
            };
        }

        return {
            dateFrom: from,
            dateTo: to,
            dateRangeLabel: `${formatRuDate(from)} — ${formatRuDate(to)}`,
            isDateRangeValid: true,
        };
    }, [dateFromStr, dateToStr]);

    useEffect(() => {
        if (!isDateRangeValid || !dateFrom || !dateTo) {
            setTasksByDate({});
            setLoading(false);
            return;
        }

        let isMounted = true;
        const run = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await fetchTasks(dateFrom, dateTo);
                if (!isMounted) return;
                setTasksByDate(data || {});
            } catch (e) {
                if (!isMounted) return;
                setError('Не удалось загрузить задачи для расчёта статистики.');
                setTasksByDate({});
            } finally {
                if (!isMounted) return;
                setLoading(false);
            }
        };

        run();
        return () => {
            isMounted = false;
        };
    }, [dateFrom, dateTo, isDateRangeValid]);

    const report = useMemo(() => {
        const grouped = tasksByDate || {};
        const allTasks = Object.entries(grouped).flatMap(([date, tasks]) =>
            (tasks || []).map((t) => ({ ...t, __date: date }))
        );

        const total = allTasks.length;
        const completed = allTasks.filter((t) => !!t.status).length;
        const completionRate = total ? Math.round((completed / total) * 100) : 0;

        const priorities = PRIORITIES.map((p) => {
            const totalCount = allTasks.filter((t) => t.priority === p.id).length;
            const doneCount = allTasks.filter((t) => t.priority === p.id && !!t.status).length;
            const share = total ? totalCount / total : 0;
            return {
                id: p.id,
                label: p.label,
                color: p.color,
                count: totalCount,
                doneCount,
                share,
            };
        });

        const days = Object.entries(grouped).map(([date, tasks]) => ({
            date,
            count: (tasks || []).length,
        }));

        const sortedDays = [...days].sort((a, b) => b.count - a.count);
        const busiestDay = sortedDays[0] || null;

        const daysInRange = diffDaysInclusive(dateFrom, dateTo);
        const overloadThreshold = daysInRange <= 7 ? 6 : 10;
        const overloadedDays = sortedDays.filter((d) => d.count >= overloadThreshold).slice(0, 5);
        const overloadedCount = sortedDays.filter((d) => d.count >= overloadThreshold).length;

        const avgPerDay = total ? Math.round(total / daysInRange) : 0;

        // Анализ "перегрузок" по времени (из due_time) - пиковый час
        const hourBuckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
        for (const t of allTasks) {
            const hour = parseDueHour(t.due_time);
            if (hour === null) continue;
            hourBuckets[hour].count += 1;
        }
        const peakHourBucket = [...hourBuckets].sort((a, b) => b.count - a.count)[0];
        const peakHour = peakHourBucket && peakHourBucket.count > 0 ? peakHourBucket.hour : null;
        const peakHourCount = peakHour !== null ? hourBuckets[peakHour].count : 0;

        return {
            total,
            completed,
            completionRate,
            priorities,
            overload: {
                overloadThreshold,
                overloadedCount,
                overloadedDays,
                busiestDay,
                avgPerDay,
                peakHour,
                peakHourCount,
            },
        };
    }, [tasksByDate, dateFrom, dateTo]);

    const handleExportPdf = async () => {
        if (loading || exporting) return;
        if (!reportRef.current) return;
        if (!report.total) return;

        try {
            setExporting(true);
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Раскладка на несколько страниц при необходимости
            let position = 0;

            const filenameSafe = dateRangeLabel.replace(/[:/\\]/g, '-');
            const pageCount = Math.max(1, Math.ceil(imgHeight / pdfHeight));
            for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                position -= pdfHeight;
                if (pageIndex < pageCount - 1) pdf.addPage();
            }

            pdf.save(`report_${filenameSafe}.pdf`);
        } catch (e) {
            // eslint-disable-next-line no-alert
            alert('Ошибка при экспорте PDF. Попробуйте ещё раз.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="stats-overlay" onClick={onClose}>
            <div className="stats-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="stats-close" onClick={onClose} aria-label="Закрыть">
                    ×
                </button>

                <div className="stats-header">
                    <h2>Статистика</h2>
                    <div className="stats-dates">
                        <label className="stats-date-field">
                            <span>Дата с</span>
                            <input
                                type="date"
                                value={dateFromStr}
                                onChange={(e) => setDateFromStr(e.target.value)}
                            />
                        </label>
                        <label className="stats-date-field">
                            <span>Дата по</span>
                            <input
                                type="date"
                                value={dateToStr}
                                onChange={(e) => setDateToStr(e.target.value)}
                            />
                        </label>
                    </div>
                </div>

                <div className="stats-subtitle">{dateRangeLabel}</div>

                {error && <div className="stats-error">{error}</div>}
                {!error && !isDateRangeValid && (
                    <div className="stats-error">Выберите корректный промежуток: дата с должна быть меньше либо равна дате по.</div>
                )}

                <div className="stats-actions">
                    <button
                        type="button"
                        className="stats-export-btn"
                        onClick={handleExportPdf}
                        disabled={!isDateRangeValid || loading || exporting || report.total === 0}
                    >
                        {exporting ? 'Экспорт...' : 'Экспорт в PDF'}
                    </button>
                    <button type="button" className="stats-cancel-btn" onClick={onClose}>
                        Закрыть
                    </button>
                </div>

                <div className="stats-body">
                    <div ref={reportRef} className="stats-report">
                        {loading ? (
                            <div className="stats-loading">Загрузка статистики...</div>
                        ) : (
                            <>
                <div className="stats-cards">
                    <div className="stats-card">
                        <div className="stats-card-title">Выполнено задач / Всего задач</div>
                        <div className="stats-card-value">
                            {report.completed} / {report.total}
                        </div>
                        <div className="stats-card-hint">
                            Продуктивность: {report.completionRate}%
                        </div>
                    </div>
                    <div className="stats-card">
                        <div className="stats-card-title">Процент выполнения</div>
                        <div className="stats-card-value">{report.completionRate}%</div>
                        <div className="stats-card-hint">
                            {report.completed} из {report.total} задач сделано
                        </div>
                    </div>
                    <div className="stats-card">
                        <div className="stats-card-title">Просроченные задачи</div>
                        <div className="stats-card-value">{report.overdue || 0}</div>
                        <div className="stats-card-hint">
                            Задачи не выполнены в срок
                        </div>
                    </div>
                </div>

                                <div className="stats-section">
                                    <h3>Статистика по приоритетам</h3>
                                    <div className="priority-list">
                                        {report.priorities.map((p) => (
                                            <div key={p.id} className="priority-item">
                                                <div className="priority-top">
                                                    <span className="priority-label">{p.label}</span>
                                                    <span className="priority-count">
                                                        {p.count} (выполнено: {p.doneCount})
                                                    </span>
                                                </div>
                                                <div className="priority-bar">
                                                    <div
                                                        className="priority-bar-fill"
                                                        style={{
                                                            width: `${Math.round(p.share * 100)}%`,
                                                            backgroundColor: p.color,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="stats-section">
                                    <h3>Анализ перегрузок</h3>
                                    <div className="overload-summary">
                                        {report.overload.peakHour !== null ? (
                                            <div className="overload-pill">
                                                Пиковый час: {pad2(report.overload.peakHour)}:00 ({report.overload.peakHourCount})
                                            </div>
                                        ) : (
                                            <div className="overload-pill">Пиковый час не определён (нет due_time)</div>
                                        )}
                                        <div className="overload-pill">
                                            Недозагруженные/пере-загруженные дни подсвечиваются по порогу
                                        </div>
                                    </div>

                                    {report.overload.overloadedDays.length > 0 ? (
                                        <div className="overload-days">
                                            {report.overload.overloadedDays.map((d) => (
                                                <div key={d.date} className="overload-day">
                                                    <div className="overload-day-date">{d.date}</div>
                                                    <div className="overload-day-count">{d.count} задач</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="stats-empty">
                                            Перегрузок не найдено — порог не превышался.
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsPopup;


