# Stage 1: Build frontend assets
FROM node:20-alpine AS assets
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# IMPORTANT: Copy EVERYTHING so Vite can see vite.config.js and resources/
COPY . .

# Run the build
RUN npm run build

# Stage 2: PHP Environment (Apache)
FROM php:8.3-apache

# 1. Install system dependencies and CRON
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libzip-dev \
    libicu-dev \
    zip \
    unzip \
    git \
    cron \
    && docker-php-ext-configure intl \
    && docker-php-ext-install pdo_mysql gd zip intl [cite: 2]

# 2. Enable Apache mod_rewrite
RUN a2enmod rewrite [cite: 2]

# 3. Update Apache DocumentRoot
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf [cite: 2, 4]

WORKDIR /var/www/html [cite: 2]

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer [cite: 2]

# Copy project files
COPY . . [cite: 2, 5]
COPY --from=assets /app/public/build ./public/build [cite: 2, 5]

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader [cite: 2]

# 4. Set up the Cron Job
# We use the 'www-data' user to run the queue worker
RUN echo "* * * * * www-data php /var/www/html/artisan queue:work --stop-when-empty >> /dev/null 2>&1" > /etc/cron.d/laravel-cron
RUN chmod 0644 /etc/cron.d/laravel-cron
RUN crontab /etc/cron.d/laravel-cron

# 5. Fix permissions for storage and cache
RUN chown -R www-data:www-data storage bootstrap/cache [cite: 2]

EXPOSE 80 [cite: 2, 6]

# 6. Custom Startup Script
# We need to start cron and apache together
RUN echo "#!/bin/sh\ncron\napache2-foreground" > /usr/local/bin/start-app.sh
RUN chmod +x /usr/local/bin/start-app.sh

CMD ["/usr/local/bin/start-app.sh"]
