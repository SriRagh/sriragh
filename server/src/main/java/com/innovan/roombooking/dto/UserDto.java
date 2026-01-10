package com.innovan.roombooking.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UserDto {

    private Long userId;
    private String username;
    private String role;
    private String firstName;
    private String lastName;

    public UserDto(Long userId, String username, String role) {
        this.userId = userId;
        this.username = username;
        this.role = role;
    }
}
