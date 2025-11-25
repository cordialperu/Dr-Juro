-- Migration: Add user roles
-- Description: Adds a 'role' column to users table for role-based access control
-- Date: 2024

-- Add role column to users table
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'abogado' CHECK (role IN ('admin', 'abogado', 'asistente'));

-- Update any existing users to have a default role
UPDATE users SET role = 'abogado' WHERE role IS NULL;

-- Create an index for faster role-based queries
CREATE INDEX idx_users_role ON users(role);

-- Add a comment to the column
COMMENT ON COLUMN users.role IS 'User role for access control: admin (full access), abogado (standard lawyer access), asistente (read-only access)';
