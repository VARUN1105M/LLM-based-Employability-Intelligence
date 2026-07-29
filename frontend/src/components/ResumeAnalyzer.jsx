import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle2, RefreshCw, AlertCircle, FileUp } from 'lucide-react';

export default function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const mockAnalysis = {
    score: 78,
    parsedData: {
      name: "John Doe",
      email: "johndoe@example.com",
      skills: ["Python", "SQL", "HTML/CSS", "Git", "React", "Data Structures"],
      experience: [
        { role: "Software Engineer Intern", company: "TechCorp Solutions", duration: "3 months" }
      ],
      education: [
        { degree: "B.Tech in Computer Science", college: "IEEE Engineering College", cgpa: "8.5" }
      ]
    },
    recommendations: [
      "Add quantifiable metrics to your experience descriptions (e.g., 'Optimized query latency by 20%').",
      "Include missing cloud technology keywords like 'Docker' or 'AWS' to pass recruitment filters.",
      "Add a professional summary paragraph at the top of the resume."
    ]
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('http://localhost:8085/api/resume/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(response.data);
      setAnalyzed(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to analyze resume. Please verify the file is a valid PDF.');
    } finally {
      setUploading(false);
    }
  };

  const resetAnalyzer = () => {
    setFile(null);
    setAnalyzed(false);
    setResult(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">AI Resume Analyzer</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Upload your resume in PDF format to evaluate it against industry-standard ATS screening filters and extract your skill set.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
          {error}
        </div>
      )}

      {!analyzed ? (
        /* Upload Area */
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 flex flex-col items-center">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all ${
              file
                ? 'border-primary-500/50 bg-primary-500/5'
                : 'border-slate-800 hover:border-primary-500/30 bg-slate-950/20'
            }`}
          >
            <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800/85 flex items-center justify-center text-slate-400 mb-4">
              {file ? <FileText className="h-8 w-8 text-primary-400" /> : <FileUp className="h-8 w-8 text-slate-400" />}
            </div>
            
            {file ? (
              <div className="text-center">
                <p className="text-sm font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Drag and drop your resume here</p>
                <p className="text-xs text-slate-500 mt-1">Only PDF format accepted (max 5MB)</p>
                <label className="mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white hover:bg-slate-850 cursor-pointer transition-all">
                  Browse Files
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            )}
          </div>

          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 min-w-[160px]"
            >
              {uploading ? (
                <>
                  <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                  Analyzing Resume...
                </>
              ) : (
                'Start Extraction'
              )}
            </button>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          {/* Main Scoring Header */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="h-16 w-16 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 font-black text-2xl">
                {result.score}%
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Resume Score</h3>
                <p className="text-xs text-slate-400 mt-0.5">Good readability, key gaps detected</p>
              </div>
            </div>
            <button
              onClick={resetAnalyzer}
              className="flex items-center px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Analyze Another Resume
            </button>
          </div>

          {/* Detailed analysis tabs/sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Extracted Information */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <h3 className="text-base font-bold text-white flex items-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mr-2" />
                Parsed Information
              </h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Full Name</span>
                  <span className="text-white font-medium">{result.parsedData.name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Email</span>
                  <span className="text-white font-medium">{result.parsedData.email}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Extracted Skills</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {result.parsedData.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Experience</span>
                  {result.parsedData.experience.map((exp, idx) => (
                    <div key={idx} className="border-l-2 border-primary-500/30 pl-3 py-1">
                      <p className="font-semibold text-white leading-tight">{exp.role}</p>
                      <p className="text-xs text-slate-400 mt-1">{exp.company} • {exp.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Improvement Recommendations */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <h3 className="text-base font-bold text-white flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-400 mr-2" />
                Improvement Suggestions
              </h3>

              <div className="space-y-4">
                {result.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-sm text-slate-350 flex items-start"
                  >
                    <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0 mr-3">
                      {index + 1}
                    </div>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
