"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";

type Tile = { x: number; y: number; kind: "grass" | "water" | "path" };

class KingdomScene extends Phaser.Scene {
  private selectedTile: { x: number; y: number } | null = null;
  private statusText?: Phaser.GameObjects.Text;
  constructor() { super("KingdomScene"); }

  create() {
    const width = 11, height = 9, tw = 64, th = 34;
    const originX = this.scale.width / 2;
    const originY = 48;
    const tiles: Tile[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const edge = x === 0 || y === 0 || x === width - 1 || y === height - 1;
        const kind = (x === 1 && y > 5) ? "water" : (x > 2 && x < 8 && y === 6) ? "path" : "grass";
        tiles.push({ x, y, kind });
        const px = originX + (x - y) * tw / 2;
        const py = originY + (x + y) * th / 2;
        const g = this.add.graphics();
        const fill = kind === "water" ? 0x345c63 : kind === "path" ? 0x8b7958 : edge ? 0x45634a : ((x + y) % 2 ? 0x52764f : 0x5b8056);
        g.fillStyle(fill, 1);
        g.lineStyle(1, 0x243d2c, 0.85);
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + tw / 2, py + th / 2); g.lineTo(px, py + th); g.lineTo(px - tw / 2, py + th / 2); g.closePath(); g.fillPath(); g.strokePath();
        if (!edge && kind === "grass" && (x * 7 + y * 3) % 11 === 0) {
          this.add.circle(px + 3, py + th / 2 - 4, 2, 0xc1bb76, 0.8);
        }
        const zone = this.add.zone(px, py + th / 2, tw, th).setOrigin(0.5).setInteractive();
        zone.on("pointerdown", () => {
          this.selectedTile = { x, y };
          this.drawSelection(px, py, tw, th);
          this.statusText?.setText(`LAND TILE  ${x + 1} : ${y + 1}`);
        });
      }
    }

    this.drawBuilding(originX, originY, tw, th, 5, 3, "castle");
    this.drawBuilding(originX, originY, tw, th, 3, 4, "farm");
    this.drawBuilding(originX, originY, tw, th, 7, 4, "mill");
    this.drawBuilding(originX, originY, tw, th, 5, 5, "mine");
    this.statusText = this.add.text(18, this.scale.height - 27, "SELECT A LAND TILE TO INSPECT", {
      fontFamily: "Arial", fontSize: "10px", color: "#e7d29a", letterSpacing: 1
    }).setScrollFactor(0);
    this.input.on("wheel", (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.001, 0.65, 1.45));
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && pointer.middleButtonDown()) this.cameras.main.scrollX -= pointer.velocity.x / 12;
    });
  }

  private drawSelection(px: number, py: number, tw: number, th: number) {
    const g = this.add.graphics();
    g.lineStyle(3, 0xf1d99d, 1);
    g.beginPath(); g.moveTo(px, py); g.lineTo(px + tw / 2, py + th / 2); g.lineTo(px, py + th); g.lineTo(px - tw / 2, py + th / 2); g.closePath(); g.strokePath();
    this.time.delayedCall(500, () => g.destroy());
  }

  private drawBuilding(ox: number, oy: number, tw: number, th: number, x: number, y: number, type: string) {
    const px = ox + (x - y) * tw / 2;
    const py = oy + (x + y) * th / 2 + 4;
    const g = this.add.graphics();
    if (type === "castle") {
      g.fillStyle(0x766c55); g.fillRect(px - 17, py - 38, 34, 38);
      g.fillStyle(0xb5a27b); g.fillRect(px - 22, py - 30, 44, 30);
      g.fillStyle(0x4c4537); g.fillTriangle(px - 22, py - 30, px, py - 52, px + 22, py - 30);
      g.fillStyle(0x302c25); g.fillRoundedRect(px - 5, py - 16, 10, 16, { tl: 6, tr: 6, bl: 0, br: 0 });
      g.fillStyle(0x9b8d6b); g.fillRect(px - 25, py - 43, 11, 28); g.fillRect(px + 14, py - 43, 11, 28);
      g.fillStyle(0x66543e); g.fillTriangle(px - 28, py - 43, px - 19, py - 58, px - 11, py - 43); g.fillTriangle(px + 11, py - 43, px + 19, py - 58, px + 28, py - 43);
    } else {
      g.fillStyle(type === "farm" ? 0x9a8856 : type === "mill" ? 0x8b6a48 : 0x777c79);
      g.fillRect(px - 13, py - 19, 26, 19);
      g.fillStyle(type === "farm" ? 0x6d8a45 : 0x594b3d);
      g.fillTriangle(px - 17, py - 19, px, py - 34, px + 17, py - 19);
      if (type === "farm") { g.fillStyle(0xc6b66e); for (let i = -8; i <= 8; i += 8) g.fillRect(px + i, py - 13, 2, 12); }
    }
    this.add.circle(px, py + 2, 5, 0x17251a, 0.3);
  }
}

export default function IsometricKingdom() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: host.current,
      width: 760,
      height: 390,
      transparent: true,
      backgroundColor: "rgba(0,0,0,0)",
      scene: [KingdomScene],
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true, pixelArt: false }
    });
    return () => game.destroy(true);
  }, []);
  return <div className="isometric-host" ref={host} role="img" aria-label="Interactive isometric kingdom map. Select a tile to inspect it." />;
}
