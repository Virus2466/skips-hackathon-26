import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Play, ArrowRight, Loader2 } from 'lucide-react';
import api from '../api/axios'; // Import API

const Quiz = () => {
  const navigate = useNavigate();
  
  // Game States: 'setup' | 'active' | 'result'
  const [gameState, setGameState] = useState('setup');
  
  // Setup State
  const [config, setConfig] = useState({ topic: '', difficulty: 'Medium' });
  
  // Quiz Data State
  const [questions, setQuestions] = useState([]); // Stores fetched questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const TOTAL_QUESTIONS = 5; // Fixed length for now

  // --- HANDLERS ---

  // Helper to fetch a single question
  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/ask', {
        mode: 'generate_question',
        selectedCourse: config.topic,
        difficulty: config.difficulty
      });
      
      if (data.success && data.question) {
        setQuestions(prev => [...prev, data.question]);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Quiz Fetch Error:", err);
      setError("Failed to generate question. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    if (!config.topic) return alert("Please enter a topic!");
    setError('');
    setQuestions([]); // Reset questions
    setScore(0);
    setCurrentQuestionIndex(0);
    
    // Fetch the first question
    await fetchQuestion();
    setGameState('active');
  };

  const handleOptionClick = (index) => {
    if (selectedOption !== null) return; // Prevent changing answer
    setSelectedOption(index);
    
    // Check if correct
    const currentQ = questions[currentQuestionIndex];
    if (index === currentQ.correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = async () => {
    setSelectedOption(null);
    
    if (currentQuestionIndex + 1 < TOTAL_QUESTIONS) {
      // Move index forward
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      
      // If we don't have the next question yet, fetch it
      if (currentQuestionIndex + 1 >= questions.length) {
        await fetchQuestion();
      }
    } else {
      finishQuiz();
    }
  };
  
  const finishQuiz = async () => {
    setGameState('result');
    // Optional: Save score to backend here using /api/tests/submit
    try {
        await api.post('/api/tests/submit', {
            title: `${config.topic} AI Test`,
            subject: config.topic,
            score: score, // Note: Score might need +1 if last answer was correct
            total: TOTAL_QUESTIONS
        });
    } catch (e) {
        console.error("Failed to save score", e);
    }
  };

  // --- RENDERERS ---

  // 1. Setup Screen
  if (gameState === 'setup') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md animate-fade-in">
          <h2 className="text-2xl font-bold text-dark mb-6 text-center">AI Mock Test</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Subject</label>
              <input 
                type="text" 
                placeholder="e.g. Thermodynamics, Calculus, History"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                value={config.topic}
                onChange={(e) => setConfig({...config, topic: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <div className="flex gap-2">
                {['Easy', 'Medium', 'Hard'].map(level => (
                  <button
                    key={level}
                    onClick={() => setConfig({...config, difficulty: level})}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                      config.difficulty === level 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button 
              onClick={startQuiz}
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Play size={20} />} 
              {loading ? "Generating..." : "Start AI Quiz"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Result Screen
  if (gameState === 'result') {
    const percentage = Math.round((score / TOTAL_QUESTIONS) * 100);
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center animate-slide-in">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-dark">Test Completed!</h2>
          <p className="text-gray-500 mt-1">Topic: {config.topic}</p>
          
          <div className="my-6">
            <p className="text-5xl font-extrabold text-primary">{percentage}%</p>
            <p className="text-sm text-gray-400 mt-2">You got {score} out of {TOTAL_QUESTIONS} correct</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
              Dashboard
            </button>
            <button onClick={() => setGameState('setup')} className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-indigo-700 transition">
              New Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Quiz Screen
  // If loading and we don't have the current question yet
  if (loading && !questions[currentQuestionIndex]) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <Loader2 size={40} className="text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold text-gray-700">AI is crafting your question...</h3>
            <p className="text-gray-500 text-sm">Analyzing difficulty: {config.difficulty}</p>
        </div>
    );
  }

  const question = questions[currentQuestionIndex];
  
  if (!question) return <div>Something went wrong. <button onClick={() => setGameState('setup')}>Restart</button></div>;

  return (
    <div className="max-w-3xl mx-auto p-6 min-h-[80vh] flex flex-col justify-center animate-fade-in">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}
        ></div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-bold text-indigo-500 tracking-wider uppercase">Question {currentQuestionIndex + 1}</span>
          <span className="text-xs text-gray-400">Diff: {config.difficulty}</span>
        </div>

        <h3 className="text-2xl font-bold text-dark mb-8 leading-relaxed">{question.question}</h3>

        <div className="space-y-3">
          {question.options.map((opt, index) => {
            let stateClass = "border-gray-200 hover:border-primary hover:bg-indigo-50"; // Default
            
            // If selected
            if (selectedOption !== null) {
              if (index === question.correct) stateClass = "bg-green-100 border-green-500 text-green-700"; // Correct
              else if (index === selectedOption) stateClass = "bg-red-100 border-red-500 text-red-700"; // Wrong
              else stateClass = "opacity-50 border-gray-200"; // Others
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={selectedOption !== null}
                className={`w-full text-left p-4 rounded-xl border-2 font-medium transition-all duration-200 ${stateClass}`}
              >
                <div className="flex justify-between items-center">
                  <span>{opt}</span>
                  {selectedOption !== null && index === question.correct && <CheckCircle size={20} className="text-green-600" />}
                  {selectedOption !== null && index === selectedOption && index !== question.correct && <XCircle size={20} className="text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={nextQuestion}
            disabled={selectedOption === null || loading}
            className="bg-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
             {loading ? <Loader2 className="animate-spin"/> : (currentQuestionIndex + 1 === TOTAL_QUESTIONS ? 'Finish' : 'Next')} 
             {!loading && <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;