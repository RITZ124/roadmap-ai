import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const API = import.meta.env.VITE_API_URL;

function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();

  const { concept } = location.state || {};

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (!concept) return;
  
    const token = localStorage.getItem("token");
  
    if (!token) {
      alert("Login required");
      navigate("/login");
      return;
    }
  
    fetch(`${API}/generate-quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`   // ✅ ALWAYS SEND
      },
      body: JSON.stringify({ concept })
    })
      .then(res => res.json())
      .then(data => setQuestions(data.questions || []));
  }, [concept]);

  const handleSelect = (qIndex, optionLetter) => {
    if (submitted) return;

    setAnswers(prev => ({
      ...prev,
      [qIndex]: optionLetter
    }));
  };

  const calculateScore = () => {
    let score = 0;

    questions.forEach((q, i) => {
      if (answers[i] === q.answer) score++;
    });

    return score;
  };

  if (!concept) {
    return <p className="text-white p-10">No quiz selected</p>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <h1 className="text-3xl font-bold mb-6">
        🧪 Quiz: {concept}
      </h1>

      {questions.length === 0 && <p>Loading...</p>}

      {questions.map((q, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-white/10 rounded-xl"
        >
          <p className="font-semibold">
            Q{i + 1}. {q.q}
          </p>

          <div className="mt-2 space-y-2">
            {q.options.map((opt, idx) => {
              const letter = ["A", "B", "C", "D"][idx];
              const selected = answers[i];
              const isCorrect = letter === q.answer;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(i, letter)}
                  className={`block w-full text-left p-2 rounded ${
                    submitted
                      ? isCorrect
                        ? "bg-green-500/30"
                        : selected === letter
                        ? "bg-red-500/30"
                        : "bg-black/40"
                      : selected === letter
                      ? "bg-blue-500/30"
                      : "bg-black/40 hover:bg-white/10"
                  }`}
                >
                  <b>{letter}.</b> {opt}
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          className="bg-blue-600 px-6 py-3 rounded-lg"
        >
          Submit Quiz
        </button>
      ) : (
        <div className="mt-6">
          <h2 className="text-xl font-bold">
            🎯 Score: {calculateScore()} / {questions.length}
          </h2>

          <button
            onClick={() => navigate("/app")}
            className="mt-4 bg-green-500 px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      )}

    </div>
  );
}

export default Quiz;
