/*
Tampilan banyak none memakai heatmap
https://www.patrick-wied.at/static/heatmapjs/
*/

const BROKER_ADDR = '127.0.0.1';
const BROKER_PORT = '3000';

const SYS_TOPIC = 'TF-IIOT/';
const TAG_TOPIC = 'CT'; // tag yang akan masuk chart

// nama eleman HTML
const E_HEATMAP = 'e-heatmap';

// interval heatmap akan diupdate
const UPDATE_INTERVAL = 1000;
const CT_MAX = 5000;
const CT_MIN = 0;

const HEATMAP_SCALE = 400 / 5;

// hitung berapa data yang sudah diterima
var received_count = 0;
var value_max = 0;
var value_min = 1000;
var rgb_topics = ['DIR', 'DIG', 'DIB']

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
var broker_url = 'ws://' + BROKER_ADDR + ":" + BROKER_PORT;
var client = mqtt.connect(broker_url);

// Run when connected (continuous)
client.on('connect', async function() {
    console.log('MQTT client connected to ' + broker_url);

    // siap terima semua data CT
    sub_topic = SYS_TOPIC + '+/' + TAG_TOPIC + '/#';
    client.subscribe(sub_topic);
    console.log("Subscribe for " + sub_topic);
    timer = setInterval(viewUpdateHeatmap, UPDATE_INTERVAL);

})

// Run when message received
client.on('message', function(topic, message) {
    // decode topic
    // SYS/NODE/TAG/NUM
    fields = topic.split("/");
    node = fields[1];
    tag = fields[2]
    value = parseInt(message.toString('utf-8'), 10);
    // console.log('Received %s = %d', node, value);
    if (tag==TAG_TOPIC){
      onReceiveCT(node, value);
    }
    updateValues();
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

// ------------------------------------------------------------
// Fungsi-fungsi untuk update UI

// memasukkan data CT ke heatmap
async function onReceiveCT(node, value) {
    point = mapCT.get(node);
    if (point != null) {
        point.value = value;
        received_count += 1;
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
            point.value = node.PX * node.PY * 300;
            heatmap_data.data.push(point);
            mapCT.set(node.NODE, point);
        }
        heatmap.setData(heatmap_data);
        console.log('heatmap_data = ' + JSON.stringify(heatmap_data));
        return true;
    } else {
        shtml = "Cannot get the nodes";
        document.getElementById(E_HEATMAP).innerHTML = shtml;
        return false;
    }
}

// menampilkan heatmap kalau ada data yang sudah berubah
function viewUpdateHeatmap() {
    if (received_count > 0) {
        heatmap.setData(heatmap_data);
        received_count = 0;
        console.log('Heatmap repainted');
    }
}

viewHeatmap();

// SECTION STATUS 1 NODE ======================================================
const E_NODES = 'e-nodes';
const E_BRIGHT = 'e-bright';
const E_LED = 'e-led';

var nodes;
var active_node = "";
var active_node_id = 0;
var active_tag = "";
var active_tag_id = 0;
var active_di_id = ["", "", ""];

//----------------------------------------------------
// Fungsi-fungsi REST
async function getTags(node_id) {
    url = '/api/tags/' + node_id;
    //console.log('Get :', url);
    response = await fetch(url);
    myJson = await response.json();
    // console.log(JSON.stringify(myJson));
    return myJson;
}

// mengisi data awal, memakai web Service
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

async function viewNodes() {
    nodes = await getNodes();
    if (nodes) {
        // build menu sesuai hak
        shtml = `<select class="form-control" name="IOT-NODES" onchange="onChangeNode(this.value)">`;
        for (node of nodes) {
            shtml += `<option value="${node.NODE}/${node.ID}">${node.NODE}</option>`;
        }
        shtml += `</select>`;
        onChangeNode(nodes[0].NODE + '/' + nodes[0].ID);
    } else {
        shtml = "Cannot get the nodes";
    }
    //console.log(shtml);
    // ganti element
    document.getElementById(E_NODES).innerHTML = shtml;
}

// fungsi ganti active_node
// value berisi "node/node_id"
async function onChangeNode(value) {
    // berhenti subscribe node lama
    if (active_node != "") {
      for (topic of rgb_topics){
        client.unsubscribe(SYS_TOPIC + active_node + '/' + topic + '/#');
      }
    }

    // decode node baru
    fields = value.split('/');
    active_node = fields[0];
    active_node_id = parseInt(fields[1], 10);

    // pisahkan nomor node
    node_num = active_node.substr(4);
    active_tag = TAG_TOPIC + node_num + '1';

    // tampilkan tags node baru
    await updateActiveTags();
    await updateValues();

    // subscribe node baru
    for (topic of rgb_topics){
      client.subscribe(SYS_TOPIC + active_node + '/' + topic + '/#');
    }
}

async function updateActiveTags() {
    tags = await getTags(active_node_id);
    console.log("TAG=" + active_tag);
    if (tags) { // dapet tag_id buat ct,dir,dig,dib pada node tersebut
        for (tag of tags) {
            if (tag.TAG == active_tag) {
                active_tag_id = tag.ID;
                console.log("TAG_ID=" + active_tag_id);
            } else if (tag.TAG.substr(0, 2) == "DI") {
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
}

// Fungsi Untuk mengupdate values CT dan DI di tampilan
async function updateValues() {
    if (active_tag_id) {
        lux = await getData(active_tag_id, 1);
        if (lux) {
            document.getElementById(E_BRIGHT).innerHTML = lux[0].VALUE;
        }
    }
    if (active_di_id) {
        r = await getData(active_di_id[0], 1);
        g = await getData(active_di_id[1], 1);
        b = await getData(active_di_id[2], 1);
        if (r && g && b) {
            document.getElementById(E_LED).style.backgroundColor = 'rgb(' + r[0].VALUE + ',' + g[0].VALUE + ',' + b[0].VALUE + ')';
        }
    }
}

function viewUpdateTag(tag, value) {
    e = document.getElementById(tag);
    if (e) {
        e.innerHTML = value;
        //console.log("Update "+tag+"="+value.toString());
    }
}


viewNodes();
