/* eslint-disable */
import { Trophy, Medal } from 'lucide-react';

export default function Leaderboard({ currentUser, leaderboard }) {
  const getRankIcon = (index) => {
    if (index === 0) return <Medal className="w-5 h-5 text-amber-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-slate-500 font-bold text-sm w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 ">
          Global Leaderboard
        </h1>
        <p className="text-slate-500 mt-1">Compare ratings and problem-solving counts with all CP Pulse users globally.</p>
      </div>

      <div>
        {/* Leaderboard Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" /> Active Standings
            </h2>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Sorted by average rating</span>
          </div>

          <div className="bg-[#110e1b] border border-slate-800/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-[#110e1b] text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-5 w-16">Rank</th>
                    <th className="py-4 px-5">Developer</th>
                    <th className="py-4 px-5 text-right">Avg Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leaderboard.map((user, idx) => {
                    const isSelf = user.userId === currentUser._id;
                    
                    return (
                      <tr 
                        key={user.userId} 
                        className={`hover:bg-slate-50 transition-all ${isSelf ? 'bg-brand-indigo/10 font-semibold text-slate-100 border-l-2 border-royal/20' : 'text-slate-400'}`}
                      >
                        <td className="py-4 px-5">
                          <div className="flex justify-center items-center h-full">
                            {getRankIcon(idx)}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex flex-col">
                            <span>{user.username}</span>
                            {isSelf && <span className="text-[10px] text-brand-indigo font-bold">You</span>}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right font-extrabold text-brand-indigo text-sm">
                          {user.averageRating > 0 ? user.averageRating : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
