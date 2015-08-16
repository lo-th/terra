/**
 * @fileoverview workerGenerateTerrain.js - worker terrain generation functions
 * @author Xavier de Boysson
 */

"use strict";
self.onmessage = function (event){

    //importScripts("noise.js");
    importScripts("SimplexNoise.js");
    var message = event.data;

    var shadowsTextureView = new Uint8Array(message.shadowsTextureDataBuffer);
    var normalsTextureView = new Uint8Array(message.normalsTextureDataBuffer);

    var dataViewHM = new Float32Array(message.heightmapDataBuffer);
    var size = message.size;
    var sunHeight = message.sunHeight;
    var offset = message.offset;
    var sizeRatio = message.sizeRatio;
    offset.x /= sizeRatio;
    offset.z /= sizeRatio;

    var overlap = 64;
    var dataBuffer = new ArrayBuffer((size+overlap+1)*(size+overlap+1)*4);
    var dataView = new Float32Array(dataBuffer);


    var seed = new Uint8Array(message.seedBuffer);
    var noise = new SimplexNoise(seed);
    var dddd = message.dddd;

    //console.log(dddd);

    var i = dataView.length;
    while(i--) dataView[i] = 0;

    addPerlinNoise(3, (size+overlap)/2, dataView, size + overlap, noise, offset, dddd[0]);
    addPerlinNoise(6, (size+overlap)/8, dataView, size + overlap, noise, offset, dddd[1]);
    perturb(16, 16, dataView, size + overlap, noise, offset, dddd[2]);
    erode(10, 16*(size+overlap), dataView, size + overlap);


    addPerlinNoise(.4, (size+overlap)*3, dataView, size + overlap, noise, offset, dddd[3]);
    smoothen(dataView, size + overlap);

    var x,z;
    z = size + overlap + 1;
    while(z--){
        x = size + overlap + 1;
        while(x--){
            if (x>=overlap/2 && x<size+overlap/2+1 && z>=overlap/2 && z<size+overlap/2+1)
               dataViewHM[(x-overlap/2)+(z-overlap/2)*(size+1)] = dataView[(x)+(z)*(size+overlap+1)]*sizeRatio;
        }
    }



    var high = 0;
    var low = 999999;
    i = dataView.length;
    while(i--){
        if (dataViewHM[i] > high) high = dataViewHM[i];
        if (dataViewHM[i] < low) low = dataViewHM[i];
    }

    low = Math.abs(low);
    high = low + high;

    generateNormals(normalsTextureView, dataViewHM, size);
    //generateShadows(shadowsTextureView, dataViewHM, size, sunHeight, low, high);


    var dataBuffer = null;
    var dataView = null;

    var returnMessage = {
        id: message.id,
        low: low,
        high: high,
        heightmapDataBuffer: message.heightmapDataBuffer,
        shadowsTextureDataBuffer: message.shadowsTextureDataBuffer,
        normalsTextureDataBuffer: message.normalsTextureDataBuffer,
 //       seedBuffer: message.seedBuffer
    }

    self.postMessage(returnMessage, [returnMessage.heightmapDataBuffer, returnMessage.shadowsTextureDataBuffer, returnMessage.normalsTextureDataBuffer]);

};


var generateNormals = function(normalsTextureView, dataView, size){
    var z = size, x, a, b, c, d, nx, ny, nz, sx, sz, sy, sxz, l;
    while(z--){
        x = size;
        while(x--){
            a = dataView[x+1 + z*(size+1)];
            b = dataView[x-1 + z*(size+1)];
            c = dataView[x + (z+1)*(size+1)];
            d = dataView[x + (z-1)*(size+1)];

            sx = a - b;
            sz = c - d;

            sy = 1;
            sxz = 2;

            nx = -sx*sy;
            ny = 2*sxz;
            nz = sz*sy;

            l = 1/Math.sqrt(nx*nx + ny*ny + nz*nz);
            nx *= l;
            ny *= l;
            nz *= l;

            if (nz<0) nz = 0;
            if (nx<0) nx = 0;


            normalsTextureView[(x + z * size)*4] = (nx*255);
            normalsTextureView[(x + z * size)*4+1] = (ny*255);
            normalsTextureView[(x + z * size)*4+2] = (nz*255);
            normalsTextureView[(x + z * size)*4+3] = 255;d
        }
    }

    z = size;
    while(z--){
        normalsTextureView[(0 + z * size)*4+0] = normalsTextureView[(1 + z * size)*4+0];
        normalsTextureView[(0 + z * size)*4+1] = normalsTextureView[(1 + z * size)*4+1];
        normalsTextureView[(0 + z * size)*4+2] = normalsTextureView[(1 + z * size)*4+2];
        normalsTextureView[(0 + z * size)*4+3] = normalsTextureView[(1 + z * size)*4+3];
    }

    x = size;
    while(x--){
        normalsTextureView[(x + 0 * size)*4+0] = normalsTextureView[(x + 1 * size)*4+0];
        normalsTextureView[(x + 0 * size)*4+1] = normalsTextureView[(x + 1 * size)*4+1];
        normalsTextureView[(x + 0 * size)*4+2] = normalsTextureView[(x + 1 * size)*4+2];
        normalsTextureView[(x + 0 * size)*4+3] = normalsTextureView[(x + 1 * size)*4+3];
    }







    /*for (var z = 1; z < size - 1; ++z)
    {
        for (var x = 1; x < size - 1; ++x)
        {
            var totalR = 0.0;
            var totalG = 0.0;
            var totalB = 0.0;
            for (var v = -1; v <= 1; v++)
            {
                for (var u = -1; u <= 1; u++)
                {
                    totalR += normalsTextureView[(x + u + (z + v) * size)*4];
                    totalG += normalsTextureView[(x + u + (z + v) * size)*4+1];
                    totalB += normalsTextureView[(x + u + (z + v) * size)*4+2];
                }
            }

            normalsTextureView[(x + z * size)*4] = totalR / 9.0;
            normalsTextureView[(x + z * size)*4+1] = totalG / 9.0;
            normalsTextureView[(x + z * size)*4+2] = totalB / 9.0;
        }
    }*/


};


var generateShadows = function(shadowsTextureView, dataView, size, sunHeight, low, high){
    var currHeight, shadow, x, z, maxHeight = 0;
    z = size + 1;
    while(z--){
        maxHeight = 0;
        x = size;
        while(x--){
            currHeight = ((low + dataView[x+z*(size+1)])/high)*255;

            if (currHeight > maxHeight){
                shadow = 0;
                maxHeight = currHeight;
            }else{
                shadow = (255 - currHeight)*.8;
            }
            shadowsTextureView[((x<size?x:x-1) + (z<size?z:z-1) * size)*4] = 255 - shadow;
            maxHeight -= sunHeight;
        }
    }


    for (var z = 2; z < size - 2; ++z){
        for (var x = 2; x < size - 2; ++x){
            var total = 0.0;
            for (var v = -2; v <= 2; v++){
                for (var u = -2; u <= 2; u++){
                    total += shadowsTextureView[(x + u + (z + v) * size)*4];
                }
            }

            shadowsTextureView[(x + z * size)*4] = total / 25.0;
        }
    }

};



var addPerlinNoise = function(f, d, dataView, size, noise, offset, dddd){
    var x,z;
    z = size + 1;
    while(z--){
        x = size + 1;
        while(x--){
            dataView[x+z*(size+1)] += noise.noise4d(f*(x+offset.x)/size, f*(z+offset.z)/size, 0, dddd || 0.5)*d;
        }
    }
}


var perturb = function (f, d, dataView, size, noise, offset, dddd){
    var u, v, x, z;
    var tempBuffer = new ArrayBuffer((size+1)*(size+1)*4);
    var tempView = new Float32Array(tempBuffer);

    z = size + 1;
    while(z--){
        x = size + 1;
        while(x--){
            u = x + (noise.noise4d(f*(x+offset.x)/size, f*(z+offset.z)/size, 0, dddd || 0.5)*d)|0;
            v = z + (noise.noise4d(f*(x+offset.x)/size, f*(z+offset.z)/size, 1, dddd || 0.5)*d)|0;
            if (u < 0) u = 0; if (u > size + 1) u = size;
            if (v < 0) v = 0; if (v > size + 1) v = size;

            tempView[x+z*(size+1)] = dataView[u+v*(size+1)];
        }
    }

    z = size + 1;
    while(z--){
        x = size + 1;
        while(x--){
            dataView[x+z*(size+1)] = tempView[x+z*(size+1)];
        }
    }

}


var erode = function(iterations, smoothness, dataView, size){
    var abs = Math.abs, dMax = 0, dI = 0, dH = 0, dataViewXZ = 0;
    for (var i = 0; i < iterations; i++ ){
        var mu = 0;
        var mv = 0;

        for (var z=1; z<size; z++){
            for(var x=1; x<size; x++){
                dMax = 0;
                mu = 0;
                mv = 0;
                dataViewXZ = dataView[x+z*(size+1)];
                for (var v=-1; v<=1; v++){
                    for(var u=-1; u<=1; u++){
                        if (abs(u) + abs(v) > 0){
                            dI = dataViewXZ - dataView[(x+u)+(z+v)*(size+1)];
                            if (dI > dMax){
                                dMax = dI;
                                mu = u; mv = v;
                            }
                        }
                    }
                }

                if (0 < dMax && dMax <= (smoothness / size)){
                    dH = dMax/2;
                    dataView[x+z*(size+1)] -= dH;
                    dataView[(x+mu)+(z + mv)*(size+1)] += dH;
                }

            }
        }
    }
}


var smoothen = function(dataView, size){
    var x, z, u, v;
    /*z = size;
    while(z===1){
        z--;
        x = size;
        while(x===1){
            x--;*/
    for (z = 1; z < size ; ++z){
        for (x = 1; x < size; ++x){
            var total = 0.0;
            for (v = -1; v <= 1; v++){
                for (u = -1; u <= 1; u++){
                    total += dataView[(x + u + (z + v) * (size+1))];
                }
            }

            dataView[(x + z * (size+1))] = total / 9.0;
            
        }
        
    }
}
