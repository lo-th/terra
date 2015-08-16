/**
 * @fileoverview textures.js - textures setup and functions
 * @author Xavier de Boysson
 */

"use strict";
var textures = {

    // Chrome fix: add "--allow-file-access-from-files" to chrome shortcut
    // mac: /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --allow-file-access-from-files

    loadTextureData : function(name, source, size){
        var texture = new Image();

        texture.addEventListener('load', function (){
            var canvasBuffer = document.createElement('canvas');

            if (size){
                this.width = size;
                this.height = size;
            }

            canvasBuffer.height = this.height;
            canvasBuffer.width = this.width;

            var contextBuffer = canvasBuffer.getContext('2d');
            contextBuffer.drawImage(this, 0, 0);

            textures[name+"DataBuffer"] = new ArrayBuffer( this.width * this.height * 4 );
            textures[name+"DataView"] = new Uint8Array(textures[name+"DataBuffer"]);

            var tempArray = new Uint8Array(contextBuffer.getImageData(0, 0, this.width, this.height).data);

            for (var i=0; i<textures[name+"DataView"].length; i++){
                textures[name+"DataView"][i] = tempArray[i];
            }

            tempArray = null;

            textures[name] = gl.createTexture();
            textures.updateTexture(textures[name], textures[name+"DataView"], this.width, false);
        }, false);

        texture.src = source;
    },

    updateTexture : function (texture, dataView, size, clamp){
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, dataView);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        if (clamp){
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).
        }
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}


function createFramebuffer()
{
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    var texture = createTexture();

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);


    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {buffer:framebuffer, texture:texture};
}

function createTexture()
{
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    return texture;
}
