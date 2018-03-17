const $ = require('jquery');
const Whatch = require('watcher');
var EventClient = require('localEvent').Client;
/*Variables globales*/
var modalScope = {};
modalScope.body = $('body');
modalScope.cat = modalScope.body.find('ul');
modalScope.cats = modalScope.cat.find('li');
modalScope.main = modalScope.body.find('main');
modalScope.inputName = modalScope.main.find("input.name");
modalScope.inputPermissions = modalScope.main.find("input[type=number]");
modalScope.inputText = modalScope.main.find(".permission");
modalScope.pathFile = "#{path}";
modalScope.nameFile = "#{name}";
modalScope.permissionCode = {
    	"property": #{permission[0]},
    	"groups":  #{permission[1]},
    	"others" : #{permission[2]}
};
external = {}
var modalScopeWatch = new Whatch (modalScope.permissionCode);

/*funciones generales*/
modalScope.updatePermissions = (toChange = "text") => {
	let p = 'xwr',
		v = 0,
		str = ["","",""],
		input;
	for (let g in modalScope.permissionCode){
		o = modalScope.permissionCode[g];
		bin = modalScope.decimalToBinary(o);
		bin = bin.split("").reverse().join("");		
		console.log(bin)
		input = $(modalScope.inputText[v+1]).find('input');
		for (let i in p){
			console.log(p.length-i)
			$(input[p.length-i-1]).prop("checked", (bin[i] === "1"))
			// str[v] = (bin[i] === "1") ? p[i]+str[v]  : "_"+str[v];
		}
		$(modalScope.inputPermissions[v]).val(o)
		// $(modalScope.inputText[v]).text(str[v]);
		v++;
	};
};
modalScope.decimalToBinary = (x) => {
	let str  ="",
		bin = 0,
		t = 0
	x = parseInt(x)	
	while (x>0){
		bin = x%2;		
		str = bin+str;
		x = parseInt(x/2);		
	}
	t = (parseInt(str.length/8)+1)* 8
	console.log("t vale: "+t)
	while (str.length<t)
		str = '0'+str;
	return str;
};
/*funciones lanzadas por eventos*/
modalScope.changeCat = (e) => {
    let catNum = $(e.currentTarget).index('ul li');
    modalScope.cat.attr("class", `cat${catNum+1}`);
    modalScope.main.attr("class", `cat${catNum+1}`);
};
modalScope.updatePermissionsInput = (e)=>{
	let code = $(e.currentTarget).val();
	let ind = $(e.currentTarget).index("input[type=number]");
	let keys = Object.keys(modalScope.permissionCode);
	modalScope.permissionCode[keys[ind]] = code;
};
modalScope.updateName = (e) => {
	if (e.which === 13) // enter
		return $(e.currentTarget).blur();
	comunication.send('updateName', null, $(e.currentTarget).val());
}
modalScope.changeName = (e) => {
	let newName = $(modalScope.inputName).val();
	if (modalScope.nameFile === newName) return null;
	console.log(modalScope.nameFile) 
	console.log(newName) 
	comunication.send('prepareToChangeName', null, [modalScope.pathFile, modalScope.nameFile, newName]);
	modalScope.nameFile = newName;
}
modalScope.updatePermissionsCheck = (e) => {
	let toCheck = $(e.currentTarget).parent().find('input'),
		key = 0,
		ind = $(e.currentTarget).parent().index(".permission")-1
	for (let o of toCheck)		
		if ($(o).prop("checked"))
			key += parseInt($(o).val());
	console.log(ind);
	modalScope.permissionCode[Object.keys(modalScope.permissionCode)[ind]] = key
	// $(modalScope.inputPermissions[ind]).val(key)

};
modalScope.updatePermissionsSys = () => {
	let p = Object.values(modalScope.permissionCode);
	comunication.send('changePermissions', null, [$("#path").text(), modalScope.nameFile, "0"+p.join("")]);
};

/*eventos*/
modalScope.cats.on('click', modalScope.changeCat);
modalScope.inputPermissions.on('change', modalScope.updatePermissionsInput);
modalScope.inputName
	.on('keyup', modalScope.updateName)
	.on('focusout', modalScope.changeName);
$("#confirm").on('click', modalScope.updatePermissionsSys);
$("input[type=checkbox]").on("change", modalScope.updatePermissionsCheck)
/*Inicializar al principio*/
modalScope.updatePermissions();
for (let o in modalScope.permissionCode)
modalScopeWatch.appendWatch(o, modalScope.updatePermissions);
var comunication = new EventClient(external);
// comunication.send('prueba1', null, '');