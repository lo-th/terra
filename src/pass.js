/**
 * @fileoverview pass.js - pass setup and functions
 * @author Xavier de Boysson
 */

"use strict";
function Pass(prog, buffer, pass){
    this.program = prog;
    this.buffer = buffer;
    this.init();
    this.pass = pass;
    gl.useProgram(this.program);
    this.aVertexPosition = gl.getAttribLocation(this.program, "aVertexPosition");
    this.aTextureCoordinates = gl.getAttribLocation(this.program, "aTextureCoordinates");
    this.uTexture = gl.getUniformLocation(this.program, "uTexture");
    gl.uniform1i(this.uTexture, 0);

    this.uPixel = gl.getUniformLocation(this.program, "uPixel");


}

Pass.prototype.render = function(){

    gl.useProgram(this.program);

    if (this.pass == 1)
        gl.uniform2f(this.uPixel, 6/width, 0);
    else
        gl.uniform2f(this.uPixel, 0, 6/height);


    gl.enableVertexAttribArray(this.aVertexPosition);
    gl.enableVertexAttribArray(this.aTextureCoordinates);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.buffer.texture);
    gl.uniform1i(this.uTexture, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.vertexAttribPointer(this.aVertexPosition, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordsBuffer);
    gl.vertexAttribPointer(this.aTextureCoordinates, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

    if (input.wireframe)
        gl.drawElements(gl.LINES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    else
        gl.drawElements(gl.TRIANGLES, this.indices.length , gl.UNSIGNED_SHORT, 0);

    gl.disableVertexAttribArray(this.aVertexPosition);
    gl.disableVertexAttribArray(this.aTextureCoordinates);
}

Pass.prototype.init = function(){

  this.vertices = new Float32Array([
    -1.0, -1.0, -1.0, // NZ
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0
  ]);

  this.textureCoords = new Float32Array([
    0.01, 0.01, // NZ
    0.01,  0.99,
     0.99,  0.99,
     0.99, 0.01
  ]);

  this.indices = new Uint16Array([
     2,  1,  0,
     3,  2,  0
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
