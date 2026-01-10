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

    @Query(value = "SELECT count(*) FROM USERS u JOIN USER_INFORMATION uif ON u.user_id = uif.user_id WHERE uif.active_flag <> 'N'", nativeQuery = true)
    Long countAllUsers();

    @Query(value = "SELECT u.user_id, u.user_name, uif.first_name, uif.last_name, u.user_role, uif.email_id, uif.active_flag, uif.joined_date FROM USERS u JOIN USER_INFORMATION uif ON u.user_id = uif.user_id", nativeQuery = true)
    List<Object[]> findAllActiveUsers();
}
