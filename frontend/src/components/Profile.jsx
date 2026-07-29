import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Award, BookOpen, MapPin, Briefcase, Plus, Trash2, Save, CheckCircle, Unlink } from 'lucide-react';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Profile state
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    profile_image: '',
    role: '',
    email: '',
    student_details: {
      register_number: '',
      college_name: '',
      department: '',
      year: 1,
      cgpa: 0.0,
      tenth_percentage: 0.0,
      twelfth_percentage: 0.0,
      current_semester: 1,
      location: ''
    },
    mentor_details: {
      company: '',
      designation: '',
      expertise: '',
      experience: 0
    },
    projects: [],
    certifications: []
  });

  // Project & Cert Form States
  const [projectForm, setProjectForm] = useState({ title: '', description: '', github_url: '', technologies: '' });
  const [certForm, setCertForm] = useState({ title: '', issuer: '', issue_date: '', certificate_url: '' });

  // GitHub Sync State
  const [githubUsername, setGithubUsername] = useState('');
  const [syncing, setSyncing] = useState(false);

  const syncGithub = async () => {
    if (!githubUsername.trim()) return;
    setSyncing(true);
    setError('');
    setSuccess(false);
    try {
      await axios.post(`http://localhost:8085/api/profiles/github/sync?username=${githubUsername}`);
      setSuccess(true);
      fetchProfile();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to sync with GitHub.');
    } finally {
      setSyncing(false);
    }
  };
  const unlinkGithub = async () => {
    setSyncing(true);
    setError('');
    setSuccess(false);
    try {
      await axios.post('http://localhost:8085/api/profiles/github/unlink');
      setSuccess(true);
      fetchProfile();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to unlink GitHub.');
    } finally {
      setSyncing(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:8085/api/profiles/me');
      // Merge keys to avoid null values crashing inputs
      setProfile({
        ...profile,
        ...response.data,
        student_details: response.data.student_details || profile.student_details,
        mentor_details: response.data.mentor_details || profile.mentor_details,
        projects: response.data.projects || [],
        certifications: response.data.certifications || []
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleBaseChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleStudentChange = (e) => {
    setProfile({
      ...profile,
      student_details: {
        ...profile.student_details,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleMentorChange = (e) => {
    setProfile({
      ...profile,
      mentor_details: {
        ...profile.mentor_details,
        [e.target.name]: e.target.value
      }
    });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');
    
    try {
      // 1. Save base user details
      await axios.put('http://localhost:8085/api/profiles/user', {
        full_name: profile.full_name,
        phone: profile.phone,
        profile_image: profile.profile_image
      });

      // 2. Save subclass profile
      if (profile.role === 'student') {
        await axios.put('http://localhost:8085/api/profiles/student', profile.student_details);
      } else if (profile.role === 'mentor') {
        await axios.put('http://localhost:8085/api/profiles/mentor', profile.mentor_details);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save profile updates.');
    } finally {
      setSaving(false);
    }
  };

  // Add / Delete Projects
  const addProject = async (e) => {
    e.preventDefault();
    if (!projectForm.title) return;
    try {
      await axios.post('http://localhost:8085/api/profiles/project', projectForm);
      setProjectForm({ title: '', description: '', github_url: '', technologies: '' });
      fetchProfile();
    } catch (err) {
      setError('Failed to add project.');
    }
  };

  const deleteProject = async (id) => {
    try {
      await axios.delete(`http://localhost:8085/api/profiles/project/${id}`);
      fetchProfile();
    } catch (err) {
      setError('Failed to delete project.');
    }
  };

  // Add / Delete Certifications
  const addCertification = async (e) => {
    e.preventDefault();
    if (!certForm.title || !certForm.issuer) return;
    try {
      await axios.post('http://localhost:8085/api/profiles/certification', certForm);
      setCertForm({ title: '', issuer: '', issue_date: '', certificate_url: '' });
      fetchProfile();
    } catch (err) {
      setError('Failed to add certification.');
    }
  };

  const deleteCertification = async (id) => {
    try {
      await axios.delete(`http://localhost:8085/api/profiles/certification/${id}`);
      fetchProfile();
    } catch (err) {
      setError('Failed to delete certification.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Profile Details</h1>
        <p className="text-slate-400 mt-2 text-sm capitalize">
          Manage your personal and {profile.role} specific details saved in your Supabase database.
        </p>
      </div>

      <form onSubmit={saveProfile} className="space-y-6">
        {/* Status notifications */}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center text-sm">
            <CheckCircle className="h-5 w-5 mr-2" />
            Profile updated successfully in Supabase!
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Base Details Card */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center">
            <User className="h-5 w-5 text-primary-400 mr-2" />
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={profile.full_name}
                onChange={handleBaseChange}
                className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address (Read-only)</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="bg-slate-950 border border-slate-850 text-slate-500 rounded-xl p-3 w-full text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={profile.phone || ''}
                onChange={handleBaseChange}
                placeholder="E.g., +91 999999999"
                className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Profile Image URL</label>
              <input
                type="text"
                name="profile_image"
                value={profile.profile_image || ''}
                onChange={handleBaseChange}
                placeholder="https://example.com/avatar.jpg"
                className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Role-Based Profile Form */}
        {profile.role === 'student' && (
          <div className="space-y-6">
            {/* GitHub Sync Card */}
            {profile.student_details?.github_username ? (
              <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900/30 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center">
                        Synced with {profile.student_details.github_username}
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="h-3 w-3 mr-1 shrink-0" /> Verified
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Your public repositories and extracted coding skills are synchronized with the database.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={unlinkGithub}
                    disabled={syncing}
                    className="inline-flex items-center px-4 py-2 border border-red-500/30 hover:border-red-500/60 bg-red-500/5 hover:bg-red-500/10 disabled:opacity-50 text-xs font-semibold text-red-400 rounded-xl transition-all"
                  >
                    <Unlink className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                    {syncing ? 'Unlinking...' : 'Unlink Account'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-primary-950/40 to-indigo-950/20 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center">
                      <span className="h-2 w-2 rounded-full bg-primary-400 mr-2 animate-pulse" />
                      GitHub Portfolio Sync
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Synchronize your top repositories, primary programming languages, and location instantly from GitHub.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <input
                      type="text"
                      placeholder="GitHub Username"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      className="bg-slate-950 border border-slate-805 text-white rounded-lg p-2 text-xs w-40"
                    />
                    <button
                      type="button"
                      onClick={syncGithub}
                      disabled={syncing || !githubUsername}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-xs font-bold rounded-lg text-white transition-colors"
                    >
                      {syncing ? 'Syncing...' : 'Sync Portfolio'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center">
              <BookOpen className="h-5 w-5 text-indigo-400 mr-2" />
              Academic Profile Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Register Number</label>
                <input
                  type="text"
                  name="register_number"
                  value={profile.student_details.register_number || ''}
                  onChange={handleStudentChange}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">College Name</label>
                <input
                  type="text"
                  name="college_name"
                  value={profile.student_details.college_name || ''}
                  onChange={handleStudentChange}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Department</label>
                <input
                  type="text"
                  name="department"
                  value={profile.student_details.department || ''}
                  onChange={handleStudentChange}
                  placeholder="E.g., CSE"
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Year of Study</label>
                <input
                  type="number"
                  name="year"
                  min="1"
                  max="5"
                  value={profile.student_details.year || 1}
                  onChange={handleStudentChange}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Current Semester</label>
                <input
                  type="number"
                  name="current_semester"
                  min="1"
                  max="10"
                  value={profile.student_details.current_semester || 1}
                  onChange={handleStudentChange}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Current CGPA</label>
                <input
                  type="number"
                  name="cgpa"
                  step="0.01"
                  min="0"
                  max="10"
                  value={profile.student_details.cgpa || 0}
                  onChange={handleStudentChange}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">10th Percentage (%)</label>
                <input
                  type="number"
                  name="tenth_percentage"
                  step="0.01"
                  min="0"
                  max="100"
                  value={profile.student_details.tenth_percentage || 0}
                  onChange={handleStudentChange}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">12th Percentage (%)</label>
                <input
                  type="number"
                  name="twelfth_percentage"
                  step="0.01"
                  min="0"
                  max="100"
                  value={profile.student_details.twelfth_percentage || 0}
                  onChange={handleStudentChange}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={profile.student_details.location || ''}
                  onChange={handleStudentChange}
                  placeholder="E.g., Bangalore, India"
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                />
              </div>
            </div>
          </div>
          </div>
        )}

        {profile.role === 'mentor' && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center">
              <Briefcase className="h-5 w-5 text-indigo-400 mr-2" />
              Professional Mentor Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Affiliated Company</label>
                <input
                  type="text"
                  name="company"
                  value={profile.mentor_details.company || ''}
                  onChange={handleMentorChange}
                  placeholder="E.g., Google"
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={profile.mentor_details.designation || ''}
                  onChange={handleMentorChange}
                  placeholder="E.g., Senior Tech Lead"
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Years of Experience</label>
                <input
                  type="number"
                  name="experience"
                  min="0"
                  value={profile.mentor_details.experience || 0}
                  onChange={handleMentorChange}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Core Expertise (Comma-separated)</label>
                <input
                  type="text"
                  name="expertise"
                  value={profile.mentor_details.expertise || ''}
                  onChange={handleMentorChange}
                  placeholder="React, Python, Machine Learning"
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 p-3 w-full text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Recruiters don't have separate profile cards since their company details are inside their users profile name/auth */}
        {profile.role === 'recruiter' && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center">
              <Briefcase className="h-5 w-5 text-indigo-400 mr-2" />
              Recruiter & Company Profile
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Your name and phone number represent your company contact profile. You can post industry challenges, review student scores, and search for potential hires from the recruiter dashboard panels.
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 min-w-[140px]"
          >
            {saving ? (
              'Saving Updates...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>

      {/* Projects & Certifications sections ONLY for Students */}
      {profile.role === 'student' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Projects Management */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <Briefcase className="h-5 w-5 text-primary-400 mr-2" />
                Manage Projects
              </h3>
              <span className="text-xs text-slate-500 font-bold">{profile.projects.length} Total</span>
            </div>

            {/* List of projects */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
              {profile.projects.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No projects added yet.</p>
              ) : (
                profile.projects.map((proj) => (
                  <div key={proj.project_id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{proj.title}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{proj.description}</p>
                    </div>
                    <button
                      onClick={() => deleteProject(proj.project_id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 shrink-0 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Project Form */}
            <form onSubmit={addProject} className="border-t border-slate-800/60 pt-4 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase">Add Project</p>
              <input
                type="text"
                placeholder="Project Title"
                value={projectForm.title}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                className="bg-slate-950 border border-slate-850 text-white rounded-lg p-2.5 w-full text-xs"
                required
              />
              <input
                type="text"
                placeholder="Brief Description"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                className="bg-slate-950 border border-slate-850 text-white rounded-lg p-2.5 w-full text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="GitHub URL"
                  value={projectForm.github_url}
                  onChange={(e) => setProjectForm({ ...projectForm, github_url: e.target.value })}
                  className="bg-slate-950 border border-slate-850 text-white rounded-lg p-2.5 text-xs"
                />
                <input
                  type="text"
                  placeholder="Tech (Comma sep)"
                  value={projectForm.technologies}
                  onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
                  className="bg-slate-950 border border-slate-850 text-white rounded-lg p-2.5 text-xs"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center w-full py-2 bg-slate-800 hover:bg-slate-750 text-xs font-bold rounded-lg text-white transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Project
              </button>
            </form>
          </div>

          {/* Certifications Management */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <Award className="h-5 w-5 text-primary-400 mr-2" />
                Manage Certifications
              </h3>
              <span className="text-xs text-slate-500 font-bold">{profile.certifications.length} Total</span>
            </div>

            {/* List of certs */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
              {profile.certifications.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No certifications added yet.</p>
              ) : (
                profile.certifications.map((c) => (
                  <div key={c.certificate_id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{c.title}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{c.issuer}</p>
                    </div>
                    <button
                      onClick={() => deleteCertification(c.certificate_id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 shrink-0 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Cert Form */}
            <form onSubmit={addCertification} className="border-t border-slate-800/60 pt-4 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase">Add Certification</p>
              <input
                type="text"
                placeholder="Certification Title"
                value={certForm.title}
                onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                className="bg-slate-950 border border-slate-850 text-white rounded-lg p-2.5 w-full text-xs"
                required
              />
              <input
                type="text"
                placeholder="Issuer (e.g. AWS, Coursera)"
                value={certForm.issuer}
                onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                className="bg-slate-950 border border-slate-850 text-white rounded-lg p-2.5 w-full text-xs"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={certForm.issue_date}
                  onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })}
                  className="bg-slate-950 border border-slate-850 text-white rounded-lg p-2.5 text-xs"
                />
                <input
                  type="text"
                  placeholder="Cert Link URL"
                  value={certForm.certificate_url}
                  onChange={(e) => setCertForm({ ...certForm, certificate_url: e.target.value })}
                  className="bg-slate-950 border border-slate-850 text-white rounded-lg p-2.5 text-xs"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center w-full py-2 bg-slate-800 hover:bg-slate-750 text-xs font-bold rounded-lg text-white transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Certification
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
