/* Marea de Verrath — arsenal completo
   Réplica mecánica del set clásico de un bullet-heaven: veinte armas base con
   su patrón de ataque propio y dieciocho evoluciones/uniones. Los nombres son
   de nuestro mundo; el comportamiento es el que hay que copiar. */
(function(){
  "use strict";
  var V = window.V = window.V || {};
  var A = null;                       // API del motor, inyectada en el arranque
  V.bindApi = function(api){ A = api; };

  function U(text, o){ o = o || {}; o.text = text; return o; }
  function crit(p, dmg, chance){
    if(Math.random() < (chance||0.05) * (p.st.luck||1)) return {d:dmg*2, c:true};
    return {d:dmg, c:false};
  }

  var W = V.WEAPONS = {};

  /* ---------------- 1. Látigo: barre en horizontal, atraviesa ---------------- */
  W.latigo = {
    name:"Látigo", glyph:"⌒", color:"#C2263A", spr:null,
    desc:"Barre en horizontal hacia donde miras. Atraviesa a todo el que toca.",
    base:{cd:1.20, dmg:22, count:1, area:1, range:104},
    ups:[U("+1 barrido al lado contrario",{count:1}), U("+10 de daño",{dmg:10}),
         U("+25% de área",{area:.25}), U("−0,15 s de recarga",{cd:-.15}),
         U("+14 de daño",{dmg:14}), U("+25% de área",{area:.25}),
         U("+1 barrido",{count:1})],
    fire:function(p,w,s){
      var dir = (p.aimx >= 0) ? 1 : -1;
      var n = Math.max(1, Math.round(s.count));
      for(var i=0;i<n;i++){
        var d = (i % 2 === 0) ? dir : -dir;
        var off = 26 + Math.floor(i/2)*30;
        var cx = p.x + d*(s.range*s.area*0.42 + off*0.2), cy = p.y - 2;
        A.area({x:cx, y:cy, w:s.range*s.area, h:44*s.area, kind:"slash", ang:d<0?Math.PI:0,
          life:0.18, color:w.def.color, dmg:s.dmg, owner:p, once:true,
          lifesteal:w.def.lifesteal, critChance:w.def.critChance});
      }
      A.beep(300,.07,"sawtooth",.03);
    }
  };

  /* ---------------- 2. Varita rúnica: apunta al más cercano ---------------- */
  W.varita = {
    name:"Varita Rúnica", glyph:"✦", color:"#8FA8FF", spr:"b_runa",
    desc:"Dispara sola al enemigo más cercano. Nunca falla el rumbo.",
    base:{cd:1.10, dmg:16, count:1, speed:340, pierce:1, area:1},
    ups:[U("+1 runa",{count:1}), U("+7 de daño",{dmg:7}), U("−0,12 s de recarga",{cd:-.12}),
         U("+1 runa",{count:1}), U("+9 de daño",{dmg:9}), U("−0,12 s de recarga",{cd:-.12}),
         U("+1 runa",{count:1})],
    fire:function(p,w,s){
      for(var i=0;i<s.count;i++){
        var f = A.nearest(p.x, p.y, 520);
        var ang = f ? Math.atan2(f.y-p.y, f.x-p.x) + (i?A.rf(-.14,.14):0) : A.rf(0,6.283);
        A.shoot({x:p.x,y:p.y,ang:ang,sp:s.speed,dmg:s.dmg,pierce:s.pierce,
          life:2.0*s.duration,r:6*s.area,spr:w.def.spr,owner:p,rot:true});
      }
      A.beep(680,.05,"triangle",.025);
    }
  };

  /* ---------------- 3. Daga: rápida, hacia donde caminas ---------------- */
  W.daga = {
    name:"Daga", glyph:"⋔", color:"#C9CEDC", spr:"b_daga",
    desc:"Sale disparada hacia donde caminas. Rápida y barata.",
    base:{cd:0.58, dmg:12, count:1, speed:460, pierce:1, area:1, spread:.12},
    ups:[U("+1 daga",{count:1}), U("+5 de daño",{dmg:5}), U("−0,08 s de recarga",{cd:-.08}),
         U("+1 daga",{count:1}), U("atraviesa 1 enemigo más",{pierce:1}),
         U("+7 de daño",{dmg:7}), U("+1 daga",{count:1})],
    fire:function(p,w,s){
      var base = Math.atan2(p.aimy, p.aimx), n = s.count;
      for(var i=0;i<n;i++){
        var off = (n===1) ? 0 : (i-(n-1)/2)*(s.spread||.12);
        A.shoot({x:p.x,y:p.y,ang:base+off,sp:s.speed,dmg:s.dmg,pierce:s.pierce,
          life:1.5*s.duration,r:5*s.area,spr:w.def.spr,owner:p,rot:true});
      }
      A.beep(900,.04,"square",.02);
    }
  };

  /* ---------------- 4. Hacha: vuela en arco, mucho daño y área ---------------- */
  W.hacha = {
    name:"Hacha", glyph:"⌁", color:"#9AA0B0", spr:"b_hacha",
    desc:"Sube en arco y cae. Daño alto y atraviesa hordas enteras.",
    base:{cd:1.60, dmg:40, count:1, speed:300, pierce:5, area:1},
    ups:[U("+1 hacha",{count:1}), U("+16 de daño",{dmg:16}), U("atraviesa 2 más",{pierce:2}),
         U("+1 hacha",{count:1}), U("+20 de daño",{dmg:20}), U("−0,2 s de recarga",{cd:-.2}),
         U("+1 hacha",{count:1})],
    fire:function(p,w,s){
      for(var i=0;i<s.count;i++){
        A.shoot({x:p.x,y:p.y-8,ang:-1.571+A.rf(-.5,.5),sp:s.speed,dmg:s.dmg,pierce:s.pierce,
          life:2.6*s.duration,r:11*s.area,spr:w.def.spr,owner:p,behavior:"arc",spin:9});
      }
      A.beep(220,.07,"sawtooth",.03);
    }
  };

  /* ---------------- 5. Cruz: bumerán al más cercano ---------------- */
  W.cruz = {
    name:"Cruz", glyph:"✚", color:"#E5C34A", spr:"b_cruz",
    desc:"Vuela hacia el enemigo más cercano y vuelve a tu mano.",
    base:{cd:1.40, dmg:20, count:1, speed:300, pierce:99, area:1},
    ups:[U("+1 cruz",{count:1}), U("+9 de daño",{dmg:9}), U("+25% de área",{area:.25}),
         U("+1 cruz",{count:1}), U("+11 de daño",{dmg:11}), U("−0,2 s de recarga",{cd:-.2}),
         U("+1 cruz",{count:1})],
    fire:function(p,w,s){
      for(var i=0;i<s.count;i++){
        var f = A.nearest(p.x, p.y, 520);
        var ang = f ? Math.atan2(f.y-p.y, f.x-p.x) + (i*0.5) : A.rf(0,6.283);
        A.shoot({x:p.x,y:p.y,ang:ang,sp:s.speed,dmg:s.dmg,pierce:99,
          life:3.0*s.duration,r:10*s.area,spr:w.def.spr,owner:p,behavior:"boomerang",
          spin:7,critChance:w.def.critChance});
      }
      A.beep(520,.06,"triangle",.025);
    }
  };

  /* ---------------- 6. Biblia: orbita alrededor ---------------- */
  W.biblia = {
    name:"Biblia", glyph:"◈", color:"#C08BEF", spr:"b_biblia",
    desc:"Tomos que giran a tu alrededor y trituran lo que rozan.",
    base:{cd:3.4, dmg:16, count:1, speed:2.4, area:1, radius:70, active:2.0},
    ups:[U("+1 tomo",{count:1}), U("+7 de daño",{dmg:7}), U("+0,6 s girando",{active:.6}),
         U("+1 tomo",{count:1}), U("órbita más amplia",{radius:16}), U("+10 de daño",{dmg:10}),
         U("+1 tomo",{count:1})],
    persistent:true,
    tick:function(p,w,s,dt){
      w.on = (w.on||0) - dt; w.t = (w.t||0) - dt;
      if(w.t <= 0 && w.on <= 0){ w.t = s.cd; w.on = (w.def && w.def.always) ? 999 : s.active*s.duration; A.beep(420,.08,"triangle",.02); }
      if(w.on <= 0) return;
      w.phase = (w.phase||0) + dt*s.speed;
      var rad = s.radius*s.area;
      for(var i=0;i<s.count;i++){
        var a = w.phase + (i/s.count)*6.283;
        var ox = p.x+Math.cos(a)*rad, oy = p.y+Math.sin(a)*rad;
        w.pos = w.pos || []; w.pos[i] = {x:ox, y:oy, a:a};
        A.hitCircle(ox, oy, 15*s.area, s.dmg, p, (ox-p.x)*.4, (oy-p.y)*.4, "biblia"+i, .32);
      }
      w.count = s.count;
    },
    draw:function(p,w,g){
      if(!(w.on > 0) || !w.pos) return;
      var spr = V.sprite(w.def.spr||"b_biblia", 0);
      for(var i=0;i<w.count;i++){
        var o = w.pos[i]; if(!o) continue;
        g.save(); g.translate(o.x, o.y); g.rotate(o.a);
        g.drawImage(spr, -spr.width/2, -spr.height/2); g.restore();
      }
    }
  };

  /* ---------------- 7. Vara de fuego: enemigo al azar, daño bestial ---------------- */
  W.varafuego = {
    name:"Vara de Fuego", glyph:"❂", color:"#FF8A3C", spr:"b_fuego",
    desc:"Escupe una bola de fuego a un enemigo al azar. Duele de verdad.",
    base:{cd:1.9, dmg:44, count:1, speed:260, pierce:1, area:1},
    ups:[U("+1 llama",{count:1}), U("+18 de daño",{dmg:18}), U("−0,25 s de recarga",{cd:-.25}),
         U("+1 llama",{count:1}), U("+22 de daño",{dmg:22}), U("+30% de área",{area:.3}),
         U("+1 llama",{count:1})],
    fire:function(p,w,s){
      for(var i=0;i<s.count;i++){
        var f = A.randomFoe(p, 520);
        var ang = f ? Math.atan2(f.y-p.y, f.x-p.x) : A.rf(0,6.283);
        A.shoot({x:p.x,y:p.y,ang:ang,sp:s.speed,dmg:s.dmg,pierce:s.pierce,
          life:2.4*s.duration,r:10*s.area,spr:w.def.spr,owner:p,rot:true,
          blast:w.def.blast ? 52*s.area : 0});
      }
      A.beep(160,.1,"sawtooth",.035);
    }
  };

  /* ---------------- 8. Ajo: halo de daño constante ---------------- */
  W.ajo = {
    name:"Ajo Bendito", glyph:"◉", color:"#E5B95C", spr:null,
    desc:"Un halo hediondo que quema y empuja a todo el que se acerca.",
    base:{cd:0.80, dmg:11, area:1, radius:76},
    ups:[U("halo más amplio",{radius:14}), U("+5 de daño",{dmg:5}), U("−0,1 s entre golpes",{cd:-.1}),
         U("halo más amplio",{radius:14}), U("+6 de daño",{dmg:6}), U("−0,1 s entre golpes",{cd:-.1}),
         U("+8 de daño",{dmg:8})],
    persistent:true,
    tick:function(p,w,s,dt){
      w.t = (w.t||0) - dt;
      w.rad = s.radius*s.area;
      if(w.t > 0) return;
      w.t = s.cd;
      var n = A.hitCircle(p.x, p.y, w.rad, s.dmg, p, 0, 0, "ajo", 0, true);
      if(n && w.def.soul) p.hp = Math.min(p.maxhp, p.hp + n*0.6);
    },
    draw:function(p,w,g){
      if(!w.rad) return;
      var steps = 26, r = w.rad;
      g.fillStyle = w.def.soul ? "rgba(194,38,58,.13)" : "rgba(229,185,92,.10)";
      g.fillRect(p.x-r, p.y-r*0.62, r*2, r*1.24);
      g.fillRect(p.x-r*0.62, p.y-r, r*1.24, r*2);
      g.fillStyle = w.def.color;
      for(var i=0;i<steps;i++){
        var a = (i/steps)*6.283 + (performance.now()/900);
        g.fillRect(Math.round(p.x+Math.cos(a)*r)-2, Math.round(p.y+Math.sin(a)*r)-2, 4, 4);
      }
    }
  };

  /* ---------------- 9. Agua bendita: charcos que dañan ---------------- */
  W.agua = {
    name:"Agua Bendita", glyph:"◍", color:"#7CC6FF", spr:null,
    desc:"Frascos que estallan y dejan charcos ardiendo en el suelo.",
    base:{cd:2.6, dmg:12, count:1, area:1, radius:44, life:3.4},
    ups:[U("+1 frasco",{count:1}), U("+5 de daño",{dmg:5}), U("+1 s de duración",{life:1}),
         U("+1 frasco",{count:1}), U("charco más amplio",{radius:12}), U("−0,4 s de recarga",{cd:-.4}),
         U("+1 frasco",{count:1})],
    fire:function(p,w,s){
      for(var i=0;i<s.count;i++){
        var ang = A.rf(0,6.283), d = A.rf(60,190);
        A.area({x:p.x+Math.cos(ang)*d, y:p.y+Math.sin(ang)*d, r:s.radius*s.area,
          kind:"pool", life:s.life*s.duration, dmg:s.dmg, owner:p, color:w.def.color,
          interval:0.35, follow:w.def.sticky ? p : null});
      }
      A.beep(520,.09,"triangle",.025);
    }
  };

  /* ---------------- 10. Trazarunas: atraviesa y rebota ---------------- */
  W.trazarunas = {
    name:"Trazarunas", glyph:"◇", color:"#46E0C8", spr:"b_runatrace",
    desc:"Atraviesa cuerpos y rebota en los bordes hasta agotarse.",
    base:{cd:3.0, dmg:20, count:1, speed:300, pierce:99, area:1, life:4.5},
    ups:[U("+1 traza",{count:1}), U("+9 de daño",{dmg:9}), U("+1,2 s de vuelo",{life:1.2}),
         U("+1 traza",{count:1}), U("+11 de daño",{dmg:11}), U("−0,4 s de recarga",{cd:-.4}),
         U("+1 traza",{count:1})],
    fire:function(p,w,s){
      for(var i=0;i<s.count;i++){
        A.shoot({x:p.x,y:p.y,ang:A.rf(0,6.283),sp:s.speed,dmg:s.dmg,pierce:99,
          life:s.life*s.duration,r:9*s.area,spr:w.def.spr,owner:p,behavior:"wall",
          spin:5,blast:w.def.doom?60:0,cool:0.4});
      }
      A.beep(760,.07,"square",.025);
    }
  };

  /* ---------------- 11. Anillo de rayos: cae sobre enemigos al azar ---------------- */
  W.rayos = {
    name:"Anillo de Rayos", glyph:"↯", color:"#FFE066", spr:null,
    desc:"Rayos que caen sobre enemigos al azar en toda la pantalla.",
    base:{cd:2.6, dmg:38, count:2, area:1, radius:36},
    ups:[U("+1 rayo",{count:1}), U("+14 de daño",{dmg:14}), U("−0,3 s de recarga",{cd:-.3}),
         U("+1 rayo",{count:1}), U("impacto más amplio",{radius:10}), U("+18 de daño",{dmg:18}),
         U("+2 rayos",{count:2})],
    fire:function(p,w,s){
      var hits = 0;
      for(var i=0;i<s.count;i++){
        var f = A.randomFoe(p, 620);
        if(!f) continue;
        A.area({x:f.x, y:f.y, r:s.radius*s.area, kind:"bolt", life:.26, dmg:s.dmg,
          owner:p, color:w.def.color, once:true});
        if(w.def.loop) A.area({x:f.x+A.rf(-60,60), y:f.y+A.rf(-60,60), r:s.radius*s.area*.8,
          kind:"bolt", life:.26, dmg:s.dmg*.7, owner:p, color:"#FFF3B0", once:true});
        hits++;
      }
      if(hits){ A.beep(1300,.06,"square",.03); A.shakeBy(2); }
    }
  };

  /* ---------------- 12. Pentagrama: borra la pantalla ---------------- */
  W.pentagrama = {
    name:"Pentagrama", glyph:"☆", color:"#C08BEF", spr:null,
    desc:"Borra de la existencia todo lo que hay en pantalla. Recarga eterna.",
    base:{cd:30, dmg:9999, count:1, area:1},
    ups:[U("−4 s de recarga",{cd:-4}), U("−3 s de recarga",{cd:-3}), U("−3 s de recarga",{cd:-3}),
         U("−2,5 s de recarga",{cd:-2.5}), U("−2,5 s de recarga",{cd:-2.5}),
         U("−2 s de recarga",{cd:-2}), U("−2 s de recarga",{cd:-2})],
    fire:function(p,w,s){
      A.wipe(p, s.dmg, w.def.moon);
      A.area({x:p.x,y:p.y,r:40,kind:"flash",life:.5,dmg:0,owner:p,color:w.def.color});
      A.shakeBy(14);
      A.beep(90,.7,"sawtooth",.07);
    }
  };

  /* ---------------- 13/14. Los dos pájaros ---------------- */
  function birdTick(p, w, s, dt){
    w.phase = (w.phase||(w.def.dark?3.14:0)) + dt*1.3;
    var rad = 118*s.area;
    w.pos = [];
    for(var i=0;i<s.count;i++){
      var a = w.phase + (i/s.count)*6.283;
      var ox = p.x+Math.cos(a)*rad, oy = p.y+Math.sin(a)*rad*0.62;
      w.pos.push({x:ox,y:oy,a:a});
      A.hitCircle(ox, oy, 20*s.area, s.dmg, p, 0, 0, (w.def.dark?"eb":"pe")+i, .5);
    }
    w.t = (w.t||0) - dt;
    if(w.t <= 0){
      w.t = s.cd;
      for(var k=0;k<w.pos.length;k++)
        A.shoot({x:w.pos[k].x,y:w.pos[k].y,ang:w.def.dark?w.pos[k].a:1.571,sp:250,dmg:s.dmg,
          pierce:1,life:1.4,r:6,spr:w.def.spr,owner:p,rot:true});
    }
  }
  function birdDraw(p, w, g){
    if(!w.pos) return;
    var spr = V.sprite(w.def.spr, Math.floor(performance.now()/90)%4);
    for(var i=0;i<w.pos.length;i++){
      var o = w.pos[i];
      g.drawImage(spr, Math.round(o.x-spr.width/2), Math.round(o.y-spr.height/2));
    }
  }
  W.peachone = {
    name:"Ala Blanca", glyph:"➶", color:"#E8EEFF", spr:"b_pajaro",
    desc:"Un ave de luz que ronda y descarga sobre los que te siguen.",
    base:{cd:1.6, dmg:16, count:1, area:1},
    ups:[U("+8 de daño",{dmg:8}), U("+1 ave",{count:1}), U("+20% de área",{area:.2}),
         U("+10 de daño",{dmg:10}), U("−0,3 s entre descargas",{cd:-.3}),
         U("+1 ave",{count:1}), U("+14 de daño",{dmg:14})],
    persistent:true, tick:birdTick, draw:birdDraw
  };
  W.ebano = {
    name:"Ala de Ébano", glyph:"➷", color:"#3A3A4E", spr:"b_pajaro_neg", dark:true,
    desc:"Su gemela negra, siempre en el lado opuesto.",
    base:{cd:1.6, dmg:16, count:1, area:1},
    ups:[U("+8 de daño",{dmg:8}), U("+1 ave",{count:1}), U("+20% de área",{area:.2}),
         U("+10 de daño",{dmg:10}), U("−0,3 s entre descargas",{cd:-.3}),
         U("+1 ave",{count:1}), U("+14 de daño",{dmg:14})],
    persistent:true, tick:birdTick, draw:birdDraw
  };

  /* ---------------- 15. Lanceta: congela en línea ---------------- */
  W.lanceta = {
    name:"Lanceta del Reloj", glyph:"⊣", color:"#7CC6FF", spr:null,
    desc:"Lanza una línea que detiene el tiempo de todo lo que atraviesa.",
    base:{cd:4.0, dmg:0, count:1, area:1, freeze:2.2, range:300},
    ups:[U("+1 lanzamiento",{count:1}), U("+0,6 s congelado",{freeze:.6}), U("−0,6 s de recarga",{cd:-.6}),
         U("+1 lanzamiento",{count:1}), U("+0,6 s congelado",{freeze:.6}), U("más alcance",{range:80}),
         U("−0,8 s de recarga",{cd:-.8})],
    fire:function(p,w,s){
      var dirs = [Math.atan2(p.aimy,p.aimx)];
      if(s.count > 1) dirs.push(dirs[0]+3.1416);
      if(s.count > 2) dirs.push(dirs[0]+1.5708, dirs[0]-1.5708);
      for(var i=0;i<dirs.length;i++){
        A.area({x:p.x, y:p.y, w:s.range*s.area, h:34, kind:"lance", ang:dirs[i],
          life:.35, dmg:w.def.corridor ? 9999 : 0, owner:p, color:w.def.color,
          freeze:s.freeze*s.duration, halve:w.def.corridor, once:true, fromEdge:true});
      }
      A.beep(1500,.12,"sine",.03);
    }
  };

  /* ---------------- 16. Laurel: escudo que absorbe ---------------- */
  W.laurel = {
    name:"Laurel", glyph:"◯", color:"#5FBF6A", spr:null,
    desc:"Una corona que absorbe los golpes que iban a matarte.",
    base:{cd:8.0, dmg:0, count:1, area:1, charges:1},
    ups:[U("+1 carga",{charges:1}), U("−1,2 s de recarga",{cd:-1.2}), U("+1 carga",{charges:1}),
         U("−1,2 s de recarga",{cd:-1.2}), U("+1 carga",{charges:1}),
         U("−1,2 s de recarga",{cd:-1.2}), U("+1 carga",{charges:1})],
    persistent:true,
    tick:function(p,w,s,dt){
      w.max = Math.round(s.charges);
      if(w.ch === undefined) w.ch = w.max;
      w.t = (w.t||0) - dt;
      if(w.ch < w.max && w.t <= 0){
        w.ch++; w.t = s.cd;
        A.beep(880,.1,"sine",.03);
      }
      p.shield = w;
    },
    draw:function(p,w,g){
      if(!w.ch) return;
      var r = 24;
      g.fillStyle = w.def.shroud ? "rgba(194,38,58,.55)" : "rgba(95,191,106,.5)";
      for(var i=0;i<w.ch;i++){
        var a = performance.now()/500 + (i/w.ch)*6.283;
        g.fillRect(Math.round(p.x+Math.cos(a)*r)-3, Math.round(p.y+Math.sin(a)*r)-3, 6, 6);
      }
    }
  };

  /* ---------------- 17. Canción: ondas verticales ---------------- */
  W.cancion = {
    name:"Canción de Maná", glyph:"≋", color:"#C08BEF", spr:null,
    desc:"Ondas que suben y bajan barriendo columnas enteras.",
    base:{cd:3.4, dmg:26, count:1, area:1, life:1.6, width:56},
    ups:[U("+11 de daño",{dmg:11}), U("+1 onda",{count:1}), U("+0,5 s de duración",{life:.5}),
         U("columna más ancha",{width:18}), U("+14 de daño",{dmg:14}), U("−0,5 s de recarga",{cd:-.5}),
         U("+1 onda",{count:1})],
    fire:function(p,w,s){
      for(var i=0;i<s.count;i++){
        var off = (i-(s.count-1)/2)*70;
        A.area({x:p.x+off, y:p.y, w:s.width*s.area, h:900, kind:"wave", ang:0,
          life:s.life*s.duration, dmg:s.dmg, owner:p, color:w.def.color,
          interval:0.25, slow:w.def.slow});
      }
      A.beep(600,.25,"sine",.03);
    }
  };

  /* ---------------- 18. Gatos: proyectiles erráticos ---------------- */
  W.gatos = {
    name:"Gatos Amargos", glyph:"∿", color:"#D8B070", spr:"b_gato",
    desc:"Se van por su cuenta, hacen lo que quieren y muerden a quien pillan.",
    base:{cd:3.2, dmg:22, count:1, speed:150, pierce:99, area:1, life:6},
    ups:[U("+1 gato",{count:1}), U("+9 de daño",{dmg:9}), U("+2 s de merodeo",{life:2}),
         U("+1 gato",{count:1}), U("+11 de daño",{dmg:11}), U("−0,5 s de recarga",{cd:-.5}),
         U("+1 gato",{count:1})],
    fire:function(p,w,s){
      for(var i=0;i<s.count;i++){
        A.shoot({x:p.x,y:p.y,ang:A.rf(0,6.283),sp:s.speed,dmg:s.dmg,pierce:99,
          life:s.life*s.duration,r:10*s.area,spr:w.def.spr,owner:p,behavior:"wander",
          cool:0.5, greedy:w.def.greedy});
      }
      A.beep(700,.08,"triangle",.02);
    }
  };

  /* ---------------- 19/20. Las dos pistolas ---------------- */
  W.pistola = {
    name:"Pistola de Cebo", glyph:"⌐", color:"#FFE066", spr:"b_bala",
    desc:"Cuatro tiros en cruz, sin apuntar a nada en concreto.",
    base:{cd:1.5, dmg:14, count:1, speed:420, pierce:1, area:1},
    ups:[U("+6 de daño",{dmg:6}), U("+1 ronda",{count:1}), U("−0,2 s de recarga",{cd:-.2}),
         U("+8 de daño",{dmg:8}), U("+1 ronda",{count:1}), U("atraviesa 1 más",{pierce:1}),
         U("+10 de daño",{dmg:10})],
    fire:function(p,w,s){
      for(var r=0;r<s.count;r++) for(var i=0;i<4;i++)
        A.shoot({x:p.x,y:p.y,ang:i*1.5708+r*0.2,sp:s.speed,dmg:s.dmg,pierce:s.pierce,
          life:1.6*s.duration,r:5*s.area,spr:w.def.spr,owner:p,rot:true});
      A.beep(1000,.05,"square",.025);
    }
  };
  W.escopeta = {
    name:"Trabuco del Gorrión", glyph:"⌙", color:"#FFD36B", spr:"b_bala",
    desc:"Cuatro tiros en aspa. Junto a la pistola, algo peor nace.",
    base:{cd:1.5, dmg:14, count:1, speed:420, pierce:1, area:1},
    ups:[U("+6 de daño",{dmg:6}), U("+1 ronda",{count:1}), U("−0,2 s de recarga",{cd:-.2}),
         U("+8 de daño",{dmg:8}), U("+1 ronda",{count:1}), U("atraviesa 1 más",{pierce:1}),
         U("+10 de daño",{dmg:10})],
    fire:function(p,w,s){
      for(var r=0;r<s.count;r++) for(var i=0;i<4;i++)
        A.shoot({x:p.x,y:p.y,ang:i*1.5708+0.7854+r*0.2,sp:s.speed,dmg:s.dmg,pierce:s.pierce,
          life:1.6*s.duration,r:5*s.area,spr:w.def.spr,owner:p,rot:true});
      A.beep(820,.05,"square",.025);
    }
  };

  V.WEAPON_KEYS = Object.keys(W);

  /* ================= EVOLUCIONES ================= */
  function evo(base, over){
    var d = {};
    for(var k in base) d[k] = base[k];
    for(var k2 in over) d[k2] = over[k2];
    d.evo = true;
    d.base = {};
    for(var b in base.base) d.base[b] = base.base[b];
    if(over.base) for(var b2 in over.base) d.base[b2] = over.base[b2];
    d.ups = null;
    return d;
  }

  var E = V.EVOLVED = {
    sangre: evo(W.latigo, {name:"Lágrima Sangrienta", color:"#FF2E46", lifesteal:true, critChance:.12,
      desc:"Cada barrido te devuelve parte de la sangre que derrama.",
      base:{cd:.7, dmg:66, count:2, area:1.5, range:104}}),
    varitasagrada: evo(W.varita, {name:"Varita Sagrada", color:"#DCE8FF",
      desc:"Runas sin descanso. No hay recarga que valga.",
      base:{cd:.16, dmg:34, count:1, speed:420, pierce:1, area:1}}),
    milfilos: evo(W.daga, {name:"Mil Filos", color:"#FFFFFF",
      desc:"Un chorro continuo de acero hacia donde caminas.",
      base:{cd:.1, dmg:16, count:3, speed:520, pierce:1, area:1, spread:.2}}),
    espiral: evo(W.hacha, {name:"Espiral de Muerte", color:"#D8DCE8",
      desc:"Hachas hacia todas partes, sin arco y sin piedad.",
      base:{cd:2.2, dmg:64, count:8, speed:320, pierce:99, area:1.4}, spiral:true,
      fire:function(p,w,s){
        for(var i=0;i<s.count;i++)
          A.shoot({x:p.x,y:p.y,ang:(i/s.count)*6.283,sp:s.speed,dmg:s.dmg,pierce:99,
            life:2.4*s.duration,r:12*s.area,spr:"b_hacha",owner:p,spin:11});
        A.beep(180,.14,"sawtooth",.04);
      }}),
    espadacelestial: evo(W.cruz, {name:"Espada Celestial", color:"#FFF3D0", critChance:.35,
      desc:"Cruces que vuelven doradas y golpean al doble.",
      base:{cd:.8, dmg:46, count:3, speed:340, pierce:99, area:1.5}}),
    visperas: evo(W.biblia, {name:"Vísperas Impías", color:"#E0B0FF", always:true, spr:"b_biblia",
      desc:"Los tomos ya no se detienen nunca.",
      base:{cd:.1, dmg:38, count:4, speed:3.0, area:1.5, radius:86, active:999}}),
    infierno: evo(W.varafuego, {name:"Fuego Infernal", color:"#FFB03C", blast:true,
      desc:"Una bola enorme que atraviesa la horda y estalla al final.",
      base:{cd:2.2, dmg:120, count:1, speed:210, pierce:99, area:2.0}}),
    devoraalmas: evo(W.ajo, {name:"Devora Almas", color:"#C2263A", soul:true,
      desc:"El halo se alimenta: cada muerte cercana te cura.",
      base:{cd:.35, dmg:26, area:1.6, radius:76}}),
    laborra: evo(W.agua, {name:"La Borra", color:"#46E0C8", sticky:true,
      desc:"Los charcos ya no se quedan quietos: te siguen.",
      base:{cd:1.1, dmg:26, count:3, area:1.5, radius:52, life:4}}),
    sinfuturo: evo(W.trazarunas, {name:"Sin Futuro", color:"#FF6A3C", doom:true,
      desc:"Cada rebote deja una explosión detrás.",
      base:{cd:1.6, dmg:36, count:3, speed:340, pierce:99, area:1.3, life:5}}),
    bucle: evo(W.rayos, {name:"Bucle de Trueno", color:"#FFF3B0", loop:true,
      desc:"Cada rayo golpea dos veces, y la segunda busca sola.",
      base:{cd:1.5, dmg:58, count:4, area:1.4, radius:44}}),
    lunaesplendida: evo(W.pentagrama, {name:"Luna Espléndida", color:"#FFE9B0", moon:true,
      desc:"Además de borrar la pantalla, se queda con todo lo que sueltan.",
      base:{cd:18, dmg:9999, count:1, area:1}}),
    hambre: evo(W.gatos, {name:"Hambre Voraz", color:"#FFD36B", greedy:true,
      desc:"Los gatos ahora cobran: cada mordisco suelta oro.",
      base:{cd:1.8, dmg:44, count:4, speed:190, pierce:99, area:1.4, life:8}}),
    mannajja: evo(W.cancion, {name:"Mannajja", color:"#A98BE0", slow:true,
      desc:"La canción arrastra: lo que toca se mueve a la mitad.",
      base:{cd:1.8, dmg:50, count:3, area:1.5, life:2.4, width:74}}),
    corredor: evo(W.lanceta, {name:"Corredor Infinito", color:"#FFFFFF", corridor:true,
      desc:"Ya no congela: parte por la mitad la vida de lo que cruza.",
      base:{cd:2.4, dmg:9999, count:4, area:1.4, freeze:1.4, range:380}}),
    sudario: evo(W.laurel, {name:"Sudario Carmesí", color:"#C2263A", shroud:true,
      desc:"Nada te quita más de diez de vida por golpe, y devuelve el daño.",
      base:{cd:3.0, dmg:0, count:1, area:1, charges:5}}),
    /* uniones */
    vandalier: evo(W.peachone, {name:"Vandalier", color:"#FFE9B0", spr:"b_pajaro", union:true,
      desc:"Las dos alas, blanca y negra, cazando juntas.",
      base:{cd:.7, dmg:44, count:3, area:1.8}}),
    iragemela: evo(W.pistola, {name:"Ira Gemela", color:"#FFF3B0", union:true,
      desc:"Ocho cañones a la vez, girando sin parar.",
      base:{cd:.45, dmg:34, count:1, speed:520, pierce:3, area:1.3},
      fire:function(p,w,s){
        w.spin = (w.spin||0) + 0.5;
        for(var i=0;i<8;i++)
          A.shoot({x:p.x,y:p.y,ang:i*0.7854+w.spin,sp:s.speed,dmg:s.dmg,pierce:s.pierce,
            life:1.6*s.duration,r:6*s.area,spr:"b_bala",owner:p,rot:true});
        A.beep(1100,.05,"square",.03);
      }})
  };

  /* base → pasivo requerido → resultado.
     Las uniones necesitan las dos armas al nivel máximo. */
  V.EVO_RULES = [
    {from:"latigo",      passive:"corazon",    to:"sangre"},
    {from:"varita",      passive:"tomo",       to:"varitasagrada"},
    {from:"daga",        passive:"brazal",     to:"milfilos"},
    {from:"hacha",       passive:"candelabro", to:"espiral"},
    {from:"cruz",        passive:"trebol",     to:"espadacelestial"},
    {from:"biblia",      passive:"encantador", to:"visperas"},
    {from:"varafuego",   passive:"espinaca",   to:"infierno"},
    {from:"ajo",         passive:"pomarola",   to:"devoraalmas"},
    {from:"agua",        passive:"iman",       to:"laborra"},
    {from:"trazarunas",  passive:"coraza",     to:"sinfuturo"},
    {from:"rayos",       passive:"duplicador", to:"bucle"},
    {from:"pentagrama",  passive:"corona",     to:"lunaesplendida"},
    {from:"gatos",       passive:"mascara",    to:"hambre"},
    {from:"cancion",     passive:"calavera",   to:"mannajja"},
    {from:"lanceta",     passive:"alas",       to:"corredor"},
    {from:"laurel",      passive:"tiramisu",   to:"sudario"},
    {from:"peachone",    with:"ebano",         to:"vandalier"},
    {from:"pistola",     with:"escopeta",      passive:"tiramisu", to:"iragemela"}
  ];

  // los evolucionados heredan tick/draw/fire del arma base si no los redefinen
  for(var ek in E){
    var d = E[ek];
    if(!d.spr && W[d.from]) d.spr = W[d.from].spr;
  }
})();
