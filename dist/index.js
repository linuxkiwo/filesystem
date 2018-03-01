'use strict';
/*Importación de módulos */

const { app, BrowserWindow } = require('electron');
const fs = require('fs')
const path = require('path');
const url = require('url');
const { exec } = require('child_process');

const EventServer = require('../commonModules/localEvent').Server;

/*constantes globales*/
const ConfigPath = __dirname + '/../commonModules/config.json';
const ProgramName = "fileSystem";

/*Variables globales*/
var win,
	currentPath,
	dirList,
	currentFiles,
	homeName = "Carpeta personal",
	homeDir,
	stringFile = "",
	config = {},
	modularLibs = {};

/*
exec('echo $USER', (err, stdout, stderr) => {
	homeDir=`/home/${stdout}/`.replace('\n', '');
});
*/
/*
(()=>{
	if (process.argv.length <=2) return;
	else console.log(process.argv.length);
	let demand = process.argv[2];
	let data = fs.readFileSync(__dirname+ '/dist/index.html', 'utf-8');
	stringFile =  data.replace('</head>', `<link rel="stylesheet" href="css/lib/${demand}.css"></head>`)replace('</body>', `<script src="js/lib/${demand}.js" charset="utf-8" type="text/javascript"></script></body>`);
	fs.writeFileSync(__dirname+ '/dist/buffer/index.html', stringFile, 'utf-8');
	modularLibs[demand] = (!process.argv[3]) ? "Render" : (process.argv[3] !== "null") ? process.argv[3] : "" ;
	console.log(modularLibs[demand]);
	var str = "";
	for (let o in modularLibs)
		if (modularLibs[o] !== "")
			str += `var { ${modularLibs[o]} } = require('${o}')`;
		else
			str += `var ${o} = require('${o}')`;
	
	fs.readFile(__dirname+ '/dist/js/main.js', 'utf-8', (err, data) => {
		var l = data.match(/[#][{]\w*[}]/g);		
	});

})();
*/

/*Declaración de las funciones globales*/
var external = {};
/*metodos locales*/
/*
var loadApp = () => {
	/*
	 *Esta función se encarga:
	 * -Cargar el fichero de cofiguración
	 * -Generar los string con todos los modulos
	 *  que se tienen que importar según los plugins que tenga el usuario o
	 *  según que se reciva por argumento al llamar al programa.
	 *
	 * -Cuando genere los script mueve todos los archivos a la carpeta de .buffer
	 *  para cuando se cierre la app borrarlos y nunca afectar a los archivos
	 *  orifinales
	*

	fs.readFile(ConfigPath, 'utf-8', (err, data)=>{
		if (err) return console.log(err);
		let filesToReplace = ['index.html', 'js/main.js']
		this.css = ''; this.js = '';
		config = JSON.parse(data);
		//Primero cargamos el nombre del usuario
		homeDir=`/home/${config["name"]}/`;
		//Se crea una replica de dist en .buffer	



		//Si css es distinto a false se guarda en css todas las rutas que tenga
		if (config[ProgramName]["style"]) {
			for (let s of config[ProgramName]["style"])
				this.css += `<link rel="stylesheet" href="css/${s}">`;
		}
		//Después se mira si tiene algún plugin y si lo tiene que cargar
		for (let o of config[ProgramName]["pluggins"]) {
			if(!o["load_default"]) continue;
			if (o["difference_between_front_and_back"]){
				let name = (o["difference_between_front_and_back"] === true) ? "{Render}" : "{ " + o["difference_between_front_and_back"][1] + "}";  
				this.js += `const ${name} = require('${o["name"]}');`;
			}
			else
				js += `const ${o["name"]} = require('${o["name"]}');`;
			if (o["style"])
				for (let s of o["style"])
				this.css += `<link rel="stylesheet" href="../node_modules/${s}.css">`
		}
		//Actualizamos los archivos de la lista replicando la misma estructura que hay en dist, dentro de buffer 
		for (let f of filesToReplace)
			fs.readFile(`dist/${f}`, 'utf-8', (err, data) => {
				let change = data.match(/[#][{](\w*)[}]/)[0],
					par = change.replace('#{', '').replace('}', '');
				data = data.replace()
				data = data.replace(change, this[par]);
				try {
					fs.mkdirSync(`.buffer/`);
				}catch(e){console.log(e)}
				fs.mkdir(`.buffer/${f.split('/')[0]}`, (e) =>{
					if (e) return console.log(e);
					fs.writeFileSync(`.buffer/${f.split('/')[0]}`, data);
				});
			});
	});
};

loadApp();
var createWin = () => {
	win = new BrowserWindow({ width: 800, height: 600, menu: false });
	if (stringFile === ""){
		win.loadURL(url.format({
			pathname: path.join(__dirname, 'dist/index.html'),
			protocol: 'file:',
			slashes: true
		}));
		console.log("opt 1")
	}
	else{
		win.loadURL(url.format({
			pathname: path.join(__dirname, 'dist/index_tmp.html'),
			protocol: 'file:',
			slashes: true
		}));
		console.log("opt 2")
	}
	win.webContents.openDevTools();
	win.on('closed', () => {
			fs.unlink(__dirname+ '/dist/index_tmp.html', (err) =>{
				if (err) return console.log(err);
				return console.log("se ha borrado");
			});
		console.log("nos cierran? :(")
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
*/
/*metodos globales*/
var loadFiles, changeDir, move, copy;

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
		str += `<li class="folder"><img src="media/folder.jpg" draggable="true"><p>${list['dir'][i]}</p></li>`;
	for (i in list['fil'])
		str += `<li class="file"><img src="media/file.jpg" draggable="true"><p>${list['fil'][i]}</p></li>`;
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
}

external.initialLoad = (option) => {
	switch (option){
		case 'image':
			currentPath = homeDir + 'Imágenes';
			break;
		default:
			currentPath = homeDir;
	}
	return [loadFiles()[0], currentPath.split("/").slice(1)]
};

var comunication = new EventServer(external);
/*eventos*/
//app.on('ready', createWin);
app.on('window-all-closed', closeWin);
