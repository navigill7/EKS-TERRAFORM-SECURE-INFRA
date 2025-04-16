FROM nginx:1.27.4-alpine

RUN mkdir -p /var/Development

COPY index.html /var/Development/index.html

COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
