/**
 * @fileoverview workerGenerateChunk.js - worker chunk generation functions
 * @author Xavier de Boysson
 */

"use strict";
self.onmessage = function (event){
    var message = event.data;

    var id = message.id;
    var node = message.node;

    var boundingSphere = loadData(message);

  //  setTimeout(function(){
    var returnMessage = {
        id: message.id,
        node: message.node,
        boundingSphere: boundingSphere,
        interleavedArrayBuffer: message.interleavedArrayBuffer,
        heightmapDataBuffer: message.heightmapDataBuffer
    }

    self.postMessage(returnMessage, [returnMessage.heightmapDataBuffer, returnMessage.interleavedArrayBuffer]);
   // }, 10);
};



var loadData = function(message){
    var size = message.size;
    var offset = message.offset;
    var xmin = message.xmin;
    var zmin = message.zmin;
    var xmax = message.xmax;
    var zmax = message.zmax;
    var step = message.step;
    var heightRatio = message.heightRatio;
    var sizeRatio = message.sizeRatio;
    var skirtHeight = message.skirtHeight * sizeRatio;

    var dataView = new Float32Array(message.heightmapDataBuffer);
    var interleavedArray = new Float32Array(message.interleavedArrayBuffer);

    var i = 0;

    var currHeight;
    var l = {x:0, y:99999, z:0};
    var h = {x:0, y:-99999, z:0};


// terrain
    for (var z = zmin; z < zmax + 1 ; z+= step){
        for (var x = xmin; x < xmax + 1  ; x+= step){
            currHeight = dataView[x + z * (size+1)] / heightRatio;
            if (currHeight > h.y){
                h.x = x*sizeRatio + offset.x;
                h.y = currHeight;
                h.z = z*sizeRatio + offset.z;
            }
            if (currHeight < l.y){
                l.x = x*sizeRatio + offset.x;
                l.y = currHeight;
                l.z = z*sizeRatio + offset.z;
            }

            //vertices
            interleavedArray[i] = x*sizeRatio + offset.x;
            interleavedArray[i+1] = currHeight;
            interleavedArray[i+2] = z*sizeRatio + offset.z;
            //morph
            interleavedArray[i+3] = getMorph(x, z, step, dataView, size)/ heightRatio;
            //textures
            interleavedArray[i+4] = x/(size);
            interleavedArray[i+5] = z/(size);

            i+=6;
        }

    }


// left skirt
    for (var z = zmin; z < zmax + 1; z+= step){
        currHeight = dataView[(xmin + z * (size+1))] / heightRatio;

        //vertices
        interleavedArray[i] = xmin*sizeRatio + offset.x;
        interleavedArray[i+1] = currHeight - skirtHeight;
        interleavedArray[i+2] = z*sizeRatio + offset.z;
        //morph
        interleavedArray[i+3] = getMorph(xmin, z, step, dataView, size)/ heightRatio - skirtHeight;
        //textures
        interleavedArray[i+4] = xmin/(size);
        interleavedArray[i+5] = z/(size);

        i+=6;
    }



// bottom skirt
    for (var x = xmin; x < xmax + 1; x+= step){
        currHeight = dataView[(x + (zmax) * (size+1))] / heightRatio;

        //vertices
        interleavedArray[i] = x*sizeRatio + offset.x;
        interleavedArray[i+1] = currHeight - skirtHeight;
        interleavedArray[i+2] = zmax*sizeRatio + offset.z;
        //morph
        interleavedArray[i+3] = getMorph(x, zmax, step, dataView, size)/ heightRatio - skirtHeight;
        //textures
        interleavedArray[i+4] = x/(size);
        interleavedArray[i+5] = (zmax)/(size);

        i+=6;
    }



// top skirt
    for (var x = xmin; x < xmax + 1; x+= step){
        currHeight = dataView[(x + zmin * (size+1))] / heightRatio;

        //vertices
        interleavedArray[i] = x*sizeRatio + offset.x;
        interleavedArray[i+1] = currHeight - skirtHeight;
        interleavedArray[i+2] = zmin*sizeRatio + offset.z;
        //morph
        interleavedArray[i+3] = getMorph(x, zmin, step, dataView, size)/ heightRatio - skirtHeight;
        //textures
        interleavedArray[i+4] = x/(size);
        interleavedArray[i+5] = zmin/(size);

        i+=6;
    }



// right skirt
    for (var z = zmin; z < zmax + 1; z+= step){
        currHeight = dataView[(xmax  + z * (size+1))] / heightRatio;

        //vertices
        interleavedArray[i] = xmax*sizeRatio + offset.x;
        interleavedArray[i+1] = currHeight - skirtHeight;
        interleavedArray[i+2] = z*sizeRatio + offset.z;
        //morph
        interleavedArray[i+3] = getMorph(xmax, z, step, dataView, size)/ heightRatio - skirtHeight;
        //textures
        interleavedArray[i+4] = (xmax)/(size);
        interleavedArray[i+5] = z/(size);

        i+=6;
    }

    var a = {x:xmin*sizeRatio + offset.x, y:dataView[xmin + zmin * (size+1)] / heightRatio, z:zmin*sizeRatio + offset.z};
    var b = {x:xmin*sizeRatio + offset.x, y:dataView[xmin + (zmax-step) * (size+1)] / heightRatio, z:zmax*sizeRatio + offset.z};
    var c = {x:xmax*sizeRatio + offset.x, y:dataView[xmax + (zmax-step) * (size+1)] / heightRatio, z:zmax*sizeRatio + offset.z};
    var d = {x:xmax*sizeRatio + offset.x, y:dataView[xmax + zmin * (size+1)] / heightRatio, z:zmin*sizeRatio + offset.z};

    var mid = {x:(a.x+b.x+c.x+d.x)/4, y:(a.y+b.y+c.y+d.y)/4, z:(a.z+b.z+c.z+d.z)/4};
    var dists = new Array();
    dists.push(Math.sqrt(Math.pow(mid.x - a.x, 2) + Math.pow(mid.y - a.y, 2) + Math.pow(mid.z - a.z, 2)));
    dists.push(Math.sqrt(Math.pow(mid.x - b.x, 2) + Math.pow(mid.y - b.y, 2) + Math.pow(mid.z - b.z, 2)));
    dists.push(Math.sqrt(Math.pow(mid.x - c.x, 2) + Math.pow(mid.y - c.y, 2) + Math.pow(mid.z - c.z, 2)));
    dists.push(Math.sqrt(Math.pow(mid.x - d.x, 2) + Math.pow(mid.y - d.y, 2) + Math.pow(mid.z - d.z, 2)));
    dists.push(Math.sqrt(Math.pow(mid.x - l.x, 2) + Math.pow(mid.y - l.y, 2) + Math.pow(mid.z - l.z, 2)));
    dists.push(Math.sqrt(Math.pow(mid.x - h.x, 2) + Math.pow(mid.y - h.y, 2) + Math.pow(mid.z - h.z, 2)));

    var r = 0;
    for (var i=0; i<6; i++){
        if (dists[i] > r)
            r = dists[i];
    }
    dists = null;
    return {x:mid.x, y:mid.y, z:mid.z, r:r};
}

var getMorph = function(x, z, step, dataView, size){
    var nx = x/step;
    var nz = z/step;

    if (nx%2 == 1 && nz%2 == 0) return (dataView[(x-step) + z * (size+1)] + dataView[(x+step) + z * (size+1)])/2;
    if (nx%2 == 0 && nz%2 == 1) return (dataView[x + (z-step) * (size+1)] + dataView[x + (z+step) * (size+1)])/2;
    if (nx%2 == 1 && nz%2 == 1) return (dataView[(x-step) + (z-step) * (size+1)] + dataView[(x+step) + (z+step) * (size+1)])/2;
    return dataView[x + z * (size+1)];
}