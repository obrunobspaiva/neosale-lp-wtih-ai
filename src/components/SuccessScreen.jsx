import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/helpers';

export default function SuccessScreen({ data }) {
    const [countdown, setCountdown] = useState('00:00:00:00');
    const firstName = data.nome.split(' ')[0];
    const dateFormatted = formatDate(data.data_agendamento);

    useEffect(() => {
        const [year, month, day] = data.data_agendamento.split('-');
        const [hours, minutes] = data.horario_agendamento.split(':');
        const targetDate = new Date(year, month - 1, day, hours, minutes);

        const updateCountdown = () => {
            const now = new Date();
            const diff = targetDate - now;

            if (diff <= 0) {
                setCountdown('00:00:00:00');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown(
                `${String(days).padStart(2, '0')}:${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
            );
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [data]);

    return (
        <div className="success-screen" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ 
                width: '56px', 
                height: '56px', 
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 12px' 
            }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <h2 style={{ fontSize: '1.375rem', margin: '0 0 4px 0', color: 'var(--text-light)' }}>
                Obrigado, {firstName}!
            </h2>
            <p style={{ color: 'var(--accent)', fontSize: '1rem', margin: '0 0 14px 0', fontWeight: '600' }}>
                Consultoria confirmada
            </p>

            <div style={{ 
                background: 'rgba(6, 182, 212, 0.1)', 
                border: '1px solid var(--accent)', 
                borderRadius: '12px', 
                padding: '12px', 
                marginBottom: '14px' 
            }}>
                <p style={{ fontSize: '1rem', color: 'var(--text-light)', margin: 0 }}>
                    📅 {dateFormatted} às {data.horario_agendamento}
                </p>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)', marginBottom: '14px' }}>
                Link por <strong style={{ color: 'var(--accent)' }}>email</strong> e <strong style={{ color: '#25D366' }}>WhatsApp</strong>
            </p>

            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '12px', marginBottom: '14px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Faltam</p>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>{countdown}</div>
                <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', margin: 0 }}>dias : horas : min : seg</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '14px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: 'rgba(6, 182, 212, 0.2)', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 4px' 
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p style={{ fontSize: '0.625rem', color: 'var(--text-gray)' }}>Diagnóstico</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: 'rgba(6, 182, 212, 0.2)', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 4px' 
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <p style={{ fontSize: '0.625rem', color: 'var(--text-gray)' }}>Oportunidades</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: 'rgba(6, 182, 212, 0.2)', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 4px' 
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <p style={{ fontSize: '0.625rem', color: 'var(--text-gray)' }}>Plano</p>
                </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '12px', textAlign: 'left' }}>
                <h4 style={{ fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-light)' }}>Próximos passos</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.875rem', width: '20px', textAlign: 'center' }}>✅</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-gray)' }}>Reunião confirmada</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.875rem', width: '20px', textAlign: 'center' }}>📧</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-gray)' }}>Link por email</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.875rem', width: '20px', textAlign: 'center' }}>📱</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-gray)' }}>Confirmação WhatsApp</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.875rem', width: '20px', textAlign: 'center' }}>💡</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-gray)' }}>Prepare seus desafios</span>
                </div>
            </div>
        </div>
    );
}
