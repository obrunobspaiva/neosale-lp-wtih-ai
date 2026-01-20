FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static files to nginx html directory
COPY . /usr/share/nginx/html

# Remove config files from the served files
RUN rm -f /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/nginx.conf /usr/share/nginx/html/entrypoint.sh

# Copy entrypoint script and fix line endings
COPY entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Start with entrypoint that generates config.js
CMD ["/docker-entrypoint.sh"]
