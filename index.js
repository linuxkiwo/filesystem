'use strict';
/*Importación de módulos */

const {app, BrowserWindow } = require('electron');
//const { ipcMain } = require('electron');
const fs = require('fs')
const path = require('path');
const url = require('url');
const { exec } = require('child_process');

var EventServer = require('../commonModules/localEvent').Server;


/* Declaración de variables globales */
var win, currentPath, dirList, currentFiles;
/*Declaración de los metodos que se tengan que emplear fuera*/
/*Declaración de las funciones globales*/
var createWin, closeWin, loadFiles, changeDir;
var external = {};


exec('echo $USER', (err, stdout, stderr) => {
    currentPath = `/home/${stdout}/`.replace('\n', '');
});


createWin = () => {
    win = new BrowserWindow({ width: 800, height: 600, menu: false });
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
    currentFiles = {dir: [], fil: []};
    var listDir = fs.readdirSync(currentPath);
    for (let i of listDir){
        if (i.search(/^\./) !== -1)
            continue;
        else if (fs.lstatSync(`${currentPath}/${i}`).isDirectory())
            currentFiles['dir'].push(i);
        else if (fs.lstatSync(`${currentPath}/${i}`).isFile())
            currentFiles['fil'].push(i);
    }
    return [currentFiles];
};

external.changeDir = changeDir = (name) =>{
        let path = currentPath.split('/');
        currentPath = path.slice(0, path.indexOf(name[0])+1).join("/")+'/';
        return [loadFiles()[0], path.slice(1, path.indexOf(name[0])+1)];
};


var comunication = new EventServer(external);


app.on('ready', createWin);
app.on('window-all-closed', closeWin);
