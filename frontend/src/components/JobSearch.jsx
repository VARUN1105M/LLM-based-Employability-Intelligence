import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Clock,
  Sparkles,
  ExternalLink,
  Filter,
  Plus,
  CheckCircle,
  Building,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function JobSearch() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState('');

  // Selected Job for Modal
  const [activeJobModal, setActiveJobModal] = useState(null);

  // Post Job Form State (for Recruiters / Mentors)
  const [showPostModal, setShowPostModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState('');
  const [postForm, setPostForm] = useState({
    company: '',
    title: '',
    location: 'Remote',
    salary: '$90,000 - $120,000',
    employment_type: 'Full-time',
    description: '',
    skills: '',
    apply_url: ''
  });

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (selectedLocation) params.append('location', selectedLocation);
      if (selectedType && selectedType !== 'All') params.append('employment_type', selectedType);
      if (selectedSkill) params.append('skill', selectedSkill);

      const res = await axios.get(`http://localhost:8085/api/jobs?${params.toString()}`);
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch job listings. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const res = await axios.get('http://localhost:8085/api/jobs/bookmarks/me');
      const ids = (res.data.bookmarked_jobs || []).map(b => b.job_id);
      setBookmarkedJobs(ids);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBookmark = async (jobId, e) => {
    e.stopPropagation();
    try {
      const res = await axios.post(`http://localhost:8085/api/jobs/${jobId}/bookmark`);
      if (res.data.bookmarked) {
        setBookmarkedJobs(prev => [...prev, jobId]);
      } else {
        setBookmarkedJobs(prev => prev.filter(id => id !== jobId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchBookmarks();
  }, [selectedType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setPosting(true);
    setPostSuccess('');
    try {
      await axios.post('http://localhost:8085/api/jobs', postForm);
      setPostSuccess('Job posted successfully!');
      setShowPostModal(false);
      setPostForm({
        company: '',
        title: '',
        location: 'Remote',
        salary: '$90,000 - $120,000',
        employment_type: 'Full-time',
        description: '',
        skills: '',
        apply_url: ''
      });
      fetchJobs();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to post job listing.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-950 via-slate-900 to-indigo-950 border border-slate-800 p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Job Matcher</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Discover Tech Career Opportunities
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Search top developer positions, internships, and AI roles matched directly with your skills, resume proficiencies, and employability score.
          </p>

          {/* Action to Post Job if Recruiter or Mentor */}
          {['recruiter', 'mentor', 'admin'].includes(user?.role) && (
            <button
              onClick={() => setShowPostModal(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-lg transition-all mt-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Post New Job Opening
            </button>
          )}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4 md:p-6 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by job title, company, or tech stack (e.g. React, Python, Full Stack)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Location (e.g. Remote, SF)"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-36 md:w-44 bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center shrink-0"
            >
              <Search className="h-4 w-4 mr-1.5" /> Search
            </button>
          </div>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs font-semibold text-slate-400 flex items-center mr-2">
            <Filter className="h-3.5 w-3.5 mr-1" /> Type:
          </span>
          {['All', 'Full-time', 'Internship', 'Remote'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedType === type
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {type}
            </button>
          ))}

          {/* Quick Skill Tags */}
          <span className="text-xs font-semibold text-slate-400 flex items-center ml-auto mr-2">
            Filter Skill:
          </span>
          {['Python', 'React', 'FastAPI', 'Docker', 'Machine Learning'].map((sk) => (
            <button
              key={sk}
              onClick={() => {
                const nextSkill = selectedSkill === sk ? '' : sk;
                setSelectedSkill(nextSkill);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                selectedSkill === sk
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-850'
              }`}
            >
              {sk}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {postSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          {postSuccess}
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
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          <p className="text-xs text-slate-400">Fetching matching job opportunities...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <Briefcase className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No jobs found matching your criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search terms, clearing filters, or checking back later for new company postings.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedLocation('');
              setSelectedType('All');
              setSelectedSkill('');
              fetchJobs();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-white rounded-xl transition-all mt-2"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Jobs Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.job_id}
              className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-primary-500/40 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 group"
            >
              <div className="space-y-4">
                {/* Header & Match Score */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-11 w-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-primary-400 group-hover:border-primary-500/30 transition-colors">
                      <Building className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{job.company}</h4>
                      <h3 className="text-base font-bold text-white group-hover:text-primary-400 transition-colors leading-snug">
                        {job.title}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={(e) => toggleBookmark(job.job_id, e)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        bookmarkedJobs.includes(job.job_id)
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'
                      }`}
                      title={bookmarkedJobs.includes(job.job_id) ? 'Saved to bookmarks' : 'Save job'}
                    >
                      {bookmarkedJobs.includes(job.job_id) ? (
                        <BookmarkCheck className="h-4 w-4" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </button>
                    <div
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center border ${
                        job.match_score >= 80
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : job.match_score >= 50
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                      title={`${job.match_score}% skill alignment based on your profile`}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {job.match_score}% Match
                    </div>
                  </div>
                </div>

                {/* Job Meta details */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-slate-500" />
                    {job.location || 'Remote'}
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="h-3.5 w-3.5 mr-0.5 text-slate-500" />
                    {job.salary || 'Competitive'}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1 text-slate-500" />
                    {job.employment_type || 'Full-time'}
                  </span>
                </div>

                {/* Description Snippet */}
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>

                {/* Skill Tags */}
                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.skills.slice(0, 4).map((sk) => {
                      const isMatched = job.matched_skills?.includes(sk);
                      return (
                        <span
                          key={sk}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isMatched
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {sk}
                        </span>
                      );
                    })}
                    {job.skills.length > 4 && (
                      <span className="text-[10px] text-slate-500 self-center font-medium">
                        +{job.skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-5 mt-4 border-t border-slate-800/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveJobModal(job)}
                  className="text-xs font-semibold text-slate-300 hover:text-white flex items-center transition-colors"
                >
                  View Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </button>
                <a
                  href={job.apply_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md transition-all flex items-center"
                >
                  Apply <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail View */}
      {activeJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setActiveJobModal(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950 border border-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-2">
              <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">{activeJobModal.company}</span>
              <h2 className="text-2xl font-extrabold text-white">{activeJobModal.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1" />{activeJobModal.location}</span>
                <span className="flex items-center"><DollarSign className="h-3.5 w-3.5 mr-0.5" />{activeJobModal.salary}</span>
                <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1" />{activeJobModal.employment_type}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">Profile Skill Match</span>
                <span className="text-emerald-400 font-extrabold">{activeJobModal.match_score}% Match</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-primary-500 h-2 rounded-full"
                  style={{ width: `${activeJobModal.match_score}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white">Job Description</h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {activeJobModal.description}
              </p>
            </div>

            {activeJobModal.skills && activeJobModal.skills.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Required Technical Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {activeJobModal.skills.map((sk) => {
                    const isMatched = activeJobModal.matched_skills?.includes(sk);
                    return (
                      <span
                        key={sk}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                          isMatched
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {sk} {isMatched && '✓'}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setActiveJobModal(null)}
                className="px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl"
              >
                Close
              </button>
              <a
                href={activeJobModal.apply_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center"
              >
                Apply Now <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Post Job Modal (For Recruiters/Mentors) */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowPostModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950 border border-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-extrabold text-white">Post New Opportunity</h3>

            <form onSubmit={handlePostJob} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={postForm.company}
                    onChange={(e) => setPostForm({ ...postForm, company: e.target.value })}
                    placeholder="E.g., Google"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    placeholder="E.g., Frontend Engineer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Location</label>
                  <input
                    type="text"
                    value={postForm.location}
                    onChange={(e) => setPostForm({ ...postForm, location: e.target.value })}
                    placeholder="E.g., Remote / NYC"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Employment Type</label>
                  <select
                    value={postForm.employment_type}
                    onChange={(e) => setPostForm({ ...postForm, employment_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Salary Range</label>
                <input
                  type="text"
                  value={postForm.salary}
                  onChange={(e) => setPostForm({ ...postForm, salary: e.target.value })}
                  placeholder="E.g., $90,000 - $120,000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  value={postForm.skills}
                  onChange={(e) => setPostForm({ ...postForm, skills: e.target.value })}
                  placeholder="React, Python, FastAPI, Docker"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Application URL</label>
                <input
                  type="text"
                  value={postForm.apply_url}
                  onChange={(e) => setPostForm({ ...postForm, apply_url: e.target.value })}
                  placeholder="https://company.com/apply"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  value={postForm.description}
                  onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                  placeholder="Describe the job duties and qualifications..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-lg"
                >
                  {posting ? 'Posting...' : 'Post Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
