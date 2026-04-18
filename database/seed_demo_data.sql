-- -----------------------------------------------------
-- Demo Seed Data (idempotent)
-- Run with:
-- psql -U postgres -d coding_platform -f database/seed_demo_data.sql
-- -----------------------------------------------------

BEGIN;

-- -----------------------------------------------------
-- Users (passwords are bcrypt hashes)
-- Demo accounts are seeded for local development only.
-- -----------------------------------------------------
INSERT INTO users (user_id, username, password, email, user_level, is_admin)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', '$2a$10$r85BEwZw4C/XH0NPPwPC0e55uu9nmSjJdM3iChFgfD1YFVh9oBUQu', 'admin@dev.local', 'beginner', TRUE),
  ('00000000-0000-0000-0000-000000000101', 'nina', '$2a$10$NnpdNmaii2ukttH7WLmJx.8djQAM9wPxCTkFCYl.s98fmy4e6Kwoi', 'user1@demo.local', 'intermediate', FALSE),
  ('00000000-0000-0000-0000-000000000102', 'omar', '$2a$10$NnpdNmaii2ukttH7WLmJx.8djQAM9wPxCTkFCYl.s98fmy4e6Kwoi', 'user2@demo.local', 'intermediate', FALSE),
  ('00000000-0000-0000-0000-000000000103', 'yasmine', '$2a$10$NnpdNmaii2ukttH7WLmJx.8djQAM9wPxCTkFCYl.s98fmy4e6Kwoi', 'user3@demo.local', 'advanced', FALSE),
  ('00000000-0000-0000-0000-000000000104', 'karim', '$2a$10$NnpdNmaii2ukttH7WLmJx.8djQAM9wPxCTkFCYl.s98fmy4e6Kwoi', 'user4@demo.local', 'intermediate', FALSE),
  ('00000000-0000-0000-0000-000000000105', 'sara', '$2a$10$NnpdNmaii2ukttH7WLmJx.8djQAM9wPxCTkFCYl.s98fmy4e6Kwoi', 'user5@demo.local', 'beginner', FALSE),
  ('00000000-0000-0000-0000-000000000106', 'ilyas', '$2a$10$NnpdNmaii2ukttH7WLmJx.8djQAM9wPxCTkFCYl.s98fmy4e6Kwoi', 'user6@demo.local', 'intermediate', FALSE),
  ('00000000-0000-0000-0000-000000000107', 'amal', '$2a$10$NnpdNmaii2ukttH7WLmJx.8djQAM9wPxCTkFCYl.s98fmy4e6Kwoi', 'user7@demo.local', 'beginner', FALSE),
  ('00000000-0000-0000-0000-000000000108', 'younes', '$2a$10$NnpdNmaii2ukttH7WLmJx.8djQAM9wPxCTkFCYl.s98fmy4e6Kwoi', 'user8@demo.local', 'advanced', FALSE),
  ('00000000-0000-0000-0000-000000000109', 'lina', '$2a$10$NnpdNmaii2ukttH7WLmJx.8djQAM9wPxCTkFCYl.s98fmy4e6Kwoi', 'user9@demo.local', 'beginner', FALSE),
  ('00000000-0000-0000-0000-000000000110', 'mehdi', '$2a$10$NnpdNmaii2ukttH7WLmJx.8djQAM9wPxCTkFCYl.s98fmy4e6Kwoi', 'user10@demo.local', 'intermediate', FALSE)
ON CONFLICT (email) DO UPDATE
SET
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  email = EXCLUDED.email,
  user_level = EXCLUDED.user_level,
  is_admin = EXCLUDED.is_admin;

-- -----------------------------------------------------
-- Core catalogs
-- -----------------------------------------------------
INSERT INTO topics (topic_id, name)
VALUES
  (1, 'Array'),
  (2, 'Hash Table'),
  (3, 'Two Pointers'),
  (4, 'Binary Search'),
  (5, 'Graph'),
  (6, 'Dynamic Programming')
ON CONFLICT (topic_id) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO languages (language_id, name, version)
VALUES
  (1, 'JavaScript', 'Node 20'),
  (2, 'Python', '3.10'),
  (3, 'C++', '20')
ON CONFLICT (language_id) DO UPDATE
SET
  name = EXCLUDED.name,
  version = EXCLUDED.version;

-- -----------------------------------------------------
-- Problems
-- -----------------------------------------------------
INSERT INTO problems (problem_id, name, difficulty_level, solve_rate, visibility, is_published, description, constraints)
VALUES
  (1001, 'Two Sum', 'easy', 74.50, 'PUBLIC', TRUE,
   'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
   '2 <= nums.length <= 10^4; -10^9 <= nums[i], target <= 10^9'),
  (1002, 'Valid Parentheses', 'easy', 68.20, 'PUBLIC', TRUE,
   'Given a string containing just the characters ()[]{} determine if the input string is valid.',
   '1 <= s.length <= 10^4'),
  (1003, 'Longest Substring Without Repeating Characters', 'med', 46.10, 'PUBLIC', TRUE,
   'Given a string s, find the length of the longest substring without repeating characters.',
   '0 <= s.length <= 5 * 10^4'),
  (1004, 'Search in Rotated Sorted Array', 'med', 41.80, 'PUBLIC', TRUE,
   'Given a rotated sorted array and a target value, return its index if found else -1.',
   '1 <= nums.length <= 5000'),
  (1005, 'Number of Islands', 'med', 52.00, 'PUBLIC', TRUE,
   'Given an m x n 2D binary grid, count the number of islands.',
   '1 <= m, n <= 300'),
  (1006, 'Merge K Sorted Lists', 'hard', 35.40, 'PUBLIC', TRUE,
   'Merge k sorted linked-lists and return it as one sorted list.',
   'k <= 10^4, total nodes <= 10^5'),
  (1007, 'Contest Path Optimizer', 'hard', 28.75, 'CONTEST_ONLY', FALSE,
   'Compute the minimum weighted route under dynamic constraints.',
   'Custom contest constraints'),
  (1008, 'Coin Change II', 'med', 49.30, 'PUBLIC', TRUE,
   'Return the number of combinations that make up a given amount using provided coin denominations.',
   '1 <= amount <= 5000')
ON CONFLICT (problem_id) DO UPDATE
SET
  name = EXCLUDED.name,
  difficulty_level = EXCLUDED.difficulty_level,
  solve_rate = EXCLUDED.solve_rate,
  visibility = EXCLUDED.visibility,
  is_published = EXCLUDED.is_published,
  description = EXCLUDED.description,
  constraints = EXCLUDED.constraints;

-- Reset and reinsert test cases for seeded problems
DELETE FROM test_cases WHERE problem_id BETWEEN 1001 AND 1008;

INSERT INTO test_cases (problem_id, input_data, expected_output, is_hidden)
VALUES
  (1001, 'nums=[2,7,11,15], target=9', '[0,1]', FALSE),
  (1001, 'nums=[3,2,4], target=6', '[1,2]', TRUE),
  (1002, 's="()[]{}"', 'true', FALSE),
  (1002, 's="([)]"', 'false', TRUE),
  (1003, 's="abcabcbb"', '3', FALSE),
  (1003, 's="bbbbb"', '1', TRUE),
  (1004, 'nums=[4,5,6,7,0,1,2], target=0', '4', FALSE),
  (1004, 'nums=[4,5,6,7,0,1,2], target=3', '-1', TRUE),
  (1005, 'grid=[[1,1,0],[0,1,0],[1,0,1]]', '3', FALSE),
  (1005, 'grid=[[1,1,1],[0,1,0],[1,1,1]]', '1', TRUE),
  (1006, 'lists=[[1,4,5],[1,3,4],[2,6]]', '[1,1,2,3,4,4,5,6]', FALSE),
  (1006, 'lists=[]', '[]', TRUE),
  (1007, 'contest-graph-case-a', '17', FALSE),
  (1007, 'contest-graph-case-hidden', '42', TRUE),
  (1008, 'amount=5, coins=[1,2,5]', '4', FALSE),
  (1008, 'amount=3, coins=[2]', '0', TRUE);

-- -----------------------------------------------------
-- Problem mappings
-- -----------------------------------------------------
INSERT INTO problem_topics (problem_id, topic_id)
VALUES
  (1001, 1), (1001, 2),
  (1002, 3),
  (1003, 3),
  (1004, 4),
  (1005, 5),
  (1006, 5),
  (1008, 6)
ON CONFLICT (problem_id, topic_id) DO NOTHING;

INSERT INTO problem_languages (problem_id, language_id, time_limit_ms)
VALUES
  (1001, 1, 2000), (1001, 2, 2000), (1001, 3, 1500),
  (1002, 1, 2000), (1002, 2, 2000), (1002, 3, 1500),
  (1003, 1, 2500), (1003, 2, 2500), (1003, 3, 2000),
  (1004, 1, 2500), (1004, 2, 2500), (1004, 3, 2000),
  (1005, 1, 3000), (1005, 2, 3000), (1005, 3, 2500),
  (1006, 1, 3500), (1006, 2, 3500), (1006, 3, 3000),
  (1007, 1, 3500), (1007, 2, 3500), (1007, 3, 3000),
  (1008, 1, 2500), (1008, 2, 2500), (1008, 3, 2000)
ON CONFLICT (problem_id, language_id) DO UPDATE
SET time_limit_ms = EXCLUDED.time_limit_ms;

INSERT INTO user_topics (user_id, topic_id)
VALUES
  ('00000000-0000-0000-0000-000000000101', 1),
  ('00000000-0000-0000-0000-000000000101', 3),
  ('00000000-0000-0000-0000-000000000102', 2),
  ('00000000-0000-0000-0000-000000000102', 5),
  ('00000000-0000-0000-0000-000000000103', 4),
  ('00000000-0000-0000-0000-000000000103', 6),
  ('00000000-0000-0000-0000-000000000104', 1),
  ('00000000-0000-0000-0000-000000000104', 5),
  ('00000000-0000-0000-0000-000000000105', 2),
  ('00000000-0000-0000-0000-000000000106', 3),
  ('00000000-0000-0000-0000-000000000107', 4),
  ('00000000-0000-0000-0000-000000000108', 6),
  ('00000000-0000-0000-0000-000000000109', 1),
  ('00000000-0000-0000-0000-000000000110', 5)
ON CONFLICT (user_id, topic_id) DO NOTHING;

-- -----------------------------------------------------
-- Contests
-- -----------------------------------------------------
INSERT INTO contests (contest_id, title, start_time, end_time, description)
VALUES
  (2001, 'Demo Sprint 201', NOW() - INTERVAL '90 minutes', NOW() + INTERVAL '30 minutes',
   'Contest actif pour la demo avec leaderboard visible et problemes deja charges.'),
  (2002, 'Spring Sprint Warmup', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 2 hours',
   'Contest a venir orienté arrays et binary search.'),
  (2003, 'Archive Contest 199', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days + 2 hours',
   'Contest termine disponible en archive avec resultats consultables.')
ON CONFLICT (contest_id) DO UPDATE
SET
  title = EXCLUDED.title,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  description = EXCLUDED.description;

INSERT INTO contest_problems (contest_id, problem_id, points)
VALUES
  (2001, 1001, 100), (2001, 1003, 200), (2001, 1005, 350),
  (2002, 1002, 100), (2002, 1004, 220), (2002, 1008, 320),
  (2003, 1001, 100), (2003, 1006, 400), (2003, 1008, 250)
ON CONFLICT (contest_id, problem_id) DO UPDATE
SET points = EXCLUDED.points;

INSERT INTO contest_registrations (user_id, contest_id, registered_at)
VALUES
  ('00000000-0000-0000-0000-000000000101', 2001, NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0000-000000000102', 2001, NOW() - INTERVAL '100 minutes'),
  ('00000000-0000-0000-0000-000000000103', 2001, NOW() - INTERVAL '95 minutes'),
  ('00000000-0000-0000-0000-000000000104', 2001, NOW() - INTERVAL '90 minutes'),
  ('00000000-0000-0000-0000-000000000105', 2001, NOW() - INTERVAL '88 minutes'),
  ('00000000-0000-0000-0000-000000000106', 2001, NOW() - INTERVAL '86 minutes'),
  ('00000000-0000-0000-0000-000000000107', 2001, NOW() - INTERVAL '84 minutes'),
  ('00000000-0000-0000-0000-000000000108', 2001, NOW() - INTERVAL '82 minutes'),
  ('00000000-0000-0000-0000-000000000109', 2001, NOW() - INTERVAL '80 minutes'),
  ('00000000-0000-0000-0000-000000000110', 2001, NOW() - INTERVAL '78 minutes'),
  ('00000000-0000-0000-0000-000000000101', 2002, NOW() - INTERVAL '20 minutes'),
  ('00000000-0000-0000-0000-000000000104', 2002, NOW() - INTERVAL '19 minutes'),
  ('00000000-0000-0000-0000-000000000108', 2002, NOW() - INTERVAL '18 minutes')
ON CONFLICT (user_id, contest_id) DO NOTHING;

-- -----------------------------------------------------
-- Submissions and progress
-- -----------------------------------------------------
INSERT INTO submissions (
  submission_id, user_id, problem_id, language_id, code_body, status, runtime_ms, memory_kb, submitted_at
)
VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 1001, 2,
   'def two_sum(nums, target): ...', 'Accepted', 42, 1800, NOW() - INTERVAL '80 minutes'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000102', 1001, 1,
   'function twoSum(nums, target) { ... }', 'Accepted', 51, 2100, NOW() - INTERVAL '78 minutes'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000103', 1003, 2,
   'def length_of_longest_substring(s): ...', 'Wrong Answer', 0, 0, NOW() - INTERVAL '70 minutes'),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000103', 1003, 2,
   'def length_of_longest_substring(s): ...', 'Accepted', 67, 2400, NOW() - INTERVAL '62 minutes'),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000101', 1005, 3,
   'int numIslands(vector<vector<char>>& grid) { ... }', 'Accepted', 88, 3200, NOW() - INTERVAL '48 minutes'),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000102', 1005, 1,
   'function numIslands(grid) { ... }', 'Runtime Error', 0, 0, NOW() - INTERVAL '45 minutes'),
  ('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000102', 1005, 1,
   'function numIslands(grid) { ... }', 'Accepted', 103, 3500, NOW() - INTERVAL '38 minutes'),
  ('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000103', 1007, 2,
   'def optimize_path(graph): ...', 'Pending', NULL, NULL, NOW() - INTERVAL '5 minutes'),
  ('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000104', 1001, 2,
   'def two_sum(nums, target): ...', 'Accepted', 49, 1900, NOW() - INTERVAL '76 minutes'),
  ('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000104', 1003, 2,
   'def length_of_longest_substring(s): ...', 'Accepted', 72, 2500, NOW() - INTERVAL '55 minutes'),
  ('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000105', 1001, 1,
   'function twoSum(nums, target) { ... }', 'Accepted', 58, 2200, NOW() - INTERVAL '74 minutes'),
  ('30000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000105', 1005, 1,
   'function numIslands(grid) { ... }', 'Wrong Answer', 0, 0, NOW() - INTERVAL '52 minutes'),
  ('30000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000106', 1001, 3,
   'int twoSum(vector<int>& nums, int target) { ... }', 'Accepted', 46, 2050, NOW() - INTERVAL '73 minutes'),
  ('30000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000106', 1003, 3,
   'int lengthOfLongestSubstring(string s) { ... }', 'Accepted', 81, 2700, NOW() - INTERVAL '50 minutes'),
  ('30000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000107', 1001, 2,
   'def two_sum(nums, target): ...', 'Accepted', 63, 2300, NOW() - INTERVAL '71 minutes'),
  ('30000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000107', 1003, 2,
   'def longest_substring(s): ...', 'Runtime Error', 0, 0, NOW() - INTERVAL '49 minutes'),
  ('30000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000108', 1001, 1,
   'function twoSum(nums, target) { ... }', 'Accepted', 41, 1800, NOW() - INTERVAL '70 minutes'),
  ('30000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000108', 1003, 1,
   'function lengthOfLongestSubstring(s) { ... }', 'Accepted', 66, 2450, NOW() - INTERVAL '47 minutes'),
  ('30000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000109', 1001, 2,
   'def two_sum(nums, target): ...', 'Accepted', 69, 2400, NOW() - INTERVAL '69 minutes'),
  ('30000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000109', 1005, 2,
   'def num_islands(grid): ...', 'Accepted', 97, 3300, NOW() - INTERVAL '44 minutes'),
  ('30000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000110', 1001, 3,
   'int twoSum(vector<int>& nums, int target) { ... }', 'Accepted', 55, 2150, NOW() - INTERVAL '68 minutes'),
  ('30000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000110', 1003, 3,
   'int lengthOfLongestSubstring(string s) { ... }', 'Accepted', 79, 2650, NOW() - INTERVAL '43 minutes')
ON CONFLICT (submission_id) DO UPDATE
SET
  status = EXCLUDED.status,
  runtime_ms = EXCLUDED.runtime_ms,
  memory_kb = EXCLUDED.memory_kb,
  submitted_at = EXCLUDED.submitted_at;

INSERT INTO user_problem (user_id, problem_id, status, solve_timestamp)
VALUES
  ('00000000-0000-0000-0000-000000000101', 1001, 'solved', NOW() - INTERVAL '80 minutes'),
  ('00000000-0000-0000-0000-000000000101', 1005, 'solved', NOW() - INTERVAL '48 minutes'),
  ('00000000-0000-0000-0000-000000000102', 1001, 'solved', NOW() - INTERVAL '78 minutes'),
  ('00000000-0000-0000-0000-000000000102', 1005, 'solved', NOW() - INTERVAL '38 minutes'),
  ('00000000-0000-0000-0000-000000000103', 1003, 'solved', NOW() - INTERVAL '62 minutes'),
  ('00000000-0000-0000-0000-000000000103', 1007, 'attempted', NULL),
  ('00000000-0000-0000-0000-000000000104', 1001, 'solved', NOW() - INTERVAL '76 minutes'),
  ('00000000-0000-0000-0000-000000000104', 1003, 'solved', NOW() - INTERVAL '55 minutes'),
  ('00000000-0000-0000-0000-000000000105', 1001, 'solved', NOW() - INTERVAL '74 minutes'),
  ('00000000-0000-0000-0000-000000000105', 1005, 'attempted', NULL),
  ('00000000-0000-0000-0000-000000000106', 1001, 'solved', NOW() - INTERVAL '73 minutes'),
  ('00000000-0000-0000-0000-000000000106', 1003, 'solved', NOW() - INTERVAL '50 minutes'),
  ('00000000-0000-0000-0000-000000000107', 1001, 'solved', NOW() - INTERVAL '71 minutes'),
  ('00000000-0000-0000-0000-000000000107', 1003, 'attempted', NULL),
  ('00000000-0000-0000-0000-000000000108', 1001, 'solved', NOW() - INTERVAL '70 minutes'),
  ('00000000-0000-0000-0000-000000000108', 1003, 'solved', NOW() - INTERVAL '47 minutes'),
  ('00000000-0000-0000-0000-000000000109', 1001, 'solved', NOW() - INTERVAL '69 minutes'),
  ('00000000-0000-0000-0000-000000000109', 1005, 'solved', NOW() - INTERVAL '44 minutes'),
  ('00000000-0000-0000-0000-000000000110', 1001, 'solved', NOW() - INTERVAL '68 minutes'),
  ('00000000-0000-0000-0000-000000000110', 1003, 'solved', NOW() - INTERVAL '43 minutes')
ON CONFLICT (user_id, problem_id) DO UPDATE
SET
  status = EXCLUDED.status,
  solve_timestamp = EXCLUDED.solve_timestamp;

-- -----------------------------------------------------
-- Announcement
-- -----------------------------------------------------
INSERT INTO announcements (announcement_id, title, content, posted_by, created_at)
SELECT
  4001,
  'LLA Demo Ready',
  'Les donnees de demo sont chargees. Vous pouvez tester le catalogue, les concours, le leaderboard et le dashboard admin.',
  user_id,
  NOW()
FROM users
WHERE email = 'admin@dev.local'
LIMIT 1
ON CONFLICT (announcement_id) DO UPDATE
SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  posted_by = EXCLUDED.posted_by,
  created_at = EXCLUDED.created_at;

-- Keep SERIAL sequences in sync with explicit IDs
SELECT setval(pg_get_serial_sequence('topics', 'topic_id'), GREATEST((SELECT COALESCE(MAX(topic_id), 1) FROM topics), 6));
SELECT setval(pg_get_serial_sequence('languages', 'language_id'), GREATEST((SELECT COALESCE(MAX(language_id), 1) FROM languages), 3));
SELECT setval(pg_get_serial_sequence('problems', 'problem_id'), GREATEST((SELECT COALESCE(MAX(problem_id), 1) FROM problems), 1008));
SELECT setval(pg_get_serial_sequence('contests', 'contest_id'), GREATEST((SELECT COALESCE(MAX(contest_id), 1) FROM contests), 2003));
SELECT setval(pg_get_serial_sequence('announcements', 'announcement_id'), GREATEST((SELECT COALESCE(MAX(announcement_id), 1) FROM announcements), 4001));
SELECT setval(pg_get_serial_sequence('test_cases', 'test_case_id'), GREATEST((SELECT COALESCE(MAX(test_case_id), 1) FROM test_cases), 1));

COMMIT;
