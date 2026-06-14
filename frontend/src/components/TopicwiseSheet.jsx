import React from 'react';
import { ExternalLink, Layers } from 'lucide-react';

const topicsData = [
  { name: "Array", count: 2189 },
  { name: "String", count: 878 },
  { name: "Hash Table", count: 823 },
  { name: "Math", count: 681 },
  { name: "Dynamic Programming", count: 663 },
  { name: "Sorting", count: 525 },
  { name: "Greedy", count: 468 },
  { name: "Depth-First Search", count: 343 },
  { name: "Binary Search", count: 342 },
  { name: "Database", count: 310 },
  { name: "Bit Manipulation", count: 287 },
  { name: "Matrix", count: 277 },
  { name: "Tree", count: 264 },
  { name: "Breadth-First Search", count: 259 },
  { name: "Prefix Sum", count: 258 },
  { name: "Two Pointers", count: 254 },
  { name: "Heap (Priority Queue)", count: 217 },
  { name: "Simulation", count: 211 },
  { name: "Counting", count: 206 },
  { name: "Graph Theory", count: 185 },
  { name: "Binary Tree", count: 180 },
  { name: "Stack", count: 179 },
  { name: "Sliding Window", count: 167 },
  { name: "Enumeration", count: 152 },
  { name: "Design", count: 136 },
  { name: "Backtracking", count: 114 },
  { name: "Number Theory", count: 99 },
  { name: "Union-Find", count: 99 },
  { name: "Linked List", count: 82 },
  { name: "Segment Tree", count: 80 },
  { name: "Ordered Set", count: 79 },
  { name: "Monotonic Stack", count: 73 },
  { name: "Divide and Conquer", count: 67 },
  { name: "Combinatorics", count: 62 },
  { name: "Trie", count: 61 },
  { name: "Queue", count: 57 },
  { name: "Bitmask", count: 55 },
  { name: "Recursion", count: 51 },
  { name: "Geometry", count: 46 },
  { name: "Binary Indexed Tree", count: 44 },
  { name: "Hash Function", count: 43 },
  { name: "Memoization", count: 43 },
  { name: "Binary Search Tree", count: 43 },
  { name: "Topological Sort", count: 40 },
  { name: "Shortest Path", count: 39 },
  { name: "String Matching", count: 37 },
  { name: "Rolling Hash", count: 33 },
  { name: "Game Theory", count: 30 },
  { name: "Monotonic Queue", count: 25 },
  { name: "Interactive", count: 25 },
  { name: "Data Stream", count: 24 },
  { name: "Brainteaser", count: 21 },
  { name: "Doubly-Linked List", count: 15 },
  { name: "Merge Sort", count: 15 },
  { name: "Randomized", count: 12 },
  { name: "Counting Sort", count: 11 },
  { name: "Iterator", count: 9 },
  { name: "Concurrency", count: 9 },
  { name: "Quickselect", count: 8 },
  { name: "Suffix Array", count: 8 },
  { name: "Sweep Line", count: 8 },
  { name: "Probability and Statistics", count: 7 },
  { name: "Minimum Spanning Tree", count: 6 },
  { name: "Bucket Sort", count: 6 },
  { name: "Shell", count: 4 },
  { name: "Reservoir Sampling", count: 4 },
  { name: "Eulerian Circuit", count: 3 },
  { name: "Radix Sort", count: 3 },
  { name: "Strongly Connected Component", count: 2 },
  { name: "Rejection Sampling", count: 2 }
];

export default function TopicwiseSheet() {
  // Helper to construct LeetCode URL
  const getLeetCodeUrl = (topicName) => {
    // Basic normalization: lowercase, spaces to hyphens, remove parentheses
    const normalized = topicName
      .toLowerCase()
      .replace(/\s*\([^)]*\)/g, '') // remove parentheticals like (Priority Queue)
      .trim()
      .replace(/\s+/g, '-');
    return `https://leetcode.com/tag/${normalized}/`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <Layers className="w-8 h-8 text-brand-indigo" />
            Topicwise Practice Problems
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl text-sm">
            Topic-wise practice problems for LeetCode. 
            Tap any card below to redirect to the specific topic and start practicing immediately!
          </p>
        </div>
      </div>

      {/* Grid container with 4 columns per row on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {topicsData.map((topic, idx) => (
          <a
            key={idx}
            href={getLeetCodeUrl(topic.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between p-5 bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 hover:border-brand-indigo/50 hover:shadow-lg hover:shadow-brand-indigo/10 rounded-2xl transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-slate-100 group-hover:text-brand-indigo transition-colors line-clamp-1">
                {topic.name}
              </h3>
              <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-brand-indigo transition-colors shrink-0" />
            </div>
            
            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Problems
              </span>
              <span className="px-2.5 py-1 bg-brand-indigo/10 dark:bg-slate-800/50 rounded-lg text-xs font-bold text-brand-indigo">
                {topic.count.toLocaleString()}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
