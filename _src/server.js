var http = 			require('http');
var url = 			require('url');
var formidable =	require('formidable');
var fs = 			require('fs');
var path = 			require('path');
var ncp = 			require('ncp').ncp;
var copydir = 		require('copy-dir');
var express =		require('express');
var zipdir =		require('zip-dir');
var multiparty =	require('multiparty');
var fse =			require('fs-extra');
var bodyParser = 	require('body-parser')

eval(fs.readFileSync(path.join(__dirname,'/js/routines-tiny.js'))+'');
eval(fs.readFileSync(path.join(__dirname,'/js/routines.js'))+'');

//var ready_zip = undefined;

var app = express();
app.use(express.static('public'));

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var router = express.Router();
app.use('/', router);



var folder_for_results = path.join( __dirname, "Result");



// File delivery -------------------------
/*
app.use(function (req, res, next) 
{
	console.log("["+req.url+"]");
	
	if( req.url != "/" && req.url != "/upload" && req.url != "/download" && req.url != "/test" )
	{
		res.sendFile(__dirname + req.url);
	
	} else
	next();
});
*/


app.post('/upload', function(req, res) 
{
	//ready_zip = undefined;
	
	var randomname = RandomName(16);
	var resultpath = path.join( folder_for_results, randomname );

	// Create directory if it doesn't exist
	if( !fs.existsSync(folder_for_results))
	fs.mkdirSync(folder_for_results);

	// Delete all old files that are older than 2 minutes
	RemoveJunk( folder_for_results, 2 );


	console.log("before form");
	var form = new multiparty.Form({maxFilesSize:1024*1024});

	form.on('progress', function(bytesReceived, bytesExpected) 
	{
		console.log( (bytesReceived / bytesExpected).toFixed(2) * 100 );
		//socket.emit('received', (bytesReceived / bytesExpected).toFixed(2) * 100);
	});

	form.parse(req, function(err, fields, files)
	{
		//console.log( "WORKS" );
		//console.log( files );

		if( files === undefined || Object.keys(files).length == 0 )
			res.end();
		else
		{
			if( files["templates"] !== undefined && Object.keys(files["templates"]).length > 0 )
			{
				var target = files["templates"];
	
				for( var key in target )
				{
					if( target[key].originalFilename !== undefined )
					fse.copySync( target[key].path, path.join( resultpath, "templates", target[key].originalFilename) );
				}
			}
	
			if( files["instructions"] !== undefined && Object.keys(files["instructions"]).length > 0 )
			{
				var target = files["instructions"];
	
				for( var key in target )
				{
					if( target[key].originalFilename !== undefined )
					fse.copySync( target[key].path, path.join( resultpath, "instructions", target[key].originalFilename) );
				}
			}

			// Do the magic
			
			DoMagic( path.join(resultpath, "templates"), path.join(resultpath, "result"), [".ico",".svg",".DS_Store", ""], path.join(resultpath, "instructions"), function(zipname)
			{
				deleteFolderRecursive( path.join(resultpath, "result") );
				deleteFolderRecursive( path.join(resultpath, "templates") );
				deleteFolderRecursive( path.join(resultpath, "instructions") );

				res.end(randomname);
			});
		}
		
	});
	
	console.log("after form");

	//res.end();
});

app.post('/test', function(req, res) 
{
	var instructions = GetInstructionsFromFileContent( req.body.instructions );
	var new_content = ConvertText( req.body.template, instructions );

	res.end( new_content );  
});

/*
router.get('/download', function(req, res, next)
{ 
	if( ready_zip !== undefined )
	{
		console.log( "downloading...: " + ready_zip );
		res.download(ready_zip, "result.zip");
	}
	else
	{
		res.redirect('/');
	}
});
*/

app.get('/download/:randomname', function(req, res) 
{

	var randomname = req.params.randomname;
	var zipfile = path.join( folder_for_results, randomname, "result.zip" );

	if( fs.existsSync(zipfile) )
	{
		console.log( "new downloading...: " + zipfile );
		res.download( zipfile, "result.zip");
	}
	else
	{
		res.redirect('/');
	}
});

/*
app.get('/', function(req, res) 
{
	res.sendFile(__dirname + '/index.html');
});
*/


var listener = app.listen(process.env.PORT | 8080, function(){});


