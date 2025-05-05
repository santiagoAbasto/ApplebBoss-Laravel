# ✅ Imagen base con Apache y PHP 8.2
FROM php:8.2-apache

# ✅ Instalación de extensiones y utilidades necesarias
RUN apt-get update && apt-get install -y \
    zip unzip git curl libpq-dev libzip-dev libpng-dev \
    && docker-php-ext-install pdo pdo_pgsql zip gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ✅ Copiar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ✅ Establecer directorio de trabajo
WORKDIR /var/www/html

# ✅ Habilitar mod_rewrite para Laravel
RUN a2enmod rewrite

# ✅ Cambiar DocumentRoot a /var/www/html/public
RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|g' /etc/apache2/sites-available/000-default.conf \
 && echo '<Directory /var/www/html/public>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf
