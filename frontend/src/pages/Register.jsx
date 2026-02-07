import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { User, Mail, Lock, BookOpen, GraduationCap, Target } from 'lucide-react';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    course: 'JEE Mains' // Default selection
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Pass the 'course' to the register function
    const res = await register(
      formData.name, 
      formData.email, 
      formData.password, 
      formData.role,
      formData.course // <--- Sending Course Info
    );
    
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || "Registration failed. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-slide-in">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark">Create Account</h1>
          <p className="text-gray-500 mt-2">Start your AI Learning Journey</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2 border border-red-100">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name */}
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" name="name" placeholder="Full Name"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
              value={formData.name} onChange={handleChange} required
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="email" name="email" placeholder="Email Address"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
              value={formData.email} onChange={handleChange} required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="password" name="password" placeholder="Create Password"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
              value={formData.password} onChange={handleChange} required
            />
          </div>

          {/* --- NEW FIELD: Target Course --- */}
          <div className="relative">
            <Target className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition bg-white text-gray-700 appearance-none"
            >
              <option value="JEE Mains">JEE Mains (Engineering)</option>
              <option value="NEET">NEET (Medical)</option>
              <option value="UPSC">UPSC (Civil Services)</option>
              <option value="CAT">CAT (MBA)</option>
              <option value="Class 12 Boards">Class 12 Boards (Science)</option>
              <option value="Class 10 Boards">Class 10 Boards</option>
            </select>
            {/* Custom Arrow Icon */}
            <div className="absolute right-3 top-4 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button" onClick={() => setFormData({ ...formData, role: 'student' })}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
                formData.role === 'student' ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <GraduationCap size={24} /> <span className="text-sm">Student</span>
            </button>

            <button
              type="button" onClick={() => setFormData({ ...formData, role: 'instructor' })}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
                formData.role === 'instructor' ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <BookOpen size={24} /> <span className="text-sm">Teacher</span>
            </button>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-primary text-black py-3 rounded-xl font-bold text-lg hover:bg-black transition hover:text-white shadow-lg disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-600 text-sm">
          Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;