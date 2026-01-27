#!/bin/sh
cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
    OPENAI_API_KEY: "${VITE_OPENAI_API_KEY}",
    OPENAI_MODEL: "${VITE_OPENAI_MODEL}",
    API_ENDPOINT: "${VITE_API_ENDPOINT}",
    CLIENTE_ID: "${VITE_CLIENTE_ID}"
};
EOF
exec nginx -g "daemon off;"