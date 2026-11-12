import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { Pool, type PoolClient } from "pg";
import { z } from "zod";
import { randomUUID } from "node:crypto";

const app = Fastify({ logger: true, bodyLimit: 16_384 });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000").split(",").map((s) => s.trim());
await app.register(helmet);
await app.register(cors, { origin: allowedOrigins });
await app.register(rateLimit, { max: 90, timeWindow: "1 minute" });

const newPlayerSchema = z.object({ displayName: z.string().trim().min(2).max(32), kingdomName: z.string().trim().min(2).max(40) });
const upgradeSchema = z.object({ buildingId: z.string().uuid(), idempotencyKey: z.string().min(12).max(80) });
const collectSchema = z.object({ idempotencyKey: z.string().min(12).max(80) });
const buildSchema = z.object({ buildingCode: z.enum(["farm", "lumber_mill", "stone_mine", "iron_mine", "storage", "barracks"]), x: z.number().int().min(0).max(99), y: z.number().int().min(0).max(99), idempotencyKey: z.string().min(12).max(80) });

async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try { await client.query("BEGIN"); const result = await work(client); await client.query("COMMIT"); return result; }
  catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

app.get("/health", async () => {
  await pool.query("SELECT 1");
  return { ok: true, service: "kingdoms-api", database: "connected" };
});

app.post("/v1/players", async (request, reply) => {
  const parsed = newPlayerSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: "invalid_input", details: parsed.error.flatten() });
  const { displayName, kingdomName } = parsed.data;
  const player = await transaction(async (client) => {
    const p = await client.query<{ id: string }>("INSERT INTO players(display_name) VALUES($1) RETURNING id", [displayName]);
    const playerId = p.rows[0]!.id;
    const k = await client.query<{ id: string }>("INSERT INTO kingdoms(player_id,name) VALUES($1,$2) RETURNING id", [playerId, kingdomName]);
    const kingdomId = k.rows[0]!.id;
    for (const [code, amount] of [["wood", 420], ["stone", 280], ["food", 650], ["iron", 95], ["gold", 0]] as const) {
      await client.query("INSERT INTO resource_balances(kingdom_id,resource_code,balance) VALUES($1,$2,$3)", [kingdomId, code, amount]);
    }
    const starterBuildings = [["castle", 5, 3], ["farm", 3, 4], ["lumber_mill", 7, 4], ["stone_mine", 5, 5]] as const;
    for (const [code, x, y] of starterBuildings) await client.query(
      "INSERT INTO buildings(kingdom_id,building_code,grid_x,grid_y) VALUES($1,$2,$3,$4)", [kingdomId, code, x, y]
    );
    await client.query("INSERT INTO player_missions(player_id,mission_id,status) SELECT $1,id,'available' FROM missions WHERE is_active=true ON CONFLICT (player_id,mission_id) DO NOTHING", [playerId]);
    return { playerId, kingdomId };
  });
  return reply.code(201).send(player);
});

app.get("/v1/players/:playerId/missions", async (request, reply) => {
  const params = z.object({ playerId: z.string().uuid() }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: "invalid_player_id" });
  const result = await pool.query("SELECT m.mission_code,m.title,m.description,pm.progress,pm.status,pm.completed_at FROM player_missions pm JOIN missions m ON m.id=pm.mission_id WHERE pm.player_id=$1 ORDER BY m.mission_code", [params.data.playerId]);
  return { missions: result.rows };
});

app.get("/v1/kingdoms/:kingdomId", async (request, reply) => {
  const params = z.object({ kingdomId: z.string().uuid() }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: "invalid_kingdom_id" });
  const k = await pool.query("SELECT id,player_id,name,level,experience FROM kingdoms WHERE id=$1", [params.data.kingdomId]);
  if (!k.rowCount) return reply.code(404).send({ error: "kingdom_not_found" });
  const [resources, buildings] = await Promise.all([
    pool.query("SELECT resource_code,balance FROM resource_balances WHERE kingdom_id=$1 ORDER BY resource_code", [params.data.kingdomId]),
    pool.query("SELECT id,building_code,grid_x,grid_y,level,status FROM buildings WHERE kingdom_id=$1 ORDER BY created_at", [params.data.kingdomId])
  ]);
  return { kingdom: k.rows[0], resources: resources.rows, buildings: buildings.rows };
});

app.post("/v1/kingdoms/:kingdomId/collect", async (request, reply) => {
  const params = z.object({ kingdomId: z.string().uuid() }).safeParse(request.params);
  const body = collectSchema.safeParse(request.body);
  if (!params.success || !body.success) return reply.code(400).send({ error: "invalid_input" });
  const result = await transaction(async (client) => {
    const exists = await client.query("SELECT id,last_collected_at FROM kingdoms WHERE id=$1 FOR UPDATE", [params.data.kingdomId]);
    if (!exists.rowCount) return null;
    const previous = await client.query("SELECT id FROM resource_ledger WHERE kingdom_id=$1 AND idempotency_key = ANY($2::text[]) LIMIT 1", [params.data.kingdomId, ["wood", "stone", "food", "iron", "gold"].map(code => `${body.data.idempotencyKey}:${code}`)]);
    if (previous.rowCount) return { replayed: true };
    const balances = await client.query("SELECT resource_code,balance FROM resource_balances WHERE kingdom_id=$1 FOR UPDATE", [params.data.kingdomId]);
    const buildings = await client.query("SELECT building_code,level FROM buildings WHERE kingdom_id=$1 AND status='active'", [params.data.kingdomId]);
    const elapsedMs = Date.now() - new Date(exists.rows[0]!.last_collected_at).getTime();
    const elapsedHours = Math.min(24, Math.floor(elapsedMs / 3_600_000));
    if (elapsedHours < 1) return { replayed: false, collected: {}, nextCollectionInSeconds: Math.ceil((3_600_000 - (elapsedMs % 3_600_000)) / 1000) };
    const rates: Record<string, number> = {
      wood: buildings.rows.filter(b => b.building_code === "lumber_mill").reduce((s,b) => s + 12 * Number(b.level),0),
      stone: buildings.rows.filter(b => b.building_code === "stone_mine").reduce((s,b) => s + 8 * Number(b.level),0),
      food: buildings.rows.filter(b => b.building_code === "farm").reduce((s,b) => s + 18 * Number(b.level),0),
      iron: buildings.rows.filter(b => b.building_code === "iron_mine").reduce((s,b) => s + 3 * Number(b.level),0)
    };
    const storageRows = await client.query("SELECT level FROM buildings WHERE kingdom_id=$1 AND building_code='storage' AND status='active'", [params.data.kingdomId]);
    const capacity = 5_000 + storageRows.rows.reduce((sum, row) => sum + Number(row.level) * 1_000, 0);
    const output: Record<string, number> = {};
    for (const row of balances.rows) {
      const code = String(row.resource_code);
      const gain = Math.max(0, Math.floor((rates[code] ?? 0) * elapsedHours));
      if (!gain) continue;
      const after = Math.min(capacity, Number(row.balance) + gain);
      const actualGain = after - Number(row.balance);
      if (actualGain <= 0) continue;
      await client.query("UPDATE resource_balances SET balance=$1,updated_at=now() WHERE kingdom_id=$2 AND resource_code=$3", [after, params.data.kingdomId, code]);
      await client.query("INSERT INTO resource_ledger(kingdom_id,resource_code,delta,balance_after,reason,idempotency_key) VALUES($1,$2,$3,$4,'manual_collect',$5)", [params.data.kingdomId, code, actualGain, after, `${body.data.idempotencyKey}:${code}`]);
      output[code] = actualGain;
    }
    await client.query("UPDATE kingdoms SET last_collected_at=now(),updated_at=now() WHERE id=$1", [params.data.kingdomId]);
    if (Object.values(output).some((amount) => amount > 0)) {
      await client.query("UPDATE player_missions pm SET status='completed',completed_at=now(),progress=jsonb_build_object('collected',true) FROM kingdoms k JOIN missions m ON m.mission_code='collect_once' WHERE pm.player_id=k.player_id AND pm.mission_id=m.id AND k.id=$1 AND pm.status<>'claimed'", [params.data.kingdomId]);
    }
    return { replayed: false, collected: output, elapsedHours };
  });
  if (!result) return reply.code(404).send({ error: "kingdom_not_found" });
  return result;
});

app.post("/v1/kingdoms/:kingdomId/buildings", async (request, reply) => {
  const params = z.object({ kingdomId: z.string().uuid() }).safeParse(request.params);
  const body = buildSchema.safeParse(request.body);
  if (!params.success || !body.success) return reply.code(400).send({ error: "invalid_input" });
  const costs: Record<string, { wood: number; stone: number }> = {
    farm: { wood: 120, stone: 50 }, lumber_mill: { wood: 150, stone: 40 },
    stone_mine: { wood: 100, stone: 80 }, iron_mine: { wood: 200, stone: 150 },
    storage: { wood: 180, stone: 180 }, barracks: { wood: 250, stone: 200 }
  };
  const cost = costs[body.data.buildingCode]!;
  const result = await transaction(async (client) => {
    const kingdom = await client.query("SELECT id FROM kingdoms WHERE id=$1 FOR UPDATE", [params.data.kingdomId]);
    if (!kingdom.rowCount) return { error: "kingdom_not_found" as const };
    const duplicate = await client.query("SELECT id FROM resource_ledger WHERE kingdom_id=$1 AND idempotency_key = ANY($2::text[]) LIMIT 1", [params.data.kingdomId, ["wood", "stone"].map(code => `${body.data.idempotencyKey}:${code}`)]);
    if (duplicate.rowCount) return { error: "duplicate_request" as const };
    const occupied = await client.query("SELECT id FROM buildings WHERE kingdom_id=$1 AND grid_x=$2 AND grid_y=$3", [params.data.kingdomId, body.data.x, body.data.y]);
    if (occupied.rowCount) return { error: "tile_occupied" as const };
    const resources = await client.query("SELECT resource_code,balance FROM resource_balances WHERE kingdom_id=$1 AND resource_code IN ('wood','stone') FOR UPDATE", [params.data.kingdomId]);
    const balances = Object.fromEntries(resources.rows.map(row => [row.resource_code, Number(row.balance)])) as Record<string, number>;
    if ((balances.wood ?? 0) < cost.wood || (balances.stone ?? 0) < cost.stone) return { error: "insufficient_resources" as const, required: cost };
    for (const [code, amount] of [["wood", cost.wood], ["stone", cost.stone]] as const) {
      const after = balances[code]! - amount;
      await client.query("UPDATE resource_balances SET balance=$1,updated_at=now() WHERE kingdom_id=$2 AND resource_code=$3", [after, params.data.kingdomId, code]);
      await client.query("INSERT INTO resource_ledger(kingdom_id,resource_code,delta,balance_after,reason,idempotency_key) VALUES($1,$2,$3,$4,'building_placed',$5)", [params.data.kingdomId, code, -amount, after, `${body.data.idempotencyKey}:${code}`]);
    }
    const inserted = await client.query("INSERT INTO buildings(kingdom_id,building_code,grid_x,grid_y) VALUES($1,$2,$3,$4) RETURNING id,building_code,grid_x,grid_y,level", [params.data.kingdomId, body.data.buildingCode, body.data.x, body.data.y]);
    return { ok: true, building: inserted.rows[0] };
  });
  if ("error" in result) {
    const status = result.error === "kingdom_not_found" ? 404 : result.error === "insufficient_resources" || result.error === "tile_occupied" ? 409 : 400;
    return reply.code(status).send(result);
  }
  return result;
});

app.post("/v1/kingdoms/:kingdomId/upgrade", async (request, reply) => {
  const params = z.object({ kingdomId: z.string().uuid() }).safeParse(request.params);
  const body = upgradeSchema.safeParse(request.body);
  if (!params.success || !body.success) return reply.code(400).send({ error: "invalid_input" });
  const result = await transaction(async (client) => {
    const kingdomLock = await client.query("SELECT id,player_id FROM kingdoms WHERE id=$1 FOR UPDATE", [params.data.kingdomId]);
    if (!kingdomLock.rowCount) return { error: "building_not_found" as const };
    const building = await client.query("SELECT id,building_code,level FROM buildings WHERE id=$1 AND kingdom_id=$2 FOR UPDATE", [body.data.buildingId, params.data.kingdomId]);
    if (!building.rowCount) return { error: "building_not_found" as const };
    const b = building.rows[0]!;
    if (Number(b.level) >= 50) return { error: "max_level" as const };
    const woodCost = 100 * Number(b.level), stoneCost = 60 * Number(b.level);
    const resources = await client.query("SELECT resource_code,balance FROM resource_balances WHERE kingdom_id=$1 AND resource_code IN ('wood','stone') FOR UPDATE", [params.data.kingdomId]);
    const values = Object.fromEntries(resources.rows.map(r => [r.resource_code, Number(r.balance)])) as Record<string, number>;
    if ((values.wood ?? 0) < woodCost || (values.stone ?? 0) < stoneCost) return { error: "insufficient_resources" as const, required: { wood: woodCost, stone: stoneCost } };
    const replay = await client.query("SELECT id FROM resource_ledger WHERE kingdom_id=$1 AND idempotency_key = ANY($2::text[]) LIMIT 1", [params.data.kingdomId, ["wood", "stone"].map(code => `${body.data.idempotencyKey}:${code}`)]);
    if (replay.rowCount) return { error: "duplicate_request" as const };
    for (const [code, cost] of [["wood", woodCost], ["stone", stoneCost]] as const) {
      const after = values[code]! - cost;
      await client.query("UPDATE resource_balances SET balance=$1,updated_at=now() WHERE kingdom_id=$2 AND resource_code=$3", [after, params.data.kingdomId, code]);
      await client.query("INSERT INTO resource_ledger(kingdom_id,resource_code,delta,balance_after,reason,reference_id,idempotency_key) VALUES($1,$2,$3,$4,'building_upgrade',$5,$6)", [params.data.kingdomId, code, -cost, after, b.id, `${body.data.idempotencyKey}:${code}`]);
    }
    await client.query("UPDATE buildings SET level=level+1,updated_at=now() WHERE id=$1", [b.id]);
    await client.query("UPDATE player_missions pm SET status='completed',completed_at=now(),progress=jsonb_build_object('upgraded',true) FROM missions m WHERE pm.mission_id=m.id AND pm.player_id=$1 AND m.mission_code='first_upgrade' AND pm.status<>'claimed'", [kingdomLock.rows[0]!.player_id]);
    return { ok: true, building: String(b.building_code), newLevel: Number(b.level) + 1 };
  });
  if ("error" in result) {
    const status = result.error === "building_not_found" ? 404 : result.error === "insufficient_resources" ? 409 : 400;
    return reply.code(status).send(result);
  }
  return result;
});

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  reply.code(500).send({ error: "internal_server_error", requestId: randomUUID() });
});

app.addHook("onClose", async () => { await pool.end(); });
const port = Number(process.env.PORT ?? 4000);
await app.listen({ port, host: "0.0.0.0" });
