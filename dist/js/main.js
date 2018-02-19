'use strict';
try{
	var EventClient = require('./../../commonModules/localEvent').Client;
} catch (e) {
console.log(e);
}
var $ = require('jquery');

//Preguntamos por los datos locales y SOLO los mostramos en la consola.
/*Variables globales*/
var isSelected, canMove = false, initX = 0, initY = 0;
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

$('body').on('dblclick', '.folder', (e)=> {
	/*
	*funcion encarga de mandar el evento necesario que determina que
	*carpeta quieren abrir
	*/
	let name = $(e.currentTarget).find('p').html();
	$('.topBar').append(`<li class="track">${name}</li>`);
	comunication.send('loadFiles', 'drawFiles', [name]);
}).on('dblclick', '.track', (e)=>{
	/*
	*Funcion encarga de enviar el evento para indicar a que carpeta del camino
	*de migas de pan generado en la topbar se quiere ir
	*/
	let name = $(e.currentTarget).html();
	console.log(`name vale: ${name}`);
	comunication.send('changeDir', 'drawFiles', [name]);
	e.stopPropagation();
}).on('mouseover', '.folder, .file', (e)=> {
	/*mostrar el texto completo de la carpeta  o archivo*/
	$(e.currentTarget).find('p').removeClass('ellipsis');
}).on('mouseout', '.folder, .file', (e)=> {
	/*volver a ocultar el texto completo de la carpeta  o archivo*/
	$(e.currentTarget).find('p').addClass('ellipsis');
}).on('click', '.folder, .file', (e)=> {
	/*
	*Esta función se encarga de:
	*seleccionar un caja o archivo con un click.
	*Cuando esta seleccionado, se puede mover dentro de .elements gracias a la
	*función que se encuentra dos debajo.
	*/
	if (!canMove){
		e.stopPropagation();
		canMove = true;
		isSelected = $(e.currentTarget);
		let x = initX = e.clientX, y = initY = e.clientY;
		isSelected.addClass('moving').css({"top": y, "left": x});
	}

}).on('click', '.folder', (e)=> {
	/*
	*Esta función se encarga de:
	*Si ya hay algo seleccionado, la carpeta en la que se hace click sirve es
	*el destino de la primera
	*/
	if (!isSelected) return;
	if (isSelected.index('.elements li') === $(e.currentTarget).index('.elements li')) return;
	e.stopPropagation();
	let o = $(e.currentTarget).offset();
	isSelected.animate({"top": o.top, "left": o.left},500, ()=> {isSelected.remove(); isSelected = false; canMove=false;});
	comunication.send('move', null, [isSelected.find('p').html(), $(e.currentTarget).find('p').html()]);
}).on('mousemove', '.elements, .elements *', (e)=> {
	/*
	*Funcion encarga de permitir el movimiento por el menú de los archivos o carpetas
	*/
	if (!canMove) return;
	e.stopPropagation();
	let x = e.clientX - isSelected.width(), y = e.clientY+50;
	console.log("se mueve!")
	isSelected.css({"top": y, "left": x});
}).on('click', '.elements', () => {
	/*
	*Función que permite la deselección de un arhivo o carpeta
	*/
	if (!canMove) return;
	canMove = false;
	isSelected.animate({"top": initY, "left": initX},500, ()=>{isSelected.removeClass('moving').removeAttr("style"); isSelected = false; canMove=false;});
});

var comunication = new EventClient(external);
comunication.send('loadFiles', 'drawFiles', '');
