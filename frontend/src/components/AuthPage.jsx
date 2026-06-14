import React, { useState } from 'react';
import { Shield, Activity, KeyRound, UserPlus, LogIn, AlertCircle, User, MapPin, GraduationCap } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

export default function AuthPage({ onAuthSuccess, connError, onRetryConnection, isCancelable, onCancel }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [college, setCollege] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and Password are required');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? 'login' : 'signup';
      const payload = isLogin 
        ? { username: username.trim(), password: password.trim() }
        : { 
            username: username.trim(), 
            password: password.trim(),
            fullName: fullName.trim(),
            location: location.trim(),
            college: college.trim()
          };

      const res = await axios.post(`${BACKEND_URL}/users/${endpoint}`, payload);
      onAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || `Authentication failed. Make sure the server is online.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Elements for Glassmorphic Glow */}
      <div className="glow-bg glow-bg-1"></div>
      <div className="glow-bg glow-bg-2"></div>
      <div className="glow-bg glow-bg-3"></div>

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative inline-flex p-3 bg-brand-indigo text-white rounded-2xl text-blue-950 shadow-sm mb-2">
            <Shield className="w-8 h-8" />
            <Activity className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" strokeWidth={4} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 ">
            CP Pulse & AI Coach
          </h1>
          <p className="text-sm text-slate-500">Secure entry to competitive programming analytics.</p>
        </div>

        {/* Connection Error Banner */}
        {connError && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col gap-2 text-amber-300 text-xs font-semibold">
            <p className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Local Backend Express Server Offline</p>
            <button 
              onClick={onRetryConnection}
              className="py-1 bg-amber-500 text-blue-950 font-bold rounded-lg hover:opacity-90 transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Auth Panel Card */}
        <div className="bg-[#110e1b] border border-slate-800/80 p-8 rounded-3xl border border-slate-800/80 shadow-sm space-y-6">
          {/* Tab Selector */}
          <div className="flex bg-dark-905 border border-slate-800/80 p-1.5 rounded-xl">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${isLogin ? 'bg-brand-indigo text-white text-slate-100 shadow' : 'text-slate-500 hover:text-brand-indigo'}`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${!isLogin ? 'bg-brand-indigo text-white text-slate-100 shadow' : 'text-slate-500 hover:text-brand-indigo'}`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Sign Up
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. aradhya"
                className="w-full bg-[#110e1b] border border-slate-800/80 px-4 py-2.5 rounded-xl text-slate-100 outline-none focus:border-royal/20 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#110e1b] border border-slate-800/80 pl-10 pr-4 py-2.5 rounded-xl text-slate-100 outline-none focus:border-royal/20 text-sm"
                />
              </div>
            </div>

            {/* Profile fields on Signup */}
            {!isLogin && (
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Profile Information</p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full bg-[#110e1b] border border-slate-800 px-4 pl-10 py-2.5 rounded-xl text-slate-100 outline-none focus:border-royal/20 text-xs"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Location (e.g. Lucknow, India)"
                      className="w-full bg-[#110e1b] border border-slate-800 px-4 pl-10 py-2.5 rounded-xl text-slate-100 outline-none focus:border-brand-indigo/20 text-xs"
                    />
                  </div>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="College / Organization"
                      className="w-full bg-[#110e1b] border border-slate-800 px-4 pl-10 py-2.5 rounded-xl text-slate-100 outline-none focus:border-royal/20 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-indigo text-white text-slate-100 py-3 rounded-xl font-bold transition hover:opacity-95 shadow-md shadow-brand-indigo/10 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-100 border-t-transparent animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {isCancelable && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 py-2 rounded-xl text-xs font-semibold transition mt-3 flex items-center justify-center"
            >
              Cancel and Return
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
