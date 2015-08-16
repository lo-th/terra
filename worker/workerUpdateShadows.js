/**
 * @fileoverview workerUpdateShadows.js - worker shadow update functions
 * @author Xavier de Boysson
 */

"use strict";
self.onmessage = function (event){
    var message = event.data;

    var textureView = new Uint8Array(message.textureDataBuffer);
    var dataView = new Float32Array(message.heightmapDataBuffer);

    var size = message.size;
    var sunHeight = message.sunHeight;
    var low = message.low;
    var high = message.high;

    var currHeight, shadow, x, z, maxHeight = 0;

    z = size + 1;
    while(z--){
        maxHeight = 0;
        x = size;
        while(x--){
    //for (var z = 0; z < size + 1; z++){
        //var maxHeight = 0;
        //for (var x = size; x >= 0; x--){
            currHeight = ((low + dataView[x+z*(size+1)])/high)*255;
            if (currHeight > maxHeight){
                shadow = 0;
                maxHeight = currHeight;
            }else{
                shadow = (255 - currHeight)*.8;
            }
            textureView[((x<size?x:x-1) + (z<size?z:z-1) * size)*4] = 255 - shadow;

            maxHeight -= sunHeight;
        }
    }


    for (var z = 2; z < size - 2; ++z){
        for (var x = 2; x < size - 2; ++x){
            var total = 0.0;
            for (var v = -2; v <= 2; v++){
                for (var u = -2; u <= 2; u++){
                    total += textureView[(x + u + (z + v) * size)*4];
                }
            }
            textureView[(x + z * size)*4] = total / 25.0;
        }
    }

    var returnMessage = {
        id: message.id,
        heightmapDataBuffer: message.heightmapDataBuffer,
        textureDataBuffer: message.textureDataBuffer
    }

    self.postMessage(returnMessage, [returnMessage.heightmapDataBuffer, returnMessage.textureDataBuffer]);

};

