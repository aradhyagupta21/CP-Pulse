/* eslint-disable */
import { useState } from 'react';
import { Trash2, Plus, Flag, Trophy, } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export default function Goals({ currentUser, goals, onGoalAdd, onGoalDelete }) {
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('All');
  const [targetType, setTargetType] = useState('solved_count');
  const [targetValue, setTargetValue] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !targetValue.trim()) {
      setError('Title and Target Value are required');
      return;
    }

    if (isNaN(targetValue) || Number(targetValue) <= 0) {
      setError('Target Value must be a positive number');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/goals/${currentUser._id}`, {
        title: title.trim(),
        platform,
        targetType,
        targetValue: Number(targetValue)
      });
      onGoalAdd(res.data);
      setTitle('');
      setTargetValue('');
      setPlatform('All');
      setTargetType('solved_count');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create goal');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePercent = (current, target) => {
    if (!target) return 0;
    const pct = (current / target) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  };

  const getPlatformBadge = (plat) => {
    const classes = {
      'Codeforces': 'bg-brand-indigo/10 border-royal/20 text-brand-indigo',
      'CodeChef': 'bg-brand-indigo/10 border-brand-indigo/20 text-slate-100',
      'LeetCode': 'bg-brand-indigo/10 border-royal/20 text-brand-indigo',
      'All': 'bg-slate-50 border-slate-800/80 text-slate-400'
    };
    return classes[plat] || classes.All;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 ">
          Target Goal Setting
        </h1>
        <p className="text-slate-500 mt-1">Configure and monitor your milestones for ratings and total solved counts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Goal Form */}
        <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 h-fit shadow-sm">
          <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-indigo" /> New Coding Goal
          </h2>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-xl text-red-300 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Goal Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reach Specialist on CF"
                className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-xl text-slate-100 outline-none focus:border-royal/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => {
                    setPlatform(e.target.value);
                    if (e.target.value === 'All') setTargetType('solved_count');
                  }}
                  className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-xl text-slate-100 outline-none focus:border-royal/20"
                >
                  <option value="All">All Platforms</option>
                  <option value="Codeforces">Codeforces</option>
                  <option value="CodeChef">CodeChef</option>
                  <option value="LeetCode">LeetCode</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Target Type</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  disabled={platform === 'All'}
                  className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-xl text-slate-100 outline-none focus:border-royal/20 disabled:opacity-40"
                >
                  <option value="solved_count">Solved Count</option>
                  <option value="rating">Rating Target</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Target Value *</label>
              <input
                type="text"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g. 500 or 1400"
                className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-xl text-slate-100 outline-none focus:border-royal/20"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-indigo text-white text-slate-100 py-2.5 rounded-xl font-bold transition hover:opacity-95 disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Creating...' : 'Create Goal'}
            </button>
          </form>
        </div>

        {/* Goals List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-slate-100">Milestone Progress</h2>

          {goals.length === 0 ? (
            <div className="bg-[#110e1b] border border-slate-800/80 p-12 rounded-2xl border border-slate-800/80 text-center text-slate-500 flex flex-col items-center gap-3">
              <Flag className="w-12 h-12 text-slate-400 animate-pulse-slow" />
              <p>No active coding milestones set. Define one in the creation panel!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {goals.map((goal) => {
                const percent = calculatePercent(goal.currentValue, goal.targetValue);
                
                return (
                  <div 
                    key={goal._id} 
                    className={`bg-[#110e1b] border border-slate-800/80 p-5 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden ${goal.isCompleted ? 'border-emerald-500/20' : ''}`}
                  >
                    {/* Highlight complete */}
                    {goal.isCompleted && (
                      <div className="absolute top-0 left-0 h-full w-1.5 bg-emerald-500"></div>
                    )}
                    
                    <div className="space-y-2 w-full sm:max-w-[70%]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${getPlatformBadge(goal.platform)}`}>
                          {goal.platform}
                        </span>
                        <span className="text-slate-500 text-xs font-medium">
                          {goal.targetType === 'rating' ? 'Rating Target' : 'Problems Count'}
                        </span>
                        {goal.isCompleted && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> Complete
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-100">{goal.title}</h3>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${goal.isCompleted ? 'bg-emerald-500' : 'bg-brand-indigo'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs font-semibold text-slate-500">
                          <span>Progress: {goal.currentValue} / {goal.targetValue}</span>
                          <span>{percent}%</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onGoalDelete(goal._id)}
                      className="p-2 border border-slate-800/80 hover:border-red-500/40 text-slate-500 hover:text-red-400 rounded-xl transition self-end sm:self-center"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
