# ── Stage 1: install dependencies ─────────────────────────────────────────
FROM composer:2 AS composer

WORKDIR /app
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-interaction --optimize-autoloader --no-scripts

# ── Stage 2: runtime image ────────────────────────────────────────────────
FROM php:8.2-apache

RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && a2enmod rewrite \
    && sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf \
    && echo "PassEnv JWT_SECRET DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME" \
       >> /etc/apache2/apache2.conf \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY . .
COPY --from=composer /app/vendor ./vendor

# Fix permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80