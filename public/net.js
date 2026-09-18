/* Marea de Verrath — cacería en línea, con dos transportes
   El mismo archivo vale en los dos sitios:
     · dentro de un artifact de Claude -> canal de sala (presence)
     · servido desde tu propio dominio  -> WebSocket contra el Worker
   Arriba de cualquiera de los dos va siempre el mismo modelo: un jugador es
   ANFITRIÓN y simula todo; los demás mandan su vector de movimiento y dibujan
   lo que reciben. Todo son paquetes de estado absoluto, así que perder uno no
   rompe nada: el siguiente trae la verdad entera. */
(function(){
  "use strict";
  var V = window.V = window.V || {};
  var G = V.game;

  var T = null;   // transporte activo
  var N = V.net = {
    ready:false, available:false, online:false, isHost:false,
    transport:"none", code:null,
    me:null, hostPeer:null, peers:[], roster:[],
    stats:{bytes:0, hz:0, peers:0, role:"—", ping:0},
    lastError:null
  };

  /* ---------------- tablas de índices (el binario manda números) ------- */
  var FOE_KEYS = null, BUL_SPR = ["b_daga","b_runa","b_hacha","b_cruz","b_fuego",
    "b_biblia","b_runatrace","b_bala","b_gato","b_pajaro","b_pajaro_neg"];
  var AREA_KINDS = ["slash","pool","bolt","flash","lance","wave","blast","aura"];
  function foeKeys(){ return FOE_KEYS || (FOE_KEYS = Object.keys(V.FOES)); }

  /* ---------------- escritura y lectura de binario --------------------- */
  function Writer(size){ this.b = new Uint8Array(size); this.p = 0; }
  Writer.prototype.u8 = function(v){ this.b[this.p++] = v & 255; };
  Writer.prototype.u16 = function(v){ this.b[this.p++] = v & 255; this.b[this.p++] = (v>>8) & 255; };
  Writer.prototype.i16 = function(v){
    v = Math.max(-32768, Math.min(32767, Math.round(v)));
    if(v < 0) v += 65536;
    this.b[this.p++] = v & 255; this.b[this.p++] = (v>>8) & 255;
  };
  Writer.prototype.out = function(){
    var s = "", chunk = 4096;
    for(var i=0; i<this.p; i+=chunk)
      s += String.fromCharCode.apply(null, this.b.subarray(i, Math.min(this.p, i+chunk)));
    return btoa(s);
  };
  function Reader(str){
    var bin = atob(str);
    this.b = new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) this.b[i] = bin.charCodeAt(i);
    this.p = 0;
  }
  Reader.prototype.u8 = function(){ return this.b[this.p++]; };
  Reader.prototype.u16 = function(){ var v = this.b[this.p] | (this.b[this.p+1]<<8); this.p+=2; return v; };
  Reader.prototype.i16 = function(){ var v = this.u16(); return v > 32767 ? v-65536 : v; };

  /* ---------------- el anfitrión empaqueta el mundo -------------------- */
  var LIM = {foes:150, bullets:64, gems:48, drops:20, areas:18};

  function nearest(list, ox, oy, max){
    if(list.length <= max) return list;
    var arr = list.slice();
    arr.sort(function(a,b){
      return ((a.x-ox)*(a.x-ox)+(a.y-oy)*(a.y-oy)) - ((b.x-ox)*(b.x-ox)+(b.y-oy)*(b.y-oy));
    });
    return arr.slice(0, max);
  }

  N.buildSnapshot = function(){
    var w = G.expose();
    var ox = Math.round(G.cam.x), oy = Math.round(G.cam.y);
    var keys = foeKeys();
    var wr = new Writer(4000);
    wr.u8(1);
    wr.u8(G.state.drafting ? 1 : 0);
    wr.i16(ox); wr.i16(oy);
    wr.u16(Math.min(65535, Math.round(G.time()*10)));
    wr.u16(Math.min(65535, G.runGold()));

    var ps = w.players;
    wr.u8(ps.length);
    for(var i=0;i<ps.length;i++){
      var p = ps[i];
      wr.u8(N.roster.indexOf(p.netPeer||"") + 1);
      wr.u8(Math.max(0, V.HERO_KEYS.indexOf(p.hero)));
      wr.i16(p.x-ox); wr.i16(p.y-oy);
      wr.u8(Math.round(Math.max(0,Math.min(1, p.hp/p.maxhp))*255));
      wr.u8(Math.min(255, p.lvl));
      wr.u8((p.down?1:0) | (p.hurt>0?2:0) | (p.face<0?4:0) | (p.iframe>0?8:0));
      wr.u8(Math.min(255, Math.round(p.xp/Math.max(1,p.next)*255)));
    }

    var fs = nearest(w.foes, ox, oy, LIM.foes);
    wr.u8(fs.length);
    for(var f=0; f<fs.length; f++){
      var fo = fs[f];
      wr.u16(fo.nid & 65535);
      wr.i16(fo.x-ox); wr.i16(fo.y-oy);
      wr.u8(Math.max(0, keys.indexOf(fo.type)));
      wr.u8((fo.face<0?1:0) | (fo.hit>0?2:0) | (fo.freeze>0?4:0) |
            ((fo.def.elite||fo.def.reaper) ? 8:0));
      if(fo.def.elite||fo.def.reaper) wr.u8(Math.round(Math.max(0,Math.min(1,fo.hp/fo.maxhp))*255));
    }

    var bs = nearest(w.bullets, ox, oy, LIM.bullets);
    wr.u8(bs.length);
    for(var b=0;b<bs.length;b++){
      var bu = bs[b];
      wr.u16(bu.nid & 65535);
      wr.i16(bu.x-ox); wr.i16(bu.y-oy);
      wr.u8(Math.max(0, BUL_SPR.indexOf(bu.spr)));
      wr.u8(Math.round(((bu.rotA||0) % 6.283 + 6.283) % 6.283 / 6.283 * 255));
      wr.u8(Math.min(255, Math.round(bu.r)));
    }

    var gs = nearest(w.gems, ox, oy, LIM.gems);
    wr.u8(gs.length);
    for(var g=0;g<gs.length;g++){
      wr.i16(gs[g].x-ox); wr.i16(gs[g].y-oy);
      wr.u8(gs[g].v>=5?2:(gs[g].v>=2?1:0));
    }
    var ds = nearest(w.drops, ox, oy, LIM.drops);
    wr.u8(ds.length);
    for(var d=0;d<ds.length;d++){
      wr.i16(ds[d].x-ox); wr.i16(ds[d].y-oy);
      wr.u8(ds[d].kind==="oro"?0:(ds[d].kind==="carne"?1:2));
    }
    var as = nearest(w.areas, ox, oy, LIM.areas);
    wr.u8(as.length);
    for(var a=0;a<as.length;a++){
      var ar = as[a];
      wr.i16(ar.x-ox); wr.i16(ar.y-oy);
      wr.u8(Math.max(0, AREA_KINDS.indexOf(ar.kind)));
      wr.u8(Math.min(255, Math.round((ar.r || Math.max(ar.w||0, ar.h||0)/2)/2)));
      wr.u8(Math.round(Math.max(0,Math.min(1, ar.life/(ar.max||1)))*255));
      wr.u8(Math.round(((ar.ang||0) % 6.283 + 6.283) % 6.283 / 6.283 * 255));
    }
    return wr.out();
  };

  /* ---------------- el invitado desempaqueta --------------------------- */
  var remote = N.remote = {
    players:[], foes:{}, bullets:{}, gems:[], drops:[], areas:[],
    ox:0, oy:0, runT:0, gold:0, drafting:false, stamp:0
  };

  N.applySnapshot = function(str){
    var rd;
    try{ rd = new Reader(str); }catch(e){ return; }
    if(rd.u8() !== 1) return;
    remote.drafting = !!rd.u8();
    var ox = rd.i16(), oy = rd.i16();
    remote.ox = ox; remote.oy = oy;
    remote.runT = rd.u16()/10;
    remote.gold = rd.u16();
    remote.stamp = performance.now();

    var np = rd.u8(), ps = [];
    for(var i=0;i<np;i++){
      var owner = rd.u8(), hero = rd.u8();
      var x = ox+rd.i16(), y = oy+rd.i16();
      var hp = rd.u8()/255, lvl = rd.u8(), fl = rd.u8(), xp = rd.u8()/255;
      ps.push({peer: owner? N.roster[owner-1] : null, hero:V.HERO_KEYS[hero]||"cazador",
        x:x, y:y, hpFrac:hp, lvl:lvl, down:!!(fl&1), hurt:!!(fl&2),
        face:(fl&4)?-1:1, iframe:!!(fl&8), xpFrac:xp});
    }
    remote.players = ps;

    var keys = foeKeys();
    var nf = rd.u8(), seenF = {};
    for(var f=0; f<nf; f++){
      var id = rd.u16();
      var fx = ox+rd.i16(), fy = oy+rd.i16();
      var t = rd.u8(), fl2 = rd.u8();
      var big = !!(fl2&8), hpf = big ? rd.u8()/255 : 1;
      var e = remote.foes[id];
      if(!e){ e = remote.foes[id] = {x:fx, y:fy}; }
      e.tx = fx; e.ty = fy;
      e.type = keys[t] || keys[0];
      e.face = (fl2&1)?-1:1; e.hitF = !!(fl2&2); e.freezeF = !!(fl2&4);
      e.hpFrac = hpf;
      seenF[id] = 1;
    }
    for(var k in remote.foes) if(!seenF[k]) delete remote.foes[k];

    var nb = rd.u8(), seenB = {};
    for(var b=0;b<nb;b++){
      var bid = rd.u16();
      var bx = ox+rd.i16(), by = oy+rd.i16();
      var spr = rd.u8(), rot = rd.u8(), rr = rd.u8();
      var eb = remote.bullets[bid];
      if(!eb) eb = remote.bullets[bid] = {x:bx, y:by};
      eb.tx = bx; eb.ty = by;
      eb.spr = BUL_SPR[spr] || BUL_SPR[0];
      eb.rotA = rot/255*6.283; eb.r = rr;
      seenB[bid] = 1;
    }
    for(var k2 in remote.bullets) if(!seenB[k2]) delete remote.bullets[k2];

    var ng = rd.u8(); remote.gems = [];
    for(var g=0;g<ng;g++) remote.gems.push({x:ox+rd.i16(), y:oy+rd.i16(), tier:rd.u8()});
    var nd = rd.u8(); remote.drops = [];
    for(var d=0;d<nd;d++) remote.drops.push({x:ox+rd.i16(), y:oy+rd.i16(), kind:rd.u8()});
    var na = rd.u8(); remote.areas = [];
    for(var a=0;a<na;a++)
      remote.areas.push({x:ox+rd.i16(), y:oy+rd.i16(), kind:AREA_KINDS[rd.u8()]||"pool",
        r:rd.u8()*2, life:rd.u8()/255, ang:rd.u8()/255*6.283});
  };

  /* ==================== TRANSPORTE A: sala del artifact ================= */
  function roomTransport(room){
    return {
      kind:"room",
      presence:function(patch){ try{ return room.presence(patch); }catch(e){ return Promise.resolve(); } },
      emit:function(topic, data){ try{ return room.emit(topic, data); }catch(e){ return Promise.resolve(); } },
      peers:function(){
        return room.peers().filter(function(p){ return p.kind === "viewer"; }).map(function(p){
          return {peer:p.peer, presence:p.presence||{}, isMe:p.isMe, sameTab:p.sameTab};
        });
      },
      close:function(){}
    };
  }

  /* ==================== TRANSPORTE B: WebSocket propio ================== */
  function wsTransport(code, onChange){
    var map = {}, myId = null, sock = null, closed = false, queue = [];
    var mine = {};
    var pingAt = 0, pingSeq = 0;

    function url(){
      var proto = location.protocol === "https:" ? "wss:" : "ws:";
      return proto + "//" + location.host + "/ws?sala=" + encodeURIComponent(code);
    }
    function send(obj){
      if(sock && sock.readyState === 1){ sock.send(JSON.stringify(obj)); return true; }
      return false;
    }
    function connect(){
      try{ sock = new WebSocket(url()); }
      catch(e){ N.lastError = "ws_failed"; onChange(); return; }
      sock.onopen = function(){
        N.lastError = null;
        // reafirmamos nuestra presencia entera: estado absoluto, sin historial
        send({t:"p", d:mine});
        while(queue.length) send(queue.shift());
        onChange();
      };
      sock.onmessage = function(ev){
        var m;
        try{ m = JSON.parse(ev.data); }catch(e){ return; }
        if(m.t === "hi"){ myId = m.id; onChange(); }
        else if(m.t === "peers"){
          map = {};
          for(var i=0;i<m.list.length;i++) map[m.list[i].id] = m.list[i].pres || {};
          onChange();
        }
        else if(m.t === "p"){
          var cur = map[m.id] || (map[m.id] = {});
          for(var k in m.d){ if(m.d[k] === null) delete cur[k]; else cur[k] = m.d[k]; }
          onChange();
        }
        else if(m.t === "join"){ if(!map[m.id]) map[m.id] = {}; onChange(); }
        else if(m.t === "left"){ delete map[m.id]; onChange(); }
        else if(m.t === "ev"){ N.route(m.topic, {peer:m.id, data:m.d}); }
        else if(m.t === "pong" && m.n === pingSeq){ N.stats.ping = Math.round(performance.now()-pingAt); }
      };
      sock.onclose = function(){
        if(closed) return;
        N.lastError = "ws_closed";
        onChange();
        setTimeout(function(){ if(!closed) connect(); }, 1500);   // reconexión
      };
      sock.onerror = function(){ N.lastError = "ws_error"; onChange(); };
    }
    connect();

    return {
      kind:"ws",
      presence:function(patch){
        for(var k in patch){ if(patch[k] === null) delete mine[k]; else mine[k] = patch[k]; }
        if(myId){ var cur = map[myId] || (map[myId] = {}); for(var j in patch) cur[j] = patch[j]; }
        if(!send({t:"p", d:patch}) && queue.length < 8) queue.push({t:"p", d:mine});
        return Promise.resolve();
      },
      emit:function(topic, data){
        if(!send({t:"ev", topic:topic, d:data}) && queue.length < 8)
          queue.push({t:"ev", topic:topic, d:data});
        return Promise.resolve();
      },
      peers:function(){
        var out = [];
        for(var id in map)
          out.push({peer:id, presence:map[id] || {}, isMe:id === myId, sameTab:id === myId});
        return out;
      },
      ping:function(){
        pingAt = performance.now(); pingSeq++;
        send({t:"ping", n:pingSeq});
      },
      connected:function(){ return !!(sock && sock.readyState === 1); },
      close:function(){ closed = true; try{ sock.close(); }catch(e){} }
    };
  }

  /* ---------------- arranque ------------------------------------------- */
  function inClaude(){ return !!(window.claude && window.claude.use); }

  N.roomCodeFromUrl = function(){
    var h = (location.hash || "").replace("#","").toUpperCase();
    return /^[A-Z0-9]{4,8}$/.test(h) ? h : null;
  };
  N.newCode = function(){
    var A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = "";
    for(var i=0;i<4;i++) s += A[Math.floor(Math.random()*A.length)];
    return s;
  };

  N.init = function(onChange){
    if(onChange) N.onChange = onChange;
    if(!N.onChange) N.onChange = function(){};
    N.ready = false; N.lastError = null;
    N.onChange();

    if(inClaude()){
      N.transport = "room";
      Promise.resolve(window.claude.use("room")).then(function(r){
        N.ready = true;
        N.available = !!r;
        if(!r){ N.lastError = N.lastError || "no_room"; N.onChange(); return; }
        T = roomTransport(r);
        try{
          r.onPeers(function(){ refreshPeers(); }, function(e){
            N.lastError = e && e.code; N.available = false; N.onChange();
          });
          r.on("ctl", function(m){ N.route("ctl", m); }, function(e){ N.lastError = e && e.code; });
          r.on("pick", function(m){ N.route("pick", m); }, function(e){ N.lastError = e && e.code; });
        }catch(e){ N.available = false; N.lastError = "listen_failed"; }
        T.presence({v:1, hero:"cazador", lobby:1, t:Date.now()}).then(function(){
          N.lastError = null; N.onChange();
        }).catch(function(e){
          N.lastError = (e && e.code) || "presence_failed";
          if(N.lastError === "not_granted" || N.lastError === "revoked") N.available = false;
          N.onChange();
        });
        refreshPeers();
        N.onChange();
      }).catch(function(e){
        N.ready = true; N.available = false;
        N.lastError = (e && e.code) || "use_failed";
        N.onChange();
      });
      return;
    }

    // fuera de Claude: servidor propio, pero solo si hay uno del que colgarse
    if(!location.host || !/^https?:$/.test(location.protocol)){
      N.transport = "none"; N.ready = true; N.available = false;
      N.lastError = "no_host";
      N.onChange();
      return;
    }
    N.transport = "ws";
    N.ready = true;
    N.available = true;
    N.code = N.code || N.roomCodeFromUrl() || N.newCode();
    if(T && T.close) T.close();
    T = wsTransport(N.code, function(){ refreshPeers(); });
    T.presence({v:1, hero:"cazador", lobby:1, t:Date.now()});
    N.onChange();
  };

  N.setCode = function(code){
    code = String(code||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8);
    if(code.length < 4) return false;
    N.code = code;
    try{ location.hash = code; }catch(e){}
    if(N.transport === "ws"){ N.init(); }
    return true;
  };
  N.shareUrl = function(){
    return N.transport === "ws"
      ? (location.origin + location.pathname + "#" + (N.code||""))
      : location.href;
  };

  N.retry = function(){
    if(!inClaude()){ N.init(); return; }
    Promise.resolve(window.claude.use("permissions")).then(function(perms){
      if(perms && typeof perms.request === "function")
        return Promise.resolve(perms.request(["room"])).catch(function(){});
    }).catch(function(){}).then(function(){ N.init(); });
  };

  /* ---------------- vecindario ----------------------------------------- */
  function refreshPeers(){
    if(!T) return;
    var all = T.peers();
    N.peers = all;
    var mine = all.filter(function(p){ return p.isMe && p.sameTab; })[0];
    N.me = mine ? mine.peer : null;
    var ready = all.filter(function(p){ return p.presence && p.presence.play; });
    ready.sort(function(a,b){ return a.peer < b.peer ? -1 : 1; });
    var newHost = ready.length ? ready[0].peer : null;
    if(newHost !== N.hostPeer){
      N.hostPeer = newHost;
      N.isHost = (newHost === N.me);
      if(N.isHost && N.online) adoptWorld();
    }
    N.roster = ready.map(function(p){ return p.peer; });
    N.stats.peers = all.length;
    N.stats.role = !N.online ? "—" : (N.isHost ? "anfitrión" : "invitado");
    N.onChange();
  }
  function adoptWorld(){
    if(!remote.players.length) return;
    G.adoptFromRemote(remote);
    G.say("Has pasado a ser el anfitrión.");
  }
  function hostPeerObj(){
    for(var i=0;i<N.peers.length;i++) if(N.peers[i].peer === N.hostPeer) return N.peers[i];
    return null;
  }

  /* ---------------- momentos sueltos ----------------------------------- */
  N.route = function(topic, msg){
    if(topic === "ctl") onCtl(msg);
    else if(topic === "pick") onPick(msg);
  };
  function onCtl(msg){
    var d = msg && msg.data;
    if(!d || typeof d !== "object") return;
    if(msg.peer !== N.hostPeer) return;
    if(d.k === "start" && !N.isHost){
      G.setStage(String(d.stage||"distrito"));
      G.startGuest();
      if(V.ui) V.ui.enterOnlineRun();
    } else if(d.k === "end" && !N.isHost){
      if(V.ui) V.ui.endRun(!!d.won, d.gold|0);
    } else if(d.k === "draft" && d.to === N.me){
      if(V.ui) V.ui.showRemoteDraft(d.opts || []);
    }
  }
  function onPick(msg){
    if(!N.isHost) return;
    var d = msg && msg.data;
    if(!d || typeof d.i !== "number") return;
    if(V.ui) V.ui.hostApplyRemotePick(msg.peer, d.i|0);
  }
  N.emitCtl = function(obj){ if(T && N.online) T.emit("ctl", obj); };
  N.emitPick = function(i){ if(T) T.emit("pick", {i:i}); };

  /* ---------------- latido --------------------------------------------- */
  var myInput = {mx:0, my:0}, lastPresence = 0, lastSnap = 0, snapAcc = 0, snapCount = 0, lastPing = 0;

  N.setInput = function(mx,my){ myInput.mx = mx; myInput.my = my; };
  N.setLobby = function(hero, playing){
    if(!T) return;
    T.presence({hero:hero, play:playing?1:0, lobby:playing?0:1});
  };

  N.tick = function(){
    if(!T || !N.online) return;
    var now = performance.now();

    if(N.isHost){
      if(now - lastSnap > 45){
        lastSnap = now;
        var s;
        try{ s = N.buildSnapshot(); }catch(e){ s = null; }
        if(s && s.length < 3600){
          T.presence({snap:s, roster:N.roster, host:1});
          N.stats.bytes = s.length;
          snapCount++;
        }
      }
    } else {
      if(now - lastPresence > 33){
        lastPresence = now;
        T.presence({ix:Math.round(myInput.mx*100), iy:Math.round(myInput.my*100)});
      }
      var hp = hostPeerObj();
      if(hp && hp.presence && hp.presence.snap && hp.presence.snap !== N.lastSnapStr){
        N.lastSnapStr = hp.presence.snap;
        if(hp.presence.roster) N.roster = hp.presence.roster;
        N.applySnapshot(hp.presence.snap);
        N.stats.bytes = hp.presence.snap.length;
        snapCount++;
      }
    }
    if(T.ping && now - lastPing > 3000){ lastPing = now; T.ping(); }
    snapAcc += 1;
    if(snapAcc >= 60){ N.stats.hz = Math.round(snapCount/(snapAcc/60)); snapAcc = 0; snapCount = 0; }
  };

  N.inputOf = function(peer){
    for(var i=0;i<N.peers.length;i++){
      var p = N.peers[i];
      if(p.peer !== peer) continue;
      var pr = p.presence || {};
      return {mx:(pr.ix||0)/100, my:(pr.iy||0)/100};
    }
    return {mx:0, my:0};
  };
  N.heroOf = function(peer){
    for(var i=0;i<N.peers.length;i++)
      if(N.peers[i].peer === peer) return (N.peers[i].presence||{}).hero || "cazador";
    return "cazador";
  };
  N.playingPeers = function(){ return N.roster.slice(); };
  N.goOnline = function(on){
    N.online = on;
    N.stats.role = !on ? "—" : (N.isHost ? "anfitrión" : "invitado");
    refreshPeers();
  };
})();
