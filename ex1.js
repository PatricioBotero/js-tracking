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
    
    fill : function () {
        EX1.ctx.fillStyle = "rgb(150,0,0)";
        EX1.ctx.fillRect(this.x, this.y, this.w, this.h);
    },
    
    move : function (dt, updateMatrix, stdPos, stdSpeed) {
        // update position and speed according to the motion model
        var xUpdate = EX1.multiplyMatrices(updateMatrix, [this.x, this.y, this.dx, this.dy]);
        this.x = xUpdate[0] + stdPos * (Math.random()*2-1);
        this.y = xUpdate[1] + stdPos * (Math.random()*2-1);
        this.dx = xUpdate[2] + stdSpeed * (Math.random()*2-1);
        this.dy = xUpdate[3] + stdSpeed * (Math.random()*2-1);
    
        // compute the likelihood from the distance to the true position
        this.weight = Math.exp(-EX1.norm2([this.x, this.y], [EX1.mouse.x, EX1.mouse.y]));
    
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
    var interval, dt, i, frames, finterval,
        drawRegions = true;      
    return {
        start : function (t) {
            dt = t;
            if (!interval) {
                // start simulation interval
                interval = setInterval(this.simulate, dt);
                // start fps interval. this calculates the current frame rate and sets the counter
                // to zero
                finterval = setInterval(function () {
                    document.getElementById("ex1-fps").innerHTML = frames * 4;
                    frames = 0; 
                }, 250);
            }
        },
        
        stop : function () { clearInterval(interval); clearInterval(finterval); },
        
        toggleRegions : function () { drawRegions = !drawRegions; },
        
        simulate : function () {
            var n = EX1.elements.length;       
            // clear the canvas
            EX1.ctx.clearRect(0, 0, EX1.width, EX1.height);           
            // draw the target object
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
                        resampledParticles[p].x = EX1.elements[i].x;
                        resampledParticles[p].y = EX1.elements[i].y;
                        // reset weights
                        // resampledParticles[p].dx = 0;
                        // resampledParticles[p].dy = 0;
                    }
                }
            }
            EX1.elements = resampledParticles;
                
            // print to text field
            document.getElementById("ex1-mean").value = sum/EX1.numberOfElements;
                
            frames++;
        }
    }; 
}());

EX1.init = function (numberOfElements) {
    var canvas;
    // init canvas or display error message
    if (!(canvas = document.getElementById("ex1-canv"))) {
        document.getElementsByTagName("body")[0].innerHTML = "Canvas Error";
    }
    // init canvas context and save canvas properties for further use
    EX1.numberOfElements = numberOfElements;
    EX1.ctx = canvas.getContext("2d");
    EX1.height = canvas.height;
    EX1.width = canvas.width;
    EX1.canvas = canvas;
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
    EX1.stdPos = 0.1;
    EX1.stdSpeed = 0.3;
    
    EX1.updateParameters();
    EX1.refreshElements();
    
    // track mouse position
    EX1.canvas.addEventListener('mousemove', function(evt) {
        var rect = canvas.getBoundingClientRect();
        EX1.mouse.x = evt.clientX - rect.left,
        EX1.mouse.y = evt.clientY - rect.top
        }, false);
    
    // start simulation
    EX1.simulation.start(16);
};

EX1.refreshElements = function () {
    // init the array that holds the objects
    EX1.elements = [];
    // fill the array with fresh objects
    for (i = 0; i < EX1.numberOfElements; i++) {
        EX1.elements.push(Object.create(EX1.particle, {        
            // set a random position
            x : {value: Math.random() * (EX1.width - EX1.bbsize), writable: true, enumerable: true, configurable: false }, 
            y : {value: Math.random() * (EX1.height - EX1.bbsize), writable: true, enumerable: true, configurable: false },
            // set random speed
            dx : {value: 0, writable: true, enumerable: true, configurable: false }, 
            dy : {value: 0, writable: true, enumerable: true, configurable: false },
            // weights
            weight : {value: 0, writable: true, enumerable: true, configurable: false}
            // size of bounding box
            // h : {value: EX1.bbsize, writable: true, enumerable: true, configurable: false},
            // w : {value: EX1.bbsize, writable: true, enumerable: true, configurable: false},
        }));
    }
    
    EX1.mouse = Object.create(EX1.target, {
        // the position of the target is in this case the mouse position
            x : {value: EX1.width/2, writable: true, enumerable: true, configurable: false }, 
            y : {value: EX1.height/2, writable: true, enumerable: true, configurable: false },
    });
};

// copied from stackoverflow --> test it!
EX1.multiplyMatrices = function(m1,m2) {
    var result = [];
    for(var j = 0; j < m1.length; j++) {    // 4x
        result[j] = []; // the result is of size m1x1
        var sum = 0;
        for(var k = 0; k < m1[0].length; k++) {     // 4x
            sum += m1[j][k] * m2[k];
            
        }
        result[j] = sum;
    }
    return result;
};

// test this!
EX1.norm2 = function(v1,v2) {
    var result = 0;
    for (var i = 0; i< v1.length; i++) {
        result += Math.pow(v1[i]-v2[i],2);
    }
    return Math.sqrt(result);
};

EX1.updateParameters = function () {
    EX1.bbsize = document.getElementById("ex1-boundingbox").value;
    EX1.canvas.width = EX1.canvas.width;
    EX1.refreshElements();
};

EX1.test = function () {
    EX1.mouse = Object.create(EX1.target, {
        // the position of the target is in this case the mouse position
            x : {value: 800, writable: true, enumerable: true, configurable: false }, 
            y : {value: 500, writable: true, enumerable: true, configurable: false },
    });
    
    alert("x: " + EX1.mouse.x + " -- y: " + EX1.mouse.y);
    
    var updateMatrix = [
        [1, 0, 1, 0],
        [0, 1, 0, 1],
        [0, 0, 1, 0],
        [0, 0, 0, 1] ];
    
    var particle = Object.create(EX1.particle,{        
            // set a random position
            x : {value: 100, writable: true, enumerable: true, configurable: false }, 
            y : {value: 100, writable: true, enumerable: true, configurable: false },
            // set random speed
            dx : {value: 4, writable: true, enumerable: true, configurable: false }, 
            dy : {value: 3, writable: true, enumerable: true, configurable: false },
            // weights
            weight : {value: 0, writable: true, enumerable: true, configurable: false}
            // size of bounding box
            // h : {value: EX1.bbsize, writable: true, enumerable: true, configurable: false},
            // w : {value: EX1.bbsize, writable: true, enumerable: true, configurable: false},
        });
    
    alert("x: " + particle.x + " -- y: " + particle.y + "\n" +
          "dx: " + particle.dx + " -- dy: " + particle.dy);
        
    particle.move(1,updateMatrix, 1, 1.5);
    alert("x: " + particle.x + " -- y: " + particle.y + "\n" +
          "dx: " + particle.dx + " -- dy: " + particle.dy);
};

// init the application
EX1.init(250);
// EX1.test();