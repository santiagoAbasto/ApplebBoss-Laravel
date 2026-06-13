# Imagen base con Apache y PHP compatible con Laravel 13
FROM php:8.3-apache

# Instalación de extensiones y utilidades necesarias
RUN apt-get update && apt-get install -y \
    zip unzip git curl libpq-dev libzip-dev libpng-dev libonig-dev \
    && docker-php-ext-install pdo pdo_pgsql zip gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Establecer directorio de trabajo
WORKDIR /var/www/html

# Habilitar mod_rewrite para Laravel
RUN a2enmod rewrite
RUN echo 'ServerName localhost' > /etc/apache2/conf-available/servername.conf \
 && a2enconf servername

# Cambiar DocumentRoot a /var/www/html/public
RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|g' /etc/apache2/sites-available/000-default.conf \
 && echo '<Directory /var/www/html/public>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

# Instalar dependencias de Composer dentro de Docker (evita deadlocks de macOS VirtioFS)
COPY src/composer.json src/composer.lock ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# Preparar directorios escribibles. El código de la app entra por volumen en desarrollo.
RUN mkdir -p bootstrap/cache storage/logs storage/framework/cache storage/framework/sessions storage/framework/views \
    && chmod -R 777 bootstrap/cache storage
