FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static files to nginx html directory
COPY . /usr/share/nginx/html

# Remove config files from the served files
RUN rm -f /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/nginx.conf

# Create entrypoint script to generate config.js from environment variables
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'echo "window.ENV = {" > /usr/share/nginx/html/config.js' >> /docker-entrypoint.sh && \
    echo 'echo "    OPENAI_API_KEY: \"$OPENAI_API_KEY\"," >> /usr/share/nginx/html/config.js' >> /docker-entrypoint.sh && \
    echo 'echo "    OPENAI_MODEL: \"$OPENAI_MODEL\"," >> /usr/share/nginx/html/config.js' >> /docker-entrypoint.sh && \
    echo 'echo "    API_ENDPOINT: \"$API_ENDPOINT\"," >> /usr/share/nginx/html/config.js' >> /docker-entrypoint.sh && \
    echo 'echo "    CLIENTE_ID: \"$CLIENTE_ID\"" >> /usr/share/nginx/html/config.js' >> /docker-entrypoint.sh && \
    echo 'echo "};" >> /usr/share/nginx/html/config.js' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Start with entrypoint that generates config.js
CMD ["/docker-entrypoint.sh"]
