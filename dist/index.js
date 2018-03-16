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
	stringFile = "",
	config = {},
	modularLibs = {},
	pathToLoad = l.pathToLoad,
	homeDir,
	trashPath = '',
	modal;



/*Declaración de las funciones globales*/
var external = this.external = {};
this.app = app;
this.BrowserWindow = BrowserWindow;
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

var copyRecursive = (files, src, dst) => {
	/*
	 * Función encargada de copiar de forma recursiva una lista de archivos
	 * files: [String] -> Contiene una lista de los nombres que se deben copiar
	 * src: String  -> La ruta a esos archivos
	 * dst: String -> La ruta de la carpeta en la que se deben copiar
	*/
	let name = '';
	for (let f of files){
		if (fs.lstatSync(`${src}${f}`).isFile()){
			name = renameOneFile(`${dst}`, f);			
			fs.createReadStream(`${src}${f}`).pipe(fs.createWriteStream(`${name}`));
		}
		else if (fs.lstatSync(`${src}${f}`).isDirectory()){			
			fs.mkdir(`${dst}${f}`, '0755', (e)=>{
				if (e) return console.error(e);
				copyRecursive(fs.readdirSync(`${src}${f}/`), `${src}${f}/`, `${dst}${f}/`);
			});
		}
	}
};
var renameOneFile = (path, newName) => {
	let ext, name, cond = true, reg = /([\wÁÉÍÓÚáéíóúÄËÏÖÜäëïöüÀÈÌÒÙàèìòù]*[\s\.]?)*_(\d*)/;	
	let i = 0;
	while(cond && i<10){		
		i++;
		try{
			fs.lstatSync(`${path}${newName}`);
		}
		catch (e){
			cond = (e.errno === -2) ?  false: true;
			continue;
		}
		newName = (typeof(newName) === 'string') ? separateName(newName) : newName;
		name = newName[0];
		ext = newName[1];				
		if (!reg.test(name)){
			newName = `${name}_1${ext}`;			
		}
		else {
			let match = name.match(reg);
			newName = `${match[1]}_${parseInt(match[2])+1}${ext}`;			
		}		
	}
	return `${path}${newName}`;
};
var generateStringNewName = (files, newName, oldExt) => {
	/*
	 * Función encargada de evaluar la extensión de los archivos
	 * files [String] -> Conjunto de archivos a cambiar
	 * newName: string ->El nombre que se desea
	 * oldExt: string -> La extensión que se quiere cambiar
	 * devuelve [String] -> con los nuevos nombres
	*/

	let ext = {},
		name = [],
		str = '',
		newFiles = [];
	for (let i = 0; i<files.length; i++){
		let f = files[i];
		name = f.split(".");
		let extKey = (name.length > 1) ? name.slice(-1)[0] : '';

		if (!ext[extKey]) ext[extKey] = [];
		ext[extKey].push(true);
		str = `${newName[0]}_${ext[extKey].length}${(extKey === oldExt) ? newName[1] : "." + extKey}`;
		newFiles.push(str)
	}	
	return newFiles;
};
var separateName = (name) => {
	/*
	 * Función encargada de determinar si el nuevo nombre introducido
	 * tiene extensión o no
	 * name: String
	 * return [String]  con el valor del nombre y la ext por separado
	*/
	
	let reg = /(.*)(\.\w*)$/,
		match = [],
		newName = '',
		ext = '';
	match = name.match(reg);
	if (!match){
		newName = name;
		ext = '';
	}
	else {
		newName = match[1];
		ext = match[2]
	}
	return [newName, ext];
};
var removeRecursive = (files, path) => {
	/*
	 * Función encargada de borrar la lista de archivos que se ha indicado
	*/
	for (let f of files){
		if (fs.lstatSync(`${path}${f}`).isFile())
			fs.unlink(`${path}${f}`, (e)=> (e) ? console.error(e) : null);
		else if (fs.lstatSync(`${path}${f}`).isDirectory()){
			removeRecursive(fs.readdirSync(`${path}${f}`), `${path}${f}/`);
			fs.rmdir(`${path}${f}`, (e) => (e.errno ===-39 ) ? removeRecursive([f],`${path}`): console.error(e));
		}
	}
};

/*metodos globales*/
var loadFiles, changeDir, move, copy, initialLoad, rename, remove, getProperties;

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
	currentPath = (name[0] !== homeName) ? path.slice(0, path.indexOf(name[0]) + 1).join("/") + '/' : homeDir;
	arr = (name != homeName) ? path.slice(1, path.indexOf(name[0]) + 1) : [];
	return [loadFiles()[0], arr];
};

external.move = move = (paths) => {	
	let files = paths[0],
		dst = (paths[1] !== 'trash') ? paths[1] : trashPath,
		name = '';
	for (let i = 0; i<files.length; i++){
		name = renameOneFile(dst, files[i]);
		fs.rename(`${currentPath}${files[i]}`, name, (err) => {if (err) console.error(err);});
	}
};
external.copy = copy = (files) => {
	let dst = currentPath + files[1]+'/',
		src = files[0];		
	copyRecursive(src, currentPath, dst);
};
external.initialLoad = initialLoad = (option) => {
	// let screen = require('electron').screen,
	// 	screenDisplay = screen.getPrimaryDisplay(),
	// 	screenAllDispaly = screen.getAllDisplays()//.workArea;
	// console.log(screenDisplay)
	// console.log("--------------")
	// console.log(screenAllDispaly)
	// // comunication.send(win, 'getScreenResolution', screen)
	homeDir = (!homeDir) ? l.homeDir : homeDir;
	pathToLoad = l.pathToLoad;
	trashPath = `${homeDir}.local/share/Trash/files/`;
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
	 *fls: [mix]
	 *fls[0]: [String] -> Contiene la lista de archivos que se quiere renombrar
	 *fls[1]: String -> El nuevo nombre del archivo.
	 *fls[2]: Bool -> Si la ext se ha modificado
	*/	
	let files = fls[0],
		name = fls[1],
		extMod = fls[2],
		newName,
		newNames,
		names = [];
	if (files.length === 1){
		name = renameOneFile(currentPath, name);
		fs.rename(`${currentPath}/${files[0]}`, name, (err) => {if (err) console.error(err)});
		return [loadFiles()[0]];
	}
	newName = separateName(name);	
	newNames = generateStringNewName(files, newName, extMod);
	for (let i = 0; i<files.length;i++){
		name = renameOneFile(currentPath, newNames[i]);
		fs.rename(`${currentPath}/${files[i]}`, name, (err) => {if (err) console.error(err)})
	}
	return [loadFiles()[0]];
};
external.remove = remove = (files) => removeRecursive(files, currentPath);
external.getProperties = getProperties = (files) => {
	modal = new l.bcknd.Modal_Main(__dirname+'/external/properties/index.html');
	fs.lstat(currentPath + files[0], (e, s) =>{
		/*console.log(s);
		//Pantalla 1
		console.log(`nombre: ${files[0]}`);
		console.log(`ruta: ${currentPath}`)
		console.log(`tamaño: ${s.size}`);
		//Pantalla 2
		console.log(`última fecha de acceso ${s.atime}`);
		console.log(`última fecha de modificación en el contendido ${s.mtime}`);
		console.log(`última fecha de modificación ${s.ctime}`);
		console.log(`Fecha de creación: ${s.birthtime}`);
		//pantalla 3
		console.log(`tipo de archivo: ${s.mode.toString(8).slice(0,3)}`);
		console.log(`permisos: ${s.mode.toString(8).slice(3)}`);*/
	modal.createModal.call(this, __dirname+'/external/properties/index.html');
	});
};
//load plugin
l.loadModules(this, this)

var comunication = new EventServer(external);
/*eventos*/
app.on('ready', createWin);
app.on('window-all-closed', closeWin);
