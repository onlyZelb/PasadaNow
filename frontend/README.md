# React — Frontend

This is the user-facing part of the application. It runs on **port 3000** and talks to both backend services. Built with React, Vite, and Tailwind CSS.

---

## What Does This Service Do?

- Shows a login and register page
- After login, shows a dashboard with the logged-in username
- Fetches and displays the product catalog from the PHP service
- Manages authentication state using a React Context + custom hook

It does **not** store any tokens itself — the browser handles the cookie automatically.

---

## Project Structure

```
react/
├── index.html                  ← Single HTML file (React mounts here)
├── vite.config.js              ← Vite build config
├── tailwind.config.js          ← Tailwind CSS config
├── package.json                ← Dependencies and scripts
└── src/
    ├── main.jsx                ← Entry point, mounts <App /> into the DOM
    ├── App.jsx                 ← Route definitions
    ├── index.css               ← Global styles + Tailwind imports
    ├── config/
    │   ├── axios.js            ← Axios instance for Spring Boot (port 8080)
    │   └── phpApi.js           ← Axios instance for PHP API (port 8081)
    ├── hooks/
    │   └── useAuth.jsx         ← Auth context + useAuth hook
    ├── components/
    │   ├── ProtectedRoute.jsx  ← Redirects to /login if not authenticated
    │   └── GuestRoute.jsx      ← Redirects to /dashboard if already logged in
    └── pages/
        ├── Login.jsx           ← Login form
        ├── Register.jsx        ← Registration form
        ├── Dashboard.jsx       ← Home page after login
        └── Catalog.jsx         ← Product list from PHP API
```

---

## Core Concepts

### 1. Vite — The Build Tool

Vite replaces Create React App. It starts a dev server with instant hot reload and bundles the app for production.

```bash
npm run dev      # start dev server (Docker Compose does this for you)
npm run build    # build for production
```

### 2. Two Axios Instances

The app talks to two different backends, so there are two pre-configured Axios instances:

```js
// config/axios.js — Spring Boot on port 8080
const api = axios.create({
    baseURL: 'http://localhost:8080',
    withCredentials: true,  // send cookies with every request
});

// config/phpApi.js — PHP on port 8081
const phpApi = axios.create({
    baseURL: 'http://localhost:8081',
    withCredentials: true,  // send cookies with every request
});
```

`withCredentials: true` is what tells the browser to include the `jwt` cookie when calling these APIs. Without it, the cookie is never sent and both backends return 401.

### 3. `useAuth` — Authentication State

`useAuth.jsx` uses React Context to share auth state across the entire app without prop drilling.

```
AuthProvider (wraps the whole app in App.jsx)
    │
    ├── checks /api/auth/me on startup → sets user state
    ├── login()  → calls Spring Boot, updates user state, navigates to /dashboard
    └── logout() → calls Spring Boot, clears user state, navigates to /login
```

Any component can access auth state by calling the hook:

```jsx
const { user, isAuthenticated, login, logout } = useAuth();
```

The `isLoading` state prevents a flash of the login page while the session check is in progress.

### 4. Route Guards

Two wrapper components control access to pages:

**`ProtectedRoute`** — wraps pages that require login (`/dashboard`, `/catalog`):
```jsx
// If not logged in → redirect to /login
return isAuthenticated ? children : <Navigate to="/login" replace />;
```

**`GuestRoute`** — wraps pages for logged-out users (`/login`, `/register`):
```jsx
// If already logged in → redirect to /dashboard
return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
```

This prevents a logged-in user from seeing the login page and vice versa.

### 5. App Routing (`App.jsx`)

```jsx
<Routes>
  <Route path="/"          element={<Navigate to="/login" />} />
  <Route path="/login"     element={<GuestRoute><Login /></GuestRoute>} />
  <Route path="/register"  element={<GuestRoute><Register /></GuestRoute>} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/catalog"   element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
</Routes>
```

`AuthProvider` wraps all routes so every page has access to auth state.

### 6. Fetching Products (`Catalog.jsx`)

```jsx
useEffect(() => {
    const fetchProducts = async () => {
        const { data } = await phpApi.get('/products');
        // browser automatically sends the jwt cookie here
        setProducts(data);
    };
    fetchProducts();
}, []);
```

The browser sends the `jwt` cookie automatically because `withCredentials: true` is set on the `phpApi` instance. PHP validates it and returns the product list.

---

## Pages

| Route | Component | Access |
|---|---|---|
| `/login` | `Login.jsx` | Guest only |
| `/register` | `Register.jsx` | Guest only |
| `/dashboard` | `Dashboard.jsx` | Logged in only |
| `/catalog` | `Catalog.jsx` | Logged in only |

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `react-router-dom` | Client-side routing between pages |
| `axios` | HTTP requests to both backend APIs |
| `lucide-react` | Icon library |
| `tailwindcss` | Utility-first CSS framework |

---

## Environment Variables

Set in `react/.env` and accessed via `import.meta.env` in Vite:

```env
VITE_API_BASE_URL=http://localhost:8080   # Spring Boot
VITE_PHP_API_URL=http://localhost:8081    # PHP API
```

> Variables must be prefixed with `VITE_` to be exposed to the browser. Never put secrets here — these values are visible in the browser.

---

## Adding a New Page

1. Create `src/pages/MyPage.jsx`
2. Add a route in `App.jsx`:

```jsx
<Route path="/my-page" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
```

3. Link to it from anywhere:

```jsx
import { Link } from 'react-router-dom';
<Link to="/my-page">Go to My Page</Link>
```
