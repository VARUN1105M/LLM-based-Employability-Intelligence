import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Briefcase, ChevronRight, TrendingUp, BookOpen, Clock, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    profile: null,
    skills: [],
    prediction: null,
    gaps: [],
    recentActivities: []
  });

  // Mock data for demonstration when backend API isn't fully trained
  const mockData = {
    profile: { cgpa: 8.5, department: "Computer Science & Engineering", college_name: "IEEE Engineering College" },
    skills: [
      { skill_name: "Python", skill_category: "technical", proficiency: "Advanced" },
      { skill_name: "React.js", skill_category: "technical", proficiency: "Intermediate" },
      { skill_name: "SQL", skill_category: "technical", proficiency: "Advanced" },
      { skill_name: "Communication", skill_category: "soft", proficiency: "Advanced" }
    ],
    prediction: {
      employability_score: 82.5,
      ability_score: 79.0,
      predicted_role: "Full Stack Engineer",
      confidence: 0.88
    },
    gaps: [
      { required_skill: "Docker", current_level: "None", required_level: "Intermediate", gap_percentage: 60 },
      { required_skill: "Machine Learning", current_level: "Beginner", required_level: "Advanced", gap_percentage: 45 }
    ],
    recentActivities: [
      { id: 1, type: "resume", message: "Resume parsed successfully.", date: "Today, 10:15 AM" },
      { id: 2, type: "assessment", message: "Completed Logical Aptitude test. Scored 85%.", date: "Yesterday, 2:30 PM" },
      { id: 3, type: "skill", message: "New skill 'React.js' added from Resume.", date: "2 days ago" }
    ]
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get('http://localhost:8000/api/auth/me');
        // If profile loaded successfully, try fetching custom predictions, else fallback
        // We will fallback to mock data since we just initialized the DB
        setData({
          ...mockData,
          profile: { ...mockData.profile, full_name: profileRes.data.full_name }
        });
      } catch (err) {
        console.warn('API connection refused, using mock demo database data.');
        setData({
          ...mockData,
          profile: { ...mockData.profile, full_name: "Student Demo User" }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const { profile, skills, prediction, gaps, recentActivities } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
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
              <span className="text-3xl font-black text-white">{prediction?.employability_score}%</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">Excellent</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400 flex items-center justify-center">
            <TrendingUp className="text-primary-400 h-4 w-4 mr-1" />
            <span>+2.4% progress this month</span>
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
                <p className="text-lg font-bold text-white leading-none">{prediction?.predicted_role}</p>
                <p className="text-xs text-slate-400 mt-1">ATIA Predicted Match</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800/80 pt-4 mt-6">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Model Confidence</span>
              <span className="text-white font-bold">{prediction?.confidence * 100}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-1.5 rounded-full"
                style={{ width: `${prediction?.confidence * 100}%` }}
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
                <span className="text-xl font-bold text-emerald-400 mt-1 block">{profile?.cgpa}</span>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-850">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Branch</span>
                <span className="text-sm font-bold text-white mt-1 block truncate" title={profile?.department}>CSE</span>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800/80 pt-4 mt-6 flex justify-between items-center text-xs text-slate-400">
            <span className="truncate">{profile?.college_name}</span>
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
            {skills.map((skill, index) => (
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
            ))}
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
            {gaps.map((gap, index) => (
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
            ))}
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
