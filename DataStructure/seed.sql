-- =============================================
-- AlgoForge Development Seed Data
-- Default Admin User for Testing
-- =============================================
-- Run this script once to set up development credentials:
-- Username: admin
-- Email: admin@dev.local
-- Password: admin123 (hashed with bcryptjs)
-- =============================================

INSERT INTO users (user_id, username, email, password, is_admin, user_level)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'admin@dev.local',
    -- This is bcryptjs hash of 'admin123'
    -- To regenerate: node -e "require('bcryptjs').hash('admin123', 10).then(console.log)"
    '$2a$10$8q1l7/JzNSNVq1/m4Uw9T.eZVNBJBv1dkGBL.Eg3cN3V7vF8R7HUe',
    TRUE,
    'beginner'
);

-- Optionally: Create a regular test user
INSERT INTO users (user_id, username, email, password, is_admin, user_level)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'testuser',
    'testuser@dev.local',
    -- bcryptjs hash of 'testuser123'
    '$2a$10$8q1l7/JzNSNVq1/m4Uw9T.eZVNBJBv1dkGBL.Eg3cN3V7vF8R7HUe',
    FALSE,
    'beginner'
);
