"use client";
import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
type Building = { id:number; kind:string; x:number; y:number; level:number };
type Props = { buildings:Building[]; selected:{x:number;y:number}|null; onSelect:(x:number,y:number)=>void };
const W=13,H=11,TW=68,TH=36;
const colors={grass:[0x668b50,0x739658,0x5c8049,0x7a9c5c],water:0x356f75,path:0xb39a69,gold:0xf2d58c};
class RealmScene extends Phaser.Scene {
 private terrain!:Phaser.GameObjects.Graphics; private objects!:Phaser.GameObjects.Graphics; private effects!:Phaser.GameObjects.Graphics;
 private buildings:Building[]=[]; private selected:Props["selected"]=null; private onSelect:Props["onSelect"]=()=>{}; private elapsed=0;
 constructor(){super("RealmScene")}
 private iso(x:number,y:number){return{x:430+(x-y)*TW/2,y:35+(x+y)*TH/2}}
 create(){
  this.cameras.main.setBackgroundColor("#17291f");this.cameras.main.setBounds(-260,-150,1500,1100);
  this.terrain=this.add.graphics();this.objects=this.add.graphics();this.effects=this.add.graphics();this.drawTerrain();this.drawDecor();
  this.input.on("pointerdown",(pointer:Phaser.Input.Pointer)=>{const p=this.cameras.main.getWorldPoint(pointer.x,pointer.y);const a=(p.x-430)/(TW/2),b=(p.y-35)/(TH/2),x=Math.floor((a+b)/2),y=Math.floor((b-a)/2);if(x>=0&&x<W&&y>=0&&y<H)this.onSelect(x,y)});
  this.input.on("wheel",(_p:unknown,_o:unknown,_dx:number,dy:number)=>this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom-dy*.001,.65,1.5)));
  this.input.on("pointermove",(p:Phaser.Input.Pointer)=>{if(p.isDown&&p.middleButtonDown()){this.cameras.main.scrollX-=p.velocity.x/9;this.cameras.main.scrollY-=p.velocity.y/9}});
  const receive=(event:Event)=>{const d=(event as CustomEvent<Props>).detail;this.buildings=d.buildings;this.selected=d.selected;this.onSelect=d.onSelect;this.drawBuildings()};
  window.addEventListener("koe:world-update",receive);this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>window.removeEventListener("koe:world-update",receive));
  this.drawBuildings();this.cameras.main.centerOn(430,280);
 }
 update(_t:number,delta:number){this.elapsed+=delta;this.effects.clear();for(let i=0;i<5;i++){const x=170+i*145+Math.sin(this.elapsed/850+i)*8,y=130+i*42;this.effects.fillStyle(0xf5e3a2,.35+Math.sin(this.elapsed/400+i)*.16);this.effects.fillCircle(x,y,2)}}
 private diamond(g:Phaser.GameObjects.Graphics,x:number,y:number,fill:number){g.fillStyle(fill);g.lineStyle(1,0x263f2d,.55);g.beginPath();g.moveTo(x,y);g.lineTo(x+TW/2,y+TH/2);g.lineTo(x,y+TH);g.lineTo(x-TW/2,y+TH/2);g.closePath();g.fillPath();g.strokePath()}
 private drawTerrain(){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=this.iso(x,y),river=(x===1&&y>4)||(x===2&&y>6)||(x===3&&y===9),path=(x===5&&y>2&&y<9)||(y===6&&x>3&&x<10),edge=x===0||y===0||x===W-1||y===H-1;const fill=river?colors.water:path?colors.path:edge?0x314d37:colors.grass[Math.abs((x*7+y*11)%4)];this.diamond(this.terrain,p.x,p.y,fill);if(river){this.terrain.lineStyle(2,0x57969a,.55);this.terrain.beginPath();this.terrain.moveTo(p.x-13,p.y+17);this.terrain.lineTo(p.x,p.y+25);this.terrain.lineTo(p.x+12,p.y+17);this.terrain.strokePath()}if(!river&&!path&&!edge&&(x*13+y*5)%17===0){this.terrain.fillStyle(0xc5c17c,.65);this.terrain.fillCircle(p.x+3,p.y+18,2)}}}
 private tree(x:number,y:number,scale=1){const p=this.iso(x,y),g=this.objects;g.fillStyle(0x1d3425,.35);g.fillEllipse(p.x+5,p.y+30,35*scale,12*scale);g.fillStyle(0x76583b);g.fillRect(p.x-3*scale,p.y+5,6*scale,21*scale);g.fillStyle(0x315c3a);g.fillTriangle(p.x,p.y-36*scale,p.x-22*scale,p.y+12*scale,p.x+22*scale,p.y+12*scale);g.fillStyle(0x4f824a);g.fillTriangle(p.x,p.y-24*scale,p.x-18*scale,p.y+5*scale,p.x+18*scale,p.y+5*scale);g.fillStyle(0x83a75c,.75);g.fillTriangle(p.x-2,p.y-26*scale,p.x-12*scale,p.y-2,p.x+2,p.y-1)}
 private drawDecor(){for(let y=0;y<H;y++)for(let x=0;x<W;x++)if((x*7+y*3)%13===0&&!(x<4&&y>5))this.tree(x,y,.8+((x+y)%3)*.12);this.add.text(24,22,"DAWNREACH  /  THE GREEN FRONTIER",{fontFamily:"Georgia",fontSize:"12px",color:"#f0d99e",letterSpacing:2}).setScrollFactor(0);this.add.text(24,44,"CLICK A PLOT  ·  SCROLL TO ZOOM  ·  MIDDLE-DRAG TO PAN",{fontFamily:"Arial",fontSize:"9px",color:"#d4dfc5",letterSpacing:1}).setScrollFactor(0).setAlpha(.8)}
 private drawBuilding(b:Building){const p=this.iso(b.x,b.y),g=this.objects,k=b.kind,stone=k==="keep"?0xb5ad91:k==="farm"?0x9a8557:k==="lumber"?0x98734d:k==="quarry"||k==="iron"?0x858b83:0x9c8667,roof=k==="keep"?0x596b62:k==="farm"?0x8c9c4f:k==="barracks"?0x7d4c3c:0x805b43;g.fillStyle(0x18251b,.42);g.fillEllipse(p.x+3,p.y+28,54,19);g.fillStyle(0x263a2b);g.fillRect(p.x-19,p.y-10,38,33);g.fillStyle(stone);g.fillRect(p.x-17,p.y-26,34,38);g.fillStyle(roof);g.fillTriangle(p.x-23,p.y-25,p.x,p.y-49,p.x+23,p.y-25);g.fillStyle(0xd8c28d);g.fillRect(p.x-3,p.y-9,7,21);g.fillStyle(0x28372b);g.fillRect(p.x-11,p.y-18,6,9);g.fillRect(p.x+6,p.y-18,6,9);
  if(k==="keep"){g.fillStyle(0xbcb69b);g.fillRect(p.x-25,p.y-40,12,33);g.fillRect(p.x+13,p.y-40,12,33);g.fillStyle(0x6c5540);g.fillTriangle(p.x-27,p.y-40,p.x-19,p.y-55,p.x-11,p.y-40);g.fillTriangle(p.x+11,p.y-40,p.x+19,p.y-55,p.x+27,p.y-40);g.fillStyle(0xc5a45f);g.fillRect(p.x-1,p.y-68,2,18);g.lineStyle(2,0xc5a45f);g.beginPath();g.moveTo(p.x+1,p.y-66);g.lineTo(p.x+14,p.y-61);g.lineTo(p.x+1,p.y-56);g.strokePath()}
  if(k==="farm"){g.fillStyle(0xb7a45c);for(let i=-2;i<=2;i++)g.fillRect(p.x+i*7,p.y+15,2,10)}
  if(k==="lumber"){g.fillStyle(0xd6bd8a);g.fillRect(p.x-27,p.y+12,18,5);g.fillRect(p.x+11,p.y+14,16,5)}
  if(k==="quarry"||k==="iron"){g.fillStyle(k==="iron"?0x9aa5a8:0xb2b5a9);g.fillTriangle(p.x-22,p.y+12,p.x-13,p.y-4,p.x-3,p.y+12);g.fillTriangle(p.x+3,p.y+13,p.x+13,p.y-1,p.x+23,p.y+13)}
  if(k==="tower"){g.fillStyle(0xc2b99e);g.fillRect(p.x-8,p.y-47,16,43);g.fillStyle(0x7e5941);g.fillTriangle(p.x-13,p.y-47,p.x,p.y-63,p.x+13,p.y-47)}
  g.fillStyle(0xe9d29a);g.fillCircle(p.x+13,p.y-4,2.2);if(b.level>1){g.lineStyle(2,0xf2d58c,.8);g.strokeCircle(p.x+25,p.y-34,5)}
 }
 private drawBuildings(){this.objects.clear();this.drawDecor();for(const b of [...this.buildings].sort((a,b)=>a.x+a.y-(b.x+b.y)))this.drawBuilding(b);if(this.selected){const p=this.iso(this.selected.x,this.selected.y);this.objects.lineStyle(3,colors.gold,1);this.objects.beginPath();this.objects.moveTo(p.x,p.y);this.objects.lineTo(p.x+TW/2,p.y+TH/2);this.objects.lineTo(p.x,p.y+TH);this.objects.lineTo(p.x-TW/2,p.y+TH/2);this.objects.closePath();this.objects.strokePath()}}
}
export default function IsometricKingdom({buildings,selected,onSelect}:Props){const host=useRef<HTMLDivElement>(null),latest=useRef({buildings,selected,onSelect});latest.current={buildings,selected,onSelect};useEffect(()=>{if(!host.current)return;const game=new Phaser.Game({type:Phaser.CANVAS,parent:host.current,width:900,height:540,backgroundColor:"#17291f",scene:[RealmScene],scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false}});const send=()=>window.dispatchEvent(new CustomEvent("koe:world-update",{detail:latest.current}));const id=window.setInterval(send,250);return()=>{window.clearInterval(id);game.destroy(true)}},[]);return <div className="isometric-host" ref={host} role="application" aria-label="Interactive isometric kingdom map"/>}
