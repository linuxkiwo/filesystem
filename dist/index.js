'use strict';
/*Importación de módulos */

const { app, BrowserWindow } = require('electron');
const fs = require('fs')
const path = require('path');
const url = require('url');
const { exec } = require('child_process');

const EventServer = require('../../commonModules/localEvent').Server;

const LoadApp = require('loadapp');
/*constantes globales*/
const ConfigPath = '../../commonModules/config.json';
const ProgramName = "fileSystem";

let l = new LoadApp(__dirname, ConfigPath, ProgramName, process.argv.splice(2));

/*Variables globales*/
var win,
	currentPath,
	dirList,
	currentFiles,
	homeName = "Carpeta personal",
	homeDir = l.homeDir,
	stringFile = "",
	config = {},
	modularLibs = {},
	pathToLoad = l.pathToLoad;

/*Declaración de las funciones globales*/
var external = this.external = {};
this.app = app;
/*metodos locales*/

var createWin = () => {
	win = new BrowserWindow({ width: 800, height: 600, menu: false });	
		win.loadURL(url.format({
			pathname: path.join(pathToLoad, 'index.html'),
			protocol: 'file:',
			slashes: true
		}));
		
	win.webContents.openDevTools();
	win.on('closed', () => {
		l.clearBuffer();		
		win = null
	});
};

var closeWin = () => app.quit();

var copyRecursive = (src, dst) => {
	let dir = fs.readdirSync(src);
	for (let i = 0; i<dir.length; i++){
		if (fs.lstatSync(src + dir[i]).isFile())
			fs.createReadStream(src + dir[i]).pipe(fs.createWriteStream(dst +"/"+ dir[i]));
		else if (fs.lstatSync(src + dir[i]).isDirectory())
			fs.mkdir(dst +"/"+dir[i], '0777', (e)=>{
				if (e) return console.log(e);
				copyRecursive((src + dir[i] + '/'), dst +"/"+ dir[i]);
			});
	}
};
var renameOneFile = (oldName, newName) => {	
	let i = 1, ext, name;
	console.log(`${currentPath}${oldName} -> ${currentPath}${newName}`);
	console.log("aqui peta")
	while(fs.lstatSync(`${currentPath}${newName}`).isFile() || fs.lstatSync(`${currentPath}${newName}`).dir()){
		newName = newName.split(".");
		ext = newName.slice(-1);
		name = newName.slice(0,-1);
		newName = `${name.join(".")}_${i}.${ext}`;
	}
	console.log(`${currentPath}${oldName} -> ${currentPath}${newName}`);
	fs.rename(`${currentPath}${oldName}`, `${currentPath}${newName}`, (err) => {if (err) console.log(err)})
};
var generateStringNewName = (files, newName, oldExt) => {
	/*
	 * Función encargada de evaluar la extensión de los archivos
	 * files [String]
	 * devuelve true si es la misma o false en caso contrario
	*/
	let ext = {},
		name = [],
		str = '',
		newFiles = []
	for (let i = 0; i<files.length; i++){
		let f = files[i];
		name = f.split(".");
		let extKey = (name.length > 1) ? name.slice(-1) : '';
		if (!ext[extKey]) ext[extKey] = [];
		ext[extKey].push(true)
		str = `${newName[0]}_${ext[extKey].length}${(extKey === oldExt) ? newName[1] : "." + extKey}`;
		newFiles.push(str)		
	}
	return newFiles;
};
var separateName = (name) => {
	/*
	 * Función encargada de determinar si el nuevo nombre introducido tiene extensión o no
	 * name: String
	 * -> [String]  con el valor del nombre y la ext por separado
	*/
	let newName = name.split("."),
		newExt = '';
	if (newName.length >=2){
		newExt = "." + newName.slice(-1);		
		newName = newName.slice(0, -1);
	}
	else{
		newName =  newName[0];
		newExt = '';
	}
	return [newName, newExt];
}

/*metodos globales*/
var loadFiles, changeDir, move, copy, initialLoad, rename;

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
		str += `<li class="folder"><img src="media/folder.jpg" draggable="true" /><p>${list['dir'][i]}</p></li>`;
	for (i in list['fil'])
		str += `<li class="file"><img src="media/file.jpg" draggable="true" /><p>${list['fil'][i]}</p></li>`;	
	return [str];
};

external.changeDir = changeDir = (name) => {
	let path = currentPath.split('/'), arr;
	currentPath = (name != homeName) ? path.slice(0, path.indexOf(name[0]) + 1).join("/") + '/' : homeDir;
	arr = (name != homeName) ? path.slice(1, path.indexOf(name[0]) + 1) : [];
	return [loadFiles()[0], arr];
};

external.move = move = (paths) => {	
	for (let i = 0; i<paths[0].length; i++){		
		fs.rename(`${currentPath}${paths[0][i]}`, `${currentPath}${paths[1]}/${paths[0][i]}`, (err) => {if (err) console.log(err);});
	}
};

external.copy = copy = (files) => {
	let path = currentPath,
		dst = path + files[1]+'/',
		src = files[0];	
	for (let i = 0; i<src.length; i++){
		if (fs.lstatSync(`${path}${src[i]}`).isFile())
			fs.createReadStream(`${path}${src[i]}`).pipe(fs.createWriteStream(`${dst}${src[i]}`));
		else if (fs.lstatSync(`${path}${src[i]}`).isDirectory()){
			fs.mkdirSync(dst+src[i], '777');
			copyRecursive((path+src[i]+'/'), dst+src[i]);
		}
	}
};

external.initialLoad = initialLoad = (option) => {
	homeDir = (!homeDir) ? l.homeDir : homeDir;	
	switch (option){
		case 'image':
			currentPath = homeDir + 'Imágenes';
			break;
		default:
			currentPath = homeDir;
	}	
	return [loadFiles()[0], currentPath.split("/").slice(1)];
};

external.rename = rename = (fls)  => {
	/*
	 *Función encargada de cambiar el nombre de los archivos
	 *fls: Array
	 *fls[0]: [String] -> Contiene la lista de archivos que se quiere renombrar
	 *fls[1]: String -> El nuevo nombre del archivo.
	 *fls[2]: Bool -> Si la ext se ha modificado
	*/	
	let files = fls[0],
		name = fls[1],
		extMod = fls[2],
		newName,
		newNames;	
	if (files.length === 1){
		renameOneFile(files[0], name);
		return [loadFiles()[0]];
	}
	newName = separateName(name);	
	newNames = generateStringNewName(files, newName, extMod);
	for (let i = 0; i<files.length;i++)
		renameOneFile(files[i], newNames[i]);	
	return [loadFiles()[0]];
}
//load plugin
l.loadModules(this, this)


var comunication = new EventServer(external);
/*eventos*/
app.on('ready', createWin);
app.on('window-all-closed', closeWin);
