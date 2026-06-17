/* eslint-disable */
import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, ReferenceArea } from 'recharts';
import { BarChart, Bar } from 'recharts';
import { Award, Compass, PieChart as PieIcon, } from 'lucide-react';

export default function Analytics({ stats }) {
  const [selectedPlatform, setSelectedPlatform] = useState('All');

  // Filter platforms options
  const availablePlatforms = ['All', ...stats.map(s => s.platform)];

  // Get aggregated stats
  const getAggregatedData = () => {
    const topicMap = {
      'Arrays': 0, 'Graphs': 0, 'DP': 0, 'Trees': 0, 'Greedy': 0, 'Binary Search': 0, 'Math': 0, 'Strings': 0
    };
    const difficultyMap = { Easy: 0, Medium: 0, Hard: 0 };
    let ratingHistoryCombined = [];

    stats.forEach(s => {
      if (selectedPlatform !== 'All' && s.platform !== selectedPlatform) return;

      // Aggregate topics
      if (s.solvedByTopic) {
        const topics = s.solvedByTopic instanceof Map ? Object.fromEntries(s.solvedByTopic) : s.solvedByTopic;
        Object.keys(topics).forEach(t => {
          if (topicMap[t] !== undefined) {
            topicMap[t] += topics[t] || 0;
          }
        });
      }

      // Aggregate difficulties
      if (s.difficultyDistribution) {
        const diffs = s.difficultyDistribution instanceof Map ? Object.fromEntries(s.difficultyDistribution) : s.difficultyDistribution;
        Object.keys(diffs).forEach(d => {
          if (difficultyMap[d] !== undefined) {
            difficultyMap[d] += diffs[d] || 0;
          }
        });
      }

      // Aggregate history
      if (s.ratingHistory) {
        const history = s.ratingHistory.map(h => ({
          ...h,
          platform: s.platform,
          timestamp: new Date(h.date).getTime(),
          displayDate: new Date(h.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
        }));
        ratingHistoryCombined = [...ratingHistoryCombined, ...history];
      }
    });

    // Format topics for Radar chart
    const radarData = Object.keys(topicMap).map(topic => ({
      subject: topic,
      count: topicMap[topic],
      fullMark: 100
    }));

    // Format difficulties for Pie chart
    const pieData = Object.keys(difficultyMap).map(diff => ({
      name: diff,
      value: difficultyMap[diff]
    })).filter(d => d.value > 0);

    // Format rating history (sorted by date chronologically using timestamp)
    ratingHistoryCombined.sort((a, b) => a.timestamp - b.timestamp);

    return { radarData, pieData, ratingHistory: ratingHistoryCombined };
  };

  const { radarData, pieData, ratingHistory } = getAggregatedData();

  // Color constants for Pie cells
  const COLORS = {
    'Easy': '#00f2fe',
    'Medium': '#4facfe',
    'Hard': '#8a2be2'
  };

  const renderRatingBands = () => {
    if (selectedPlatform === 'Codeforces') {
      return (
        <>
          <ReferenceArea y1={0} y2={1200} fill="rgba(150, 150, 150, 0.1)" isFront={false} />
          <ReferenceArea y1={1200} y2={1400} fill="rgba(0, 200, 0, 0.1)" isFront={false} />
          <ReferenceArea y1={1400} y2={1600} fill="rgba(0, 200, 200, 0.08)" isFront={false} />
          <ReferenceArea y1={1600} y2={1900} fill="rgba(0, 0, 250, 0.08)" isFront={false} />
          <ReferenceArea y1={1900} y2={2100} fill="rgba(180, 0, 180, 0.08)" isFront={false} />
          <ReferenceArea y1={2100} y2={2300} fill="rgba(255, 140, 0, 0.08)" isFront={false} />
          <ReferenceArea y1={2300} y2={4000} fill="rgba(255, 0, 0, 0.08)" isFront={false} />
        </>
      );
    } else if (selectedPlatform === 'CodeChef') {
      return (
        <>
          <ReferenceArea y1={0} y2={1400} fill="rgba(150, 150, 150, 0.1)" isFront={false} />
          <ReferenceArea y1={1400} y2={1600} fill="rgba(0, 200, 0, 0.1)" isFront={false} />
          <ReferenceArea y1={1600} y2={1800} fill="rgba(0, 0, 250, 0.08)" isFront={false} />
          <ReferenceArea y1={1800} y2={2000} fill="rgba(180, 0, 180, 0.08)" isFront={false} />
          <ReferenceArea y1={2000} y2={2200} fill="rgba(255, 215, 0, 0.08)" isFront={false} />
          <ReferenceArea y1={2200} y2={2500} fill="rgba(255, 140, 0, 0.08)" isFront={false} />
          <ReferenceArea y1={2500} y2={4000} fill="rgba(255, 0, 0, 0.08)" isFront={false} />
        </>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 ">
            Rating & DSA Analytics
          </h1>
          <p className="text-slate-500 mt-1">Visualize rating history, difficulty splits, and topic distributions.</p>
        </div>

        {/* Filter Tab */}
        <div className="flex items-center gap-2 bg-[#110e1b] border border-slate-800/80 px-3 py-1.5 rounded-xl self-start">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mr-2">Filter Platform:</span>
          {availablePlatforms.map(plat => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${selectedPlatform === plat ? 'bg-brand-indigo text-white text-slate-100' : 'text-slate-500 hover:text-brand-indigo'}`}
            >
              {plat}
            </button>
          ))}
        </div>
      </div>

      {stats.length === 0 ? (
        <div className="bg-[#110e1b] border border-slate-800/80 p-12 rounded-2xl border border-slate-800/80 text-center text-slate-500">
          Sync your account profiles on the dashboard to populate interactive graphs!
        </div>
      ) : (
        <>
          {/* Rating progression line chart */}
          <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-brand-indigo" />
              <h2 className="text-xl font-bold text-slate-100">Rating Progression Timeline</h2>
            </div>
            
            {ratingHistory.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                No contest rating history available for this selection. Participate in contests to see rating curves!
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ratingHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRating" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#00f2fe" />
                        <stop offset="50%" stopColor="#4facfe" />
                        <stop offset="100%" stopColor="#8a2be2" />
                      </linearGradient>
                    </defs>
                    {renderRatingBands()}
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="timestamp" 
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(tick) => {
                        const d = new Date(tick);
                        const day = String(d.getDate()).padStart(2, '0');
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
                      }}
                      stroke="#64748b" 
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={11} 
                      domain={['auto', 'auto']}
                      tickLine={false}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#110e1b] border border-slate-800/80 p-4 rounded-xl border border-royal/20 shadow-lg text-xs space-y-1">
                              <p className="font-bold text-slate-100">{data.contestName}</p>
                              <p className="text-slate-500">Platform: <span className="font-semibold text-slate-100">{data.platform}</span></p>
                              <p className="text-slate-500">Rating: <span className="text-brand-indigo font-bold text-sm">{data.rating}</span> ({data.ratingChange >= 0 ? `+${data.ratingChange}` : data.ratingChange})</p>
                              <p className="text-slate-500">Rank: <span className="font-semibold text-slate-100">#{data.rank}</span></p>
                              <p className="text-[10px] text-slate-500">{new Date(data.date).toLocaleDateString()}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rating" 
                      stroke="url(#colorRating)" 
                      strokeWidth={3}
                      activeDot={{ r: 8, stroke: '#00f2fe', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Difficulty Pie Split */}
          <div className="grid grid-cols-1 max-w-2xl mx-auto w-full gap-8">

            {/* Difficulty Pie split */}
            <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-2 mb-6">
                <PieIcon className="w-5 h-5 text-slate-100" />
                <h2 className="text-xl font-bold text-slate-100">Difficulty Distribution</h2>
              </div>

              {pieData.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
                  No difficulty data solved on this platform.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-72">
                  <div className="h-56 w-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`${value} Problems`, 'Solved']}
                          contentStyle={{ backgroundColor: 'rgba(11, 17, 32, 0.9)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    {pieData.map((d, i) => {
                      const total = pieData.reduce((sum, item) => sum + item.value, 0);
                      const percent = ((d.value / total) * 100).toFixed(1);
                      return (
                        <div key={d.name} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[d.name] }}
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-100">{d.name}</p>
                            <p className="text-xs text-slate-500">{d.value} Solved ({percent}%)</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
