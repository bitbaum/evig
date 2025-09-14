-- Migration: 001_initial_schema
-- Description: Create initial database schema for RevampIT CMS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table for authentication and authorization
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories table for organizing blog posts
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code like #FF5733
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Static pages table for pages like About, Contact, etc.
CREATE TABLE IF NOT EXISTS static_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    seo_title VARCHAR(500),
    seo_description TEXT,
    meta_keywords TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    seo_title VARCHAR(500),
    seo_description TEXT,
    meta_keywords TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

CREATE INDEX IF NOT EXISTS idx_static_pages_slug ON static_pages(slug);
CREATE INDEX IF NOT EXISTS idx_static_pages_is_published ON static_pages(is_published);
CREATE INDEX IF NOT EXISTS idx_static_pages_published_at ON static_pages(published_at);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN (tags);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables (with conditional creation)
DO $$
BEGIN
    -- Create triggers only if they don't already exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
        CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_static_pages_updated_at') THEN
        CREATE TRIGGER update_static_pages_updated_at BEFORE UPDATE ON static_pages
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_blog_posts_updated_at') THEN
        CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert default admin user (password: Admin123!)
-- Note: In production, this should be created through the API or manually
INSERT INTO users (id, email, password_hash, first_name, last_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@revampit.ch',
    '$2b$10$8K3VzJcXcQzJcXcQzJcXcQ.K3VzJcXcQzJcXcQzJcXcQzJcXcQzJcXcQ', -- Admin123!
    'Admin',
    'RevampIT',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert default categories
INSERT INTO categories (id, slug, name, description, color, created_by, updated_by) VALUES
    ('11111111-1111-1111-1111-111111111111', 'uncategorized', 'Uncategorized', 'Default category for posts', '#6B7280', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('22222222-2222-2222-2222-222222222222', 'news', 'News', 'Latest news and updates', '#3B82F6', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('33333333-3333-3333-3333-333333333333', 'tutorials', 'Tutorials', 'Step-by-step guides and tutorials', '#10B981', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('44444444-4444-4444-4444-444444444444', 'projects', 'Projects', 'Project updates and showcases', '#F59E0B', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (slug) DO NOTHING;



