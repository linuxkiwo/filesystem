'use strict';
/*librerias*/
var EventClient = require('./../../commonModules/localEvent').Client;
var $ = require('./../../commonModules/jquery');
#{js}
/*Variables globales*/
var mainScope = {};
mainScope.ctrlPress = false,
mainScope.isCopping = false,
mainScope.selected = {"file": [], "folder": []},
mainScope.toCopy = {"file": [], "folder": []},
mainScope.mapKey = {}
mainScope.currentPath = ''

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
		mainScope.currentPath = path.join("/");
		for (var i=2; i< path.length;i++)
			str +=`<li class="track">${path[i]}</li>`;
		$('.topBar').html(str);
	}
};

/*metodos locales*/
mainScope.unselectOne = (name) => {
	/*
	 *Metodo encargado de borrar de la lista de elementos seleccionados
	 *uno de los elementos. Para ello busca cual tiene el mismo texto,
	 *es decir, el nombre del archivo y cuando lo encuentra, borra el
	 *el indice que tenga de la lista y le quita el inidicativo de estar
	 *seleccionado
	*/
	for (let f in mainScope.selected)
		for (let i =0;i<mainScope.selected[f].length; i++)
			if ($(mainScope.selected[f][i]).find("p").html() === name){
				$(mainScope.selected[f][i]).removeClass("selected")
				mainScope.selected[f].splice(i, i);
				return null;
			}
};
mainScope.deleteRenderMove = (toDel) => {
	/*
	 *Función que permite la desaparición de los arhivo o carpeta una vez movidos o borrados
	*/		
	for (let f in toDel){
		for (let i = toDel[f].length-1; i>=0; i--){
			$(toDel[f][i]).remove();
			toDel[f].pop();
		}
	}
};
mainScope.evalKeyMap = () =>{
	if (mainScope.mapKey[17] && mainScope.mapKey[67]){ //press cntrl +c
		mainScope.toCopy = Object.assign({}, mainScope.selected);
		mainScope.isCopping = true;		
	}
	else if (mainScope.mapKey[17] && mainScope.mapKey[86]){ // press cntl +v
		let dst = $(mainScope.selected['folder'][0]).find("p").html();		
		mainScope.sentTo(dst, mainScope.toCopy);
	}
	else if (mainScope.mapKey[17] && mainScope.mapKey[88]){ // press cntl +x
		mainScope.toCopy = Object.assign({}, mainScope.selected);
		mainScope.isCopping = false;
	}
	console.log(mainScope.isCopping)
}
mainScope.sentTo = (dst, src = mainScope.selected)=> {
	/*
	 *Esta función se encarga de:
	 *Si ya hay algo seleccionado, la carpeta en la que se hace click es
	 *el destino de la primera.
	 *Si la tecla cntrl está pulsada, se copian dentro de la carpeta,
	 *Si está sin pulsar, se mueven
	*/
	let toCopy = [],
		acction = (mainScope.isCopping) ? "copy" : "move";
	console.log(acction);
	console.log(mainScope.isCopping);
	for (let f in src)
		for (let i = 0; i<src[f].length; i++){
			toCopy.push($(src[f][i]).find("p").html())
		}
	comunication.send(acction, null, [toCopy, dst]);
	if (acction === "move")
		mainScope.deleteRenderMove(src)
};

/*metodos locales llamados por eventos*/
mainScope.goInto = (e)=> {
	/*
	 *funcion encarga de mandar el evento necesario que determina que
	 *carpeta quieren abrir
	*/
	let name = $(e.currentTarget).find('p').html();
	mainScope.currentPath += "/"+name;
	$('.topBar').append(`<li class="track">${name}</li>`);
	mainScope.selected = {"file": [], "folder": []};
	comunication.send('loadFiles', 'drawFiles', [name]);
};
mainScope.goFolderTopBar = (e)=>{
	/*
	 *Funcion encarga de enviar el evento para indicar a que carpeta del camino
	 *de migas de pan generado en la topbar se quiere ir
	*/
	e.stopPropagation();
	let name = $(e.currentTarget).html();
	comunication.send('changeDir', 'drawFiles', [name]);
};
mainScope.showName = (e)=> {
	/*mostrar el texto completo de la carpeta  o archivo*/
	$(e.currentTarget).find('p').removeClass('ellipsis');
};
mainScope.hideName = (e)=> {
	/*volver a ocultar el texto completo de la carpeta  o archivo*/
	$(e.currentTarget).find('p').addClass('ellipsis');
};
mainScope.select = (e)=> {
	/*
	 *Esta función se encarga de:
	 *seleccionar o deseleccionar carpeta o archivos
	*/
	e.stopPropagation();
	// si no está pulsado cntr y no se está arrastrando, se deselecciona
	if (!mainScope.ctrlPress && e.originalEvent.type !== "dragstart") mainScope.unselect();
	// Si el elemento ya estába se seleccionado, se sale de la función deseleccionado el elemento
	if ($(e.currentTarget).attr("class").search("selected") !== -1)
		return mainScope.unselectOne($(e.currentTarget).find("p").html());
	//la clase indica si se trata de una carpeta o un archivo
	let type = $(e.currentTarget).attr("class").split(" ")[0];
	mainScope.selected[type].push($(e.currentTarget));
	$(e.currentTarget).addClass('selected');
};
mainScope.onDrag = (e) => {
	/*
	 *Función encargada de posicionar en un lugar concreto los elementos seleccionados
	*/
	let x = e.clientX, y = e.clientY;
	for (let f in mainScope.selected)
		for (let i = 0; i< f.length; i++)
			$(mainScope.selected[f][i]).addClass("moving").css({"top": y+50, "left": x-50});
};
mainScope.endDrag = (e) => {	
	/*
	 *Función encargada de determinar la posicón que han de tomar los elementos arrastrados
	*/	
	let x = e.clientX, y = e.clientY;
	for (let f in mainScope.selected)
		for (let i = 0; i< f.length; i++)
			$(mainScope.selected[f][i]).css({"top": y, "left": x+i*$(mainScope.selected[f][i]).width()});
	mainScope.unselect();	
};
mainScope.endDrop = (e) =>{
	/*
	 *Metodo encargado de determinar si se ha soltado en un carpeta o archivo
	 *distinto a  los seleccionados. Cuando encuentre una coincidencia se sale
	 *ya que implica que no se quiere copiar o mover el/los archivos selecionados
	 *Se trata de una función de prevención. No debería encontrar nunca una coincidencia
	*/
	e.preventDefault();
	for (let f in mainScope.selected)
		for (var i = 0; i< f.length; i++)
			if ($(e.currentTarget).index("ul li") === $(mainScope.selected[f][i]).index("ul li"))
				return;
	if (mainScope.ctrlPress) mainScope.isCopping = true;
	mainScope.sentTo($(e.currentTarget).find("p").html())
};
mainScope.unselect = () => {
	/*
	 *Función que permite la deselección de un arhivo o carpeta
	*/		
	for (let f in mainScope.selected){
		for (let i = mainScope.selected[f].length-1; i>=0; i--){
			$(mainScope.selected[f][i]).removeClass("selected");
			//selected[f].pop();
		}
	}	
	mainScope.selected = {"file": [], "folder": []};
};
mainScope.pressKey = (e)=> {
	mainScope.ctrlPress = (e.keyCode === 17) ? true : false;	
	mainScope.mapKey[e.keyCode] = true;
	mainScope.evalKeyMap();
};
mainScope.keyUp = (e)=>  {
	if (e.keyCode === 17) mainScope.ctrlPress = false;
	mainScope.mapKey[e.keyCode] = false;	
};

/*control de eventos*/
$('body')
.on('dblclick', '.folder', mainScope.goInto)
.on('dblclick', '.track', mainScope.goFolderTopBar)
.on('mouseover', '.folder, .file', mainScope.showName)
.on('mouseout', '.folder, .file', mainScope.hideName)
.on('click', '.folder, .file', mainScope.select)
.on('dragstart', '.folder, .file', mainScope.select)
.on('drag', '.folder, .file', mainScope.onDrag)
.on('dragend', '.folder, .file', mainScope.endDrag)
.on('dragover', '.folder, .file', (e)=>{e.preventDefault();})
.on('drop', '.folder, file', mainScope.endDrop)
.on('click', '.elements', mainScope.unselect)
.on('keydown', mainScope.pressKey)
.on('keyup', mainScope.keyUp);	

var comunication = new EventClient(external);
comunication.send('initialLoad', 'drawFiles', '');
