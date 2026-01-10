package com.innovan.roombooking.auth;

import org.springframework.security.core.userdetails.UserDetails;

public interface IAuthenticationFacade {
    UserDetails getUserDetails();
}
