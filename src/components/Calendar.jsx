import React, { useState } from 'react';
import mayaImg from '../assets/maya.jpeg';

export default function Calendar({ onSelect }) {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);

    const now = new Date();
    const month = now.toLocaleString('pt-BR', { month: 'long' });
    const year = now.getFullYear();
    const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
    const firstDay = new Date(year, now.getMonth(), 1).getDay();

    const dayNames = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

    const generateTimeSlots = () => {
        const allSlots = [];
        for (let hour = 11; hour <= 19; hour++) {
            allSlots.push(`${String(hour).padStart(2, '0')}:00`);
            if (hour < 19) {
                allSlots.push(`${String(hour).padStart(2, '0')}:30`);
            }
        }

        if (!selectedDate) return allSlots;

        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (selectedDate === today) {
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();

            return allSlots.filter(slot => {
                const [slotHour, slotMinutes] = slot.split(':').map(Number);
                if (slotHour > currentHour) return true;
                if (slotHour === currentHour && slotMinutes > currentMinutes + 30) return true;
                return false;
            });
        }

        return allSlots;
    };

    const handleDateClick = (dateStr) => {
        setSelectedDate(dateStr);
        setSelectedTime(null);
    };

    const handleTimeClick = (time) => {
        setSelectedTime(time);
    };

    const handleConfirm = () => {
        if (selectedDate && selectedTime) {
            onSelect(selectedDate, selectedTime);
        }
    };

    const renderDays = () => {
        const days = [];

        // Empty cells for days before first day of month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day disabled"></div>);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, now.getMonth(), day);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isPast = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const isDisabled = isPast || isWeekend;
            const dateStr = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;

            days.push(
                <button
                    key={day}
                    className={`calendar-day ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => !isDisabled && handleDateClick(dateStr)}
                    disabled={isDisabled}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    const timeSlots = generateTimeSlots();

    return (
        <div className="message message-bot">
            <div className="bot-avatar">
                <img src={mayaImg} alt="Maya" />
            </div>
            <div className="bot-content">
                <div className="calendar-container">
                    <div className="calendar-header">
                        <h3>{month} {year}</h3>
                    </div>
                    <div className="calendar-grid">
                        {dayNames.map(day => (
                            <div key={day} className="calendar-day-header">{day}</div>
                        ))}
                        {renderDays()}
                    </div>

                    {selectedDate && (
                        <div className="time-slots">
                            <h4 style={{ gridColumn: '1/-1', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-gray)' }}>
                                Horários Disponíveis
                            </h4>
                            {timeSlots.length === 0 ? (
                                <p style={{ gridColumn: '1/-1', color: 'var(--text-gray)', fontSize: '0.875rem' }}>
                                    Não há horários disponíveis para hoje. Por favor, selecione outro dia.
                                </p>
                            ) : (
                                timeSlots.map(slot => (
                                    <button
                                        key={slot}
                                        className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                                        onClick={() => handleTimeClick(slot)}
                                    >
                                        {slot}
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {selectedDate && selectedTime && (
                        <button 
                            className="confirm-btn" 
                            style={{ marginTop: '16px' }}
                            onClick={handleConfirm}
                        >
                            Continuar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
