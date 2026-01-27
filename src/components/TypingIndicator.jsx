import React from 'react';
import mayaImg from '../assets/maya.jpeg';

export default function TypingIndicator() {
    return (
        <div className="message message-bot">
            <div className="bot-avatar">
                <img src={mayaImg} alt="Maya" />
            </div>
            <div className="bot-content">
                <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    );
}
