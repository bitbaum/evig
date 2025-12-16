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
    password_hash VARCHAR(255),
    name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email_verified TIMESTAMP WITH TIME ZONE,
    image TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'user')),
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

-- Create indexes for better performance (only create if tables exist and have the expected columns)
DO $$
BEGIN
    -- Users table indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
            CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
            CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
        END IF;
    END IF;

    -- Categories table indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'slug') THEN
            CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_active') THEN
            CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
        END IF;
    END IF;

    -- Static pages table indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'static_pages') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'static_pages' AND column_name = 'slug') THEN
            CREATE INDEX IF NOT EXISTS idx_static_pages_slug ON static_pages(slug);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'static_pages' AND column_name = 'is_published') THEN
            CREATE INDEX IF NOT EXISTS idx_static_pages_is_published ON static_pages(is_published);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'static_pages' AND column_name = 'published_at') THEN
            CREATE INDEX IF NOT EXISTS idx_static_pages_published_at ON static_pages(published_at);
        END IF;
    END IF;

    -- Blog posts table indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'slug') THEN
            CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'is_published') THEN
            CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'published_at') THEN
            CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'category_id') THEN
            CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'tags') THEN
            CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN (tags);
        END IF;
    END IF;
END $$;

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
    -- Create triggers only if tables exist and triggers don't already exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
            CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
            CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'static_pages') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_static_pages_updated_at') THEN
            CREATE TRIGGER update_static_pages_updated_at BEFORE UPDATE ON static_pages
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_blog_posts_updated_at') THEN
            CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

-- Insert default data only if tables exist and have the expected schema
DO $$
BEGIN
    -- Insert default admin user only if users table exists and has ALL expected columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = 'users' AND column_name IN ('id', 'email', 'password_hash', 'first_name', 'last_name', 'role')) = 6 THEN
            INSERT INTO users (id, email, password_hash, first_name, last_name, role)
            VALUES (
                '00000000-0000-0000-0000-000000000001',
                'admin@revampit.ch',
                '$2b$10$8K3VzJcXcQzJcXcQzJcXcQ.K3VzJcXcQzJcXcQzJcXcQzJcXcQzJcXcQ', -- Admin123!
                'Admin',
                'RevampIT',
                'admin'
            ) ON CONFLICT (email) DO NOTHING;
        END IF;
    END IF;
END $$;



