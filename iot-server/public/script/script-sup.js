const BROKER_ADDR = '192.168.43.110';
const BROKER_PORT = '3000';

const SYS_TOPIC = 'TF-IIOT/';
const TAG_TOPIC = 'CT';       // tag yang akan masuk chart

// nama eleman HTML
const E_NODES = 'e-nodes';
const E_TAGS = 'e-tags';
const E_CHART = 'e-chart';


// Nilai boolean
const OFF = 0;
const ON = 1;
const INVALID=2;

// warna LED untuk status
const led_colors = [
  "rgb(46, 204, 113)",   // 0: off
  "rgb(231, 76, 60)",    // 1: on
  "darkgrey"];           // invalid


// chart.js, multiline
var config = {
  type: 'line',
  data: {
    labels: [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0],  // akan diisi waktu
    datasets: [{
      label: 'CT',
      backgroundColor: window.chartColors.red,
      borderColor: window.chartColors.red,
      fill: false,
      data: [],   // sebaiknya diisi inisial
    }]
  },
  options: {
    responsive: true,
    title: {
      display: true,
      text: 'IOT NODE'
    },
    tooltips: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    scales: {
      xAxes: [{
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Sampling'
        }
      }],
      yAxes: [{
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Temperature'
        }
      }]
    }
  }
};


// obyek-obyek yang sedang di supervisory
var nodes;
var active_node="";
var active_node_id=0;
var active_tag="";
var active_tag_id=0;
var displayed_tags = ['CT', 'DI', 'YI'];
var active_edit_tags = ['CC', 'YI', 'DVR', 'DVG', 'DVB'];
var active_edit_tags_id = ['', '', '', '', '']; // ID CC, DVRGB, dan YS yang aktif

// pointer agar cepat akses data chart
var active_chart_title = config.data.datasets[0].title;
var active_chart_data = config.data.datasets[0].data;

// MQTT Setup
var broker_url = 'ws://'+BROKER_ADDR+":"+BROKER_PORT;
var client = mqtt.connect(broker_url);

// Run when connected (continuous)
client.on('connect', function() {
    console.log('MQTT client connected to '+broker_url);
})

// Run when message received
client.on('message', function(topic, message) {
    // decode topic
    // SYS/NODE/TAG/NUM
    fields = topic.split("/");
    tag = fields[2] + fields[3];
    value = parseInt(message.toString('utf-8'),10);
    // console.log('Received %s = %d', tag, value);
    viewUpdateTag(tag, value);
    if (active_edit_tags.includes(fields[2])){
      viewUpdateTag(fields[2], value);
      if(fields[2]=='YI'){
        ys_s.setValue(value, triggerChangeEvent = true);
      }
    }
    if (tag == active_tag) {
      viewUpdateChart(value);
    }
})


//----------------------------------------------------
// Fungsi-fungsi REST
async function getNodes() {
  url = '/api/nodes_active';
  //console.log('Get :', url);
  response = await fetch(url);
  rjson = await response.json();
  //console.log(JSON.stringify(rjson));
  return rjson;
}

// Fungsi-fungsi REST
async function getTags(node_id) {
  url = '/api/tags/'+node_id;
  //console.log('Get :', url);
  response = await fetch(url);
  myJson = await response.json();
  // console.log(JSON.stringify(myJson));
  return myJson;
}

// mengisi data awal, memakai web Service
async function getData(tag_id, len) {
  url = '/api/data/'+tag_id+'/'+len.toString();
  console.log('Get :', url);
  response = await fetch(url);
  rjson = await response.json();
  console.log("FETCH ="+JSON.stringify(rjson));
  return rjson;
}

// ------------------------------------------------------------
// Fungsi-fungsi untuk update UI

// fungsi ganti active_node
// value berisi "node/node_id"
async function onChangeNode(value) {
  // berhenti subscribe node lama
  if (active_node != "") {
    client.unsubscribe(SYS_TOPIC+active_node+'/#');
  }

  // decode node baru
  fields = value.split('/');
  active_node = fields[0];
  active_node_id = parseInt(fields[1],10);

  // pisahkan nomor node
  node_num = active_node.substr(4);
  active_tag = TAG_TOPIC + node_num + '1';

  // tampilkan tags node baru
  await viewTags();
  await initRGB();

  // tampilkan char node baru
  await viewChart();

  // subscribe node baru
  client.subscribe(SYS_TOPIC+active_node+'/#');

}

async function viewNodes() {
  nodes = await getNodes();
  if (nodes) {
    // build menu sesuai hak
    shtml=`<select class="form-control" name="IOT-NODES" onchange="onChangeNode(this.value)">`;
    for (node of nodes) {
      shtml += `<option value="${node.NODE}/${node.ID}">${node.NODE}</option>`;
    }
    shtml+=`</select>`;
    onChangeNode(nodes[0].NODE+'/'+nodes[0].ID);
  }
  else {
    shtml="Cannot get the nodes";
  }
  //console.log(shtml);
  // ganti element
  document.getElementById(E_NODES).innerHTML = shtml;
}

async function viewTags() {
  tags = await getTags(active_node_id);
  console.log("TAG="+active_tag);
  if (tags) {
    // build table sesuai tags
    shtml=`<table class="table">`;
    for (tag of tags) {
      if (displayed_tags.includes(tag.TAG.substr(0,2))){
        shtml += `<tr><td>${tag.TAG}</td><td id="${tag.TAG}">0</td></tr>`;
        // simpan tag_id agar nanti lebih cepat ambil data
        if (tag.TAG == active_tag) {
          active_tag_id = tag.ID;
          console.log("TAG_ID="+active_tag_id);
        }

        activ2 = active_edit_tags.indexOf(tag.TAG.substr(0,2));
        if (activ2 >= 0) {
          active_edit_tags_id[activ2] = tag.ID;
          console.log(tag.TAG + ' + ' + tag.ID)
        }

      } else {
        activ2 = active_edit_tags.indexOf(tag.TAG.substr(0,2));
        activ3 = active_edit_tags.indexOf(tag.TAG.substr(0,3))
        if (activ2 >= 0) {
          active_edit_tags_id[activ2] = tag.ID;
          console.log(tag.TAG + ' + ' + tag.ID)
        } else if (activ3 >= 0) { //RGB
          active_edit_tags_id[activ3] = tag.ID;
        }
      }
    }
    shtml+=`</table>`;
  }
  else {
    shtml="Cannot fetch the node's tags";
  }
  //console.log(shtml);
  // ganti element
  document.getElementById(E_TAGS).innerHTML = shtml;
  await viewUpdateEditTags();
}

async function viewUpdateEditTags() {
  active_edit_tags_id.forEach(async function (tag, i) {
    rdata2 = await getData(tag, 1);
    // console.log('type : ' + typeof(rdata2[0]));
    if (typeof(rdata2[0]) != 'undefined'){
      // console.log(active_edit_tags[i]);
      viewUpdateTag(active_edit_tags[i], rdata2[0].VALUE);
    }
  })
}

function viewUpdateTag(tag, value){
  e=document.getElementById(tag);
  if (e) {
    e.innerHTML = value;
    //console.log("Update "+tag+"="+value.toString());
  }
}

async function viewChart() {
  config.options.title.text = active_node;
  config.data.datasets[0].label = active_tag;
  config.data.datasets[0].data = [];

  rdata = await getData(active_tag_id, 10);
  console.log("DATA = "+JSON.stringify(rdata));
  if (rdata != null) {
    for (i=0; i<rdata.length; i++) {
      //console.log(JSON.stringify(data[i]));
      config.data.datasets[0].data.push(rdata[i].VALUE).toFixed(2);
    }
    chart.update();
  }
}

// Update chart
function viewUpdateChart(value) {
  if (config.data.datasets[0].data.length > 10) {
    config.data.datasets[0].data.shift();
  }
  config.data.datasets[0].data.push(value).toFixed(2);
  chart.update();
}

var ctx = document.getElementById(E_CHART).getContext('2d');
var chart = new Chart(ctx, config);

viewNodes();
