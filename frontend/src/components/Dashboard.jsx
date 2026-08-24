import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Award, Briefcase, ChevronRight, TrendingUp, BookOpen, Clock, AlertTriangle, UploadCloud, FileText, Loader, Sparkles, ExternalLink, FolderGit2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [recommendations, setRecommendations] = useState({ top_job_recommendations: [], featured_projects: [] });
  const [data, setData] = useState({
    profile: null,
    skills: [],
    prediction: null,
    gaps: [],
    recentActivities: []
  });

  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:8085/api/profiles/me');
      const profile = res.data;
      const onboarded = profile.student_details && profile.student_details.resume_url;
      
      let activities = [];
      if (onboarded) {
        activities = [
          { id: 1, type: "resume", message: "Resume parsed and student profile synchronized successfully.", date: "Just now" },
          { id: 2, type: "skill", message: `Extracted ${profile.skills?.length || 0} skills from resume.`, date: "Just now" }
        ];
      }

      setData({
        profile: profile,
        skills: profile.skills || [],
        prediction: profile.prediction,
        gaps: profile.gaps || [],
        recentActivities: activities
      });

      // Fetch job & project recommendations
      try {
        const recRes = await axios.get('http://localhost:8085/api/dashboard/recommendations');
        setRecommendations(recRes.data || { top_job_recommendations: [], featured_projects: [] });
      } catch (e) {
        console.error('Failed to fetch recommendations:', e);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF resume files are supported.");
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post('http://localhost:8085/api/profiles/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      await fetchData();
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.detail || "Failed to upload and parse resume. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const isStudent = data.profile?.role === 'student';
  const isOnboarded = !isStudent || (data.profile?.student_details && data.profile.student_details.resume_url);

  // If student is not onboarded, render Onboarding Wizard
  if (!isOnboarded) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-10">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-full mb-2">
            <UploadCloud className="h-10 w-10 animate-bounce" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Onboard Your Student Profile</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
            Welcome to the AI-Powered Career Intelligence Platform! Upload your professional resume in PDF format to synchronize your skill sets, extract experience logs, and initialize the ATIA career matching engine.
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-80 h-80 bg-primary-500/5 rounded-full blur-[80px]" />
          
          {uploading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 relative z-10">
              <Loader className="h-12 w-12 text-primary-500 animate-spin" />
              <p className="text-white font-bold animate-pulse">Parsing Resume Content...</p>
              <p className="text-xs text-slate-500">Our AI model is extracting skills, education details, and computing readiness scores.</p>
            </div>
          ) : (
            <div className="space-y-6 relative z-10">
              <div className="border-2 border-dashed border-slate-800 hover:border-primary-500/50 rounded-2xl p-10 text-center cursor-pointer transition-colors relative group bg-slate-950/20">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center space-y-3">
                  <FileText className="h-12 w-12 text-slate-500 group-hover:text-primary-400 transition-colors" />
                  <div className="text-sm font-semibold text-white">
                    Click to browse or drag and drop your PDF resume
                  </div>
                  <div className="text-xs text-slate-500">
                    PDF files only (max 10MB)
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-3 text-xs text-slate-400">
                <div className="font-bold text-white uppercase tracking-wider text-[10px]">What happens next?</div>
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Your full name, phone number, and location will be auto-populated.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Technical skills will be automatically mapped to your dashboard inventory.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>The ATIA engine will run match models against active roles to calculate your Career Readiness Score.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard calculations/destructuring
  const { profile, skills, prediction, gaps, recentActivities } = data;
  const studentDetails = profile?.student_details || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary-900/60 to-indigo-900/40 border border-slate-800 p-6 sm:p-8">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-80 h-80 bg-primary-500/10 rounded-full blur-[80px]" />
        <div className="relative z-10">
          <span className="text-primary-400 text-xs font-bold uppercase tracking-widest bg-primary-950/80 border border-primary-500/30 px-3 py-1 rounded-full">
            ATIA Intelligence Active
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-4">
            Hello, {profile?.full_name || 'Student'}!
          </h1>
          <p className="text-slate-300 mt-2 max-w-xl text-sm leading-relaxed">
            Welcome to your AI Career intelligence cockpit. Based on your current profile, the ATIA engine has analyzed your employability.
          </p>
        </div>
      </div>

      {/* Main Score Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Career Readiness Score */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-all" />
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Career Readiness Score</h3>
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="72" cy="72" r="64" strokeWidth="10" stroke="#1e293b" fill="transparent" />
              <circle
                cx="72"
                cy="72"
                r="64"
                strokeWidth="10"
                stroke="url(#grad1)"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={2 * Math.PI * 64 * (1 - (prediction?.employability_score || 0) / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{prediction?.employability_score || 0}%</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">Excellent</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400 flex items-center justify-center">
            <TrendingUp className="text-primary-400 h-4 w-4 mr-1" />
            <span>Profile-based score prediction</span>
          </div>
        </div>

        {/* Employability Predictor / Role */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between group hover:border-primary-500/30 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Career Role</h3>
            <div className="mt-4 flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-white leading-none">{prediction?.predicted_role || 'Not Calculated'}</p>
                <p className="text-xs text-slate-400 mt-1">ATIA Predicted Match</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800/80 pt-4 mt-6">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Model Confidence</span>
              <span className="text-white font-bold">{Math.round((prediction?.confidence || 0) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-1.5 rounded-full"
                style={{ width: `${(prediction?.confidence || 0) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Academic Profile Snapshot */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between group hover:border-primary-500/30 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Academic Profile</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-850">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">CGPA</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block">{studentDetails.cgpa || 'N/A'}</span>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-850">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Branch</span>
                <span className="text-sm font-bold text-white mt-1 block truncate" title={studentDetails.department || 'N/A'}>
                  {studentDetails.department ? studentDetails.department.split(' ')[0] : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800/80 pt-4 mt-6 flex justify-between items-center text-xs text-slate-400">
            <span className="truncate" title={studentDetails.college_name}>{studentDetails.college_name || 'No institution'}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Skills Analysis & Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Extracted Skills List */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Award className="text-primary-400 h-5 w-5" />
              <h3 className="text-base font-bold text-white">Your Skills Inventory</h3>
            </div>
            <span className="text-xs bg-primary-500/10 border border-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full font-semibold">
              {skills.length} Active
            </span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {skills.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No skills extracted yet.</p>
            ) : (
              skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-850 hover:border-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 rounded-full bg-primary-400" />
                    <span className="text-sm font-semibold text-white">{skill.skill_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      {skill.skill_category}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">{skill.proficiency}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Skill Gap Analysis */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="text-amber-400 h-5 w-5" />
              <h3 className="text-base font-bold text-white">Skill Gap Analysis</h3>
            </div>
            <span className="text-xs text-slate-400">Target Role Gaps</span>
          </div>

          <div className="space-y-4">
            {gaps.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No skill gap analysis calculated.</p>
            ) : (
              gaps.map((gap, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-semibold text-white">{gap.required_skill}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        (Needed: {gap.required_level} / Have: {gap.current_level})
                      </span>
                    </div>
                    <span className="text-xs text-amber-400 font-bold">{gap.gap_percentage}% Gap</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-red-500 h-2 rounded-full"
                      style={{ width: `${gap.gap_percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recommended Jobs & Featured Projects Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Matched Jobs */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="text-primary-400 h-5 w-5" />
              <h3 className="text-base font-bold text-white">Recommended Job Matches</h3>
            </div>
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center"
            >
              Explore All <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recommendations.top_job_recommendations.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No job recommendations available.</p>
            ) : (
              recommendations.top_job_recommendations.map((job) => (
                <div
                  key={job.job_id}
                  onClick={() => navigate('/jobs')}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-primary-500/40 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">{job.company}</span>
                    <h4 className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">
                      {job.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{job.location} • {job.salary}</p>
                  </div>
                  <div className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {job.match_score}% Match
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Featured Projects */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderGit2 className="text-indigo-400 h-5 w-5" />
              <h3 className="text-base font-bold text-white">Showcase Projects</h3>
            </div>
            <button
              onClick={() => navigate('/projects-search')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center"
            >
              Search Catalog <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recommendations.featured_projects.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No projects available.</p>
            ) : (
              recommendations.featured_projects.map((proj) => (
                <div
                  key={proj.project_id}
                  onClick={() => navigate('/projects-search')}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-indigo-500/40 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                      {proj.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{proj.description}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {proj.technologies?.[0] || 'Code'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="text-indigo-400 h-5 w-5" />
          <h3 className="text-base font-bold text-white">Activity Logs</h3>
        </div>
        <div className="space-y-4">
          {recentActivities.map((act) => (
            <div
              key={act.id}
              className="flex items-start justify-between p-3 rounded-xl bg-slate-950/20 border border-slate-900/50 hover:bg-slate-900/20 transition-all duration-200"
            >
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-200">{act.message}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{act.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
