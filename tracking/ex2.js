// global var for EX2
var EX2 = {};

// image
var imgmouse = new Image();
imgmouse.src = 'mouse.jpg';
var imgnoise = new Image();
imgnoise.src = 'noise.jpg';
imsize = 60;

// bbdist
var bbsize = 15;

EX2.target = {
    draw : function () {
		EX2.ctx.drawImage(imgmouse, this.x-imsize/2, this.y-imsize/2);
    },
	
	hist : function () {
		// compute refHist
		
	}
};

EX2.background = {
	draw : function () {
		var pattern = EX2.ctx.createPattern(imgnoise, 'repeat');
		EX2.ctx.rect(0,0,EX2.canvas.width, EX2.canvas.width);
		EX2.ctx.fillStyle = pattern;
		EX2.ctx.fill();
	}
};

EX2.particle = {
    draw : function () {
        EX2.ctx.strokeStyle = "rgb(255,255,255)";
        EX2.ctx.beginPath();
        EX2.ctx.rect(this.x, this.y, 2, 2);
        EX2.ctx.closePath();
        EX2.ctx.stroke();
    },
    
    move : function (dt, updateMatrix, stdPos, stdSpeed) {
        // update position and speed according to the motion model
        var xUpdate = MU.multiplyMatrices(updateMatrix, [this.x, this.y, this.dx, this.dy]);
        this.x = xUpdate[0] + stdPos * ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) * Math.sqrt(2);
        this.y = xUpdate[1] + stdPos * ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) * Math.sqrt(2);
        this.dx = xUpdate[2] + stdSpeed * ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) * Math.sqrt(2);
        this.dy = xUpdate[3] + stdSpeed * ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) * Math.sqrt(2);
    },
	
	updateWeight : function () {
		// evaluate hist at current pos
		var hist = MU.hist(EX2.ctx, [this.x, this.y], bbsize);
		// compute likelihood
		var likelihood = Math.exp(-MU.norm2([this.x, this.y], [EX2.mouse.x, EX2.mouse.y]));
		// var likelihood = 0;
		// for (h=0;h<hist.length;h++) {
		// 	for (hr=0;hr<refHist.length;hr++) {
		// 		likelihood += Math.sqrt(hist[h]*refHist[hr]);
		// 	}
		// }
		// update weight
		this.weight = likelihood;
	}
};

EX2.simulation = (function () {
    var interval, dt, i, finterval;
    return {
        start : function (t) {
            dt = t;
            if (!interval) {
                // start simulation interval
                interval = setInterval(this.simulate, dt);
                // start fps interval
                finterval = setInterval(function () {
                    document.getElementById("fps").innerHTML = frames * 4;
                    frames = 0; 
                }, 250);
            }
        },
        
        stop : function () { clearInterval(interval); clearInterval(finterval); },
        
        simulate : function () {
            var n = EX2.elements.length;
            EX2.ctx.clearRect(0, 0, EX2.width, EX2.height);
			EX2.background.draw();
            EX2.mouse.draw();
            // draw and move the elements
            for (i = 0; i < n; i++) { 
                EX2.elements[i].draw();
                EX2.elements[i].move(dt, EX2.updateMatrix, EX2.stdPos, EX2.stdSpeed);
				EX2.elements[i].updateWeight();
            }
            
            // resampling
            // normalize weights
            var sum = 0;
            var weights = [];
            for (i = 0; i < EX2.elements.length; i++) {
                weights.push(EX2.elements[i].weight);
                sum += EX2.elements[i].weight;
            }
            for (i = 0; i < weights.length; i++) {
                weights[i] = weights[i] / sum;
            }
            // cumsum (copied from stackoverflow)
            var cumsum = weights.concat();
            for (var i = 0; i < weights.length; i++){
                cumsum[i] = weights.slice(0, i + 1).reduce(function(p, i){ return p + i; });
            }
            // choose for every particle a random number
            var resampledParticles = EX2.elements.concat();
            for (var p = 0; p < EX2.elements.length; p++) {
                var rand = Math.random();
                for (var i = 0; i < cumsum.length; i++) {
                    if (rand >= cumsum[i]) {
                        resampledParticles[p].x = EX2.elements[i+1].x;
                        resampledParticles[p].y = EX2.elements[i+1].y;
                        resampledParticles[p].dx = EX2.elements[i+1].dx;
                        resampledParticles[p].dy = EX2.elements[i+1].dy;
                    }
                }
            }
            EX2.elements = resampledParticles;
                
            // print to text field
            document.getElementById("mean").innerHTML = sum/EX2.numberOfElements*1000;
                
            frames++;
        }
    }; 
}());

EX2.init = function () {
    // init globals
    EX2.canvas = $('#canv')[0];
    EX2.ctx = EX2.canvas.getContext('2d');
    EX2.height = EX2.canvas.height;
    EX2.width = EX2.canvas.width;
    EX2.mouse = Object.create(EX2.target, {
        // the position of the target is in this case the mouse position
        x : {value: EX2.width/2, writable: true, enumerable: true, configurable: false }, 
        y : {value: EX2.height/2, writable: true, enumerable: true, configurable: false },
    });
    
    EX2.updateMatrix = [
        [1, 0, 1, 0],
        [0, 1, 0, 1],
        [0, 0, 1, 0],
        [0, 0, 0, 1] ];
    
    EX2.updateParameters();
    EX2.refreshElements();
    
    // track mouse position
    EX2.canvas.addEventListener('mousemove', function(evt) {
        var rect = EX2.canvas.getBoundingClientRect();
        EX2.mouse.x = evt.clientX - rect.left,
        EX2.mouse.y = evt.clientY - rect.top
        }, false);
    
    
    
    // start simulation and pass dt in ms
    EX2.simulation.start(16);
};

EX2.refreshElements = function () {
    // init the array that holds the objects
    EX2.elements = [];
    // fill the array with fresh objects
    for (i = 0; i < EX2.numberOfElements; i++) {
        EX2.elements.push(Object.create(EX2.particle, {        
            // set a random position
            x : {value: Math.random() * EX2.width, writable: true, enumerable: true, configurable: false }, 
            y : {value: Math.random() * EX2.height, writable: true, enumerable: true, configurable: false },
            // set random speed
            dx : {value: 0, writable: true, enumerable: true, configurable: false }, 
            dy : {value: 0, writable: true, enumerable: true, configurable: false },
            // weights
            weight : {value: 0, writable: true, enumerable: true, configurable: false}
        }));
    }
    
    EX2.mouse = Object.create(EX2.target, {
        // the position of the target is in this case the mouse position
            x : {value: EX2.width/2, writable: true, enumerable: true, configurable: false }, 
            y : {value: EX2.height/2, writable: true, enumerable: true, configurable: false },
    });
};


EX2.updateParameters = function () {
    EX2.numberOfElements = $( '#nparticles' ).val();
    EX2.stdPos = $('#stdpos').val();
    EX2.stdSpeed = $('#stdvel').val();
    EX2.canvas.width = EX2.canvas.width;
    EX2.refreshElements();
};

// init the application


// jquery stuff



$(document).ready(function(){
    
    // nparticles
    $( function () {
        $( "#nparticles-slider" ).slider({
            range: "min",
            value: $('#nparticles').val(),
            min: 1,
            max: 500,
            slide: function( event, ui ) {
                $( "#nparticles" ).val( ui.value );
                EX2.updateParameters();
            }
        });
        $( "#nparticles" ).val( $( "#nparticles-slider" ).slider( "value" ) );
    });
    // stdpos
    $( function () {
        $( "#stdpos-slider" ).slider({
            range: "min",
            value: $('#stdpos').val(),
            min: 0,
            max: 50,
            slide: function( event, ui ) {
                $( "#stdpos" ).val( ui.value );
                EX2.updateParameters();
            }
        });
        $( "#stdpos" ).val( $( "#stdpos-slider" ).slider( "value" ) );
    });
    // stdvel
    $( function () {
        $( "#stdvel-slider" ).slider({
            range: "min",
            value: $('#stdvel').val(),
            min: 0,
            max: 50,
            slide: function( event, ui ) {
                $( "#stdvel" ).val( ui.value );
                EX2.updateParameters();
            }
        });
        $( "#stdvel" ).val( $( "#stdvel-slider" ).slider( "value" ) );
    });
    
    EX2.init();
});