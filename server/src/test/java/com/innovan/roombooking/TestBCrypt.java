package com.innovan.roombooking;

import org.junit.runner.RunWith;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@RunWith(MockitoJUnitRunner.class)
public class TestBCrypt {

    public static void main(String[] args) {
        String rawPassword = "password123";
        String dbHash = "$2a$10$ZpQkrgjdBOijPWGu1sB.FO6l3hCXlA.eGYHeB2duw1f0LLv/Z4HRe";

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("Matches? " + encoder.matches(rawPassword, dbHash));
    }
}
