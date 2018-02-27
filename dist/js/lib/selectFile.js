'use strict';
var Whatch = require('././../../commonModules/watcher');
var selectFileScope = {};

$('script').eq(0).before(`<footer><form><p>ruta:</p><input type="text" name="path" value="${window.currentPath}"><input type="submit" name="aceptar" value="aceptar"></form></footer>`);
var changeInput = () => {
	$('footer input').eq(0).val(currentPath);
};



