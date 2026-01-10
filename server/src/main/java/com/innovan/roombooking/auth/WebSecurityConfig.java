package com.innovan.roombooking.auth;

import com.innovan.roombooking.service.UserService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ContentSecurityPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class WebSecurityConfig {

    private final AuthHandler authHandler;

    private final JwtRequestFilter authRequestFilter;

    private final UserService userService;

    @Value("${allowedOrigins:http://localhost:9002}")
    protected List<String> allowedOrigins;

    @Value("${hstsEnabled: true}")
    protected boolean hstsEnabled;

    public WebSecurityConfig(
        AuthHandler authHandler,
        JwtRequestFilter authRequestFilter,
        UserService userService
    ) {
        this.authHandler = authHandler;
        this.authRequestFilter = authRequestFilter;
        this.userService = userService;
    }

    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(this.userService).passwordEncoder(new BCryptPasswordEncoder());
    }

    public static String[] noAuthRequiredEndpoints() {
        return new String[] { "/actuator/**", "/api/auth/**", "/login/**", "/authenticate/**" };
    }

    @Bean
    protected SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
        if (!hstsEnabled) {
            httpSecurity.headers(headers ->
                headers.httpStrictTransportSecurity(HeadersConfigurer.HstsConfig::disable)
            );
        }

        httpSecurity
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers ->
                headers.addHeaderWriter(
                    new ContentSecurityPolicyHeaderWriter(
                        HttpHeaderUtils.cspFrameAncestors(allowedOrigins)
                    )
                )
            )
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth ->
                auth
                    .requestMatchers(noAuthRequiredEndpoints())
                    .permitAll()
                    .anyRequest()
                    .authenticated()
            )
            .addFilterBefore(this.authRequestFilter, UsernamePasswordAuthenticationFilter.class)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .exceptionHandling(exception -> exception.authenticationEntryPoint(this.authHandler))
            .logout(logout -> logout.logoutSuccessHandler(this.authHandler).permitAll());

        return httpSecurity.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder authenticationManagerBuilder = http.getSharedObject(
            AuthenticationManagerBuilder.class
        );

        authenticationManagerBuilder
            .userDetailsService(this.userService)
            .passwordEncoder(passwordEncoder());

        return authenticationManagerBuilder.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
