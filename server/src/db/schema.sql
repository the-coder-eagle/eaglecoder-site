-- EagleCoder OJ 数据库建表语句
-- 运行：sudo mysql -uroot -p'84a974ca2c85aea1' eaglecoder_oj < schema.sql

CREATE TABLE IF NOT EXISTS challenges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'easy',
  tags JSON NOT NULL,
  test_case_count INT NOT NULL DEFAULT 0,
  scheduled_date DATE UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  challenge_id INT NOT NULL,
  username VARCHAR(30) NOT NULL DEFAULT '',
  language VARCHAR(20) NOT NULL,
  code TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'error',
  score INT NOT NULL DEFAULT 0,
  passed INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  exec_time_ms INT DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_challenge_id (challenge_id),
  INDEX idx_username (username),
  INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS page_views (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  path VARCHAR(500) NOT NULL,
  user_token VARCHAR(64) DEFAULT '',
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_viewed_at (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
