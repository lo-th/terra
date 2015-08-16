/**
 * @fileoverview terrain.js - terrain setup and functions
 * @author Xavier de Boysson
 */

"use strict";

var grassLink = ['arid', "crater", "dirt", "grass", "grass2", "sand", "sand2", "sand3", "snow", "snow2"];
var dirtLink = ['nuke', "rock", "rock2", "rock3", "rock4", "slime", "wet", "space"];

function Terrain(color){
    this.init();

    this.setProgram(programs.terrain);

    //this.setProgram(programs.deep);

    gl.uniform1i(this.uTextureGrass, 0);
    gl.uniform1i(this.uTextureDirt, 1);
    gl.uniform1i(this.uTextureNormals, 2);
    gl.uniform1i(this.uTextureShadows, 3);

    this.needupdateFog = true;
    this.colors = color || {r:76, g:61, b:38};
    this.density = 1;//Math.rand(0.1, 10, 2);
    this.dddd = [];

    this.dddd[0] = Math.rand(0,1,2);
    this.dddd[1] = Math.rand(0,1,2);
    this.dddd[2] = Math.rand(0,1,2);
    this.dddd[3] = Math.rand(0,1,2);

    //console.log(this.dddd[0])

    textures.loadTextureData("grassTexture", "img/"+grassLink[Math.rand(0, grassLink.length-1)]+".jpg");
    textures.loadTextureData("dirtTexture", "img/"+dirtLink[Math.rand(0, dirtLink.length-1)]+".jpg");

    //textures.loadTextureData("grassTexture", "img/sand2.jpg");
    //textures.loadTextureData("dirtTexture", "img/wetStone.jpg");
}

Terrain.prototype.setProgram = function(prog){

    this.program = prog;
    gl.useProgram(prog);
    this.aVertexPosition = gl.getAttribLocation(prog, "aVertexPosition");
    this.aTextureCoordinates = gl.getAttribLocation(prog, "aTextureCoordinates");

    //this.uMVPMatrix = gl.getUniformLocation(prog, "uMVPMatrix");
    this.mvMatrix = gl.getUniformLocation(prog, "mvMatrix");
    this.pMatrix = gl.getUniformLocation(prog, "pMatrix");
    this.uMorph = gl.getUniformLocation(prog, "uMorph");

    this.uTextureGrass = gl.getUniformLocation(prog, "uTextureGrass");
    this.uTextureDirt = gl.getUniformLocation(prog, "uTextureDirt");
    this.uTextureNormals = gl.getUniformLocation(prog, "uTextureNormals");
    this.uTextureShadows = gl.getUniformLocation(prog, "uTextureShadows");

    this.fog_color = gl.getUniformLocation(prog, "fog_color");
    this.fog_density = gl.getUniformLocation(prog, "fog_density");
    this.fog_far = gl.getUniformLocation(prog, "fog_far");

    this.colors = {r:76, g:61, b:38};
    this.density = 1;
    this.fogfar = mapSize+(mapSize/2);

    //gl.uniform3f(this.fog_color, this.colors.r/255, this.colors.g/255, this.colors.b/255);
    //gl.uniform1f(this.fog_density, this.density);
}

Terrain.prototype.setFog = function(density, color, fogfar){
    if(color) this.colors = color;
    this.density = density || 1;
    this.fogfar = fogfar || (mapSize+(mapSize/2));
    this.needupdateFog = true;
}

Terrain.prototype.render = function(){
    gl.useProgram(this.program);
    //mat4.translate(mvMatrix, mvMatrix, [input.pos.x, input.pos.y, input.pos.z]);
    //mat4.multiply(mvpMatrix, pMatrix, mvMatrix);
    //gl.uniformMatrix4fv(this.uMVPMatrix, false, mvpMatrix);

    gl.uniformMatrix4fv(this.mvMatrix, false, mvMatrix);
    gl.uniformMatrix4fv(this.pMatrix, false, pMatrix);

    if(this.needupdateFog){
        gl.uniform3f(this.fog_color, this.colors.r/255, this.colors.g/255, this.colors.b/255);
        gl.uniform1f(this.fog_density, this.density);
        gl.uniform1f(this.fog_far, this.fogfar);
        this.needupdateFog = false;
    }

    frustum = this.extractFrustum();

    var onMap = false;
    var heightmap = null;
    var size = mapSize*sizeRatio;

    //var id = this.heightmaps.length;
    //while(id--){
    for (var id=0; id<this.heightmaps.length; id++){
        heightmap = this.heightmaps[id];
        if (heightmap){
            var used = false;
            for (var x = -2; x <= 2; x++){
                for (var z = -2; z <= 2; z++){
                    if (-input.pos.x + x*size < heightmap.pos.x + size &&
                        -input.pos.x + x*size > heightmap.pos.x &&
                        -input.pos.z + z*size < heightmap.pos.z + size &&
                        -input.pos.z + z*size > heightmap.pos.z)
                    {
                        used = true;
                    }
                }
            }

            if (!used && workerGenerateTerrain.getStatus(0) == "ready") terrain.heightmaps.remove(id);
        }
    }


    for (var x = -2; x <= 2; x++){
        for (var z = -2; z <= 2; z++){
            var genMap = true;
            var id = this.heightmaps.length;
            while(id--){
            //for (var id=0; id<this.heightmaps.length; id++)
            //{
                heightmap = this.heightmaps[id];
                if (-input.pos.x + x*size < heightmap.pos.x + size &&
                    -input.pos.x + x*size > heightmap.pos.x &&
                    -input.pos.z + z*size < heightmap.pos.z + size &&
                    -input.pos.z + z*size > heightmap.pos.z)
                {
                    genMap = false;
                    break;
                }

            }

            if (genMap){
                var px = Math.floor(-input.pos.x/size);
                var pz = Math.floor(-input.pos.z/size);
                this.heightmaps.push(new Heightmap({x:px*size + x*size, z:pz*size + z*size}));
            }
        }
    }



    cnt = 0;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures.grassTexture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures.dirtTexture);

    gl.uniform1i(this.uTextureGrass, 0);
    gl.uniform1i(this.uTextureDirt, 1);
    gl.uniform1i(this.uTextureNormals, 2);
    gl.uniform1i(this.uTextureShadows, 3);

    gl.enableVertexAttribArray(this.aVertexPosition);
    gl.enableVertexAttribArray(this.aTextureCoordinates);

    // same indices for all chunks
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

    totalLoading = 0;
    //id = this.heightmaps.length;
    //while(id--){
    for (var id=0; id<this.heightmaps.length; id++){
        heightmap = this.heightmaps[id];
        if (heightmap){
            if (heightmap.loaded){
                totalLoading ++;
                heightmap.render();
            }else{
                generateTerrain(id);

            }
        }
    }
    totalLoading = Math.floor(totalLoading / this.heightmaps.length * 100);

    gl.disableVertexAttribArray(this.aVertexPosition);
    gl.disableVertexAttribArray(this.aTextureCoordinates);
}

Terrain.prototype.init = function(){
    
    this.genIndices();

    this.heightmaps = new Array();
    this.sunHeight = 1;


    this.heightmaps.push(new Heightmap({x:0, z:0}));


    for (var x = -1; x <= 1; x++){
        for (var z = -1; z <= 1; z++){
            if (x != 0 || z != 0)
                this.heightmaps.push(new Heightmap({x:x*mapSize, z:z*mapSize}));
        }
    }

    for (var x = -2; x <= 2; x++){
        for (var z = -2; z <= 2; z++){
            if ((x != 0 || z != 0) && (x != 1 || z != 0) && (x != -1 || z != 0) && (x != 0 || z != 1) && (x != 0 || z != -1) && (x != -1 || z != -1) && (x != 1 || z != 1)  && (x != 1 || z != -1) && (x != -1 || z != 1))
                this.heightmaps.push(new Heightmap({x:x*mapSize, z:z*mapSize}));
        }
    }

}

Terrain.prototype.genIndices = function(){

    var size = mapSize/(Math.pow(2, terrainDepth));
    var indicesBuffer = new ArrayBuffer(( ( size*size + size*4 )*6)*2);
    var indices = new Uint16Array(indicesBuffer);

    var a, b, c, d;
    var i=0;
    var j=0;
    for (var z = 0; z < size + 1 ; z++){
        for (var x = 0; x < size + 1  ; x++){
            if (x < size  && z < size ){
                a = i/3;
                b = (i + 3*(size+1))/3;
                c = (i+3 + 3*(size+1))/3;
                d = (i+3)/3;

                indices[j] = a;
                indices[j+1] = b;
                indices[j+2] = c;
                indices[j+3] = c;
                indices[j+4] = d;
                indices[j+5] = a;
                j+=6;
            }
            i+=3;
        }
    }
    for (var z = 0; z < size + 1; z++){
        if (z < size){
            a = i/3;
            b = (i+3)/3;
            c = (z + 1) * (size + 1);
            d = z * (size + 1);

            indices[j] = a;
            indices[j+1] = b;
            indices[j+2] = c;
            indices[j+3] = c;
            indices[j+4] = d;
            indices[j+5] = a;
            j+=6;
        }
        i+=3;
    }

    // bottom skirt
    for (var x = 0; x < size + 1; x++){
        if (x < size){
            b = i/3;
            c = (i+3)/3;
            a = x + size * (size + 1);
            d = x + 1 + size * (size + 1);
            indices[j] = a;
            indices[j+1] = b;
            indices[j+2] = c;
            indices[j+3] = c;
            indices[j+4] = d;
            indices[j+5] = a;
            j+=6;
        }
        i+=3;
    }

    // top skirt
    for (var x = 0; x < size + 1; x++){
        if (x < size){
            a = i/3;
            d = (i+3)/3;
            b = x;
            c = x + 1;
            indices[j] = a;
            indices[j+1] = b;
            indices[j+2] = c;
            indices[j+3] = c;
            indices[j+4] = d;
            indices[j+5] = a;
            j+=6;
        }
        i+=3;
    }

    // right skirt
    for (var z = 0; z < size + 1; z++){
        if (z < size){
            c = (i+3)/3;
            d = i/3;
            a = size + z * (size + 1);
            b = size + (z + 1) * (size + 1);

            indices[j] = a;
            indices[j+1] = b;
            indices[j+2] = c;
            indices[j+3] = c;
            indices[j+4] = d;
            indices[j+5] = a;
            j+=6;
        }
        i+=3;
    }

    this.indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    this.indicesLength = indices.length;
}

Terrain.prototype.extractFrustum = function(){
//function extractFrustum(){
    var mat =  mvpMatrix;
    var a = 0, b = 0, c = 0, d = 0;
    var frustum = [null, null, null, null, null, null];
    var mat1  = mat[0];
    var mat2  = mat[1];
    var mat3  = mat[2];
    var mat4  = mat[3];
    var mat5  = mat[4];
    var mat6  = mat[5];
    var mat7  = mat[6];
    var mat8  = mat[7];
    var mat9  = mat[8];
    var mat10 = mat[9];
    var mat11 = mat[10];
    var mat12 = mat[11];
    var mat13 = mat[12];
    var mat14 = mat[13];
    var mat15 = mat[14];
    var mat16 = mat[15];

// Right plane
    a = mat4  - mat1;
    b = mat8  - mat5;
    c = mat12 - mat9;
    d = mat16 - mat13;
    frustum[0] = new Plane(a, b, c, d);
    frustum[0].normalize();

// Left plane
    a = mat4  + mat1;
    b = mat8  + mat5;
    c = mat12 + mat9;
    d = mat16 + mat13;
    frustum[1] = new Plane(a, b, c, d);
    frustum[1].normalize();

// Bottom plane
    a = mat4  + mat2;
    b = mat8  + mat6;
    c = mat12 + mat10;
    d = mat16 + mat14;
    frustum[2] = new Plane(a, b, c, d);
    frustum[2].normalize();

// Top plane
    a = mat4  - mat2;
    b = mat8  - mat6;
    c = mat12 - mat10;
    d = mat16 - mat14;
    frustum[3] = new Plane(a, b, c, d);
    frustum[3].normalize();

// Far plane
    a = mat4  - mat3;
    b = mat8  - mat7;
    c = mat12 - mat11;
    d = mat16 - mat15;
    frustum[4] = new Plane(a, b, c, d);
    frustum[4].normalize();

// Near plane
    a = mat4  + mat3;
    b = mat8  + mat7;
    c = mat12 + mat11;
    d = mat16 + mat15;
    frustum[5] = new Plane(a, b, c, d);
    frustum[5].normalize();

    return frustum;
}
//-----------------------------------------------------
//       HEIGHTMAP
//-----------------------------------------------------


function Heightmap(pos){
    this.loaded = false;
    this.pos = pos;
    this.size = mapSize;
    this.treeNodeList = new Array();
    this.currentNode = 0;
    this.treeLoaded = false;
    this.tree = new Quadtree(this.treeNodeList, 0, 0, this.size, this.size, terrainDepth);
    this.skirtHeight = this.size/128;
    this.heightRatio = 6;
    this.high = 0;
    this.low = 0;

    this.dataBuffer = new ArrayBuffer((this.size+1)*(this.size+1)*4);
    this.dataView = new Float32Array(this.dataBuffer);

    this.normalsTextureDataBuffer = new ArrayBuffer(this.size * this.size * 4);
    this.normalsTextureDataView = new Uint8Array(this.normalsTextureDataBuffer);
    this.normalsTexture = gl.createTexture();
    textures.updateTexture(this.normalsTexture, this.normalsTextureDataView, this.size);

    this.shadowsTextureDataBuffer = new ArrayBuffer(this.size * this.size * 4);
    this.shadowsTextureDataView = new Uint8Array(this.shadowsTextureDataBuffer);
    this.shadowsTexture = gl.createTexture();
    textures.updateTexture(this.shadowsTexture, this.shadowsTextureDataView, this.size);

}

Heightmap.prototype.render = function(){
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.normalsTexture);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.shadowsTexture);

    this.tree.renderChunk();
}


//-----------------------------------------------------
//       QUADTREE
//-----------------------------------------------------

function Quadtree(nodeList, xmin, ymin, xmax, ymax, d){
    this.xmin = xmin;
    this.ymin = ymin;
    this.xmax = xmax;
    this.ymax = ymax;
    this.d = d;
    this.lod = Math.pow(2,d) * viewPort;
    this.depth = 4-d;
    this.chunk = null;
    this.children = null;
    if (d > 0){
        d--;
        var xmid = (xmin + xmax)/2;
        var ymid = (ymin + ymax)/2;
        this.children = [
            new Quadtree(nodeList, xmin, ymin, xmid, ymid, d),
            new Quadtree(nodeList, xmin, ymid, xmid, ymax, d),
            new Quadtree(nodeList, xmid, ymid, xmax, ymax, d),
            new Quadtree(nodeList, xmid, ymin, xmax, ymid, d)
        ];
    }

    nodeList.push(this);
//  ((4^depth)-1)*4/3

}



Quadtree.prototype.getScreenError = function()
{
    var a = this.chunk.boundingSphere;
    var b = input.pos;
    var d = Math.sqrt((a.x + b.x)*(a.x + b.x) + (a.y + b.y)*(a.y + b.y) + (a.z + b.z)*(a.z + b.z))-a.r;
    if (d<0) d = 0;
    return this.lod/d;
}

Quadtree.prototype.renderChunk = function(){
    var chunk = this.chunk;
    if (chunk && sphereInFrustum(frustum, chunk.boundingSphere)){

        var child = this.children;

        var chunkScreenError = this.getScreenError();

        if (chunkScreenError <= 32 || !child){

            var n = chunkScreenError/16 - 1;
            if (n>1) n = 1;
            if (n<0) n = 0;
            if (this.depth == 0) n = 1;
            if (!input.vertexMorphing) n = 1;

            gl.uniform1f(terrain.uMorph, n);

            cnt++;

            gl.bindBuffer(gl.ARRAY_BUFFER, chunk.interleavedArrayBuffer);
            gl.vertexAttribPointer(terrain.aVertexPosition, 4, gl.FLOAT, false, 6*4, 0);
            gl.vertexAttribPointer(terrain.aTextureCoordinates, 2, gl.FLOAT, false, 6*4, 4*4);

            if (input.wireframe) gl.drawElements(gl.LINES, terrain.indicesLength, gl.UNSIGNED_SHORT, 0);
            else gl.drawElements(gl.TRIANGLES, terrain.indicesLength , gl.UNSIGNED_SHORT, 0);
        }else{
            if (child){
                child[0].renderChunk();
                child[1].renderChunk();
                child[2].renderChunk();
                child[3].renderChunk();
            }
        }

    }
}

function Plane(a, b, c, d){
    this.a = a
    this.b = b
    this.c = c
    this.d = d
}

Plane.prototype.normalize = function(){
    var d = 1/Math.sqrt(this.a*this.a + this.b*this.b + this.c*this.c)
    this.a = this.a * d
    this.b = this.b * d
    this.c = this.c * d
    this.d = this.d * d
}


/*
function Sphere(x, y, z, r){
    this.x = x;
    this.y = y;
    this.z = z;
    this.r = r;
}

function Vertex(x, y, z){
    this.x = x;
    this.y = y;
    this.z = z;
}*/


// point distance from plane: distance = a*x + b*y + c*z + d
function sphereInFrustum(f, s){
    for (var p = 0; p < 6 ; p++){
        if (f[p].a * s.x + f[p].b * s.y + f[p].c * s.z + f[p].d <= -s.r)
            return false;
    }
    return true;
}