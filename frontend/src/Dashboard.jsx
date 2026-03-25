import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import clickSound from "./assets/click.mp3";
import xpSound from "./assets/xp.mp3";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
const API = import.meta.env.VITE_API_URL;

function Dashboard({ token, logout }) { 
  const [chatOpen, setChatOpen] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [duration, setDuration] = useState(3);
  const [hours, setHours] = useState(2);
  const [description, setDescription] = useState("");
  const [xpPopup, setXpPopup] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [progress, setProgress] = useState({});
  const [editPrompt, setEditPrompt] = useState("");

  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [editMode, setEditMode] = useState(null);
  const [editText, setEditText] = useState("");
  const [editingLoading, setEditingLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const [streak, setStreak] = useState(parseInt(localStorage.getItem("streak")) || 0);
  const [lastDate, setLastDate] = useState(localStorage.getItem("lastDate") || "");
  const [xp, setXp] = useState(parseInt(localStorage.getItem("xp")) || 0);
  const [quizData, setQuizData] = useState({});
  const [quizOpen, setQuizOpen] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const navigate = useNavigate();
  const loadQuiz = async (concept, key) => {

    const res = await fetch(`${API}/generate-quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ concept })
    });
  
    const data = await res.json();
  
    setQuizData(prev => ({
      ...prev,
      [key]: data.questions
    }));
  };
  const chartData = roadmap
  ? roadmap.weeks.map((w, i) => {
      const total = w.days.length;
      const done = w.days.filter((_, j) => progress[`${i}-${j}`]).length;

      return {
        week: `W${w.week}`,
        progress: Math.round((done / total) * 100)
      };
    })
  : [];
  const fetchRoadmaps = async () => {
    const res = await fetch(`${API}/get-roadmaps`, {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {}
    });
  
    const data = await res.json();
    setSavedRoadmaps(data);
  };

  useEffect(() => {
    if (token) fetchRoadmaps();
    const saved = localStorage.getItem("roadmap");
    if (saved) {
    setRoadmap(JSON.parse(saved));
  }
  const savedFlag = localStorage.getItem("roadmapSaved");
  if (savedFlag === "true") {
    setIsSaved(true);
  }
  }, [token]);

  const generateRoadmap = async () => {
    setLoading(true);
    setRoadmap(null);
    setProgress({});

    const weeks = parseInt(duration) * 4;

    const res = await fetch(`${API}/generate-roadmap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        topic,
        level,
        duration: `${duration} months`,
        hours,
        description,
        weeks
      })
    });

    const data = await res.json();
    setRoadmap(data.roadmap);
    localStorage.setItem("roadmap", JSON.stringify(data.roadmap));
    setLoading(false);
  };
  const askAI = async (concept, key) => {

    setChatLoading(true);
  
    const res = await fetch(`${API}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        topic,
        concept,
        message: chatInput
      })
    });
  
    const data = await res.json();
  
    setChatReply(data.reply);
    setChatLoading(false);
  };
  const saveRoadmap = async () => {
    const res = await fetch(`${API}/save-roadmap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ roadmap })
    });

    const data = await res.json();

    if (data.message) {
      alert("Saved!");
      setIsSaved(true);   // ✅ ADD THIS
      localStorage.setItem("roadmapSaved", "true");
      fetchRoadmaps();
    }
  };

  const updateStreak = () => {
    const today = new Date().toDateString();

    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate === yesterday.toDateString()) {
        setStreak(streak + 1);
      } else {
        setStreak(1);
      }

      localStorage.setItem("lastDate", today);
      setLastDate(today);
    }
  };

  const shareRoadmap = async () => {
    const res = await fetch(`${API}/share-roadmap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ roadmap })
    });

    const data = await res.json();

    setShareLink(data.link);
    navigator.clipboard.writeText(data.link);
    alert("Link copied!");
  };

  const exportPDF = () => {
    let text = "AI Learning Roadmap\n\n";

    roadmap.weeks.forEach(w => {
      text += `Week ${w.week}\n`;
      w.days.forEach(d => {
        text += `Day ${d.day}: ${d.concept}\n`;
      });
      text += "\n";
    });

    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "roadmap.txt";
    link.click();
  };
  const deleteRoadmap = async (id) => {
    const confirmDelete = window.confirm("Delete this roadmap?");
  
    if (!confirmDelete) return;
  
    const res = await fetch(`${API}/delete-roadmap/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  
    const data = await res.json();
  
    if (data.message) {
      alert("Deleted!");
      fetchRoadmaps();
    }
  };
  const toggleComplete = (w, d) => {

    const key = `${w}-${d}`;
    const isCompleting = !progress[key];
  
    setProgress({
      ...progress,
      [key]: isCompleting
    });
  
    if (isCompleting) {
  
      playSound(xpSound);
  
      const newXp = xp + 10;
      setXp(newXp);
      localStorage.setItem("xp", newXp);
  
      setXpPopup(key);
  
      setTimeout(() => setXpPopup(null), 1000);
    }
  };

  const playSound = (sound) => {
    if (!sound) return;
  
    const audio = new Audio(sound);
    audio.volume = 0.4;
  
    audio.play().catch((err) => {
      console.error("Audio play failed:", err);
    });
  };

  const modifyRoadmap = async () => {
    const res = await fetch(`${API}/modify-roadmap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        roadmap,
        prompt: editPrompt
      })
    });

    const data = await res.json();
    setRoadmap(data.roadmap);
    setEditPrompt("");
  };

  const totalDays = roadmap
    ? roadmap.weeks.reduce((a, w) => a + w.days.length, 0)
    : 0;

  const completedDays = Object.values(progress).filter(v => v).length;

  const percent = totalDays
    ? Math.round((completedDays / totalDays) * 100)
    : 0;
  
    
      const handleQuizClick = (concept) => {
        if (!isSaved) {
          const confirmSave = window.confirm(
            "⚠️ Save roadmap before quiz? Otherwise progress may be lost."
          );
    
          if (confirmSave) {
            saveRoadmap();
            return;
          }
        }
    
        navigate("/quiz", { state: { concept } });
      };
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex">
    
        {/* SIDEBAR */}
        <motion.div
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 p-6 sticky top-0 h-screen flex flex-col justify-between"
        >
    
          <div>
            <h2 className="text-2xl font-bold mb-8 tracking-wide">🧠 AI OS</h2>
    
            <div className="space-y-3 text-sm">
    
              <div className="bg-white/10 p-3 rounded-lg hover:bg-white/20 transition">
                🔥 Streak: <b>{streak}</b>
              </div>
    
              <div className="bg-white/10 p-3 rounded-lg hover:bg-white/20 transition">
                ⚡ XP: <b>{xp}</b>
              </div>
    
              <div className="bg-white/10 p-3 rounded-lg hover:bg-white/20 transition">
                🏆 Level: <b>{Math.floor(xp / 100) + 1}</b>
              </div>
    
            </div>
          </div>
    
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 transition p-2 rounded-lg w-full"
          >
            Logout
          </button>
    
        </motion.div>
    
        {/* MAIN */}
        <div className="flex-1 p-8 space-y-6">
    
          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center"
          >
            <h1 className="text-3xl font-bold tracking-wide">
              🚀 AI Roadmap Engine
            </h1>
          </motion.div>
    
          {/* INPUT CARD */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-lg"
          >
    
            <div className="grid grid-cols-2 gap-4">
    
              <input
                className="p-3 rounded-lg bg-black/40 border border-white/20 focus:ring-2 focus:ring-blue-500"
                placeholder="Topic"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
    
              <select
                className="p-3 rounded-lg bg-black/40 border border-white/20"
                value={level}
                onChange={e => setLevel(e.target.value)}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
    
              <input
                className="p-3 rounded-lg bg-black/40 border border-white/20"
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
    
              <input
                className="p-3 rounded-lg bg-black/40 border border-white/20"
                type="number"
                value={hours}
                onChange={e => setHours(e.target.value)}
              />
    
            </div>
    
            <textarea
              className="w-full mt-4 p-3 rounded-lg bg-black/40 border border-white/20"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
    
            <div className="flex gap-3 mt-4 flex-wrap">
    
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={generateRoadmap}
                className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-lg">
                Generate
              </motion.button>
    
              {roadmap && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={saveRoadmap}
                  className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-lg">
                  Save
                </motion.button>
              )}
    
              {roadmap && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={shareRoadmap}
                  className="bg-purple-500 hover:bg-purple-600 px-5 py-2 rounded-lg">
                  Share
                </motion.button>
              )}
    
              {roadmap && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={exportPDF}
                  className="bg-yellow-500 hover:bg-yellow-600 px-5 py-2 rounded-lg">
                  Export
                </motion.button>
              )}
    
            </div>
    
          </motion.div>
    
          {/* PROGRESS */}
          {roadmap && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/10"
            >
              <div className="flex justify-between mb-2">
                <span>Progress</span>
                <span>{percent}%</span>
              </div>
    
              <div className="w-full bg-gray-700 h-3 rounded-full">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </motion.div>
          )}
          {/* SAVED ROADMAPS */}
          {savedRoadmaps.length > 0 && (
            <div className="bg-white/10 p-4 rounded-xl border border-white/10">
              <h2 className="text-lg font-bold mb-3">📚 Saved Roadmaps</h2>

              <div className="space-y-2">
                {savedRoadmaps.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-black/40 p-3 rounded-lg"
                  >
                    <span>
                      {r.data.topic || "Untitled Roadmap"}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setRoadmap(r.data)}
                        className="bg-blue-500 px-3 py-1 rounded"
                      >
                        Load
                      </button>

                      <button
                        onClick={() => {
                          const editText = window.prompt("What changes?");
                          if (!editText) return;

                          fetch(`${API}/modify-roadmap`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              roadmap: r.data,
                              prompt
                            })
                          })
                            .then(res => res.json())
                            .then(data => setRoadmap(data.roadmap));
                        }}
                        className="bg-yellow-500 px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRoadmap(r.id)}
                        className="bg-red-500 px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
    
          {/* ROADMAP */}
          {roadmap && roadmap.weeks.map((week, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-lg"
            >
    
              <h2 className="text-xl font-bold mb-4">
                📅 Week {week.week}
              </h2>
    
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
    
                {week.days.map((day, j) => (
                  <motion.div
                  
                    key={j}
                    whileHover={{ scale: 1.05 }}
                    className="bg-black/40 p-4 rounded-xl border border-white/10 relative"
                  >
    
                    <h4 className="text-xs opacity-70">
                      Day {day.day}
                    </h4>
    
                    <h3 className="text-lg font-bold mt-1">
                      {day.concept}
                    </h3>
    
                    <p className="text-xs opacity-70 mt-1">
                      {day.task}
                    </p>
    
                    {/* XP TAG */}
                    <p className="text-green-400 text-xs mt-1">+10 XP</p>
    
                    {/* LINKS */}
                    <div className="flex gap-3 mt-3 text-lg">
                      <a href={day.youtube_link} target="_blank">📺</a>
                      <a href={day.github_link} target="_blank">💻</a>
                      <a href={day.dataset_kaggle} target="_blank">📊</a>
                    </div>
    
                    {/* ACTIONS */}
                    <div className="flex gap-2 mt-3 flex-wrap">
    
                    <button
                      onClick={() => setChatOpen(`${i}-${j}`)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2 rounded-lg shadow-lg hover:scale-105 transition"
                    >
                      💬
                    </button>
                    {chatOpen === `${i}-${j}` && (
                      <div className="mt-3 bg-white/10 p-3 rounded">

                        <input
                          placeholder="Ask doubt..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          className="w-full p-2 rounded bg-black/40 border border-white/20"
                        />

                        <button
                          onClick={() => askAI(day.concept, `${i}-${j}`)}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2 rounded-lg shadow-lg hover:scale-105 transition"
                        >
                          Ask
                        </button>

                        {chatLoading && <p className="text-sm mt-2">Thinking...</p>}

                        {chatReply && (
                          <div className="mt-2 text-sm bg-black/30 p-2 rounded">
                            {chatReply}
                          </div>
                        )}

                      </div>
                    )}

                    <button
                      onClick={() => handleQuizClick(day.concept)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2 rounded-lg"
                    >
                      🧪
                    </button>
                    {quizOpen === `${i}-${j}` && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 bg-white/10 p-4 rounded-xl"
                    >
                      <h4 className="text-sm font-bold mb-2">🧪 Quiz</h4>

                      {!quizData[`${i}-${j}`] && (
                        <p className="text-sm opacity-70">Loading quiz...</p>
                      )}

                      {quizData[`${i}-${j}`]?.map((q, idx) => {
                        const qKey = `${i}-${j}-${idx}`;
                        const selected = selectedAnswers[qKey];

                        return (
                          <div key={idx} className="mb-4">
                            <p className="text-sm font-semibold">{q.q}</p>

                            <div className="mt-2 space-y-1">
                              {q.options.map((opt, oIdx) => {
                                const optionLetter = ["A", "B", "C", "D"][oIdx];
                                const isCorrect = optionLetter === q.answer;
                                const isSelected = selected === optionLetter;

                                return (
                                  <motion.button
                                    key={oIdx}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      setSelectedAnswers((prev) => ({
                                        ...prev,
                                        [qKey]: optionLetter
                                      }))
                                    }
                                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                                      isSelected
                                        ? isCorrect
                                          ? "bg-green-500/30"
                                          : "bg-red-500/30"
                                        : "bg-black/40 hover:bg-white/10"
                                    }`}
                                  >
                                    <span className="font-semibold mr-2">{optionLetter}.</span>
                                    {opt}
                                  </motion.button>
                                );
                              })}
                            </div>

                            {selected && (
                              <p className="text-xs mt-2">
                                {selected === q.answer
                                  ? "✅ Correct"
                                  : `❌ Wrong. Correct answer: ${q.answer}`}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

    
                      <button
                        onClick={() => toggleComplete(i, j)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2 rounded-lg shadow-lg hover:scale-105 transition"
                      >
                        {progress[`${i}-${j}`] ? "✅" : "✔"}
                      </button>
                          {/* ✅ XP POPUP INSIDE CARD */}
                    {xpPopup === `${i}-${j}` && (
                      <motion.div
                        initial={{ y: 0, opacity: 1 }}
                        animate={{ y: -30, opacity: 0 }}
                        className="text-green-400 text-sm absolute"
                      >
                        +10 XP 🚀
                      </motion.div>
                    )}
                    </div>
                          
                  </motion.div>
                ))}
                    
              </div>
                          
            </motion.div>
          ))}
        
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 200 }}
          ></motion.div>
          {/* FLOATING STATS */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-6 right-6 bg-white/10 backdrop-blur-xl p-4 rounded-xl"
          >
            <p>🔥 {streak}</p>
            <p>⚡ {xp}</p>
          </motion.div>
    
        </div>
      </div>
    );


    
  }
  export default Dashboard;
