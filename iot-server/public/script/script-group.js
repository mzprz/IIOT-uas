/*
Tampilan banyak none memakai heatmap
https://www.patrick-wied.at/static/heatmapjs/
*/

const BROKER_ADDR = '127.0.0.1';
const BROKER_PORT = '3000';

const SYS_TOPIC = 'TF-IIOT/';
const TAG_TOPIC = 'CT';       // tag yang akan masuk chart

// nama eleman HTML
const E_HEATMAP = 'e-heatmap';

// interval heatmap akan diupdate
const UPDATE_INTERVAL = 1000;
const CT_MAX = 5000;
const CT_MIN = 0;

const HEATMAP_SCALE = 400/5;

// hitung berapa data yang sudah diterima
var received_count=0;
var value_max=0;
var value_min=1000;


// heatmap
// create configuration object
var config = {
    container: document.getElementById(E_HEATMAP),
  };

// data-data heatmap
var heatmap = h337.create(config);
var heatmap_data = {
    max: CT_MAX,
    min: CT_MIN,
    data: []
}
// KALAU DI SET DI SINI, KELUAR
// KALAU DARI viewHeatmap(), tak mau
//heatmap.setData(heatmap_data);

// map untuk mempercepat akses ke heatmap_data
var mapCT = new Map();

// MQTT Setup
var broker_url = 'ws://'+BROKER_ADDR+":"+BROKER_PORT;
var client = mqtt.connect(broker_url);

// Run when connected (continuous)
client.on('connect', async function() {
    console.log('MQTT client connected to '+broker_url);

        // siap terima semua data CT
    topic = SYS_TOPIC+'+/'+TAG_TOPIC+'/#';
    topic2 = SYS_TOPIC+'+/'+ 'DIR' +'/#';
    topic3 = SYS_TOPIC+'+/'+ 'DIG' +'/#';
    topic4 = SYS_TOPIC+'+/'+ 'DIB' +'/#';
    client.subscribe(topic);
    client.subscribe(topic2);
    client.subscribe(topic3);
    client.subscribe(topic4);
    // console.log("Subscribe for "+topic);
    timer = setInterval(viewUpdateHeatmap, UPDATE_INTERVAL);

})

// Run when message received
client.on('message', function(topic, message) {
    // decode topic
    // SYS/NODE/TAG/NUM
    fields = topic.split("/");
    node = fields[1];
    tag = fields[2];
    value = parseInt(message.toString('utf-8'),10);
    //console.log('Received %s = %d', node, value);
    if (tag =='CT'){
      onReceiveCT(node, value);
    } else {
        viewUpdateLedMap(node.substr(4));
    }
})

//----------------------------------------------------
// Fungsi-fungsi REST
async function getNodes() {
  url = '/api/nodes';
  //console.log('Get :', url);
  response = await fetch(url);
  rjson = await response.json();
  //console.log(JSON.stringify(rjson));
  return rjson;
}

async function getTags(node_id) {
    url = '/api/tags/' + node_id;
    //console.log('Get :', url);
    response = await fetch(url);
    myJson = await response.json();
    // console.log(JSON.stringify(myJson));
    return myJson;
}

async function getData(tag_id, len) {
    url = '/api/data/' + tag_id + '/' + len.toString();
    console.log('Get :', url);
    response = await fetch(url);
    rjson = await response.json();
    console.log("FETCH =" + JSON.stringify(rjson));
    return rjson;
}

// ------------------------------------------------------------
// Fungsi-fungsi untuk update UI

// memasukkan data CT ke heatmap
async function onReceiveCT(node, value) {
    point = mapCT.get(node);
    if (point != null) {
        point.value = value;
        received_count +=1;
        //console.log("Update "+node+"="+JSON.stringify(point));
    }
}

// mengambil data posisi (X,Y) semua node
// lalu menginisiasi tampilan heat map
async function viewHeatmap() {
  nodes = await getNodes();
  if (nodes) {
    // build heat map
    heatmap_data.data = []; /// kosongkan dulu
    for (node of nodes) {
        var point = new Object();
        point.x = node.PX * HEATMAP_SCALE;
        point.y = node.PY * HEATMAP_SCALE;
        point.value = node.PX*node.PY*300;
        heatmap_data.data.push(point);
        mapCT.set(node.NODE,point);
    }
    heatmap.setData(heatmap_data);
    console.log('heatmap_data = '+JSON.stringify(heatmap_data));
    return true;
  }
  else {
    shtml="Cannot get the nodes";
    document.getElementById(E_HEATMAP).innerHTML = shtml;
    return false;
  }
}

// menampilkan heatmap kalau ada data yang sudah berubah
function viewUpdateHeatmap() {
    if (received_count > 0) {
        heatmap.setData(heatmap_data);
        received_count=0;
        console.log('Heatmap repainted');
    }
}

async function viewUpdateLedMap(node) {
  var tags = await getTags(node);
  var active_di_id = [];
  // console.log("TAG=" + active_tag);
  if (tags) { // dapet tag_id buat ct,dir,dig,dib pada node tersebut
      for (tag of tags) {
          if (tag.TAG.substr(0, 2) == "DI") {
              if (tag.TAG.substr(2, 1) == "R") {
                  active_di_id[0] = tag.ID
              };
              if (tag.TAG.substr(2, 1) == "G") {
                  active_di_id[1] = tag.ID
              };
              if (tag.TAG.substr(2, 1) == "B") {
                  active_di_id[2] = tag.ID
              };
          }
      }
  }

  if (active_di_id) {
      var r = await getData(active_di_id[0], 1);
      var g = await getData(active_di_id[1], 1);
      var b = await getData(active_di_id[2], 1);
      if (r && g && b) {
          document.getElementById("LED"+node).style.backgroundColor = 'rgb(' + r[0].VALUE + ',' + g[0].VALUE + ',' + b[0].VALUE + ')';
      }
  }
}

async function initLED() {
  var nodes = await getNodes();
  if (nodes){
    for (node of nodes){
      await viewUpdateLedMap(node.NODE.substr(4));
    }
  }
}

initLED();
viewHeatmap();

// ----------------------------
//init add
function initConfigure() {
    $('#myModal').modal('show');
}
