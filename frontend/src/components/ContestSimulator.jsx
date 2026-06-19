/* eslint-disable */
import { useState, useEffect } from 'react';
import { Target, Terminal, Play, CheckCircle2, TrendingUp, Trophy, Clock, RotateCcw, History } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export default function ContestSimulator({ currentUser }) {
  const [customRating, setCustomRating] = useState(1200);
  const [questionCount, setQuestionCount] = useState(4);
  const [activeContest, setActiveContest] = useState(null);
  const [results, setResults] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  
  // Timer state
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const fetchRecords = async () => {
    if (!currentUser?._id) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/simulator/records/${currentUser._id}`);
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to fetch records', err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentUser]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.get(`${BACKEND_URL}/simulator/generate?targetRating=${customRating}&questionCount=${questionCount}&division=Custom`);
      const contest = res.data;
      
      setActiveContest(contest);
      setResults(contest.problems.map(p => ({
        letter: p.letter,
        solved: false,
        timeMinutes: '',
        penaltyCount: 0
      })));
      setEvaluation(null);
      setTimeElapsed(0);
      setIsTimerRunning(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate contest');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultChange = (index, field, value) => {
    const newResults = [...results];
    newResults[index][field] = value;
    setResults(newResults);
  };

  const markSolvedNow = (index) => {
    const newResults = [...results];
    newResults[index].solved = true;
    // Set time in minutes based on elapsed timer (min 1)
    newResults[index].timeMinutes = Math.max(1, Math.round(timeElapsed / 60));
    setResults(newResults);
  };

  const handleEvaluate = async () => {
    setIsLoading(true);
    setError('');
    setIsTimerRunning(false);
    
    // Ensure numeric values
    const cleanResults = results.map(r => ({
      ...r,
      timeMinutes: parseInt(r.timeMinutes || 0, 10),
      penaltyCount: parseInt(r.penaltyCount || 0, 10)
    }));

    try {
      const res = await axios.post(`${BACKEND_URL}/simulator/evaluate`, {
        targetRating: activeContest.targetRating,
        division: activeContest.division || 'Custom',
        userId: currentUser?._id,
        results: cleanResults
      });
      setEvaluation(res.data);
      fetchRecords(); // Refresh records immediately
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to evaluate performance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setActiveContest(null);
    setEvaluation(null);
    setResults([]);
    setTimeElapsed(0);
    setIsTimerRunning(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-100  flex items-center gap-3">
          <Terminal className="w-8 h-8 text-brand-indigo" />
          Virtual Contest Simulator
        </h1>
        <p className="text-slate-500 mt-1">Generate a custom realistic Codeforces contest and evaluate your performance.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Stage 1: Setup */}
      {!activeContest && !evaluation && (
        <div className="bg-[#110e1b] border border-slate-800/80 p-8 rounded-2xl border border-slate-800/80 shadow-sm max-w-xl mx-auto mt-12 text-center space-y-6">
          <Target className="w-16 h-16 text-brand-indigo mx-auto animate-bounce-slow" />
          <h2 className="text-2xl font-bold text-slate-100">Configure Your Contest</h2>
          <p className="text-slate-500 text-sm">Select your target rating and the number of questions to generate a custom uniform-difficulty contest.</p>
          
          <div className="space-y-6 text-left">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Target Rating</label>
              <input 
                type="number" 
                min="800" 
                max="3500" 
                step="100"
                value={customRating}
                onChange={(e) => setCustomRating(e.target.value)}
                className="w-full bg-[#110e1b] border border-slate-800/80 px-4 py-3 rounded-xl text-slate-100 focus:border-brand-indigo outline-none transition"
              />
              {(customRating < 800 || customRating > 3500) && (
                <p className="text-red-400 text-xs mt-2 font-medium">Warning: Problem levels below 800 or above 3500 are not supported and may result in errors.</p>
              )}
            </div>
            
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between mb-2">
                <span>Number of Questions</span>
                <span className="text-brand-indigo font-bold">{questionCount}</span>
              </label>
              <input 
                type="range" 
                min="3" 
                max="8" 
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="w-full accent-brand-indigo cursor-pointer"
              />
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-brand-indigo text-white hover:opacity-95 text-slate-100 px-6 py-3 rounded-xl font-bold transition disabled:opacity-50"
          >
            {isLoading ? (
              <RotateCcw className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5 fill-current" />
            )}
            {isLoading ? 'Generating...' : 'Start Virtual Contest'}
          </button>
        </div>
      )}

      {/* Stage 1.5: Records Display */}
      {!activeContest && !evaluation && currentUser && (
        <div className="bg-[#110e1b] border border-slate-800/80 p-8 rounded-2xl border border-slate-800/80 max-w-xl mx-auto mt-6">
          <div className="flex items-center gap-3 mb-6">
            <History className="w-6 h-6 text-slate-100" />
            <h2 className="text-xl font-bold text-slate-100">Simulation Records</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#110e1b] p-4 rounded-xl border border-slate-800/80">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Contests</p>
              <p className="text-3xl font-extrabold text-slate-100 mt-1">{records.length}</p>
            </div>
            <div className="bg-[#110e1b] p-4 rounded-xl border border-slate-800/80">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Solved</p>
              <p className="text-3xl font-extrabold text-brand-indigo mt-1">
                {records.reduce((acc, r) => acc + (r.solvedCount || 0), 0)}
              </p>
            </div>
          </div>
          
          {records.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {records.slice(0, 5).map(r => (
                <div key={r._id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-sm font-bold text-slate-100">{r.division}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <span className="text-slate-400">Solved: {r.solvedCount}</span>
                    <span className={r.predictedRatingChange >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {r.predictedRatingChange > 0 ? '+' : ''}{r.predictedRatingChange}
                    </span>
                  </div>
                </div>
              ))}
              {records.length > 5 && (
                <p className="text-center text-xs text-slate-500 pt-2">+ {records.length - 5} more history logs</p>
              )}
            </div>
          )}
          {records.length === 0 && (
            <p className="text-center text-sm text-slate-500">No simulated contests taken yet.</p>
          )}
        </div>
      )}

      {/* Stage 2: Active Contest */}
      {activeContest && !evaluation && (
        <div className="space-y-6">
          <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-royal/20 bg-brand-indigo/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Virtual Contest: Target {activeContest.targetRating}</h2>
              <p className="text-sm text-brand-indigo font-medium mt-1">Generated {activeContest.problems.length} custom problems.</p>
            </div>
            <div className="flex items-center gap-4 bg-[#110e1b] border border-slate-800/80 px-6 py-3 rounded-xl">
              <Clock className={`w-6 h-6 ${isTimerRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-3xl font-mono font-bold text-slate-100">{formatTime(timeElapsed)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeContest.problems.map((prob, index) => (
              <div key={prob.letter} className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-slate-100 w-6">{prob.letter}</span>
                    <a href={prob.url} target="_blank" rel="noreferrer" className="text-lg font-bold text-slate-100 hover:text-brand-indigo transition line-clamp-1">
                      {prob.name}
                    </a>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-800/80 font-medium">*{prob.rating}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-9">
                    {prob.tags.slice(0, 4).map(t => (
                      <span key={t} className="text-[10px] text-slate-500 uppercase font-semibold">{t}</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto bg-[#110e1b] p-4 rounded-xl border border-slate-800/80">
                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={results[index].solved}
                      onChange={(e) => handleResultChange(index, 'solved', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-800/80 text-brand-indigo accent-brand-cyan cursor-pointer"
                    />
                    <span className={`text-sm font-bold ${results[index].solved ? 'text-emerald-400' : 'text-slate-500'}`}>Solved</span>
                  </label>

                  {results[index].solved && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 uppercase font-semibold">Time (m):</span>
                        <input 
                          type="number" min="1" max="300"
                          value={results[index].timeMinutes}
                          onChange={(e) => handleResultChange(index, 'timeMinutes', e.target.value)}
                          className="w-16 bg-slate-50 border border-slate-800/80 rounded px-2 py-1 text-sm text-slate-100 text-center outline-none"
                          placeholder="e.g. 12"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 uppercase font-semibold">Penalties:</span>
                        <input 
                          type="number" min="0" max="20"
                          value={results[index].penaltyCount}
                          onChange={(e) => handleResultChange(index, 'penaltyCount', e.target.value)}
                          className="w-16 bg-slate-50 border border-slate-800/80 rounded px-2 py-1 text-sm text-slate-100 text-center outline-none"
                          placeholder="e.g. 1"
                        />
                      </div>
                    </>
                  )}

                  {!results[index].solved && (
                    <button 
                      onClick={() => markSolvedNow(index)}
                      className="text-xs font-bold text-brand-indigo hover:text-brand-indigo transition px-3 py-1.5 border border-royal/20 hover:border-royal/20 rounded-lg"
                    >
                      Mark Solved Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button 
              onClick={handleReset}
              className="px-6 py-3 rounded-xl border border-slate-800/80 text-slate-500 font-bold hover:text-brand-indigo hover:bg-slate-50 transition"
            >
              Abort Contest
            </button>
            <button 
              onClick={handleEvaluate}
              disabled={isLoading}
              className="px-8 py-3 bg-emerald-500 rounded-xl text-slate-100 font-bold hover:opacity-95 transition flex items-center gap-2"
            >
              {isLoading ? <RotateCcw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Finish & Evaluate
            </button>
          </div>
        </div>
      )}

      {/* Stage 3: Results */}
      {evaluation && (
        <div className="space-y-6">
          <div className="bg-[#110e1b] border border-slate-800/80 p-8 rounded-2xl bg-dark-900 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-indigo/10 rounded-full blur-3xl"></div>
            
            <Trophy className="w-20 h-20 text-slate-100 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
            
            <h2 className="text-3xl font-extrabold text-slate-100 mb-2">Contest Evaluation Complete</h2>
            <p className="text-slate-500 font-medium max-w-lg mx-auto">Based on your solution speeds, penalties, and target difficulty curve, here is your estimated performance:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-10">
              <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 bg-slate-50/40 shadow-sm relative z-10">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estimated Rank</p>
                <div className="text-4xl font-black text-slate-100">#{evaluation.estimatedRank.toLocaleString()}</div>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">Out of ~20,000</p>
              </div>
              
              <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 bg-slate-50/40 shadow-sm relative z-10">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rating Change</p>
                <div className={`text-4xl font-black flex items-center justify-center gap-1 ${evaluation.predictedRatingChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {evaluation.predictedRatingChange >= 0 ? '+' : ''}{evaluation.predictedRatingChange}
                  {evaluation.predictedRatingChange >= 0 ? <TrendingUp className="w-6 h-6 ml-2" /> : <TrendingUp className="w-6 h-6 ml-2 rotate-180" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">Performance: {evaluation.performanceRating}</p>
              </div>

              <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 bg-slate-50/40 shadow-sm relative z-10">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Score</p>
                <div className="text-4xl font-black text-brand-indigo">{evaluation.totalScore}</div>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">Points earned</p>
              </div>
            </div>

            <button 
              onClick={handleReset}
              className="mt-10 px-8 py-3 rounded-xl border border-slate-600 bg-slate-50 hover:bg-slate-700/50 text-slate-100 font-bold transition flex items-center gap-2 mx-auto relative z-10"
            >
              <RotateCcw className="w-5 h-5" /> Start New Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
