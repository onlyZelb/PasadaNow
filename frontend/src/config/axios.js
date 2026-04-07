
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/",
  withCredentials: true, // ← CRITICAL: sends JSESSIONID cookie
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
