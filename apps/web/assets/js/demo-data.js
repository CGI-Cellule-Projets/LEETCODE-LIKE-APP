(function () {
  const now = Date.now();
  const iso = (offsetMs) => new Date(now + offsetMs).toISOString();

  const problems = [
    {
      problem_id: 1001,
      name: 'Two Sum',
      difficulty_level: 'easy',
      solve_rate: 74.5,
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    },
    {
      problem_id: 1002,
      name: 'Valid Parentheses',
      difficulty_level: 'easy',
      solve_rate: 68.2,
      description: 'Given a string containing just the characters ()[]{} determine if the input string is valid.',
    },
    {
      problem_id: 1003,
      name: 'Longest Substring Without Repeating Characters',
      difficulty_level: 'med',
      solve_rate: 46.1,
      description: 'Given a string s, find the length of the longest substring without repeating characters.',
    },
    {
      problem_id: 1004,
      name: 'Search in Rotated Sorted Array',
      difficulty_level: 'med',
      solve_rate: 41.8,
      description: 'Given a rotated sorted array and a target value, return its index if found else -1.',
    },
    {
      problem_id: 1005,
      name: 'Number of Islands',
      difficulty_level: 'med',
      solve_rate: 52.0,
      description: 'Given an m x n 2D binary grid, count the number of islands.',
    },
    {
      problem_id: 1006,
      name: 'Merge K Sorted Lists',
      difficulty_level: 'hard',
      solve_rate: 35.4,
      description: 'Merge k sorted linked-lists and return it as one sorted list.',
    },
    {
      problem_id: 1008,
      name: 'Coin Change II',
      difficulty_level: 'med',
      solve_rate: 49.3,
      description: 'Return the number of combinations that make up a given amount using provided coin denominations.',
    },
  ];

  const contests = {
    active: [
      {
        contest_id: 2001,
        title: 'Demo Sprint 201',
        start_time: iso(-90 * 60 * 1000),
        end_time: iso(30 * 60 * 1000),
        description: 'Contest actif pour la demo avec leaderboard visible et problemes deja charges.',
      },
    ],
    upcoming: [
      {
        contest_id: 2002,
        title: 'Spring Sprint Warmup',
        start_time: iso(24 * 60 * 60 * 1000),
        end_time: iso(26 * 60 * 60 * 1000),
        description: 'Contest a venir orienté arrays et binary search.',
      },
    ],
    past: [
      {
        contest_id: 2003,
        title: 'Archive Contest 199',
        start_time: iso(-7 * 24 * 60 * 60 * 1000),
        end_time: iso(-7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        description: 'Contest termine disponible en archive avec resultats consultables.',
      },
    ],
  };

  const contestProblems = {
    2001: [
      { problem_id: 1001, name: 'Two Sum', difficulty_level: 'easy', points: 100 },
      { problem_id: 1003, name: 'Longest Substring Without Repeating Characters', difficulty_level: 'med', points: 200 },
      { problem_id: 1005, name: 'Number of Islands', difficulty_level: 'med', points: 350 },
    ],
    2002: [
      { problem_id: 1002, name: 'Valid Parentheses', difficulty_level: 'easy', points: 100 },
      { problem_id: 1004, name: 'Search in Rotated Sorted Array', difficulty_level: 'med', points: 220 },
      { problem_id: 1008, name: 'Coin Change II', difficulty_level: 'med', points: 320 },
    ],
    2003: [
      { problem_id: 1001, name: 'Two Sum', difficulty_level: 'easy', points: 100 },
      { problem_id: 1006, name: 'Merge K Sorted Lists', difficulty_level: 'hard', points: 400 },
      { problem_id: 1008, name: 'Coin Change II', difficulty_level: 'med', points: 250 },
    ],
  };

  const leaderboardEntries = {
    2001: [
      { username: 'nina', score_total: 550, temps_de_resolution: '24:11', rank: 1 },
      { username: 'omar', score_total: 450, temps_de_resolution: '26:40', rank: 2 },
      { username: 'yasmine', score_total: 350, temps_de_resolution: '30:02', rank: 3 },
      { username: 'karim', score_total: 320, temps_de_resolution: '31:10', rank: 4 },
      { username: 'sara', score_total: 250, temps_de_resolution: '34:05', rank: 5 },
      { username: 'ilyas', score_total: 200, temps_de_resolution: '38:12', rank: 6 },
      { username: 'amal', score_total: 100, temps_de_resolution: '42:45', rank: 7 },
      { username: 'younes', score_total: 100, temps_de_resolution: '43:10', rank: 8 },
    ],
  };

  const adminStats = {
    totalProblems: 8,
    totalUsers: 11,
    totalSubmissions: 22,
    systemStatus: 'ONLINE',
  };

  const recentProblems = [
    { problem_id: 1008, name: 'Coin Change II', difficulty_level: 'med', created_at: iso(-2 * 60 * 60 * 1000) },
    { problem_id: 1006, name: 'Merge K Sorted Lists', difficulty_level: 'hard', created_at: iso(-3 * 60 * 60 * 1000) },
    { problem_id: 1005, name: 'Number of Islands', difficulty_level: 'med', created_at: iso(-4 * 60 * 60 * 1000) },
    { problem_id: 1004, name: 'Search in Rotated Sorted Array', difficulty_level: 'med', created_at: iso(-5 * 60 * 60 * 1000) },
    { problem_id: 1003, name: 'Longest Substring Without Repeating Characters', difficulty_level: 'med', created_at: iso(-6 * 60 * 60 * 1000) },
  ];

  window.LLADemoData = {
    problems,
    contests,
    contestProblems,
    leaderboardEntries,
    adminStats,
    recentProblems,
  };
})();