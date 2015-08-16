/**
 * @fileoverview initWorkers.js - worker setup functions
 * @author Xavier de Boysson
 */

"use strict";
var workerGenerateTerrain, workerUpdateShadows, workerGenerateChunk;

Worker.prototype.setStatus = function(id, status)
{
    this.status[id] = status;
};

Worker.prototype.getStatus = function(id)
{
    if (typeof(this.status[id]) == "undefined") this.status[id] = "ready";
    return this.status[id];
};

Worker.prototype.status = new Array();

function initWorkers(){
    workerGenerateTerrain = new Worker("worker/workerGenerateTerrain.js");
    workerGenerateTerrain.onmessage = function (e){
        var message = e.data;
        var id = message.id;
        var heightmap = terrain.heightmaps[id];
        heightmap.dataBuffer = message.heightmapDataBuffer;
        heightmap.dataView = new Float32Array(heightmap.dataBuffer);
        heightmap.normalsTextureDataBuffer = message.normalsTextureDataBuffer;
        heightmap.normalsTextureDataView = new Uint8Array(heightmap.normalsTextureDataBuffer);
        heightmap.shadowsTextureDataBuffer = message.shadowsTextureDataBuffer;
        heightmap.shadowsTextureDataView = new Uint8Array(heightmap.shadowsTextureDataBuffer);
        heightmap.low = message.low;
        heightmap.high = message.high;

        textures.updateTexture(heightmap.normalsTexture, heightmap.normalsTextureDataView, heightmap.size, true);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, heightmap.normalsTexture);

        textures.updateTexture(heightmap.shadowsTexture, heightmap.shadowsTextureDataView, heightmap.size, true);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, heightmap.shadowsTexture);

		heightmap.currentNode = heightmap.treeNodeList.length - 1;
		heightmap.treeLoaded = false;
        heightmap.loaded = true;

        this.setStatus(0, "ready");
        generateChunk(id);
    };
    workerGenerateTerrain.onerror = function(e) { console.log("error"); }


    workerUpdateShadows = new Worker("worker/workerUpdateShadows.js");
    workerUpdateShadows.onmessage = function (e){
        var message = e.data;
        var id = message.id;
        var heightmap = terrain.heightmaps[id];
        heightmap.dataBuffer = message.heightmapDataBuffer;
        heightmap.dataView = new Float32Array(heightmap.dataBuffer);
        heightmap.shadowsTextureDataBuffer = message.textureDataBuffer;
        heightmap.shadowsTextureDataView = new Uint8Array(heightmap.shadowsTextureDataBuffer);

        textures.updateTexture(heightmap.shadowsTexture, heightmap.shadowsTextureDataView, terrain.heightmaps[id].size, true);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, heightmap.shadowsTexture);

        this.setStatus(0, "ready");

    };
    workerUpdateShadows.onerror = function(e) { console.log("error"); }


    workerGenerateChunk = new Worker("worker/workerGenerateChunk.js");
    workerGenerateChunk.onmessage = function (e){
        var message = e.data;
        var id = message.id;
        var heightmap = terrain.heightmaps[id];
        heightmap.dataBuffer = message.heightmapDataBuffer;
        heightmap.dataView = new Float32Array(heightmap.dataBuffer);

        var node = heightmap.treeNodeList[heightmap.currentNode];
        node.chunk = {};
        var chunk = node.chunk;
        chunk.boundingSphere = message.boundingSphere;

        chunk.interleavedArray = new Float32Array(message.interleavedArrayBuffer);
        chunk.interleavedArrayBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, chunk.interleavedArrayBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, chunk.interleavedArray, gl.STATIC_DRAW);

        this.setStatus(0, "ready");
        heightmap.currentNode --;

        if (!heightmap.treeLoaded){
            node = heightmap.treeNodeList[heightmap.currentNode];
            if (node) generateChunk(id);
            if (heightmap.currentNode < 0) heightmap.treeLoaded = true;
        }
    };
    workerGenerateChunk.onerror = function(e) { console.log("error"); }
}

function generateChunk(id){
    var worker = workerGenerateChunk;
    if (worker.getStatus(0) == "ready" && workerGenerateTerrain.getStatus(0) == "ready")
    {
        var heightmap = terrain.heightmaps[id];
        var node = heightmap.treeNodeList[heightmap.currentNode];
        if (node)
        {
            worker.setStatus(0, "busy");

            var xmin = node.xmin;
            var zmin = node.ymin;
            var xmax = node.xmax;
            var zmax = node.ymax;
            var step = Math.pow(2,node.d);

            var interleavedArrayBuffer = new ArrayBuffer((((zmax-zmin+step)/step)*((zmax-zmin+step)/step)*6 + ((zmax-zmin+step)/step)*4*6)*4);

            var message = {
                id: id,
                node: heightmap.currentNode,
                size: heightmap.size,
                heightRatio: heightmap.heightRatio,
                sizeRatio: sizeRatio,
                skirtHeight: heightmap.skirtHeight,
                offset: heightmap.pos,
                //dddd: heightmap.dddd,
                xmin: xmin,
                zmin: zmin,
                xmax: xmax,
                zmax: zmax,
                step: step,
                heightmapDataBuffer: heightmap.dataBuffer,
                interleavedArrayBuffer: interleavedArrayBuffer,
            }
            worker.postMessage(message, [message.heightmapDataBuffer, message.interleavedArrayBuffer]);
        }
    }
}

function generateTerrain(id){
    var worker = workerGenerateTerrain;
    if (worker.getStatus(0) == "ready" && workerUpdateShadows.getStatus(0) == "ready")
    {
        worker.setStatus(0, "busy");

        var message = {
            id: id,
            offset: terrain.heightmaps[id].pos,
            size: terrain.heightmaps[id].size,
            sunHeight: terrain.sunHeight,
            sizeRatio: sizeRatio,
            dddd: terrain.dddd,
            heightmapDataBuffer: terrain.heightmaps[id].dataBuffer,
            normalsTextureDataBuffer: terrain.heightmaps[id].shadowsTextureDataBuffer,
            shadowsTextureDataBuffer: terrain.heightmaps[id].normalsTextureDataBuffer,
            seedBuffer: seedBuffer
        }
//        worker.postMessage(message, [message.seedBuffer, message.heightmapDataBuffer, message.normalsTextureDataBuffer, message.shadowsTextureDataBuffer]);
        worker.postMessage(message, [message.heightmapDataBuffer, message.normalsTextureDataBuffer, message.shadowsTextureDataBuffer]);
    }
}

function updateShadows(id){
    var worker = workerUpdateShadows;
    if (worker.getStatus(0) == "ready" && workerGenerateTerrain.getStatus(0) == "ready")
    {
        worker.setStatus(0, "busy");
        var message = {
            id: id,
            size: terrain.heightmaps[id].size,
            low: terrain.heightmaps[id].low,
            high: terrain.heightmaps[id].high,
            sunHeight: terrain.sunHeight,
            heightmapDataBuffer: terrain.heightmaps[id].dataBuffer,
            textureDataBuffer: terrain.heightmaps[id].shadowsTextureDataBuffer
        }
        worker.postMessage(message, [message.heightmapDataBuffer, message.textureDataBuffer]);
    }
}