'use strict';

var EventClient = require('./../../commonModules/localEvent').Client;

var $ = require('jquery');


//Preguntamos por los datos locales y SOLO los mostramos en la consola.
/*Variables globales*/
var canMove = false, /*initX = 0, initY = 0,*/ ctrlPress = false, selected = {"file": [], "folder": []};
/*metodos globales*/
var drawFiles
/*modulos externos*/
var external = {};

external.drawFiles = drawFiles = (args) => {
	/*Lista los archivos y carpetas que hay en ese direcorio*/
	let str = args[0];

	$('main ul').html(str);
	/*Cambia el menú de navegación */
	//console.log(args[0][1])
	if (args.length >=2){
		console.log(args[1])
		str = '<li class="track">Carpeta Personal</li>';
		let path = args[1];
		for (var i=2; i< path.length;i++)
			str +=`<li class="track">${path[i]}</li>`;
		$('.topBar').html(str);
	}
};

/*metodos locales llamados por eventos*/
var goInto = (e)=> {
	/*
	*funcion encarga de mandar el evento necesario que determina que
	*carpeta quieren abrir
	*/
	let name = $(e.currentTarget).find('p').html();
	$('.topBar').append(`<li class="track">${name}</li>`);
	comunication.send('loadFiles', 'drawFiles', [name]);
};
var goFolderTopBar = (e)=>{
	/*
	*Funcion encarga de enviar el evento para indicar a que carpeta del camino
	*de migas de pan generado en la topbar se quiere ir
	*/
	let name = $(e.currentTarget).html();
	console.log(`name vale: ${name}`);
	comunication.send('changeDir', 'drawFiles', [name]);
	e.stopPropagation();
};
var showName = (e)=> {
	/*mostrar el texto completo de la carpeta  o archivo*/
	$(e.currentTarget).find('p').removeClass('ellipsis');
};
var hideName = (e)=> {
	/*volver a ocultar el texto completo de la carpeta  o archivo*/
	$(e.currentTarget).find('p').addClass('ellipsis');
};
var selected_function = (e)=> {
	/*
	*Esta función se encarga de:
	*seleccionar un caja o archivo con un click.	
	*/
	// if (!ctrlPress) selected = 
	if (!canMove){
		e.stopPropagation();
		canMove = true;
		let type = $(e.currentTarget).attr("class");
		selected[type].push($(e.currentTarget));
		//let x = initX = e.clientX, y = initY = e.clientY;
		$(e.currentTarget).addClass('selected');
		console.log("algo")
	}
};
var sentTo = (e)=> {
	/*
	*Esta función se encarga de:
	*Si ya hay algo seleccionado, la carpeta en la que se hace click es
	*el destino de la primera
	*/
	return;
	if (!isSelected) return; 	
	if (isSelected.index('.elements li') === $(e.currentTarget).index('.elements li')) return;
	e.stopPropagation();
	let o = $(e.currentTarget).offset(),
		acction = (ctrlPress) ? "copy" : "move"
	isSelected.animate({"top": o.top, "left": o.left},500, ()=> {isSelected.remove(); isSelected = false; canMove=false;});
	comunication.send(acction, null, [isSelected.find('p').html(), $(e.currentTarget).find('p').html()]);
};
var moveSpace = (e)=> {
	/*
	*Funcion encarga de permitir el movimiento por el menú de los archivos o carpetas
	*/
	return;
	if (!canMove) return; 
	e.stopPropagation();
	let x = e.clientX - isSelected.width(), y = e.clientY+50;
	console.log("se mueve!")
	isSelected.css({"top": y, "left": x});
};
var unselect = (e) => {
	/*
	*Función que permite la deselección de un arhivo o carpeta
	*/
	if (!canMove) return;
	canMove = false;
	for (let f in selected){
		for (let i = selected[f].length-1; i>=0; i--){
			$(selected[f][i]).removeClass("selected");
			selected[f].pop();
		}
	}
	console.log(selected)
};
var pressKey = (e)=> {ctrlPress = (e.keyCode === 17) ? true : false; };
var keyUp = (e)=>  {if (e.keyCode === 17) ctrlPress = false;}


$('body')
.on('dblclick', '.folder', goInto)
.on('dblclick', '.track', goFolderTopBar)
.on('mouseover', '.folder, .file', showName)
.on('mouseout', '.folder, .file', )
.on('click', '.folder, .file', selected_function)
.on('click', '.folder', sentTo)
.on('mousemove', '.elements, .elements *', moveSpace)
.on('click', '.elements', unselect)
.on('keydown', pressKey)
.on('keyup', keyUp);	

var comunication = new EventClient(external);
comunication.send('loadFiles', 'drawFiles', '');
