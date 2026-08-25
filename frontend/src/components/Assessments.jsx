import React, { useState } from 'react';
import axios from 'axios';
import { CheckSquare, ArrowRight, BrainCircuit, Sparkles, Trophy, RotateCcw } from 'lucide-react';

export default function Assessments() {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(null);

  const testCategories = [
    { id: 'aptitude', name: 'Logical Aptitude', desc: 'Evaluates logical pattern solving, data sufficiency, and math.', duration: '15 mins', icon: BrainCircuit, color: 'text-primary-400 bg-primary-500/10 border-primary-500/20' },
    { id: 'technical', name: 'Technical Test (CS)', desc: 'Covers core CS fundamentals (DS & Algorithms, Databases, Networks).', duration: '20 mins', icon: Sparkles, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
  ];

  const quizQuestions = {
    aptitude: [
      {
        q: "Look at this series: 36, 34, 30, 28, 24, ... What number should come next?",
        options: ["20", "22", "23", "26"],
        answer: "22"
      },
      {
        q: "A tank can be filled by tap A in 6 hours and emptied by tap B in 8 hours. If both taps are open, how long will it take to fill the tank?",
        options: ["10 hours", "12 hours", "24 hours", "48 hours"],
        answer: "24 hours"
      }
    ],
    technical: [
      {
        q: "Which of the following data structures operates on a Last In First Out (LIFO) model?",
        options: ["Queue", "Stack", "Binary Tree", "Heap"],
        answer: "Stack"
      },
      {
        q: "In PostgreSQL, what is the default port number?",
        options: ["3306", "27017", "5432", "6379"],
        answer: "5432"
      }
    ]
  };

  const startQuiz = (id) => {
    setActiveQuiz(id);
    setCurrentQuestion(0);
    setAnswers({});
    setQuizFinished(false);
    setScore(null);
  };

  const handleSelectOption = (opt) => {
    setAnswers({ ...answers, [currentQuestion]: opt });
  };

  const nextQuestion = async () => {
    const questions = quizQuestions[activeQuiz];
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate grade
      let correct = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.answer) correct++;
      });
      const finalScore = Math.round((correct / questions.length) * 100);
      setScore(finalScore);
      setQuizFinished(true);

      // Submit score to backend
      try {
        const payload = {
          aptitude_score: activeQuiz === 'aptitude' ? finalScore : 0.0,
          logical_score: activeQuiz === 'aptitude' ? finalScore : 0.0,
          technical_score: activeQuiz === 'technical' ? finalScore : 0.0,
          communication_score: 0.0,
          personality_score: 0.0
        };
        await axios.post('http://localhost:8085/api/profiles/assessment', payload);
      } catch (err) {
        console.error('Failed to submit assessment to ATIA engine:', err);
      }
    }
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    setAnswers({});
    setQuizFinished(false);
    setScore(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Skill Assessments</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Challenge yourself to verify your skills. Scores are directly fed into the ATIA engine to dynamically evaluate your employability.
        </p>
      </div>

      {!activeQuiz ? (
        /* Quiz Catalog Selection */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between group hover:border-primary-500/30 transition-all duration-300 relative overflow-hidden"
              >
                <div>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${cat.color} mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{cat.name}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-6">{cat.desc}</p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/60 pt-4">
                  <span className="text-xs text-slate-500 font-bold uppercase">{cat.duration}</span>
                  <button
                    onClick={() => startQuiz(cat.id)}
                    className="inline-flex items-center text-xs font-semibold text-primary-400 hover:text-primary-300 group-hover:translate-x-1 transition-transform"
                  >
                    Start Test
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Quiz Taking Interface */
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8">
          {!quizFinished ? (
            <div className="space-y-6">
              {/* Header progress bar */}
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="capitalize">{activeQuiz} Assessment</span>
                <span>
                  Question {currentQuestion + 1} of {quizQuestions[activeQuiz].length}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary-500 h-1.5 transition-all"
                  style={{
                    width: `${((currentQuestion + 1) / quizQuestions[activeQuiz].length) * 100}%`
                  }}
                />
              </div>

              {/* Question Text */}
              <h3 className="text-lg font-bold text-white leading-relaxed">
                {quizQuestions[activeQuiz][currentQuestion].q}
              </h3>

              {/* Option Selection List */}
              <div className="space-y-3">
                {quizQuestions[activeQuiz][currentQuestion].options.map((opt, index) => {
                  const isSelected = answers[currentQuestion] === opt;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full text-left p-4 rounded-xl border text-sm transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500/10 text-primary-400 font-semibold'
                          : 'border-slate-800 bg-slate-950/40 text-slate-350 hover:border-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-slate-800/60">
                <button
                  onClick={nextQuestion}
                  disabled={!answers[currentQuestion]}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50"
                >
                  {currentQuestion === quizQuestions[activeQuiz].length - 1 ? 'Finish Test' : 'Next Question'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Quiz Completed Scoreboard */
            <div className="text-center py-6 space-y-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Assessment Completed!</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Your results have been processed and synced with the ATIA decision engine.
                </p>
              </div>

              <div className="bg-slate-950/60 max-w-sm mx-auto p-6 rounded-2xl border border-slate-850">
                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Your Score</span>
                <span className="text-4xl font-black text-emerald-400">{score}%</span>
              </div>

              <div className="flex justify-center space-x-3 pt-6">
                <button
                  onClick={resetQuiz}
                  className="flex items-center px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Take Another Test
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
