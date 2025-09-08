# Backend API Documentation

This is currently a DEMO / WORK IN PROGRESS, do not use in production as is.

## Endpoints

### Test Text

**Endpoint:** `GET /hello`

**Description:**
Returns a simple text greeting message. Useful for testing if the server is running.

**Response:**
```
Hello, this is some text data!
```

**Example Usage:**
```typescript
const response = await fetch('http://localhost:3000/hello');
const text = await response.text();
console.log(text); // "Hello, this is some text data!"
```

### Test JSON

**Endpoint:** `GET /api/hello`

**Description:**
Returns a JSON greeting message. Useful for testing JSON responses.

**Response:**
```json
{
  "message": "Hello, this is some JSON data from the server backend!"
}
```

**Example Usage:**
```typescript
const response = await fetch('http://localhost:3000/api/hello');
const data = await response.json();
console.log(data); // { message: "Hello, this is some JSON data from the server backend!" }
```

### Login

**Endpoint:** `POST /api/login`

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": number,
    "username": "string",
    "admin": boolean
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input (username and password must be strings)
- `401 Unauthorized`: Invalid credentials or missing username/password
- `500 Internal Server Error`: Server-side error

**Example Usage:**
```typescript
try {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'user',
      password: 'pass'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  console.log('Login successful:', data.user);
} catch (error) {
  console.error('Login error:', error);
  // Handle error appropriately
}
```

### Logout

**Endpoint:** `POST /api/logout`

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Not logged in (no session cookie)
- `500 Internal Server Error`: Server-side error

**Example Usage:**
```typescript
try {
  const response = await fetch('/api/logout', {
    method: 'POST',
    credentials: 'include' // Important: needed to send cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Logout failed');
  }

  const data = await response.json();
  console.log('Logout successful:', data.message);
  // Optionally redirect to login page or update UI
} catch (error) {
  console.error('Logout error:', error);
  // Handle error appropriately
}
```

### Protected Endpoint Example

**Endpoint:** `GET /api/protected`

**Response:**
```json
{
  "message": "This is a protected endpoint"
}
```

**Error Responses:**
- `401 Unauthorized`: Not logged in or invalid session
- `500 Internal Server Error`: Server-side error

**Example Usage:**
```typescript
try {
  const response = await fetch('/api/protected', {
    credentials: 'include' // Important: needed to send cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Access denied');
  }

  const data = await response.json();
  console.log('Protected data:', data);
} catch (error) {
  console.error('Protected endpoint error:', error);
  // Handle error appropriately
}
```

## Development

### Setup
1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
node setup-database.js
```

3. Start the development server:
```bash
npm run dev
```

The server will start on port 4000 by default. You can change this by setting the `PORT` environment variable. 
