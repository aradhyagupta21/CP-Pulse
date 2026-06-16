/* eslint-disable */
import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Clock, RefreshCw, Filter } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const PLATFORM_COLORS = {
  Codeforces: {
    pill: 'bg-brand-indigo/10 border-royal/20 text-brand-indigo',
    tab: 'from-brand-indigo to-blue-600',
    glow: 'border-royal/20',
    dot: 'bg-brand-indigo/10'
  },
  CodeChef: {
    pill: 'bg-brand-indigo/10 border-brand-indigo/20 text-slate-100',
    tab: 'from-brand-purple to-violet-600',
    glow: 'border-brand-indigo/20',
    dot: 'bg-brand-indigo/10'
  },
  LeetCode: {
    pill: 'bg-brand-indigo/10 border-royal/20 text-brand-indigo',
    tab: 'from-brand-cyan to-teal-500',
    glow: 'border-royal/20',
    dot: 'bg-brand-indigo/10'
  }
};

export default function ContestTracker({ stats, currentUser }) {
  const [allUpcoming, setAllUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('synced');
  const [refreshKey, setRefreshKey] = useState(0);

  // Detect which platforms the current user has linked
  const linkedPlatforms = [];
  if (currentUser?.codeforcesHandle) linkedPlatforms.push('Codeforces');
  if (currentUser?.codechefHandle) linkedPlatforms.push('CodeChef');
  if (currentUser?.leetcodeHandle) linkedPlatforms.push('LeetCode');

  const fetchContests = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await axios.get(`${BACKEND_URL}/contests/upcoming`, { timeout: 8000 });
      if (res.data && Array.isArray(res.data)) {
        const parsed = res.data.map(c => ({
          ...c,
          startTime: new Date(c.startTime)
        }));
        setAllUpcoming(parsed);
      }
    } catch (e) {
      console.warn('Backend contest proxy failed, falling back to direct Codeforces API...', e.message);
      setErr('Could not load live schedules. Showing available data.');
      // Minimal fallback: pull CF only
      try {
        const cfRes = await axios.get('https://codeforces.com/api/contest.list?gym=false', { timeout: 5000 });
        if (cfRes.data?.status === 'OK') {
          const upcoming = cfRes.data.result
            .filter(c => c.phase === 'BEFORE')
            .map(c => {
              const h = c.durationSeconds / 3600;
              return {
                id: `cf-${c.id}`,
                name: c.name,
                platform: 'Codeforces',
                startTime: new Date(c.startTimeSeconds * 1000),
                duration: Number.isInteger(h) ? `${h} hrs` : `${h.toFixed(1)} hrs`,
                link: `https://codeforces.com/contest/${c.id}`
              };
            });
          setAllUpcoming(upcoming);
        }
      } catch (_) {
        setErr('Failed to load contest schedules. Check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  // Apply platform and time filter
  const getFilteredContests = () => {
    const limit15DaysMs = 15 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // 1. Apply platform filter
    let result = allUpcoming;
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'synced') {
        if (linkedPlatforms.length > 0) {
          result = allUpcoming.filter(c => linkedPlatforms.includes(c.platform));
        }
      } else {
        result = allUpcoming.filter(c => c.platform === selectedFilter);
      }
    }

    // 2. Filter up to future 15 days
    return result.filter(c => (c.startTime.getTime() - now) <= limit15DaysMs);
  };

  const filtered = getFilteredContests();

  const formatDateTime = (date) => {
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntil = (date) => {
    const diff = date - Date.now();
    if (diff <= 0) return 'Starting now';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${mins}m`;
    return `in ${mins}m`;
  };

  // Compile full contest history across stats
  const getFullHistory = () => {
    let history = [];
    stats.forEach(s => {
      if (s.ratingHistory) {
        const platformHistory = s.ratingHistory.map(h => ({ ...h, platform: s.platform }));
        history = [...history, ...platformHistory];
      }
    });
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const history = getFullHistory();

  // Removed Predictor logic

  const filterTabs = [
    {
      id: 'synced',
      label: `My Syncs${linkedPlatforms.length > 0 ? ` (${linkedPlatforms.length})` : ''}`,
      activeClass: 'bg-brand-indigo text-white text-slate-100 shadow-md shadow-brand-indigo/10'
    },
    { id: 'all', label: 'All Platforms', activeClass: 'bg-slate-600 text-slate-100' },
    { id: 'Codeforces', label: 'Codeforces', activeClass: 'bg-brand-indigo text-slate-100' },
    { id: 'CodeChef', label: 'CodeChef', activeClass: 'bg-brand-purple text-slate-100' },
    { id: 'LeetCode', label: 'LeetCode', activeClass: 'bg-brand-cyan text-slate-900' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 ">
          Contests
        </h1>
        <p className="text-slate-500 mt-1">Live schedules synced from Codeforces, CodeChef & LeetCode.</p>
      </div>



      {/* Upcoming Contests */}
      <div className="space-y-4">
        {/* Section Header + Refresh */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-indigo" /> Upcoming Schedules
          </h2>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#110e1b] border border-slate-800/80 border border-slate-800/80 text-slate-500 hover:text-brand-indigo hover:border-royal/20 transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Platform Filter Pills */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
                selectedFilter === tab.id
                  ? `${tab.activeClass} border-transparent shadow-sm`
                  : 'bg-slate-50 border-slate-800/80 text-slate-500 hover:text-brand-indigo hover:bg-slate-700/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notice when no handles linked */}
        {selectedFilter === 'synced' && linkedPlatforms.length === 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs font-medium">
            No platform handles linked yet. Showing all platforms. Head to <strong>Dashboard → Configure Handles</strong> to link your profiles.
          </div>
        )}

        {err && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-xs font-medium">
            {err}
          </div>
        )}

        {/* Contest Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#110e1b] border border-slate-800/80 p-4 rounded-2xl border border-slate-800/80 animate-pulse">
                <div className="flex justify-between items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-700/50 rounded-full w-24"></div>
                    <div className="h-5 bg-slate-700/50 rounded-full w-3/4"></div>
                  </div>
                  <div className="space-y-2 text-right shrink-0">
                    <div className="h-4 bg-slate-700/50 rounded-full w-20"></div>
                    <div className="h-3 bg-slate-700/50 rounded-full w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#110e1b] border border-slate-800/80 p-12 rounded-2xl text-center text-slate-500 text-sm border border-slate-800/80">
            No upcoming contests found for the selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((c) => {
              const colors = PLATFORM_COLORS[c.platform] || PLATFORM_COLORS.Codeforces;
              const timeUntil = getTimeUntil(c.startTime);
              const isStartingSoon = c.startTime - Date.now() < 3 * 60 * 60 * 1000;
              return (
                <a
                  key={c.id}
                  href={c.link}
                  target="_blank"
                  rel="noreferrer"
                  className={`bg-[#110e1b] border border-slate-800/80 p-4 rounded-2xl border border-slate-800/80 flex justify-between items-center gap-4 hover:${colors.glow} transition-all duration-300 group block`}
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${colors.pill}`}>
                        {c.platform}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded-full">
                        ⏱ {c.duration}
                      </span>
                      {isStartingSoon && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full animate-pulse">
                          SOON
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-100 group-hover:text-brand-indigo transition text-sm leading-snug line-clamp-2">
                      {c.name}
                    </h4>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-xs font-bold text-brand-indigo whitespace-nowrap">
                      {formatDateTime(c.startTime)}
                    </p>
                    <p className={`text-[10px] font-semibold ${isStartingSoon ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {timeUntil}
                    </p>
                    <p className="text-[10px] text-slate-400">Click to register →</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Contest History */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-slate-100" /> Historic Ranks & Rating Shifts
        </h2>

        {history.length === 0 ? (
          <div className="bg-[#110e1b] border border-slate-800/80 p-12 rounded-2xl text-center text-slate-500 text-sm border border-slate-800/80">
            No historic contest data linked yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
            {history.map((c, idx) => {
              const colors = PLATFORM_COLORS[c.platform] || PLATFORM_COLORS.Codeforces;
              return (
                <div
                  key={idx}
                  className="bg-[#110e1b] border border-slate-800/80 p-4 rounded-2xl border border-slate-800/80 flex justify-between items-center gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${colors.pill}`}>
                      {c.platform}
                    </span>
                    <h4 className="font-bold text-slate-100 text-sm line-clamp-1">{c.contestName}</h4>
                    <p className="text-[10px] text-slate-500">{new Date(c.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-100">Rank: #{c.rank}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-500 font-semibold">Rating: {c.rating}</span>
                      {c.ratingChange !== undefined && (
                        <span className={`text-[10px] font-bold ${c.ratingChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ({c.ratingChange >= 0 ? `+${c.ratingChange}` : c.ratingChange})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
