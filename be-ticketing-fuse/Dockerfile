# Stage 1: Build frontend assets
FROM node:20-alpine AS assets
WORKDIR /app
COPY package*.json ./
RUN npm install
# COPY everything now so Vite can see resources/ and vite.config.js
COPY . . 
RUN npm run build

# Stage 2: PHP Environment (Apache)
FROM php:8.3-apache

# 1. Install system dependencies + CRON + Required Libs for extensions
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libzip-dev \
    libicu-dev \
    zlib1g-dev \
    zip \
    unzip \
    git \
    cron \
    && docker-php-ext-configure intl \
    && docker-php-ext-install pdo_mysql gd zip intl

# 2. Enable Apache mod_rewrite
RUN a2enmod rewrite

# 3. Update Apache DocumentRoot
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy project files
COPY . .
COPY --from=assets /app/public/build ./public/build

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# 4. Set up the Cron Job for the queue
RUN echo "* * * * * www-data php /var/www/html/artisan queue:work --stop-when-empty >> /var/www/html/storage/logs/cron.log 2>&1" > /etc/cron.d/laravel-cron
RUN chmod 0644 /etc/cron.d/laravel-cron

# 5. Prepare startup script
RUN printf "#!/bin/bash\nservice cron start\napache2-foreground" > /usr/local/bin/start-app.sh
RUN chmod +x /usr/local/bin/start-app.sh

# 6. Final Permissions setup
RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 80

CMD ["/usr/local/bin/start-app.sh"]
