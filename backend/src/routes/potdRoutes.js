import express from 'express';
import axios from 'axios';

const router = express.Router();

// GET /api/potd
// Fetches the live Problem of the Day from LeetCode GraphQL
router.get('/', async (req, res) => {
  try {
    const query = `
      query questionOfToday {
        activeDailyCodingChallengeQuestion {
          date
          link
          question {
            difficulty
            title
            titleSlug
          }
        }
      }
    `;

    const response = await axios.post('https://leetcode.com/graphql', {
      query
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data && response.data.data && response.data.data.activeDailyCodingChallengeQuestion) {
      const potdData = response.data.data.activeDailyCodingChallengeQuestion;
      res.json({
        date: potdData.date,
        link: `https://leetcode.com${potdData.link}`,
        id: potdData.question.titleSlug,
        title: potdData.question.title,
        difficulty: potdData.question.difficulty
      });
    } else {
      res.status(500).json({ error: 'Unexpected response format from LeetCode' });
    }
  } catch (error) {
    console.error('Error fetching POTD:', error.message);
    res.status(500).json({ error: 'Failed to fetch POTD from LeetCode' });
  }
});

// GET /api/potd/gfg
// Fetches the live Problem of the Day from GeeksforGeeks
router.get('/gfg', async (req, res) => {
  try {
    const response = await axios.get('https://practiceapi.geeksforgeeks.org/api/vr/problems-of-day/problem/today/');
    if (response.data && response.data.problem_name) {
      res.json({
        date: response.data.date.split(' ')[0],
        link: response.data.problem_url,
        id: response.data.problem_id.toString(),
        title: response.data.problem_name,
        difficulty: response.data.difficulty
      });
    } else {
      res.status(500).json({ error: 'Unexpected response format from GFG' });
    }
  } catch (error) {
    console.error('Error fetching GFG POTD:', error.message);
    res.status(500).json({ error: 'Failed to fetch POTD from GeeksforGeeks' });
  }
});

import { dbHelper } from '../config/dbHelper.js';

// GET /api/potd/user-stats/:userId
// Automatically fetches LC and GFG POTD streak and total POTD solved count
router.get('/user-stats/:userId', async (req, res) => {
  try {
    const user = await dbHelper.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let lcStats = { streak: 0, totalSolved: 0, todaySolved: false };
    let gfgStats = { streak: 0, totalSolved: 0, todaySolved: false };

    // 1. Fetch LeetCode Streak & Total Active Days automatically
    if (user.leetcodeHandle) {
      try {
        const query = `
          query userStreak($username: String!) {
            matchedUser(username: $username) {
              userCalendar {
                streak
                totalActiveDays
                submissionCalendar
              }
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
          }
        `;
        const lcRes = await axios.post('https://leetcode.com/graphql', {
          query,
          variables: { username: user.leetcodeHandle }
        }, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          timeout: 8000
        });

        const data = lcRes.data?.data?.matchedUser;
        if (data) {
          const calendar = data.userCalendar || {};
          let calendarObj = {};
          try {
            calendarObj = JSON.parse(calendar.submissionCalendar || '{}');
          } catch (_) {}

          const timestamps = Object.keys(calendarObj).map(Number).sort((a, b) => b - a);
          const todayStr = new Date().toISOString().split('T')[0];
          const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

          const activeDates = new Set(
            timestamps.map(ts => new Date(ts * 1000).toISOString().split('T')[0])
          );

          let computedStreak = calendar.streak || 0;
          if (activeDates.has(todayStr) || activeDates.has(yesterdayStr)) {
            let count = 1;
            let check = activeDates.has(todayStr) ? todayStr : yesterdayStr;
            while (true) {
              const prev = new Date(new Date(check).getTime() - 86400000).toISOString().split('T')[0];
              if (activeDates.has(prev)) {
                count++;
                check = prev;
              } else break;
            }
            computedStreak = Math.max(computedStreak, count);
          }

          const totalSolvedCount = calendar.totalActiveDays || activeDates.size || 0;
          const isTodaySolved = activeDates.has(todayStr);

          lcStats = {
            streak: computedStreak,
            totalSolved: totalSolvedCount,
            todaySolved: isTodaySolved
          };
        }
      } catch (lcErr) {
        console.warn('LeetCode automatic streak fetch error:', lcErr.message);
      }
    }

    // 2. Fetch GeeksforGeeks Streak & Total Solved automatically
    const gfgHandle = user.gfgHandle || user.username;
    if (gfgHandle) {
      try {
        const gfgRes = await axios.get(`https://www.geeksforgeeks.org/user/${gfgHandle}/`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: 8000
        }).catch(() => null);

        if (gfgRes?.data) {
          const html = gfgRes.data.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          
          let totalSolved = 0;
          let currentStreak = 0;
          let longestStreak = 0;
          let podCorrectSubmissions = 0;

          const totalSolvedMatch = html.match(/"total_problems_solved"\s*:\s*(\d+)/);
          if (totalSolvedMatch) totalSolved = parseInt(totalSolvedMatch[1], 10);

          const currStreakMatch = html.match(/"pod_solved_current_streak"\s*:\s*(\d+)/);
          if (currStreakMatch) currentStreak = parseInt(currStreakMatch[1], 10);

          const longStreakMatch = html.match(/"pod_solved_longest_streak"\s*:\s*(\d+)/);
          if (longStreakMatch) longestStreak = parseInt(longStreakMatch[1], 10);

          const podSolvedMatch = html.match(/"pod_correct_submissions_count"\s*:\s*(\d+)/);
          if (podSolvedMatch) podCorrectSubmissions = parseInt(podSolvedMatch[1], 10);

          gfgStats = {
            streak: currentStreak || longestStreak || 0,
            totalSolved: podCorrectSubmissions || totalSolved || 0,
            todaySolved: currentStreak > 0
          };
        } else {
          gfgStats = {
            streak: user.gfgStreak || 0,
            totalSolved: user.gfgTotalSolved || 0,
            todaySolved: false
          };
        }
      } catch (gfgErr) {
        console.warn('GFG automatic streak fetch error:', gfgErr.message);
      }
    }

    res.json({
      leetcode: lcStats,
      geeksforgeeks: gfgStats
    });
  } catch (err) {
    console.error('Failed to fetch user potd stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
