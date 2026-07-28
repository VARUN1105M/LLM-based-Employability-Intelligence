import React, { useState } from 'react';
import { Calendar, CheckCircle2, ChevronRight, PlayCircle, ExternalLink, MapPin } from 'lucide-react';

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState([
    {
      week: 1,
      title: "Algorithms & Complexities",
      desc: "Deep dive into asymptotic notation, sorting algorithms, and fundamental binary trees.",
      completed: true,
      resource: "GeeksforGeeks / MIT OpenCourseWare",
      link: "https://ocw.mit.edu"
    },
    {
      week: 2,
      title: "React Components & State Control",
      desc: "Mastering hooks, Context API, client-side routing, and conditional rendering.",
      completed: false,
      resource: "React.dev Docs / Frontend Masters",
      link: "https://react.dev"
    },
    {
      week: 3,
      title: "SQL databases and schema queries",
      desc: "Normalized structure, foreign keys, complex joining, and indexing performance.",
      completed: false,
      resource: "PostgreSQL Tutorial",
      link: "https://www.postgresqltutorial.com"
    },
    {
      week: 4,
      title: "RAG & LangChain Fundamentals",
      desc: "Understanding vector databases (ChromaDB), prompt orchestration, and context injection.",
      completed: false,
      resource: "LangChain Documentation",
      link: "https://python.langchain.com"
    }
  ]);

  const toggleCompleted = (index) => {
    const newRoadmap = [...roadmap];
    newRoadmap[index].completed = !newRoadmap[index].completed;
    setRoadmap(newRoadmap);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Your Learning Roadmap</h1>
        <p className="text-slate-400 mt-2 text-sm">
          A personalized, week-by-week educational roadmap synthesized by the LLM + RAG system based on your target career profile and skill gaps.
        </p>
      </div>

      {/* Timeline List */}
      <div className="relative border-l border-slate-800 ml-4 space-y-8">
        {roadmap.map((step, index) => (
          <div key={index} className="relative pl-8 group">
            {/* Timeline Circle Node */}
            <button
              onClick={() => toggleCompleted(index)}
              className={`absolute left-0 -translate-x-1/2 flex items-center justify-center h-8 w-8 rounded-full border transition-all ${
                step.completed
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-primary-500 hover:text-primary-400'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
            </button>

            {/* Content card */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">
                  Week {step.week}
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border mt-2 sm:mt-0 w-max ${
                  step.completed
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                    : 'border-slate-800 bg-slate-900 text-slate-500'
                }`}>
                  {step.completed ? 'Completed' : 'In Progress'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{step.desc}</p>

              {/* Resource section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-800/60 pt-4 text-xs">
                <div className="flex items-center text-slate-400 mb-2 sm:mb-0">
                  <PlayCircle className="h-4 w-4 mr-2 text-indigo-400" />
                  <span>Resource: <strong className="text-white">{step.resource}</strong></span>
                </div>
                
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-primary-400 hover:text-primary-300 font-semibold"
                  >
                    Open Resource
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
