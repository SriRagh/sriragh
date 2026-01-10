package com.innovan.roombooking.controller;

import com.innovan.roombooking.dto.UserDetailsDto;
import com.innovan.roombooking.dto.UserDto;
import com.innovan.roombooking.service.UserHandlingService;
import com.innovan.roombooking.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserHandlingService userHandlingService;
    private final UserService userService;

    @PostMapping("/create")
    public ResponseEntity<UserDetailsDto> saveUser(@RequestBody UserDetailsDto userRequest) {
        UserDetailsDto userDetailsDto = userHandlingService.saveUser(userRequest);
        return ResponseEntity.ok(userDetailsDto);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<UserDetailsDto> updateUser(
        @PathVariable("id") Long userId,
        @RequestBody UserDetailsDto userRequest
    ) {
        UserDetailsDto updatedUser = userHandlingService.updateUser(userId, userRequest);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/userInfo")
    public ResponseEntity<List<UserDto>> getAllUsers(@RequestParam Long userId) {
        List<UserDto> users = userHandlingService.getAllUsersInfo(userId);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/totalUsers")
    public ResponseEntity<Long> getUserCount() {
        return ResponseEntity.ok(userService.getUserCount());
    }

    @GetMapping("/activeUsers")
    public List<UserDetailsDto> getAllActiveUsers() {
        return userService.getAllActiveUsers();
    }

    @DeleteMapping("/deleteUser/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable("id") Long userId) {
        boolean deleted = userService.deleteUser(userId);
        if (deleted) {
            return ResponseEntity.ok("User deleted successfully");
        } else {
            return ResponseEntity.status(404).body("User not found with id " + userId);
        }
    }
}
