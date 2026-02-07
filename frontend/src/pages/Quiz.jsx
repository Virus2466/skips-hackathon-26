import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Play, ArrowRight, Loader2 } from 'lucide-react';
import api from '../api/axios'; // <--- Use your Axios instance

const Quiz = () => {
  const navigate = useNavigate();
  
  const [gameState, setGameState] = useState('setup');
  const [config, setConfig] = useState({ topic: '', difficulty: 'Medium' });
  
  const [questions, setQuestions] = useState([]); 
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]); 
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- 1. THE FIXED API CALL ---
 // --- 1. THE FIXED START QUIZ ---
  const startQuiz = async () => {
    if (!config.topic) return alert("Please enter a topic!");
    setLoading(true);
    setError('');

    try {
      const userinfo = JSON.parse(localStorage.getItem("userInfo"));

      const { data } = await api.post("/api/ai/ask", {
        mode: 'generate_question',
        topic: config.topic,
        difficulty: config.difficulty,
        studentId: userinfo?._id
      });

      console.log("Raw AI Data:", data); // 🔍 Debug Log

      if (data.success && Array.isArray(data.questions)) {
        
        // --- DATA SANITIZATION (The Fix) ---
        const cleanQuestions = data.questions.map(q => {
          let correctIndex = -1;

          // Case A: AI gave us an Index (0, 1, 2, 3)
          if (q.correct !== undefined && !isNaN(q.correct)) {
            correctIndex = Number(q.correct);
          }
          // Case B: AI gave us the Text Answer (e.g., "Newton")
          else if (q.correct_answer || q.answer || (typeof q.correct === 'string')) {
            const correctText = q.correct_answer || q.answer || q.correct;
            // Find which option matches this text
            correctIndex = q.options.findIndex(opt => 
              opt.toLowerCase().trim() === correctText.toLowerCase().trim()
            );
          }

          // Fallback: If AI failed completely, mark the first option as correct (prevents crash)
          if (correctIndex === -1) correctIndex = 0;

          return {
            ...q,
            correct: correctIndex // Now it is always a Number!
          };
        });

        setQuestions(cleanQuestions);
        
        // Reset Game
        setScore(0);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setSelectedOption(null);
        setGameState('active');
      } else {
        throw new Error("Invalid question format received");
      }

    } catch (err) {
      console.error("Quiz Error:", err);
      setError("Failed to generate quiz. AI might be busy.");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. HANDLE ANSWER CLICK ---
  const handleOptionClick = (index) => {
    if (selectedOption !== null) return; 
    setSelectedOption(index);
    
    const currentQ = questions[currentQuestionIndex];
    // Loose equality check (index might be number, correct might be string "0")
    const isCorrect = index == currentQ.correct; 
    
    if (isCorrect) setScore(score + 1);

    // Save answer
    const answerRecord = {
      question: currentQ.question,
      options: currentQ.options,
      correctIndex: Number(currentQ.correct),
      selectedIndex: index,
      isCorrect: isCorrect
    };
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerRecord;
    setUserAnswers(newAnswers);
  };

  // --- 3. NEXT QUESTION ---
  const nextQuestion = async () => {
    setSelectedOption(null);
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };
  
  // --- 4. FINISH & SAVE ---
  const finishQuiz = async () => {
    setGameState('result');
    try {
        await api.post('/api/tests/submit', {
            title: `${config.topic} AI Test`,
            subject: config.topic,
            score: score,
            total: questions.length,
            questions: userAnswers.map(ans => ({
              questionText: ans.question,
              options: ans.options,
              correctAnswer: ans.options[ans.correctIndex],
              userAnswer: ans.options[ans.selectedIndex],
              isCorrect: ans.isCorrect
            }))
        });
    } catch (e) {
        console.error("Failed to save score", e);
    }
  };

  // --- RENDERERS ---

  if (gameState === 'setup') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-dark mb-6 text-center">AI Mock Test</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <input type="text" placeholder="e.g. Thermodynamics" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={config.topic} onChange={(e) => setConfig({...config, topic: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <div className="flex gap-2">
                {['Easy', 'Medium', 'Hard'].map(level => (
                  <button key={level} onClick={() => setConfig({...config, difficulty: level})}
                    className={`flex-1 py-2 rounded-lg text-sm border transition ${config.difficulty === level ? 'bg-primary text-white' : 'bg-white text-gray-400'}`}
                  >{level}</button>
                ))}
              </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button onClick={startQuiz} disabled={loading} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 mt-4">
              {loading ? <Loader2 className="animate-spin" /> : <Play size={20} />} {loading ? "Generating Quiz..." : "Start Quiz"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RESULT SCREEN
  if (gameState === 'result') {
    return (
      <div className="max-w-4xl mx-auto p-6 pb-20">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center mb-8">
           <h2 className="text-3xl font-bold text-dark">Test Analysis</h2>
           <p className="text-gray-500 mt-2">Score: <span className="font-bold text-primary">{score}/{questions.length}</span></p>
           <div className="flex justify-center gap-4 mt-6">
             <button onClick={() => navigate('/dashboard')} className="px-6 py-2 border rounded-xl hover:bg-gray-50">Dashboard</button>
             <button onClick={() => setGameState('setup')} className="px-6 py-2 bg-primary text-white rounded-xl">New Test</button>
           </div>
        </div>
      </div>
    );
  }

  // ACTIVE QUIZ SCREEN
  if (!questions[currentQuestionIndex]) return <div>Loading...</div>;

  const question = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto p-6 min-h-[80vh] flex flex-col justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-bold text-indigo-500 uppercase">Question {currentQuestionIndex + 1}/{questions.length}</span>
          <span className="text-xs text-gray-400">Diff: {config.difficulty}</span>
        </div>

        <h3 className="text-2xl font-bold text-dark mb-8 leading-relaxed">{question.question}</h3>

        <div className="space-y-3">
          {question.options.map((opt, index) => {
            let stateClass = "border-gray-200 hover:border-primary hover:bg-indigo-50"; 
            if (selectedOption !== null) {
              if (index == question.correct) stateClass = "bg-green-100 border-green-500 text-green-700";
              else if (index === selectedOption) stateClass = "bg-red-100 border-red-500 text-red-700";
              else stateClass = "opacity-50 border-gray-200";
            }
            return (
              <button key={index} onClick={() => handleOptionClick(index)} disabled={selectedOption !== null}
                className={`w-full text-left p-4 rounded-xl border-2 font-medium transition-all duration-200 ${stateClass}`}
              >
                <div className="flex justify-between items-center">
                  <span>{opt}</span>
                  {selectedOption !== null && index == question.correct && <CheckCircle size={20} className="text-green-600" />}
                  {selectedOption !== null && index === selectedOption && index != question.correct && <XCircle size={20} className="text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={nextQuestion} disabled={selectedOption === null}
            className="bg-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition disabled:opacity-50 flex items-center gap-2"
          >
             {currentQuestionIndex + 1 === questions.length ? 'Finish' : 'Next'} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;