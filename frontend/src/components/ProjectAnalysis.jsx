import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BookOpen, Star, GitFork, AlertCircle, Info, RefreshCw } from 'lucide-react';

export default function ProjectAnalysis() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`http://localhost:8085/api/profiles/project/${projectId}/analysis`);
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to fetch repository analysis. Make sure the project has a valid GitHub URL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <p className="text-sm text-slate-400">Loading GitHub Repository Analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">Repository Analysis Error</h3>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={() => navigate('/profile')}
          className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-semibold rounded-lg text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back navigation & header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/profile')}
          className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Profile
        </button>
        <button
          onClick={fetchAnalysis}
          className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-850 transition-colors"
          title="Refresh Analysis"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Project Overview Card */}
      <div className="bg-gradient-to-r from-slate-900/60 to-slate-950/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center">
              {data.project_title}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {data.description}
            </p>
          </div>
          <a
            href={data.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-all self-start md:self-auto"
          >
            <svg className="h-4 w-4 fill-current mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
            </svg>
            View on GitHub
          </a>
        </div>
      </div>

      {/* Repository Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-center">
          <svg className="h-5 w-5 text-indigo-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="block text-xl font-extrabold text-white">{data.total_commits}</span>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Commits</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-center">
          <svg className="h-5 w-5 text-sky-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7a3 3 0 100-6 3 3 0 000 6zM8 7V7M8 14a3 3 0 100-6 3 3 0 000 6zM16 11a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
          <span className="block text-xl font-extrabold text-white">{data.total_branches}</span>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Branches</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-center">
          <Star className="h-5 w-5 text-amber-400 mx-auto mb-2" />
          <span className="block text-xl font-extrabold text-white">{data.stars}</span>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">GitHub Stars</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-center">
          <GitFork className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
          <span className="block text-xl font-extrabold text-white">{data.forks}</span>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Forks</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 col-span-2 md:col-span-1 text-center">
          <Info className="h-5 w-5 text-rose-400 mx-auto mb-2" />
          <span className="block text-xl font-extrabold text-white">{Math.round(data.size_kb / 1024 * 10) / 10} MB</span>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Repo Size</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Languages & Branches Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Languages card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center">
              <BookOpen className="h-4.5 w-4.5 text-indigo-400 mr-2" />
              Technology Stack
            </h3>
            <div className="space-y-3">
              {Object.keys(data.languages).length === 0 ? (
                <p className="text-xs text-slate-500 italic">No language data found.</p>
              ) : (
                Object.entries(data.languages).map(([lang, percentage]) => (
                  <div key={lang} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{lang}</span>
                      <span className="text-slate-400">{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary-500 h-1.5 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Branches list card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center">
              <svg className="h-4.5 w-4.5 text-sky-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7a3 3 0 100-6 3 3 0 000 6zM8 7V7M8 14a3 3 0 100-6 3 3 0 000 6zM16 11a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              Repository Branches ({data.total_branches})
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {data.branch_names.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No branches listed.</p>
              ) : (
                data.branch_names.map((branch) => (
                  <div
                    key={branch}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center bg-slate-950/40 border border-slate-850 text-slate-300 ${
                      branch === data.default_branch ? 'border-primary-500/20 text-primary-400 bg-primary-500/5' : ''
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-650 mr-2 shrink-0" />
                    <span className="truncate">{branch}</span>
                    {branch === data.default_branch && (
                      <span className="ml-auto px-1.5 py-0.5 rounded text-[8px] font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20">
                        Default
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Commit History Column */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 h-full">
            <h3 className="text-sm font-bold text-white flex items-center">
              <svg className="h-4.5 w-4.5 text-indigo-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Recent Commit History
            </h3>
            <div className="space-y-4">
              {data.recent_commits.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-8">No commits found or API unreachable.</p>
              ) : (
                data.recent_commits.map((commit, idx) => (
                  <div key={commit.sha} className="relative flex items-start space-x-3 group">
                    {idx !== data.recent_commits.length - 1 && (
                      <span className="absolute top-8 left-4 -ml-[1px] h-full w-[2px] bg-slate-800" aria-hidden="true" />
                    )}
                    <div className="relative h-8 w-8 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                      {commit.author.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 p-3 rounded-xl bg-slate-950/20 border border-slate-850/80 group-hover:border-slate-800/80 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white truncate">{commit.author}</p>
                        <span className="text-[10px] font-mono bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-850">
                          {commit.sha}
                        </span>
                      </div>
                      <p className="text-xs text-slate-350 mt-1 line-clamp-2">{commit.message}</p>
                      <p className="text-[10px] text-slate-500 mt-1.5">
                        {new Date(commit.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
