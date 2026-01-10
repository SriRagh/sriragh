package com.innovan.roombooking.service;

import com.innovan.roombooking.dto.SecurityUserDetails;
import com.innovan.roombooking.dto.UserDetailsDto;
import com.innovan.roombooking.enums.Permission;
import com.innovan.roombooking.model.User;
import com.innovan.roombooking.model.UserInformation;
import com.innovan.roombooking.repository.UserInformationRepository;
import com.innovan.roombooking.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserInformationRepository userInformationRepository;

    public UserService(
        UserRepository userRepository,
        UserInformationRepository userInformationRepository
    ) {
        this.userRepository = userRepository;
        this.userInformationRepository = userInformationRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameIgnoreCase(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }

        SecurityUserDetails userDetails = new SecurityUserDetails();
        userDetails.setUsername(user.getUsername());
        userDetails.setPassword(user.getPassword());
        userDetails.setAccountNonExpired(true);
        userDetails.setEnabled(true);
        userDetails.setAccountNonLocked(true);
        userDetails.setCredentialsNonExpired(true);
        userDetails.setAuthorities(
            Collections.singleton(new SimpleGrantedAuthority(Permission.ADMIN.toString()))
        );

        return userDetails;
    }

    public Long getUserCount() {
        return userRepository.countAllUsers();
    }

    public boolean deleteUser(Long userId) {
        return userRepository
            .findById(userId)
            .map(user -> {
                user.setStatus("Inactive");
                user.setUpdatedDate(LocalDate.now());
                userRepository.save(user);
                return true;
            })
            .orElse(false);
    }

    public List<UserDetailsDto> getAllActiveUsers() {
        return userRepository.findAllActiveUsers().stream().toList();
    }

    private UserDetailsDto convertToDto(User user) {
        UserDetailsDto dto = new UserDetailsDto();
        dto.setUserId(user.getUserId());
        dto.setUsername(user.getUsername());
        dto.setRole(user.getRole());
        dto.setCreatedDate(user.getCreatedDate());
        dto.setStatus(user.getStatus());
        dto.setIsActive(user.getStatus());
        return dto;
    }
}
