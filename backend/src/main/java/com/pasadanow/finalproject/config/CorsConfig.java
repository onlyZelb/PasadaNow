package com.pasadanow.finalproject.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

/**
 * Global CORS configuration.
 *
 * Why this is needed:
 * React runs on http://localhost:5173 (Vite default).
 * Spring Boot runs on http://localhost:8080.
 * The browser blocks cross-origin cookies unless the server explicitly
 * allows the origin AND sets allowCredentials = true.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration cfg = new CorsConfiguration();

        // Allow the React dev server (and production build origin)
        cfg.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:3000"));

        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));

        // CRITICAL: must be true so the JSESSIONID cookie is sent back
        cfg.setAllowCredentials(true);

        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg); // apply to every endpoint
        return new CorsFilter(source);
    }
}