import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, BarChart2, Search, X, CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import api from '../api/axios';

const TestHistory = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // STATE FOR SIDEBAR
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const { data } = await api.get('/api/dashboard/tests');
        setTests(data.tests || []);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const filteredTests = tests.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in pb-20 relative">
      
      {/* --- MAIN LIST VIEW --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark">My Test History</h1>
          <p className="text-gray-500 mt-1">Click on a test to view detailed analysis.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search tests..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading history...</div>
      ) : filteredTests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
          <BarChart2 size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-700">No tests taken yet</h3>
          <p className="text-gray-500 mb-6">Start a quiz to see your progress here!</p>
          <Link to="/quiz" className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition">
            Take a Quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTests.map((test) => {
             const percentage = Math.round((test.score / test.total) * 100);
             const isPass = percentage >= 70;

             return (
               <div 
                 key={test._id} 
                 onClick={() => setSelectedTest(test)} // <--- CLICK TO OPEN SIDEBAR
                 className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col md:flex-row items-center justify-between gap-4 group"
               >
                 
                 <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                     <span className={`px-2 py-0.5 rounded text-xs font-bold ${isPass ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                       {isPass ? 'Passed' : 'Needs Work'}
                     </span>
                     <span className="text-xs text-gray-400 flex items-center gap-1">
                       <Calendar size={12} /> {new Date(test.createdAt).toLocaleDateString()}
                     </span>
                   </div>
                   <h3 className="font-bold text-lg text-dark group-hover:text-primary transition">{test.title}</h3>
                   <p className="text-sm text-gray-500">{test.subject} • {test.total} Questions</p>
                 </div>

                 <div className="text-center px-6 border-l border-r border-gray-100 hidden md:block">
                   <p className="text-xs text-gray-400 uppercase tracking-wide">Score</p>
                   <p className="text-2xl font-black text-primary">{percentage}%</p>
                 </div>

                 <div className="text-gray-400 group-hover:text-primary transition">
                    <ChevronRight size={24} />
                 </div>
               </div>
             );
          })}
        </div>
      )}

      {/* --- ANALYSIS SIDEBAR (OVERLAY) --- */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedTest(null)}
          ></div>

          {/* Sidebar Panel */}
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-slide-in p-6 flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
               <div>
                  <h2 className="text-2xl font-bold text-dark">{selectedTest.title}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                    <Clock size={14}/> {new Date(selectedTest.createdAt).toLocaleString()}
                  </p>
               </div>
               <button 
                 onClick={() => setSelectedTest(null)} 
                 className="p-2 hover:bg-gray-100 rounded-full transition"
               >
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
              <BarChart2 size={20} className="text-primary"/> Detailed Analysis
            </h3>
            
            <div className="space-y-6 pb-10">
              {selectedTest.questions && selectedTest.questions.length > 0 ? (
                selectedTest.questions.map((q, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl border-l-4 shadow-sm bg-white border border-gray-100 ${
                    q.isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                  }`}>
                    {/* Question Text */}
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-gray-800">
                        <span className="text-gray-400 mr-2">Q{idx+1}.</span> 
                        {q.questionText}
                      </h4>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = opt === q.userAnswer;
                        const isCorrect = opt === q.correctAnswer;
                        
                        let styleClass = "border-gray-100 text-gray-500 bg-gray-50"; // Default
                        let icon = null;

                        if (isCorrect) {
                          styleClass = "border-green-200 bg-green-50 text-green-700 font-medium";
                          icon = <CheckCircle size={16} />;
                        } else if (isSelected && !isCorrect) {
                          styleClass = "border-red-200 bg-red-50 text-red-700 font-medium";
                          icon = <XCircle size={16} />;
                        }

                        return (
                          <div key={optIdx} className={`px-3 py-2 rounded-lg border flex justify-between items-center text-sm ${styleClass}`}>
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
                   No detailed question data available for this test.
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default TestHistory;