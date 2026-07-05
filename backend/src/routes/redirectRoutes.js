import express from 'express';
import googleIt from 'google-it';

const router = express.Router();

router.get('/', async (req, res) => {
  const { q, platform } = req.query;

  if (!q || !platform) {
    return res.status(400).send('Missing query parameters');
  }

  let searchQuery = '';
  let defaultUrl = '';

  if (platform === 'lc') {
    searchQuery = `site:leetcode.com/problems ${q}`;
    defaultUrl = `https://leetcode.com/problemset/all/?search=${encodeURIComponent(q)}`;
  } else if (platform === 'gfg') {
    searchQuery = `site:practice.geeksforgeeks.org/problems ${q}`;
    defaultUrl = `https://www.geeksforgeeks.org/explore?page=1&sortBy=submissions&q=${encodeURIComponent(q)}`;
  } else {
    return res.status(400).send('Invalid platform');
  }

  try {
    const results = await googleIt({ query: searchQuery, disableConsole: true, limit: 3 });
    if (results && results.length > 0) {
      // Find the best match link
      let valid = null;
      if (platform === 'lc') {
        valid = results.find(r => r.link && r.link.includes('leetcode.com/problems/'));
      } else {
        valid = results.find(r => r.link && r.link.includes('practice.geeksforgeeks.org/problems/'));
      }

      if (valid) {
        return res.redirect(valid.link);
      }
    }
  } catch (error) {
    console.error('[Redirect] Google search failed:', error.message);
  }

  // Fallback to the platform's search page if the google search fails or finds no exact match
  return res.redirect(defaultUrl);
});

export default router;
