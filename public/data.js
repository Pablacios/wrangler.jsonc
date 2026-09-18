/* Marea de Verrath — héroes, pasivos, enemigos y mapas */
(function(){
  "use strict";
  var V = window.V = window.V || {};

  /* ================= HÉROES ================= */
  V.HEROES = {
    cazador:{ name:"El Cazador", spr:"h_cazador", color:"#8E1F2F", glyph:"†",
      role:"Látigo y abrigo curtido. El arma más fiable del páramo.",
      hp:130, speed:112, weapon:"latigo",
      mods:{ might:1.0 }, note:"+10% de daño a partir del nivel 12" },
    vicaria:{ name:"La Vicaria", spr:"h_vicaria", color:"#C0A24E", glyph:"✚",
      role:"Cruces que vuelven a su mano. Bendecida con suerte.",
      hp:110, speed:116, weapon:"cruz",
      mods:{ luck:1.25 }, note:"+25% de suerte" },
    doctor:{ name:"Doctor de la Peste", spr:"h_doctor", color:"#9AA88C", glyph:"◉",
      role:"Riega el suelo de plaga. Recarga más rápida que nadie.",
      hp:100, speed:114, weapon:"agua",
      mods:{ cooldown:0.90 }, note:"−10% de recarga" },
    bestia:{ name:"Hija de la Bestia", spr:"h_bestia", color:"#5A3A2E", glyph:"≈",
      role:"Sangre bestial: rápida, feroz y con el ajo pegado a la piel.",
      hp:120, speed:140, weapon:"ajo",
      mods:{ moveSpeed:1.1 }, note:"+10% de velocidad" },
    astronoma:{ name:"La Astrónoma", spr:"h_astronoma", color:"#8FA8FF", glyph:"✦",
      role:"Lee el cielo y lo deja caer. Área amplia, cuerpo frágil.",
      hp:90, speed:118, weapon:"rayos",
      mods:{ area:1.15 }, note:"+15% de área" },
    verdugo:{ name:"El Verdugo", spr:"h_verdugo", color:"#8A8A92", glyph:"⌁",
      role:"Hachas pesadas. Poco alcance, mucho estrago.",
      hp:145, speed:104, weapon:"hacha",
      mods:{ might:1.15, cooldown:1.08 }, note:"+15% de daño, −8% de recarga" }
  };
  V.HERO_KEYS = Object.keys(V.HEROES);

  /* ================= PASIVOS =================
     Réplica del modelo de estadísticas: cada uno toca una estadística global
     que luego multiplica a todas las armas. */
  V.PASSIVES = {
    espinaca:  {name:"Sangre de Hierro", glyph:"◆", color:"#C2263A", max:5, stat:"might",     step:0.10, text:"+10% de daño"},
    coraza:    {name:"Coraza",           glyph:"▣", color:"#8A8C9E", max:5, stat:"armor",     step:1,    text:"−1 de daño recibido"},
    corazon:   {name:"Corazón Hueco",    glyph:"♥", color:"#B03040", max:5, stat:"maxHealth", step:0.20, text:"+20% de vida máxima"},
    pomarola:  {name:"Hierba de Sangre", glyph:"✚", color:"#5FBF6A", max:5, stat:"recovery",  step:0.25, text:"+0,25 de vida por segundo"},
    tomo:      {name:"Tomo Vacío",       glyph:"▭", color:"#8FA8FF", max:5, stat:"cooldown",  step:-0.08,text:"−8% de recarga"},
    candelabro:{name:"Candelabro",       glyph:"◎", color:"#E5C34A", max:5, stat:"area",      step:0.10, text:"+10% de área"},
    brazal:    {name:"Brazal",           glyph:"➤", color:"#C9CEDC", max:5, stat:"speed",     step:0.10, text:"+10% de velocidad de proyectil"},
    encantador:{name:"Encantador",       glyph:"∞", color:"#C08BEF", max:5, stat:"duration",  step:0.10, text:"+10% de duración"},
    duplicador:{name:"Duplicador",       glyph:"⁝", color:"#FFE066", max:2, stat:"amount",    step:1,    text:"+1 proyectil"},
    alas:      {name:"Alas",             glyph:"⇈", color:"#E8EEFF", max:5, stat:"moveSpeed", step:0.10, text:"+10% de velocidad"},
    iman:      {name:"Piedra Imán",      glyph:"◌", color:"#46E0C8", max:5, stat:"magnet",    step:0.25, text:"+25% de radio de recogida"},
    trebol:    {name:"Trébol",           glyph:"✧", color:"#7CC6FF", max:5, stat:"luck",      step:0.10, text:"+10% de suerte"},
    corona:    {name:"Corona",           glyph:"♛", color:"#E5B95C", max:5, stat:"growth",    step:0.08, text:"+8% de experiencia"},
    mascara:   {name:"Máscara de Piedra",glyph:"☗", color:"#9A7220", max:5, stat:"greed",     step:0.10, text:"+10% de oro"},
    calavera:  {name:"Calavera Maldita", glyph:"☠", color:"#A9B6D6", max:5, stat:"curse",     step:0.10, text:"+10% de enemigos… y de recompensa"},
    tiramisu:  {name:"Reliquia",         glyph:"❂", color:"#FFD36B", max:2, stat:"revival",   step:1,    text:"Revives una vez más"}
  };
  V.PASSIVE_KEYS = Object.keys(V.PASSIVES);

  /* ================= ENEMIGOS ================= */
  V.FOES = {
    aldeano:  {hp:12,  speed:46, dmg:7,  r:11, spr:"f_aldeano", xp:1, gold:.06},
    sabueso:  {hp:18,  speed:92, dmg:10, r:11, spr:"f_sabueso", xp:1, gold:.06},
    cuervo:   {hp:14,  speed:108,dmg:9,  r:10, spr:"f_cuervo",  xp:1, gold:.05, erratic:true},
    bruto:    {hp:110, speed:50, dmg:20, r:14, spr:"f_bruto",   xp:4, gold:.14},
    ahorcado: {hp:34,  speed:58, dmg:13, r:12, spr:"f_ahorcado",xp:2, gold:.08},
    lobo:     {hp:44,  speed:96, dmg:16, r:12, spr:"f_lobo",    xp:2, gold:.09},
    monja:    {hp:40,  speed:62, dmg:15, r:11, spr:"f_monja",   xp:2, gold:.09},
    gargola:  {hp:150, speed:56, dmg:24, r:14, spr:"f_gargola", xp:5, gold:.18},
    elite:    {hp:1500,speed:50, dmg:34, r:28, spr:"f_elite",   xp:70, gold:1, elite:true},
    segadora: {hp:999999,speed:120,dmg:9999,r:30,spr:"f_segadora",xp:0, gold:0, reaper:true}
  };

  /* ================= MAPAS =================
     Tres distritos góticos. Cada uno con su paleta, su decorado dibujado
     por celdas, su elenco de enemigos y su propio guion de oleadas. */

  function deco(g, cx, cy, C, n, stage){
    // dibuja el adorno de una celda; todo con rectángulos, sin curvas
    var x = cx*C, y = cy*C;
    stage.deco(g, x, y, C, n);
  }

  V.STAGES = {
    distrito:{
      name:"Distrito de Sangre",
      blurb:"Calles adoquinadas, farolas de gas y una luna que no se pone. La caza empieza aquí.",
      ground:["#161320","#1A1626"],
      fog:"rgba(60,10,18,.20)",
      moon:"#C2263A",
      accent:"#8E1F2F",
      foes:["aldeano","sabueso","cuervo","bruto"],
      deco:function(g,x,y,C,n){
        if(n > 0.955){ // farola de gas
          g.fillStyle = "#14121C"; g.fillRect(x+28, y+16, 5, 34);
          g.fillStyle = "#3A3444"; g.fillRect(x+24, y+48, 13, 4);
          g.fillStyle = "#F2C46A"; g.fillRect(x+26, y+8, 9, 9);
          g.fillStyle = "rgba(242,196,106,.16)"; g.fillRect(x+16, y-2, 29, 30);
        } else if(n > 0.90){ // adoquín roto
          g.fillStyle = "#211C2E";
          g.fillRect(x+8, y+12, 18, 7); g.fillRect(x+30, y+30, 22, 7);
        } else if(n < 0.035){ // verja
          g.fillStyle = "#0E0C14";
          for(var i=0;i<5;i++) g.fillRect(x+8+i*11, y+18, 4, 30);
          g.fillRect(x+8, y+18, 48, 4);
        } else if(n < 0.075){ // charco de sangre
          g.fillStyle = "rgba(122,18,30,.55)";
          g.fillRect(x+18, y+26, 24, 10); g.fillRect(x+24, y+22, 12, 18);
        }
      }
    },
    bosque:{
      name:"Bosque del Ahorcado",
      blurb:"Los árboles llevan fruta que no deberías mirar. El suelo respira.",
      ground:["#12180F","#151C12"],
      fog:"rgba(20,40,20,.22)",
      moon:"#C8D68A",
      accent:"#5A7A3A",
      foes:["ahorcado","lobo","cuervo","bruto"],
      deco:function(g,x,y,C,n){
        if(n > 0.94){ // árbol con soga
          g.fillStyle = "#1A1410"; g.fillRect(x+28, y+10, 7, 40);
          g.fillRect(x+14, y+16, 16, 5); g.fillRect(x+34, y+22, 16, 5);
          g.fillStyle = "#3A3020"; g.fillRect(x+18, y+21, 3, 14);
          g.fillStyle = "#2A2418"; g.fillRect(x+15, y+35, 9, 9);
        } else if(n > 0.885){ // matorral
          g.fillStyle = "#1B2416";
          g.fillRect(x+12, y+34, 22, 10); g.fillRect(x+18, y+28, 11, 18);
        } else if(n < 0.04){ // huesos
          g.fillStyle = "#6E6A58";
          g.fillRect(x+20, y+30, 18, 4); g.fillRect(x+26, y+24, 4, 16);
        } else if(n < 0.08){
          g.fillStyle = "rgba(90,122,58,.22)";
          g.fillRect(x+10, y+10, 30, 30);
        }
      }
    },
    catedral:{
      name:"Catedral Pálida",
      blurb:"Mármol, incienso y un coro que dejó de ser humano hace mucho.",
      ground:["#151424","#191829"],
      fog:"rgba(80,60,130,.20)",
      moon:"#DCD2F0",
      accent:"#8A6ECF",
      foes:["monja","gargola","cuervo","ahorcado"],
      deco:function(g,x,y,C,n){
        if(n > 0.95){ // columna
          g.fillStyle = "#262238"; g.fillRect(x+22, y+6, 18, 46);
          g.fillStyle = "#322C48"; g.fillRect(x+18, y+2, 26, 7);
          g.fillRect(x+18, y+48, 26, 7);
        } else if(n > 0.905){ // baldosa clara
          g.fillStyle = "#1E1C30"; g.fillRect(x+6, y+6, 52, 52);
          g.fillStyle = "#232140"; g.fillRect(x+10, y+10, 44, 44);
        } else if(n < 0.035){ // vitral en el suelo
          g.fillStyle = "rgba(138,110,207,.20)"; g.fillRect(x+14, y+10, 22, 34);
          g.fillStyle = "rgba(226,120,160,.16)"; g.fillRect(x+30, y+18, 18, 26);
        } else if(n < 0.07){ // cirio
          g.fillStyle = "#D8D2C4"; g.fillRect(x+30, y+26, 5, 16);
          g.fillStyle = "#F2C46A"; g.fillRect(x+31, y+20, 3, 5);
          g.fillStyle = "rgba(242,196,106,.13)"; g.fillRect(x+22, y+14, 20, 20);
        }
      }
    }
  };
  V.STAGE_KEYS = Object.keys(V.STAGES);

  /* ================= GUION DE OLEADAS =================
     Índices 0..3 apuntan al elenco del mapa elegido, así los tres
     comparten curva pero no enemigos. */
  V.STREAMS = [
    {a:0,    b:210,  foe:0, every:1.05, n:4},
    {a:55,   b:330,  foe:1, every:1.45, n:3},
    {a:150,  b:480,  foe:2, every:1.70, n:3},
    {a:270,  b:660,  foe:1, every:1.05, n:4},
    {a:330,  b:1200, foe:0, every:0.85, n:5},
    {a:390,  b:840,  foe:3, every:3.20, n:1},
    {a:540,  b:1200, foe:2, every:1.00, n:5},
    {a:690,  b:1200, foe:1, every:0.75, n:6},
    {a:840,  b:1200, foe:3, every:1.80, n:2},
    {a:960,  b:1200, foe:0, every:0.55, n:8},
    {a:1080, b:1200, foe:2, every:0.60, n:8}
  ];
  V.EVENTS = [
    {t:105,  kind:"ring", foe:0, n:32},
    {t:180,  kind:"elite"},
    {t:245,  kind:"wall", foe:1, n:28},
    {t:330,  kind:"ring", foe:2, n:38},
    {t:360,  kind:"elite"},
    {t:450,  kind:"wall", foe:0, n:34},
    {t:540,  kind:"elite"},
    {t:615,  kind:"ring", foe:3, n:20},
    {t:720,  kind:"elite"},
    {t:800,  kind:"wall", foe:3, n:14},
    {t:900,  kind:"elite"},
    {t:980,  kind:"ring", foe:1, n:54},
    {t:1080, kind:"elite"},
    {t:1140, kind:"ring", foe:3, n:24},
    {t:1200, kind:"reaper"}
  ];

  /* ================= SANTUARIO ================= */
  V.BLESSINGS = [
    {key:"vida",   name:"Vigor eterno", desc:"+12% de vida máxima",  max:5, cost:[120,240,420,700,1100]},
    {key:"dano",   name:"Filo eterno",  desc:"+6% de daño",          max:5, cost:[150,300,520,850,1300]},
    {key:"paso",   name:"Paso ligero",  desc:"+4% de velocidad",     max:5, cost:[100,200,360,600,950]},
    {key:"iman",   name:"Llamada",      desc:"+25% de radio de imán",max:3, cost:[110,260,520]},
    {key:"codicia",name:"Codicia",      desc:"+15% de oro",          max:5, cost:[90,190,340,560,880]},
    {key:"suerte", name:"Fortuna",      desc:"+10% de suerte",       max:3, cost:[160,340,640]},
    {key:"alma",   name:"Segunda alma", desc:"Revives una vez por partida", max:1, cost:[1500]}
  ];

  V.RUN_LENGTH = 1200;
})();
