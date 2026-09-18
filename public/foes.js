/* Marea de Verrath — bestiario, objetos y proyectiles a 16 bits */
(function(){
  "use strict";
  var V = window.V;
  var def = V.px.def;

  /* ================= ENEMIGOS ================= */

  /* Aldeano infectado — 20x24 */
  def("f_aldeano", {
    c:"#5A4436", s:"#9A7A62", e:"#C2263A", r:"#6E1A24", k:"#1A1410", h:"#3E2E22"
  },[
    "....................",
    "......hhhhhhhh......",
    ".....hhhhhhhhhh.....",
    ".....hssssssssh.....",
    ".....sssssssss......",
    ".....seesseesss.....",
    ".....sssssssss......",
    "......ssssssss......",
    ".......ssssss.......",
    "....cccccccccc......",
    "...cccccccccccc.....",
    "...ccccrrrrcccc.....",
    "...ccccrrrrcccc.....",
    "...cccccccccccc.....",
    "...cccccccccccc.....",
    "....cccccccccc......",
    "....cccc..cccc......",
    "....cccc..cccc......",
    ".....ccc..ccc.......",
    ".....kkk..kkk.......",
    ".....kkk..kkk.......",
    "....kkkk..kkkk......",
    "....................",
    "...................."
  ], {shadow:true, legs:19});

  /* Sabueso bestial — 26x18 */
  def("f_sabueso", {
    f:"#4A3226", d:"#2A1C14", e:"#E5453A", t:"#E8E2D4", k:"#160E0A"
  },[
    "..........................",
    "...dd.................dd..",
    "..dddd...............dddd.",
    "..dfffddddddddddddddffffd.",
    ".dffefffffffffffffffefffd.",
    ".ffffffffffffffffffffffff.",
    "ttffffffffffffffffffffffff",
    ".ttfffffffffffffffffffffff",
    "..ffffffffffffffffffffff..",
    "..ffffffffffffffffffff....",
    "...ffffffffffffffffff.....",
    "...ff..ff......ff..ff.....",
    "...ff..ff......ff..ff.....",
    "...dd..dd......dd..dd.....",
    "..kkk..kkk....kkk..kkk....",
    "..........................",
    "..........................",
    ".........................."
  ], {shadow:true, legs:13});

  /* Cuervo carroñero — 24x16 */
  def("f_cuervo", {
    b:"#221F30", w:"#37344A", e:"#C2263A", y:"#C0A24E", k:"#12101C"
  },[
    "........................",
    "..........bbbb..........",
    ".........bbeebb.........",
    "........ybbbbbbb........",
    "...wwwwbbbbbbbbbwwww....",
    "..wwwwwwbbbbbbbwwwwww...",
    ".wwwwwwwwbbbbbwwwwwwww..",
    "wwwwwwwwwbbbbbwwwwwwwww.",
    ".wwwwwwwwbbbbbwwwwwwww..",
    "..wwwwwwbbbbbbbwwwwww...",
    "....wwwbbbbbbbbbwww.....",
    ".......bbbbbbbbb........",
    "........bbb.bbb.........",
    "........y.....y.........",
    "........................",
    "........................"
  ], {shadow:true, flap:true});

  /* Bruto acorazado — 26x28 */
  def("f_bruto", {
    a:"#5E6172", m:"#8E93A6", r:"#7A1E2A", e:"#E5C34A", k:"#181A22", d:"#3A3D4C"
  },[
    "..........................",
    ".......aaaaaaaaaaaa.......",
    "......aaaaaaaaaaaaaa......",
    "......aaaaaaaaaaaaaa......",
    "......aaeeaaaaaaeeaa......",
    "......aaaaaaaaaaaaaa......",
    ".......aaaaaaaaaaaa.......",
    ".......aaaaaaaaaaaa.......",
    "........aaaaaaaaaa........",
    "....mmmmaaaaaaaaaammmm....",
    "...mmmmmaaaaaaaaaammmmm...",
    "..mmmmmmaaaaaaaaaammmmmm..",
    "..mmmmaaaaaaaaaaaaaammmm..",
    "..mmmaaaaaaaaaaaaaaaammm..",
    "..mmaaaaaarrrrrraaaaaamm..",
    "..maaaaaaarrrrrraaaaaaam..",
    "...aaaaaaarrrrrraaaaaaa...",
    "...aaaaaaaaaaaaaaaaaaaa...",
    "...aaaaaaaaaaaaaaaaaaaa...",
    "....aaaaaaaaaaaaaaaaaa....",
    "....dddddd....dddddd......",
    "....dddddd....dddddd......",
    "....dddddd....dddddd......",
    "....kkkkkk....kkkkkk......",
    "...kkkkkkk....kkkkkkk.....",
    "...kkkkkkk....kkkkkkk.....",
    "..........................",
    ".........................."
  ], {shadow:true, legs:23});

  /* Ahorcado del bosque — 20x28, la soga sigue puesta */
  def("f_ahorcado", {
    r:"#7A6A4E", c:"#46543E", s:"#8A9A7A", e:"#D8E8C0", k:"#1A1E18", d:"#2E3A28"
  },[
    "........rr..........",
    "........rr..........",
    "........rr..........",
    ".......rrrr.........",
    "......rrrrrr........",
    "......ssssss........",
    ".....ssssssss.......",
    ".....seesseess......",
    ".....ssssssss.......",
    "......ssssss........",
    ".......ssss.........",
    "....cccccccccc......",
    "...cccccccccccc.....",
    "..ccccccccccccccc...",
    "..cccccddddccccc....",
    "..cccccddddccccc....",
    "..ccccccccccccccc...",
    "...cccccccccccc.....",
    "...cccccccccccc.....",
    "....cccccccccc......",
    "....cccc..cccc......",
    "....cccc..cccc......",
    ".....ccc..ccc.......",
    ".....ccc..ccc.......",
    ".....kkk..kkk.......",
    "....kkkk..kkkk......",
    "....................",
    "...................."
  ], {shadow:true, legs:23});

  /* Lobo del páramo — 28x20 */
  def("f_lobo", {
    f:"#5A5A66", d:"#32323E", e:"#9AE55A", t:"#F0F0E8", k:"#16161E"
  },[
    "............................",
    "..dd....................dd..",
    ".dddd..................dddd.",
    ".dfffdddddddddddddddddffffd.",
    ".dffefffffffffffffffffefffd.",
    "dfffffffffffffffffffffffffd.",
    "tffffffffffffffffffffffffff.",
    "ttfffffffffffffffffffffffff.",
    ".tffffffffffffffffffffffff..",
    "..ffffffffffffffffffffff....",
    "..ffffffffffffffffffff......",
    "..ffffffffffffffffffff......",
    "...ff..ff.......ff..ff......",
    "...ff..ff.......ff..ff......",
    "...dd..dd.......dd..dd......",
    "..kkk..kkk.....kkk..kkk.....",
    "............................",
    "............................",
    "............................",
    "............................"
  ], {shadow:true, legs:14});

  /* Monja pálida — 20x28 */
  def("f_monja", {
    v:"#2E2A3E", w:"#C8C2B8", g:"#C0A24E", e:"#C2263A", s:"#A8917C", k:"#181422"
  },[
    "....................",
    "......vvvvvvvv......",
    ".....vvvvvvvvvv.....",
    "....vvvvvvvvvvvv....",
    "....vvvssssssvvv....",
    "....vvssssssssvv....",
    "....vvseesseesvv....",
    "....vvssssssssvv....",
    ".....vvssssssvv.....",
    ".....vvvssssvvv.....",
    "......vvvvvvvv......",
    ".....wwwwwwwwww.....",
    "....wwwwwwwwwwww....",
    "...wwwwwwwwwwwwww...",
    "...wwwwwwggwwwwww...",
    "...wwwwwwggwwwwww...",
    "...wwwwggggggwwww...",
    "...wwwwwwggwwwwww...",
    "...wwwwwwggwwwwww...",
    "...wwwwwwwwwwwwww...",
    "...wwwwwwwwwwwwww...",
    "..wwwwwwwwwwwwwwww..",
    "..wwwwwwwwwwwwwwww..",
    "..wwwwwww..wwwwwww..",
    "....kkkk....kkkk....",
    "....kkkk....kkkk....",
    "....................",
    "...................."
  ], {shadow:true, legs:24});

  /* Gárgola de la catedral — 28x24 */
  def("f_gargola", {
    s:"#5A5E6E", d:"#3A3D4A", w:"#494D5E", e:"#E5453A", k:"#1A1C24", m:"#6E7284"
  },[
    "............................",
    "..dd....................dd..",
    "..ddd..................ddd..",
    "..dddd....ssssss......dddd..",
    "..ddddd..ssssssss....ddddd..",
    "..wwwwd.ssseeeesss..dwwwww..",
    ".wwwwwwwssssssssssswwwwwww..",
    "wwwwwwwwwssssssssswwwwwwwww.",
    "wwwwwwwwwwsssssswwwwwwwwwww.",
    ".wwwwwwwwwssssssswwwwwwwww..",
    "..wwwwwwmmssssssmmwwwwwww...",
    "....wwwmmmssssssmmmwww......",
    ".......mmssssssssmm.........",
    "........ssssssssss..........",
    "........ssssssssss..........",
    ".......sssssssssss..........",
    ".......ssssssssss...........",
    "........ssss.ssss...........",
    "........ssss.ssss...........",
    "........dddd.dddd...........",
    ".......kkkk...kkkk..........",
    ".......kkkk...kkkk..........",
    "............................",
    "............................"
  ], {shadow:true, legs:19});

  /* ---- ELITE: la Gran Bestia — 44x48 ---- */
  def("f_elite", {
    f:"#7A2430", d:"#3E1018", e:"#E5C34A", t:"#F0E6D2", b:"#2A0E14",
    k:"#16060C", m:"#5A1A22", g:"#C9A283"
  },[
    "............................................",
    "....dd..............................dd......",
    "....ddd............................ddd......",
    "....dddd..........................dddd......",
    ".....dddd........ffffff..........dddd.......",
    "......dddd.....ffffffffff.......dddd........",
    ".......ddd....ffffffffffff.....dddd.........",
    "..............ffffffffffff..................",
    ".............ffffffffffffff.................",
    ".............ffeeffffffeeff.................",
    ".............ffeeffffffeeff.................",
    ".............ffffffffffffff.................",
    "..............ffffffffffff..................",
    "..............fftttttttff...................",
    "..............ffttttttttff..................",
    "...............ffffffffff...................",
    "................ffffffff....................",
    "..........mmmmmmffffffmmmmmm................",
    ".........mmmmmmmffffffmmmmmmm...............",
    "........mmmmmmffffffffffmmmmmm..............",
    ".......mmmmmffffffffffffffmmmmm.............",
    "......mmmmffffffffffffffffffmmmm............",
    ".....mmmffffffffffffffffffffffmmm...........",
    ".....mmffffffffbbbbbbbbffffffffmm...........",
    ".....mffffffffbbbbbbbbbbffffffffm...........",
    ".....ffffffffbbbbbbbbbbbbffffffff...........",
    ".....ffffffffbbbbbbbbbbbbffffffff...........",
    ".....ffffffffbbbbbbbbbbbbffffffff...........",
    ".....mffffffffbbbbbbbbbbffffffffm...........",
    ".....mmffffffffbbbbbbbbffffffffmm...........",
    "......mmffffffffffffffffffffffmm............",
    ".......mmffffffffffffffffffffm..............",
    "........mffffffffffffffffffm................",
    "..........ffffffffffffffff..................",
    "..........ffffffff.ffffffff.................",
    "..........ffffffff.ffffffff.................",
    "..........ffffffff.ffffffff.................",
    "..........dddddddd.dddddddd.................",
    ".........ddddddddd.ddddddddd................",
    ".........kkkkkkkkk.kkkkkkkkk................",
    "........kkkkkkkkkk.kkkkkkkkkk...............",
    "........kkkkkkkkkk.kkkkkkkkkk...............",
    "............................................",
    "............................................",
    "............................................",
    "............................................",
    "............................................",
    "............................................"
  ], {shadow:true, legs:37});

  /* ---- La Segadora — 40x50, guadaña incluida ---- */
  def("f_segadora", {
    c:"#2A2636", b:"#0E0C14", e:"#C2263A", m:"#9AA0B0", w:"#6E5C46",
    k:"#080610", g:"#4A4458"
  },[
    ".................................mmmmmm.",
    "................................mmmmmmmm",
    "...............................mmmm..mmm",
    "..............................mmm....mm.",
    "..............................mm.....mm.",
    ".........cccccccc.............mm....mm..",
    "........cccccccccc............mm...mm...",
    ".......cccccccccccc...........mmmmmm....",
    ".......cccbbbbbbccc............ww.......",
    "......ccbbbbbbbbbbcc...........ww.......",
    "......cbbbbbbbbbbbbc...........ww.......",
    "......cbbeebbbbeebbc...........ww.......",
    "......cbbeebbbbeebbc...........ww.......",
    "......cbbbbbbbbbbbbc...........ww.......",
    "......ccbbbbbbbbbbcc...........ww.......",
    ".......cccbbbbbbccc............ww.......",
    "........cccccccccc.............ww.......",
    "......gggcccccccccggg..........ww.......",
    ".....ggggcccccccccgggg.........ww.......",
    "....gggggcccccccccggggg........ww.......",
    "...ggggcccccccccccccgggg.......ww.......",
    "...gggcccccccccccccccggg.......ww.......",
    "...ggcccccccccccccccccgg.......ww.......",
    "...gcccccccccccccccccccg.......ww.......",
    "....ccccccccccccccccccc........ww.......",
    "....ccccccccccccccccccc........ww.......",
    "....ccccccccccccccccccc........ww.......",
    "....ccccccccccccccccccc................",
    "....ccccccccccccccccccc................",
    ".....ccccccccccccccccc.................",
    ".....ccccccccccccccccc.................",
    ".....ccccccccccccccccc.................",
    "......ccccccccccccccc..................",
    "......ccccccccccccccc..................",
    "......ccccccccccccccc..................",
    ".......ccccccccccccc...................",
    ".......ccccccccccccc...................",
    "........ccccccccccc....................",
    "........ccccccccccc....................",
    ".........ccccccccc.....................",
    ".........ccccccccc.....................",
    "..........ccccccc......................",
    "..........ccccccc......................",
    "...........ccccc.......................",
    "...........ccccc.......................",
    "............ccc........................",
    "............ccc........................",
    ".......................................",
    ".......................................",
    "......................................."
  ], {shadow:true, flap:true});

  /* ================= OBJETOS ================= */
  function still(key, pal, rows){ def(key, pal, rows, {anim:false}); }

  still("i_gema", {a:"#46E0C8", w:"#CFFFF6", d:"#1A8A78"},[
    "..........",
    "....ww....",
    "...waaw...",
    "..waaaaw..",
    ".waaaaaaw.",
    ".waaaaaad.",
    "..daaaad..",
    "...daad...",
    "....dd....",
    ".........."
  ]);
  still("i_gema2", {a:"#7CC6FF", w:"#DCEFFF", d:"#2A6ABE"},[
    "..........",
    "....ww....",
    "...waaw...",
    "..waaaaw..",
    ".waaaaaaw.",
    ".waaaaaad.",
    "..daaaad..",
    "...daad...",
    "....dd....",
    ".........."
  ]);
  still("i_gema3", {a:"#FFD36B", w:"#FFF6D8", d:"#A87218"},[
    "..........",
    "....ww....",
    "...waaw...",
    "..waaaaw..",
    ".waaaaaaw.",
    ".waaaaaad.",
    "..daaaad..",
    "...daad...",
    "....dd....",
    ".........."
  ]);
  still("i_oro", {g:"#E5B95C", w:"#FFF0C0", d:"#8A6218"},[
    "..........",
    "...gggg...",
    "..gwggggd.",
    ".gwgggggd.",
    ".gggggggd.",
    ".gggggggd.",
    "..dggggd..",
    "...dddd...",
    "..........",
    ".........."
  ]);
  still("i_carne", {m:"#B03040", d:"#6E1A24", b:"#E8E2D4"},[
    "..............",
    "....mmmmmm....",
    "...mmmmmmmm...",
    "..mmmmmmmmmd..",
    "..mmmmmmmmdd..",
    "..bbmmmmmddd..",
    "..bb...ddd....",
    "..............",
    "..............",
    ".............."
  ]);
  still("i_cofre", {w:"#7A5422", g:"#E5B95C", d:"#3A2810", l:"#FFF0C0", k:"#1E1408"},[
    "..................",
    "....gggggggggg....",
    "...glllllllllg....",
    "..gwwwwwwwwwwwg...",
    "..wwwwwggwwwwww...",
    "..wwwwwggwwwwww...",
    "..wwwwwllwwwwww...",
    "..wwwwwwwwwwwww...",
    "..kkkkkkkkkkkkk...",
    "..................",
    "..................",
    ".................."
  ]);

  /* ================= PROYECTILES ================= */
  function bul(key, pal, rows){ def(key, pal, rows, {anim:false}); }

  bul("b_daga", {m:"#C9CEDC", w:"#FFFFFF", d:"#5A5E70", h:"#6E4A2A"},[
    "............",
    "............",
    "...hhmmmmww.",
    "..hhhmmmmmww",
    "...hhmmmmww.",
    "............",
    "............",
    "............"
  ]);
  bul("b_runa", {a:"#8FA8FF", w:"#E8EEFF", d:"#3A4A8E"},[
    "..........",
    "....ww....",
    "..wwaaww..",
    ".waaaaaaw.",
    ".waaaaaaw.",
    "..waaaaw..",
    "...wddw...",
    "....dd...."
  ]);
  bul("b_hacha", {m:"#AAB0C0", w:"#E8ECF8", h:"#6E4A2A", d:"#5A5E70"},[
    "..mmmmmm..",
    ".mmwwwwmm.",
    "mmwwwwwwmm",
    ".mmwwwwmm.",
    "..mmhhmm..",
    "....hh....",
    "....hh....",
    "....hh....",
    "....hh....",
    ".....h...."
  ]);
  bul("b_cruz", {g:"#E5C34A", w:"#FFF6D8", d:"#8A6218"},[
    "....ww....",
    "....gg....",
    "....gg....",
    ".wwggggww.",
    ".gggggggg.",
    ".ddggggdd.",
    "....gg....",
    "....gg....",
    "....gd....",
    "....dd...."
  ]);
  bul("b_fuego", {a:"#FF7A2A", b:"#FFD36B", d:"#B8301A", w:"#FFF2C0"},[
    "....bb....",
    "...bwwb...",
    "..bwaawb..",
    ".baaaaaab.",
    "baaaaaaaad",
    "baaaaaaaad",
    ".daaaaaad.",
    "..ddaadd..",
    "...dddd...",
    "....dd...."
  ]);
  bul("b_biblia", {c:"#C08BEF", w:"#F4E8FF", d:"#5A2E8E", g:"#E5C34A"},[
    "............",
    ".cccccccccc.",
    ".cwwwwwwwwc.",
    ".cwddggddwc.",
    ".cwddggddwc.",
    ".cwwwwwwwwc.",
    ".cccccccccc.",
    "............"
  ]);
  bul("b_runatrace", {a:"#46E0C8", w:"#CFFFF6", d:"#14786A"},[
    "..........",
    "...wwww...",
    "..waaaaw..",
    ".waaaaaaw.",
    ".waaaaaad.",
    "..daaaad..",
    "...dddd...",
    ".........."
  ]);
  bul("b_bala", {m:"#FFE066", d:"#B08018", w:"#FFFBE0"},[
    "........",
    "...ww...",
    "..wmmd..",
    "..mmmd..",
    "..mmmd..",
    "...dd...",
    "........",
    "........"
  ]);
  bul("b_gato", {f:"#D8B070", d:"#8A6238", e:"#5FBF6A", w:"#FFF6E0", k:"#3A2A18"},[
    "............",
    "..f......f..",
    "..ff....ff..",
    "..ffffffff..",
    ".fffffffffff",
    ".feffffffef.",
    ".ffffwwffff.",
    ".ffffwwffff.",
    "..ffffffff..",
    "..f..ff..f..",
    "............",
    "............"
  ]);
  bul("b_pajaro", {w:"#EEF2FF", g:"#A8B4D0", d:"#5A6280", y:"#E5C34A"},[
    "............",
    "...ww.......",
    "..wwwwg.....",
    ".wwwwwwgg...",
    "wwwwwwwwggd.",
    ".wwwwwwwgg..",
    "..wwwwwg....",
    "...wwy......",
    "............",
    "............"
  ]);
  bul("b_pajaro_neg", {w:"#4A4A60", g:"#2A2A3A", d:"#101018", y:"#8E1F2F"},[
    "............",
    "...ww.......",
    "..wwwwg.....",
    ".wwwwwwgg...",
    "wwwwwwwwggd.",
    ".wwwwwwwgg..",
    "..wwwwwg....",
    "...wwy......",
    "............",
    "............"
  ]);
})();
