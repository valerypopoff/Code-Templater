var http = 			require('http');
var url = 			require('url');
var formidable =	require('formidable');
var fs = 			require('fs');
var path = 			require('path');
var ncp = 			require('ncp').ncp;
var copydir = 		require('copy-dir');
var zipdir =		require('zip-dir');
var multiparty =	require('multiparty');
var fse =			require('fs-extra');
var express =		require('express');
var bodyParser = 	require('body-parser')

eval(fs.readFileSync('./js/routines-tiny.js')+'');
eval(fs.readFileSync('./js/routines.js')+'');

var app = express();
app.use(express.static('public'));

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var router = express.Router();
app.use('/', router);


app.get('*', function(req, res) 
{
	res.end( "No GET requests allowed. Do POST request to \"/test\"" );  
});


app.post('/test', function(req, res) 
{
	console.log( "works server" )
	console.log( "instructions: " + req.body.instructions )
	console.log( "template: " + req.body.template )

	var result = "";
	var instructions = GetInstructionsFromFileContent( req.body.instructions );
	var new_content = ConvertText( req.body.template, instructions );


	//res.end( string(req.body) );

	res.end( new_content );  
});


var listener = app.listen(process.env.PORT | 8080, function(){});


