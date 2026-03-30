// This file exists so existing imports like `from '../hooks/useAuth'`
// continue to resolve correctly. Vite resolves .js before .jsx,
// so all exports live here and re-export from the actual .jsx implementation.
export { AuthProvider, useAuth } from './useAuth.jsx';
