var histogram = {};
var colorhistogram = {};

$(document).ready(function(){
});

function drawhist(canvasname) {
  var ctx = $(canvasname)[0].getContext("2d");
  ctx.fillStyle = "rgb(0,0,0);";

  var max = Math.max.apply(null, histogram.values);

  jQuery.each(histogram.values, function(i,x) {
    var pct = (histogram.values[i] / max) * 100;
    ctx.fillRect(i, 100, 1, -Math.round(pct));
  });
}

function drawcolorhist() {
  var ctx = $("#colorhistcanvas")[0].getContext("2d");
  var rmax = Math.max.apply(null, colorhistogram.rvals);
  var bmax = Math.max.apply(null, colorhistogram.bvals);
  var gmax = Math.max.apply(null, colorhistogram.gvals);

  function colorbars(max, vals, color, y) {
    ctx.fillStyle = color;
    jQuery.each(vals, function(i,x) {
      var pct = (vals[i] / max) * 100;
      ctx.fillRect(i, y, 1, -Math.round(pct));
    });
  }

  colorbars(rmax, colorhistogram.rvals, "rgb(255,0,0)", 100);
  colorbars(gmax, colorhistogram.gvals, "rgb(0,255,0)", 200);
  colorbars(bmax, colorhistogram.bvals, "rgb(0,0,255)", 300);
}

function hist() {
  $('#testimg2').pixastic("histogram",
		{average:false,paint:false,color:"rgb(255,0,0)",returnValue:histogram});
  drawhist("#perhistcanvas");
  $('#testimg2').pixastic("histogram",
        {average:true,paint:false,color:"rgb(255,0,0)",returnValue:histogram});
  drawhist("#avghistcanvas");
}

function colorhist() {
  $('#testimg').pixastic("colorhistogram",
		{color:"rgb(255,0,0)",returnValue:colorhistogram});
  drawcolorhist();
}

MU.colorhistogram = {
  each_pixel : function(data, w, h, visitor) {
    var w4 = w*4;
    var y = h;
    do {
      var offsetY = (y-1)*w4;
      var x = w;
      do {
        var offset = offsetY + (x*4-4);
        visitor(data[offset], data[offset+1], data[offset+2], data[offset+3]);
      } while (--x);
    } while (--y);
  },

  array256 : function(default_value) {
    arr = [];
    for (var i=0; i<256; i++) { arr[i] = default_value; }
    return arr
  },

  process : function(params) {
    var values = [];
    if (typeof params.options.returnValue != "object") {
      params.options.returnValue = {rvals:[], gvals:[], bvals:[]};
    }
    var returnValue = params.options.returnValue;
    if (typeof returnValue.values != "array") {
      returnValue.rvals = [];
      returnValue.gvals = [];
      returnValue.bvals = [];
    }

    if (Pixastic.Client.hasCanvasImageData()) {
      var data = Pixastic.prepareData(params);
      params.useData = false;

      var rvals = this.array256(0);
      var gvals = this.array256(0);
      var bvals = this.array256(0);

      var rect = params.options.rect;
      this.each_pixel(data, rect.width, rect.height, function(r, g, b, _) {
        rvals[r]++;
        gvals[g]++;
        bvals[b]++;
      });

      returnValue.rvals = rvals;
      returnValue.gvals = gvals;
      returnValue.bvals = bvals;

      return true;
    }
  }
}