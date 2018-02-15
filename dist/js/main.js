'use strict';
var EventClient = require('./../../commonModules/localEvent').Client,
    $ = require('jquery');

//Preguntamos por los datos locales y SOLO los mostramos en la consola.
/*Variables globales*/

/*metodos globales*/
var drawFiles
/*modulos externos*/
var external = {};





external.drawFiles = drawFiles = (...args) => {
    let str = '';
    console.log(args[0]);
    for (var i in args[0]['dir'])
        str += `<li class="folder">${args[0]['dir'][i]}</li>`;
    for (i in args[0]['fil'])
        str += `<li class="file">${args[0]['fil'][i]}</li>`;
    $('main').html(str);
};




$('body').on('dblclick', '.folder', function(e) {
    console.log($(e.currentTarget).html());
    comunication.send('loadFiles', $(e.currentTarget).html());
});

var comunication = new EventClient(external);
comunication.send('loadFiles');
