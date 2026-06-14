import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, CheckCircle2, ExternalLink, Flame, Search, ChevronRight, Zap } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000/api';

export default function Potd({ currentUser }) {
  const [liveLcPotd, setLiveLcPotd] = useState(null);
  const [liveGfgPotd, setLiveGfgPotd] = useState(null);
  
  const [progress, setProgress] = useState({});
  const [lcPotdProgress, setLcPotdProgress] = useState([]);
  const [gfgPotdProgress, setGfgPotdProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch Live POTDs
      Promise.allSettled([
        axios.get(`${BACKEND_URL}/potd`),
        axios.get(`${BACKEND_URL}/potd/gfg`)
      ]).then((results) => {
        if (results[0].status === 'fulfilled') setLiveLcPotd(results[0].value.data);
        else console.error('Failed to fetch LeetCode POTD', results[0].reason);
        
        if (results[1].status === 'fulfilled') setLiveGfgPotd(results[1].value.data);
        else console.error('Failed to fetch GFG POTD', results[1].reason);
      });

      // Fetch user progress
      if (currentUser?._id) {
        try {
          const res = await axios.get(`${BACKEND_URL}/sheet/${currentUser._id}`);
          const progressMap = {};
          const lcProg = [];
          const gfgProg = [];
          
          res.data.forEach(item => {
            progressMap[item.problemId] = item.status;
            if (item.status === 'solved') {
              if (item.patternId === 'potd') lcProg.push(item);
              if (item.patternId === 'gfg_potd') gfgProg.push(item);
            }
          });
          setProgress(progressMap);
          setLcPotdProgress(lcProg);
          setGfgPotdProgress(gfgProg);
        } catch (err) {
          console.error('Failed to load sheet progress:', err);
        }
      }
      setIsLoading(false);
    };
    fetchData();
  }, [currentUser]);

  const toggleStatus = async (problemId, patternId) => {
    if (!currentUser?._id) return;
    const currentStatus = progress[problemId];
    const newStatus = currentStatus === 'solved' ? 'unsolved' : 'solved';

    setProgress(prev => ({ ...prev, [problemId]: newStatus }));

    try {
      const res = await axios.post(`${BACKEND_URL}/sheet/update`, {
        userId: currentUser._id,
        problemId,
        patternId,
        status: newStatus
      });
      
      if (patternId === 'potd') {
        if (newStatus === 'solved') setLcPotdProgress(prev => [...prev, res.data]);
        else setLcPotdProgress(prev => prev.filter(p => p.problemId !== problemId));
      } else if (patternId === 'gfg_potd') {
        if (newStatus === 'solved') setGfgPotdProgress(prev => [...prev, res.data]);
        else setGfgPotdProgress(prev => prev.filter(p => p.problemId !== problemId));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      // Revert optimistic update
      setProgress(prev => ({ ...prev, [problemId]: currentStatus }));
    }
  };

  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 'Easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const calculateStreak = (progressArray) => {
    if (progressArray.length === 0) return 0;
    const dates = [...new Set(
      progressArray
        .map(p => p.updatedAt ? new Date(p.updatedAt) : null)
        .filter(d => d && !isNaN(d.valueOf()))
        .map(d => d.toISOString().split('T')[0])
    )].sort();
    if (dates.length === 0) return 0;
    
    let currentStreak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (dates.includes(todayStr) || dates.includes(yesterdayStr)) {
      currentStreak = 1;
      let check = dates.includes(todayStr) ? todayStr : yesterdayStr;
      while (true) {
        const d = new Date(check + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() - 1);
        const prev = d.toISOString().split('T')[0];
        if (dates.includes(prev)) {
          currentStreak++;
          check = prev;
        } else {
          break;
        }
      }
    }
    return currentStreak;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-4 border-brand-indigo border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const isLcSolved = liveLcPotd && progress[liveLcPotd.id] === 'solved';
  const isGfgSolved = liveGfgPotd && progress[liveGfgPotd.id] === 'solved';

  return (
    <div className="animate-fadeIn space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-slate-800/60 mb-8">
        <div>
          <p className="text-[10px] font-bold text-brand-indigo uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Daily Challenge
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Problem of the <span className="text-brand-purple">day</span>
          </h1>
        </div>
      </div>

      {/* Hero Section: Live POTDs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LeetCode POTD */}
        {liveLcPotd && (
          <div className="bg-white dark:bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm dark:shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
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
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
                <a 
                  href={liveLcPotd.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-800 text-blue-950 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2 text-sm"
                >
                  Start Problem <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => toggleStatus(liveLcPotd.id, 'potd')}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border text-sm ${isLcSolved ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-brand-indigo hover:text-white hover:border-brand-indigo'}`}
                >
                  {isLcSolved ? (
                    <> <CheckCircle2 className="w-4 h-4" /> Completed </>
                  ) : (
                    'Mark as Solved'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GeeksForGeeks POTD */}
        {liveGfgPotd && (
          <div className="bg-white dark:bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm dark:shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
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
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
                <a 
                  href={liveGfgPotd.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm"
                >
                  Start Problem <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => toggleStatus(liveGfgPotd.id, 'gfg_potd')}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border text-sm ${isGfgSolved ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'}`}
                >
                  {isGfgSolved ? (
                    <> <CheckCircle2 className="w-4 h-4" /> Completed </>
                  ) : (
                    'Mark as Solved'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Practice Streak Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
        {/* LeetCode Streak */}
        <div className="bg-white dark:bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm dark:shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-brand-indigo/5 opacity-50 pointer-events-none"></div>
          <div className="p-4 bg-brand-indigo/10 rounded-2xl text-brand-indigo mb-6">
            <Flame className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">LeetCode Streak Tracker</h2>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Solved</p>
              <div className="text-4xl font-black text-slate-800 dark:text-slate-200">{lcPotdProgress.length}</div>
            </div>
            <div className="w-px h-12 bg-slate-200 dark:bg-slate-800"></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Streak</p>
              <div className="text-4xl font-black text-brand-purple flex items-baseline gap-1">
                {calculateStreak(lcPotdProgress)}
                <span className="text-sm font-bold text-slate-500">Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* GeeksForGeeks Streak */}
        <div className="bg-white dark:bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm dark:shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/5 opacity-50 pointer-events-none"></div>
          <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 mb-6">
            <Flame className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">GeeksForGeeks Streak Tracker</h2>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Solved</p>
              <div className="text-4xl font-black text-slate-800 dark:text-slate-200">{gfgPotdProgress.length}</div>
            </div>
            <div className="w-px h-12 bg-slate-200 dark:bg-slate-800"></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Streak</p>
              <div className="text-4xl font-black text-emerald-500 flex items-baseline gap-1">
                {calculateStreak(gfgPotdProgress)}
                <span className="text-sm font-bold text-slate-500">Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
