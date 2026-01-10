package com.innovan.roombooking.auth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.innovan.roombooking.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerErrorException;

@Component
public class AuthHandler
    implements
        AuthenticationEntryPoint,
        AuthenticationSuccessHandler,
        AuthenticationFailureHandler,
        LogoutSuccessHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthHandler.class);
    private static final int USER_EXP_MINUTES = 1440;
    private static final ApiResponse<Void> API_RESPONSE_NOT_IMPLEMENTED;
    private static final ApiResponse<Void> API_RESPONSE_UNAUTHORIZED;
    private static final ObjectWriter OBJECT_WRITER;

    static {
        OBJECT_WRITER = new ObjectMapper().writerFor(new TypeReference<ApiResponse<Void>>() {});
        API_RESPONSE_NOT_IMPLEMENTED = toApiResponse(HttpStatus.NOT_IMPLEMENTED);
        API_RESPONSE_UNAUTHORIZED = toApiResponse(HttpStatus.UNAUTHORIZED);
    }

    @Autowired
    Environment environment;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @Value("${secureCookie:true}")
    protected boolean secureCookie;

    private static ApiResponse<Void> toApiResponse(HttpStatus status) {
        var apiResponse = new ApiResponse<Void>();
        apiResponse.setCode(status.value());
        apiResponse.setStatus(status.getReasonPhrase());
        return apiResponse;
    }

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException {
        LOGGER.info("Authentication succeeded for user.");

        if (!(authentication instanceof UsernamePasswordAuthenticationToken)) {
            writeStatus(response, HttpStatus.NOT_IMPLEMENTED);
            return;
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        OffsetDateTime expireTime = OffsetDateTime
            .now(ZoneOffset.UTC)
            .plus(Duration.ofMinutes(USER_EXP_MINUTES));

        String jwt;
        try {
            jwt = jwtUtil.generateToken(userDetails);
        } catch (IllegalArgumentException e) {
            throw new ServerErrorException("Unable to issue user token.", e);
        }

        String expiration = DateTimeFormatter.RFC_1123_DATE_TIME.format(expireTime);
        String path = request.getContextPath();
        if (path.isEmpty()) {
            path = "/";
        }

        String cookieValue =
            "jwt=" +
            jwt +
            "; Path=" +
            path +
            "; HttpOnly; SameSite=Lax; Expires=" +
            expiration +
            (secureCookie ? "; Secure" : "");

        response.addHeader("Set-Cookie", cookieValue);
        response.setStatus(HttpStatus.OK.value());
    }

    @Override
    public void onAuthenticationFailure(
        HttpServletRequest request,
        HttpServletResponse response,
        AuthenticationException exception
    ) throws IOException {
        LOGGER.warn("Authentication failure for user: {}", request.getParameter("username"));
        LOGGER.error("Authentication exception: {}", exception.getMessage());
        writeStatus(response, HttpStatus.UNAUTHORIZED);
    }

    @Override
    public void onLogoutSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication
    ) {
        String user = null;
        String jwt = JwtRequestFilter.getJwt(request);

        if (jwt != null) {
            try {
                user = this.jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                LOGGER.warn("Failed to parse JWT during logout", e);
            }
        }

        LOGGER.info("User logged out: {}", user);

        String path = request.getContextPath();
        if (path.isEmpty()) {
            path = "/";
        }
        String cookieValue =
            "jwt=; Path=" +
            path +
            "; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT" +
            (secureCookie ? "; Secure" : "");

        response.addHeader("Set-Cookie", cookieValue);
        response.setStatus(HttpStatus.OK.value());
    }

    @Override
    public void commence(
        HttpServletRequest request,
        HttpServletResponse response,
        AuthenticationException authException
    ) throws IOException {
        writeStatus(response, HttpStatus.UNAUTHORIZED);
    }

    private void writeStatus(HttpServletResponse response, HttpStatus status) throws IOException {
        response.setContentType("application/json");
        response.setStatus(status.value());

        ApiResponse<Void> apiResponse;
        if (status == HttpStatus.UNAUTHORIZED) {
            apiResponse = API_RESPONSE_UNAUTHORIZED;
        } else if (status == HttpStatus.NOT_IMPLEMENTED) {
            apiResponse = API_RESPONSE_NOT_IMPLEMENTED;
        } else {
            apiResponse = toApiResponse(status);
        }
        OBJECT_WRITER.writeValue(response.getOutputStream(), apiResponse);
    }
}
