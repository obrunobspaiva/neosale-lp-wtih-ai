import React, { useState, useEffect, useRef } from 'react';
import { applyPhoneMask } from '../utils/helpers';

export default function ChatInput({ 
    type, 
    placeholder, 
    options, 
    onSubmit, 
    visible,
    currentField 
}) {
    const [value, setValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        setValue('');
        if (visible && inputRef.current && (type === 'text' || type === 'email' || type === 'phone')) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [type, visible]);

    const handleInputChange = (e) => {
        let newValue = e.target.value;
        if (type === 'phone' && currentField === 'telefone') {
            newValue = applyPhoneMask(newValue);
        }
        setValue(newValue);
    };

    const handleSubmit = () => {
        if (value.trim()) {
            onSubmit(value.trim());
            setValue('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const handleOptionClick = (opt) => {
        onSubmit(opt);
    };

    const handleSelectChange = (e) => {
        if (e.target.value) {
            onSubmit(e.target.value);
        }
    };

    if (!visible) return null;

    return (
        <div className="chat-input-area">
            {(type === 'text' || type === 'email' || type === 'phone') && (
                <div className="input-wrapper">
                    <input
                        ref={inputRef}
                        type={type === 'phone' ? 'tel' : type}
                        value={value}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder={placeholder}
                        autoComplete="off"
                    />
                    <button type="button" className="send-btn" onClick={handleSubmit}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                    </button>
                </div>
            )}

            {type === 'options' && (
                <div className="options-wrapper">
                    {options.map((opt, idx) => (
                        <button 
                            key={idx} 
                            className="option-btn" 
                            onClick={() => handleOptionClick(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}

            {type === 'select' && (
                <div className="select-wrapper">
                    <select onChange={handleSelectChange} defaultValue="">
                        <option value="">Selecione o segmento da sua empresa</option>
                        {options.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
