'use strict';
/*Importación de módulos */
const { app, BrowserWindow } = require('electron');
const fs = require('fs')
const path = require('path');
const url = require('url');
const { exec } = require('child_process');

const EventServer = require('../../commonModules/localEvent').Server;
const LoadApp = require('loadapp');
const CSV = require('csv_to_json');

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
	modal,
	csv;




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
var formatDate = (date) =>{
	let d = new Date(date),
		form = d.toISOString().split("T"),
		day = form[0],
		time = form[1].split(".")[0];
	return `${day} ${time}`;
};
var getFileInfo = (x) => {
	/*
	 * Esta función se encarga de gestionar la información del inodo
	 * tipo de inodo, permisos, etc...
	 * La información de la que se extrae que significa cada número
	 * se ha obtenido de https://github.com/nodejs/node-v0.x-archive/issues/3045
	 * x:Number -> número que contiene la información del inodo.
	 * return [multiple] String (tipo de archivo) Int (permisos)
	*/
	let type, permission;
	type = ((a)=>{
		a.toString();
		switch (a){
			case '40':
				return 'Carpeta';
				break;
			case '100':
				return 'file';
				break;
			case '120':
				return 'symlink';
				break;
			default:
				return "";
		}
	})(x.slice(0, -3));;
	permission = x.slice(-3);
	return [type, permission]
};
var readcsv = (code) => {
	/*
	 * Función encargada de leer los archivos en los que se indican
	 * los usuarios con sus códigos y los grupos con sus códigos
	 * code:[Int]
	 * code[0] -> Id del user al que pertence el archivo
	 * code[1] -> Id del grupo al que pertence el archivo
	*/
	csv = new CSV({delimeter: ":"});
	var files = ['passwd', 'group', 'passwd', 'group'],
		search = ['userName', 'groupName', 'userName', 'groupName'],
		matching = ['userid', 'groupid', 'userid', 'groupid'],
		toReturn = [],
		objective = {};
	for (let i in code){
		objective = {};
		let toSearch = code[i].toString();
		objective[matching[i]] = toSearch
		let content = fs.readFileSync(`/home/lucas/Documentos/universidad/TFG/electron/DE_v2/commonModules/${files[i]}`, 'utf-8'),
			column = (i %2== 0) ? ['userName', 'password', 'userid', 'groupid', 'userid_info', 'homedirectory', 'shell'] :  ['groupName', 'password', 'groupid', 'grouplist'],
			obj = csv.parserObj(content, column),
			match = csv.search([search[i]], objective, obj);
		if (match.length === 1)
			toReturn.push(match[0][search[i]]);
		else{
			let arr = [];

			for (let m in match){
				arr.push(match[m][search[i]]);
			}
			toReturn.push(arr);
		}
	 }
	 return toReturn;
};

/*metodos globales*/

var loadFiles, changeDir, move, copy, initialLoad, rename, remove, getProperties, updateName, prepareToChangeName, changePermissions;

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
	let data = {};
	fs.lstat(currentPath + files[0], (e, s) =>{	
		//Pantalla 1
		let ownGroup = readcsv([s.uid, s.gid, '\\d{4}','\\d{4}']);
		data.name = files[0];
		data.path = currentPath;
		data.size = s.size.toString();		
		//Pantalla 2
		data.lastView = formatDate(s.atime);
		data.lastConMod = formatDate(s.mtime);
		data.lastConMod = formatDate(s.birthtime);
		//pantalla 3
		data.type = getFileInfo(s.mode.toString(8))[0];
		data.permission = getFileInfo(s.mode.toString(8))[1].split("");
		data.pathFile = currentPath + files[0];
		data.own = ownGroup[0];
		data.group = ownGroup[1];
		data.owns = ownGroup[2];
		data.groups = ownGroup[3];
		modal.createModal.call(this, data);
	});
};
external.updateName = updateName =(name) => comunication.send(win, 'changeName', name);
external.prepareToChangeName = prepareToChangeName = (file) => {
	/*
	 * Esta función se encarga de preparar el cambio de nombre en el sistema
	 * file[String]
	 * file[0] -> contiene la ruta al archivo
	 * file[1] -> contiene el nombre del archivo viejo
	 * file[2] -> contiene el nombre nuevo del archivo
	*/
	let path = currentPath,
		fls = [[file[1]],file[2], false],
		toReturn;	
	currentPath = file[0];
	toReturn = rename(fls);
	currentPath = path;
	return toReturn;
};
external.changePermissions = changePermissions = (file) => {
	/*
	 * Esta función se encarga de cambiar los permisos de un archivo
	 * file[String]
	 * file[0] -> contiene la ruta al archivo
	 * file[1] -> contiene el nombre del archivo viejo
	 * file[2] -> contiene los permisos
	*/
	
	fs.chmod(`${file[0]}${file[1]}`, file[2], (e) => (e)? console.error(e):null);
};
//load plugin
l.loadModules(this, this)

var comunication = new EventServer(external);
/*eventos*/
app.on('ready', createWin);
app.on('window-all-closed', closeWin);
