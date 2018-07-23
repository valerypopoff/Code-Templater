var http = 			require('http');
var url = 			require('url');
var static = 		require('node-static');
var file = 			new static.Server('.');
var formidable =	require('formidable');
var fs = 			require('fs');
var path = 			require('path');
var ncp = 			require('ncp').ncp;
var copydir = 		require('copy-dir');
var express =		require('express');
var zipdir =		require('zip-dir');
var multiparty =	require('multiparty');
var fse =			require('fs-extra');

eval(fs.readFileSync('./js/routines-tiny.js')+'');
eval(fs.readFileSync('./js/routines.js')+'');


var app = express();
app.use(express.static('public'));

var router = express.Router();
app.use('/', router);


// File delivery -------------------------
app.use(function (req, res, next) 
{
	console.log("["+req.url+"]");
	
	if( req.url != "/" && req.url != "/upload" && req.url != "/download" )
	{
		res.sendFile(__dirname + req.url);
	
	} else
	next();
});


app.post('/upload', function(req, res) 
{
	var folder_for_results = "Result";
	var randomname = RandomName(16);
	var resultpath = path.join( "./", folder_for_results, randomname );

	// Delete all old files that are older than 2 minutes
	RemoveJunk( path.join( "./", folder_for_results), 2 );


	console.log("before form");
	var form = new multiparty.Form({maxFilesSize:800*1024});

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

				res.end(zipname);
			});
		}
		
	});
	
	console.log("after form");

	//res.end();
});


router.get('/download/:filepath(*)', function(req, res, next)
{ 
	if( req.params.filepath != "" )
	{
		console.log( "downloading...: " + req.params.filepath );
		res.download(req.params.filepath, "result.zip");
	}
	else
	{
		res.redirect('/');
	}
});



app.get('/', function(req, res) 
{
	res.sendFile(__dirname + '/index.html');
});

/*
app.get('/download', function(req, res) 
{
	//res.download('./server.js');
	
	console.log("GOT TO DOWNLOAD: " + ready_zipname);
	
	if( ready_zipname != "" )
	{
		console.log("dowloading...");
		res.download('./server.js');
		//res.download( path.join(__dirname, ready_zipname), "result.zip" );
	}
	else
	{
		//res.download('./server.js');

		//res.redirect('/');
	}
});
*/


var listener = app.listen(process.env.PORT, function(){});


