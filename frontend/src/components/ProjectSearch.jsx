import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Search,
  Code,
  User,
  Sparkles,
  ExternalLink,
  Filter,
  BarChart2,
  Plus,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProjectSearch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState('');

  // Add Project Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    github_url: '',
    technologies: ''
  });

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (selectedTech) params.append('tech', selectedTech);

      const res = await axios.get(`http://localhost:8085/api/projects/search?${params.toString()}`);
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch projects. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedTech]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!projectForm.title) return;
    setAdding(true);
    setAddSuccess('');
    try {
      await axios.post('http://localhost:8085/api/profiles/project', projectForm);
      setAddSuccess('Project added successfully!');
      setShowAddModal(false);
      setProjectForm({ title: '', description: '', github_url: '', technologies: '' });
      fetchProjects();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to add project.');
    } finally {
      setAdding(false);
    }
  };

  const commonTechnologies = ['React', 'Python', 'FastAPI', 'PyTorch', 'Node.js', 'Docker', 'SQL', 'TypeScript'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-primary-950 border border-slate-800 p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <FolderGit2 className="h-3.5 w-3.5" />
            <span>Developer Portfolio & Project Showcase</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Explore Open-Source & Student Projects
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Browse real-world software engineering projects, inspect technical architecture, explore GitHub source repositories, and run automated repository metrics analysis.
          </p>

          {/* Action button to add project */}
          {user?.role === 'student' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all mt-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Add My Project
            </button>
          )}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4 md:p-6 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search projects by keyword, technology, or title (e.g., AI Chatbot, RAG, React)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-primary-600 hover:from-indigo-500 hover:to-primary-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center shrink-0"
          >
            <Search className="h-4 w-4 mr-1.5" /> Search Projects
          </button>
        </form>

        {/* Tech Stack filter pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs font-semibold text-slate-400 flex items-center mr-2">
            <Filter className="h-3.5 w-3.5 mr-1" /> Filter Tech:
          </span>
          <button
            onClick={() => setSelectedTech('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTech === ''
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Tech
          </button>
          {commonTechnologies.map((tech) => (
            <button
              key={tech}
              onClick={() => {
                const nextTech = selectedTech === tech ? '' : tech;
                setSelectedTech(nextTech);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedTech === tech
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
              }`}
            >
              {tech}
            </button>
          ))}
        </div>
      </div>

      {/* Status Notifications */}
      {addSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          {addSuccess}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-xs text-slate-400">Searching projects catalog...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <FolderGit2 className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No projects found matching your search</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search query, selecting a different technology stack, or adding your own project.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedTech('');
              fetchProjects();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-white rounded-xl transition-all mt-2"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.project_id}
              className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-11 w-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
                      <Code className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                        <User className="h-3 w-3 text-slate-500" />
                        <span>{proj.author_name}</span>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors leading-snug">
                        {proj.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>

                {/* Technologies Badges */}
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="pt-5 mt-4 border-t border-slate-800/60 flex items-center justify-between gap-2">
                {proj.github_url ? (
                  <a
                    href={proj.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-slate-400 hover:text-white flex items-center transition-colors"
                  >
                    <svg className="h-3.5 w-3.5 mr-1.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                    </svg> Repository <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">No repo URL</span>
                )}

                <button
                  onClick={() => navigate(`/project/${proj.project_id}`)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-indigo-300 hover:text-white text-xs font-bold transition-all flex items-center"
                >
                  <BarChart2 className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                  Analyze Code
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
            <h3 className="text-xl font-extrabold text-white">Add Project Showcase</h3>

            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  placeholder="E.g., AI Resume Parser & Career Counselor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">GitHub Repository URL</label>
                <input
                  type="text"
                  value={projectForm.github_url}
                  onChange={(e) => setProjectForm({ ...projectForm, github_url: e.target.value })}
                  placeholder="https://github.com/username/project-repo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tech Stack (Comma separated)</label>
                <input
                  type="text"
                  value={projectForm.technologies}
                  onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
                  placeholder="Python, React, PyTorch, Docker"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Brief summary of what this project does and key features..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg"
                >
                  {adding ? 'Adding...' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
