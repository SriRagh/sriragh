package com.innovan.roombooking.service;

import com.innovan.roombooking.entity.RegisterUserDto;
import com.innovan.roombooking.model.User;
import com.innovan.roombooking.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    public AuthenticationService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User signup(RegisterUserDto input) {
        User user = new User();
        user.setUsername(input.getFullName());
        user.setRole(input.getRole());
        user.setPassword(passwordEncoder.encode(input.getPassword()));
        return userRepository.save(user);
    }
}
