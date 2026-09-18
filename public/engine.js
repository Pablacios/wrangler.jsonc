/* Marea de Verrath — motor: entidades, colisiones, oleadas y dibujado */
(function(){
  "use strict";
  var V = window.V = window.V || {};
  var G = V.game = {};

  var canvas, ctx, screenEl;
  var players = [], foes = [], bullets = [], areas = [], gems = [], drops = [], parts = [], floats = [];
  var runT = 0, kills = 0, runGold = 0, eventIdx = 0, streamT = [];
  var stage = null, stageKey = "distrito";
  var cam = {x:0,y:0}, zoom = 1, baseZoom = 1, shake = 0;
  var msgText = "", msgTime = 0;
  var hashMap = new Map(), CELL = 60, scratch = [];

  G.state = {running:false, paused:false, drafting:false, demo:true};
  G.players = players; G.foes = foes;
  G.get = function(){ return {runT:runT, kills:kills, runGold:runGold, foes:foes.length, stage:stage}; };

  function rf(a,b){ return a+Math.random()*(b-a); }
  function ri(a,b){ return a+Math.floor(Math.random()*(b-a+1)); }
  function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
  function hash2(x,y){
    var h = Math.imul(x|0, 0x27d4eb2d) ^ Math.imul(y|0, 0x165667b1);
    h = Math.imul(h ^ (h>>>15), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h>>>0) / 4294967296;
  }
  V.hash2 = hash2;

  var actx = null;
  function beep(f,d,t,v){
    try{
      if(!actx) actx = new (window.AudioContext||window.webkitAudioContext)();
      var o=actx.createOscillator(), g=actx.createGain();
      o.type=t||"square"; o.frequency.value=f;
      g.gain.setValueAtTime(v||.04, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime+d);
      o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime+d);
    }catch(e){}
  }
  function burst(x,y,c,n){
    if(parts.length>500) n=Math.min(n,3);
    for(var i=0;i<n;i++){
      var a=rf(0,6.283), s=rf(30,180);
      parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rf(.18,.45),c:c,s:rf(2,4)});
    }
  }
  function floatText(x,y,t,c){ if(floats.length>45) return; floats.push({x:x,y:y,t:t,c:c,life:.85}); }
  function say(t){ msgText=t; msgTime=3.4; }
  G.say = say;

  /* ---------------- rejilla espacial ---------------- */
  function rebuildHash(){
    hashMap.clear();
    for(var i=0;i<foes.length;i++){
      var f=foes[i];
      var k=(Math.floor(f.x/CELL)*73856093)^(Math.floor(f.y/CELL)*19349663);
      var b=hashMap.get(k);
      if(b) b.push(i); else hashMap.set(k,[i]);
    }
  }
  function queryNear(x,y,r,out){
    out.length=0;
    var x0=Math.floor((x-r)/CELL), x1=Math.floor((x+r)/CELL);
    var y0=Math.floor((y-r)/CELL), y1=Math.floor((y+r)/CELL);
    for(var cy=y0;cy<=y1;cy++) for(var cx=x0;cx<=x1;cx++){
      var b=hashMap.get((cx*73856093)^(cy*19349663));
      if(!b) continue;
      for(var i=0;i<b.length;i++) out.push(b[i]);
    }
    return out;
  }
  function view(){
    return {x:cam.x, y:cam.y, hw:canvas.width/(2*zoom), hh:canvas.height/(2*zoom)};
  }

  /* ---------------- estadísticas ---------------- */
  function baseStats(){
    return {might:1, area:1, speed:1, duration:1, amount:0, cooldown:1, armor:0,
      maxHealth:1, recovery:0, moveSpeed:1, magnet:1, luck:1, growth:1, greed:1,
      curse:1, revival:0};
  }
  function recalc(p){
    var h = V.HEROES[p.hero], st = baseStats(), k;
    for(k in h.mods) st[k] = (st[k]||1) * h.mods[k];
    for(k in p.passives){
      var def = V.PASSIVES[k], lv = p.passives[k];
      if(!def) continue;
      if(def.stat === "amount" || def.stat === "armor" || def.stat === "revival" || def.stat === "recovery")
        st[def.stat] += def.step*lv;
      else st[def.stat] += def.step*lv;
    }
    var m = V.meta || {};
    st.maxHealth *= 1 + (m.vida||0)*0.12;
    st.might     *= 1 + (m.dano||0)*0.06;
    st.moveSpeed *= 1 + (m.paso||0)*0.04;
    st.magnet    *= 1 + (m.iman||0)*0.25;
    st.greed     *= 1 + (m.codicia||0)*0.15;
    st.luck      *= 1 + (m.suerte||0)*0.10;
    p.st = st;
    var ratio = p.maxhp ? p.hp/p.maxhp : 1;
    p.maxhp = h.hp * st.maxHealth;
    p.hp = Math.min(p.maxhp, p.maxhp*ratio);
    p.speed = h.speed * st.moveSpeed;
    p.magnet = 82 * st.magnet;
  }
  G.recalc = recalc;

  function weaponStats(p,w){
    var s={}, k, b=w.def.base;
    for(k in b) s[k]=b[k];
    if(w.def.ups) for(var i=0;i<w.lvl-1 && i<w.def.ups.length;i++){
      var up=w.def.ups[i];
      for(k in up){ if(k==="text") continue; s[k]=(s[k]||0)+up[k]; }
    }
    var st=p.st;
    s.dmg = (s.dmg||0)*st.might;
    s.area = (s.area||1)*st.area;
    s.duration = st.duration;
    if(s.speed !== undefined && w.def.persistent !== true) s.speed *= st.speed;
    s.cd = Math.max(.05, (s.cd||1)*st.cooldown);
    if(s.count !== undefined) s.count = Math.max(1, Math.round(s.count + st.amount));
    return s;
  }
  G.weaponStats = weaponStats;

  /* ---------------- API para las armas ---------------- */
  function shoot(o){
    bullets.push({
      x:o.x, y:o.y, vx:Math.cos(o.ang)*o.sp, vy:Math.sin(o.ang)*o.sp,
      sp:o.sp, ang:o.ang, dmg:o.dmg, pierce:o.pierce||1, life:o.life||2,
      r:o.r||6, spr:o.spr, owner:o.owner, behavior:o.behavior||"straight",
      rot:o.rot, spin:o.spin||0, rotA:o.ang, blast:o.blast||0, cool:o.cool||0,
      greedy:o.greedy, critChance:o.critChance, hit:null, t:0, home:o.owner,
      nid:(++nidSeq)&65535
    });
  }
  function area(o){
    o.max = o.life; o.t = 0; o.hitSet = null; o.acc = 0;
    areas.push(o);
    return o;
  }
  function hitCircle(x,y,r,dmg,owner,kx,ky,tag,cd,countKills){
    queryNear(x,y,r+20,scratch);
    var killed=0;
    for(var i=0;i<scratch.length;i++){
      var f=foes[scratch[i]];
      if(!f||f.dead) continue;
      if(tag){
        f.tags = f.tags||{};
        if(f.tags[tag] > 0) continue;
      }
      if(Math.hypot(f.x-x,f.y-y) > r+f.r) continue;
      if(tag) f.tags[tag] = cd||.3;
      var before = f.hp;
      damage(scratch[i], dmg, owner, kx, ky);
      if(before>0 && f.dead) killed++;
    }
    return countKills ? killed : 0;
  }
  function nearest(x,y,range,skip){
    var best=null, bd=range*range;
    queryNear(x,y,range,scratch);
    for(var i=0;i<scratch.length;i++){
      var f=foes[scratch[i]];
      if(!f||f.dead||f.def.reaper||f===skip) continue;
      var d=(f.x-x)*(f.x-x)+(f.y-y)*(f.y-y);
      if(d<bd){ bd=d; best=f; }
    }
    return best;
  }
  function randomFoe(p, range){
    var v=view(), tries=0;
    while(tries++ < 12){
      var f = foes[ri(0, foes.length-1)];
      if(!f || f.dead || f.def.reaper) continue;
      if(Math.abs(f.x-v.x) < v.hw && Math.abs(f.y-v.y) < v.hh) return f;
    }
    return nearest(p.x, p.y, range||500);
  }
  function wipe(p, dmg, collect){
    var v=view();
    for(var i=0;i<foes.length;i++){
      var f=foes[i];
      if(f.dead||f.def.reaper) continue;
      if(Math.abs(f.x-v.x) < v.hw && Math.abs(f.y-v.y) < v.hh) damage(i, dmg, p, 0, 0);
    }
    if(collect){
      for(var g=0;g<gems.length;g++){ gems[g].x = p.x; gems[g].y = p.y; }
      for(var d=0;d<drops.length;d++){ drops[d].x = p.x; drops[d].y = p.y; }
    }
  }
  V.bindApi({
    shoot:shoot, area:area, hitCircle:hitCircle, nearest:nearest, randomFoe:randomFoe,
    wipe:wipe, burst:burst, beep:beep, rf:rf, ri:ri, view:view,
    shakeBy:function(n){ shake = Math.max(shake, n); }
  });

  /* ---------------- enemigos ---------------- */
  var nidSeq = 0;
  function spawnFoe(type,x,y){
    var def = V.FOES[type];
    if(!def) return null;
    if(foes.length > 950 && !def.elite && !def.reaper) return null;
    var grow = def.reaper ? 1 : (1 + runT/440);
    var f = {x:x,y:y,type:type,def:def,r:def.r,
      hp:def.hp*grow, maxhp:def.hp*grow,
      speed:def.speed*(def.reaper?1:(1+runT/2800)),
      dmg:def.dmg*(def.reaper?1:(1+runT/900)),
      hit:0, kx:0, ky:0, freeze:0, slow:0, dead:false, tags:null,
      frame:ri(0,3), wob:rf(0,6.283), nid:(++nidSeq)&65535};
    foes.push(f);
    return f;
  }
  function damage(idx, dmg, owner, kx, ky, critChance){
    var f = foes[idx];
    if(!f || f.dead || f.def.reaper) return;
    var isCrit = false;
    if(critChance && owner && Math.random() < critChance*(owner.st.luck||1)){ dmg*=2; isCrit=true; }
    f.hp -= dmg; f.hit = .1;
    if(kx||ky){ var m = f.def.elite?0.12:1; f.kx += kx*m; f.ky += ky*m; }
    if((f.def.elite || isCrit) && Math.random()<0.4) floatText(f.x, f.y-f.r-6, Math.round(dmg), isCrit?"#FFE066":"#FFFFFF");
    if(f.hp <= 0) kill(idx, owner);
  }
  function kill(idx, owner){
    var f = foes[idx];
    if(f.dead) return;
    f.dead = true; kills++;
    if(owner) owner.kills++;
    burst(f.x, f.y, f.def.elite ? "#C2263A" : (stage ? stage.accent : "#8E1F2F"), f.def.elite?46:5);
    var st = owner ? owner.st : {greed:1, luck:1, curse:1};
    if(f.def.xp > 0) gems.push({x:f.x,y:f.y,v:f.def.xp*(st.curse||1),t:rf(0,6.28)});
    if(Math.random() < f.def.gold*(st.luck||1))
      drops.push({x:f.x,y:f.y,kind:"oro",v:Math.round(rf(3,10)*(st.greed||1))});
    if(Math.random() < 0.010*(st.luck||1)) drops.push({x:f.x,y:f.y,kind:"carne",v:1});
    if(f.def.elite){
      drops.push({x:f.x,y:f.y,kind:"cofre",v:1});
      drops.push({x:f.x+rf(-24,24),y:f.y+rf(-24,24),kind:"oro",v:Math.round(110*(st.greed||1))});
      shake = 9; say("El elite ha caído. Ha soltado un cofre.");
      beep(170,.45,"sawtooth",.06);
    }
  }
  G.spawnFoe = spawnFoe;

  /* ---------------- jugadores ---------------- */
  function makePlayer(slotIdx, slot, at){
    var h = V.HEROES[slot.hero];
    var p = {
      slot:slotIdx, hero:slot.hero, input:slot.input, color:h.color, spr:h.spr,
      x:at.x+rf(-30,30), y:at.y+rf(-30,30), r:11,
      hp:1, maxhp:1, xp:0, lvl:1, next:5, kills:0,
      weapons:[], passives:{}, st:baseStats(),
      aimx:1, aimy:0, walk:0, face:1, hurt:0, iframe:0, down:false, reviveProg:0,
      revivesUsed:0, regenAcc:0, shield:null
    };
    recalc(p);
    p.hp = p.maxhp;
    addWeapon(p, h.weapon);
    players.push(p);
    return p;
  }
  function addWeapon(p, key, replace, second){
    var def = V.WEAPONS[key] || V.EVOLVED[key];
    if(replace){
      for(var i=0;i<p.weapons.length;i++){
        if(p.weapons[i].key === replace){
          p.weapons[i] = {key:key, lvl:1, t:0, def:def};
          // la unión consume también la segunda arma
          if(second) for(var j=p.weapons.length-1;j>=0;j--)
            if(p.weapons[j].key === second) p.weapons.splice(j,1);
          return p.weapons[i];
        }
      }
    }
    var w = {key:key, lvl:1, t:0, def:def};
    p.weapons.push(w);
    return w;
  }
  function addPassive(p, key){
    p.passives[key] = (p.passives[key]||0)+1;
    recalc(p);
  }
  G.makePlayer = makePlayer;
  G.addWeapon = addWeapon;
  G.addPassive = addPassive;
  G.ownedWeapon = function(p,key){
    for(var i=0;i<p.weapons.length;i++) if(p.weapons[i].key===key) return p.weapons[i];
    return null;
  };

  function alive(){ var o=[]; for(var i=0;i<players.length;i++) if(!players[i].down) o.push(players[i]); return o; }
  G.alive = alive;
  function nearestPlayer(x,y){
    var bp=null, bd=1e9;
    for(var i=0;i<players.length;i++){
      var p=players[i]; if(p.down) continue;
      var d=(p.x-x)*(p.x-x)+(p.y-y)*(p.y-y);
      if(d<bd){ bd=d; bp=p; }
    }
    return bp;
  }

  function hurtPlayer(p, dmg){
    if(p.down || p.iframe>0 || !G.state.running) return;
    if(p.shield && p.shield.ch > 0){
      if(p.shield.def.shroud){ dmg = Math.min(dmg, 10); }
      else { p.shield.ch--; p.iframe=.5; burst(p.x,p.y,"#5FBF6A",16); beep(300,.12,"sine",.04); return; }
    }
    dmg = Math.max(1, dmg - (p.st.armor||0));
    p.hp -= dmg; p.hurt = .2; p.iframe = .38;
    shake = Math.max(shake, Math.min(7, dmg*.28));
    beep(170,.06,"square",.04);
    if(p.hp <= 0) down(p);
  }
  function down(p){
    p.hp = 0;
    var revives = (p.st.revival||0) + ((V.meta && V.meta.alma) ? 1 : 0);
    if(p.revivesUsed < revives){
      p.revivesUsed++;
      p.hp = p.maxhp*.6; p.iframe = 2.4;
      burst(p.x,p.y,"#FFFFFF",50);
      say(V.HEROES[p.hero].name + " se levanta.");
      beep(700,.35,"triangle",.07);
      return;
    }
    p.down = true; p.reviveProg = 0;
    burst(p.x,p.y,p.color,34);
    say(V.HEROES[p.hero].name + " ha caído.");
    if(V.ui) V.ui.party();
    if(!alive().length && V.ui) V.ui.endRun(false);
  }
  G.hurtPlayer = hurtPlayer;

  /* ---------------- oleadas ---------------- */
  function ringPoint(dist){
    var a = rf(0,6.283);
    var ref = alive()[0] || cam;
    var d = dist || (Math.max(canvas.width,canvas.height)/zoom)*.62;
    return {x:ref.x+Math.cos(a)*d, y:ref.y+Math.sin(a)*d};
  }
  function waves(dt){
    var curse = players.length ? (players[0].st.curse||1) : 1;
    for(var i=0;i<V.STREAMS.length;i++){
      var st = V.STREAMS[i];
      if(runT < st.a || runT > st.b) continue;
      streamT[i] -= dt*curse;
      if(streamT[i] <= 0){
        streamT[i] = st.every;
        var type = stage.foes[st.foe];
        for(var k=0;k<st.n;k++){ var pt = ringPoint(); spawnFoe(type, pt.x, pt.y); }
      }
    }
    while(eventIdx < V.EVENTS.length && runT >= V.EVENTS[eventIdx].t){
      var ev = V.EVENTS[eventIdx++];
      var ref = alive()[0] || cam;
      var d = (Math.max(canvas.width,canvas.height)/zoom)*.6;
      if(ev.kind === "ring"){
        for(var r=0;r<ev.n;r++){
          var a=(r/ev.n)*6.283;
          spawnFoe(stage.foes[ev.foe], ref.x+Math.cos(a)*d, ref.y+Math.sin(a)*d);
        }
        say("¡Os rodean!"); shake = 6;
      } else if(ev.kind === "wall"){
        var side = ri(0,3);
        for(var w2=0;w2<ev.n;w2++){
          var off = (w2-ev.n/2)*34, x, y;
          if(side<2){ x = side===0 ? ref.x-d : ref.x+d; y = ref.y+off; }
          else { x = ref.x+off; y = side===2 ? ref.y-d : ref.y+d; }
          spawnFoe(stage.foes[ev.foe], x, y);
        }
        say("Una muralla avanza hacia vosotros.");
      } else if(ev.kind === "elite"){
        var pt2 = ringPoint();
        var el = spawnFoe("elite", pt2.x, pt2.y);
        if(el){ el.hp *= 1+runT/720; el.maxhp = el.hp; }
        say("Algo enorme ha despertado."); shake = 10;
        beep(100,.7,"sawtooth",.07);
      } else if(ev.kind === "reaper"){
        if(V.ui) V.ui.endRun(true);
        for(var rr=0;rr<3;rr++){ var pt3 = ringPoint(); spawnFoe("segadora", pt3.x, pt3.y); }
      }
    }
  }

  /* ---------------- bucle ---------------- */
  function update(dt){
    runT += dt;
    rebuildHash();

    for(var i=0;i<players.length;i++){
      var p = players[i];
      if(p.down){
        var helper = null;
        for(var h=0;h<players.length;h++){
          var o=players[h];
          if(o===p||o.down) continue;
          if(Math.hypot(o.x-p.x,o.y-p.y) < 48){ helper=o; break; }
        }
        if(helper){
          p.reviveProg += dt;
          if(p.reviveProg >= 5){
            p.down=false; p.hp=p.maxhp*.5; p.iframe=2;
            burst(p.x,p.y,p.color,40);
            say("¡" + V.HEROES[p.hero].name + " vuelve en pie!");
            beep(620,.25,"triangle",.06);
            if(V.ui) V.ui.party();
          }
        } else p.reviveProg = Math.max(0, p.reviveProg - dt*.8);
        continue;
      }

      var mv;
      if(p.netPeer && V.net && V.net.online && p.netPeer !== V.net.me){
        mv = V.net.inputOf(p.netPeer);            // mando de otro dispositivo
      } else {
        mv = V.ui ? V.ui.readMove(p) : {mx:0,my:0};
        if(V.net && V.net.online) V.net.setInput(mv.mx, mv.my);
      }
      var ml = Math.hypot(mv.mx, mv.my);
      if(ml > .05){
        var mx=mv.mx/ml, my=mv.my/ml;
        p.aimx=mx; p.aimy=my; p.walk += dt*10;
        if(Math.abs(mx) > .2) p.face = mx>0?1:-1;
        p.x += mx*p.speed*dt; p.y += my*p.speed*dt;
      }
      if(p.hurt>0) p.hurt-=dt;
      if(p.iframe>0) p.iframe-=dt;
      if(p.st.recovery){
        p.regenAcc += dt;
        if(p.regenAcc >= 1){ p.regenAcc-=1; p.hp = Math.min(p.maxhp, p.hp + p.st.recovery); }
      }

      for(var w=0;w<p.weapons.length;w++){
        var wp = p.weapons[w], s = weaponStats(p, wp);
        if(wp.def.persistent){ if(wp.def.tick) wp.def.tick(p, wp, s, dt); }
        else {
          wp.t -= dt;
          if(wp.t <= 0){ wp.t = s.cd; wp.def.fire(p, wp, s); }
        }
      }

      // recogidas
      var mag = p.magnet;
      for(var g=gems.length-1;g>=0;g--){
        var gem=gems[g];
        var dx=p.x-gem.x, dy=p.y-gem.y, dd=Math.hypot(dx,dy)||.001;
        if(dd<mag){ var pull=clamp((mag-dd)/mag,0,1)*640+110; gem.x+=dx/dd*pull*dt; gem.y+=dy/dd*pull*dt; }
        if(dd<18){ gainXp(p, gem.v); gems.splice(g,1); if(Math.random()<.2) beep(1100+Math.random()*400,.03,"square",.02); }
      }
      for(var d2=drops.length-1;d2>=0;d2--){
        var dr=drops[d2];
        var ddx=p.x-dr.x, ddy=p.y-dr.y, dl=Math.hypot(ddx,ddy)||.001;
        if(dl<mag*.9){ dr.x+=ddx/dl*280*dt; dr.y+=ddy/dl*280*dt; }
        if(dl<20){
          if(dr.kind==="oro"){ runGold += dr.v; floatText(dr.x,dr.y,"+"+dr.v,"#E5B95C"); }
          else if(dr.kind==="carne"){ p.hp=Math.min(p.maxhp,p.hp+p.maxhp*.25); floatText(dr.x,dr.y,"+vida","#C2263A"); beep(600,.12,"triangle",.05); }
          else if(V.ui) V.ui.chest(p);
          drops.splice(d2,1);
        }
      }
    }
    if(!G.state.running) return;

    updateBullets(dt);
    updateAreas(dt);
    updateFoes(dt);
    if(!G.state.running) return;
    waves(dt);

    for(var pa=parts.length-1;pa>=0;pa--){
      var pt=parts[pa];
      pt.x+=pt.vx*dt; pt.y+=pt.vy*dt; pt.vx*=.9; pt.vy*=.9; pt.life-=dt;
      if(pt.life<=0) parts.splice(pa,1);
    }
    for(var fl=floats.length-1;fl>=0;fl--){
      floats[fl].y -= 26*dt; floats[fl].life -= dt*1.3;
      if(floats[fl].life<=0) floats.splice(fl,1);
    }
    for(var gg=0;gg<gems.length;gg++) gems[gg].t += dt;
    if(msgTime>0) msgTime-=dt;
    if(shake>0) shake=Math.max(0,shake-dt*24);
    updateCamera(dt);
    if(V.ui) V.ui.sync();
  }

  function gainXp(p, v){
    p.xp += v * (p.st.growth||1);
    var leveled = false;
    while(p.xp >= p.next){
      p.xp -= p.next; p.lvl++;
      p.next = Math.round(5 + p.lvl*3.2 + Math.pow(p.lvl,1.44));
      p.hp = Math.min(p.maxhp, p.hp+6);
      if(V.ui) V.ui.queueDraft(p);
      leveled = true;
      beep(760,.12,"triangle",.05);
    }
    if(leveled && V.ui) V.ui.maybeOpenDraft();
  }

  function updateBullets(dt){
    var v = view();
    for(var b=bullets.length-1;b>=0;b--){
      var bl=bullets[b];
      bl.t += dt; bl.life -= dt;
      if(bl.life<=0){ if(bl.blast) blast(bl); bullets.splice(b,1); continue; }

      if(bl.behavior === "arc"){
        bl.vy += 620*dt;
      } else if(bl.behavior === "boomerang"){
        var k = bl.t/(bl.life+bl.t);
        bl.vx *= (1 - dt*2.2); bl.vy *= (1 - dt*2.2);
        var hx = bl.home.x-bl.x, hy = bl.home.y-bl.y, hd = Math.hypot(hx,hy)||1;
        bl.vx += hx/hd*640*dt; bl.vy += hy/hd*640*dt;
      } else if(bl.behavior === "wall"){
        if(bl.x < v.x-v.hw || bl.x > v.x+v.hw){ bl.vx*=-1; if(bl.blast) blast(bl); }
        if(bl.y < v.y-v.hh || bl.y > v.y+v.hh){ bl.vy*=-1; if(bl.blast) blast(bl); }
        bl.x = clamp(bl.x, v.x-v.hw, v.x+v.hw);
        bl.y = clamp(bl.y, v.y-v.hh, v.y+v.hh);
      } else if(bl.behavior === "wander"){
        bl.wt = (bl.wt||0) - dt;
        if(bl.wt <= 0){
          bl.wt = rf(.4,1.1);
          var na = Math.atan2(bl.vy,bl.vx) + rf(-1.4,1.4);
          var sp = Math.hypot(bl.vx,bl.vy);
          bl.vx = Math.cos(na)*sp; bl.vy = Math.sin(na)*sp;
        }
      }
      bl.x += bl.vx*dt; bl.y += bl.vy*dt;
      if(bl.spin) bl.rotA += bl.spin*dt;
      else if(bl.rot) bl.rotA = Math.atan2(bl.vy,bl.vx);

      queryNear(bl.x, bl.y, bl.r+22, scratch);
      var gone = false;
      for(var q=0;q<scratch.length;q++){
        var idx=scratch[q], f=foes[idx];
        if(!f||f.dead) continue;
        if(bl.cool){
          f.tags = f.tags||{};
          var tg = "b"+(bl.id||(bl.id=++bulletId));
          if(f.tags[tg] > 0) continue;
        }
        if(Math.hypot(f.x-bl.x, f.y-bl.y) > bl.r+f.r) continue;
        if(bl.cool){ f.tags["b"+bl.id] = bl.cool; }
        var vl = Math.hypot(bl.vx,bl.vy)||1;
        var before = f.hp;
        damage(idx, bl.dmg, bl.owner, bl.vx/vl*70, bl.vy/vl*70, bl.critChance || (bl.owner.critChance));
        if(bl.greedy && before>0 && f.dead)
          drops.push({x:f.x,y:f.y,kind:"oro",v:Math.round(6*(bl.owner.st.greed||1))});
        burst(bl.x, bl.y, "#FFFFFF", 2);
        bl.pierce--;
        if(bl.pierce <= 0){ if(bl.blast) blast(bl); gone = true; break; }
      }
      if(gone){ bullets.splice(b,1); continue; }
      // fuera de vista con mucho margen
      if(Math.abs(bl.x-v.x) > v.hw*2.2 || Math.abs(bl.y-v.y) > v.hh*2.2) bullets.splice(b,1);
    }
  }
  var bulletId = 0;
  function blast(bl){
    area({x:bl.x,y:bl.y,r:bl.blast,kind:"blast",life:.3,dmg:bl.dmg*.8,owner:bl.owner,
      color:"#FF8A3C",once:true});
    burst(bl.x,bl.y,"#FF8A3C",14);
  }

  function updateAreas(dt){
    for(var i=areas.length-1;i>=0;i--){
      var a=areas[i];
      a.life -= dt; a.t += dt;
      if(a.follow){ a.x = a.follow.x; a.y = a.follow.y; }
      if(a.kind === "wave"){ a.y -= 240*dt; }
      var doHit = false;
      if(a.once){ if(!a.done){ a.done = true; doHit = true; } }
      else { a.acc -= dt; if(a.acc <= 0){ a.acc = a.interval||.4; doHit = true; } }
      if(doHit) applyArea(a);
      if(a.life <= 0) areas.splice(i,1);
    }
  }
  function applyArea(a){
    var r = a.r || Math.max(a.w,a.h)*.6;
    queryNear(a.x, a.y, r+30, scratch);
    for(var i=0;i<scratch.length;i++){
      var idx=scratch[i], f=foes[idx];
      if(!f||f.dead) continue;
      var inside;
      if(a.w !== undefined){
        // caja orientada: giro inverso del punto
        var dx=f.x-a.x, dy=f.y-a.y;
        var ca=Math.cos(-a.ang), sa=Math.sin(-a.ang);
        var lx=dx*ca-dy*sa, ly=dx*sa+dy*ca;
        var ox = a.fromEdge ? a.w/2 : 0;
        inside = Math.abs(lx-ox) < a.w/2 + f.r && Math.abs(ly) < a.h/2 + f.r;
      } else {
        inside = Math.hypot(f.x-a.x, f.y-a.y) < r + f.r;
      }
      if(!inside) continue;
      if(a.freeze) f.freeze = Math.max(f.freeze, a.freeze);
      if(a.slow) f.slow = Math.max(f.slow, 2.0);
      if(a.halve && !f.def.elite){ f.hp = Math.min(f.hp, f.hp*.5); if(f.hp < 2) kill(idx, a.owner); continue; }
      if(!a.dmg) continue;
      var before = f.hp;
      damage(idx, a.dmg, a.owner, 0, 0, a.critChance);
      if(a.lifesteal && a.owner) a.owner.hp = Math.min(a.owner.maxhp, a.owner.hp + a.dmg*.06);
    }
  }

  function updateFoes(dt){
    var pushed = 0;
    for(var e=foes.length-1;e>=0;e--){
      var f=foes[e];
      if(f.dead){ foes.splice(e,1); continue; }
      if(f.hit>0) f.hit-=dt;
      if(f.freeze>0){ f.freeze-=dt; continue; }
      if(f.slow>0) f.slow-=dt;
      if(f.tags) for(var k in f.tags) if(f.tags[k]>0) f.tags[k]-=dt;

      var tgt = nearestPlayer(f.x,f.y);
      if(!tgt) continue;
      var dx=tgt.x-f.x, dy=tgt.y-f.y, dist=Math.hypot(dx,dy)||1;
      if(dist > 1600 && !f.def.elite && !f.def.reaper){
        var pt = ringPoint(); f.x=pt.x; f.y=pt.y; continue;
      }
      var sp = f.speed * (f.slow>0?.45:1);
      if(f.def.erratic){ f.wob += dt*5; sp *= 1 + Math.sin(f.wob)*.35; }
      f.x += (dx/dist)*sp*dt + f.kx*dt;
      f.y += (dy/dist)*sp*dt + f.ky*dt;
      f.kx *= .86; f.ky *= .86;
      if(Math.abs(f.kx) < 1) f.kx = 0;
      if(Math.abs(f.ky) < 1) f.ky = 0;
      f.face = dx > 0 ? 1 : -1;

      if(pushed < 2600){
        var bucket = hashMap.get((Math.floor(f.x/CELL)*73856093)^(Math.floor(f.y/CELL)*19349663));
        if(bucket){
          var lim = Math.min(bucket.length, 5);
          for(var n=0;n<lim;n++){
            var oi=bucket[n];
            if(oi===e) continue;
            var of=foes[oi];
            if(!of||of.dead) continue;
            var sx=f.x-of.x, sy=f.y-of.y, sd=Math.hypot(sx,sy), mn=f.r+of.r;
            if(sd>.01 && sd<mn){
              var push=(mn-sd)/mn*46*dt;
              f.x+=sx/sd*push; f.y+=sy/sd*push; pushed++;
            }
          }
        }
      }
      if(dist < f.r+tgt.r){
        hurtPlayer(tgt, f.def.reaper ? 9999 : f.dmg);
        if(!f.def.elite && !f.def.reaper){ f.kx -= (dx/dist)*130; f.ky -= (dy/dist)*130; }
      }
    }
  }

  function updateCamera(dt){
    var list = alive();
    if(!list.length) list = players;
    if(!list.length) return;
    var minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
    for(var i=0;i<list.length;i++){
      minX=Math.min(minX,list[i].x); maxX=Math.max(maxX,list[i].x);
      minY=Math.min(minY,list[i].y); maxY=Math.max(maxY,list[i].y);
    }
    var tx=(minX+maxX)/2, ty=(minY+maxY)/2;
    var z = Math.min(canvas.width/((maxX-minX)+440), canvas.height/((maxY-minY)+360));
    z = clamp(z, baseZoom*.55, baseZoom);
    zoom += (z-zoom)*Math.min(1,dt*3);
    cam.x += (tx-cam.x)*Math.min(1,dt*8);
    cam.y += (ty-cam.y)*Math.min(1,dt*8);
    if(players.length>1){
      var hw=canvas.width/(2*zoom)-32, hh=canvas.height/(2*zoom)-32;
      for(var k=0;k<players.length;k++){
        players[k].x = clamp(players[k].x, cam.x-hw, cam.x+hw);
        players[k].y = clamp(players[k].y, cam.y-hh, cam.y+hh);
      }
    }
  }

  /* ---------------- dibujado ---------------- */
  function render(){
    var w=canvas.width, h=canvas.height;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = V.world ? V.world.bg(stageKey) : "#12101C";
    ctx.fillRect(0,0,w,h);

    var sx = shake ? rf(-shake,shake) : 0, sy = shake ? rf(-shake,shake) : 0;
    ctx.save();
    ctx.translate(Math.round(w/2+sx), Math.round(h/2+sy));
    ctx.scale(zoom, zoom);
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

    var hw=(w/zoom)/2+80, hh=(h/zoom)/2+80;
    var left=cam.x-hw, right=cam.x+hw, top=cam.y-hh, bot=cam.y+hh;

    // suelo, caminos, parcelas y detalle: cuatro capas por trozos cacheados
    V.world.draw(ctx, cam.x, cam.y, zoom, w, h, stageKey);

    // zonas de daño
    for(var i=0;i<areas.length;i++) drawArea(areas[i]);

    // gemas y objetos
    for(var g=0;g<gems.length;g++){
      var gem=gems[g];
      if(gem.x<left||gem.x>right||gem.y<top||gem.y>bot) continue;
      var key = gem.v>=5?"i_gema3":(gem.v>=2?"i_gema2":"i_gema");
      var s=V.sprite(key,0);
      ctx.drawImage(s, Math.round(gem.x-s.width/2), Math.round(gem.y-s.height/2+Math.sin(gem.t*4)*2));
    }
    for(var d=0;d<drops.length;d++){
      var dr=drops[d];
      var ks = dr.kind==="oro"?"i_oro":(dr.kind==="carne"?"i_carne":"i_cofre");
      var sp2=V.sprite(ks,0);
      ctx.drawImage(sp2, Math.round(dr.x-sp2.width/2), Math.round(dr.y-sp2.height/2));
    }

    // enemigos
    for(var f2=0;f2<foes.length;f2++){
      var fo=foes[f2];
      if(fo.x<left||fo.x>right||fo.y<top||fo.y>bot) continue;
      var spr;
      if(fo.hit>0) spr = V.spriteHit(fo.def.spr);
      else spr = V.sprite(fo.def.spr, (Math.floor(runT*7)+fo.frame)%4);
      if(!spr) continue;
      // anclado por los pies: la sombra del sprite se apoya en el suelo
      var foot = Math.round(fo.r*0.9);
      var px=Math.round(fo.x-spr.width/2), py=Math.round(fo.y-spr.height+foot);
      if(fo.freeze>0){ ctx.globalAlpha=.75; }
      if(fo.face<0){
        ctx.save(); ctx.translate(Math.round(fo.x),Math.round(fo.y)); ctx.scale(-1,1);
        ctx.drawImage(spr, -spr.width/2, -spr.height+foot); ctx.restore();
      } else ctx.drawImage(spr, px, py);
      ctx.globalAlpha=1;
      if(fo.freeze>0){
        ctx.fillStyle="rgba(124,198,255,.45)";
        ctx.fillRect(px, py, spr.width, 3);
        ctx.fillRect(px, py+spr.height-3, spr.width, 3);
      }
      if(fo.def.elite||fo.def.reaper){
        var frac=clamp(fo.hp/fo.maxhp,0,1);
        ctx.fillStyle="rgba(0,0,0,.65)"; ctx.fillRect(fo.x-26, fo.y-fo.r-16, 52, 6);
        ctx.fillStyle="#C2263A"; ctx.fillRect(fo.x-26, fo.y-fo.r-16, 52*frac, 6);
      }
    }

    // proyectiles
    for(var b2=0;b2<bullets.length;b2++){
      var bu=bullets[b2];
      var bs = bu.spr ? V.sprite(bu.spr,0) : null;
      if(bs){
        ctx.save(); ctx.translate(Math.round(bu.x),Math.round(bu.y));
        if(bu.rot||bu.spin) ctx.rotate(bu.rotA);
        var sc = bu.r/8;
        if(sc>1.08||sc<0.92){ ctx.scale(sc,sc); }
        ctx.drawImage(bs, -bs.width/2, -bs.height/2);
        ctx.restore();
      } else {
        ctx.fillStyle="#FFF";
        ctx.fillRect(Math.round(bu.x-bu.r/2), Math.round(bu.y-bu.r/2), bu.r, bu.r);
      }
    }

    // jugadores y armas persistentes
    for(var p3=0;p3<players.length;p3++){
      var pl=players[p3];
      if(pl.down){ drawTomb(pl); continue; }
      for(var wd=0;wd<pl.weapons.length;wd++){
        var ww=pl.weapons[wd];
        if(ww.def.draw) ww.def.draw(pl, ww, ctx);
      }
      var frame = (Math.abs(pl.aimx)+Math.abs(pl.aimy)) > 0 ? (Math.floor(pl.walk)%4) : 0;
      var ps = pl.hurt>0 ? V.spriteHit(pl.spr) : V.sprite(pl.spr, frame);
      if(pl.iframe>0 && Math.floor(performance.now()/60)%2) ctx.globalAlpha=.45;
      ctx.save(); ctx.translate(Math.round(pl.x), Math.round(pl.y));
      if(pl.face<0) ctx.scale(-1,1);
      ctx.drawImage(ps, -ps.width/2, -(ps.height-12));
      ctx.restore();
      ctx.globalAlpha=1;
      if(players.length>1){
        ctx.fillStyle="rgba(7,6,14,.8)";
        ctx.fillRect(Math.round(pl.x)-7, Math.round(pl.y)-30, 14, 12);
        ctx.fillStyle=pl.color;
        ctx.font="700 11px 'Barlow Semi Condensed',Arial,sans-serif";
        ctx.textAlign="center";
        ctx.fillText(String(pl.slot+1), Math.round(pl.x), Math.round(pl.y)-21);
      }
    }

    for(var pa2=0;pa2<parts.length;pa2++){
      var pt2=parts[pa2];
      ctx.globalAlpha=clamp(pt2.life*2.4,0,1);
      ctx.fillStyle=pt2.c;
      ctx.fillRect(Math.round(pt2.x), Math.round(pt2.y), pt2.s, pt2.s);
    }
    ctx.globalAlpha=1;

    ctx.font="700 13px 'Barlow Semi Condensed',Arial,sans-serif";
    ctx.textAlign="center";
    for(var fl2=0;fl2<floats.length;fl2++){
      ctx.globalAlpha=clamp(floats[fl2].life,0,1);
      ctx.fillStyle=floats[fl2].c;
      ctx.fillText(floats[fl2].t, floats[fl2].x, floats[fl2].y);
    }
    ctx.globalAlpha=1;
    ctx.restore();

    // niebla del mapa + luna
    ctx.fillStyle = stage.fog;
    ctx.fillRect(0,0,w,h);
    var lg=ctx.createRadialGradient(w/2,h/2,90*zoom,w/2,h/2,Math.max(w,h)*.72);
    lg.addColorStop(0,"rgba(0,0,0,0)");
    lg.addColorStop(.6,"rgba(4,3,10,.38)");
    lg.addColorStop(1,"rgba(4,3,10,.88)");
    ctx.fillStyle=lg; ctx.fillRect(0,0,w,h);

    if(V.ui) V.ui.drawHud(ctx, w, h, {runT:runT, runGold:runGold, msg:msgText, msgTime:msgTime, players:players});
  }

  function drawTomb(pl){
    var x=Math.round(pl.x), y=Math.round(pl.y);
    ctx.fillStyle="#3A3648";
    ctx.fillRect(x-9, y-10, 18, 20);
    ctx.fillRect(x-12, y+8, 24, 5);
    ctx.fillStyle="#6E6A80";
    ctx.fillRect(x-2, y-6, 4, 12); ctx.fillRect(x-6, y-2, 12, 4);
    if(pl.reviveProg>0){
      ctx.fillStyle=pl.color;
      ctx.fillRect(x-14, y-18, Math.round(28*(pl.reviveProg/5)), 4);
    }
  }

  function drawArea(a){
    var al = clamp(a.life/(a.max||1),0,1);
    if(a.kind === "slash"){
      ctx.save(); ctx.translate(Math.round(a.x),Math.round(a.y)); ctx.rotate(a.ang);
      ctx.globalAlpha = al;
      ctx.fillStyle = a.color;
      var W2=a.w, H2=a.h;
      for(var i=0;i<5;i++){
        var t=i/4;
        ctx.fillRect(-W2/2+t*W2*.95, -H2/2*(1-Math.abs(t-.5)*1.2), W2*.09, H2*(1-Math.abs(t-.5)*1.2));
      }
      ctx.globalAlpha=1; ctx.restore();
    } else if(a.kind === "pool"){
      ctx.globalAlpha = Math.min(1, al*1.4);
      ctx.fillStyle = a.color;
      var r=a.r, st=10;
      for(var q=0;q<st;q++){
        var ang=(q/st)*6.283 + a.t;
        ctx.fillRect(Math.round(a.x+Math.cos(ang)*r*.8)-3, Math.round(a.y+Math.sin(ang)*r*.8)-3, 6, 6);
      }
      ctx.globalAlpha = .18*al;
      ctx.fillRect(a.x-r, a.y-r*.7, r*2, r*1.4);
      ctx.globalAlpha=1;
    } else if(a.kind === "bolt"){
      ctx.globalAlpha=al;
      ctx.fillStyle=a.color;
      for(var s=0;s<7;s++)
        ctx.fillRect(Math.round(a.x)-3+((s%2)?6:-6), Math.round(a.y)-150+s*22, 6, 20);
      ctx.fillRect(a.x-a.r, a.y-6, a.r*2, 12);
      ctx.globalAlpha=1;
    } else if(a.kind === "flash"){
      ctx.globalAlpha=al*.55;
      ctx.fillStyle=a.color;
      var v2=view();
      ctx.fillRect(v2.x-v2.hw, v2.y-v2.hh, v2.hw*2, v2.hh*2);
      ctx.globalAlpha=1;
    } else if(a.kind === "lance"){
      ctx.save(); ctx.translate(Math.round(a.x),Math.round(a.y)); ctx.rotate(a.ang);
      ctx.globalAlpha=al;
      ctx.fillStyle=a.color;
      ctx.fillRect(0, -a.h/2, a.w, a.h);
      ctx.fillStyle="#FFFFFF";
      ctx.fillRect(0, -3, a.w, 6);
      ctx.globalAlpha=1; ctx.restore();
    } else if(a.kind === "wave"){
      ctx.globalAlpha=al*.8;
      ctx.fillStyle=a.color;
      for(var y2=-450;y2<450;y2+=26)
        ctx.fillRect(a.x-a.w/2, a.y+y2, a.w, 12);
      ctx.globalAlpha=1;
    } else if(a.kind === "blast"){
      ctx.globalAlpha=al;
      ctx.fillStyle=a.color;
      var rr=a.r*(1.2-al*.4);
      ctx.fillRect(a.x-rr, a.y-rr*.5, rr*2, rr);
      ctx.fillRect(a.x-rr*.5, a.y-rr, rr, rr*2);
      ctx.globalAlpha=1;
    }
  }

  /* ---------------- arranque / partida ---------------- */
  G.init = function(cv, scr){
    canvas = cv; ctx = cv.getContext("2d"); screenEl = scr;
    G.canvas = canvas; G.ctx = ctx;
    G.resize();
  };
  G.resize = function(){
    var rect = screenEl.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio||1, 2);
    canvas.width = Math.max(320, Math.round(rect.width*dpr));
    canvas.height = Math.max(200, Math.round(rect.height*dpr));
    baseZoom = clamp(canvas.width/980, .75, 1.8);
    zoom = baseZoom;
  };
  G.startRun = function(slots, stgKey){
    stageKey = stgKey; stage = V.STAGES[stageKey];
    players.length=0; foes.length=0; bullets.length=0; areas.length=0;
    gems.length=0; drops.length=0; parts.length=0; floats.length=0;
    runT=0; kills=0; runGold=0; eventIdx=0; streamT=[];
    for(var s=0;s<V.STREAMS.length;s++) streamT.push(0);
    for(var i=0;i<slots.length;i++)
      if(slots[i].joined) makePlayer(i, slots[i], {x:0,y:0});
    cam.x=0; cam.y=0; zoom=baseZoom;
    G.state.running=true; G.state.paused=false; G.state.demo=false;
    say("Sobrevivid veinte minutos en " + stage.name + ".");
  };
  G.joinMid = function(slotIdx, slot){
    var anchor = alive()[0] || cam;
    var p = makePlayer(slotIdx, slot, anchor);
    var lead = players[0];
    for(var i=1;i<players.length;i++) if(players[i].lvl>lead.lvl) lead=players[i];
    for(var l=1;l<lead.lvl;l++){ p.lvl++; if(V.ui) V.ui.queueDraft(p); }
    p.next = Math.round(5 + p.lvl*3.2 + Math.pow(p.lvl,1.44));
    return p;
  };
  G.stopRun = function(){ G.state.running=false; };
  G.setStage = function(k){ stageKey=k; stage=V.STAGES[k]; if(V.world) V.world.reset(); };
  G.runGold = function(){ return runGold; };
  G.addGold = function(n){ runGold += n; };
  G.kills = function(){ return kills; };
  G.time = function(){ return runT; };
  G.cam = cam;

  /* demo del menú: el páramo sigue vivo detrás */
  var demoT = 0;
  G.demoTick = function(dt){
    if(!stage) stage = V.STAGES[stageKey];
    demoT += dt;
    cam.x = Math.cos(demoT*.1)*240; cam.y = Math.sin(demoT*.08)*170;
    if(foes.length < 34 && Math.random() < .5){
      var a=rf(0,6.283), d=rf(340,520);
      spawnFoe(stage.foes[ri(0,2)], cam.x+Math.cos(a)*d, cam.y+Math.sin(a)*d);
    }
    rebuildHash();
    for(var i=foes.length-1;i>=0;i--){
      var f=foes[i];
      var dx=cam.x-f.x, dy=cam.y-f.y, dd=Math.hypot(dx,dy)||1;
      f.x+=dx/dd*f.speed*.45*dt; f.y+=dy/dd*f.speed*.45*dt;
      f.face = dx>0?1:-1;
      if(dd<50) foes.splice(i,1);
    }
    for(var p=parts.length-1;p>=0;p--){
      parts[p].x+=parts[p].vx*dt; parts[p].y+=parts[p].vy*dt; parts[p].life-=dt;
      if(parts[p].life<=0) parts.splice(p,1);
    }
    if(msgTime>0) msgTime-=dt;
  };
  /* ================= modo en línea ================= */

  G.expose = function(){
    return {players:players, foes:foes, bullets:bullets, gems:gems, drops:drops, areas:areas};
  };

  // partida en línea vista por el anfitrión: un jugador por peer conectado
  G.startOnlineHost = function(peers, stgKey){
    stageKey = stgKey; stage = V.STAGES[stageKey];
    if(V.world) V.world.reset();
    players.length=0; foes.length=0; bullets.length=0; areas.length=0;
    gems.length=0; drops.length=0; parts.length=0; floats.length=0;
    runT=0; kills=0; runGold=0; eventIdx=0; streamT=[];
    for(var s=0;s<V.STREAMS.length;s++) streamT.push(0);
    for(var i=0;i<peers.length;i++){
      var p = makePlayer(i, {hero:V.net.heroOf(peers[i]), input:"kb1"}, {x:0,y:0});
      p.netPeer = peers[i];
    }
    cam.x=0; cam.y=0; zoom=baseZoom;
    G.state.running=true; G.state.paused=false; G.state.demo=false;
    say("Cacería en línea: " + peers.length + " en el páramo.");
  };

  var AREA_COLOR = {slash:"#C2263A", pool:"#7CC6FF", bolt:"#FFE066", flash:"#C08BEF",
    lance:"#7CC6FF", wave:"#C08BEF", blast:"#FF8A3C", aura:"#E5B95C"};

  G.startGuest = function(){
    players.length=0; foes.length=0; bullets.length=0; areas.length=0;
    gems.length=0; drops.length=0; parts.length=0; floats.length=0;
    G.state.running=true; G.state.paused=false; G.state.demo=false;
    runT=0; runGold=0; kills=0;
  };

  // el invitado no simula: interpola lo recibido y predice solo su personaje
  G.guestUpdate = function(dt){
    var R = V.net.remote, i;
    runT = R.runT; runGold = R.gold;

    var byPeer = {};
    for(i=0;i<players.length;i++) if(players[i].netPeer) byPeer[players[i].netPeer] = players[i];
    players.length = 0;
    for(i=0;i<R.players.length;i++){
      var rp = R.players[i];
      var p = byPeer[rp.peer];
      if(!p) p = {netPeer:rp.peer, x:rp.x, y:rp.y, r:11, walk:0, aimx:1, aimy:0,
        weapons:[], passives:{}, reviveProg:0, st:{}};
      var hero = V.HEROES[rp.hero] || V.HEROES.cazador;
      p.hero = rp.hero; p.spr = hero.spr; p.color = hero.color;
      p.down = rp.down; p.hurt = rp.hurt?0.15:0; p.iframe = rp.iframe?0.3:0;
      p.lvl = rp.lvl; p.xp = rp.xpFrac*100; p.next = 100;
      p.maxhp = 100; p.hp = rp.hpFrac*100;
      p.slot = i;
      if(rp.peer === V.net.me){
        var mv = V.ui ? V.ui.readMove({input:"kb1"}) : {mx:0,my:0};
        V.net.setInput(mv.mx, mv.my);
        var ml = Math.hypot(mv.mx, mv.my);
        if(ml > .05 && !rp.down){
          p.x += (mv.mx/ml)*(hero.speed||120)*dt;
          p.y += (mv.my/ml)*(hero.speed||120)*dt;
          p.walk += dt*10;
          p.aimx = mv.mx/ml; p.aimy = mv.my/ml;
          if(Math.abs(mv.mx) > .2) p.face = mv.mx>0?1:-1;
        }
        // reconciliación: se acerca a la verdad sin dar tirones
        var k = Math.min(1, dt*3.2);
        p.x += (rp.x-p.x)*k; p.y += (rp.y-p.y)*k;
        if(Math.hypot(rp.x-p.x, rp.y-p.y) > 200){ p.x=rp.x; p.y=rp.y; }
      } else {
        var k2 = Math.min(1, dt*14);
        p.x += (rp.x-p.x)*k2; p.y += (rp.y-p.y)*k2;
        p.face = rp.face; p.walk += dt*8;
      }
      players.push(p);
    }

    foes.length = 0;
    for(var id in R.foes){
      var e = R.foes[id];
      var kf = Math.min(1, dt*14);
      e.x += (e.tx-e.x)*kf; e.y += (e.ty-e.y)*kf;
      var def = V.FOES[e.type] || V.FOES.aldeano;
      foes.push({x:e.x, y:e.y, type:e.type, def:def, r:def.r,
        hit:e.hitF?.1:0, face:e.face, freeze:e.freezeF?1:0,
        hp:e.hpFrac, maxhp:1, dead:false, frame:(id|0)%4});
    }
    bullets.length = 0;
    for(var bid in R.bullets){
      var b = R.bullets[bid];
      var kb = Math.min(1, dt*18);
      b.x += (b.tx-b.x)*kb; b.y += (b.ty-b.y)*kb;
      bullets.push({x:b.x, y:b.y, spr:b.spr, rotA:b.rotA, r:b.r, rot:true});
    }
    gems.length = 0;
    for(i=0;i<R.gems.length;i++)
      gems.push({x:R.gems[i].x, y:R.gems[i].y, v:R.gems[i].tier>=2?5:(R.gems[i].tier?2:1), t:runT});
    drops.length = 0;
    for(i=0;i<R.drops.length;i++)
      drops.push({x:R.drops[i].x, y:R.drops[i].y,
        kind:R.drops[i].kind===0?"oro":(R.drops[i].kind===1?"carne":"cofre")});
    areas.length = 0;
    for(i=0;i<R.areas.length;i++){
      var a = R.areas[i];
      areas.push({x:a.x, y:a.y, r:a.r, w:a.r*2, h:a.r, ang:a.ang, kind:a.kind,
        life:a.life, max:1, color:AREA_COLOR[a.kind] || "#FFFFFF", t:runT});
    }

    for(var pa=parts.length-1;pa>=0;pa--){
      var pt=parts[pa];
      pt.x+=pt.vx*dt; pt.y+=pt.vy*dt; pt.vx*=.9; pt.vy*=.9; pt.life-=dt;
      if(pt.life<=0) parts.splice(pa,1);
    }
    for(var fl=floats.length-1;fl>=0;fl--){
      floats[fl].y -= 26*dt; floats[fl].life -= dt*1.3;
      if(floats[fl].life<=0) floats.splice(fl,1);
    }
    if(msgTime>0) msgTime-=dt;
    if(shake>0) shake=Math.max(0,shake-dt*24);
    updateCamera(dt);
    if(V.ui) V.ui.sync();
  };

  // relevo de anfitrión: el nuevo arranca desde el último mundo que vio
  G.adoptFromRemote = function(R){
    foes.length = 0;
    for(var id in R.foes){
      var e = R.foes[id];
      var f = spawnFoe(e.type, e.x, e.y);
      if(f){ f.hp = f.maxhp * (e.hpFrac||1); }
    }
    bullets.length = 0; areas.length = 0;
    runT = R.runT; runGold = R.gold;
    eventIdx = 0;
    while(eventIdx < V.EVENTS.length && V.EVENTS[eventIdx].t <= runT) eventIdx++;
    for(var i=0;i<players.length;i++){
      for(var j=0;j<R.players.length;j++)
        if(R.players[j].peer === players[i].netPeer){
          players[i].x = R.players[j].x; players[i].y = R.players[j].y;
          players[i].hp = players[i].maxhp * R.players[j].hpFrac;
          players[i].down = R.players[j].down;
        }
    }
    G.state.running = true;
  };

  G.update = update;
  G.render = render;
})();
