import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  BarChart2
} from "lucide-react";
import AuthContext from "../context/AuthContext";
import api from "../api/axios";

const TOTAL_QUESTIONS = 5;

const BeginnerQuiz = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Game states: loading | active | result
  const [gameState, setGameState] = useState("loading");

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError("");

      try {
        if (!user?.course) {
          throw new Error("Course not found in user data");
        }

        const userInfo = JSON.parse(localStorage.getItem("userInfo"));

        const { data } = await api.post("/api/ai/ask", {
          mode: "generate_question",
          topic: user.course,
          difficulty: "Easy",
          studentId: userInfo?._id,
          totalQuestions: TOTAL_QUESTIONS
        });

        if (!data?.success || !Array.isArray(data.questions)) {
          throw new Error("Invalid AI response");
        }

        const sanitizedQuestions = data.questions.map(q => {
          let correctIndex = -1;

          if (typeof q.correct === "number") {
            correctIndex = q.correct;
          } else {
            const correctText = q.correct_answer || q.answer || q.correct;
            correctIndex = q.options.findIndex(
              opt =>
                opt.trim().toLowerCase() ===
                correctText?.trim().toLowerCase()
            );
          }

          if (correctIndex === -1) correctIndex = 0;

          return {
            question: q.question,
            options: q.options,
            correct: correctIndex
          };
        });

        setQuestions(sanitizedQuestions);
        setGameState("active");
      } catch (err) {
        console.error(err);
        setError("Failed to load quiz. " + (err.message || "Please try again."));
        setGameState("error");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [user]);

  // Handle answer selection
  const handleOptionClick = index => {
    if (selectedOption !== null) return;

    setSelectedOption(index);
    const isCorrect = index === questions[currentQuestionIndex].correct;

    if (isCorrect) {
      setScore(score + 1);
    }

    setAnswered(true);
    setUserAnswers([
      ...userAnswers,
      {
        question: questions[currentQuestionIndex].question,
        selectedOption: questions[currentQuestionIndex].options[index],
        correctOption: questions[currentQuestionIndex].options[questions[currentQuestionIndex].correct],
        isCorrect
      }
    ]);
  };

  // Move to next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      finishQuiz();
    }
  };

  // Finish quiz and save to database
  const finishQuiz = async () => {
    try {
      setLoading(true);

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));

      // Prepare test data
      const testData = {
        studentId: userInfo?._id,
        title: `Easy Quiz: ${user?.course || ""}`,
        subject: user?.course || "General",
        score: score,
        total: TOTAL_QUESTIONS,
        questions: questions.map((q, idx) => ({
          questionText: q.question,
          options: q.options,
          correctAnswer: q.options[q.correct],
          userAnswer: userAnswers[idx]?.selectedOption,
          isCorrect: userAnswers[idx]?.isCorrect || false
        }))
      };

      // Save test to database
      await api.post("/api/tests/submit", testData);

      setGameState("result");
    } catch (err) {
      console.error("Failed to save test:", err);
      setError("Failed to save your test. Please try again.");
      setGameState("error");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && gameState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-primary mb-4" size={40} />
          <p className="text-gray-600">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (gameState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-lg text-center">
          <XCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-dark mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/80 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Quiz active state
  if (gameState === "active" && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-primary font-bold mb-6 hover:gap-3 transition-all"
            >
              <ArrowLeft size={20} /> Back to Dashboard
            </button>

            {/* Progress Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h3>
                <span className="text-sm text-gray-500">
                  Score: {score}/{questions.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{
                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-dark mb-6">{currentQuestion.question}</h2>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQuestion.correct;
                let styleClass = "border-gray-200 bg-white text-gray-800 cursor-pointer hover:border-primary";

                if (answered) {
                  if (isCorrect) {
                    styleClass = "border-green-200 bg-green-50 text-green-700 border-2";
                  } else if (isSelected && !isCorrect) {
                    styleClass = "border-red-200 bg-red-50 text-red-700 border-2";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => !answered && handleOptionClick(idx)}
                    disabled={answered}
                    className={`w-full text-left p-4 rounded-xl border-2 transition font-medium ${styleClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {answered && isCorrect && (
                        <CheckCircle className="text-green-600" size={20} />
                      )}
                      {answered && isSelected && !isCorrect && (
                        <XCircle className="text-red-600" size={20} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            {answered && (
              <button
                onClick={handleNext}
                className="w-full px-6 py-3 bg-primary text-black  font-bold rounded-lg hover:bg-primary/90 transition"
              >
                {isLastQuestion ? "Finish Quiz" : "Next Question"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Result state
  if (gameState === "result") {
    const percentage = Math.round((score / TOTAL_QUESTIONS) * 100);
    const isPassed = percentage >= 70;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Result Card */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center mb-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isPassed ? "bg-green-100" : "bg-orange-100"
            }`}>
              {isPassed ? (
                <CheckCircle className="text-green-600" size={48} />
              ) : (
                <BarChart2 className="text-orange-600" size={48} />
              )}
            </div>

            <h2 className="text-3xl font-bold text-dark mb-2">
              {isPassed ? "Great Job! 🎉" : "Good Effort! 📚"}
            </h2>
            <p className="text-gray-600 mb-6">
              {isPassed
                ? "You've shown a good understanding of this topic!"
                : "Keep practicing to improve your skills!"}
            </p>

            {/* Score */}
            <div className="bg-indigo-50 p-6 rounded-xl mb-6">
              <p className="text-gray-600 mb-2">Your Score</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-5xl font-black text-primary">{score}</span>
                <span className="text-2xl text-gray-500">/ {TOTAL_QUESTIONS}</span>
              </div>
              <p className="text-lg font-bold text-primary mt-2">{percentage}%</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate("/beginner-quiz")}
                className="flex-1 px-6 py-3 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition"
              >
                Try Again
              </button>
            </div>
          </div>

          {/* Question Review */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-dark">Question Breakdown</h3>
            {questions.map((q, idx) => {
              const userAnswer = userAnswers[idx];
              const isCorrect = userAnswer?.isCorrect;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-l-4 ${
                    isCorrect
                      ? "bg-green-50 border-l-green-500"
                      : "bg-red-50 border-l-red-500"
                  }`}
                >
                  <p className="font-bold text-gray-800 mb-2">
                    Q{idx + 1}. {q.question}
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="text-green-700">
                      <span className="font-bold">Correct:</span> {userAnswer?.correctOption}
                    </p>
                    {!isCorrect && (
                      <p className="text-red-700">
                        <span className="font-bold">You chose:</span> {userAnswer?.selectedOption}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default BeginnerQuiz;
