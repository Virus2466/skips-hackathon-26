import axios from 'axios';

// 1. Create the Axios Instance
const api = axios.create({
  baseURL: 'http://localhost:5001', // <--- Set to 5001 as requested
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor (The "Middleman")
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        
        // Check if token exists before attaching
        if (parsedUser && parsedUser.token) {
          config.headers.Authorization = `Bearer ${parsedUser.token}`;
          console.log("✅ Token attached to request:", config.url);
        } else {
          console.warn("⚠️ No token found in userInfo for URL:", config.url);
        }
      } catch (error) {
        console.error("Error parsing user info:", error);
      }
    } else {
      console.warn("⚠️ No userInfo in localStorage for URL:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;