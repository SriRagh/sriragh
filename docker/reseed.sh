#!/bin/sh

set -e

STARTTIME=$(date +%s)

echo "Deleting data"
cd /database/initialization
sqlplus -s 'INNOVAN/password@//localhost/FCM_LOCAL' <<EOF
@DROP_BES_TABLES.sql
QUIT;
EOF
echo "Finished deleting data"

echo "Reseeding data"
cd /container-entrypoint-initdb.d
sh oracledb_init.sh

ENDTIME=$(date +%s)
echo "Elapsed time: $((${ENDTIME} - ${STARTTIME})) seconds"
echo "Done"
