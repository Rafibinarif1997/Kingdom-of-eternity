"use client";

import IsometricKingdom from "../components/IsometricKingdom";
import { useEffect, useMemo, useState } from "react";

type Resource = { name: string; amount: number; rate: number; icon: string };
type Building = { id: string | number; name: string; level: number; icon: string; description: string };

const initialResources: Resource[] = [
  { name: "Wood", amount: 420, rate: 12, icon: "🪵" },
  { name: "Stone", amount: 280, rate: 8, icon: "🪨" },
  { name: "Food", amount: 650, rate: 18, icon: "🌾" },
  { name: "Iron", amount: 95, rate: 3, icon: "⛓️" }
];

const initialBuildings: Building[] = [
  { id: 1, name: "Castle", level: 1, icon: "🏰", description: "The heart of your kingdom" },
  { id: 2, name: "Farm", level: 2, icon: "🌾", description: "Produces food every hour" },
  { id: 3, name: "Lumber Mill", level: 1, icon: "🪵", description: "Produces timber for construction" },
  { id: 4, name: "Stone Mine", level: 1, icon: "⛏️", description: "Quarries stone from the hills" }
];

export default function Home() {
  const [resources, setResources] = useState(initialResources);
  const [buildings, setBuildings] = useState(initialBuildings);
  const [selected, setSelected] = useState("Overview");
  const [notice, setNotice] = useState("Your kingdom awaits, Commander.");
  const [tick, setTick] = useState(0);

  const totalPower = useMemo(() => buildings.reduce((sum, b) => sum + b.level * 125, 0), [buildings]);

  function collect() {
    setResources((current) => current.map((r) => ({ ...r, amount: r.amount + r.rate })));
    setTick((v) => v + 1);
    setNotice("Production collected. Your stores are growing.");
  }

  function upgrade(building: Building) {
    const woodCost = 100 * building.level;
    const stoneCost = 60 * building.level;
    const wood = resources.find((r) => r.name === "Wood")?.amount ?? 0;
    const stone = resources.find((r) => r.name === "Stone")?.amount ?? 0;
    if (wood < woodCost || stone < stoneCost) {
      setNotice(`Not enough resources. Upgrade needs ${woodCost} wood and ${stoneCost} stone.`);
      return;
    }
    setResources((current) => current.map((r) =>
      r.name === "Wood" ? { ...r, amount: r.amount - woodCost } :
      r.name === "Stone" ? { ...r, amount: r.amount - stoneCost } : r
    ));
    setBuildings((current) => current.map((b) => b.id === building.id ? { ...b, level: b.level + 1 } : b));
    setNotice(`${building.name} upgraded to level ${building.level + 1} in this local prototype.`);
  }

  const nav = ["Overview", "Buildings", "Missions", "Army", "Kingdom"];

  return (
    <main className="game-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">♜</span><span>KINGDOMS <b>OF ETERNITY</b></span></a>
        <div className="season">SEASON 01 <span>·</span> THE FIRST AGE</div>
        <button className="profile"><span className="avatar">♛</span><span>Commander</span><span className="online-dot" /></button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR LEGACY BEGINS</div>
          <h1>Build an empire.<br /><em>Forge eternity.</em></h1>
          <p>Raise your walls, command your resources, and turn a humble settlement into a kingdom that will stand through the ages.</p>
          <div className="hero-actions"><button className="primary-btn" onClick={() => { setSelected("Buildings"); setNotice("Choose a building to strengthen your kingdom."); }}>MANAGE KINGDOM <span>↗</span></button><span className="hero-note">✦ &nbsp; YOUR STORY, YOUR KINGDOM</span></div>
        </div>
        <div className="hero-art"><IsometricKingdom /></div>
      </section>

      <section className="resource-strip">
        {resources.map((r) => <div className="resource" key={r.name}><span className="resource-icon">{r.icon}</span><div><small>{r.name.toUpperCase()}</small><strong>{r.amount.toLocaleString()}</strong><span className="rate">↗ +{r.rate}/hr</span></div></div>)}
        <button className="collect-btn" onClick={collect}>COLLECT <span>✦</span></button>
      </section>

      <nav className="section-nav" aria-label="Kingdom navigation">
        {nav.map((item) => <button key={item} className={selected === item ? "nav-item active" : "nav-item"} onClick={() => setSelected(item)}>{item}</button>)}
      </nav>

      <section className="content-grid">
        <div className="main-panel">
          <div className="panel-heading"><div><div className="eyebrow">KINGDOM MANAGEMENT</div><h2>{selected === "Overview" ? "Your domain" : selected}</h2></div><span className="level-pill">✦ &nbsp; LEVEL 01</span></div>
          <div className="notice"><span>{notice}</span><span className="api-status">{apiStatus === "server connected" ? "● SERVER SYNCED" : "● LOCAL PREVIEW"}</span></div>
          {selected === "Buildings" || selected === "Overview" ? <div className="building-grid">
            {buildings.map((building) => <article className="building-card" key={building.id}><div className="building-art">{building.icon}<span>LVL {building.level}</span></div><div className="building-info"><h3>{building.name}</h3><p>{building.description}</p><button onClick={() => upgrade(building)}>UPGRADE <span>· {100 * building.level} 🪵 / {60 * building.level} 🪨</span></button></div></article>)}
          </div> : <div className="empty-state"><span>✧</span><h3>{selected} is on the roadmap</h3><p>This feature will be added as the playable MVP grows.</p></div>}
        </div>
        <aside className="side-panel">
          <div className="side-heading"><span>YOUR COMMAND</span><b>✧</b></div>
          <div className="power-card"><small>KINGDOM POWER</small><strong>{totalPower.toLocaleString()}</strong><span>✦ &nbsp; Growing stronger</span></div>
          <div className="side-stat"><span>Buildings</span><b>{buildings.length}</b></div>
          <div className="side-stat"><span>Production collections</span><b>{tick}</b></div>
          <div className="side-divider" />
          <div className="quest-label">DAILY OBJECTIVE</div>
          <div className="quest"><span className="quest-icon">⚒</span><div><b>Strengthen the realm</b><small>Upgrade any building</small><div className="progress"><i style={{ width: `${Math.min(100, (buildings.reduce((s,b) => s + b.level, 0) - 5) * 20)}%` }} /></div></div></div>
          <div className="side-foot">✦ &nbsp; THE FIRST AGE HAS JUST BEGUN</div>
        </aside>
      </section>
      <footer>© 2026 KINGDOMS OF ETERNITY <span>AN EMPIRE IS BUILT ONE DECISION AT A TIME.</span></footer>
    </main>
  );
}
