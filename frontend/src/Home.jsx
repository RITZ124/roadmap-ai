import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">

      {/* HERO */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl md:text-6xl font-bold text-center"
      >
        🚀 Build Your Future with AI Roadmaps
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 text-gray-400 text-lg text-center max-w-2xl"
      >
        Generate personalized learning paths, track progress, take quizzes,
        and master any skill with your AI-powered learning system.
      </motion.p>

      {/* CTA BUTTONS */}
      <div className="mt-8 flex gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/register")}
          className="bg-blue-600 px-8 py-3 rounded-xl text-lg shadow-lg"
        >
          Get Started 🚀
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/login")}
          className="border border-gray-500 px-8 py-3 rounded-xl text-lg"
        >
          Login
        </motion.button>
      </div>

      {/* FEATURES */}
      <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl">

        {[
          "🧠 AI Generated Roadmaps",
          "📊 Track Progress & XP",
          "🧪 Interactive Quizzes",
          "🔥 Daily Streak System",
          "📚 Save & Edit Roadmaps",
          "🌐 Share with Others"
        ].map((feature, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 p-6 rounded-xl border border-white/10 text-center"
          >
            {feature}
          </motion.div>
        ))}

      </div>

    </div>
  );
}

export default Home;