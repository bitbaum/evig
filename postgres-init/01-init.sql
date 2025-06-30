-- Initialize RevampIT Blog Database
-- Create additional users or configurations if needed

-- Create extensions for better performance
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone to Swiss time
SET timezone = 'Europe/Zurich';

-- Create optimized indexes for better search performance
-- (Strapi will create the main tables)

-- Success message
SELECT 'RevampIT Database initialized successfully!' as message; 