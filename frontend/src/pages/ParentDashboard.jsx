import { useContext, useEffect, useState } from 'react';
import { 
  TrendingUp, BookOpen, BarChart2, Calendar, Award, 
  ArrowRight, Loader2, X 
} from 'lucide-react';
import AuthContext from '../context/AuthContext';
import api from '../api/axios';

const ParentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await api.get('/api/dashboard/parent');
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to load parent dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-yellow-900">No Child Linked</h2>
          <p className="text-yellow-700 mt-2">Please link a child account to view their performance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark">
            Hello, <span className="text-primary">{user?.name}</span>! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Monitoring <span className="font-semibold text-dark">{dashboardData?.child?.name}</span>'s Progress
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-gray-500">Child's Performance</p>
          <p className="text-xl font-bold text-orange-500 flex items-center gap-1 justify-end">
            🔥 {dashboardData?.overallStats?.totalTests || 0} Tests Taken
          </p>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Performance */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Overall Score</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-5xl font-bold text-primary">
              {dashboardData?.overallStats?.averagePercentage || 0}%
            </span>
            <span className="text-sm text-green-600 font-medium flex items-center">
              <TrendingUp size={16} className="mr-1" /> Average
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-3">Score: {dashboardData?.overallStats?.totalScored || 0} / {dashboardData?.overallStats?.totalPossible || 0}</p>
        </div>

        {/* Best Score */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Best Score</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-5xl font-bold text-green-500">
              {dashboardData?.overallStats?.bestScore || 0}
            </span>
            <span className="text-sm text-green-600 font-medium flex items-center">
              <Award size={16} className="mr-1" /> Best
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-3">Highest test score</p>
        </div>

        {/* Questions Attempted */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Questions Attempted</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-5xl font-bold text-blue-500">
              {dashboardData?.overallStats?.totalQuestionsAnswered || 0}
            </span>
            <span className="text-sm text-blue-600 font-medium">Questions</span>
          </div>
          <p className="text-xs text-gray-500 mt-3">Total questions in all tests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subject Mastery */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-dark">Subject Mastery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData?.subjectAnalytics?.length > 0 ? (
              dashboardData.subjectAnalytics.map((item) => (
                <div key={item.subject} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <BookOpen size={20} />
                    </span>
                    <span className="text-xs text-gray-400">{item.totalTests} Tests</span>
                  </div>
                  <h4 className="font-bold text-gray-800">{item.subject}</h4>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Score</span>
                      <span className="font-bold text-primary">{item.accuracy}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-700" 
                        style={{ width: `${item.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-gray-50 p-6 rounded-xl text-center text-gray-500">
                No subject data available yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Tests */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold text-dark mb-4">Recent Tests</h2>

          {dashboardData?.recentTests?.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No tests taken yet
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData?.recentTests?.map((test) => {
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
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        isPass ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
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

      {/* Child Info Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-200">
        <h3 className="text-lg font-bold text-dark mb-4">Child Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Name</p>
            <p className="font-bold text-dark mt-1">{dashboardData?.child?.name}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Course</p>
            <p className="font-bold text-dark mt-1">{dashboardData?.child?.course || "Not specified"}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Member Since</p>
            <p className="font-bold text-dark mt-1">{new Date(dashboardData?.child?.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Test Details Modal */}
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
                <p className="text-indigo-600 font-bold uppercase tracking-wider text-xs mb-1">Result</p>
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
              <BarChart2 size={20} className="text-primary"/> Test Information
            </h3>

            <div className="space-y-4 pb-10">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Subject</span>
                  <span className="font-bold text-dark">{selectedTest.subject}</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Test Date</span>
                  <span className="font-bold text-dark">{new Date(selectedTest.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
