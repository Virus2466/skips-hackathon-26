import React from 'react'
import {Routes, Route} from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'

// Placeholder pages for now
const Courses = () => <h1 className='text-3xl p-10 text-center'>Courses Page (Coming Soon)</h1>
const Login = () => <h1 className='text-3xl p-10 text-center'>Login Page</h1>
const Register = () => <h1 className='text-3xl p-10 text-center'>Register Page</h1>

const App = () => {
  return (
    <>
      <div className='min-h-screen flex flex-col'>
          <Navbar />
          <div className='grow-0'>
              <Routes>
                <Route path='/' element={<Home/>}/>
                <Route path='/courses' element={<Courses/>}/>
                <Route path='/login' element={<Login/>}/>
                <Route path='/register' element={<Register/>}/>
              </Routes>
          </div>

          {/* Footer Placeholder */}
          <footer className='bg-dark text-white p-6 text-center'>
            <p>&copy; 2026 EduHack Team. Built for the Hackathon. </p>
          </footer>

      </div>
    </>
  )
}

export default App