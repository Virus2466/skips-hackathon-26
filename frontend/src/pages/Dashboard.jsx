import { useContext, useState } from 'react';
import AuthContext from '../context/AuthContext';
import {Link} from 'react-router-dom'
// const { user } = useContext(AuthContext);
import { TrendingUp, AlertCircle, Play, MessageSquare, BookOpen, Calendar } from 'lucide-react';
import { studentProfile, weakAreas, recommendations } from '../data/mockdata.js';
import  ChatSidebar  from '../components/ChatSidebar.jsx';
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const pastTests = [
    { id: 1, topic: "Thermodynamics", date: "Feb 5, 2025", difficulty: "Hard", score: 72 },
    { id: 2, topic: "Organic Chemistry", date: "Feb 3, 2025", difficulty: "Hard", score: 81 },
    { id: 3, topic: "Calculus", date: "Feb 1, 2025", difficulty: "Hard", score: 65 }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      {/* 1. Header Section */}
      <div className="flex justify-between items-end">
        <div>
    <h1 className="text-3xl font-bold text-dark">
      Hello, <span className="text-primary">{user?.name}</span>! 👋
    </h1>
    {/* DYNAMIC COURSE NAME HERE */}
    <p className="text-gray-600 mt-2">
      Let's get you ready for <span className="font-semibold text-dark">{user?.course || "your exams"}</span>.
    </p>
  </div>
        {/* <div className="text-right hidden md:block">
          <p className="text-sm text-gray-500">Current Streak</p>
          <p className="text-xl font-bold text-orange-500 flex items-center gap-1 justify-end">
             🔥 {studentProfile.streak} Days
          </p>
        </div> */}
      </div>

      {/* 2. Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Readiness Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-gray-500 font-medium">Exam Readiness</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-bold text-primary">{studentProfile.examReadiness}%</span>
              <span className="text-sm text-green-600 font-medium flex items-center">
                <TrendingUp size={16} className="mr-1" /> Rising
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Based on your last 5 mock tests.</p>
          </div>
          {/* Decor background circle */}
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-50 rounded-full opacity-50 z-0"></div>
        </div>

        {/* Weak Areas Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" /> Focus Areas
            </h3>
            <span className="text-xs text-blue-600 cursor-pointer hover:underline">View Analysis</span>
          </div>
          <div className="space-y-3">
            {weakAreas.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{item.topic}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  item.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Action Card */}
        <div className="bg-linear-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <MessageSquare size={20} className="text-indigo-200" />
               <h3 className="font-bold text-lg">AI Mentor</h3>
            </div>
            <p className="text-indigo-100 text-sm opacity-90">
              "I noticed you struggled with Integration. Want to review the formulas?"
            </p>
          </div>
          <button onClick={() => setIsChatOpen(true)} className="mt-4 w-full bg-white text-indigo-600 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition shadow-md">
            Chat with Mentor
          </button>
        </div>
      </div>

      {/* 3. Recommended Actions (Cards) */}
      <div>
        <h2 className="text-xl font-bold text-dark mb-4">Recommended for You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Map through recommendations */}
          {recommendations.map((rec) => (
            <div key={rec.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition group">
              <div className="flex justify-between items-start mb-3">
                <span className={`p-2 rounded-lg ${rec.type === 'quiz' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {rec.type === 'quiz' ? <Play size={20} /> : <BookOpen size={20} />}
                </span>
                <span className="text-xs text-gray-400">AI Suggested</span>
              </div>
              <h4 className="font-bold text-gray-800 group-hover:text-primary transition">{rec.title}</h4>
              <p className="text-sm text-gray-500 mt-1 mb-4">{rec.desc}</p>
              <button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                {rec.action}
              </button>
            </div>
          ))}

          {/* Static "Create Test" Card */}
         <Link to="/quiz" className="block"> {/* <--- Added Link */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-indigo-50 transition h-full">
              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mb-2 text-gray-500">
                <Calendar size={20} />
              </div>
              <h4 className="font-bold text-gray-600">Custom Mock Test</h4>
              <p className="text-xs text-gray-400 mt-1">Choose topic & difficulty</p>
            </div>
          </Link>

        </div>
      </div>
        
      {/* 4. Recent Test History (New Section) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-dark mb-4">Recent Test History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-500 text-sm border-b border-gray-100">
                <th className="py-3 font-medium">Topic</th>
                <th className="py-3 font-medium">Date</th>
                <th className="py-3 font-medium">Difficulty</th>
                <th className="py-3 font-medium">Score</th>
                <th className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {pastTests.map((test) => (
                <tr key={test.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                  <td className="py-3 font-semibold text-gray-700">{test.topic}</td>
                  <td className="py-3 text-sm text-gray-500">{test.date}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      test.difficulty === 'Hard' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {test.difficulty}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-dark">{test.score}%</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      test.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {test.score >= 70 ? 'Passed' : 'Needs Work'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default Dashboard;