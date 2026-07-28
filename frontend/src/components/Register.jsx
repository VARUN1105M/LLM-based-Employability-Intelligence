import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Mail, AlertCircle, ArrowRight, Briefcase, Award } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(fullName, email, password, role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <span className="text-white font-extrabold text-xl">AT</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Create Your Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or{' '}
          <Link to="/login" className="font-semibold text-primary-400 hover:text-primary-300 transition-colors">
            log in to existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-950/40 border border-red-800/50 p-4 text-sm text-red-400 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-3 placeholder-slate-600 transition-all text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-3 placeholder-slate-600 transition-all text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-3 placeholder-slate-600 transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                I am a:
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    role === 'student'
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Award className="h-5 w-5 mb-1" />
                  <span className="text-xs">Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('mentor')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    role === 'mentor'
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <User className="h-5 w-5 mb-1" />
                  <span className="text-xs">Mentor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    role === 'recruiter'
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Briefcase className="h-5 w-5 mb-1" />
                  <span className="text-xs">Recruiter</span>
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {submitting ? 'Registering...' : 'Register'}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
