'use strict';
/*Importación de módulos */

const { app, BrowserWindow } = require('electron');
const fs = require('fs')
const path = require('path');
const url = require('url');
const { exec } = require('child_process');

const EventServer = require('../commonModules/localEvent').Server;

/*Variables globales*/
var win, currentPath, dirList, currentFiles, homeName = "Carpeta personal", homeDir, stringFile = "";

exec('echo $USER', (err, stdout, stderr) => {
	currentPath = homeDir=`/home/${stdout}/`.replace('\n', '');
});
(()=>{
	if (process.argv.length <=2) return;
	else console.log(process.argv.length)
	let demand = process.argv[2];
	let data = fs.readFileSync(__dirname+ '/dist/index.html', 'utf-8');
	stringFile =  data.replace('</head>', `<link rel="stylesheet" href="css/lib/${demand}.css"></head>`).replace('</body>', `<script src="js/lib/${demand}.js" charset="utf-8" type="text/javascript"></script></body>`);
	fs.writeFileSync(__dirname+ '/dist/index_tmp.html', stringFile, 'utf-8');

})();


/*Declaración de las funciones globales*/
var external = {};
/*metodos locales*/


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
		try{
			fs.unlink(__dirname+ 'dist/index_tmp.html')
		}catch(e){};
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
	return alert("ahora intenta pulsar control");
	for (let i = 0; i<paths[0].length; i++){		
		fs.rename(`${currentPath}${paths[0][i]}`, `${currentPath}${paths[1]}/${paths[0][i]}`, (err) => {console.log(err);});
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

var comunication = new EventServer(external);
/*eventos*/
app.on('ready', createWin);
app.on('window-all-closed', closeWin);
