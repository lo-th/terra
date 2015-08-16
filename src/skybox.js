/**
 * @fileoverview skybox.js - skybox setup and functions
 * @author Xavier de Boysson
 */

"use strict";

function Skybox(){
    this.init();

    gl.useProgram(programs.skybox);
    this.aVertexPosition = gl.getAttribLocation(programs.skybox, "aVertexPosition");
    this.aTextureCoordinates = gl.getAttribLocation(programs.skybox, "aTextureCoordinates");

    //this.uMVPMatrix = gl.getUniformLocation(programs.skybox, "uMVPMatrix");
    this.mvMatrix = gl.getUniformLocation(programs.skybox, "mvMatrix");
    this.pMatrix = gl.getUniformLocation(programs.skybox, "pMatrix");
    this.uTexture = gl.getUniformLocation(programs.skybox, "uTexture");
    gl.uniform1i(this.uTexture, 0);

    var n = Math.rand(1,8), cc;
    switch(n){
      case 1: cc = {r:4, g:6, b:1}; break;
      case 2: cc = {r:215, g:204, b:176}; break;
      case 3: cc = {r:0, g:0, b:0}; break;
      case 4: cc = {r:246, g:233, b:180}; break;
      case 5: cc = {r:76, g:61, b:38}; break;
      case 6: cc = {r:95, g:94, b:110}; break;
      case 7: cc = {r:109, g:108, b:122}; break;
    }
    
    this.fogColor = cc;


    var skytype = 'sky' + n;
    this.texture = CubeMapTexture("img/"+skytype+"/posx.jpg", "img/"+skytype+"/negx.jpg", "img/"+skytype+"/posy.jpg", "img/"+skytype+"/negy.jpg", "img/"+skytype+"/posz.jpg", "img/"+skytype+"/negz.jpg");
}

Skybox.prototype.render = function(){


    if (this.texture.loaded){
        gl.useProgram(programs.skybox);

        //mat4.multiply(mvpMatrix, pMatrix, mvMatrix);
        //gl.uniformMatrix4fv(this.uMVPMatrix, false, mvpMatrix);
        gl.uniformMatrix4fv(this.mvMatrix, false, mvMatrix);
        gl.uniformMatrix4fv(this.pMatrix, false, pMatrix);

        gl.enableVertexAttribArray(this.aVertexPosition);
        gl.enableVertexAttribArray(this.aTextureCoordinates);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
        gl.uniform1i(this.uTexture, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.vertexAttribPointer(this.aVertexPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordsBuffer);
        gl.vertexAttribPointer(this.aTextureCoordinates, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

        if (!input.wireframe)
            gl.drawElements(gl.TRIANGLES, this.indices.length , gl.UNSIGNED_SHORT, 0);

        gl.disableVertexAttribArray(this.aVertexPosition);
        gl.disableVertexAttribArray(this.aTextureCoordinates);
        gl.clear(gl.DEPTH_BUFFER_BIT);
    }
}

Skybox.prototype.init = function()
{

  this.vertices = new Float32Array([
    -1.0, -1.0, -1.0, // NZ
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    -1.0, -1.0,  1.0, // PZ
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    -1.0, -1.0, -1.0, // NY
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0, -1.0, -1.0,

    -1.0,  1.0, -1.0, // PY
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    -1.0, -1.0, -1.0, // NX
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,

     1.0, -1.0, -1.0, // PX
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,
  ]);

  this.textureCoords = new Float32Array([
    -1.0, -1.0, -1.0, // NZ
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    -1.0, -1.0,  1.0, // PZ
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    -1.0, -1.0, -1.0, // NY
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0, -1.0, -1.0,

    -1.0,  1.0, -1.0, // PY
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    -1.0, -1.0, -1.0, // NX
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,

     1.0, -1.0, -1.0, // PX
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,
  ]);

  this.indices = new Uint16Array([
     2,  1,  0,
     3,  2,  0,

     4,  5,  6,
     4,  6,  7,

     8,  9, 10,
     8, 10, 11,

    14, 13, 12,
    15, 14, 12,

    18, 17, 16,
    19, 18, 16,

    20, 21, 22,
    20, 22, 23
  ]);

    this.verticesBuffer = gl.createBuffer();
    this.textureCoordsBuffer = gl.createBuffer();
    this.indicesBuffer = gl.createBuffer();


    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.textureCoords, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

}

function CubeMapTexture(px, nx, py, ny, pz, nz){

  var texture = gl.createTexture();

  texture.images = new Array(6);
  texture.imageNames = [px, nx, py, ny, pz, nz];
  texture.imageTargets = [
    gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
  texture.loadedImages = 0;

  texture.loaded = false;

  for (var i=0; i<6; i++)
  {
    texture.images[i] = new Image();
    texture.images[i].index = i;
    texture.images[i].onload = function(e)
    {
      handleLoadedCubeMapTexture(texture, e.target.index);
    }
    texture.images[i].src = texture.imageNames[i];
  }

  return texture;
}

function handleLoadedCubeMapTexture(texture, index){
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(texture.imageTargets[index], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.images[index]);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  texture.loadedImages++;
  if (texture.loadedImages == 6) gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

  if (texture.loadedImages == 6) texture.loaded = true;

}


//http://sge.symbio-finland.fi/webgl/engine/skyboxdemo_setup.js