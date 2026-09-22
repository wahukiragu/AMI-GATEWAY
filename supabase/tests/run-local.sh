#!/usr/bin/env bash
# Runs migrations + RLS tests against a throwaway Postgres database.
# Usage:  PGURL=postgresql://postgres:postgres@localhost:5432 ./supabase/tests/run-local.sh
set -euo pipefail
cd "$(dirname "$0")/.."
BASE="${PGURL:-postgresql://postgres@localhost:5432}"
DB="ami_gateway_test"
psql "$BASE/postgres" -v ON_ERROR_STOP=1 -q -c "drop database if exists $DB" -c "create database $DB"
URL="$BASE/$DB"
psql "$URL" -v ON_ERROR_STOP=1 -q -f tests/00_stubs.sql
for f in migrations/*.sql; do
  echo "applying $f"
  psql "$URL" -v ON_ERROR_STOP=1 -q -f "$f"
done
echo "running tests/rls.sql"
psql "$URL" -v ON_ERROR_STOP=1 -q -f tests/rls.sql
echo "ALL DATABASE TESTS PASSED"
