# Stage 1: Build frontend assets
FROM node:20-alpine AS assets
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: PHP Environment (Now using Apache)
FROM php:8.3-apache

# 1. Install system dependencies using apt-get (Debian) instead of apk
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-install pdo_mysql gd zip

# 2. Enable Apache mod_rewrite (Required for Laravel/PHP Frameworks)
RUN a2enmod rewrite

# 3. Update Apache DocumentRoot to point to /public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Set working directory to the standard Apache location
WORKDIR /var/www/html

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy project files
COPY . .
COPY --from=assets /app/public/build ./public/build

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions for Laravel
RUN chown -R www-data:www-data storage bootstrap/cache

# 4. Correct Ports and Startup
# Apache listens on 80. Your Ansible maps VM:8081 to Container:80.
EXPOSE 80

# REMOVED CMD ["php-fpm"] 
# Apache base images automatically start the web server; overriding it 
# with php-fpm would stop the web server from running.
