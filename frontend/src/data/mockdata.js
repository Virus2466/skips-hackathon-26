

export const studentProfile = {
  name: "Ashwani Singh",
  examReadiness: 78,
  recentScore: 65,
  streak: 5, // days
  upcomingExam: "JEE Mains - Mock 4"
};

export const weakAreas = [
  { topic: "Thermodynamics", subject: "Physics", priority: "High" },
  { topic: "Integration", subject: "Maths", priority: "Medium" },
  { topic: "Organic Reactions", subject: "Chemistry", priority: "High" }
];

export const recommendations = [
  { 
    id: 1, 
    type: "quiz", 
    title: "Thermodynamics Quick Test", 
    desc: "You missed 3 questions yesterday.", 
    action: "Take Quiz" 
  },
  { 
    id: 2, 
    type: "video", 
    title: "Understanding Entropy", 
    desc: "AI suggests this 5-min concept Notes.", 
    action: "Watch" 
  }
];

export const performanceHistory = [
  { day: "Mon", score: 45 },
  { day: "Tue", score: 55 },
  { day: "Wed", score: 50 },
  { day: "Thu", score: 65 },
  { day: "Fri", score: 78 },
];

// ... existing code ...

export const pastTests = [
  { id: 1, topic: "Thermodynamics", score: 65, total: 100, date: "2 Feb 2026", difficulty: "Medium" },
  { id: 2, topic: "Calculus", score: 80, total: 100, date: "4 Feb 2026", difficulty: "Hard" },
  { id: 3, topic: "Organic Chem", score: 45, total: 100, date: "6 Feb 2026", difficulty: "Hard" },
];

export const dummyQuestions = [
  {
    id: 1,
    question: "Which law of thermodynamics states that entropy of an isolated system always increases?",
    options: ["Zeroth Law", "First Law", "Second Law", "Third Law"],
    correct: 2 // Index of correct answer
  },
  {
    id: 2,
    question: "What is the derivative of sin(x)?",
    options: ["cos(x)", "-cos(x)", "tan(x)", "-sin(x)"],
    correct: 0
  },
  {
    id: 3,
    question: "Who is known as the father of modern chemistry?",
    options: ["Newton", "Einstein", "Lavoisier", "Dalton"],
    correct: 2
  },
  {
    id: 4,
    question: "The area under a velocity-time graph represents:",
    options: ["Acceleration", "Displacement", "Force", "Speed"],
    correct: 1
  }
];