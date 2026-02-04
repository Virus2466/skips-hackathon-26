import { createContext, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom'

// 1. Creating Context
const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null)   // Who is logged in
    const navigate = useNavigate();

// 2. Check if user is already logged in
useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if(userInfo){
        setUser(JSON.parse(userInfo)); // Restore usr from storage
    }
}, []);

// 3. The Login Function
const login = async(email, password) => {
    try {
        const res = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password}),
        })
        const data = await res.json();

        if(res.ok){
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);  // Tell React "we are logged in"
            navigate('/')
            return {success: true}
        } else{
            return {success: false, message: "Server error. Try again"}
        }
    } catch (error) {
        console.error("Login Error:", error);
        return {success: false, message: "Server error. Try again"};
    }
};
// 4. The Register Function
const register = async (name, email, password, role) => {
    try {
        const res = await fetch("http://localhost:5001/api/auth/register", {
            method: "POST",
            headers: {'Content-Type' : 'application/json'},
            body: JSON.stringify({name, email, password, role}),
        });
        const data = await res.json();
        if(res.ok){
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            navigate('/')
            return {success : true};
        } else {
            return {success: false, message: data.message};
        }
    } catch (error) {
        return {success: false, message: "Server error."};
    }
}
// 4. The Logout Function
const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    navigate('/login');
};

return (
    <AuthContext.Provider value={{user, login, register, logout}}>
        {children}
    </AuthContext.Provider>
)

}

export default AuthContext;