# Stage 1: Build frontend assets
FROM node:20-alpine AS assets
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . . 
RUN npm run build

# Stage 2: PHP Environment (Apache)
FROM php:8.3-apache

# 1. Install system dependencies + CRON
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

# Create the symbolic link for storage
RUN php artisan storage:link

# 4. Set up the Cron Job using the absolute path /usr/local/bin/php
# We also define the PATH inside the cron file for maximum compatibility
RUN printf "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n* * * * * www-data /usr/local/bin/php /var/www/html/artisan queue:work --stop-when-empty >> /var/www/html/storage/logs/cron.log 2>&1\n" > /etc/cron.d/laravel-cron

# 5. Set correct permissions for the cron file
RUN chmod 0644 /etc/cron.d/laravel-cron

# 6. Prepare startup script to run Cron and Apache
RUN printf "#!/bin/bash\nservice cron start\napache2-foreground" > /usr/local/bin/start-app.sh
RUN printf "#!/bin/bash\n\
# Create link if it doesn't exist\n\
php artisan storage:link --force\n\
# Ensure standard subfolders exist just in case\n\
mkdir -p storage/framework/{sessions,views,cache} storage/logs storage/app/public\n\
chown -R www-data:www-data storage\n\
service cron start\n\
apache2-foreground" > /usr/local/bin/start-app.sh
RUN chmod +x /usr/local/bin/start-app.sh

# 7. Final Permissions setup
RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 80

CMD ["/usr/local/bin/start-app.sh"]
