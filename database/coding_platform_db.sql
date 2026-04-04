
-- -----------------------------------------------------
-- Core Entities
-- -----------------------------------------------------

CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email LIKE '%@%.%'),
    user_level VARCHAR(20) DEFAULT 'beginner', -- Updated asynchronously based on activity
    is_admin BOOLEAN DEFAULT FALSE
);

CREATE TABLE problems (
    problem_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'med', 'hard')),
    solve_rate DECIMAL(5,2) DEFAULT 0.00 -- Updated periodically
);

CREATE TABLE topics (
    topic_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE languages (
    language_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, 
    version VARCHAR(20) NOT NULL -- e.g., 'Python 3.10', 'C++ 20'
);

CREATE TABLE test_cases (
    test_case_id SERIAL PRIMARY KEY,
    problem_id INTEGER NOT NULL REFERENCES problems(problem_id) ON DELETE CASCADE,
    input_data TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT TRUE
);

-- -----------------------------------------------------
-- User Activity & Progress
-- -----------------------------------------------------

CREATE TABLE submissions (
    submission_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL REFERENCES problems(problem_id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(language_id) ON DELETE RESTRICT,
    code_body TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'Pending', 
        'Accepted', 
        'Wrong Answer', 
        'Time Limit Exceeded', 
        'Memory Limit Exceeded',
        'Runtime Error', 
        'Compilation Error'
    )),
    runtime_ms INTEGER,
    memory_kb INTEGER,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_problem (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    problem_id INTEGER REFERENCES problems(problem_id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('attempted', 'solved')),
    solve_timestamp TIMESTAMP,
    PRIMARY KEY (user_id, problem_id)
);

-- -----------------------------------------------------
-- Junction Tables (Many-to-Many Mappings)
-- -----------------------------------------------------

CREATE TABLE user_topics (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(topic_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, topic_id)
);

CREATE TABLE problem_topics (
    problem_id INTEGER REFERENCES problems(problem_id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(topic_id) ON DELETE CASCADE,
    PRIMARY KEY (problem_id, topic_id)
);

CREATE TABLE problem_languages (
    problem_id INTEGER REFERENCES problems(problem_id) ON DELETE CASCADE,
    language_id INTEGER REFERENCES languages(language_id) ON DELETE CASCADE,
    time_limit_ms INTEGER NOT NULL,
    PRIMARY KEY (problem_id, language_id)
);

-- -----------------------------------------------------
-- Community Features (Contests & Announcements)
-- -----------------------------------------------------

CREATE TABLE contests (
    contest_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    description TEXT
);

CREATE TABLE contest_problems (
    contest_id INTEGER REFERENCES contests(contest_id) ON DELETE CASCADE,
    problem_id INTEGER REFERENCES problems(problem_id) ON DELETE CASCADE,
    points INTEGER DEFAULT 100, 
    PRIMARY KEY (contest_id, problem_id)
);

CREATE TABLE announcements (
    announcement_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    posted_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- Indexes for Performance
-- -----------------------------------------------------
CREATE INDEX idx_submissions_problemid ON submissions(problem_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_userid_time ON submissions(user_id, submitted_at DESC);
CREATE INDEX idx_problems_difficulty ON problems(difficulty_level);