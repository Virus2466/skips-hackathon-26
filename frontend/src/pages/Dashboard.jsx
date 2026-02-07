import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { studentProfile, weakAreas, recommendations, pastTests, parentData, teacherData } from '../data/mockdata'; // <--- Import new data
import { TrendingUp, AlertCircle, Play, MessageSquare, Calendar, Users, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatSidebar from '../components/ChatSidebar';
import { useState } from 'react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // --- 1. PARENT VIEW ---
  if (user?.role === 'parent') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-dark">Welcome, Parent! 👋</h1>
          <p className="text-gray-600 mt-2">Here is how <span className="font-bold text-primary">{parentData.childName}</span> is performing.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-gray-500 font-medium">Attendance</h3>
             <p className="text-4xl font-bold text-green-600 mt-2">{parentData.attendance}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-gray-500 font-medium">Overall Grade</h3>
             <p className="text-4xl font-bold text-primary mt-2">{parentData.overallGrade}</p>
          </div>
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
             <h3 className="text-gray-600 font-medium">Next Big Exam</h3>
             <p className="text-xl font-bold text-indigo-700 mt-2">{parentData.upcomingExam}</p>
          </div>
        </div>

        {/* Child's Activity Feed */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-dark mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {parentData.recentActivity.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  {item.status === 'Completed' ? <CheckCircle className="text-green-500" size={20} /> : <Clock className="text-orange-500" size={20} />}
                  <div>
                    <h4 className="font-bold text-gray-800">{item.task}</h4>
                    <p className="text-xs text-gray-500">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {item.score || item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- 2. TEACHER VIEW ---
  if (user?.role === 'teacher') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-dark">Teacher Dashboard 👨‍🏫</h1>
          <p className="text-gray-600 mt-2">Overview for <span className="font-semibold text-primary">{user.subject || "Physics"} - Class 12A</span></p>
        </div>

        {/* Teacher Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-2 mb-2 text-gray-500"><Users size={18}/> Students</div>
             <p className="text-3xl font-bold text-dark">{teacherData.totalStudents}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-2 mb-2 text-gray-500"><TrendingUp size={18}/> Class Avg</div>
             <p className="text-3xl font-bold text-primary">{teacherData.averageClassScore}%</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-2 mb-2 text-gray-500"><BookOpen size={18}/> Pending Reviews</div>
             <p className="text-3xl font-bold text-orange-500">{teacherData.assignmentsPending}</p>
          </div>
          <Link to="/quiz" className="bg-primary text-black p-5 rounded-2xl shadow-lg flex flex-col justify-center items-center hover:bg-black hover:text-white transition">
             <Play size={24} className="mb-1" />
             <span className="font-bold">Create New Quiz</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* At Risk Students */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-red-600 flex items-center gap-2 mb-4"><AlertCircle size={20}/> Students At Risk</h3>
             <div className="space-y-3">
               {teacherData.atRiskStudents.map((s) => (
                 <div key={s.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                   <div>
                     <p className="font-bold text-gray-800">{s.name}</p>
                     <p className="text-xs text-red-500">{s.issue}</p>
                   </div>
                   <span className="font-bold text-red-700">{s.score}%</span>
                 </div>
               ))}
             </div>
           </div>

           {/* Recent Submissions */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-800 mb-4">Recent Submissions</h3>
             <div className="space-y-3">
               {teacherData.recentSubmissions.map((sub) => (
                 <div key={sub.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                   <div>
                     <p className="font-bold text-gray-800">{sub.student}</p>
                     <p className="text-xs text-gray-500">{sub.assignment}</p>
                   </div>
                   <div className="text-right">
                     <span className="block font-bold text-green-600">{sub.score}/100</span>
                     <span className="text-[10px] text-gray-400">{sub.date}</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    );
  }

  // --- 3. STUDENT VIEW (Default) ---
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      {/* Student Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-dark">
            Hello, <span className="text-primary">{user?.name || studentProfile.name}</span>! 👋
          </h1>
          <p className="text-gray-600 mt-2">Let's get you ready for <span className="font-semibold text-dark">{user?.course || "your exams"}</span>.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-gray-500">Current Streak</p>
          <p className="text-xl font-bold text-orange-500 flex items-center gap-1 justify-end">
             🔥 {studentProfile.streak} Days
          </p>
        </div>
      </div>

      {/* Student Stats Grid */}
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
          <button 
            onClick={() => setIsChatOpen(true)}
            className="mt-4 w-full bg-white text-indigo-600 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition shadow-md"
          >
            Chat with Mentor
          </button>
        </div>
      </div>

      {/* Recommended Actions */}
      <div>
        <h2 className="text-xl font-bold text-dark mb-4">Recommended for You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          <Link to="/quiz" className="block h-full">
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

      {/* Recent History */}
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
    </div>
  );
};

export default Dashboard;