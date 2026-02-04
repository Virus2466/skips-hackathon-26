import React from 'react'
import {Link} from 'react-router-dom'
import {BookOpen} from 'lucide-react'
const Navbar = () => {
  return (
    <>
        <nav className='bg-white shadow-md p-4'>
            <div className='max-w-7xl mx-auto flex justify-between items-center'>
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
                    <BookOpen />
                    <span>EduHack</span>
                </Link>
                {/* Links */}
                <div className='flex gap-6 items-center'>
                    <Link to="/" className='hover:text-primary transition'>Home</Link>
                    <Link to="/course" className='hover:text-primary transition'>Courses</Link>
                    <Link to="/login" className='px-4 py-2 border border-primary text-primary rounded-lg hover:bg-black hover:text-white transition'>Login</Link>
                    <Link to="/Register" className='px-4 py-2 bg-primary text-primary rounded-lg hover:bg-black transistion hover:text-white transition'>Get Started</Link>
                    
                </div>
            </div>
        </nav>
    </>
  )
}

export default Navbar