import { useContext, useEffect, useState } from 'react';
import { 
  TrendingUp, BookOpen, BarChart2, Users, Award, 
  ArrowRight, Loader2, X, Search
} from 'lucide-react';
import AuthContext from '../context/AuthContext';
import api from '../api/axios';

const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await api.get('/api/dashboard/teacher');
        setStudents(data.students || []);
      } catch (error) {
        console.error("Failed to load teacher dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/api/dashboard/teacher/student/${student._id}`);
      setStudentDetail(data);
    } catch (error) {
      console.error("Failed to load student details", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
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
            Managing <span className="font-semibold text-dark">{students.length}</span> student{students.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-gray-500">Class Overview</p>
          <p className="text-xl font-bold text-orange-500 flex items-center gap-1 justify-end">
            👥 {students.length} Students
          </p>
        </div>
      </div>

      {/* Class Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Total Students</h3>
          <p className="text-4xl font-bold text-primary mt-2">{students.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Class Average</h3>
          <p className="text-4xl font-bold text-blue-500 mt-2">
            {students.length > 0 
              ? Math.round(students.reduce((sum, s) => sum + s.averagePercentage, 0) / students.length)
              : 0}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Top Performer</h3>
          <p className="text-lg font-bold text-green-500 mt-2 line-clamp-1">
            {students.length > 0 ? students[0].name : "N/A"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Total Tests</h3>
          <p className="text-4xl font-bold text-orange-500 mt-2">
            {students.reduce((sum, s) => sum + s.totalTests, 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Students List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-white p-4 rounded-xl border border-gray-100">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 outline-none bg-transparent text-dark placeholder-gray-400"
              />
            </div>

            <h2 className="text-xl font-bold text-dark">Student Performance</h2>
            
            {filteredStudents.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-xl text-center text-gray-500">
                {students.length === 0 ? "No students enrolled" : "No students match your search"}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <div
                    key={student._id}
                    onClick={() => handleSelectStudent(student)}
                    className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition cursor-pointer group hover:border-primary"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-dark text-lg group-hover:text-primary transition">
                          {student.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">{student.email}</p>
                        {student.course && (
                          <p className="text-xs text-gray-400 mt-1">{student.course}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Average Score</p>
                        <p className={`text-2xl font-bold ${
                          student.averagePercentage >= 70 
                            ? 'text-green-500' 
                            : student.averagePercentage >= 50
                            ? 'text-orange-500'
                            : 'text-red-500'
                        }`}>
                          {student.averagePercentage}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Tests</p>
                        <p className="font-bold text-dark text-lg">{student.totalTests}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Best Score</p>
                        <p className="font-bold text-primary text-lg">{student.bestScore}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Detail</p>
                        <p className="font-bold text-primary text-lg flex items-center justify-center gap-1 group-hover:translate-x-1 transition-transform">
                          <ArrowRight size={16} />
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Performance Distribution */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-dark mb-4">Performance Tiers</h3>
            
            {students.length === 0 ? (
              <p className="text-gray-500 text-sm">No students to analyze</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span> Excellent (90-100%)
                    </span>
                    <span className="font-bold text-dark">
                      {students.filter(s => s.averagePercentage >= 90).length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500 h-full" 
                      style={{ width: `${(students.filter(s => s.averagePercentage >= 90).length / students.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span> Good (70-89%)
                    </span>
                    <span className="font-bold text-dark">
                      {students.filter(s => s.averagePercentage >= 70 && s.averagePercentage < 90).length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full" 
                      style={{ width: `${(students.filter(s => s.averagePercentage >= 70 && s.averagePercentage < 90).length / students.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-3 h-3 bg-orange-500 rounded-full"></span> Average (50-69%)
                    </span>
                    <span className="font-bold text-dark">
                      {students.filter(s => s.averagePercentage >= 50 && s.averagePercentage < 70).length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full" 
                      style={{ width: `${(students.filter(s => s.averagePercentage >= 50 && s.averagePercentage < 70).length / students.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span> Needs Help (&lt;50%)
                    </span>
                    <span className="font-bold text-dark">
                      {students.filter(s => s.averagePercentage < 50).length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-500 h-full" 
                      style={{ width: `${(students.filter(s => s.averagePercentage < 50).length / students.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => {
            setSelectedStudent(null);
            setStudentDetail(null);
          }}></div>
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto animate-slide-in p-6 flex flex-col">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
              </div>
            ) : studentDetail ? (
              <>
                <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-dark">{selectedStudent.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{selectedStudent.email}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentDetail(null);
                    }} 
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X size={24} className="text-gray-500" />
                  </button>
                </div>

                {/* Student Stats */}
                <div className="bg-indigo-50 p-6 rounded-2xl flex items-center justify-between mb-6">
                  <div>
                    <p className="text-indigo-600 font-bold uppercase tracking-wider text-xs mb-1">Average Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-dark">
                        {studentDetail?.overallStats?.averagePercentage || 0}%
                      </span>
                    </div>
                  </div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white ${
                    (studentDetail?.overallStats?.averagePercentage || 0) >= 70 ? 'bg-green-500' : 'bg-orange-500'
                  }`}>
                    {studentDetail?.overallStats?.averagePercentage || 0}%
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium">Total Tests</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      {studentDetail?.overallStats?.totalTests || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-xs text-green-600 font-medium">Best Score</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      {studentDetail?.overallStats?.bestScore || 0}
                    </p>
                  </div>
                </div>

                {/* Subject Analytics */}
                <h3 className="font-bold text-dark text-lg mb-4">Subject Performance</h3>
                
                {studentDetail?.subjectAnalytics?.length > 0 ? (
                  <div className="space-y-3 pb-10">
                    {studentDetail.subjectAnalytics.map((subject) => (
                      <div key={subject.subject} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-dark text-sm">{subject.subject}</span>
                          <span className="text-sm font-bold text-primary">{subject.accuracy}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all" 
                            style={{ width: `${subject.accuracy}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{subject.totalTests} tests taken</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm pb-10">
                    No test data available
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
