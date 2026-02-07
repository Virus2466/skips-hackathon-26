// frontend/src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  // --- UPDATED LOGIN FUNCTION (Frontend Mode) ---
  const login = async (email, password) => {
    // TEMPORARY: Simulate a successful login without Backend
    console.log("Frontend Mode: Logging in as", email);
    
    const mockUser = {
      _id: "dummy_id_123",
      name: "Student (Demo)",
      email: email,
      role: "student",
      token: "demo_token_xyz"
    };

    localStorage.setItem('userInfo', JSON.stringify(mockUser));
    setUser(mockUser);
    navigate('/dashboard'); // Go straight to dashboard
    return { success: true };
    
    /* // REAL BACKEND CODE (Keep commented out for now)
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', { ... });
      // ... original logic ...
    } catch (error) { ... } 
    */
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    navigate('/login');
  };

  // Keep register same or mock it similarly if needed
  const register = async (name, email, password, role, course) => {
     // Mock Register
     const mockUser = { name, email, role, course, password, token: "demo_token" };
     localStorage.setItem('userInfo', JSON.stringify(mockUser));
     setUser(mockUser);
     navigate('/dashboard');
     return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;