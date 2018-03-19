'use strict';
let  fs = require('fs');		
function CSV_TO_JSON(obj={}){	
	this.delimeter = obj.delimeter || ',';
	this.end = obj.end || -1;
	this.start = obj.start || 0;
	this.parser;
	this.parserObj = (csv, arr) => {
		let parser = [],
			field = csv.split('\n'),
			obj = {};
		for (let i of field){
			obj = {};			
			let f = i.split(this.delimeter)
			for (let c in f){		
				obj[arr[c]] = f[c];
			}
			parser.push(obj)
		}
		this.parser = parser;
		return parser;
	}
	this.search = (select, cond, obj = this.parser) => {
		let toReturn = [],
			con,
			objective = select.length,
			r = ''
		for (let a of obj){
			con = 0;			
			for (let c in cond){
				r = `^${cond[c].replace('*', '+')}$`;
				r = new RegExp(r);
				if (r.test(a[c])){
					con++;
				}
				else
					continue;
			}
			if (con === objective){
					let obj = {};
				for (let i of select)
					obj[i] = a[i]
				toReturn.push(obj)
			}
		}
		return toReturn;
	}
};
module.exports = exports = CSV_TO_JSON;

