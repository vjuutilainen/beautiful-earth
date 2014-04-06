var http = require('http');
var fs = require('fs');
var mime = require('mime');
var url = require('url');
var querystring = require('querystring');
var pg = require('pg');

var conString = "postgres://localhost/geo";
var client = new pg.Client(conString);

var defaultLocation = [0,0];

// dataset information

// if full dataset
// var ZMIN = -10898;
// var ZMAX = 8271;
// var XMAX = 21601;
// var YMAX = 10801;

// if sample dataset
var ZMIN = -10421;
var ZMAX = 6527;
var XMAX = 2160;
var YMAX = 1080;

// Connect to the database

client.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
  
	var staticFileHandler = function(path,res) {

		fs.readFile(path,'utf8', function(err,fileData){
				if(err) throw "not found";
				res.writeHead(200, {'Content-Type':mime.lookup(path)});
				res.end(fileData);
				
			});

	};

	var routes = {
		'/': 'index.html',
		'/main.js': 'main.js',
		'/three.min.js': 'three.min.js',
		'/TrackballControls.js': 'TrackballControls.js',
		'/style.css': 'style.css'

	};

	var route = function(urlstring,res){
		if (urlstring in routes){
			staticFileHandler(routes[urlstring],res);
		}

		// API for data

		if (url.parse(urlstring).pathname === '/Location'){

			var query = querystring.parse(url.parse(urlstring).query);

			queryData(query,res);

		}
	}

	var queryData = function(query,res){

		var range = parseInt(query.range);
		var x = parseInt(query.x);
		var y = parseInt(query.y);

		var xmin = (x-range).toString();
		var xmax = (x+range).toString();
		var ymin = (y-range).toString();
		var ymax = (y+range).toString();

		var loopx = '';
		var loopy = '';


		/*

		// if x-grid needs to loop from min
		if(x-range < 0){
			console.log('overlapping grid x');
			var overlapCount = Math.abs(x-range);
			var overlapMin = XMAX-overlapCount;
			var loopx = ' OR x >= ' + overlapMin + '';
		
		}


		// if y-grid needs to loop from min
		if(y-range < 0){
			console.log('overlapping grid y');
			var overlapCount = Math.abs(y-range);
			var overlapMin = YMAX-overlapCount;
			var loopy = ' OR y >= ' + overlapMin + '';
		
		}

		*/

		var dbString = 'SELECT * FROM elevation_sample WHERE ((x >= ' + xmin + ' AND x < ' + xmax +')' + loopx + ') AND ((y >= '+ ymin + ' AND y < ' + ymax + ')'+ loopy +') ORDER BY y,x';
		console.log(dbString);

		client.query(dbString, function(err, result) {
    		if(err) {
      			return console.error('error running query', err);
    			}
    	
    	console.log(result.rows.length + ' items for x ' + x + ' and y ' + y);

    	res.writeHead(200, {'Content-Type':'application/json'});
		
		var data = {

			data: result.rows,

						allgrid: {max: 

									{x: XMAX, y: YMAX}
					  			},

						grid: { max: {x: x+range, y: y+range},
								min: {x: x-range, y: y-range},
								center: {x: x, y: y},
								dimensions: {x: range*2, y: range*2}
					},

					elevation: { min: ZMIN, max: ZMAX }
		};

		//console.log(data);
		res.end(JSON.stringify(data));
    	
    	//client.end();
  });



	}



	var handler = function(req, res){

			route(req.url,res);	
	};

	http.createServer(handler).listen(8888);



});







// 	console.log("returning " + filteredData.length + " items for x " + query.x + " y " + query.y + " and range of " + range );

// 	return {data: filteredData,
			
// 			elevation: {min: alldata.minElevation,
// 						max: alldata.maxElevation
// 					},
			
// 			allgrid: {max: {x: alldata.gridX,
// 							y: alldata.gridY}
// 					  },
// 			grid: { max: {x:parseInt(query.x)+range, y:parseInt(query.y)+range},
// 					min: {x:parseInt(query.x)-range, y:parseInt(query.y)-range},
// 					center: {x: query.x, y: query.y},
// 					dimensions: {x: range*2, y: range*2}
// 					}

// 		};
// }






 

