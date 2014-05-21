MU = {};

// copied from stackoverflow --> test it!
MU.multiplyMatrices = function(m1,m2) {
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
MU.norm2 = function(v1,v2) {
    var result = 0;
    for (var i = 0; i< v1.length; i++) {
        result += Math.pow(v1[i]-v2[i],2);
    }
    return Math.sqrt(result);
};