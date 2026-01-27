import React from 'react';
import mayaImg from '../assets/maya.jpeg';

export default function BotMessage({ text }) {
    return (
        <div className="message message-bot">
            <div className="bot-avatar">
                <img src={mayaImg} alt="Maya" />
            </div>
            <div className="bot-content">
                <div className="bot-text" dangerouslySetInnerHTML={{ __html: text }} />
            </div>
        </div>
    );
}
