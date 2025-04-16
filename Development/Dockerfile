FROM nginx:1.27.4-alpine
RUN mkdir -p /var/Development
# Copy portfolio site
COPY index.html /var/Development/index.html
# Copy Nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf
# Set permissions and ownership
RUN chown -R nginx:nginx /var/development && \
    chmod -R 755 /var/development/ && \
    chmod 644 /var/development/index.html
# Expose port
EXPOSE 80
