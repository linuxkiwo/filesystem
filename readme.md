# file System
Esta aplicación  consiste en la creación de una sistema de archivos realizado enteramente en nodejs para integrarse con el resto de aplicaciones realizadas para el proyecto.

## Instrucciones para usuarios
A continuación se detallan una serie de instrucciones para el uso de la aplicación a nivel de usuario. A menos que se indique lo contrario, la forma de interacción será lo más similar a la que proporciona Windows ya que nuestro target está muy ligado al uso continuo de este SO.

### Selección
- **Individual**: Hacer click sobre un elemento
- **Multiple**: Con control pulsado ir haciendo click en los distintos elementos

### Deselección
- Para deseleccionar uno o varios elementos se puede hacer mediante un click en ningún elemento o con la letra esc

### Copiar y pegar
- Se puede realizar mediante atajos de teclado:
	- **Copiar**: control + c
	- **Cortar**: control + x
	- **Pegar**: control + v
- Sistema de drag and drop:
	- **Copiar**: Mantener control mientras arrastras
	- **Cortar**: Arrastrar sin soltar
- Menú de propiedades:
	- Se representa con texto las distintas acciones posibles

### Sistema de navegación
- Para poder moverte por las distintas aplicaciones es necesario hacer doble click en la carpeta en cuestión. Se puede navegar a través de las carpetas que están renderizadas o con la barra de navegación superior que permitirá retroceder a la carpeta que se precise estando dentro de la lista.

### Cambiar el nombre
- Se puede realizar mediante atajos de teclado:
	- **comando**: f2.
- Se puede realizar mediante una ventana modal:
	- **acción**: botón derecho > cambiar nombre.

### Mostrar el menú de propiedades
- Se puede realizar mediante atajos de teclado:
	- **comando**: control + i.
- Se puede realizar mediante una ventana modal:
	- **acción**: botón derecho > propiedades.
- Este menú se divide en tres subsecciones:
	- *Básico* Incluye El nombre del archivo, la ruta a este y el tamaño
	- *Fechas* Inlcuye las fechas básicas de un inodo (modificación, acceso y y creación)
	- *Permisos* Muestra los persmisos de un archivo o carpeta
- Desde este menú se pueden realizar una serie de acciones como:
	- Cambiar el nombre en el campo correspondiente
	- Cambiar los persmisos. Se muestran dos niveles posibles de interacción para realizar esta acción.

***Anotaciones***:

- Caso 1:
	- 1 archivo seleccionado -> se cambia el nombre del archivo por el nuevo
	- varios archivos seleccionados:
		- Si no se modifica la ext, se mantendrá la que ya tenía
		- Si se modifica, se le cambiará a todos los archivos que compartan ext 

## Instrucciones para desarrolladores