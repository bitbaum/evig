-- Initial database setup for RevampIT CMS
-- This file runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist
-- Note: This is handled by POSTGRES_DB environment variable in docker-compose.yml

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial migration record (the 001_initial_schema.sql will be run by the application)
INSERT INTO migrations (name) VALUES ('001_initial_schema')
ON CONFLICT (name) DO NOTHING;


