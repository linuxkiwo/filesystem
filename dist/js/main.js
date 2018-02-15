'use strict';
var EventClient = require('./../../commonModules/localEvent').Client,
    $ = require('jquery');

//Preguntamos por los datos locales y SOLO los mostramos en la consola.
/*Variables globales*/

/*metodos globales*/
var drawFiles
/*modulos externos*/
var external = {};





external.drawFiles = drawFiles = (args) => {
    /*Lista los archivos y carpetas que hay en ese direcorio*/
    let str = '',
        list = args[0];
    for (var i in list['dir'])
        str += `<li class="folder">${list['dir'][i]}</li>`;
    for (i in list['fil'])
        str += `<li class="file">${list['fil'][i]}</li>`;
    $('main').html(str);
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




$('body').on('dblclick', '.folder', function(e) {
    let name = $(e.currentTarget).html();
    $('.topBar').append(`<li class="track">${name}</li>`);
    comunication.send('loadFiles', 'drawFiles', [name]);
}).on('dblclick', '.track', function(e){
    let name = $(e.currentTarget).html();
    console.log(`name vale: ${name}`);
    comunication.send('changeDir', 'drawFiles', [name]);
});

var comunication = new EventClient(external);
comunication.send('loadFiles', 'drawFiles', '');
