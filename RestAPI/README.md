# LeetCode-Style Platform REST API

A production-ready REST API for a LeetCode-style coding platform built with **Node.js**, **Express**, and **TypeScript**.

## 📋 Table of Contents

- [Features](#features)
- [Quick Setup](#quick-setup)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Security Best Practices](#security-best-practices)
- [Database Schema](#database-schema)

## ✨ Features

- ✅ JWT-based authentication
- ✅ Role-based access control (Admin/User)
- ✅ Problem management with test cases
- ✅ Code submission tracking
- ✅ Public/Hidden test case separation (security)
- ✅ Comprehensive error handling
- ✅ Type-safe with TypeScript
- ✅ Modular architecture

## 🚀 Quick Setup

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your database credentials and JWT secret:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=coding_platform

   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   JWT_EXPIRY=24h

   PORT=3000
   NODE_ENV=development
   ```

3. **Setup the database:**
   ```bash
   psql -U postgres -d coding_platform -f ../DataStructure/coding_platform_db.sql
   ```

4. **Build TypeScript:**
   ```bash
   npm run build
   ```

5. **Start the server:**
   ```bash
   npm run dev      # Development with ts-node
   npm start        # Production (requires build first)
   ```

The API will be available at `http://localhost:3000`

---

## 📡 API Endpoints

### Authentication

#### `POST /api/auth/register`
Create a new user account.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "is_admin": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "Missing required fields",
  "errors": "username, email, and password are required"
}
```

---

#### `POST /api/auth/login`
Authenticate a user and receive a JWT token.

**Request:**
```json
{
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "is_admin": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "errors": "Username or password is incorrect"
}
```

---

### Public Problems

#### `GET /api/problems`
List all published problems with basic info.

**Response (200):**
```json
{
  "success": true,
  "message": "Problems retrieved successfully",
  "data": [
    {
      "problem_id": 1,
      "name": "Two Sum",
      "difficulty_level": "easy",
      "solve_rate": 45.50
    },
    {
      "problem_id": 2,
      "name": "Median of Two Sorted Arrays",
      "difficulty_level": "hard",
      "solve_rate": 32.10
    }
  ]
}
```

---

#### `GET /api/problems/:id`
Get detailed problem information with public test cases only.

**⚠️ SECURITY NOTE:** Only public test cases (`is_hidden=false`) are returned. Hidden test cases are for grading only.

**Response (200):**
```json
{
  "success": true,
  "message": "Problem retrieved successfully",
  "data": {
    "problem_id": 1,
    "name": "Two Sum",
    "difficulty_level": "easy",
    "solve_rate": 45.50,
    "description": "Given an array of integers nums and an integer target...",
    "constraints": "1 <= nums.length <= 10^4",
    "public_test_cases": [
      {
        "test_case_id": 1,
        "problem_id": 1,
        "input_data": "[2,7,11,15], target = 9",
        "expected_output": "[0,1]",
        "is_hidden": false
      },
      {
        "test_case_id": 2,
        "problem_id": 1,
        "input_data": "[3,2,4], target = 6",
        "expected_output": "[1,2]",
        "is_hidden": false
      }
    ]
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Problem not found",
  "errors": "Problem with ID 999 does not exist"
}
```

---

### User Submissions (Protected)

All submission endpoints require authentication with a JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

#### `POST /api/submissions`
Submit code for a problem.

**Request:**
```json
{
  "problem_id": 1,
  "language_id": 2,
  "code_body": "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    if (map.has(target - nums[i])) {\n      return [map.get(target - nums[i]), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Submission created successfully",
  "data": {
    "submission_id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "problem_id": 1,
    "language_id": 2,
    "code_body": "function twoSum(nums, target) { ... }",
    "status": "Pending",
    "submitted_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "Missing or invalid authorization header",
  "errors": "No token provided"
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "Invalid submission data",
  "errors": "problem_id, language_id, and code_body are required"
}
```

---

#### `GET /api/submissions/:submissionId`
Retrieve a specific submission (users can only see their own, admins can see all).

**Response (200):**
```json
{
  "success": true,
  "message": "Submission retrieved successfully",
  "data": {
    "submission_id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "problem_id": 1,
    "language_id": 2,
    "code_body": "function twoSum(nums, target) { ... }",
    "status": "Accepted",
    "runtime_ms": 45,
    "memory_kb": 2048,
    "submitted_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error (403):**
```json
{
  "success": false,
  "message": "Forbidden",
  "errors": "You do not have permission to view this submission"
}
```

---

### Admin Management (Protected & Admin-Only)

All admin endpoints require authentication with `is_admin=true`.

#### `GET /api/admin/problems`
List all problems including unpublished drafts.

**Response (200):**
```json
{
  "success": true,
  "message": "Problems retrieved successfully",
  "data": [
    {
      "problem_id": 1,
      "name": "Two Sum",
      "difficulty_level": "easy",
      "solve_rate": 45.50,
      "description": "Given an array of integers..."
    }
  ]
}
```

**Error (403):**
```json
{
  "success": false,
  "message": "Forbidden",
  "errors": "Admin privileges required"
}
```

---

#### `POST /api/admin/problems`
Create a new problem.

**Request:**
```json
{
  "name": "Two Sum",
  "difficulty_level": "easy",
  "description": "Given an array of integers nums and an integer target, return the indices [i, j] such that nums[i] + nums[j] == target...",
  "is_published": false,
  "constraints": "1 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, -10^9 <= target <= 10^9"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Problem created successfully",
  "data": {
    "problem_id": 1,
    "name": "Two Sum",
    "difficulty_level": "easy",
    "solve_rate": 0.00
  }
}
```

---

#### `PUT /api/admin/problems/:id`
Update an existing problem.

**Request:**
```json
{
  "name": "Two Sum (Updated)",
  "difficulty_level": "easy",
  "description": "Updated description..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Problem updated successfully",
  "data": {
    "problem_id": 1,
    "name": "Two Sum (Updated)",
    "difficulty_level": "easy",
    "solve_rate": 45.50
  }
}
```

---

#### `DELETE /api/admin/problems/:id`
Delete a problem (cascade deletes test cases and submissions).

**Response (200):**
```json
{
  "success": true,
  "message": "Problem deleted successfully"
}
```

---

#### `POST /api/admin/problems/:id/testcases`
Add a test case to a problem.

**Request:**
```json
{
  "input_data": "[2,7,11,15], target = 9",
  "expected_output": "[0,1]",
  "is_hidden": false
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Test case added successfully",
  "data": {
    "test_case_id": 1,
    "problem_id": 1,
    "input_data": "[2,7,11,15], target = 9",
    "expected_output": "[0,1]",
    "is_hidden": false
  }
}
```

---

## 🔐 Authentication

### JWT Token Format
Tokens include user ID, username, and admin status:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "is_admin": false,
  "iat": 1705334400,
  "exp": 1705420800
}
```

### Using Tokens in Requests
Include the token in the `Authorization` header:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/problems/1
```

### Token Expiry
Default token expiry is **24 hours**. Configure in `.env`:
```env
JWT_EXPIRY=24h
```

---

## ⚠️ Error Handling

All errors follow a consistent format:

**Standard Error Response:**
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": "Detailed error information or array of errors"
}
```

### HTTP Status Codes
| Status | Use Case |
|--------|----------|
| 200 | Successful GET/PUT request |
| 201 | Resource created (POST) |
| 400 | Bad request (validation error) |
| 401 | Authentication required or failed |
| 403 | Forbidden (authorization failed) |
| 404 | Resource not found |
| 500 | Internal server error |

---

## 🔒 Security Best Practices

### 1. **Test Case Isolation**
- Only **public test cases** (`is_hidden=false`) are returned to users
- **Hidden test cases** are used for grading only and never exposed via API
- Controlled in `problemController.ts`:
```sql
WHERE problem_id = $1 AND is_hidden = false
```

### 2. **Password Security**
- Passwords are hashed with bcryptjs (10 salt rounds)
- Never returning plain passwords in responses
- Implemented in `utils/password.ts`

### 3. **JWT Secret Management**
- Store `JWT_SECRET` in environment variables
- Never commit `.env` to version control
- Use strong, unique secrets in production

### 4. **Role-Based Access Control**
- Admin endpoints protected with `requireAdmin` middleware
- Users can only see their own submissions
- Authorization enforced in controllers:
```typescript
if (submission.user_id !== req.user.user_id && !req.user.is_admin) {
  throw new AppError(403, 'Forbidden', '...');
}
```

### 5. **Input Validation**
- All requests validated for required fields
- Type checking with TypeScript
- Email format validation with regex

### 6. **Error Messages**
- Production errors don't leak sensitive information
- Detailed errors only in development mode

---

## 📦 Project Structure

```
RestAPI/
├── src/
│   ├── controllers/          # Business logic for endpoints
│   │   ├── authController.ts
│   │   ├── problemController.ts
│   │   ├── submissionController.ts
│   │   └── adminController.ts
│   ├── routes/               # API route definitions
│   │   ├── authRoutes.ts
│   │   ├── problemRoutes.ts
│   │   ├── submissionRoutes.ts
│   │   └── adminRoutes.ts
│   ├── middleware/           # Express middleware
│   │   ├── authenticate.ts   # JWT verification
│   │   ├── authorize.ts      # Admin role check
│   │   └── errorHandler.ts   # Global error handler
│   ├── config/               # Configuration files
│   │   ├── database.ts
│   │   └── jwt.ts
│   ├── types/                # TypeScript interfaces
│   │   └── index.ts
│   ├── utils/                # Utility functions
│   │   ├── password.ts
│   │   └── token.ts
│   └── main.ts               # Server entry point
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🧪 Testing Endpoints

### Using cURL
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","email":"john@example.com","password":"securePassword123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"securePassword123"}'

# Get Problems
curl http://localhost:3000/api/problems

# Get Problem Details
curl http://localhost:3000/api/problems/1

# Create Submission (with token)
curl -X POST http://localhost:3000/api/submissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"problem_id":1,"language_id":2,"code_body":"..."}'

# Admin: Create Problem
curl -X POST http://localhost:3000/api/admin/problems \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Problem Name","difficulty_level":"easy"}'
```

---

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | - | Database password (required) |
| `DB_NAME` | `coding_platform` | Database name |
| `JWT_SECRET` | `dev-secret-key-change-in-production` | JWT signing secret |
| `JWT_EXPIRY` | `24h` | Token expiration time |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment (development/production) |

---

## 📚 Database Integration

This API directly integrates with the PostgreSQL schema defined in `/DataStructure/coding_platform_db.sql`. Key tables:

- **users**: User accounts with authentication
- **problems**: Problem definitions
- **test_cases**: Test cases (public and hidden)
- **submissions**: User code submissions
- **languages**: Programming languages
- **topics**: Problem topics
- **user_problem**: User progress tracking

---

## 🚦 Next Steps

1. **Implement a job queue** (Redis/Bull) for processing submissions asynchronously
2. **Add code execution service** that runs submissions against test cases
3. **Set up logging** with Winston or Bunyan
4. **Add rate limiting** for production
5. **Write comprehensive tests** with Jest
6. **Deploy** to cloud (AWS, GCP, Heroku, etc.)

---

## 📄 License

This project is part of a LeetCode-style platform learning exercise.

