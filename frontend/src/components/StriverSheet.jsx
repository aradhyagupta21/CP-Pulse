/* eslint-disable */
import { useState, useEffect } from 'react';
import { ExternalLink, BookOpen, CheckSquare, Square } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const STRIVER_TOPICS = [
  "Learn the basics",
  "Learn Important Sorting Techniques",
  "Solve Problems on Arrays [Easy -> Medium -> Hard]",
  "Binary Search [1D, 2D Arrays, Search Space]",
  "Strings [Basic and Medium]",
  "Learn LinkedList [Single LL, Double LL, Medium, Hard Problems]",
  "Recursion [PatternWise]",
  "Bit Manipulation [Concepts & Problems]",
  "Stack and Queues [Learning, Pre-In-Post-fix, Monotonic Stack, Implementation]",
  "Sliding Window & Two Pointer Combined Problems",
  "Heaps [Learning, Medium, Hard Problems]",
  "Greedy Algorithms [Easy, Medium/Hard]",
  "Binary Trees [Traversals, Medium and Hard Problems]",
  "Binary Search Trees [Concept and Problems]",
  "Graphs [Concepts & Problems]",
  "Dynamic Programming [Patterns and Problems]",
  "Tries",
  "Strings"
];

export default function StriverSheet({ currentUser }) {
  const [progress, setProgress] = useState({});

  useEffect(() => {
    if (currentUser) {
      axios.get(`${BACKEND_URL}/sheet/${currentUser._id}`)
        .then(res => {
          const p = {};
          res.data.forEach(item => {
            if (item.patternId === 'striver-a2z' && item.status === 'Solved') {
              p[item.problemId] = true;
            }
          });
          setProgress(p);
        })
        .catch(console.error);
    }
  }, [currentUser]);

  const toggleTopic = async (topic) => {
    if (!currentUser) return;
    
    const isCompleted = progress[topic];
    const newStatus = isCompleted ? 'Unsolved' : 'Solved';
    
    // optimistic update
    setProgress(prev => ({ ...prev, [topic]: !isCompleted }));

    try {
      await axios.post(`${BACKEND_URL}/sheet/update`, {
        userId: currentUser._id,
        problemId: topic,
        patternId: 'striver-a2z',
        status: newStatus
      });
    } catch (err) {
      // revert on fail
      setProgress(prev => ({ ...prev, [topic]: isCompleted }));
      console.error(err);
    }
  };

  const completedCount = Object.values(progress).filter(Boolean).length;
  const percentage = Math.round((completedCount / STRIVER_TOPICS.length) * 100) || 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-brand-cyan" />
            Striver's A2Z DSA Series
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
            There is an option to start Striver and learn DSA. One of the best series for your journey. Login and start tracking your progress below!
          </p>
        </div>

        <a
          href="https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-2 px-6 py-3 bg-brand-cyan text-blue-950 hover:bg-brand-cyan/90 rounded-xl font-bold transition shadow-lg shadow-brand-cyan/20"
        >
          Login and Start
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-300 font-semibold text-sm">Completion Progress</span>
          <span className="text-brand-cyan font-bold">{completedCount} / {STRIVER_TOPICS.length} ({percentage}%)</span>
        </div>
        <div className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-cyan transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Topics List */}
      <div className="bg-[#110e1b] border border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-800/50">
          {STRIVER_TOPICS.map((topic, idx) => {
            const isCompleted = !!progress[topic];
            return (
              <div 
                key={idx}
                onClick={() => toggleTopic(topic)}
                className={`flex items-center gap-4 p-4 hover:bg-slate-800/30 cursor-pointer transition-colors ${isCompleted ? 'bg-brand-cyan/5' : ''}`}
              >
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckSquare className="w-6 h-6 text-brand-cyan" />
                  ) : (
                    <Square className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <span className={`text-sm md:text-base font-semibold transition-colors ${isCompleted ? 'text-brand-cyan line-through opacity-70' : 'text-slate-200'}`}>
                    {idx + 1}. {topic}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
