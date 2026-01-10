INSERT INTO USER_INFORMATION (user_information_id, user_id, first_name, last_name, email_id, joined_date, active_flag, created_by, updated_by, created_date, updated_date) 
VALUES (1, 1, 'Sri', 'Ragh', 'sriragh@innovan.com', SYSDATE, 'Y', 'SYSTEM', 'SYSTEM', SYSDATE, SYSDATE);
COMMIT;
EXIT;
