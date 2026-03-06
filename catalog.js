/* ============================================================
   BuseDex Kielce — catalog.js
   Dodaj / edytuj autobusy tylko tutaj.

   Pola:
     id      — unikalny identyfikator (nie zmieniaj po zapisaniu!)
     num     — numer boczny (pusty "" dla Ikarusa)
     brand   — marka (MAZ | Temsa | Solaris | MAN | Mercedes | Autosan | Ikarus)
     sub     — podgrupa (tylko Solaris)
     model   — pełna nazwa modelu
     type    — spalinowy | hybrydowy | elektryczny
     rare    — true → fioletowy styl rzadkiego egzemplarza
     unique  — true → odznaka "1 OF 1"
   ============================================================ */

var CATALOG = [

  /* ── MAZ ───────────────────────────────────────────────── */
  { id:"m1",  num:"006", brand:"MAZ", model:"MAZ-206085", type:"spalinowy" },
  { id:"m2",  num:"950", brand:"MAZ", model:"MAZ-206085", type:"spalinowy" },
  { id:"m3",  num:"951", brand:"MAZ", model:"MAZ-206085", type:"spalinowy" },
  { id:"m4",  num:"007", brand:"MAZ", model:"MAZ-203069", type:"spalinowy" },
  { id:"m5",  num:"009", brand:"MAZ", model:"MAZ-203069", type:"spalinowy" },
  { id:"m6",  num:"010", brand:"MAZ", model:"MAZ-203069", type:"spalinowy" },
  { id:"m7",  num:"011", brand:"MAZ", model:"MAZ-203069", type:"spalinowy" },
  { id:"m8",  num:"013", brand:"MAZ", model:"MAZ-203069", type:"spalinowy" },
  { id:"m9",  num:"014", brand:"MAZ", model:"MAZ-203069", type:"spalinowy" },
  { id:"m10", num:"015", brand:"MAZ", model:"MAZ-203069", type:"spalinowy" },
  { id:"m11", num:"016", brand:"MAZ", model:"MAZ-203069", type:"spalinowy" },
  { id:"m12", num:"919", brand:"MAZ", model:"MAZ-203069", type:"spalinowy" },

  /* ── TEMSA ──────────────────────────────────────────────── */
  { id:"t1",  num:"030", brand:"Temsa", model:"LF 12", type:"spalinowy" },
  { id:"t2",  num:"031", brand:"Temsa", model:"LF 12", type:"spalinowy" },
  { id:"t3",  num:"032", brand:"Temsa", model:"LF 12", type:"spalinowy" },
  { id:"t4",  num:"600", brand:"Temsa", model:"LF 12", type:"spalinowy" },
  { id:"t5",  num:"601", brand:"Temsa", model:"LF 12", type:"spalinowy" },
  { id:"t6",  num:"602", brand:"Temsa", model:"LF 12", type:"spalinowy" },
  { id:"t7",  num:"603", brand:"Temsa", model:"LF 12", type:"spalinowy" },
  { id:"t8",  num:"604", brand:"Temsa", model:"LF 12", type:"spalinowy" },
  { id:"t9",  num:"605", brand:"Temsa", model:"LF 12", type:"spalinowy" },
  { id:"t10", num:"606", brand:"Temsa", model:"LF 12", type:"spalinowy" },
  { id:"t11", num:"607", brand:"Temsa", model:"LF 12", type:"spalinowy" },

  /* ── SOLARIS U12 I ──────────────────────────────────────── */
  { id:"s1", num:"328", brand:"Solaris", sub:"U12 I", model:"Urbino 12 I", type:"spalinowy", rare:true, unique:true },

  /* ── SOLARIS U12 III ────────────────────────────────────── */
  { id:"s2",  num:"363", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s3",  num:"365", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s4",  num:"366", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s5",  num:"368", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s6",  num:"369", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s7",  num:"372", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s8",  num:"374", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s9",  num:"375", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s10", num:"376", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s11", num:"377", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s12", num:"378", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s13", num:"379", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s14", num:"380", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s15", num:"381", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s16", num:"382", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s17", num:"383", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s18", num:"384", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s19", num:"385", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s20", num:"386", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s21", num:"387", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s22", num:"388", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s23", num:"389", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s24", num:"390", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s25", num:"391", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s26", num:"392", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s27", num:"393", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s28", num:"394", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s29", num:"395", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s30", num:"396", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s31", num:"397", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s32", num:"398", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s33", num:"450", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s34", num:"451", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },
  { id:"s35", num:"454", brand:"Solaris", sub:"U12 III", model:"Urbino 12 III", type:"spalinowy" },

  /* ── SOLARIS U12 IV (hybryda) ───────────────────────────── */
  { id:"s36", num:"5001", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s37", num:"5002", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s38", num:"5003", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s39", num:"5004", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s40", num:"5005", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s41", num:"5006", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s42", num:"5007", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s43", num:"5008", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s44", num:"5009", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s45", num:"5010", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s46", num:"5011", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s47", num:"5012", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s48", num:"5013", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s49", num:"5014", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },
  { id:"s50", num:"5015", brand:"Solaris", sub:"U12 IV", model:"Urbino 12 IV", type:"hybrydowy" },

  /* ── SOLARIS U15 III ────────────────────────────────────── */
  { id:"s51", num:"244", brand:"Solaris", sub:"U15 III", model:"Urbino 15 III", type:"spalinowy", rare:true, unique:true },

  /* ── SOLARIS U18 III ────────────────────────────────────── */
  { id:"s52", num:"238", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s53", num:"239", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s54", num:"240", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s55", num:"241", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s56", num:"242", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s57", num:"243", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s58", num:"245", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s59", num:"246", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s60", num:"247", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s61", num:"248", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s62", num:"249", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s63", num:"250", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s64", num:"251", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s65", num:"252", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s66", num:"253", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s67", num:"256", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s68", num:"257", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s69", num:"258", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s70", num:"259", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s71", num:"261", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s72", num:"262", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },
  { id:"s73", num:"267", brand:"Solaris", sub:"U18 III", model:"Urbino 18 III", type:"spalinowy" },

  /* ── SOLARIS U18 III Hybrid ─────────────────────────────── */
  { id:"s74", num:"6001", brand:"Solaris", sub:"U18 III Hybrid", model:"Urbino 18 III Hybrid", type:"hybrydowy" },
  { id:"s75", num:"6002", brand:"Solaris", sub:"U18 III Hybrid", model:"Urbino 18 III Hybrid", type:"hybrydowy" },
  { id:"s76", num:"6003", brand:"Solaris", sub:"U18 III Hybrid", model:"Urbino 18 III Hybrid", type:"hybrydowy" },
  { id:"s77", num:"6004", brand:"Solaris", sub:"U18 III Hybrid", model:"Urbino 18 III Hybrid", type:"hybrydowy" },
  { id:"s78", num:"6005", brand:"Solaris", sub:"U18 III Hybrid", model:"Urbino 18 III Hybrid", type:"hybrydowy" },
  { id:"s79", num:"6006", brand:"Solaris", sub:"U18 III Hybrid", model:"Urbino 18 III Hybrid", type:"hybrydowy" },
  { id:"s80", num:"6007", brand:"Solaris", sub:"U18 III Hybrid", model:"Urbino 18 III Hybrid", type:"hybrydowy" },
  { id:"s81", num:"6008", brand:"Solaris", sub:"U18 III Hybrid", model:"Urbino 18 III Hybrid", type:"hybrydowy" },
  { id:"s82", num:"6009", brand:"Solaris", sub:"U18 III Hybrid", model:"Urbino 18 III Hybrid", type:"hybrydowy" },
  { id:"s83", num:"6010", brand:"Solaris", sub:"U18 III Hybrid", model:"Urbino 18 III Hybrid", type:"hybrydowy" },

  /* ── SOLARIS U18 IV ─────────────────────────────────────── */
  { id:"s84", num:"269", brand:"Solaris", sub:"U18 IV", model:"Urbino 18 IV", type:"spalinowy" },
  { id:"s85", num:"270", brand:"Solaris", sub:"U18 IV", model:"Urbino 18 IV", type:"spalinowy" },

  /* ── MAN ────────────────────────────────────────────────── */
  { id:"n1",  num:"271", brand:"MAN", model:"NG330 City 18", type:"spalinowy" },
  { id:"n2",  num:"272", brand:"MAN", model:"NG330 City 18", type:"spalinowy" },
  { id:"n3",  num:"273", brand:"MAN", model:"NG330 City 18", type:"spalinowy" },
  { id:"n4",  num:"274", brand:"MAN", model:"NG330 City 18", type:"spalinowy" },
  { id:"n5",  num:"275", brand:"MAN", model:"NG330 City 18", type:"spalinowy" },
  { id:"n6",  num:"276", brand:"MAN", model:"NG330 City 18", type:"spalinowy" },
  { id:"n7",  num:"277", brand:"MAN", model:"NG330 City 18", type:"spalinowy" },
  { id:"n8",  num:"278", brand:"MAN", model:"NG330 City 18", type:"spalinowy" },
  { id:"n9",  num:"279", brand:"MAN", model:"NG330 City 18", type:"spalinowy" },
  { id:"n10", num:"280", brand:"MAN", model:"NG330 City 18", type:"spalinowy" },
  { id:"n11", num:"281", brand:"MAN", model:"NG330 City 18", type:"spalinowy" },
  { id:"n12", num:"282", brand:"MAN", model:"NG330 City 18", type:"spalinowy" },
  { id:"n13", num:"415", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n14", num:"416", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n15", num:"417", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n16", num:"418", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n17", num:"419", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n18", num:"420", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n19", num:"421", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n20", num:"422", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n21", num:"423", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n22", num:"424", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n23", num:"425", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n24", num:"426", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n25", num:"427", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n26", num:"428", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },
  { id:"n27", num:"429", brand:"MAN", model:"NL280 City 12", type:"spalinowy" },

  /* ── MERCEDES ───────────────────────────────────────────── */
  { id:"e1", num:"400", brand:"Mercedes", model:"Conecto LF",  type:"spalinowy" },
  { id:"e2", num:"401", brand:"Mercedes", model:"Conecto LF",  type:"spalinowy" },
  { id:"e3", num:"402", brand:"Mercedes", model:"Conecto LF",  type:"spalinowy" },
  { id:"e4", num:"404", brand:"Mercedes", model:"O530K A26",   type:"spalinowy" },
  { id:"e5", num:"405", brand:"Mercedes", model:"Conecto",     type:"spalinowy" },
  { id:"e6", num:"406", brand:"Mercedes", model:"Conecto",     type:"spalinowy" },

  /* ── AUTOSAN ────────────────────────────────────────────── */
  { id:"a1", num:"610", brand:"Autosan", model:"M12LF", type:"spalinowy" },
  { id:"a2", num:"611", brand:"Autosan", model:"M12LF", type:"spalinowy" },
  { id:"a3", num:"612", brand:"Autosan", model:"M12LF", type:"spalinowy" },
  { id:"a4", num:"613", brand:"Autosan", model:"M12LF", type:"spalinowy" },
  { id:"a5", num:"614", brand:"Autosan", model:"M12LF", type:"spalinowy" },

  /* ── IKARUS ─────────────────────────────────────────────── */
  { id:"i1", num:"", brand:"Ikarus", model:"260.04", type:"spalinowy", unique:true }

];

/* ── Metadane typów napędu ──────────────────────────────────── */
var TM = {
  spalinowy:   { label:"Spalinowy",   icon:"&#x26FD;", color:"#e87a0a" },
  hybrydowy:   { label:"Hybrydowy",   icon:"&#x1F50B;",color:"#4caf50" },
  elektryczny: { label:"Elektryczny", icon:"&#x26A1;", color:"#2196f3" }
};

/* ── Metadane marek ─────────────────────────────────────────── */
var BM = {
  MAZ:      { icon:"&#x1F1E7;&#x1F1FE;", color:"#039be5" },
  Temsa:    { icon:"&#x1F1F9;&#x1F1F7;", color:"#8e24aa" },
  Solaris:  { icon:"&#x1F1F5;&#x1F1F1;", color:"#fb8c00" },
  MAN:      { icon:"&#x1F1E9;&#x1F1EA;", color:"#e53935" },
  Mercedes: { icon:"&#x2B50;",           color:"#78909c" },
  Autosan:  { icon:"&#x1F1F5;&#x1F1F1;", color:"#c0392b" },
  Ikarus:   { icon:"&#x1F3DB;&#xFE0F;",  color:"#c9a84c", retro:true }
};

var BRANDS = ["Wszystkie","MAZ","Temsa","Solaris","MAN","Mercedes","Autosan","Ikarus"];
var TYPES  = ["Wszystkie","spalinowy","hybrydowy","elektryczny"];
