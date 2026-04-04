# Frontend-Backend Integration Guide

## Overview
The frontend is now connected to the REST API through the new `api.js` client library. This guide explains the integration setup and how to use the API in your frontend code.

## Files Created/Modified

### 1. **assets/js/api.js** (NEW)
A complete API client library with functions for:
- **Problems**: `apiGetProblems()`, `apiGetProblemById()`
- **Submissions**: `apiCreateSubmission()`, `apiGetSubmission()`
- **Admin**: `apiAdminCreateProblem()`, `apiAdminUpdateProblem()`, `apiAdminDeleteProblem()`, `apiAdminAddTestCase()`


### 2. **Updated HTML Files**
All HTML files now include the API client:
- `index.html` ✅
- `problems.html` ✅
- `profile.html` ✅
- `parameters.html` ✅

## How to Use the API Client

### Authentication
Authentication is currently disabled in local development mode.

### Get Problems
```javascript
// Fetch all problems
const result = await apiGetProblems();
if (result.success) {
  result.data.forEach(problem => {
    console.log(problem.name, problem.difficulty_level);
  });
}

// Get specific problem with public test cases
const result = await apiGetProblemById(1);
if (result.success) {
  const problem = result.data;
  console.log('Problem:', problem.name);
  console.log('Public test cases:', problem.test_cases);
}
```

### Submit Code
```javascript
// Only works if user is authenticated
const result = await apiCreateSubmission(
  problemId = 1,
  languageId = 'python',
  codeBody = 'def solve(nums, target): return [0, 1]'
);
if (result.success) {
  console.log('Submission created:', result.data.id, result.data.status);
}

// Get submission status
const result = await apiGetSubmission(submissionId);
if (result.success) {
  console.log('Status:', result.data.status);
}
```

## Integration Steps for Frontend

### Step 1: Add Login Modal
Create a login form in `index.html`:
```html
<div id="authModal" class="modal">
  <form id="loginForm" class="modal-content">
    <h2>Login</h2>
    <input type="text" id="username" placeholder="Username" required>
    <input type="password" id="password" placeholder="Password" required>
    <button type="submit">Login</button>
  </form>
</div>
```

### Step 2: Handle Login in script.js
```javascript
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  const result = await apiLogin(username, password);
  if (result.success) {
    // Close modal, show success
    window.location.href = 'problems.html';
  } else {
    // Show error
    alert(result.message);
  }
});
```

### Step 3: Load Problems Dynamically
Instead of hardcoded cards, load from API in `problems.html`:
```javascript
// In script.js when problems.html loads
async function loadProblems() {
  const result = await apiGetProblems();
  
  if (result.success) {
    const grid = document.querySelector('.problem-grid');
    grid.innerHTML = ''; // Clear existing cards
    
    result.data.forEach(problem => {
      const card = document.createElement('article');
      card.className = 'problem-card panel';
      card.innerHTML = `
        <div class="problem-top">
          <h3>${problem.name}</h3>
          <span class="difficulty ${problem.difficulty_level}">
            ${problem.difficulty_level}
          </span>
        </div>
        <p>${problem.description}</p>
        <div class="meta-line">
          <span>${problem.acceptance_rate || 'N/A'}%</span>
        </div>
        <div class="problem-actions">
          <a class="btn btn-primary" onclick="openProblem(${problem.id})">Resoudre</a>
        </div>
      `;
      grid.appendChild(card);
    });
  }
}

// Call on page load
loadProblems();
```

### Step 4: Handle Problem Submission
```javascript
// When user clicks "Submit" in the editor
async function submitCode(problemId, languageId, code) {
  if (!isAuthenticated()) {
    alert('Please login to submit code');
    return;
  }
  
  const result = await apiCreateSubmission(problemId, languageId, code);
  if (result.success) {
    alert('Code submitted! Submission ID: ' + result.data.id);
  } else {
    alert('Submission failed: ' + result.message);
  }
}
```

## Environment Variables (Backend)

Make sure your REST API is running with correct environment variables:

```bash
# In RestAPI/.env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=algoforge_db
JWT_SECRET=your_secret_key_here
```

## Starting the Servers

In separate terminals:

```bash
# Terminal 1: Start the REST API
cd RestAPI
npm run dev

# Terminal 2: Start the frontend (simple HTTP server)
cd /path/to/root
npx serve . -l 3000
```

The API will be at `http://localhost:3000/api` (as configured in api.js)
The frontend will be at `http://localhost:3000`

## Error Handling

All API functions return a consistent response format:
```javascript
{
  success: true/false,
  message: "Description",
  data: {...},
  errors: "Error details if any"
}
```

Always check `response.success` before using `response.data`.

## Next Steps

1. **Create Login Modal**: Add authentication UI to index.html
2. **Load Problems Dynamically**: Modify problems.html to fetch from API
3. **Handle Submissions**: Connect the code editor submission button to this API
4. **Display User Profile**: Show logged-in user stats and submission history in profile.html
5. **Add Admin Panel**: Create admin.html for problem management
6. **Testing**: Test all flows end-to-end before deployment

## Troubleshooting

**"API is not running"**: Make sure REST API server is running on port 3000
**"Not authenticated"**: Check that JWT token is saved in localStorage
**"CORS error"**: The CORS headers are now enabled on the backend
**"404 on /api/..."**: Verify API routes are correctly defined in RestAPI/src/routes/
