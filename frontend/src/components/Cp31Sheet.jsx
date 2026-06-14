import React from 'react';
import { ExternalLink, CheckCircle } from 'lucide-react';

export default function Cp31Sheet() {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-brand-cyan" />
            CP-31 Sheet
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
            This is the CP-31 sheet for Codeforces. Each level contains 31 questions. 
            <span className="text-brand-cyan font-semibold block mt-1">
              After performing 10-15 questions from Codeforces, start solving this!
            </span>
            <span className="text-slate-400 block mt-1">
              (this is the sheet by priyansh, you must login in order to attempt)
            </span>
          </p>
        </div>

        <a
          href="https://www.tle-eliminators.com/cp-sheet"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-2 px-6 py-3 bg-brand-cyan text-blue-950 hover:bg-brand-cyan/90 rounded-xl font-bold transition shadow-lg shadow-brand-cyan/20"
        >
          Solve CP Sheet
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Codeforces Instructions Section */}
      <div className="bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5 mb-5">
          <h2 className="text-xl font-bold text-slate-100">
            Solve problems on Codeforces
          </h2>
          <a
            href="https://codeforces.com/problemset"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-indigo/10 dark:bg-slate-800 hover:bg-brand-indigo/20 dark:hover:bg-slate-700 text-brand-indigo dark:text-slate-100 rounded-xl font-bold transition"
          >
            Go to Problemset
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-brand-cyan uppercase tracking-wider">
            Getting Started Steps
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
              <p className="text-slate-300 text-sm">Make a Codeforces ID.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
              <p className="text-slate-300 text-sm">In the problemset option, choose your difficulty level (e.g. 1200-1200 or 1000-1400).</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
              <p className="text-slate-300 text-sm">Choose <span className="font-semibold text-white">sort by submissions</span> and start solving!</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
