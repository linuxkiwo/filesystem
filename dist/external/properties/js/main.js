const $ = require('jquery');
const Whatch = require('watcher');
/*Variables globales*/
var modalScope = {};
modalScope.body = $('body');
modalScope.cat = modalScope.body.find('ul');
modalScope.cats = modalScope.cat.find('li');
modalScope.main = modalScope.body.find('main');
modalScope.inputPermissions = modalScope.main.find("input[type=number]");
modalScope.inputText = modalScope.main.find(".permission");
modalScope.pathFile = "#{pathFile}";
modalScope.permissionCode = {
    	"property": #{permission[0]},    	
}
    	// "groups":  #{permission[1]},    	
    	// "others" : #{permission[2]}

var modalScopeWatch = new Whatch (modalScope.permissionCode);

/*funciones generales*/
modalScope.updatePermissions = (toChange = "text") => {
	console.log("entro")
	if (toChange === "text"){
		let p = 'rwx',
			v = 0
			str = ["","",""];
		for (let g in modalScope.permissionCode){				
			o = modalScope.permissionCode[g]
			let bin = parseInt(o).toString(2);
			console.log(bin)
			for (let i in bin){
				console.log(`${g}->${bin}->${modalScope.permissionCode[g]}`)
				console.log(bin[i])
				str[v] = (bin[i] === "1") ? str[v] + p[i] : str[v] + "_";
			}
			o.text = str[v];
			$(modalScope.inputText[v]).text(str[v]);
			v++;
		}
	}
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
/*eventos*/
modalScope.cats.on('click', modalScope.changeCat);
modalScope.inputPermissions.on('change', modalScope.updatePermissionsInput);


/*Inicializar al principio*/
modalScope.updatePermissions();
modalScopeWatch.appendWatch("property", modalScope.updatePermissions);
// modalScopeWatch.appendWatch("groups", modalScope.updatePermissions);
// modalScopeWatch.appendWatch("others", modalScope.updatePermissions);