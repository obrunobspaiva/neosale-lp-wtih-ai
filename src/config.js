// Configuration - uses runtime environment variables injected via window.ENV
// In production, entrypoint.sh generates config.js with window.ENV from environment variables
const ENV = window.ENV || {};

export const CONFIG = {
    OPENAI_API_KEY: ENV.OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY || '',
    OPENAI_MODEL: ENV.OPENAI_MODEL || import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
    API_ENDPOINT: ENV.API_ENDPOINT || import.meta.env.VITE_API_ENDPOINT || '',
    CLIENTE_ID: ENV.CLIENTE_ID || import.meta.env.VITE_CLIENTE_ID || ''
};
