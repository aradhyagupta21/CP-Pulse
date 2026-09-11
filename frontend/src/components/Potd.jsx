/* eslint-disable */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, CheckCircle2, ExternalLink, Flame, Zap, RefreshCw } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export default function Potd({ currentUser, stats }) {
  const [liveLcPotd, setLiveLcPotd] = useState(null);
  const [liveGfgPotd, setLiveGfgPotd] = useState(null);
  
  const [lcStats, setLcStats] = useState({ streak: 0, totalSolved: 0, todaySolved: false });
  const [gfgStats, setGfgStats] = useState({ streak: 0, totalSolved: 0, todaySolved: false });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPotdData = async () => {
    setIsLoading(true);
    
    // 1. Fetch Live POTDs
    try {
      const [lcRes, gfgRes] = await Promise.allSettled([
        axios.get(`${BACKEND_URL}/potd`),
        axios.get(`${BACKEND_URL}/potd/gfg`)
      ]);

      if (lcRes.status === 'fulfilled') setLiveLcPotd(lcRes.value.data);
      if (gfgRes.status === 'fulfilled') setLiveGfgPotd(gfgRes.value.data);
    } catch (e) {
      console.error('Error loading POTDs:', e);
    }

    // 2. Automatically fetch live streak & POTD solved counts from LC & GFG for currentUser
    if (currentUser?._id) {
      try {
        const res = await axios.get(`${BACKEND_URL}/potd/user-stats/${currentUser._id}`);
        if (res.data?.leetcode) setLcStats(res.data.leetcode);
        if (res.data?.geeksforgeeks) setGfgStats(res.data.geeksforgeeks);
      } catch (err) {
        console.warn('Failed to load user live POTD stats:', err);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPotdData();
  }, [currentUser]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchPotdData();
    setIsRefreshing(false);
  };

  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 'Easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  // Fallback solved count from stats if available
  const lcSolvedFromStats = stats?.find(s => s.platform === 'LeetCode')?.solvedCount || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-brand-indigo border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-800/60 mb-8">
        <div>
          <p className="text-[10px] font-bold text-brand-indigo uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Daily Challenge Tracker
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Problem of the <span className="text-brand-purple">day</span>
          </h1>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#110e1b] border border-slate-800/80 rounded-xl text-xs font-bold text-slate-300 hover:text-brand-indigo hover:border-brand-indigo/40 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-indigo' : ''}`} />
          {isRefreshing ? 'Syncing...' : 'Sync Live Streaks'}
        </button>
      </div>

      {/* Hero Section: Platform Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LeetCode Column */}
        <div className="space-y-6 flex flex-col">
          {/* LeetCode POTD */}
          {liveLcPotd && (
            <div className="bg-white dark:bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm dark:shadow-2xl relative overflow-hidden group flex-1">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <Calendar className="w-32 h-32 text-brand-indigo" />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-brand-indigo/20 text-brand-indigo font-bold text-xs rounded-lg border border-brand-indigo/30 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3" /> LeetCode
                  </span>
                  <span className="text-slate-400 text-sm font-semibold">{liveLcPotd.date}</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-4 leading-tight flex-1">
                  {liveLcPotd.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-4 mb-10">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getDifficultyColor(liveLcPotd.difficulty)}`}>
                    {liveLcPotd.difficulty}
                  </span>
                  {lcStats.todaySolved && (
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Solved Today on LeetCode
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-auto">
                  <a 
                    href={liveLcPotd.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full sm:w-auto px-8 py-3 bg-brand-indigo text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-brand-indigo/20 flex items-center justify-center gap-2 text-sm"
                  >
                    Start Problem <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* LeetCode Streak Tracker */}
          <div className="bg-white dark:bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm dark:shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden h-64">
            <div className="absolute top-0 left-0 w-full h-full bg-brand-indigo/5 opacity-50 pointer-events-none"></div>
            <div className="p-4 bg-brand-indigo/10 rounded-2xl text-brand-indigo mb-6">
              <Flame className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">LeetCode Streak Tracker</h2>
            <div className="flex items-center gap-8">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Solved</p>
                <div className="text-4xl font-black text-slate-800 dark:text-slate-200">
                  {lcStats.totalSolved || lcSolvedFromStats}
                </div>
              </div>
              <div className="w-px h-12 bg-slate-200 dark:bg-slate-800"></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Streak</p>
                <div className="text-4xl font-black text-brand-purple flex items-baseline gap-1">
                  {lcStats.streak}
                  <span className="text-sm font-bold text-slate-500">Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GeeksForGeeks Column */}
        <div className="space-y-6 flex flex-col">
          {/* GeeksForGeeks POTD */}
          {liveGfgPotd && (
            <div className="bg-white dark:bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm dark:shadow-2xl relative overflow-hidden group flex-1">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <Calendar className="w-32 h-32 text-emerald-500" />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-lg border border-emerald-500/30 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3" /> GeeksforGeeks
                  </span>
                  <span className="text-slate-400 text-sm font-semibold">{liveGfgPotd.date}</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-4 leading-tight flex-1">
                  {liveGfgPotd.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-4 mb-10">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getDifficultyColor(liveGfgPotd.difficulty)}`}>
                    {liveGfgPotd.difficulty}
                  </span>
                  {gfgStats.todaySolved && (
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Solved Today on GFG
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-auto">
                  <a 
                    href={liveGfgPotd.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full sm:w-auto px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm"
                  >
                    Start Problem <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* GeeksForGeeks Streak Tracker */}
          <div className="bg-white dark:bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm dark:shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden h-64">
            <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/5 opacity-50 pointer-events-none"></div>
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 mb-6">
              <Flame className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">GeeksForGeeks Streak Tracker</h2>
            <div className="flex items-center gap-8">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Solved</p>
                <div className="text-4xl font-black text-slate-800 dark:text-slate-200">{gfgStats.totalSolved}</div>
              </div>
              <div className="w-px h-12 bg-slate-200 dark:bg-slate-800"></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Streak</p>
                <div className="text-4xl font-black text-emerald-500 flex items-baseline gap-1">
                  {gfgStats.streak}
                  <span className="text-sm font-bold text-slate-500">Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      
    </div>
  );
}
