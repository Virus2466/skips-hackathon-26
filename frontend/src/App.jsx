import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';       // Import this
import Register from './pages/Register'; // Import this
import Courses from './pages/Courses';   // Import this

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-light">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/course" element={<Courses />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
      <footer className="bg-dark text-white p-4 text-center">
        <p>© 2026 EduHack Platform</p>
      </footer>
    </div>
  )
}

export default App