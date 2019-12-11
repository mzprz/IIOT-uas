var RGBChange = function() {
    $('#RGB').css('background', 'rgb(' + r.getValue() + ',' + g.getValue() + ',' + b.getValue() + ')')
};

function RGBSend(color) {
    if (active_node_id > 9) {
        switch (color) {
            case 'r':
                client.publish(SYS_TOPIC + active_node + '/DVR/' + active_node_id + '1', r.getValue().toString(), {
                    retain: true
                });
                break;
            case 'g':
                client.publish(SYS_TOPIC + active_node + '/DVG/' + active_node_id + '1', g.getValue().toString(), {
                    retain: true
                });
                break;
            case 'b':
                client.publish(SYS_TOPIC + active_node + '/DVB/' + active_node_id + '1', b.getValue().toString(), {
                    retain: true
                });
                break;
        }
    } else {
        switch (color) {
            case 'r':
                client.publish(SYS_TOPIC + active_node + '/DVR/0' + active_node_id + '1', r.getValue().toString(), {
                    retain: true
                });
                break;
            case 'g':
                client.publish(SYS_TOPIC + active_node + '/DVG/0' + active_node_id + '1', g.getValue().toString(), {
                    retain: true
                });
                break;
            case 'b':
                client.publish(SYS_TOPIC + active_node + '/DVB/0' + active_node_id + '1', b.getValue().toString(), {
                    retain: true
                });
                break;
        }
    }
};

var RGBSendr = function() {
    RGBSend('r')
};
var RGBSendg = function() {
    RGBSend('g')
};
var RGBSendb = function() {
    RGBSend('b')
};

var r = new Slider("#R", {}).on('slideStop', RGBSendr);
r.on('slide', RGBChange);
var g = new Slider("#G", {}).on('slideStop', RGBSendg);
g.on('slide', RGBChange);
var b = new Slider("#B", {}).on('slideStop', RGBSendb);
b.on('slide', RGBChange);

var YSSend = function() {
    if (active_node_id > 9) {
        client.publish(SYS_TOPIC + active_node + '/YS/' + active_node_id + '1', ys_s.getValue().toString(), {
            retain: true
        });
    } else {
        client.publish(SYS_TOPIC + active_node + '/YS/0' + active_node_id + '1', ys_s.getValue().toString(), {
            retain: true
        });
    }
    console.log("YS Updated");
}

var ys_s = new Slider("#sdr_ys", {}).on('change', YSSend);

var cc_s = document.getElementById("CC");

function CCSend() {
  if (active_node_id > 9) {
      client.publish(SYS_TOPIC + active_node + '/CC/' + active_node_id + '1', cc_s.value.toString(), {
          retain: true
      });
  } else {
      client.publish(SYS_TOPIC + active_node + '/CC/0' + active_node_id + '1', cc_s.value.toString(), {
          retain: true
      });
  }
  console.log("CC Updated");
}

async function initRGB() {
    for (i = 0; i < 2; i++) {
        var rdata3 = await getData(active_edit_tags_id[i], 1);
        if (typeof(rdata3[0]) != 'undefined') {
          // console.log(active_edit_tags[i])
            if (i == 0) {
                document.getElementById(active_edit_tags[i]).value = rdata3[0].VALUE;
            } else {
                ys_s.setValue(rdata3[0].VALUE, triggerChangeEvent = true);
            }
        } else {
            if (i == 0) {
                document.getElementById(active_edit_tags[i]).value = 0;
            } else {
                ys_s.setValue(0, triggerChangeEvent = true);
            }
        }
    }
    for (i = 2; i < 5; i++) {
        var rdata3 = await getData(active_edit_tags_id[i], 1);
        if (typeof(rdata3[0]) != 'undefined') {
            // console.log(active_edit_tags[i]);
            switch (active_edit_tags[i]) {
                case 'DVR':
                    r.setValue(rdata3[0].VALUE, triggerSlideEvent = true);
                    break;
                case 'DVG':
                    g.setValue(rdata3[0].VALUE, triggerSlideEvent = true);
                    break;
                case 'DVB':
                    b.setValue(rdata3[0].VALUE, triggerSlideEvent = true);
                    break;
            }
        } else {
            switch (active_edit_tags[i]) {
                case 'DVR':
                    r.setValue(0, triggerSlideEvent = true);
                    break;
                case 'DVG':
                    g.setValue(0, triggerSlideEvent = true);
                    break;
                case 'DVB':
                    b.setValue(0, triggerSlideEvent = true);
                    break;
            }
        }
    }
}
// ---------------------------------------------------
