/* Marea de Verrath — mundo por capas y denso
   Cuatro capas como en un mapa de rol clásico:
     1. suelo con variantes de baldosa
     2. caminos empedrados que serpentean en escalón y se cruzan
     3. parcelas: casas, cercados, arboledas, cementerios, cultivos, ruinas
     4. detalle menudo que rellena el vacío
   Todo se deriva del hash de las coordenadas, así que el mundo es infinito,
   idéntico en cualquier dispositivo y no ocupa memoria. Cada trozo de 8x8
   baldosas se pinta una vez a un canvas y luego solo se estampa. */
(function(){
  "use strict";
  var V = window.V;
  var T = 32, CH = 8, CHPX = T*CH;   // baldosa, trozo en baldosas, trozo en píxeles

  // hash entero de verdad: el ingenuo se apelmaza con coordenadas pequeñas
  // y el mundo salía siempre con las mismas parcelas
  function h2(x,y){
    var h = Math.imul(x|0, 0x27d4eb2d) ^ Math.imul(y|0, 0x165667b1);
    h = Math.imul(h ^ (h>>>15), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h>>>0) / 4294967296;
  }
  function hi(x,y,n){ return Math.floor(h2(x,y)*n); }

  /* ---------------- caminos ---------------- */
  function step(k,seg,salt){ return Math.round(h2(k*101+seg, 17+salt)*4)-2; }
  function rowAt(k,tx){ return k*14+7 + step(k, Math.floor(tx/7), 0); }
  function colAt(k,ty){ return k*16+8 + step(k, Math.floor(ty/8), 5); }

  function isRoad(tx,ty){
    var k, y0, yP, lo, hi2;
    for(k=Math.floor(ty/14)-1; k<=Math.floor(ty/14)+1; k++){
      y0 = rowAt(k,tx);
      if(ty===y0) return true;
      if(((tx%7)+7)%7 === 0){
        yP = k*14+7 + step(k, Math.floor(tx/7)-1, 0);
        lo = Math.min(y0,yP); hi2 = Math.max(y0,yP);
        if(ty>=lo && ty<=hi2) return true;
      }
    }
    for(k=Math.floor(tx/16)-1; k<=Math.floor(tx/16)+1; k++){
      var x0 = colAt(k,ty);
      if(tx===x0) return true;
      if(((ty%8)+8)%8 === 0){
        var xP = k*16+8 + step(k, Math.floor(ty/8)-1, 5);
        var l2=Math.min(x0,xP), h3=Math.max(x0,xP);
        if(tx>=l2 && tx<=h3) return true;
      }
    }
    return false;
  }
  function roadNear(tx,ty,r){
    for(var y=ty-r; y<=ty+r; y++) for(var x=tx-r; x<=tx+r; x++)
      if(isRoad(x,y)) return true;
    return false;
  }

  /* ---------------- parcelas ---------------- */
  // cada bloque de 8x8 baldosas recibe un uso; así los elementos salen
  // agrupados —una granja, un bosquecillo, un camposanto— y no esparcidos.
  var LOTS = ["casa","cercado","arboleda","cementerio","cultivo","ruina","arboleda","vacio"];
  function lotOf(bx,by){
    var n = h2(bx*7+13, by*11+5);
    if(n < .11) return "casa";
    if(n < .25) return "cercado";
    if(n < .45) return "arboleda";
    if(n < .57) return "cementerio";
    if(n < .67) return "cultivo";
    if(n < .80) return "ruina";
    return "vacio";
  }

  /* ---------------- pinceles ---------------- */
  function rect(g,c,x,y,w,h){ g.fillStyle=c; g.fillRect(x,y,w,h); }

  // Los elementos son sprites de píxeles, no cajas: el motor les da contorno,
  // luz desde arriba-izquierda y sombra, igual que a los personajes.
  var curStage = "distrito";
  function stamp(g, name, x, y, mode, ox, oy){
    var s = V.sprite("p_"+curStage+"_"+name, 0);
    if(!s) return;
    var dx = Math.round(x + (T - s.width)/2 + (ox||0));
    var dy = mode === "center"
      ? Math.round(y + (T - s.height)/2 + (oy||0))
      : Math.round(y + T - s.height + 5 + (oy||0));
    g.drawImage(s, dx, dy);
  }
  function tree(g,P,x,y){ stamp(g,"arbol",x,y); }
  function deadTree(g,P,x,y){ stamp(g,"arbolSeco",x,y); }
  function bush(g,P,x,y){ stamp(g,"matorral",x,y); }
  function rock(g,P,x,y){ stamp(g,"roca",x,y); }
  function fenceH(g,P,x,y){ stamp(g,"vallaH",x,y,"center"); }
  function fenceV(g,P,x,y){ stamp(g,"vallaV",x,y,"center"); }
  function grave(g,P,x,y){ stamp(g,"lapida",x,y); }
  function cross(g,P,x,y){ stamp(g,"cruz",x,y); }
  function crop(g,P,x,y){
    rect(g,P.soilD,x,y,T,T);
    stamp(g,"cultivo",x,y,"center");
  }
  function well(g,P,x,y){ stamp(g,"pozo",x,y); }
  function glowAt(g,P,x,y,r){
    g.fillStyle = P.glow;
    g.fillRect(x+16-r, y+16-r, r*2, r*2);
    g.fillRect(x+16-r*0.7, y+16-r*1.2, r*1.4, r*2.4);
  }
  function lamp(g,P,x,y){ glowAt(g,P,x,y-14,34); stamp(g,"farola",x,y); }
  function candle(g,P,x,y){ glowAt(g,P,x,y-4,22); stamp(g,"cirio",x,y); }
  function column(g,P,x,y){ stamp(g,"columna",x,y,null,0,-20); }
  function hanged(g,P,x,y){ stamp(g,"colgado",x,y,null,0,-16); }
  function house(g,P,x,y,w,h){
    // cuerpo
    rect(g,P.wallD,x,y+h-46,w,46);
    rect(g,P.wall ,x+3,y+h-43,w-6,40);
    // sillares
    for(var r=0;r<3;r++) rect(g,P.wallD, x+3, y+h-40+r*13, w-6, 2);
    // tejado a dos aguas
    var rh = 30;
    for(var i=0;i<rh;i++){
      var inset = Math.round(i*(w/2-6)/rh);
      rect(g,(i<3?P.roofL:P.roof), x+inset, y+h-46-rh+i, w-inset*2, 1);
    }
    rect(g,P.roofD,x,y+h-48,w,3);
    // puerta y ventanas
    var dx = x+Math.round(w/2)-10;
    rect(g,P.doorD,dx,y+h-26,20,26);
    rect(g,P.door ,dx+2,y+h-24,16,24);
    rect(g,P.glow2,dx+6,y+h-16,3,3);
    rect(g,P.winD,x+8,y+h-36,14,14);
    rect(g,P.win ,x+10,y+h-34,10,10);
    rect(g,P.winD,x+w-22,y+h-36,14,14);
    rect(g,P.win ,x+w-20,y+h-34,10,10);
  }
  function ruin(g,P,x,y){ stamp(g,"ruina",x,y); }
  function tuft(g,P,x,y,n){
    stamp(g,"hierba",x,y,"center", (n*20|0)-10, (n*14|0)-6);
    if(n>.84) stamp(g,"hierba",x,y,"center", 8-(n*16|0), 6);
  }
  function flower(g,P,x,y,n){
    stamp(g, n>.5?"flor":"flor2", x,y,"center", (n*18|0)-9, (n*12|0)-5);
  }
  function pebbles(g,P,x,y){
    var n=h2(x,y);
    stamp(g,"guijarro",x,y,"center",(n*18|0)-9,(n*16|0)-6);
  }

  /* ---------------- paletas por mapa ---------------- */
  // Noche, pero legible: el suelo se queda abajo en valor y todo lo que se
  // posa encima sube un escalón claro. Sin ese salto no se lee nada.
  var PAL = {
    distrito:{
      bg:"#1E1B2E",
      ground:["#232036","#282442","#211E33","#2C2748"],
      road:"#4E4864", roadL:"#6A6486", roadD:"#332E46",
      leaf:"#3A6A44", leafD:"#234029", leafL:"#5C9866",
      trunk:"#6A5038", trunkD:"#3E2C1C",
      stone:"#6E6886", stoneD:"#413A58", stoneL:"#948EAC",
      wood:"#7E5C36", woodD:"#4A3420",
      iron:"#544E6E", ironD:"#2A2640",
      wall:"#635674", wallD:"#3A3150", roof:"#A63040", roofD:"#5E1622", roofL:"#C84A5A",
      door:"#5E4228", doorD:"#30200E", win:"#FFD37A", winD:"#3A3050",
      soil:"#4E3C24", soilD:"#2E2416", crop:"#7E9246", cropD:"#4A5A22",
      flame:"#FFD98A", flameL:"#FFF6D8", glow:"rgba(255,212,126,.13)", glow2:"#FFD37A",
      wax:"#DCD6C4", waxD:"#948E7E",
      rope:"#8A7454", cloth:"#544A66", clothD:"#332C46", skin:"#A8927E",
      tuft:"#4A784F", tuftD:"#2E5034", fl1:"#C2405A", fl2:"#E8D06A"
    },
    bosque:{
      bg:"#1B2417",
      ground:["#1F2A1A","#23301E","#1C2617","#273620"],
      road:"#524C36", roadL:"#6E6748", roadD:"#332E20",
      leaf:"#356B32", leafD:"#1E401D", leafL:"#519C4B",
      trunk:"#6A5030", trunkD:"#3C2A18",
      stone:"#6A6A5C", stoneD:"#3E3E34", stoneL:"#8E8E7E",
      wood:"#7A5E34", woodD:"#46341C",
      iron:"#4E4E40", ironD:"#2A2A22",
      wall:"#5C5844", wallD:"#363328", roof:"#4E7038", roofD:"#28401C", roofL:"#6E9A4E",
      door:"#54401E", doorD:"#2C2010", win:"#DCEE84", winD:"#333A24",
      soil:"#4C3C22", soilD:"#2C2214", crop:"#86A044", cropD:"#4E6024",
      flame:"#DCEE9E", flameL:"#F4FCD2", glow:"rgba(220,238,158,.11)", glow2:"#DCEE84",
      wax:"#D6D4B8", waxD:"#94927A",
      rope:"#9A8660", cloth:"#5A6C4E", clothD:"#36422E", skin:"#A2B48E"
      , tuft:"#4C7A3E", tuftD:"#2E4E28", fl1:"#C08A38", fl2:"#B8D45E"
    },
    catedral:{
      bg:"#221F3A",
      ground:["#272444","#2C284C","#25223E","#332D58"],
      road:"#565082", roadL:"#746DA4", roadD:"#38335C",
      leaf:"#3E3C66", leafD:"#262444", leafL:"#5A5890",
      trunk:"#544C6E", trunkD:"#322C48",
      stone:"#7A749E", stoneD:"#4A4270", stoneL:"#A29CC4",
      wood:"#5E4E84", woodD:"#382C56",
      iron:"#564E80", ironD:"#2E284A",
      wall:"#665E96", wallD:"#3E3766", roof:"#7C4EA6", roofD:"#42245E", roofL:"#A070CE",
      door:"#4E4070", doorD:"#2A2144", win:"#DCC0FF", winD:"#3A3260",
      soil:"#44405E", soilD:"#2A2642", crop:"#8A78C4", cropD:"#524684",
      flame:"#F2E6FF", flameL:"#FFFFFF", glow:"rgba(220,192,255,.13)", glow2:"#DCC0FF",
      wax:"#EAE4FA", waxD:"#A29ABC",
      rope:"#8A82A8", cloth:"#524A7A", clothD:"#332C52", skin:"#BCACCE",
      tuft:"#4A4682", tuftD:"#302C58", fl1:"#A870E0", fl2:"#D8C0FF"
    }
  };

  /* ---------------- pintado de un trozo ---------------- */
  function paintChunk(cx, cy, stageKey){
    var P = PAL[stageKey];
    curStage = stageKey;
    V.buildProps(stageKey, P);
    var c = document.createElement("canvas");
    c.width = CHPX; c.height = CHPX;
    var g = c.getContext("2d");
    var ox = cx*CH, oy = cy*CH;

    // 1. suelo
    for(var y=0; y<CH; y++) for(var x=0; x<CH; x++){
      var tx=ox+x, ty=oy+y, n=h2(tx,ty);
      rect(g, P.ground[hi(tx*3,ty*5,P.ground.length)], x*T, y*T, T, T);
      if(n>.86){ rect(g, P.ground[0], x*T+hi(tx,ty,3)*8, y*T+hi(ty,tx,3)*8, 10, 6); }
    }

    // 2. caminos
    for(var y2=0; y2<CH; y2++) for(var x2=0; x2<CH; x2++){
      var tx2=ox+x2, ty2=oy+y2;
      if(!isRoad(tx2,ty2)) continue;
      var px=x2*T, py=y2*T;
      rect(g,P.roadD,px,py,T,T);
      rect(g,P.road,px+1,py+1,T-2,T-2);
      // losas
      var s=hi(tx2*7,ty2*3,4);
      rect(g,P.roadL,px+2,py+2,14,1);
      rect(g,P.roadD,px+2+s,py+15,T-6,2);
      rect(g,P.roadD,px+15,py+2,2,12);
      rect(g,P.roadD,px+8,py+18,2,12);
      if(!isRoad(tx2,ty2-1)) rect(g,P.roadL,px,py,T,2);
      if(!isRoad(tx2,ty2+1)) rect(g,P.roadD,px,py+T-3,T,3);
    }

    // 3. parcelas (con margen: lo que asoma de bloques vecinos también se pinta)
    for(var by=cy-1; by<=cy+1; by++) for(var bx=cx-1; bx<=cx+1; bx++){
      drawLot(g, bx, by, ox, oy, P, stageKey);
    }

    // 4. detalle menudo sobre lo que quede libre
    for(var y3=0; y3<CH; y3++) for(var x3=0; x3<CH; x3++){
      var tx3=ox+x3, ty3=oy+y3;
      if(isRoad(tx3,ty3)) continue;
      var d = h2(tx3*13+1, ty3*17+3);
      var px3=x3*T, py3=y3*T;
      // suficiente para que no haya vacíos muertos, poco para que los
      // enemigos sigan leyéndose sobre el suelo
      if(d > .84) tuft(g,P,px3,py3,d);
      else if(d > .78) flower(g,P,px3,py3,d);
      else if(d > .73) pebbles(g,P,px3,py3);
      else if(d < .035) bush(g,P,px3,py3);
    }
    return c;
  }

  function drawLot(g, bx, by, ox, oy, P, stageKey){
    var type = lotOf(bx,by);
    if(type === "vacio") return;
    var baseX = bx*CH, baseY = by*CH;
    function px(tx){ return (tx-ox)*T; }
    function py(ty){ return (ty-oy)*T; }
    function free(tx,ty){ return !roadNear(tx,ty,0); }

    var i,j,tx,ty;
    if(type === "casa"){
      // la casa ocupa el centro del bloque y mira al camino
      tx = baseX+2; ty = baseY+3;
      var ok = true;
      for(i=0;i<4;i++) for(j=0;j<3;j++) if(isRoad(tx+i,ty+j)) ok=false;
      if(ok) house(g,P,px(tx),py(ty),T*4,T*3);
      // cercado alrededor de la casa
      for(i=-1;i<=4;i++){
        if(free(tx+i,ty-1)) fenceH(g,P,px(tx+i),py(ty-1));
        if(free(tx+i,ty+3)) fenceH(g,P,px(tx+i),py(ty+3));
      }
      for(j=0;j<3;j++){
        if(free(tx-1,ty+j)) fenceV(g,P,px(tx-1),py(ty+j));
        if(free(tx+4,ty+j)) fenceV(g,P,px(tx+4),py(ty+j));
      }
      if(free(baseX+6,baseY+6)) (stageKey==="catedral"?candle:lamp)(g,P,px(baseX+6),py(baseY+6));
    }
    else if(type === "cercado"){
      var w = 5, h = 4;
      tx = baseX+1; ty = baseY+2;
      for(i=0;i<w;i++){
        if(free(tx+i,ty)) fenceH(g,P,px(tx+i),py(ty));
        if(free(tx+i,ty+h)) fenceH(g,P,px(tx+i),py(ty+h));
      }
      for(j=1;j<h;j++){
        if(free(tx,ty+j)) fenceV(g,P,px(tx),py(ty+j));
        if(free(tx+w-1,ty+j)) fenceV(g,P,px(tx+w-1),py(ty+j));
      }
      for(i=1;i<w-1;i++) for(j=1;j<h;j++){
        var n=h2(tx+i*3,ty+j*7);
        if(n>.72 && free(tx+i,ty+j)) bush(g,P,px(tx+i),py(ty+j));
        else if(n<.14 && free(tx+i,ty+j)) rock(g,P,px(tx+i),py(ty+j),1);
      }
    }
    else if(type === "arboleda"){
      for(i=0;i<CH;i++) for(j=0;j<CH;j++){
        tx=baseX+i; ty=baseY+j;
        var n2=h2(tx*5+2, ty*9+4);
        if(!free(tx,ty)) continue;
        if(n2 > .62) tree(g,P,px(tx),py(ty), n2>.86);
        else if(n2 > .54) bush(g,P,px(tx),py(ty));
      }
    }
    else if(type === "cementerio"){
      for(i=1;i<CH-1;i++) for(j=1;j<CH-1;j++){
        tx=baseX+i; ty=baseY+j;
        if(!free(tx,ty)) continue;
        var n3=h2(tx*11+6, ty*13+2);
        if(i%2===0 && j%2===0){
          if(n3>.55) grave(g,P,px(tx),py(ty));
          else if(n3>.30) cross(g,P,px(tx),py(ty));
        } else if(n3>.90) deadTree(g,P,px(tx),py(ty));
      }
    }
    else if(type === "cultivo"){
      for(i=1;i<CH-1;i++) for(j=2;j<CH-1;j++){
        tx=baseX+i; ty=baseY+j;
        if(!free(tx,ty)) continue;
        crop(g,P,px(tx),py(ty));
      }
      for(i=0;i<CH;i++){
        tx=baseX+i; ty=baseY+1;
        if(free(tx,ty)) fenceH(g,P,px(tx),py(ty));
      }
    }
    else if(type === "ruina"){
      for(i=0;i<CH;i++) for(j=0;j<CH;j++){
        tx=baseX+i; ty=baseY+j;
        if(!free(tx,ty)) continue;
        var n4=h2(tx*17+8, ty*7+11);
        if(stageKey==="catedral" && n4>.86) column(g,P,px(tx),py(ty));
        else if(stageKey==="bosque" && n4>.88) hanged(g,P,px(tx),py(ty));
        else if(n4>.90) ruin(g,P,px(tx),py(ty));
        else if(n4>.78) rock(g,P,px(tx),py(ty));
        else if(n4>.70) deadTree(g,P,px(tx),py(ty));
        else if(n4<.05) well(g,P,px(tx),py(ty));
      }
    }
  }

  /* ---------------- caché e interfaz ---------------- */
  var cache = new Map(), cacheKeyStage = null, order = [];
  function chunkAt(cx,cy,stageKey){
    if(cacheKeyStage !== stageKey){ cache.clear(); order.length=0; cacheKeyStage = stageKey; }
    var k = cx+","+cy;
    var c = cache.get(k);
    if(c) return c;
    c = paintChunk(cx,cy,stageKey);
    cache.set(k,c); order.push(k);
    if(order.length > 90){ var old=order.shift(); cache.delete(old); }
    return c;
  }

  V.world = {
    TILE:T,
    palette:function(k){ return PAL[k]; },
    bg:function(k){ return PAL[k].bg; },
    isRoad:isRoad,
    reset:function(){ cache.clear(); order.length=0; cacheKeyStage=null; },
    draw:function(g, camX, camY, zoom, w, h, stageKey){
      var hw=(w/zoom)/2, hh=(h/zoom)/2;
      var x0=Math.floor((camX-hw)/CHPX), x1=Math.floor((camX+hw)/CHPX);
      var y0=Math.floor((camY-hh)/CHPX), y1=Math.floor((camY+hh)/CHPX);
      for(var cy=y0; cy<=y1; cy++) for(var cx=x0; cx<=x1; cx++){
        g.drawImage(chunkAt(cx,cy,stageKey), cx*CHPX, cy*CHPX);
      }
    }
  };
})();
