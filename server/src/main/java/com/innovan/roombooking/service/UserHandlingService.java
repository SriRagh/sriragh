package com.innovan.roombooking.service;

import com.innovan.roombooking.dto.UserDetailsDto;
import com.innovan.roombooking.dto.UserDto;
import com.innovan.roombooking.model.User;
import com.innovan.roombooking.model.UserInformation;
import com.innovan.roombooking.repository.UserInformationRepository;
import com.innovan.roombooking.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserHandlingService {

    private final UserInformationRepository userInformationRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public UserHandlingService(
        UserInformationRepository userInformationRepository,
        PasswordEncoder passwordEncoder,
        UserRepository userRepository
    ) {
        this.userInformationRepository = userInformationRepository;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    public UserDetailsDto saveUser(UserDetailsDto userRequest) {
        User user = new User();
        user.setUsername(userRequest.getUsername());
        user.setRole(userRequest.getRole());
        user.setStatus(userRequest.getStatus());
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        var userValue = userRepository.save(user);
        return saveUserInformation(userRequest, userValue.getUserId());
    }

    public UserDetailsDto saveUserInformation(UserDetailsDto userDetailsDto, Long userId) {
        UserInformation userInformation = new UserInformation();
        userInformation.setLastName(userDetailsDto.getLastName());
        userInformation.setFirstName(userDetailsDto.getFirstName());
        userInformation.setEmailId(userDetailsDto.getEmail());
        userInformation.setIsActive("Y");
        userInformation.setJoinedDate(LocalDate.now());
        userInformation.setUserId(userId);

        userDetailsDto.setUserId(userId);
        userInformationRepository.save(userInformation);
        return userDetailsDto;
    }

    public List<UserDto> getAllUsersInfo(Long userId) {
        List<UserDto> dtos = userRepository
            .findByUserId(userId)
            .stream()
            .map((User user) -> new UserDto(user.getUserId(), user.getUsername(), user.getRole()))
            .toList();
        UserInformation information = userInformationRepository
            .findByUserId(userId)
            .orElseThrow(() ->
                new RuntimeException("User information not found for user ID: " + userId)
            );
        dtos.forEach((UserDto userDto) -> {
            userDto.setFirstName(information.getFirstName());
            userDto.setLastName(information.getLastName());
            String role = userDto.getRole().toLowerCase();
            userDto.setRole(role.substring(0, 1).toUpperCase() + role.substring(1));
        });
        return dtos;
    }

    public UserDetailsDto updateUser(Long userId, UserDetailsDto userRequest) {
        User existingUser = userRepository
            .findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        UserInformation userInformation = userInformationRepository
            .findByUserId(userId)
            .orElseThrow(() ->
                new RuntimeException("User information not found for user ID: " + userId)
            );

        if (userRequest.getUsername() != null) existingUser.setUsername(userRequest.getUsername());

        if (userRequest.getRole() != null) existingUser.setRole(userRequest.getRole());

        if (
            userRequest.getPassword() != null && !userRequest.getPassword().isEmpty()
        ) existingUser.setPassword(passwordEncoder.encode(userRequest.getPassword()));

        userRepository.save(existingUser);

        if (userRequest.getFirstName() != null) userInformation.setFirstName(
            userRequest.getFirstName()
        );

        if (userRequest.getLastName() != null) userInformation.setLastName(
            userRequest.getLastName()
        );

        if (userRequest.getEmail() != null) userInformation.setEmailId(userRequest.getEmail());

        if (userRequest.getIsActive() != null) userInformation.setIsActive(
            userRequest.getIsActive()
        );

        userInformationRepository.save(userInformation);

        UserDetailsDto updatedDto = new UserDetailsDto();
        updatedDto.setUserId(userId);
        updatedDto.setUsername(existingUser.getUsername());
        updatedDto.setRole(existingUser.getRole());
        updatedDto.setFirstName(userInformation.getFirstName());
        updatedDto.setLastName(userInformation.getLastName());
        updatedDto.setEmail(userInformation.getEmailId());
        updatedDto.setIsActive(userInformation.getIsActive());
        updatedDto.setPassword(null);

        return updatedDto;
    }
}
