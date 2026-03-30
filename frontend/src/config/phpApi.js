import axios from 'axios';

// Axios instance pointing at the PHP Products API.
// withCredentials: true tells the browser to include the HttpOnly 'jwt' cookie
// that Spring Boot set on login — no localStorage needed.
const phpApi = axios.create({
    baseURL: import.meta.env.VITE_PHP_API_URL || 'http://localhost:8081',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export default phpApi;
