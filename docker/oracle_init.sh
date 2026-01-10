#!/bin/sh

set -e

# must match settings in docker-compose
DB_URL="REC/password@//localhost/REC_LOCAL"

run_sql()
{
  sqlplus -s ${DB_URL} <<EOF
@${1}
QUIT;
EOF
}

cd /database/initialization/ddl
echo "Creating tables"
run_sql 0_CREATE_TABLES.sql
cd /database/initialization/seed
echo "Data init"
run_sql 0_SEED_DATA_INIT.sql
echo "Sequences"
run_sql 2_CREATE_SEQUENCES.sql

echo "Done"
