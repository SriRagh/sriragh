package com.innovan.roombooking.repository;

import com.innovan.roombooking.dto.UserDetailsDto;
import com.innovan.roombooking.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    User findByUsernameIgnoreCase(String userName);

    List<User> findByUserId(Long id);

    @Query("SELECT COUNT(u) FROM User u JOIN UserInformation uif ON uif.userId = u.userId WHERE uif.isActive <> 'N'")
    Long countAllUsers();

    @Query("""
            SELECT new com.innovan.roombooking.dto.UserDetailsDto(\
            u.userId, u.username, uif.firstName, uif.lastName, u.role, uif.emailId, uif.isActive, uif.joinedDate) \
            FROM User u JOIN UserInformation uif ON uif.userId = u.userId\s""")
    List<UserDetailsDto> findAllActiveUsers();
}
