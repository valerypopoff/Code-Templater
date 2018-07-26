var hashkey = "###";
var atkey = "@@@";
var bukkey = "$$$";
var bukopen = "$$${";
var bukclose = "$$$}";
var braceopen = "{";
var braceclose = "}";
var not_iterator = "!!!";



function DoMagic( dirname, newdirname, extfilter, instructions_dir, callback )
{
	var instructions_content = GetInstructionsContentFromDir(instructions_dir);
	var instructions = GetInstructionsFromFileContent( instructions_content );
	//console.log( JSON.stringify(instructions) );
	//return;


	// Delete directory if exists
	/*
	if( fs.existsSync(newdirname) )
	{
		console.log("DELETING");
		deleteFolderRecursive(newdirname);
	}
	*/

	// Create directory if it doesn't exist
	if( !fs.existsSync(newdirname) )
	fs.mkdirSync(newdirname);
		
		
	// Asynchronously copy a source folder to a new folder
	ncp.limit = 16;
	ncp(dirname, newdirname, function(error)
	{
		if(error) return console.error(error);		

		// Convert everything in the newdirname
		ConvertDir(newdirname, extfilter, instructions);
		
		// Zip newdirname and call back with a zipfile name
		var zipname = newdirname + ".zip";
		zipdir( newdirname, { saveTo: zipname }, function (err, buffer) 
		{
			callback( zipname );
			//res.download( path.join(__dirname, zipname) ); 
		});
	});
	
}


// Convertions ------------------------------------------

function ConvertDir( dirname, extfilter, instructions )
{
	// Rename directory if it has ###variables### in the name -------------------
	//console.log("Trying to rename");
	//var newdirname = dirname;
	var newdirname = ConvertText(dirname, instructions);
	fs.renameSync(dirname, newdirname);

	// Run through all files and directories ------------------------
	var files = fs.readdirSync( newdirname ); 
    files.forEach( function( filename, index )
    {
		var Path = path.join( newdirname, filename );

		var stat = fs.statSync( Path ); 
	    if( stat.isFile() )
	    {
			//console.log( "'%s' is a file.", Path );
			//console.log( "ext is: _" + path.extname(Path) + "_" );								
			if( extfilter.indexOf(path.extname(Path)) == -1 )
			{
				ConvertFile( Path, instructions );
				fs.renameSync( Path, path.join( newdirname, ConvertText(filename, instructions) ));
			}

	    }
	    else if( stat.isDirectory() )
		{
	        //console.log( "'%s' is a directory.", Path );
	        ConvertDir( Path, extfilter, instructions/*, ++level*/ );
		} 
    });
}

function ConvertFile( filepath, instructions )
{
	var file_content = fs.readFileSync(filepath, 'utf8');
	
	var new_content = ConvertText( file_content, instructions );
	fs.writeFileSync(filepath, new_content, 'utf8');	
	//console.log( new_content );
}

function ConvertText( text, instructions )
{
	var result_lines = []; 

	var lines = text.split(/\r?\n/);
	var buk_started = false;
	var buk_lines = [];
	var delimiter;
	var domain;
	var condition;

	for( var i=0; i < lines.length; i++ )
	{
		// STARTING $$$
		// read name and domain
		if( !buk_started && lines[i].indexOf(bukkey) > -1 && lines[i].indexOf(bukopen) == -1 && lines[i].indexOf(bukclose) == -1)
		{
			buk_started = true;

			//domain = GetWhatInQuotes(lines[i], 0);
			//delimiter = GetWhatInQuotes(lines[i], 1);

			domain = GetDomainName(lines[i]);
			delimiter = GetDelimiter(lines[i]);
			conditions = GetConditions(lines[i]);

			continue;
		}

		// ENDING $$$ or the end line
		if( (buk_started && lines[i].indexOf(bukkey) > -1 && lines[i].indexOf(bukopen) == -1 && lines[i].indexOf(bukclose) == -1) 
			|| ( buk_started && i == lines.length-1 ) )
		{
			result_lines = result_lines.concat( StartBuckRec(
												{
													lines: buk_lines, 
													instructions: instructions, 
													domain: domain, 
													delimiter: delimiter,
													conditions: conditions
												}));
			
			buk_started = false;
			buk_lines = [];
			delimiter = undefined;
			domain = undefined;

			continue;
		}

		// INSIDE $$$
		if( buk_started )
		{
			buk_lines.push( lines[i] );
			continue;
		}

		// JUST ### or blank
		result_lines.push( ConvertLine(
						{
							line: lines[i],
							instructions: instructions, 
							domain: "", 
							domain_part: 0, 
							iteration: 0,
							lookup: [0]
						
						}).result );
	}

	//console.log(result_lines.length);
	return result_lines.join('\n');
}




function StartBuckRec( opts ) 
{
	var length = opts.instructions[opts.domain] === undefined ? 0 : opts.instructions[opts.domain].length;

	// Root lookup is the array with domain parts of the domain. Like: [0, 1, 2]
	// But only those domain parts that fulfil the specified conditions
	var root_lookup = [];

	for( var i=0; i<length; i++ )
	{
		// No condition specified
		if( opts.conditions.length == 0 )
		{
			root_lookup.push( i );
		}
		else
		{
			if( DomainPartFulfils(opts.conditions, opts.instructions[opts.domain][i]) )
			root_lookup.push( i );
		}
	}


	//console.log( root_lookup )
	//console.log( JSON.stringify(opts.instructions) )

	return ConvertBucklines({
								// Since this is the root call of ConvertBucklines, 
								// add additional bukopen and bukclose to the lines 
								lines: [].concat(bukopen, opts.lines, bukclose),
								
								instructions: opts.instructions,
								domain: opts.domain,
								delimiter: opts.delimiter,
								level: 0, // not used yet
								iteration: 0,
								lookup: root_lookup,
								root_back_lookup: [root_lookup], // not used yet
								real: true
							}
							).result;
}


function ConvertBucklines( opts ) 
{
	var result_lines = [];

	function PushDelimiter()
	{
		if( result_lines[ result_lines.length-1 ] === undefined )
			result_lines.push( Unescape(opts.delimiter) );
		else
			result_lines[ result_lines.length-1 ] = result_lines[ result_lines.length-1 ] + Unescape(opts.delimiter);
	}


	var inner_lines = [];
	var open_count = 0;
	var not_iterate = false;
	var close_count = 0;
	var inner_lvl_opened = false;
	var back_lookup_empty = true;

	// To return
	var max_different = 0;
	var back_lookup = [opts.lookup];
	var atleastone = false;


	for( var i=0; i<opts.lines.length; i++ )
	{
		// $$$ {
		if( opts.lines[i].indexOf(bukopen) >= 0 )
		{
			open_count++;
			
			if( !inner_lvl_opened )
			{
				// We must set the flag to false because 
				// there might be more that one inner level bucks 
				if( opts.lines[i].indexOf(not_iterator) >= 0 )
				not_iterate = true;
				else
				not_iterate = false;					
			}

			// Only put $$${ line if inner level already opened
			if( inner_lvl_opened )
			inner_lines.push( opts.lines[i] );

			inner_lvl_opened = true;

			continue;
		}

		// $$$ }
		if( opts.lines[i].indexOf(bukclose) >= 0 || (i == opts.lines.length-1 && open_count != close_count) )
		{
			close_count++;

			// CLOSING INNER LEVEL
			if( open_count == close_count )
			{
				// Only convert if this is real
				// No need to convert the content of ${{{ $}}} if this is not real
				if( opts.real )
				{
					var converted_future = ConvertBucklines({
												lines: 			inner_lines,
												instructions:	opts.instructions,
												domain: 		opts.domain,
												delimiter: 		opts.delimiter,
												level: 			opts.level+1,
												
												// Fake Buckclines Always start with the parent lookup 
												// but with the iteration 0 because we pretend there are no outer levels 
												iteration: 		0,
												lookup: 		opts.lookup,
												real: 			false
											});



					//----------------------------------------------------------------------------

					// Repeat block as many times as there are different variations of #vars on the inner level/
					// values of variables on the inner level
					var times = converted_future.back_lookup.length;

					for( var k=0; k<times; k++ )
					{
						var inner_iteration = 0;
						var repeats_put = 0;

						if( not_iterate )
						{
							// Repeat only once with the parent iteration
							inner_iteration = opts.iteration;
							converted_future.max_different = inner_iteration+1;
						}

						while( inner_iteration < converted_future.max_different )
						{
							var converted = ConvertBucklines({
															lines: 			inner_lines,
															instructions:	opts.instructions,
															domain: 		opts.domain,
															delimiter: 		opts.delimiter,
															level: 			opts.level+1,
															iteration: 		inner_iteration,
															lookup: 		converted_future.back_lookup[k],
															real: 			opts.real
														});


							if( converted.atleastone || !opts.real )
							{
								if( repeats_put != 0 && opts.delimiter != "" )
								PushDelimiter();

								result_lines = result_lines.concat( converted.result );

								repeats_put++;
							}

							inner_iteration++;
						}	

						if( converted_future.max_different == 0 )
						continue;

						if( k != times-1 )	
						PushDelimiter(); 
					}

					// -----------------------------------------------------------------------
				
				}

				inner_lvl_opened = false;
				open_count = 0;
				close_count = 0;
				inner_lines = [];
			}
			// NOT CLOSING INNER LEVEL YET
			else
			{
				inner_lines.push( opts.lines[i] );
			}
			
			continue;
		}

		// INNER LEVEL
		// keep adding to inner_lines
		if( open_count > 0 )
		{
			inner_lines.push( opts.lines[i] );
			continue;
		}


		// SAME LEVEL
		// ### 
		if( opts.lines[i].indexOf(hashkey) >= 0 )
		{
			var converted = ConvertLine({
								line: opts.lines[i],
								instructions: opts.instructions, 
								domain: opts.domain, 

								// because this #var is the same in lookup[0], lookup[1], lookup[2] and so on 
								domain_part: opts.lookup[0],

								iteration: opts.iteration,
								lookup: opts.lookup,
								real: opts.real
							}); 	

			// Print the converted string if:
			// — There were no hashes
			// — There were hashes and at least one was converted to non-empty string
			// — There were hashes and none of them was converted to non-empty string but it was a string with /*PERSIST*/
			if( !converted.werehashes || 
				(converted.werehashes && converted.atleastone) || 
				(converted.werehashes && !converted.atleastone && converted.persist_if_nothing) 
			)
			result_lines.push( converted.result );
			//else
			//result_lines.push( "// BLANK   " + converted.result );
			//↑ THIS WILL PRINT SRINGS WHEN NO ATLEASTONE


			// Set atleastone if:
			// — There were hashes and at least one was converted to non-empty string
			// — There were hashes and none of them was converted to non-empty string but it was a string with /*PERSIST*/
			if( (converted.werehashes && converted.atleastone) || 
				(converted.werehashes && !converted.atleastone && converted.persist_if_nothing) 
			)
			atleastone = true;


			
			if( converted.back_lookup.length > 0 )
			{
				back_lookup_empty = false;
				back_lookup = AddLookup( back_lookup, converted.back_lookup );
			}
			
			if( converted.max_different > max_different )
			max_different = converted.max_different;			

			continue;
		}

		// SAME LEVEL
		// No-### line (including blank)
		// leave it as it is
		result_lines.push( opts.lines[i] );
	}

		
	if(back_lookup_empty)
	back_lookup = [];

	return {
				result: result_lines, 
				max_different: max_different, 
				back_lookup: back_lookup,
				atleastone: atleastone
			};
}

function ConvertLine( opts ) 
{
	//var cross_cutting = false;
	var back_lookup_empty = true;

	// To return
	var atleastone = false;
	var werehashes = false;
	var persist_if_nothing = false;
	var max_different = 0;
	var back_lookup = [opts.lookup];


	// Check if persists
	var temp = opts.line.match( /\/\*[\s\t]*PERSIST[\s\t]*\*\// );
	if( temp !== null )
	{
		opts.line = opts.line.replace( /\/\*[\s\t]*PERSIST[\s\t]*\*\//g,"");
		persist_if_nothing = true;
	}


	var result = opts.line.replace( /###.+?###/g, function(str)
	{
		// If we're here, it means there's hashes
		werehashes = true;


		var key = str.substr(3,str.length-6).trim();
		var cross_cutting = false;

		// See if crosscutting
		if( key.indexOf("(") >= 0 )
		{
			cross_cutting = true;
			key = key.split(/[()]/).join("").trim();
		}


		// Unknown domain
		if( opts.instructions[opts.domain] === undefined )
		{
			return Empty(key, opts);
		}

		// If domain part is undefined. Probably because the lookup was empty
		if( opts.domain_part === undefined )
		{
			//console.log( "AGA" )
			return Empty(key, opts);
		}

		// Key doesn't exist in the specified domain
		if( opts.instructions[opts.domain][opts.domain_part][key] === undefined )
		{
			return Empty(key, opts);
		}

		// It's Array, but key iteration doesn't exist
		// Asking for an iteration of array that doesn't exist
		// so it must return a blank string so iterations can stop
		if( Array.isArray(opts.instructions[opts.domain][opts.domain_part][key]) && 
			opts.instructions[opts.domain][opts.domain_part][key][opts.iteration] === undefined )
		{
			return "";
		}



		// If it's array
		if( Array.isArray(opts.instructions[opts.domain][opts.domain_part][key]) )
		{
			// Set max_diferent and back_lookup even if the target value is empty
			// because we only need it for FutureBuck analysis
			if( opts.instructions[opts.domain][opts.domain_part][key].length > max_different )
			max_different = opts.instructions[opts.domain][opts.domain_part][key].length;

			back_lookup_empty = false;
			back_lookup = AddLookup( back_lookup, MakeLookup( opts.domain, key, opts ) );


			// Only set atleastone if string is not empty
			// Cause if it's empty, it means that nothing was cpecified in the instruction for this particular iteration
			var ret = opts.instructions[opts.domain][opts.domain_part][key][opts.iteration];
			if( ret.length != 0 )
				atleastone = true;
			
			return ret;
		} 
		else // Not array
		{
			// Set max_diferent and back_lookup even if the target value is empty
			// because we only need it for FutureBuck analysis
			if( 1 > max_different )
			max_different = 1;

			back_lookup_empty = false;
			back_lookup = AddLookup( back_lookup, MakeLookup( opts.domain, key, opts ) );


			// This is not array but it is the iteration that's > 0. 
			// It means there's something else on this level that will be repeated
			// So don't repeat this, return ""
			// Unless this one is cross_cutting
			if( opts.iteration > 0 && !cross_cutting )
			{
				return "";
			}
			else
			{
				// Only set atleastone if string is not empty
				// Cause if it's empty, it means that nothing was cpecified in the instruction
				var ret = opts.instructions[opts.domain][opts.domain_part][key];
				if( ret.length != 0 )
					atleastone = true;
				
				return ret;			
			}
		} 
	})

	// If nothing was found
	if( back_lookup_empty )
	back_lookup = [];
	
	//console.log(back_lookup)
	return { 
			atleastone: atleastone, 
			werehashes: werehashes, 
			persist_if_nothing: persist_if_nothing,
			max_different: max_different, 
			back_lookup: back_lookup,
			result: result 
		};
}



// Instructions reading ---------------------------------

function GetInstructionsContentFromDir( instructions_dir )
{
	var content;
	var files = fs.readdirSync( instructions_dir ); 
	
    files.forEach( function( filename, index )
    {
		var Path = path.join( instructions_dir, filename );
		var stat = fs.statSync( Path ); 		
	    if( stat.isFile() )
	    {
			//console.log( "'%s' is a file.", Path );	

			content = content + "\n" + fs.readFileSync(Path, 'utf8');
	    }
	    else if( stat.isDirectory() )
		{
	        //console.log( "'%s' is a directory.", Path );
	        content = content + "\n" + GetInstructionsContentFromDir(Path);
		} 
    });	

    
    return content;
}

function GetInstructionsFromFileContent( content )
{
	var lines = content.split(/\r?\n/);

	var instructions = {};	
	var hash_started = false;
	var brace_started = false;
	var open_count = 0;
	var close_count = 0;
	var current_name = "";
	var current_content = "";
	var content_lines = 0;
	var current_domain = "";
	
	// It remembers how many times certain domain was described in the file 
	var domain_counter = {"":0};

	function StoreProperly()
	{
		var current_domain_part = domain_counter[current_domain];

		// Create domain if is doesn't exist
		if( instructions[current_domain] === undefined )
		instructions[current_domain] = []; // domain is array
		//instructions[current_domain] = {}; // domain is object

		// Create domain part if it doesn't exist
		if( instructions[current_domain][ current_domain_part ] === undefined )
		instructions[current_domain][ current_domain_part ] = {};

		// If the key is empty, put the key
		if( instructions[current_domain][ current_domain_part ][current_name] === undefined )
		{
			instructions[current_domain][ current_domain_part ][current_name] = current_content;
		} 
		// If key is not empty, put the key the end of the array
		else
		{
			// If the key is an array, just push new content
			if( Array.isArray(instructions[current_domain][ current_domain_part ][current_name]) )
			{
				//if( instructions[current_domain][ current_domain_part ][current_name].indexOf(current_content) == -1 )
				instructions[current_domain][ current_domain_part ][current_name].push( current_content );
			}
			// If it's not an array yet, make it array
			else 
			{
				//if( instructions[current_domain][ current_domain_part ][current_name] != current_content )
				instructions[current_domain][ current_domain_part ][current_name] = [ instructions[current_domain][ current_domain_part ][current_name], current_content ];
			} 
		}
	}
	
	for( var i=0; i < lines.length; i++ ) 
	{
		// Ignoring lines starting with // that aren't in the ### block
		if( !hash_started && lines[i].trim()[0] == "/" && lines[i].trim()[1] == "/"  )
		{
			//console.log( "IGNORING: " + lines[i] );
			continue;
		}

		// {DOMAIN NAME}
		if( !hash_started && lines[i].trim()[0] == braceopen && open_count == close_count )
		{
			//brace_started = true;
			open_count++;

			// May be "" if no dmain specified
			current_domain = lines[i].split(braceopen)[1].trim();

			// If this is new domain, create one, and count 0
			if( domain_counter[current_domain] === undefined )
			{
				domain_counter[current_domain] = 0;
			}
			// If this is an existing domain
			else
			{
				// Don't increment for basic "" domain
				if( current_domain != "" )
				domain_counter[current_domain]++;
			}

			continue;
		}

				// Ignore inner domain {
				if( !hash_started && lines[i].trim()[0] == braceopen && open_count != close_count )
				{
					open_count++;
					continue;
				}
		
				// Ignore inner domain }
				if( !hash_started && lines[i].trim()[0] == braceclose && open_count != close_count+1 )
				{
					close_count++;
					continue;
				}


		// END OF DOMAIN
		if( !hash_started && lines[i].trim()[0] == braceclose && open_count == close_count+1 )
		{
			//brace_started = false;
			close_count++;
			
			current_domain = "";
			
			continue;
		}


		// @@@
		if( lines[i].indexOf(atkey) > -1 )
		{
			var arr = lines[i].trim().split(/[\s\t]+(.*)/);
			
			current_name = arr[0].split(atkey)[1];
			current_content = (arr[1] !== undefined ? arr[1] : "").trim();

			StoreProperly();
			current_name = "";
			current_content = "";

			continue;
		}


		// OPEN ###
		if( !hash_started && lines[i].indexOf(hashkey) > -1 )
		{			
			hash_started = true;

			current_name = lines[i].split(hashkey)[1].trim();

			continue;
		}

		if( hash_started )
		{
			//console.log( lines[i] );
			if( lines[i].indexOf(hashkey) == -1 )
			{
				if( content_lines > 0 )
				current_content += "\n";				

				current_content += lines[i];
				content_lines++;
			} else // CLOSE ###
			{				
				StoreProperly();
				current_name = "";
				current_content = "";
				content_lines = 0;

				hash_started = false;
			}
			
			continue;
		}
	}	

	return instructions;
}

/*
function GetInstructionsFromFileContent( content )
{
	var lines = content.split(/\r?\n/);

	var instructions = {};	
	var hash_started = false;
	var brace_started = false;
	var open_count = 0;
	var close_count = 0;
	var current_name = "";
	var current_content = "";
	var content_lines = 0;
	var current_domain = "";
	
	// It remembers how many times certain domain was described in the file 
	var domain_counter = {"":0};

	function StoreProperly()
	{
		var counter = domain_counter[current_domain];

		// Create domain if is doesn't exist
		if( instructions[current_domain] === undefined )
		instructions[current_domain] = []; // domain is array
		//instructions[current_domain] = {}; // domain is object

		// Create domain part if it doesn't exist
		if( instructions[current_domain][ counter ] === undefined )
		instructions[current_domain][ counter ] = {};

		// If the key is empty
		if( instructions[current_domain][ counter ][current_name] === undefined )
		{
			instructions[current_domain][ counter ][current_name] = current_content;
		} 
		else
		{
			// If the key is an array, not a string
			if( Array.isArray(instructions[current_domain][ counter ][current_name]) )
			{
				//if( instructions[current_domain][ counter ][current_name].indexOf(current_content) == -1 )
				instructions[current_domain][ counter ][current_name].push( current_content );
			}
			else // Make array
			{
				//if( instructions[current_domain][ counter ][current_name] != current_content )
				instructions[current_domain][ counter ][current_name] = [ instructions[current_domain][ counter ][current_name], current_content ];
			} 
		}
	}
	
	for( var i=0; i < lines.length; i++ ) 
	{
		// Ignoring lines starting with // that aren't in the ### block
		if( !hash_started && lines[i].trim()[0] == "/" && lines[i].trim()[1] == "/"  )
		{
			//console.log( "IGNORING: " + lines[i] );
			continue;
		}

		// {DOMAIN NAME}
		if( !hash_started && lines[i].trim()[0] == braceopen && open_count == close_count )
		{
			//brace_started = true;
			open_count++;

			// May be "" if no dmain specified
			current_domain = lines[i].split(braceopen)[1].trim();

			// If this is new domain, create one, and count 0
			if( domain_counter[current_domain] === undefined )
			{
				domain_counter[current_domain] = 0;
			}
			// If this is an existing domain
			else
			{
				// Don't increment for basic "" domain
				if( current_domain != "" )
				domain_counter[current_domain]++;
			}

			continue;
		}

				// Ignore inner domain {
				if( !hash_started && lines[i].trim()[0] == braceopen && open_count != close_count )
				{
					open_count++;
					continue;
				}
		
				// Ignore inner domain }
				if( !hash_started && lines[i].trim()[0] == braceclose && open_count != close_count+1 )
				{
					close_count++;
					continue;
				}


		// END OF DOMAIN
		if( !hash_started && lines[i].trim()[0] == braceclose && open_count == close_count+1 )
		{
			//brace_started = false;
			close_count++;
			
			current_domain = "";
			
			continue;
		}


		// @@@
		if( lines[i].indexOf(atkey) > -1 )
		{
			var arr = lines[i].trim().split(/[\s\t]+(.*)/);
			
			current_name = arr[0].split(atkey)[1];
			current_content = (arr[1] !== undefined ? arr[1] : "").trim();

			StoreProperly();
			current_name = "";
			current_content = "";

			continue;
		}


		// OPEN ###
		if( !hash_started && lines[i].indexOf(hashkey) > -1 )
		{			
			hash_started = true;

			current_name = lines[i].split(hashkey)[1].trim();

			continue;
		}

		if( hash_started )
		{
			//console.log( lines[i] );
			if( lines[i].indexOf(hashkey) == -1 )
			{
				if( content_lines > 0 )
				current_content += "\n";				

				current_content += lines[i];
				content_lines++;
			} else // CLOSE ###
			{				
				StoreProperly();
				current_name = "";
				current_content = "";
				content_lines = 0;

				hash_started = false;
			}
			
			continue;
		}
	}	

	return instructions;
}

*/










