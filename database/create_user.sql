INSERT INTO USERS (user_id, user_name, user_password, user_role, status, created_date, created_by, updated_date, updated_by) 
VALUES (1, 'sriragh', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN', 'Active', SYSDATE, 'SYSTEM', SYSDATE, 'SYSTEM');
COMMIT;
EXIT;
