import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  });
  const navigate = useNavigate();

  

 
  const login = async (email, password) => {
    try {
      // No need for full URL or headers, Axios handles it
      const { data } = await api.post('/auth/login', { email, password });

      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error("Login Error:", error);
      // Axios stores the backend error response in error.response.data
      return { 
        success: false, 
        message: error.response?.data?.message || "Login failed" 
      };
    }
  };

  // --- REGISTER ---
  const register = async (name, email, password, role, course, parentPhone, phone) => {
    try {
      const { data } = await api.post('/auth/register', { 
        name, email, password, role, course, parentPhone, phone 
      });

      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error("Register Error:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Registration failed" 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;