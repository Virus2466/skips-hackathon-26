import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Play, MessageSquare, Calendar, Users, BookOpen, 
  CheckCircle, Clock, X, BarChart2, Award, XCircle, ArrowRight, Loader2 
} from 'lucide-react';
import AuthContext from '../context/AuthContext';
import ChatSidebar from '../components/ChatSidebar';
import api from '../api/axios';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [recentTests, setRecentTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await api.get('/api/dashboard');

        // CLEAN DATA: Prioritize the 'total' field from your updated model
        const cleanedTests = (data.tests || []).map(test => ({
          ...test,
          // Use the database 'total', or fallback to questions length, or default to 5
          total: test.total || test.questions?.length || 5 
        }));

        setDashboardData({
          ...data,
          tests: cleanedTests
        });

        setRecentTests(cleanedTests.slice(0, 5));
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
        setLoadingTests(false);
      }
    };

    if (user?.role === 'student' || !user?.role) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  // --- PARENT & TEACHER VIEWS ---
  if (user?.role === 'parent') return <div className="p-6">Parent Dashboard Placeholder</div>;
  if (user?.role === 'teacher') return <div className="p-6">Teacher Dashboard Placeholder</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 relative">
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark">
            Hello, <span className="text-primary">{dashboardData?.user?.name || user?.name}</span>! 👋
          </h1>
          <p className="text-gray-600 mt-2">Ready to prepare for <span className="font-semibold text-dark">{dashboardData?.user?.course || "Exams"}</span>?</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-gray-500">Learning Journey</p>
          <p className="text-xl font-bold text-orange-500 flex items-center gap-1 justify-end">
             🔥 {dashboardData?.overallStats?.totalTests || 0} Tests Taken
          </p>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Readiness Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-gray-500 font-medium">Exam Readiness</h3>
            <div className="flex items-baseline gap-2 mt-2">
              {/* Fix: Use the average percentage from overallStats */}
              <span className="text-5xl font-bold text-primary">
                {dashboardData?.overallStats?.averagePercentage || 0}%
              </span>
              <span className="text-sm text-green-600 font-medium flex items-center">
                <TrendingUp size={16} className="mr-1" /> Overall
              </span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-50 rounded-full opacity-50 z-0"></div>
        </div>

        {/* AI Action Area */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-center col-span-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <MessageSquare size={20} className="text-indigo-200" />
                 <h3 className="font-bold text-lg">AI Mentor</h3>
              </div>
              <p className="text-indigo-100 text-sm opacity-90 max-w-md">
                {dashboardData?.topicAnalytics?.length > 0 
                  ? `I noticed you're finding ${dashboardData.topicAnalytics[0].topic} a bit tough. Shall we revise it together?` 
                  : "Welcome! Take your first AI Mock Test to get personalized guidance."}
              </p>
            </div>
            <button onClick={() => setIsChatOpen(true)} className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-50 transition shadow-md whitespace-nowrap">
              Chat Now
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Subject Mastery */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-dark">Subject Mastery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData?.subjectAnalytics?.map((item) => (
              <div key={item.subject} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition hover:shadow-md group">
                <div className="flex justify-between items-start mb-3">
                  <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <BookOpen size={20} />
                  </span>
                  <span className="text-xs text-gray-400">{item.totalTests} Tests Taken</span>
                </div>
                <h4 className="font-bold text-gray-800 group-hover:text-primary transition">{item.subject}</h4>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Confidence</span>
                    <span className="font-bold text-primary">{item.correctPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-700" 
                      style={{ width: `${item.correctPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
             <Link to="/quiz" className="block">
              <div className="h-full border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-indigo-50 transition">
                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mb-2 text-gray-500">
                  <Play size={20} />
                </div>
                <h4 className="font-bold text-gray-600">New AI Quiz</h4>
              </div>
            </Link>
          </div>
        </div>

        {/* Right: Recent History */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-dark ">Recent Tests</h2>
            <Link to="/history" className="text-sm text-primary font-bold hover:underline">View All</Link>
          </div>

          {loadingTests ? (
             <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : recentTests.length === 0 ? (
             <div className="text-center py-8 text-gray-400 text-sm">
               No history found. <Link to="/quiz" className="text-primary font-bold">Start your first test!</Link>
             </div>
          ) : (
            <div className="space-y-3">
              {recentTests.map((test) => {
                const percentage = Math.round((test.score / test.total) * 100);
                const isPass = percentage >= 70;
                
                return (
                  <div 
                    key={test._id} 
                    onClick={() => setSelectedTest(test)}
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
                        Details <ArrowRight size={12}/>
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedTest(null)}></div>
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto animate-slide-in p-6 flex flex-col">
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
               <div>
                  <h2 className="text-2xl font-bold text-dark">{selectedTest.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{new Date(selectedTest.createdAt).toLocaleString()}</p>
               </div>
               <button onClick={() => setSelectedTest(null)} className="p-2 hover:bg-gray-100 rounded-full transition">
                 <X size={24} className="text-gray-500" />
               </button>
            </div>
            
            <div className="bg-indigo-50 p-6 rounded-2xl flex items-center justify-between mb-8">
               <div>
                 <p className="text-indigo-600 font-bold uppercase tracking-wider text-xs mb-1">Final Result</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-dark">{selectedTest.score}</span>
                    <span className="text-lg text-gray-500 font-medium">/ {selectedTest.total}</span>
                 </div>
               </div>
               <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white ${
                 (selectedTest.score / selectedTest.total) >= 0.7 ? 'bg-green-500' : 'bg-orange-500'
               }`}>
                 {Math.round((selectedTest.score / selectedTest.total) * 100)}%
               </div>
            </div>

            <h3 className="font-bold text-dark text-lg mb-4 flex items-center gap-2">
              <BarChart2 size={20} className="text-primary"/> Question Breakdown
            </h3>
            
            <div className="space-y-4 pb-10">
              {selectedTest.questions?.map((q, idx) => (
                <div key={idx} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white border border-gray-100 ${
                  q.isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                }`}>
                  <p className="font-bold text-sm mb-2 text-gray-800">{idx + 1}. {q.questionText}</p>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <div className="p-2 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700">
                      <span className="font-bold">Correct:</span> {q.correctAnswer}
                    </div>
                    {!q.isCorrect && (
                      <div className="p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                        <span className="font-bold">You chose:</span> {q.userAnswer}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;