var hashkey = "###";
var atkey = "@@@";
var bukkey = "$$$";
var bukopen = "$$${";
var bukclose = "$$$}";
var braceopen = "{";
var braceclose = "}";



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
								// add additional bukopen and bukclose to tyhe lines 
								lines: [].concat(bukopen, opts.lines, bukclose),
								
								instructions: opts.instructions,
								domain: opts.domain,
								delimiter: opts.delimiter,
								//domain_part: 0,
								level: 0,
								iteration: 0,
								lookup: root_lookup,
								root_back_lookup: [root_lookup],
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
	//var max_different = 1;
	var max_different = 0;
	var back_lookup = [opts.lookup];
	var back_lookup_empty = true;
	var atleastone = false;


	for( var i=0; i<opts.lines.length; i++ )
	{
		// $$$ {
		//if( opts.real )
		if( opts.lines[i].indexOf(bukopen) >= 0 )
		{
			open_count++;
			
			if( !inner_lvl_opened )
			{
				if( opts.lines[i].indexOf("!!!") >= 0 )
				not_iterate = true;
				else
				not_iterate = false;					
			}

			// Only put keys if inner level already opened
			if( inner_lvl_opened )
			inner_lines.push( opts.lines[i] );

			inner_lvl_opened = true;

			continue;
		}

		// $$$ }
		//if( opts.real )
		if( opts.lines[i].indexOf(bukclose) >= 0 || (i == opts.lines.length-1 && open_count != close_count) )
		{
			close_count++;

			// CLOSING INNER LEVEL
			if( open_count == close_count )
			{	
				//console.log( inner_lines )
				var converted_future = ConvertBucklines({
					lines: 			inner_lines,
					instructions:	opts.instructions,
					domain: 		opts.domain,
					delimiter: 		opts.delimiter,
					level: 			opts.level+1,
					
					// Fake Buckclines Always start with iteration 0 
					// because we pretend there are no outer levels 
					iteration: 		0,
					lookup: 		opts.lookup,
					real: 			false
				});

				//console.log(converted_future.back_lookup);


				//----------------------------------------------------------------------------

				// Repeat block as many times as there are different values of variables on the inner level
				// If back lookup is empty (zero variations), repeat block one time
				var times = converted_future.back_lookup.length;
				//times = times > 0 ? times : 1;

				//console.log( "true: " + opts.real );
				//console.log( "times: " + times );


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

					//while(1)
					while( inner_iteration < converted_future.max_different )
					{
						var converted = ConvertBucklines({
														lines: 			inner_lines,
														instructions:	opts.instructions,
														domain: 		opts.domain,
														delimiter: 		opts.delimiter,
														//domain_part: 	k,
														//domain_part: 	converted_future.back_lookup[k],
														level: 			opts.level+1,
														iteration: 		inner_iteration,
														lookup: 		converted_future.back_lookup.length == 0 ? [] : converted_future.back_lookup[k],
														real: 			opts.real
													});

						//if( inner_iteration >= converted.max_different )
						//break;

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
				

				inner_lvl_opened = false;
				open_count = 0;
				close_count = 0;
				inner_lines = [];
			}
			else
			{
				// Only put keys if inner level hasn't just closed
				inner_lines.push( opts.lines[i] );
			}
			
			continue;
		}

		// INNER LEVEL
		// keep adding to inner_lines
		//if( opts.real )
		if( open_count > 0 )
		{
			inner_lines.push( opts.lines[i] );
			continue;
		}


		// SAME LEVEL
		// ### 
		if( opts.lines[i].indexOf(hashkey) >= 0 )
		{
			//console.log( opts.lines[i] )
			var converted = ConvertLine({
											line: opts.lines[i],
											instructions: opts.instructions, 
											domain: opts.domain, 
											domain_part: opts.lookup[0], // because this #var is the same in lookup[0], lookup[1], lookup[2] and so on 
											iteration: opts.iteration,
											lookup: opts.lookup,
											real: opts.real
										} ); 	

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

			if( (converted.werehashes && converted.atleastone) || 
				(converted.werehashes && !converted.atleastone && converted.persist_if_nothing) )
			atleastone = true;



			//console.log(opts.lines[i])
			//console.log(converted.back_lookup)
			
			if( converted.back_lookup.length > 0 )
			{
				back_lookup_empty = false;
				back_lookup = AddLookup( back_lookup, converted.back_lookup );
			}
			//console.log(back_lookup)
			
			if( converted.max_different > max_different )
			max_different = converted.max_different;			

			continue;
		}

		// SAME LEVEL
		// No-### line (including blank)
		// leave it as it is
		//if( opts.real )
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
	var atleastone = false;
	var werehashes = false;
	//var max_different = 1;
	var max_different = 0;
	var back_lookup = [opts.lookup];
	var cross_cutting = false;
	var persist_if_nothing = false;
	var back_lookup_empty = true;

	//console.log("back: " + JSON.stringify(back_lookup))

	function MakeLookup( domain, key )
	{
		var values = {};

		for( var k=0; k<opts.lookup.length; k++ )
		{
			var domain_part = opts.lookup[k];  // 0 1 
			//console.log( domain_part )

			var target = opts.instructions[domain][domain_part][key];

			if( Array.isArray( target ) )
			{
				target = target.slice(0);
				target.sort();
			}

			if( values[ target ] === undefined )
			values[ target ] = [domain_part];
			else
			values[ target ].push(domain_part);
		}
		//console.log( "AAA: " + JSON.stringify(values) )

		//console.log(values)
		var lookup = [];
		for( var k in values )
		{
			//console.log("pushed")
			lookup.push( values[k] );
		}
		//console.log( "BBB: " + JSON.stringify(lookup) )

		return lookup;
	}


	// Check if persists
	var temp = opts.line.match( /\/\*[\s\t]*PERSIST[\s\t]*\*\// );
	if( temp !== null )
	{
		opts.line = opts.line.replace( /\/\*[\s\t]*PERSIST[\s\t]*\*\//g,"");
		persist_if_nothing = true;
	}


	var result = opts.line.replace( /###.+?###/g, function(str)
	{
		werehashes = true;
		cross_cutting = false;

		function Empty(key)
		{
			// Already basic domain — nowhere else too look for
			if( opts.domain == "" )
			return "";

			// No basic level instructions specified
			if( opts.instructions[""] === undefined )
			return "";

			if( opts.instructions[""][0][key] === undefined )
			return "";
			else
			{
				if( Array.isArray(opts.instructions[""][0][key][0]) )
				return opts.instructions[""][0][key][0];
				else
				return opts.instructions[""][0][key];
			}

			return "";
		}


		var key = str.substr(3,str.length-6).trim();


		// See if crosscutting
		if( key.indexOf("(") >= 0 )
		{
			cross_cutting = true;

			key = key.split(/[()]/).join("").trim();
		}



		// Unknown domain
		if( opts.instructions[opts.domain] === undefined )
		{
			return Empty(key);
		}

		// If domain part is undefined. Probably because the lookup was empty
		if( opts.domain_part === undefined )
		{
			//console.log( "AGA" )
			return Empty(key);
		}

		// Key doesn't exist in the specified domain
		if( opts.instructions[opts.domain][opts.domain_part][key] === undefined )
		{
			return Empty(key);
		}

		// It's Array, but key iteration doesn't exist
		// Asking for an iteration of array that doesn't exist
		// so it must return a blank string so iterations can stop
		if( Array.isArray(opts.instructions[opts.domain][opts.domain_part][key]) && 
			opts.instructions[opts.domain][opts.domain_part][key][opts.iteration] === undefined )
		{
			return "";
		}

		/*
		// It's Array, key iteration exists but it's empty
		// So return empty string, but set max_deifferent and lookup if this isn't real 
		// because if it's unreal FutureBuck, it always starts with iteration 0 and it should know it 
		if( Array.isArray(opts.instructions[opts.domain][opts.domain_part][key]) && 
			opts.instructions[opts.domain][opts.domain_part][key][opts.iteration] !== undefined && 
			opts.instructions[opts.domain][opts.domain_part][key][opts.iteration] == "" )
		{
			if( !opts.real )
			{
				if( opts.instructions[opts.domain][opts.domain_part][key].length > max_different )
				max_different = opts.instructions[opts.domain][opts.domain_part][key].length;

				back_lookup_empty = false;
				back_lookup = AddLookup( back_lookup, MakeLookup( opts.domain, key ) );
			}

			return "";
		}
		*/


		// If it's array
		if( Array.isArray(opts.instructions[opts.domain][opts.domain_part][key]) )
		{

			if( opts.instructions[opts.domain][opts.domain_part][key].length > max_different )
			max_different = opts.instructions[opts.domain][opts.domain_part][key].length;

			back_lookup_empty = false;
			back_lookup = AddLookup( back_lookup, MakeLookup( opts.domain, key ) );

			// Only consider atleastone if string is not empty
			// Cause if it's empty, it means that nothing was cpecified in the instruction for this particular iteration
			var ret = opts.instructions[opts.domain][opts.domain_part][key][opts.iteration];
			if( ret.length != 0 )
				atleastone = true;
			
			return ret;
		} 
		else // Not array
		{
			if( 1 > max_different )
			max_different = 1;

			back_lookup_empty = false;
			back_lookup = AddLookup( back_lookup, MakeLookup( opts.domain, key ) );


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
				// Only consider atleastone if string is not empty
				// Cause if it's empty, it means that nothing was cpecified in the instruction
				var ret = opts.instructions[opts.domain][opts.domain_part][key];
				if( ret.length != 0 )
					atleastone = true;
				
				return ret;
			
				//atleastone = true;
				//return opts.instructions[opts.domain][opts.domain_part][key];
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













