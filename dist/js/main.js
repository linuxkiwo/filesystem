'use strict';
/*librerias*/
var EventClient = require('./../../commonModules/localEvent').Client;
var $ = require('./../../commonModules/jquery');

/*Variables globales*/
var ctrlPress = false,
	isCopping = false,
	selected = {"file": [], "folder": []},
	toCopy = {"file": [], "folder": []},
	mapKey = {}

/*modulos externos*/
var external = {};

external.drawFiles = (args) => {
	/*Lista los archivos y carpetas que hay en ese direcorio*/
	let str = args[0];
	$('main ul').html(str);
	/*Cambia el menú de navegación */	
	if (args.length >=2){
		console.log(args[1])
		str = '<li class="track">Carpeta Personal</li>';
		let path = args[1];
		for (var i=2; i< path.length;i++)
			str +=`<li class="track">${path[i]}</li>`;
		$('.topBar').html(str);
	}
};

/*metodos locales*/
var unselectOne = (name) => {
	/*
	 *Metodo encargado de borrar de la lista de elementos seleccionados
	 *uno de los elementos. Para ello busca cual tiene el mismo texto,
	 *es decir, el nombre del archivo y cuando lo encuentra, borra el
	 *el indice que tenga de la lista y le quita el inidicativo de estar
	 *seleccionado
	*/
	for (let f in selected)
		for (let i =0;i<selected[f].length; i++)
			if ($(selected[f][i]).find("p").html() === name){
				$(selected[f][i]).removeClass("selected")
				selected[f].splice(i, i);
				return null;
			}
};
var deleteRenderMove = () => {
	/*
	 *Función que permite la desaparición de los arhivo o carpeta una vez movidos o borrados
	*/		
	for (let f in selected){
		for (let i = selected[f].length-1; i>=0; i--){
			$(selected[f][i]).remove();
			selected[f].pop();
		}
	}
};
var evalKeyMap = () =>{
	if (mapKey[17] && mapKey[67]){ //press cntrl +c
		toCopy = Object.assign({}, selected);
		isCopping = true;		
	}
	else if (mapKey[17] && mapKey[86]){ // press cntl +v
		let src = $(selected['folder'][0]).find("p").html();		
		sentTo(src, toCopy);
	}
	else if (mapKey[17] && mapKey[88]) // press cntl +x
		toCopy = Object.assign({}, selected);
		isCopping = false;
}
var sentTo = (dst, src = selected)=> {
	/*
	 *Esta función se encarga de:
	 *Si ya hay algo seleccionado, la carpeta en la que se hace click es
	 *el destino de la primera.
	 *Si la tecla cntrl está pulsada, se copian dentro de la carpeta,
	 *Si está sin pulsar, se mueven
	*/
	let toCopy = [],
		acction = (ctrlPress || isCopping) ? "copy" : "move"	
	for (let f in src)
		for (let i = 0; i<src[f].length; i++){
			toCopy.push($(src[f][i]).find("p").html())
		}
	comunication.send(acction, null, [toCopy, dst]);
	if (acction === "move")
		deleteRenderMove()
};

/*metodos locales llamados por eventos*/
var goInto = (e)=> {
	/*
	 *funcion encarga de mandar el evento necesario que determina que
	 *carpeta quieren abrir
	*/
	let name = $(e.currentTarget).find('p').html();
	$('.topBar').append(`<li class="track">${name}</li>`);
	selected = {"file": [], "folder": []};
	comunication.send('loadFiles', 'drawFiles', [name]);
};
var goFolderTopBar = (e)=>{
	/*
	 *Funcion encarga de enviar el evento para indicar a que carpeta del camino
	 *de migas de pan generado en la topbar se quiere ir
	*/
	e.stopPropagation();
	let name = $(e.currentTarget).html();
	comunication.send('changeDir', 'drawFiles', [name]);
};
var showName = (e)=> {
	/*mostrar el texto completo de la carpeta  o archivo*/
	$(e.currentTarget).find('p').removeClass('ellipsis');
};
var hideName = (e)=> {
	/*volver a ocultar el texto completo de la carpeta  o archivo*/
	$(e.currentTarget).find('p').addClass('ellipsis');
};
var select = (e)=> {
	/*
	 *Esta función se encarga de:
	 *seleccionar o deseleccionar carpeta o archivos
	*/
	e.stopPropagation();
	// si no está pulsado cntr y no se está arrastrando, se deselecciona
	if (!ctrlPress && e.originalEvent.type !== "dragstart") unselect();
	// Si el elemento ya estába se seleccionado, se sale de la función deseleccionado el elemento
	if ($(e.currentTarget).attr("class").search("selected") !== -1)
		return unselectOne($(e.currentTarget).find("p").html());
	//la clase indica si se trata de una carpeta o un archivo
	let type = $(e.currentTarget).attr("class").split(" ")[0];
	selected[type].push($(e.currentTarget));
	$(e.currentTarget).addClass('selected');
};
var onDrag = (e) => {
	/*
	 *Función encargada de posicionar en un lugar concreto los elementos seleccionados
	*/
	let x = e.clientX, y = e.clientY;
	for (let f in selected)
		for (let i = 0; i< f.length; i++)
			$(selected[f][i]).addClass("moving").css({"top": y+50, "left": x-50});
};
var endDrag = (e) => {	
	/*
	 *Función encargada de determinar la posicón que han de tomar los elementos arrastrados
	*/	
	let x = e.clientX, y = e.clientY;
	for (let f in selected)
		for (let i = 0; i< f.length; i++)
			$(selected[f][i]).css({"top": y, "left": x+i*$(selected[f][i]).width()});
	unselect();	
};
var endDrop = (e) =>{
	/*
	 *Metodo encargado de determinar si se ha soltado en un carpeta o archivo
	 *distinto a  los seleccionados. Cuando encuentre una coincidencia se sale
	 *ya que implica que no se quiere copiar o mover el/los archivos selecionados
	 *Se trata de una función de prevención. No debería encontrar nunca una coincidencia
	*/
	e.preventDefault();
	for (let f in selected)
		for (var i = 0; i< f.length; i++)
			if ($(e.currentTarget).index("ul li") === $(selected[f][i]).index("ul li"))
				return 
	sentTo($(e.currentTarget).find("p").html())
};
var unselect = () => {
	/*
	 *Función que permite la deselección de un arhivo o carpeta
	*/		
	for (let f in selected){
		for (let i = selected[f].length-1; i>=0; i--){
			$(selected[f][i]).removeClass("selected");
			//selected[f].pop();
		}
	}	
	selected = {"file": [], "folder": []};
};
var pressKey = (e)=> {
	ctrlPress = (e.keyCode === 17) ? true : false;	
	mapKey[e.keyCode] = true;
	evalKeyMap();
};
var keyUp = (e)=>  {
	if (e.keyCode === 17) ctrlPress = false;
	mapKey[e.keyCode] = false;	
};

/*control de eventos*/
$('body')
.on('dblclick', '.folder', goInto)
.on('dblclick', '.track', goFolderTopBar)
.on('mouseover', '.folder, .file', showName)
.on('mouseout', '.folder, .file', hideName)
.on('click', '.folder, .file', select)
.on('dragstart', '.folder, .file', select)
.on('drag', '.folder, .file', onDrag)
.on('dragend', '.folder, .file', endDrag)
.on('dragover', '.folder, .file', (e)=>{e.preventDefault();})
.on('drop', '.folder, file', endDrop)
.on('click', '.elements', unselect)
.on('keydown', pressKey)
.on('keyup', keyUp);	

var comunication = new EventClient(external);
comunication.send('loadFiles', 'drawFiles', '');
