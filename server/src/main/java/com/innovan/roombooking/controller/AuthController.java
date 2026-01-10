package com.innovan.roombooking.controller;

import com.innovan.roombooking.auth.JwtUtil;
import com.innovan.roombooking.dto.AuthRequest;
import com.innovan.roombooking.dto.AuthResponse;
import com.innovan.roombooking.model.User;
import com.innovan.roombooking.repository.UserRepository;
import com.innovan.roombooking.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @PostMapping("/token")
    public ResponseEntity<AuthResponse> createAuthenticationToken(
        @RequestBody AuthRequest authRequest
    ) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                authRequest.getUsername(),
                authRequest.getPassword()
            )
        );
        final UserDetails userDetails = userDetailsService.loadUserByUsername(
            authRequest.getUsername()
        );

        final String jwt = jwtUtil.generateToken(userDetails);
        User user = userRepository.findByUsernameIgnoreCase(userDetails.getUsername());
        return ResponseEntity.ok(new AuthResponse(jwt, user.getUserId()));
    }
}
