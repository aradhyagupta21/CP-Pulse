import { useState, useEffect } from 'react';
import { Briefcase, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { interviewQuestions } from '../data/interviewQuestions';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export default function InterviewPractice({ currentUser }) {
  const [progress, setProgress] = useState({});
  const [expandedTopic, setExpandedTopic] = useState(null);

  useEffect(() => {
    if (currentUser) {
      axios.get(`${BACKEND_URL}/sheet/${currentUser._id}`)
        .then(res => {
          const p = {};
          res.data.forEach(item => {
            if (item.patternId === 'interview-practice' && item.status === 'Solved') {
              p[item.problemId] = true;
            }
          });
          setProgress(p);
        })
        .catch(console.error);
    }
  }, [currentUser]);

  const toggleQuestion = async (qId, e) => {
    e.stopPropagation();
    if (!currentUser) return;
    
    const isCompleted = progress[qId];
    const newStatus = isCompleted ? 'Unsolved' : 'Solved';
    
    // optimistic update
    setProgress(prev => ({ ...prev, [qId]: !isCompleted }));

    try {
      await axios.post(`${BACKEND_URL}/sheet/update`, {
        userId: currentUser._id,
        problemId: qId,
        patternId: 'interview-practice',
        status: newStatus
      });
    } catch (err) {
      // revert on fail
      setProgress(prev => ({ ...prev, [qId]: isCompleted }));
      console.error(err);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-[#b6d7a8] text-slate-900';
      case 'Medium': return 'bg-[#93c47d] text-slate-900';
      case 'Hard': return 'bg-[#6aa84f] text-slate-900';
      default: return 'bg-slate-200 text-slate-900';
    }
  };

  // Calculate total progress across all topics
  let totalQuestions = 0;
  let completedCount = 0;
  
  Object.keys(interviewQuestions).forEach(topic => {
    interviewQuestions[topic].forEach(q => {
      totalQuestions++;
      if (progress[q.id]) completedCount++;
    });
  });

  const percentage = totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-brand-indigo" />
            Interview Practice
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl text-sm">
            Topic-wise curated questions for technical interview preparation based on Apna College's DSA Sheet.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Overall Progress</span>
          <span className="text-brand-indigo font-bold">{completedCount} / {totalQuestions} ({percentage}%)</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-indigo transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Topics Accordion */}
      <div className="space-y-4">
        {Object.keys(interviewQuestions).map((topic, idx) => {
          const questions = interviewQuestions[topic];
          const isExpanded = expandedTopic === topic;
          
          const topicCompletedCount = questions.filter(q => progress[q.id]).length;
          const topicPercentage = Math.round((topicCompletedCount / questions.length) * 100) || 0;

          return (
            <div key={idx} className="bg-white dark:bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-brand-indigo/30">
              
              {/* Topic Header */}
              <div 
                className="flex items-center justify-between p-5 cursor-pointer"
                onClick={() => setExpandedTopic(isExpanded ? null : topic)}
              >
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{topic}</h3>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="w-full max-w-[200px] h-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-indigo transition-all duration-300"
                        style={{ width: `${topicPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{topicCompletedCount}/{questions.length}</span>
                  </div>
                </div>
                <div className="shrink-0 ml-4 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-slate-400">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {/* Questions List */}
              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/50 bg-slate-50/50 dark:bg-[#110e1b]/50">
                  {questions.map((q, qIdx) => {
                    const isCompleted = !!progress[q.id];
                    return (
                      <div 
                        key={q.id}
                        onClick={(e) => toggleQuestion(q.id, e)}
                        className={`flex items-center gap-4 p-4 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors ${isCompleted ? 'bg-brand-indigo/5 dark:bg-brand-indigo/5' : ''}`}
                      >
                        <div className="shrink-0">
                          {isCompleted ? (
                            <CheckSquare className="w-6 h-6 text-brand-indigo" />
                          ) : (
                            <Square className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <span className={`text-sm font-semibold transition-colors ${isCompleted ? 'text-brand-indigo line-through opacity-70' : 'text-slate-700 dark:text-slate-200'}`}>
                            {qIdx + 1}. {q.title}
                          </span>
                          <div className="flex items-center gap-2 ml-2 opacity-60 hover:opacity-100 transition-opacity">
                            {q.lcLink && (
                              <a 
                                href={q.lcLink}
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-amber-600 dark:text-amber-500 hover:bg-amber-500/20 bg-amber-500/10 transition-colors flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded"
                                title="Open on LeetCode"
                              >
                                LC
                              </a>
                            )}
                            {q.gfgLink && (
                              <a 
                                href={q.gfgLink}
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/20 bg-emerald-500/10 transition-colors flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded"
                                title="Open on GeeksForGeeks"
                              >
                                GFG
                              </a>
                            )}
                            {q.otherLink && (
                              <a 
                                href={q.otherLink}
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-brand-indigo hover:bg-brand-indigo/20 bg-brand-indigo/10 transition-colors flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded"
                                title="Open Link"
                              >
                                LINK
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm ${getDifficultyColor(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
