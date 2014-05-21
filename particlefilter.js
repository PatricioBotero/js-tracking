PF = {};

PF.target = {
    // define the draw function seperately
    draw : function () {
        PF.ctx.strokeStyle = "rgb(150,0,0)";
        PF.ctx.beginPath();
        PF.ctx.arc(this.x,this.y,10,0,2*Math.PI); // from 0 .. 2pi -> full circle
        PF.ctx.closePath();
        PF.ctx.stroke();
    }
};

PF.particle = {
    move : function (dt, updateMatrix, stdPos, stdSpeed) {
        // update position and speed according to the motion model
        var xUpdate = PF.multiplyMatrices(updateMatrix, [this.x, this.y, this.dx, this.dy]);
        this.x = xUpdate[0] + stdPos * (Math.random()*2-1);
        this.y = xUpdate[1] + stdPos * (Math.random()*2-1);
        this.dx = xUpdate[2] + stdSpeed * (Math.random()*2-1);
        this.dy = xUpdate[3] + stdSpeed * (Math.random()*2-1);
    
        // compute the likelihood from the distance to the true position
        this.weight = Math.exp(-PF.norm2([this.x, this.y], [PF.mouse.x, PF.mouse.y]));
    
        // rebouncing from walls --> does this make sense?
        //if (this.x < 0 || this.x > PF.width) {
        //    this.dx *= -1;
        //}
        //if (this.y < 0 || this.y > PF.height) {
        //    this.dy *= -1;
        //}
    }
    
    // define the draw function seperately
    draw : function () {
        PF.ctx.strokeStyle = "rgb(0,0,0)";
        PF.ctx.beginPath();
        PF.ctx.rect(this.x, this.y, 2, 2);
        PF.ctx.closePath();
        PF.ctx.stroke();
    },
    
    fill : function () {
        PF.ctx.fillStyle = "rgb(150,0,0)";
        PF.ctx.fillRect(this.x, this.y, this.w, this.h);
    },
};

PF.updateParticles = function () {

};

PF.computeLikelihood = function () {

};

PF.resample = function () {

};



