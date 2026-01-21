#!/bin/sh
cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
    OPENAI_API_KEY: "${OPENAI_API_KEY}",
    OPENAI_MODEL: "${OPENAI_MODEL}",
    API_ENDPOINT: "${API_ENDPOINT}",
    CLIENTE_ID: "${CLIENTE_ID}"
};
EOF
exec nginx -g "daemon off;"