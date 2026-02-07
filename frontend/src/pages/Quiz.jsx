import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Play,
  ArrowRight,
  Loader2
} from "lucide-react";
import api from "../api/axios";

const TOTAL_QUESTIONS = 5;

const Quiz = () => {
  const navigate = useNavigate();

  // Game states: setup | active | result
  const [gameState, setGameState] = useState("setup");

  // Setup
  const [config, setConfig] = useState({
    topic: "",
    difficulty: "Medium"
  });

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------------- START QUIZ ----------------
  const startQuiz = async () => {
    if (!config.topic.trim()) {
      alert("Please enter a topic");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));

      const { data } = await api.post("/api/ai/ask", {
        mode: "generate_question",
        topic: config.topic,
        difficulty: config.difficulty,
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
          const correctText =
            q.correct_answer || q.answer || q.correct;
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
      setScore(0);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setGameState("active");
    } catch (err) {
      console.error(err);
      setError("AI failed to generate quiz. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- ANSWER HANDLER ----------------
  const handleOptionClick = index => {
    if (selectedOption !== null) return;

    setSelectedOption(index);

    if (index === questions[currentQuestionIndex].correct) {
      setScore(prev => prev + 1);
    }
  };

  // ---------------- NEXT QUESTION ----------------
  const nextQuestion = () => {
    setSelectedOption(null);

    if (currentQuestionIndex + 1 < TOTAL_QUESTIONS) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  // ---------------- FINISH QUIZ ----------------
  const finishQuiz = async () => {
    setGameState("result");

    try {
      await api.post("/api/tests/submit", {
        title: `${config.topic} AI Test`,
        subject: config.topic,
        score,
        total: TOTAL_QUESTIONS
      });
    } catch (err) {
      console.error("Failed to save score", err);
    }
  };

  // ================= UI =================

  // -------- SETUP SCREEN --------
  if (gameState === "setup") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            AI Mock Test
          </h2>

          <input
            type="text"
            placeholder="Enter topic"
            className="w-full p-3 border rounded-xl mb-4"
            value={config.topic}
            onChange={e =>
              setConfig({ ...config, topic: e.target.value })
            }
          />

          <div className="flex gap-2 mb-4">
            {["Easy", "Medium", "Hard"].map(level => (
              <button
                key={level}
                onClick={() =>
                  setConfig({ ...config, difficulty: level })
                }
                className={`flex-1 py-2 rounded-lg border ${
                  config.difficulty === level
                    ? "bg-black text-white"
                    : "bg-white"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-3">
              {error}
            </p>
          )}

          <button
            onClick={startQuiz}
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Play size={18} />
            )}
            {loading ? "Generating..." : "Start Quiz"}
          </button>
        </div>
      </div>
    );
  }

  // -------- RESULT SCREEN --------
  if (gameState === "result") {
    const percentage = Math.round(
      (score / TOTAL_QUESTIONS) * 100
    );

    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <CheckCircle size={48} className="mx-auto text-green-500" />
          <h2 className="text-2xl font-bold mt-4">
            Test Completed
          </h2>

          <p className="text-5xl font-bold my-4">
            {percentage}%
          </p>
          <p>
            {score} / {TOTAL_QUESTIONS} Correct
          </p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 border rounded-xl py-2"
            >
              Dashboard
            </button>
            <button
              onClick={() => setGameState("setup")}
              className="flex-1 bg-black text-white rounded-xl py-2"
            >
              New Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------- ACTIVE QUIZ --------
  const question = questions[currentQuestionIndex];

  if (!question) {
    return (
      <div className="text-center mt-20">
        Something went wrong.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
        <div
          className="bg-black h-2 rounded-full"
          style={{
            width: `${
              ((currentQuestionIndex + 1) /
                TOTAL_QUESTIONS) *
              100
            }%`
          }}
        />
      </div>

      <h3 className="text-xl font-bold mb-6">
        {question.question}
      </h3>

      <div className="space-y-3">
        {question.options.map((opt, index) => {
          let cls = "border p-4 rounded-xl w-full text-left";

          if (selectedOption !== null) {
            if (index === question.correct)
              cls += " bg-green-100 border-green-500";
            else if (index === selectedOption)
              cls += " bg-red-100 border-red-500";
            else cls += " opacity-50";
          }

          return (
            <button
              key={index}
              onClick={() => handleOptionClick(index)}
              disabled={selectedOption !== null}
              className={cls}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={nextQuestion}
          disabled={selectedOption === null}
          className="bg-black text-white px-6 py-2 rounded-xl flex items-center gap-2"
        >
          {currentQuestionIndex + 1 === TOTAL_QUESTIONS
            ? "Finish"
            : "Next"}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Quiz;
