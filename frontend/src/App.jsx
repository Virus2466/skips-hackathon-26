import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
// import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; 
// import AuthContext from './context/AuthContext';
// import { useContext } from 'react';
import Quiz from './pages/Quiz';
import BeginnerQuiz from './pages/BeginnerQuiz';
import PrivateRoute from './components/PrivateRoute';
import TestHistory from './pages/TestHistory';


function App() {
  return (
    <div className="min-h-screen flex flex-col bg-light">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          
          <Route path="/" element={<Login />} /> 
          
          
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/history" 
            element={
              <PrivateRoute>
                <TestHistory />
              </PrivateRoute>
            } 
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/quiz" element={
            <PrivateRoute>
              <Quiz />
            </PrivateRoute>
          } />

          <Route path="/beginner-quiz" element={
            <PrivateRoute>
              <BeginnerQuiz />
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </div>
  )
}

export default App