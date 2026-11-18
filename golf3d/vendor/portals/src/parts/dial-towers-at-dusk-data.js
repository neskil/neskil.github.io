// The dusk city of clock towers: the place as data. Written by scratchpad/dial-towers-at-dusk/gen-data.mjs from the designer's own
// data files (towers, place, lens, look), figure for figure; nothing here is typed by hand and nothing is dealt by a seed.
// x runs east, z runs south, y up, in metres; bearings by compass (0 north, 90 east); the water lies at y 0; the west glow at -x.

export const WATER_Y = 0, GROUND_Y = 6, ROOF_MAX = 34, FLIGHT_SECONDS = 43, LOOK_AHEAD = 6;
export const RING = {"x":0,"y":70,"z":0,"radius":7};
export const MOUTH_POINT = [45,0];
export const CLEFT = {"M":[133.6,-111.8],"X":[52.4,-149.7],"bearing":295,"half":14.5,"length":89.6};
export const RIVER = {"p":[-8.87,-141.55],"bearing":205,"width":170,"inland":[0.9063077870366499,0.42261826174069944]};
export const SOUND = {"speed":4.6,"life":22,"easeIn":0.5,"easeOut":5,"fadeTop":2.2,"fadeK":25,"swing":28,"rise":1.5,"fall":2,"rest":2.4,"top":3.4,"lineM":0.7,"lineMin":1.2,"lineMax":5};
export const DIAL = {"stroke":[0.1,0.14,0.18,0.22],"width":[0.015,0.025,0.035],"third":["all twelve strokes alike","every third stroke half as long again"],"rim":["one rim line","two rim lines","a rim line and an inner circle"],"hand":["a plain bar","a tapered blade","a bar with a short tail"]};
// every tower: its place, height, cap, shaft width, turn of its plan, face across, the bearing its face looks along, the face
// centre's height, belfry floor, ring level (the belfry's cornice), belfry frame; law: true for the fourteen laid by a law;
// rank, interval and start of its bell (seconds of the place's clock); dial: the five choices of its own dial.
export const TOWERS = [
  {"name":"O1","x":177.3,"z":146.9,"h":88,"shape":"stepped","w":8,"rot":45,"face":7,"facing":315,"faceY":60,"belfry":68,"ring":77,"frame":"iron","law":false,"interval":5.52,"start":4.443,"rank":1,"bell":4.48,"r0":4.6,"dial":[0,0,0,2,0]},
  {"name":"O2","x":177.3,"z":130.9,"h":100,"shape":"spired","w":8,"rot":45,"face":7,"facing":315,"faceY":60,"belfry":68,"ring":78,"frame":"stone","law":false,"interval":5.581,"start":4.611,"rank":4,"bell":4.48,"r0":4.6,"dial":[3,0,1,0,2]},
  {"name":"E1","x":205,"z":110,"h":96,"shape":"spired","w":10,"rot":0,"face":9,"facing":0,"faceY":64,"belfry":74,"ring":82,"frame":"stone","law":false,"interval":6.41,"start":2.575,"rank":45,"bell":5.6,"r0":5.6,"dial":[0,2,1,0,2]},
  {"name":"E2","x":206,"z":70,"h":74,"shape":"stepped","w":11,"rot":45,"face":10,"facing":315,"faceY":46,"belfry":54,"ring":61,"frame":"iron","law":false,"interval":6.329,"start":1.048,"rank":41,"bell":6.16,"r0":6.1,"dial":[0,1,1,0,0]},
  {"name":"E3","x":190,"z":22,"h":104,"shape":"spired","w":10,"rot":30,"face":9,"facing":30,"faceY":72,"belfry":82,"ring":90,"frame":"stone","law":false,"interval":6.289,"start":4.629,"rank":39,"bell":5.6,"r0":5.6,"dial":[2,0,1,0,2]},
  {"name":"W1","x":141,"z":109,"h":108,"shape":"open-work","w":12,"rot":30,"face":11,"facing":300,"faceY":74,"belfry":88,"ring":96,"frame":"stone","law":false,"interval":6.612,"start":4.498,"rank":55,"bell":6.72,"r0":6.6,"dial":[2,1,0,1,1]},
  {"name":"W2","x":128,"z":60,"h":116,"shape":"spired","w":12,"rot":45,"face":11,"facing":315,"faceY":80,"belfry":94,"ring":102,"frame":"iron","law":false,"interval":6.916,"start":0.227,"rank":70,"bell":6.72,"r0":6.6,"dial":[1,2,0,0,0]},
  {"name":"W3","x":116,"z":99,"h":108,"shape":"stepped","w":11,"rot":20,"face":10,"facing":200,"faceY":72,"belfry":86,"ring":94,"frame":"stone","law":false,"interval":6.107,"start":4.105,"rank":30,"bell":6.16,"r0":6.1,"dial":[1,1,1,1,0]},
  {"name":"W8","x":126,"z":124,"h":112,"shape":"spired","w":13,"rot":0,"face":11,"facing":270,"faceY":76,"belfry":90,"ring":98,"frame":"iron","law":false,"interval":6.997,"start":1.882,"rank":74,"bell":7.28,"r0":7.1,"dial":[1,0,1,0,2]},
  {"name":"W9","x":137,"z":78,"h":104,"shape":"spired","w":12,"rot":0,"face":10,"facing":270,"faceY":72,"belfry":84,"ring":92,"frame":"stone","law":false,"interval":6.976,"start":0.378,"rank":73,"bell":6.72,"r0":6.6,"dial":[0,0,0,2,1]},
  {"name":"W4","x":121,"z":41,"h":110,"shape":"spired","w":12,"rot":45,"face":10,"facing":315,"faceY":76,"belfry":90,"ring":98,"frame":"stone","law":false,"interval":6.673,"start":2.167,"rank":58,"bell":6.72,"r0":6.6,"dial":[1,2,1,2,2]},
  {"name":"W5","x":96,"z":62,"h":98,"shape":"domed","w":12,"rot":30,"face":10,"facing":300,"faceY":72,"belfry":84,"ring":92,"frame":"iron","law":false,"interval":6.936,"start":4.332,"rank":71,"bell":6.72,"r0":6.6,"dial":[2,2,1,1,0]},
  {"name":"W6","x":138,"z":-30,"h":102,"shape":"open-work","w":10,"rot":45,"face":9,"facing":135,"faceY":72,"belfry":82,"ring":90,"frame":"stone","law":false,"interval":5.722,"start":4.043,"rank":11,"bell":5.6,"r0":5.6,"dial":[2,2,0,2,2]},
  {"name":"W7","x":128,"z":-64,"h":106,"shape":"spired","w":11,"rot":0,"face":10,"facing":270,"faceY":74,"belfry":86,"ring":94,"frame":"iron","law":false,"interval":6.39,"start":1.194,"rank":44,"bell":6.16,"r0":6.1,"dial":[3,1,0,2,1]},
  {"name":"F1","x":159.5,"z":4,"h":105,"shape":"stepped","w":14,"rot":25,"face":12,"facing":205,"faceY":80,"belfry":89,"ring":97,"frame":"stone","law":false,"interval":7.219,"start":5.504,"rank":85,"bell":7.84,"r0":7.6,"dial":[0,0,1,2,1]},
  {"name":"H1","x":202,"z":-46,"h":96,"shape":"spired","w":14,"rot":45,"face":13,"facing":45,"faceY":47.5,"belfry":57.5,"ring":65.5,"frame":"stone","law":false,"interval":7.138,"start":3.757,"rank":81,"bell":7.84,"r0":7.6,"dial":[0,2,0,2,2]},
  {"name":"Z1","x":224,"z":92,"h":120,"shape":"spired","w":14,"rot":0,"face":13,"facing":0,"faceY":86,"belfry":96,"ring":104,"frame":"iron","law":false,"interval":7.179,"start":2.389,"rank":83,"bell":7.84,"r0":7.6,"dial":[2,2,0,2,0]},
  {"name":"Z2","x":232,"z":118,"h":104,"shape":"stepped","w":12,"rot":45,"face":11,"facing":315,"faceY":74,"belfry":84,"ring":92,"frame":"stone","law":false,"interval":6.531,"start":2.902,"rank":51,"bell":6.72,"r0":6.6,"dial":[2,0,0,1,2]},
  {"name":"Z3","x":248,"z":60,"h":99,"shape":"open-work","w":11,"rot":70,"face":10,"facing":250,"faceY":66,"belfry":76,"ring":84,"frame":"iron","law":false,"interval":6.471,"start":2.737,"rank":48,"bell":6.16,"r0":6.1,"dial":[3,2,0,2,0]},
  {"name":"Z4","x":222,"z":30,"h":110,"shape":"stepped","w":12,"rot":45,"face":11,"facing":225,"faceY":80,"belfry":90,"ring":98,"frame":"iron","law":false,"interval":7.037,"start":0.531,"rank":76,"bell":6.72,"r0":6.6,"dial":[3,0,1,0,0]},
  {"name":"Z5","x":262,"z":96,"h":81,"shape":"spired","w":10,"rot":0,"face":9,"facing":0,"faceY":49,"belfry":57,"ring":64.5,"frame":"stone","law":false,"interval":5.985,"start":0.039,"rank":24,"bell":5.6,"r0":5.6,"dial":[3,2,0,1,0]},
  {"name":"B5a","x":179.8,"z":-72,"h":108,"shape":"open-work","w":10,"rot":45,"face":8,"facing":315,"faceY":73,"belfry":80,"ring":89,"frame":"stone","law":false,"interval":6.269,"start":0.905,"rank":38,"bell":5.6,"r0":5.6,"dial":[1,0,0,2,1]},
  {"name":"B5b","x":176,"z":-95.5,"h":100,"shape":"stepped","w":10,"rot":50,"face":7.5,"facing":320,"faceY":71,"belfry":77,"ring":88,"frame":"iron","law":false,"interval":5.844,"start":4.378,"rank":17,"bell":5.6,"r0":5.6,"dial":[0,1,1,2,2]},
  {"name":"Q1","x":190,"z":-122,"h":52,"shape":"stepped","w":9,"rot":0,"face":8,"facing":180,"faceY":33,"belfry":39,"ring":45,"frame":"stone","law":false,"interval":5.783,"start":4.21,"rank":14,"bell":5.04,"r0":5.1,"dial":[1,0,0,1,1]},
  {"name":"Q2","x":214,"z":-112,"h":44,"shape":"spired","w":8,"rot":45,"face":7,"facing":225,"faceY":25,"belfry":30,"ring":36,"frame":"iron","law":false,"interval":5.743,"start":1.714,"rank":12,"bell":4.48,"r0":4.6,"dial":[3,2,1,0,0]},
  {"name":"Q3","x":204,"z":-146,"h":58,"shape":"open-work","w":9,"rot":0,"face":8,"facing":180,"faceY":37,"belfry":43,"ring":50,"frame":"stone","law":false,"interval":5.662,"start":0.353,"rank":8,"bell":5.04,"r0":5.1,"dial":[3,1,1,0,1]},
  {"name":"Q4","x":232,"z":-140,"h":48,"shape":"stepped","w":9,"rot":30,"face":8,"facing":210,"faceY":29,"belfry":35,"ring":41,"frame":"stone","law":false,"interval":6.006,"start":1.329,"rank":25,"bell":5.04,"r0":5.1,"dial":[0,0,0,0,1]},
  {"name":"Q5","x":176,"z":-156,"h":55,"shape":"spired","w":8,"rot":0,"face":7,"facing":180,"faceY":33,"belfry":39,"ring":45.5,"frame":"iron","law":false,"interval":5.54,"start":0.109,"rank":2,"bell":4.48,"r0":4.6,"dial":[1,0,1,0,1]},
  {"name":"NN1","x":120,"z":-200,"h":100,"shape":"stepped","w":11,"rot":0,"face":10,"facing":180,"faceY":45.5,"belfry":55.5,"ring":63.5,"frame":"stone","law":false,"interval":6.592,"start":0.584,"rank":54,"bell":6.16,"r0":6.1,"dial":[1,1,1,2,0]},
  {"name":"NN2","x":72,"z":-214,"h":110,"shape":"spired","w":12,"rot":30,"face":11,"facing":210,"faceY":78,"belfry":90,"ring":98,"frame":"iron","law":false,"interval":6.451,"start":1.343,"rank":47,"bell":6.72,"r0":6.6,"dial":[2,2,1,0,0]},
  {"name":"NN3","x":150,"z":-190,"h":100,"shape":"open-work","w":12,"rot":45,"face":11,"facing":225,"faceY":70,"belfry":80,"ring":88,"frame":"stone","law":false,"interval":6.815,"start":3.967,"rank":65,"bell":6.72,"r0":6.6,"dial":[0,1,1,1,0]},
  {"name":"K","x":33.6,"z":-169.5,"h":108,"shape":"spired","w":13,"rot":10,"face":11,"facing":190,"faceY":78,"belfry":88,"ring":96,"frame":"stone","law":false,"interval":7.158,"start":0.845,"rank":82,"bell":7.28,"r0":7.1,"dial":[1,2,1,0,0]},
  {"name":"SS1","x":70,"z":-80,"h":108,"shape":"stepped","w":11,"rot":45,"face":10,"facing":45,"faceY":76,"belfry":88,"ring":96,"frame":"iron","law":false,"interval":6.248,"start":5.808,"rank":37,"bell":6.16,"r0":6.1,"dial":[0,0,1,0,1]},
  {"name":"G1","x":12.5,"z":-159,"h":56,"shape":"stepped","w":9,"rot":65,"face":8,"facing":245,"faceY":34,"belfry":41,"ring":48,"frame":"stone","law":false,"interval":5.884,"start":1.052,"rank":19,"bell":5.04,"r0":5.1,"dial":[2,1,1,2,0]},
  {"name":"G2","x":6.2,"z":-145.5,"h":48,"shape":"spired","w":8,"rot":65,"face":7,"facing":245,"faceY":24,"belfry":30,"ring":37,"frame":"iron","law":false,"interval":5.5,"start":3.246,"rank":0,"bell":4.48,"r0":4.6,"dial":[3,2,0,0,0]},
  {"name":"G3","x":-7.3,"z":-116.5,"h":60,"shape":"open-work","w":9,"rot":65,"face":8,"facing":245,"faceY":37,"belfry":44,"ring":51,"frame":"stone","law":false,"interval":5.702,"start":2.805,"rank":10,"bell":5.04,"r0":5.1,"dial":[1,2,1,0,2]},
  {"name":"G4","x":-21.2,"z":-86.6,"h":52,"shape":"spired","w":9,"rot":65,"face":8,"facing":245,"faceY":31,"belfry":37,"ring":44,"frame":"stone","law":false,"interval":6.087,"start":2.784,"rank":29,"bell":5.04,"r0":5.1,"dial":[0,1,0,0,0]},
  {"name":"G5","x":31.6,"z":-199.9,"h":59.5,"shape":"domed","w":9,"rot":65,"face":8,"facing":245,"faceY":40,"belfry":47,"ring":54.5,"frame":"iron","law":false,"interval":5.621,"start":1.438,"rank":6,"bell":5.04,"r0":5.1,"dial":[1,1,1,0,0]},
  {"name":"R1","x":2,"z":-95.4,"h":112,"shape":"spired","w":13,"rot":0,"face":11,"facing":180,"faceY":78,"belfry":90,"ring":98,"frame":"stone","law":false,"interval":7.118,"start":2.217,"rank":80,"bell":7.28,"r0":7.1,"dial":[3,1,1,0,2]},
  {"name":"R2","x":8,"z":-78,"h":104,"shape":"stepped","w":12,"rot":45,"face":11,"facing":225,"faceY":72,"belfry":84,"ring":92,"frame":"iron","law":false,"interval":6.572,"start":5.743,"rank":53,"bell":6.72,"r0":6.6,"dial":[0,1,0,1,0]},
  {"name":"R3","x":21.3,"z":-66,"h":116,"shape":"open-work","w":12,"rot":45,"face":11,"facing":225,"faceY":82,"belfry":94,"ring":102,"frame":"stone","law":false,"interval":6.896,"start":5.642,"rank":69,"bell":6.72,"r0":6.6,"dial":[0,2,1,1,2]},
  {"name":"R4","x":-63.5,"z":3,"h":83,"shape":"spired","w":11,"rot":0,"face":10,"facing":270,"faceY":57,"belfry":67,"ring":75,"frame":"stone","law":false,"interval":6.875,"start":4.148,"rank":68,"bell":6.16,"r0":6.1,"dial":[3,1,0,0,2]},
  {"name":"R5","x":88,"z":-78,"h":106,"shape":"open-work","w":11,"rot":45,"face":10,"facing":225,"faceY":76,"belfry":86,"ring":94,"frame":"iron","law":false,"interval":6.349,"start":2.415,"rank":42,"bell":6.16,"r0":6.1,"dial":[1,1,0,2,0]},
  {"name":"T10","x":86.8,"z":-53.2,"h":96,"shape":"spired","w":12.4,"rot":48,"face":11,"facing":48,"faceY":60,"belfry":68,"ring":78,"frame":"stone","law":false,"interval":7.057,"start":2.048,"rank":77,"bell":6.944,"r0":6.8,"dial":[0,1,0,2,0]},
  {"name":"Y1","x":90,"z":22,"h":96,"shape":"stepped","w":10,"rot":60,"face":9,"facing":240,"faceY":66,"belfry":77,"ring":85,"frame":"stone","law":false,"interval":5.864,"start":5.653,"rank":18,"bell":5.6,"r0":5.6,"dial":[1,1,0,1,0]},
  {"name":"Y3","x":104,"z":46,"h":88,"shape":"open-work","w":10,"rot":0,"face":9,"facing":90,"faceY":60,"belfry":68,"ring":76,"frame":"iron","law":false,"interval":6.188,"start":5.62,"rank":34,"bell":5.6,"r0":5.6,"dial":[1,2,1,1,2]},
  {"name":"Y4","x":20,"z":92,"h":106,"shape":"spired","w":12,"rot":45,"face":11,"facing":135,"faceY":76,"belfry":86,"ring":94,"frame":"stone","law":false,"interval":6.43,"start":3.964,"rank":46,"bell":6.72,"r0":6.6,"dial":[1,2,0,2,2]},
  {"name":"Y5","x":92,"z":82,"h":94,"shape":"stepped","w":10,"rot":0,"face":9,"facing":0,"faceY":64,"belfry":74,"ring":82,"frame":"stone","law":false,"interval":6.066,"start":1.472,"rank":28,"bell":5.6,"r0":5.6,"dial":[3,0,1,1,2]},
  {"name":"Y6","x":56,"z":66,"h":103,"shape":"spired","w":11,"rot":45,"face":10,"facing":225,"faceY":70,"belfry":80,"ring":88,"frame":"iron","law":false,"interval":6.774,"start":1.033,"rank":63,"bell":6.16,"r0":6.1,"dial":[2,0,1,1,2]},
  {"name":"N1","x":137.1,"z":-132.3,"h":104,"shape":"stepped","w":11,"rot":25,"face":9,"facing":205,"faceY":76,"belfry":86,"ring":94,"frame":"stone","law":false,"interval":6.228,"start":4.452,"rank":36,"bell":6.16,"r0":6.1,"dial":[3,2,1,1,0]},
  {"name":"N2","x":123.1,"z":-138.8,"h":118,"shape":"spired","w":11,"rot":25,"face":10,"facing":205,"faceY":78,"belfry":92,"ring":100,"frame":"stone","law":false,"interval":6.653,"start":0.731,"rank":57,"bell":6.16,"r0":6.1,"dial":[0,2,0,1,2]},
  {"name":"N3","x":65.2,"z":-165.2,"h":96,"shape":"open-work","w":10,"rot":25,"face":9,"facing":205,"faceY":59,"belfry":67,"ring":75,"frame":"stone","law":false,"interval":5.763,"start":2.957,"rank":13,"bell":5.6,"r0":5.6,"dial":[0,0,1,2,0]},
  {"name":"N4","x":101.7,"z":-147.1,"h":96,"shape":"spired","w":8,"rot":25,"face":7,"facing":25,"faceY":59.5,"belfry":67,"ring":74.8,"frame":"stone","law":false,"interval":5.561,"start":1.304,"rank":3,"bell":4.48,"r0":4.6,"dial":[2,0,0,2,1]},
  {"name":"N5","x":80.9,"z":-160.1,"h":116,"shape":"stepped","w":14,"rot":25,"face":13,"facing":205,"faceY":70,"belfry":98,"ring":107,"frame":"stone","law":false,"interval":7.239,"start":2.563,"rank":86,"bell":7.84,"r0":7.6,"dial":[1,0,0,1,2]},
  {"name":"S1","x":120.8,"z":-96.2,"h":112,"shape":"spired","w":10,"rot":25,"face":9,"facing":25,"faceY":80,"belfry":88,"ring":96,"frame":"iron","law":false,"interval":5.965,"start":2.475,"rank":23,"bell":5.6,"r0":5.6,"dial":[2,2,1,2,2]},
  {"name":"S2","x":98.3,"z":-105.6,"h":93,"shape":"domed","w":12,"rot":25,"face":11,"facing":25,"faceY":73,"belfry":80,"ring":87,"frame":"stone","law":false,"interval":6.956,"start":5.839,"rank":72,"bell":6.72,"r0":6.6,"dial":[3,2,0,0,1]},
  {"name":"S3","x":84.8,"z":-113.1,"h":120,"shape":"open-work","w":10,"rot":25,"face":9,"facing":25,"faceY":86,"belfry":96,"ring":105,"frame":"iron","law":false,"interval":5.824,"start":3.113,"rank":16,"bell":5.6,"r0":5.6,"dial":[3,0,0,1,2]},
  {"name":"S4","x":71,"z":-118.9,"h":102,"shape":"stepped","w":11,"rot":25,"face":10,"facing":25,"faceY":68,"belfry":82,"ring":90,"frame":"iron","law":false,"interval":6.511,"start":5.551,"rank":50,"bell":6.16,"r0":6.1,"dial":[1,0,1,2,1]},
  {"name":"S5","x":48.9,"z":-129.2,"h":114,"shape":"spired","w":11,"rot":25,"face":10,"facing":25,"faceY":77,"belfry":90,"ring":98,"frame":"stone","law":false,"interval":6.855,"start":2.663,"rank":67,"bell":6.16,"r0":6.1,"dial":[2,1,1,1,1]},
  {"name":"C01","x":-12,"z":-11.5,"h":90,"shape":"stepped","w":10.5,"rot":11,"face":9.5,"facing":101,"faceY":62,"belfry":69.5,"ring":77,"frame":"stone","law":false,"interval":6.147,"start":2.943,"rank":32,"bell":5.88,"r0":5.85,"dial":[3,1,1,1,1]},
  {"name":"C02","x":-12,"z":12,"h":93,"shape":"open-work","w":11,"rot":78,"face":10,"facing":78,"faceY":69,"belfry":77.5,"ring":85.5,"frame":"iron","law":false,"interval":6.754,"start":3.787,"rank":62,"bell":6.16,"r0":6.1,"dial":[1,0,0,0,2]},
  {"name":"C03","x":5.9,"z":-33.5,"h":109,"shape":"spired","w":14,"rot":41,"face":13,"facing":131,"faceY":87,"belfry":95.5,"ring":103,"frame":"iron","law":false,"interval":7.098,"start":0.687,"rank":79,"bell":7.84,"r0":7.6,"dial":[2,1,0,2,1]},
  {"name":"C04","x":-16,"z":-30,"h":98,"shape":"stepped","w":10,"rot":26,"face":9,"facing":116,"faceY":70.5,"belfry":78.5,"ring":86,"frame":"iron","law":false,"interval":6.167,"start":4.277,"rank":33,"bell":5.6,"r0":5.6,"dial":[0,2,0,0,2]},
  {"name":"C05","x":-30.8,"z":-14.4,"h":99,"shape":"open-work","w":10.5,"rot":11,"face":9.5,"facing":101,"faceY":68,"belfry":76.5,"ring":84,"frame":"stone","law":false,"interval":5.925,"start":5.838,"rank":21,"bell":5.88,"r0":5.85,"dial":[0,2,1,2,1]},
  {"name":"C06","x":-30.8,"z":14.4,"h":101,"shape":"spired","w":10,"rot":79,"face":9,"facing":79,"faceY":67,"belfry":75,"ring":82.5,"frame":"iron","law":false,"interval":6.046,"start":3.935,"rank":27,"bell":5.6,"r0":5.6,"dial":[2,0,0,0,2]},
  {"name":"C07","x":-16,"z":30,"h":103,"shape":"domed","w":14,"rot":64,"face":13,"facing":64,"faceY":79,"belfry":87.5,"ring":95.5,"frame":"stone","law":false,"interval":7.199,"start":3.942,"rank":84,"bell":7.84,"r0":7.6,"dial":[3,2,1,0,1]},
  {"name":"C08","x":5.9,"z":33.5,"h":111,"shape":"stepped","w":12,"rot":49,"face":11,"facing":49,"faceY":87,"belfry":96,"ring":104,"frame":"stone","law":false,"interval":6.713,"start":0.881,"rank":60,"bell":6.72,"r0":6.6,"dial":[3,2,1,2,0]},
  {"name":"C09","x":24.1,"z":26.8,"h":99,"shape":"spired","w":15,"rot":38,"face":14,"facing":38,"faceY":77,"belfry":86,"ring":93.5,"frame":"stone","law":false,"interval":7.28,"start":5.705,"rank":88,"bell":8.4,"r0":8.1,"dial":[3,0,0,1,0]},
  {"name":"C10","x":23.5,"z":-44.1,"h":112,"shape":"stepped","w":14,"rot":64,"face":13,"facing":154,"faceY":90,"belfry":98.5,"ring":106,"frame":"stone","law":false,"interval":7.078,"start":3.575,"rank":78,"bell":7.84,"r0":7.6,"dial":[1,1,1,0,1]},
  {"name":"C11","x":-7.8,"z":-49.4,"h":116,"shape":"spired","w":11.5,"rot":43,"face":10.5,"facing":133,"faceY":91,"belfry":99.5,"ring":107,"frame":"stone","law":false,"interval":6.734,"start":2.33,"rank":61,"bell":6.44,"r0":6.35,"dial":[0,0,1,1,1]},
  {"name":"C12","x":-36.3,"z":-34.4,"h":110,"shape":"open-work","w":12,"rot":23,"face":11,"facing":113,"faceY":89,"belfry":97,"ring":105,"frame":"stone","law":false,"interval":7.017,"start":6.039,"rank":75,"bell":6.72,"r0":6.6,"dial":[2,0,0,2,2]},
  {"name":"C13","x":-49.5,"z":-7.2,"h":91,"shape":"spired","w":11.5,"rot":4,"face":10.5,"facing":94,"faceY":63,"belfry":73,"ring":81,"frame":"iron","law":false,"interval":6.491,"start":4.14,"rank":49,"bell":6.44,"r0":6.35,"dial":[0,0,0,1,1]},
  {"name":"C14","x":-49.5,"z":7.2,"h":93,"shape":"stepped","w":11.5,"rot":86,"face":10.5,"facing":86,"faceY":64.5,"belfry":74.5,"ring":82,"frame":"stone","law":false,"interval":6.835,"start":5.446,"rank":66,"bell":6.44,"r0":6.35,"dial":[1,1,0,0,1]},
  {"name":"C15","x":-36.3,"z":34.4,"h":114,"shape":"spired","w":12,"rot":67,"face":11,"facing":67,"faceY":90,"belfry":98,"ring":106,"frame":"iron","law":false,"interval":6.552,"start":4.318,"rank":52,"bell":6.72,"r0":6.6,"dial":[3,0,1,2,2]},
  {"name":"C16","x":-7.8,"z":49.4,"h":120,"shape":"open-work","w":15,"rot":47,"face":14,"facing":47,"faceY":91,"belfry":100,"ring":108,"frame":"stone","law":false,"interval":7.26,"start":4.13,"rank":87,"bell":8.4,"r0":8.1,"dial":[2,0,1,2,2]},
  {"name":"C17","x":24.1,"z":49.4,"h":113,"shape":"stepped","w":15,"rot":23,"face":14,"facing":23,"faceY":90,"belfry":99,"ring":106.5,"frame":"iron","law":false,"interval":7.3,"start":7.289,"rank":89,"bell":8.4,"r0":8.1,"dial":[0,1,1,2,0]},
  {"name":"FB1","x":-105.6,"z":-374.2,"h":60,"shape":"spired","w":9,"rot":65,"face":8,"facing":65,"faceY":34,"belfry":42,"ring":49,"frame":"stone","law":true,"interval":5.642,"start":2.655,"rank":7,"bell":5.04,"r0":5.1,"dial":[2,1,0,2,0]},
  {"name":"FB2","x":-138.5,"z":-334.4,"h":105,"shape":"stepped","w":10,"rot":65,"face":9,"facing":65,"faceY":79,"belfry":87,"ring":94,"frame":"iron","law":true,"interval":6.309,"start":5.999,"rank":40,"bell":5.6,"r0":5.6,"dial":[3,0,0,2,2]},
  {"name":"FB3","x":-171.4,"z":-294.6,"h":87,"shape":"open-work","w":11,"rot":65,"face":10,"facing":65,"faceY":61,"belfry":69,"ring":76,"frame":"stone","law":true,"interval":6.208,"start":3.104,"rank":35,"bell":6.16,"r0":6.1,"dial":[2,2,0,0,0]},
  {"name":"FB4","x":-169,"z":-238.3,"h":69,"shape":"spired","w":9,"rot":65,"face":8,"facing":65,"faceY":43,"belfry":51,"ring":58,"frame":"iron","law":true,"interval":5.803,"start":5.471,"rank":15,"bell":5.04,"r0":5.1,"dial":[2,0,1,2,1]},
  {"name":"FB5","x":-201.9,"z":-198.5,"h":114,"shape":"stepped","w":10,"rot":65,"face":9,"facing":65,"faceY":88,"belfry":96,"ring":103,"frame":"stone","law":true,"interval":5.682,"start":1.574,"rank":9,"bell":5.6,"r0":5.6,"dial":[0,2,0,2,1]},
  {"name":"FB6","x":-234.8,"z":-158.6,"h":96,"shape":"open-work","w":11,"rot":65,"face":10,"facing":65,"faceY":70,"belfry":78,"ring":85,"frame":"iron","law":true,"interval":6.37,"start":6.193,"rank":43,"bell":6.16,"r0":6.1,"dial":[2,1,1,0,1]},
  {"name":"FB7","x":-232.4,"z":-102.3,"h":78,"shape":"spired","w":9,"rot":65,"face":8,"facing":65,"faceY":52,"belfry":60,"ring":67,"frame":"stone","law":true,"interval":6.026,"start":2.628,"rank":26,"bell":5.04,"r0":5.1,"dial":[1,0,1,1,1]},
  {"name":"FB8","x":-265.3,"z":-62.5,"h":60,"shape":"stepped","w":10,"rot":65,"face":9,"facing":65,"faceY":34,"belfry":42,"ring":49,"frame":"iron","law":true,"interval":5.904,"start":4.549,"rank":20,"bell":5.6,"r0":5.6,"dial":[3,1,0,1,1]},
  {"name":"FB9","x":-298.2,"z":-22.7,"h":105,"shape":"open-work","w":11,"rot":65,"face":10,"facing":65,"faceY":79,"belfry":87,"ring":94,"frame":"stone","law":true,"interval":6.633,"start":5.937,"rank":56,"bell":6.16,"r0":6.1,"dial":[3,1,1,2,1]},
  {"name":"FB10","x":-295.8,"z":33.6,"h":87,"shape":"spired","w":9,"rot":65,"face":8,"facing":65,"faceY":61,"belfry":69,"ring":76,"frame":"iron","law":true,"interval":5.601,"start":0.23,"rank":5,"bell":5.04,"r0":5.1,"dial":[0,1,0,2,2]},
  {"name":"EF1","x":330,"z":150,"h":78,"shape":"stepped","w":10,"rot":0,"face":9,"facing":270,"faceY":50,"belfry":59,"ring":66,"frame":"iron","law":true,"interval":6.127,"start":5.435,"rank":31,"bell":5.6,"r0":5.6,"dial":[2,1,0,0,1]},
  {"name":"EF2","x":344,"z":95,"h":108,"shape":"open-work","w":11,"rot":0,"face":10,"facing":270,"faceY":80,"belfry":89,"ring":96,"frame":"iron","law":true,"interval":6.794,"start":2.495,"rank":64,"bell":6.16,"r0":6.1,"dial":[3,0,0,0,0]},
  {"name":"EF3","x":330,"z":40,"h":88,"shape":"spired","w":10,"rot":0,"face":9,"facing":270,"faceY":60,"belfry":69,"ring":76,"frame":"stone","law":true,"interval":5.945,"start":1.189,"rank":22,"bell":5.6,"r0":5.6,"dial":[1,2,0,1,2]},
  {"name":"EF4","x":344,"z":-15,"h":118,"shape":"stepped","w":11,"rot":0,"face":10,"facing":270,"faceY":90,"belfry":99,"ring":106,"frame":"stone","law":true,"interval":6.693,"start":6.134,"rank":59,"bell":6.16,"r0":6.1,"dial":[2,2,0,1,0]},
];
// the route's knots [x, y, z], in their order; the last is the exit ring's centre
export const KNOTS = [
  [167.2,70,174],
  [167.2,70,146],
  [167.2,70,118],
  [167.2,72.9,74],
  [167.2,78.3,34],
  [175.2,81.9,8],
  [175.2,83.7,-14],
  [171.2,82.5,-35],
  [167.2,79,-77],
  [165.1,76.4,-88.3],
  [158.8,73.7,-97.9],
  [149.9,71.2,-104.2],
  [133.6,68.1,-111.8],
  [107.9,68,-123.8],
  [82.3,68,-135.8],
  [56.6,68,-147.7],
  [45.6,68.2,-150.4],
  [34.4,68.5,-148.7],
  [24.7,68.8,-142.8],
  [18,69.1,-133.7],
  [15.3,69.4,-122.7],
  [17.1,69.7,-111.5],
  [22.9,70,-102],
  [40.3,71.2,-82.8],
  [57.7,71.6,-63.6],
  [76.983,70.2,-42.372],
  [78.51,70.1,-40.69],
  [80.038,70.04,-39.008],
  [81.529,70.01,-37.294],
  [82.946,70,-35.519],
  [84.246,70,-33.656],
  [85.383,70,-31.689],
  [86.327,70,-29.622],
  [87.056,70,-27.471],
  [87.559,70,-25.255],
  [87.823,70,-22.998],
  [87.845,70,-20.727],
  [87.625,70,-18.466],
  [87.166,70,-16.241],
  [86.473,70,-14.077],
  [85.553,70,-12],
  [84.418,70,-10.032],
  [83.079,70,-8.196],
  [81.553,70,-6.513],
  [79.857,70,-5.002],
  [78.009,70,-3.68],
  [76.031,70,-2.562],
  [73.948,70,-1.656],
  [71.784,70,-0.964],
  [69.564,70,-0.484],
  [67.31,70,-0.194],
  [65.043,70,-0.048],
  [62.772,70,0],
  [60.5,70,0],
  [58.228,70,0],
  [0,70,0],
];
// the six looks as the engine takes them (from and to are shares of the route's length)
export const LOOKS = [
  { name: "EF4 beyond the east flank", at: [344,70,-15], from: 0.0388, to: 0.1537, fade: 0.312, weight: 1, steady: true },
  { name: "the low quarter's roofs", at: [206,24,-134], from: 0.2091, to: 0.3316, fade: 0.2927, weight: 1, steady: true },
  { name: "N5's east wall beside its dial", at: [86.4,67,-155.3], from: 0.481, to: 0.571, fade: 0.4316, weight: 1, steady: true },
  { name: "the mid-river place", at: [-100,0,-95], from: 0.5711, to: 0.6626, fade: 0.4388, weight: 1, steady: true },
  { name: "W6 beyond the run", at: [138,80,-30], from: 0.6626, to: 0.815, fade: 0.2436, weight: 0.94, steady: true },
  { name: "Y6 south of the hollow's mouth", at: [56,70,66], from: 0.82, to: 0.925, fade: 0.47, weight: 0.75, steady: true },
];
// every colour as the screen shows it (sRGB hex), by a short key; the designer's own name of each stands beside it
export const COLOURS = {
  stoneLit: '#b38348',   // lit stone (wall square to the key)
  stoneUnlit: '#231e43',   // unlit stone (0.065)
  stoneWashRim: '#5a546b',   // unlit stone under a face's steady wash, at the dial's rim (0.065 + 0.30)
  faceRest: '#dbcfb2',   // face at rest (2.4)
  faceTop: '#fff2d0',   // face at the top of its bell's stroke (3.4)
  ringBrightest: '#bdb2a3',   // ring at its brightest, half a second from its cornice (1.73)
  ring50: '#80786d',   // ring at 50 m (0.73)
  ring87: '#676158',   // ring at 87 m, as its fading begins (0.46)
  lamp: '#b58249',   // lamp (1.0)
  window: '#845e33',   // window of a house front (0.5)
  tileUnlit: '#0e1226',   // glazed tile, unlit
  tileLit: '#27304f',   // glazed tile, lit
  tileGlint: '#d29044',   // tile's glint line on its lit edge (1.3)
  ironLit: '#3b2c20',   // iron, lit edge
  iron: '#0c0a14',   // iron
  bell: '#14101c',   // bell metal
  bellRim: '#885c29',   // bell's lit rim (0.5)
  houseUnlit: '#1a1533',   // house wall, unlit
  houseRoof: '#141028',   // house roof
  houseLit: '#6f4f2a',   // house wall, lit (0.35)
  river: '#100c26',   // river
  bankUnlit: '#231e43',   // embankment stone, unlit
  skyAmber: '#ffae3c',   // sky: AMBER, the west's horizon
  skyAmber10: '#c9882d',   // sky: amber 10 deg up in the west (the same amber at 1.15)
  skyMixWest15: '#7f7a72',   // sky: the mix point 15 deg up in the west (0.75)
  skyViolet: '#5b4a94',   // sky: VIOLET, 20 deg up, all round
  skyHigh: '#1c1546',   // sky: DARK VIOLET, 28 deg up to overhead
  skySlate: '#3e3a72',   // sky: SLATE VIOLET, the horizon away from the west
  skyAway10: '#4c4283',   // sky: 10 deg up away from the west (slate violet halfway to violet)
  skyMixHalf0: '#969187',   // sky: the mix point at the horizon half-west (1.085)
  skyMixHalf10: '#7b776f',   // sky: the mix point 10 deg up half-west (0.71)
  skyMixHalf15: '#6c6861',   // sky: the mix point 15 deg up half-west (0.53)
  fadeWest: '#d99a55',   // far fade toward the west
  fadeHalf: '#858077',   // far fade half-west (the mix point at 0.833)
  fadeAway: '#3e3a72',   // far fade elsewhere
  key: '#ffb055',   // key light
  fillUp: '#4a3f8a',   // fill from above
  fillDown: '#15102c',   // fill from below
};
export const RING_COLOUR = '#fff1dc', CREAM = '#fff2d0';
// one unit of lit stone: the luminance of a wall square to the key; a face at the top of its bell's stroke is 3.4 units and is the cream itself
export const UNIT = 0.262701, RING_LUM = 0.893379;
// the sky: three columns of linear colours at five angles above the horizon; a bearing takes the mix of the two columns its west share lies between
export const SKY_STOPS = [0,10,15,20,28];
export const SKY = {
  west: [[1, 0.423268, 0.045186], [0.584078, 0.246201, 0.026241], [0.212231, 0.194618, 0.168269], [0.104616, 0.068478, 0.296138], [0.011612, 0.007499, 0.061246]],
  half: [[0.304987, 0.283149, 0.242281], [0.198069, 0.184475, 0.158961], [0.14996, 0.138432, 0.119538], [0.104616, 0.068478, 0.296138], [0.011612, 0.007499, 0.061246]],
  away: [[0.048172, 0.042311, 0.168269], [0.072272, 0.05448, 0.226966], [0.088444, 0.061479, 0.261552], [0.104616, 0.068478, 0.296138], [0.011612, 0.007499, 0.061246]],
};
// small sums of the place, the designer's own
export const rad = (d) => d * Math.PI / 180;
export const dirOf = (b) => [Math.sin(rad(b)), -Math.cos(rad(b))];
export const fromEastBank = (x, z) => (x - RIVER.p[0]) * RIVER.inland[0] + (z - RIVER.p[1]) * RIVER.inland[1];
export const overWater = (x, z) => { const s = fromEastBank(x, z); return s < 0 && s > -RIVER.width; };
export const westShare = (b) => { const a = Math.abs(((b - 270 + 540) % 360) - 180), x = Math.max(0, Math.min(1, (a - 50) / 60)); return 1 - x * x * (3 - 2 * x); };
