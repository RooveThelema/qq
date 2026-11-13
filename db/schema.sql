-- Схема локальной базы данных PostgreSQL для Call of Duty: Zombies 2D

CREATE TABLE IF NOT EXISTS player_profiles (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(32) NOT NULL UNIQUE,
  best_round INTEGER NOT NULL DEFAULT 1,
  best_score INTEGER NOT NULL DEFAULT 0,
  total_kills INTEGER NOT NULL DEFAULT 0,
  total_headshots INTEGER NOT NULL DEFAULT 0,
  total_coins_earned BIGINT NOT NULL DEFAULT 0,
  ludka_spins INTEGER NOT NULL DEFAULT 0,
  memes_watched INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_runs (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(32) NOT NULL,
  round_reached INTEGER NOT NULL DEFAULT 1,
  kills INTEGER NOT NULL DEFAULT 0,
  headshots INTEGER NOT NULL DEFAULT 0,
  points_final INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  shots_fired INTEGER NOT NULL DEFAULT 0,
  ludka_spins INTEGER NOT NULL DEFAULT 0,
  memes_watched INTEGER NOT NULL DEFAULT 0,
  revived_used INTEGER NOT NULL DEFAULT 0,
  survived_sec INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_runs_score
  ON game_runs (round_reached DESC, total_earned DESC, kills DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_runs_nickname
  ON game_runs (nickname);

CREATE TABLE IF NOT EXISTS ludka_history (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(32) NOT NULL,
  meme_id VARCHAR(80),
  meme_type VARCHAR(16),
  outcome_id VARCHAR(64) NOT NULL,
  outcome_title VARCHAR(120) NOT NULL,
  coins_delta INTEGER NOT NULL DEFAULT 0,
  weapon_won VARCHAR(32),
  risked BOOLEAN NOT NULL DEFAULT FALSE,
  risk_won BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ludka_history_created
  ON ludka_history (created_at DESC);

-- Начальные записи для таблицы лидеров (добавляются только если таблица пуста)
INSERT INTO game_runs (nickname, round_reached, kills, headshots, points_final, total_earned, shots_fired, ludka_spins, memes_watched, revived_used, survived_sec)
SELECT * FROM (
  VALUES
    ('BunkerKing', 9, 142, 64, 4850, 16200, 610, 6, 4, 1, 740),
    ('RayGunEnjoyer', 6, 88, 37, 2900, 9450, 420, 4, 3, 0, 490),
    ('Ludka777Pro', 4, 49, 18, 1750, 5600, 290, 5, 3, 1, 310)
) AS seed(nickname, round_reached, kills, headshots, points_final, total_earned, shots_fired, ludka_spins, memes_watched, revived_used, survived_sec)
WHERE NOT EXISTS (SELECT 1 FROM game_runs LIMIT 1);

INSERT INTO player_profiles (nickname, best_round, best_score, total_kills, total_headshots, total_coins_earned, ludka_spins, memes_watched)
SELECT nickname, round_reached, total_earned, kills, headshots, total_earned, ludka_spins, memes_watched
FROM game_runs
ON CONFLICT (nickname) DO NOTHING;
