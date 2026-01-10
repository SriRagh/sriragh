package com.innovan.roombooking.repository;

import com.innovan.roombooking.model.UserInformation;
import jakarta.transaction.Transactional;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserInformationRepository extends JpaRepository<UserInformation, Long> {
    Optional<UserInformation> findByUserId(Long id);

    @Transactional
    void deleteByUserId(Long userId);
}
