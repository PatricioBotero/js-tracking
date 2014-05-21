// global var for EX1
var EX1 = {};

EX1.target = {
    draw : function () {
        EX1.ctx.strokeStyle = "rgb(150,0,0)";
        EX1.ctx.beginPath();
        EX1.ctx.arc(this.x,this.y,10,0,2*Math.PI); // from 0 .. 2pi -> full circle
        EX1.ctx.closePath();
        EX1.ctx.stroke();
    }
};

EX1.particle = {
    draw : function () {
        EX1.ctx.strokeStyle = "rgb(0,0,0)";
        EX1.ctx.beginPath();
        EX1.ctx.rect(this.x, this.y, 2, 2);
        EX1.ctx.closePath();
        EX1.ctx.stroke();
    },
    
    move : function (dt, updateMatrix, stdPos, stdSpeed) {
        // update position and speed according to the motion model
        var xUpdate = MU.multiplyMatrices(updateMatrix, [this.x, this.y, this.dx, this.dy]);
        this.x = xUpdate[0] + stdPos * ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) * Math.sqrt(2);
        this.y = xUpdate[1] + stdPos * ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) * Math.sqrt(2);
        this.dx = xUpdate[2] + stdSpeed * ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) * Math.sqrt(2);
        this.dy = xUpdate[3] + stdSpeed * ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) * Math.sqrt(2);
    
        // compute the likelihood from the distance to the true position
        this.weight = Math.exp(-MU.norm2([this.x, this.y], [EX1.mouse.x, EX1.mouse.y]));
    
        // rebouncing from walls --> does this make sense?
        //if (this.x < 0 || this.x > EX1.width) {
        //    this.dx *= -1;
        //}
        //if (this.y < 0 || this.y > EX1.height) {
        //    this.dy *= -1;
        //}
        
    }
};

EX1.simulation = (function () {
    var interval, dt, i, finterval;
    return {
        start : function (t) {
            dt = t;
            if (!interval) {
                // start simulation interval
                interval = setInterval(this.simulate, dt);
                // start fps interval
                finterval = setInterval(function () {
                    document.getElementById("ex1-fps").innerHTML = frames * 4;
                    frames = 0; 
                }, 250);
            }
        },
        
        stop : function () { clearInterval(interval); clearInterval(finterval); },
        
        simulate : function () {
            var n = EX1.elements.length;
            EX1.ctx.clearRect(0, 0, EX1.width, EX1.height);
            EX1.mouse.draw();
            // draw and move the elements
            for (i = 0; i < n; i++) { 
                EX1.elements[i].draw();
                EX1.elements[i].move(dt, EX1.updateMatrix, EX1.stdPos, EX1.stdSpeed);
            }
            
            // resampling
            // normalize weights
            var sum = 0;
            var weights = [];
            for (i = 0; i < EX1.elements.length; i++) {
                weights.push(EX1.elements[i].weight);
                sum += EX1.elements[i].weight;
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
            var resampledParticles = EX1.elements.concat();
            for (var p = 0; p < EX1.elements.length; p++) {
                var rand = Math.random();
                for (var i = 0; i < cumsum.length; i++) {
                    if (rand >= cumsum[i]) {
                        resampledParticles[p].x = EX1.elements[i+1].x;
                        resampledParticles[p].y = EX1.elements[i+1].y;
                        resampledParticles[p].dx = EX1.elements[i+1].dx;
                        resampledParticles[p].dy = EX1.elements[i+1].dy;
                    }
                }
            }
            EX1.elements = resampledParticles;
                
            // print to text field
            document.getElementById("ex1-mean").innerHTML = sum/EX1.numberOfElements*1000;
                
            frames++;
        }
    }; 
}());

EX1.init = function () {
    // init globals
    EX1.canvas = $('#ex1-canv')[0];
    EX1.ctx = EX1.canvas.getContext('2d');
    EX1.height = EX1.canvas.height;
    EX1.width = EX1.canvas.width;
    EX1.mouse = Object.create(EX1.target, {
        // the position of the target is in this case the mouse position
        x : {value: EX1.width/2, writable: true, enumerable: true, configurable: false }, 
        y : {value: EX1.height/2, writable: true, enumerable: true, configurable: false },
    });
    
    EX1.updateMatrix = [
        [1, 0, 1, 0],
        [0, 1, 0, 1],
        [0, 0, 1, 0],
        [0, 0, 0, 1] ];
    
    EX1.updateParameters();
    EX1.refreshElements();
    
    // track mouse position
    EX1.canvas.addEventListener('mousemove', function(evt) {
        var rect = EX1.canvas.getBoundingClientRect();
        EX1.mouse.x = evt.clientX - rect.left,
        EX1.mouse.y = evt.clientY - rect.top
        }, false);
    
    
    
    // start simulation and pass dt in ms
    EX1.simulation.start(16);
};

EX1.refreshElements = function () {
    // init the array that holds the objects
    EX1.elements = [];
    // fill the array with fresh objects
    for (i = 0; i < EX1.numberOfElements; i++) {
        EX1.elements.push(Object.create(EX1.particle, {        
            // set a random position
            x : {value: Math.random() * EX1.width, writable: true, enumerable: true, configurable: false }, 
            y : {value: Math.random() * EX1.height, writable: true, enumerable: true, configurable: false },
            // set random speed
            dx : {value: 0, writable: true, enumerable: true, configurable: false }, 
            dy : {value: 0, writable: true, enumerable: true, configurable: false },
            // weights
            weight : {value: 0, writable: true, enumerable: true, configurable: false}
        }));
    }
    
    EX1.mouse = Object.create(EX1.target, {
        // the position of the target is in this case the mouse position
            x : {value: EX1.width/2, writable: true, enumerable: true, configurable: false }, 
            y : {value: EX1.height/2, writable: true, enumerable: true, configurable: false },
    });
};


EX1.updateParameters = function () {
    EX1.numberOfElements = $( '#nparticles' ).val();
    EX1.stdPos = $('#stdpos').val();
    EX1.stdSpeed = $('#stdvel').val();
    EX1.canvas.width = EX1.canvas.width;
    EX1.refreshElements();
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
                EX1.updateParameters();
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
                EX1.updateParameters();
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
                EX1.updateParameters();
            }
        });
        $( "#stdvel" ).val( $( "#stdvel-slider" ).slider( "value" ) );
    });
    
    EX1.init();
});