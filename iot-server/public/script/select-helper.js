function changeCol(i) {
    if (document.getElementById('COL' + i).checked) {
        for (var j = 0; j < 4; j++) {
            document.getElementById('NODE' + ((4 * (i - 1) + 1) + j)).checked = true;
            // $('#NODE'+).checked = true;
        }
    } else {
        for (var j = 0; j < 4; j++) {
            document.getElementById('NODE' + ((4 * (i - 1) + 1) + j)).checked = false;
            // $('#NODE'+).checked = true;
        }
    }

}

function changeRow(i) {
    if (document.getElementById('ROW' + i).checked) {
        for (var j = 0; j < 4; j++) {
            document.getElementById('NODE' + (i + 4 * j)).checked = true;
            // $('#NODE'+).checked = true;
        }
    } else {
        for (var j = 0; j < 4; j++) {
            document.getElementById('NODE' + (i + 4 * j)).checked = false;
            // $('#NODE'+).checked = true;
        }
    }

}

function selectAll() {
    for (var i = 1; i <= 16; i++) {
        document.getElementById('NODE' + (i)).checked = true;
    }
    for (var i = 1; i <= 4; i++) {
        document.getElementById('ROW' + i).checked = true;
        document.getElementById('COL' + i).checked = true;
    }
}

function deselectAll() {
    for (var i = 1; i <= 16; i++) {
        document.getElementById('NODE' + (i)).checked = false;
    }
    for (var i = 1; i <= 4; i++) {
        document.getElementById('ROW' + i).checked = false;
        document.getElementById('COL' + i).checked = false;
    }
}

//  -------------------------------------------

var RGBChange = function() {
    $('#RGB').css('background', 'rgb(' + r.getValue() + ',' + g.getValue() + ',' + b.getValue() + ')')
};

var r = new Slider("#R", {});
r.on('slide', RGBChange);
var g = new Slider("#G", {});
g.on('slide', RGBChange);
var b = new Slider("#B", {});
b.on('slide', RGBChange);

var ys_s = new Slider("#sdr_ys", {});

var cc_s = document.getElementById("CC");

//  --------------------------------------
function saveConfig() {
    for (var i = 1; i <= 16; i++) {
        if (document.getElementById('NODE' + i).checked) {
            if (i > 9) {
                prefix = '';
            } else {
                prefix = '0';
            }
            // console.log(SYS_TOPIC + 'NODE' + prefix + i + '/CC/' + prefix + i + '1');
            client.publish(SYS_TOPIC + 'NODE' + prefix + i + '/CC/' + prefix + i + '1', cc_s.value.toString(), {
                retain: true
            });
            client.publish(SYS_TOPIC + 'NODE' + prefix + i + '/YS/' + prefix + i + '1', ys_s.getValue().toString(), {
                retain: true
            });
            client.publish(SYS_TOPIC + 'NODE' + prefix + i + '/DVR/' + prefix + i + '1', r.getValue().toString(), {
                retain: true
            });
            client.publish(SYS_TOPIC + 'NODE' + prefix + i + '/DVG/' + prefix + i + '1', g.getValue().toString(), {
                retain: true
            });
            client.publish(SYS_TOPIC + 'NODE' + prefix + i + '/DVB/' + prefix + i + '1', b.getValue().toString(), {
                retain: true
            });
        }
    }
    alert('Config Saved');
}

// --------------------- ATRAKSI
function ledON(node,r,g,b){
  if (node > 9) {
      prefix = '';
  } else {
      prefix = '0';
  }
  // console.log(SYS_TOPIC + 'NODE' + prefix + i + '/CC/' + prefix + i + '1');
  client.publish(SYS_TOPIC + 'NODE' + prefix + node + '/DVR/' + prefix + node + '1', r.toString(), {
      retain: true
  });
  client.publish(SYS_TOPIC + 'NODE' + prefix + node + '/DVG/' + prefix + node + '1', g.toString(), {
      retain: true
  });
  client.publish(SYS_TOPIC + 'NODE' + prefix + node + '/DVB/' + prefix + node + '1', b.toString(), {
      retain: true
  });
}

function ledOFF(node){
    ledON(node,0,0,0);
}

function atraksi(i,time){
  setTimeout(function(){
    ledON(i, Math.floor(Math.random()*256), Math.floor(Math.random()*256), Math.floor(Math.random()*256));
    console.log(i+"Nyala");
  }, time * (i-1));

    setTimeout(function(){
      ledOFF(i);
      console.log(i+"Mati");
    }, time * i);
  }

function initAtraksi(){
  // document.getElementById('atraksi').disabled = true;
  for(let i=1; i<=16; i++){
    atraksi(i,1000);
  }
  // document.getElementById('atraksi').disabled = false;
}

function atraksi2(i,time){
  setTimeout(function(){
    for (let j= (i-1)*4 + 1; j <= (i-1)*4+4; j++) {
      ledON(j, Math.floor(Math.random()*256), Math.floor(Math.random()*256), Math.floor(Math.random()*256));
      // console.log(j);
    }
    console.log(i+"Nyala");
  }, time * (i-1));

    setTimeout(function(){
      for (let j= (i-1)*4 + 1; j <= (i-1)*4+4; j++) {
        ledOFF(j);
        // console.log(j);
      }
      console.log(i+"Mati");
    }, time * i);
  }

function initAtraksi2(){
  // document.getElementById('atraksi').disabled = true;
  for(let i=1; i<=4; i++){
    atraksi2(i,1000);
  }
  // document.getElementById('atraksi').disabled = false;
}
