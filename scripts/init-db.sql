-- Initialize database
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'travelmap_user') THEN
        CREATE ROLE travelmap_user LOGIN PASSWORD 'travelmap_password';
    END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE travelmap TO travelmap_user;
GRANT ALL ON SCHEMA public TO travelmap_user;

SET timezone = 'UTC';