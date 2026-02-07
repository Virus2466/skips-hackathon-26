import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Play, MessageSquare, Calendar, Users, BookOpen, CheckCircle, Clock, X, BarChart2, Award, XCircle, ArrowRight } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import ChatSidebar from '../components/ChatSidebar';
import api from '../api/axios';
import { studentProfile, recommendations, parentData, teacherData } from '../data/mockdata';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // REAL DATA STATE
  const [recentTests, setRecentTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  
  // SIDEBAR STATE
  const [selectedTest, setSelectedTest] = useState(null);

  // FETCH DATA
  useEffect(() => {
    if (user?.role === 'student' || !user?.role) {
      const fetchRecentTests = async () => {
        try {
          const { data } = await api.get('/api/dashboard/tests');
          setRecentTests(data.tests.slice(0, 5) || []); // Fetch last 5 tests
        } catch (error) {
          console.error("Failed to load dashboard tests", error);
        } finally {
          setLoadingTests(false);
        }
      };
      fetchRecentTests();
    }
  }, [user]);

  // --- PARENT & TEACHER VIEWS (Keep as is) ---
  if (user?.role === 'parent') {
     return <div className="p-6">Parent Dashboard Placeholder</div>;
  }
  if (user?.role === 'teacher') {
     return <div className="p-6">Teacher Dashboard Placeholder</div>;
  }

  // --- STUDENT VIEW ---
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 relative">
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark">
            Hello, <span className="text-primary">{user?.name || "Student"}</span>! 👋
          </h1>
          <p className="text-gray-600 mt-2">Ready to prepare for <span className="font-semibold text-dark">{user?.course || "Exams"}</span>?</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-gray-500">Current Streak</p>
          <p className="text-xl font-bold text-orange-500 flex items-center gap-1 justify-end">
             🔥 {studentProfile.streak} Days
          </p>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Readiness */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-gray-500 font-medium">Exam Readiness</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-bold text-primary">{studentProfile.examReadiness}%</span>
              <span className="text-sm text-green-600 font-medium flex items-center">
                <TrendingUp size={16} className="mr-1" /> Rising
              </span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-50 rounded-full opacity-50 z-0"></div>
        </div>

        {/* AI Action */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-center col-span-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <MessageSquare size={20} className="text-indigo-200" />
                 <h3 className="font-bold text-lg">AI Mentor</h3>
              </div>
              <p className="text-indigo-100 text-sm opacity-90 max-w-md">
                "I analyzed your last test. You are doing great in Physics but need to revise <strong>Calculus</strong> formulas. Shall we start?"
              </p>
            </div>
            <button onClick={() => setIsChatOpen(true)} className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-50 transition shadow-md whitespace-nowrap">
              Chat Now
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-dark">Recommended</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 3).map((rec) => (
              <div key={rec.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition group">
                <div className="flex justify-between items-start mb-3">
                  <span className={`p-2 rounded-lg ${rec.type === 'quiz' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {rec.type === 'quiz' ? <Play size={20} /> : <BookOpen size={20} />}
                  </span>
                  <span className="text-xs text-gray-400">AI Suggested</span>
                </div>
                <h4 className="font-bold text-gray-800 group-hover:text-primary transition">{rec.title}</h4>
                <p className="text-sm text-gray-500 mt-1 mb-4">{rec.desc}</p>
                <Link to="/quiz" className="block w-full text-center py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  {rec.action}
                </Link>
              </div>
            ))}
             <Link to="/quiz" className="block">
              <div className="h-full border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-indigo-50 transition">
                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mb-2 text-gray-500">
                  <Calendar size={20} />
                </div>
                <h4 className="font-bold text-gray-600">New Mock Test</h4>
              </div>
            </Link>
          </div>
        </div>

        {/* Right: RECENT TEST HISTORY (CARD STYLE) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-dark ">Recent Tests</h2>
            <Link to="/history" className="text-sm text-primary font-bold hover:underline">View All</Link>
          </div>

          {loadingTests ? (
             <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : recentTests.length === 0 ? (
             <div className="text-center py-8 text-gray-400 text-sm">
               No tests taken yet. <Link to="/quiz" className="text-primary font-bold">Take a quiz!</Link>
             </div>
          ) : (
            <div className="space-y-3">
              {recentTests.map((test) => {
                const percentage = Math.round((test.score / test.total) * 100);
                const isPass = percentage >= 70;
                
                return (
                  // CARD STYLE ROW
                  <div 
                    key={test._id} 
                    onClick={() => setSelectedTest(test)} // <--- CLICK TO OPEN SIDEBAR
                    className="p-4 rounded-xl border border-gray-100 hover:border-primary hover:bg-indigo-50 transition cursor-pointer group bg-gray-50/50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm line-clamp-1 group-hover:text-primary transition">{test.title}</h4>
                        <p className="text-xs text-gray-500">{test.subject} • {new Date(test.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isPass ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {percentage}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200/50">
                      <span className="text-xs text-gray-400">Score: {test.score}/{test.total}</span>
                      <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Analysis <ArrowRight size={12}/>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- ANALYSIS SIDEBAR (OVERLAY) --- */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedTest(null)}
          ></div>

          {/* Sidebar Panel */}
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto animate-slide-in p-6 flex flex-col">
            
            {/* Sidebar Header */}
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
               <div>
                  <h2 className="text-2xl font-bold text-dark">{selectedTest.title}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                    <Clock size={14}/> {new Date(selectedTest.createdAt).toLocaleString()}
                  </p>
               </div>
               <button onClick={() => setSelectedTest(null)} className="p-2 hover:bg-gray-100 rounded-full transition">
                 <X size={24} className="text-gray-500" />
               </button>
            </div>

            {/* Score Card */}
            <div className="bg-indigo-50 p-6 rounded-2xl flex items-center justify-between mb-8">
               <div>
                 <p className="text-indigo-600 font-bold uppercase tracking-wider text-xs mb-1">Final Score</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-dark">{selectedTest.score}</span>
                    <span className="text-lg text-gray-500 font-medium">/ {selectedTest.total}</span>
                 </div>
               </div>
               <div className="text-right">
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                    (selectedTest.score/selectedTest.total) >= 0.7 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {(selectedTest.score/selectedTest.total) >= 0.7 ? <CheckCircle size={16}/> : <Award size={16}/>}
                    {Math.round((selectedTest.score / selectedTest.total) * 100)}%
                  </div>
               </div>
            </div>

            {/* Questions List */}
            <h3 className="font-bold text-dark text-lg mb-4 flex items-center gap-2">
              <BarChart2 size={20} className="text-primary"/> Question Breakdown
            </h3>
            
            <div className="space-y-4 pb-10">
              {selectedTest.questions && selectedTest.questions.length > 0 ? (
                selectedTest.questions.map((q, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white border border-gray-100 ${
                    q.isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-800 text-sm">
                        <span className="text-gray-400 mr-2">Q{idx+1}.</span> 
                        {q.questionText}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = opt === q.userAnswer;
                        const isCorrect = opt === q.correctAnswer;
                        let styleClass = "border-gray-100 text-gray-500 bg-gray-50"; 
                        let icon = null;

                        if (isCorrect) {
                          styleClass = "border-green-200 bg-green-50 text-green-700 font-medium";
                          icon = <CheckCircle size={14} />;
                        } else if (isSelected && !isCorrect) {
                          styleClass = "border-red-200 bg-red-50 text-red-700 font-medium";
                          icon = <XCircle size={14} />;
                        }

                        return (
                          <div key={optIdx} className={`px-3 py-2 rounded-lg border flex justify-between items-center text-xs ${styleClass}`}>
                            <span>{opt}</span>
                            {icon}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                   No detailed question data available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;