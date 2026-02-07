import { useState } from 'react';
import { studentProfile, weakAreas, recommendations, dummyQuestions } from '../data/mockdata.js';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Play, ArrowRight } from 'lucide-react';

const Quiz = () => {
  const navigate = useNavigate();
  
  // Game States: 'setup' | 'active' | 'result'
  const [gameState, setGameState] = useState('setup');
  
  // Setup State
  const [config, setConfig] = useState({ topic: '', difficulty: 'Medium' });
  
  // Quiz State
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  

  // --- HANDLERS ---

  const startQuiz = () => {
    if (!config.topic) return alert("Please enter a topic!");
    setGameState('active');
    setCurrentQuestion(0);
    setScore(0);
  };

  const handleOptionClick = (index) => {
    if (selectedOption !== null) return; // Prevent changing answer
    setSelectedOption(index);
    
    // Check if correct
    if (index === dummyQuestions[currentQuestion].correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    if (currentQuestion + 1 < dummyQuestions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setGameState('result');
    }
  };

  // --- RENDERERS ---

  // 1. Setup Screen
  if (gameState === 'setup') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-dark mb-6 text-center">Configure Mock Test</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <input 
                type="text" 
                placeholder="e.g. Calculus, Physics..."
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
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
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                      config.difficulty === level 
                        ? 'bg-primary text-black border-primary' 
                        : 'bg-white text-gray-400 border-gray-200 hover:bg-black hover:text-white transition'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={startQuiz}
              className="w-full bg-white text-black py-3 rounded-xl font-bold text-lg hover:bg-black transition hover:text-white flex items-center justify-center gap-2 mt-4"
            >
              <Play size={20} /> Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Result Screen
  if (gameState === 'result') {
    const percentage = (score / dummyQuestions.length) * 100;
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center animate-slide-in">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-dark">Quiz Completed!</h2>
          <p className="text-gray-500 mt-1">Topic: {config.topic}</p>
          
          <div className="my-6">
            <p className="text-5xl font-extrabold text-primary">{percentage}%</p>
            <p className="text-sm text-gray-400 mt-2">You got {score} out of {dummyQuestions.length} correct</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
              Dashboard
            </button>
            <button onClick={() => setGameState('setup')} className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-indigo-700">
              New Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Quiz Screen
  const question = dummyQuestions[currentQuestion];
  
  return (
    <div className="max-w-3xl mx-auto p-6 min-h-[80vh] flex flex-col justify-center">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / dummyQuestions.length) * 100}%` }}
        ></div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-bold text-indigo-500 tracking-wider uppercase">Question {currentQuestion + 1}</span>
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
            disabled={selectedOption === null}
            className="bg-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {currentQuestion + 1 === dummyQuestions.length ? 'Finish' : 'Next'} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;