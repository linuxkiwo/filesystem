'use strict';
/*Importación de módulos */

const { app, BrowserWindow, globalShortcut } = require('electron');
const fs = require('fs')
const path = require('path');
const url = require('url');
const { exec } = require('child_process');

const EventServer = require('../commonModules/localEvent').Server;


/* Declaración de variables globales */
var win, currentPath, dirList, currentFiles;
/*Declaración de los metodos que se tengan que emplear fuera*/
/*Declaración de las funciones globales*/
var createWin, closeWin, loadFiles, changeDir, move;
var external = {};


exec('echo $USER', (err, stdout, stderr) => {
	currentPath = `/home/${stdout}/`.replace('\n', '');
});


createWin = () => {
	win = new BrowserWindow({ width: 800, height: 600, menu: false });
	globalShortcut.register('CommandOrControl+Y', () => {
      // Hacer algo cuando se presiona tanto Tecla Command o Control + Y.
      console.log("algo ha pasado")
    })
	win.loadURL(url.format({
		pathname: path.join(__dirname, 'dist/index.html'),
		protocol: 'file:',
		slashes: true
	}));
	win.webContents.openDevTools();
	win.on('closed', () => {
		win = null
	});
};

closeWin = () => app.quit();

external.loadFiles = loadFiles = (dir = '') => {
	currentPath = (dir !== '') ? (currentPath + dir[0] + '/') : currentPath;
	currentFiles = { dir: [], fil: [] };
	var listDir = fs.readdirSync(currentPath);
	for (let i of listDir) {
		if (i.search(/^\./) !== -1)
			continue;
		else if (fs.lstatSync(`${currentPath}/${i}`).isDirectory())
			currentFiles['dir'].push(i);
		else if (fs.lstatSync(`${currentPath}/${i}`).isFile())
			currentFiles['fil'].push(i);
	};
	let list = currentFiles,
		str = '';
	for (var i in list['dir'])
		str += `<li class="folder"><img src="media/folder.jpg"><p>${list['dir'][i]}</p></li>`;
	for (i in list['fil'])
		str += `<li class="file"><img src="media/file.jpg"><p>${list['fil'][i]}</p></li>`;
	return [str];
};

external.changeDir = changeDir = (name) => {
	let path = currentPath.split('/');
	currentPath = path.slice(0, path.indexOf(name[0]) + 1).join("/") + '/';
	return [loadFiles()[0], path.slice(1, path.indexOf(name[0]) + 1)];
};

external.move = move = (paths) => {
	fs.rename(`${currentPath}${paths[0]}`, `${currentPath}${paths[1]}/${paths[0]}`, (err) => {
		console.log(err);
	});
}


var comunication = new EventServer(external);
external.changeDir = changeDir = (name) => {
	let path = currentPath.split('/');
	currentPath = path.slice(0, path.indexOf(name[0]) + 1).join("/") + '/';
	return [loadFiles()[0], path.slice(1, path.indexOf(name[0]) + 1)];
};


app.on('ready', createWin);
app.on('window-all-closed', closeWin);