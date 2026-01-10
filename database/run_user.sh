#!/bin/bash
echo "Connecting to ${APP_USER}/******@//localhost:1521/${ORACLE_DATABASE}"
sqlplus ${APP_USER}/\"${APP_USER_PASSWORD}\"@//localhost:1521/${ORACLE_DATABASE} @/database/create_user.sql
