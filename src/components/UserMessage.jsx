import React from 'react';

export default function UserMessage({ text }) {
    return (
        <div className="message message-user">
            <div className="user-bubble">{text}</div>
        </div>
    );
}
