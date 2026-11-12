CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'))
);

CREATE TABLE player_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  chain_id BIGINT NOT NULL,
  wallet_address VARCHAR(42) NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chain_id, wallet_address),
  UNIQUE (player_id, chain_id, wallet_address),
  CHECK (wallet_address ~ '^0x[0-9a-fA-F]{40}$')
);

CREATE TABLE kingdoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  name VARCHAR(40) NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  experience BIGINT NOT NULL DEFAULT 0 CHECK (experience >= 0),
  last_collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE resource_balances (
  kingdom_id UUID NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  resource_code VARCHAR(16) NOT NULL CHECK (resource_code IN ('wood', 'stone', 'food', 'iron', 'gold')),
  balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (kingdom_id, resource_code)
);

CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kingdom_id UUID NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  building_code VARCHAR(24) NOT NULL CHECK (building_code IN ('castle', 'farm', 'lumber_mill', 'stone_mine', 'iron_mine', 'storage', 'barracks')),
  grid_x SMALLINT NOT NULL CHECK (grid_x BETWEEN 0 AND 99),
  grid_y SMALLINT NOT NULL CHECK (grid_y BETWEEN 0 AND 99),
  level SMALLINT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 50),
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'upgrading', 'disabled')),
  upgrade_started_at TIMESTAMPTZ,
  upgrade_finishes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kingdom_id, grid_x, grid_y)
);

CREATE TABLE resource_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kingdom_id UUID NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  resource_code VARCHAR(16) NOT NULL,
  delta BIGINT NOT NULL CHECK (delta <> 0),
  balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
  reason VARCHAR(32) NOT NULL,
  reference_id UUID,
  idempotency_key VARCHAR(96) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX resource_ledger_kingdom_created_idx ON resource_ledger (kingdom_id, created_at DESC);

CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_code VARCHAR(48) NOT NULL UNIQUE,
  title VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE player_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id),
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(16) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed', 'claimed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  UNIQUE (player_id, mission_id)
);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL,
  entity_type VARCHAR(32) NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id VARCHAR(96),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_created_idx ON audit_events (created_at DESC);

INSERT INTO missions (mission_code,title,description,requirements,rewards)
VALUES
  ('first_upgrade','Strengthen the realm','Upgrade any building in your kingdom','{"upgrades":1}'::jsonb,'{"experience":50}'::jsonb),
  ('collect_once','Gather your first supplies','Collect at least one hour of kingdom production','{"collections":1}'::jsonb,'{"experience":25}'::jsonb)
ON CONFLICT (mission_code) DO NOTHING;
