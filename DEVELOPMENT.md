# 🛠️ Development Guide

This guide explains how to set up and use AlgoForge for development.

## Quick Start

### 1. Database Setup
```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE coding_platform;"

# Import schema
psql -U postgres -d coding_platform -f DataStructure/coding_platform_db.sql
```

### 2. Start REST API
```bash
cd RestAPI
npm install
npm run dev
```

**The API will automatically create a default admin user:**
- Username: `admin`
- Password: `admin123`
- Check logs: `✓ Default admin user created`

### 3. Start Frontend (in another terminal)
```bash
cd CodeEditorIntegration
npm install
npm run build
cd ..
npx serve . -l 3000
```

### 4. Access the App
- **Home**: `http://localhost:3000`
- **Problems**: `http://localhost:3000/problems.html`
- **Admin Dashboard**: `http://localhost:3000/admin/dashboard.html`

---

## Development Accounts

### Admin Account (Created Automatically)
```
Username: admin
Password: admin123
Email: admin@dev.local
```

**Permissions:**
- Create, read, update, delete problems
- Manage test cases
- View all submissions
- Access admin dashboard

### Regular User (Optional - Create Manually)
Authentication is currently disabled in local development mode.

---

## Common Tasks

### View Database
```bash
psql -U postgres -d coding_platform

# Useful queries:
SELECT username, email, is_admin FROM users;
SELECT * FROM problems;
SELECT * FROM submissions;
```

### Reset Admin Password
```bash
# In psql:
UPDATE users SET password = '$2a$10$8q1l7/JzNSNVq1/m4Uw9T.eZVNBJBv1dkGBL.Eg3cN3V7vF8R7HUe' 
WHERE username = 'admin';
```
(This sets it back to `admin123`)

### Clear All Data & Restart
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE coding_platform;"
psql -U postgres -c "CREATE DATABASE coding_platform;"
psql -U postgres -d coding_platform -f DataStructure/coding_platform_db.sql

# Restart API (auto-creates admin again)
npm run dev
```

### Seed Sample Data
```bash
# Run the seed script
psql -U postgres -d coding_platform -f DataStructure/seed.sql
```

---

## Environment Variables

### RestAPI/.env
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=coding_platform
JWT_SECRET=your_secret_key_for_jwt_tokens
NODE_ENV=development
```

---

## Troubleshooting

### "Connection refused" on API startup
- Check if PostgreSQL is running: `psql -U postgres -c "SELECT 1;"`
- Verify credentials in `.env` file

### "Admin user already exists" message
- This is normal on subsequent restarts
- The admin will only be created once

### Admin not found in database
- Make sure API started successfully and created the user
- Check PostgreSQL is running before starting API

### Can't access admin dashboard
- Make sure the API is running on `http://localhost:3000`
- Make sure the frontend server is running and pointing to `/api`

---

## Testing the API

### Get All Problems (as Admin)
```bash
curl -X GET http://localhost:3000/api/admin/problems \
  -H "Content-Type: application/json"
```

### Create Problem (Admin Only)
```bash
curl -X POST http://localhost:3000/api/admin/problems \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Two Sum",
    "difficulty_level": "easy",
    "description": "Find two numbers that add up to target",
    "is_published": true
  }'
```

---

## Production Notes

⚠️ **Before deploying to production:**

1. **Change default credentials** - Remove auto-creation of admin user
2. **Set strong JWT_SECRET** - Use a random, secure string
3. **Enable HTTPS** - Use SSL/TLS certificates
4. **Set NODE_ENV=production** - In `.env`
5. **Use strong database passwords** - Do not use default credentials
6. **Add rate limiting** - Prevent brute-force attacks
7. **Enable logging & monitoring** - Track API usage and errors
8. **Test thoroughly** - Run full test suite before deployment

---

## File Structure

```
RestAPI/
├── src/
│   ├── main.ts                 # Express server entry point
│   ├── config/
│   │   ├── database.ts         # PostgreSQL connection
│   │   ├── jwt.ts              # JWT configuration
│   │   └── seedData.ts         # Auto-create default admin ⭐
│   ├── controllers/
│   │   ├── authController.ts   # Login/Register
│   │   ├── problemController.ts # Problem CRUD
│   │   ├── submissionController.ts
│   │   └── adminController.ts  # Admin-only operations
│   ├── middleware/
│   │   ├── authenticate.ts     # JWT verification
│   │   ├── authorize.ts        # Admin check
│   │   └── errorHandler.ts     # Error responses
│   ├── routes/                 # API endpoints
│   ├── types/                  # TypeScript interfaces
│   └── utils/                  # Helper functions
└── package.json

authentication/
├── login.html              # Universal login page
├── register.html           # Registration page
└── js/
    └── auth.js             # Auth logic & role-based redirect

admin/
├── dashboard.html          # Admin stats & overview
├── problems.html           # Problem management (CRUD)
└── js/
    ├── admin-access-check.js   # Verify admin role
    ├── admin-dashboard.js       # Dashboard logic
    └── admin-problems.js        # Problem management logic

assets/
├── js/
│   ├── api.js              # REST API client (fetch wrapper)
│   └── script.js           # Page interactions
└── css/
    └── styles.css          # Unified styling
```

---

## Need Help?

Check the following:
1. `README.md` - General project overview
2. `FRONTEND_INTEGRATION.md` - How to use the API from frontend
3. `RestAPI/package.json` - All dependencies and their versions
4. Terminal logs - Error messages usually point to the problem
