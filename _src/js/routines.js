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
		});
		
	});
}


// Convertions ------------------------------------------

function ConvertDir( dirname, extfilter, instructions )
{
	// Rename directory if it has ###variables### in the name -------------------
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
			if( extfilter.indexOf(path.extname(Path)) == -1 )
			{
				ConvertFile( Path, instructions );
				fs.renameSync( Path, path.join( newdirname, ConvertText(filename, instructions) ));
			}

	    }
	    else if( stat.isDirectory() )
		{
	        ConvertDir( Path, extfilter, instructions );
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

			domain = GetDomainName(lines[i]);
			delimiter = GetDelimiter(lines[i]);
			conditions = GetConditions(lines[i]);

			continue;
		}

		// ENDING $$$ or the end line
		if( (buk_started && lines[i].indexOf(bukkey) > -1 && lines[i].indexOf(bukopen) == -1 && lines[i].indexOf(bukclose) == -1) 
			|| ( buk_started && i == lines.length-1 ) )
		{
			//console.log( "buk_lines: " + buk_lines )
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
							delimiter: delimiter,
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
	//console.log([].concat(bukopen, opts.lines, bukclose))

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


function PushDelimiter(result_lines, delimiter)
{
	//var temp;

	if( result_lines[ result_lines.length-1 ] === undefined )
		result_lines.push( Unescape(delimiter) );
	else
		result_lines[ result_lines.length-1 ] = result_lines[ result_lines.length-1 ] + Unescape(delimiter);

	//return temp;
}


function ConvertBucklines( opts ) 
{
	//console.log( opts.real )
	//console.log( opts.lines )
	//console.log( "iter: " + opts.iteration )

	var result_lines = [];

	var inner_lines = [];
	var open_count = 0;
	var close_count = 0;
	var not_iterate = false;
	var inner_lvl_opened = false;
	var back_lookup_empty = true;

	// To return
	var max_different = 0;
	var max_sub_different = 0;
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
					//console.log( "fake" )
					//console.log(inner_lines.join("\n"));

					var converted_future = ConvertBucklines({
												lines: 			inner_lines,
												instructions:	opts.instructions,
												domain: 		opts.domain,
												delimiter: 		opts.delimiter,
												level: 			opts.level+1,
												
												// Fake Buckclines Always start with the parent lookup 
												// but with the iteration 0 because we pretend there are no outer levels 
												//iteration: 		not_iterate ? opts.iteration : 0,
												// CHEK
												iteration: 		opts.iteration,
												lookup: 		opts.lookup,
												real: 			false
											});

					//console.log( "back_lookup.length: " + converted_future.back_lookup.length)
					//console.log( "max_different: " + converted_future.max_different)
					//console.log( "max_sub_different: " + converted_future.max_sub_different)

					//----------------------------------------------------------------------------

					// Repeat block as many times as there are different variations of #vars on the inner level/
					// values of variables on the inner level
					var times = converted_future.back_lookup.length;

					for( var k=0; k<times; k++ )
					{
						var inner_iteration = 0;
						var repeats_put = 0;

						if( not_iterate && converted_future.max_different > 0 )
						{
							// Repeat only once with the parent iteration
							inner_iteration = opts.iteration;
							converted_future.max_different = inner_iteration+1;
						}

						while( inner_iteration < converted_future.max_different )
						{
							var inner_sub_iteration = 0;
							
							while( inner_sub_iteration < 
									(converted_future.max_sub_different == 0 ? 1 : converted_future.max_sub_different) 
							)
							{
								var converted = ConvertBucklines({
													lines: 			inner_lines,
													instructions:	opts.instructions,
													domain: 		opts.domain,
													delimiter: 		opts.delimiter,
													level: 			opts.level+1,
													iteration: 		inner_iteration,

													// if there's 0 subiterations in the future, pass undefined so 
													// it doesn't consider it at all
													sub_iteration: 	converted_future.max_sub_different == 0 ? undefined : inner_sub_iteration,
													lookup: 		converted_future.back_lookup[k],
													real: 			opts.real
												});


								if( converted.atleastone )
								{
									//console.log("atleastone");
									if( repeats_put != 0 && opts.delimiter != "" )
									PushDelimiter(result_lines,opts.delimiter);

									result_lines = result_lines.concat( converted.result );

									repeats_put++;
								}

								inner_sub_iteration++;
							}	

							inner_iteration++;
						}


						// No delimiter needed if everything was empty
						//if( converted_future.max_different == 0 )
						//continue;
						if( converted_future.max_different > 0 && k != times-1 )	
						PushDelimiter(result_lines,opts.delimiter); 
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
			//console.log("df " + opts.lines[i])
			var converted = ConvertLine({
								line: opts.lines[i],
								instructions: opts.instructions, 
								domain: opts.domain, 
								delimiter: opts.delimiter,

								// because this #var is the same in lookup[0], lookup[1], lookup[2] and so on 
								domain_part: opts.lookup[0],

								iteration: opts.iteration,
								sub_iteration: opts.sub_iteration,
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

			if( converted.max_sub_different > max_sub_different )
			max_sub_different = converted.max_sub_different;			

			continue;
		}

		// SAME LEVEL
		// No-### line (including blank)
		// leave it as it is
		result_lines.push( opts.lines[i] );
	}

		
	if(back_lookup_empty)
	back_lookup = [];

	//console.log( "max_different: " + max_different )
	//console.log( "max_sub_different: " + max_sub_different )
	//console.log(max_sub_different)
	
	return {
				result: result_lines, 
				max_different: max_different, 
				max_sub_different: max_sub_different,
				back_lookup: back_lookup,
				atleastone: atleastone
			};
}

function ConvertLine( opts ) 
{
	//console.log( opts );
	//console.log(opts.sub_iteration)

	var back_lookup_empty = true;

	// To return
	var atleastone = false;
	var werehashes = false;
	var persist_if_nothing = false;
	var max_different = 0;
	var max_sub_different = 0;
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
		//console.log(key)
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
		// so it must return a blank string 
		if( Array.isArray(opts.instructions[opts.domain][opts.domain_part][key]) && 
			opts.instructions[opts.domain][opts.domain_part][key][opts.iteration] === undefined )
		{
			return "";
		}

		// There are subiterations in iterations, but this particular subiteration is empty
		if( opts.sub_iteration !== undefined &&
			Array.isArray(opts.instructions[opts.domain][opts.domain_part][key][opts.iteration]) &&
			opts.instructions[opts.domain][opts.domain_part][key][opts.iteration][opts.sub_iteration] === undefined )
		{
			return "";
		}

		// There are no subiterations in iteration and subiteration is not 0
		if( opts.sub_iteration !== undefined &&
			!Array.isArray(opts.instructions[opts.domain][opts.domain_part][key][opts.iteration]) &&
			opts.sub_iteration != 0 )
		{
			return "";
		}		




		
		// Set max_diferent and back_lookup even if the target value is empty
		// because we only need it for FutureBuck analysis
		if( opts.instructions[opts.domain][opts.domain_part][key].length > max_different )
		max_different = opts.instructions[opts.domain][opts.domain_part][key].length;

		//if( opts.sub_iteration !== undefined )
		if( Array.isArray(opts.instructions[opts.domain][opts.domain_part][key][opts.iteration]) )
		if( opts.instructions[opts.domain][opts.domain_part][key][opts.iteration].length > max_sub_different )
		max_sub_different = opts.instructions[opts.domain][opts.domain_part][key][opts.iteration].length;


		back_lookup_empty = false;
		back_lookup = AddLookup( back_lookup, MakeLookup( opts.domain, key, opts ) );


		// Only set atleastone if string is not empty
		// Cause if it's empty, it means that nothing was cpecified in the instruction for this particular iteration
		var ret = "";


		// No subiteration specified or specified but there are no actual subiterations
/*		if( opts.sub_iteration === undefined || !Array.isArray(opts.instructions[opts.domain][opts.domain_part][key][opts.iteration]) )
		{
			if( Array.isArray(opts.instructions[opts.domain][opts.domain_part][key][opts.iteration]) )
			ret = opts.instructions[opts.domain][opts.domain_part][key][opts.iteration][0];
			else
			ret = opts.instructions[opts.domain][opts.domain_part][key][opts.iteration];
		}
		else
		ret = opts.instructions[opts.domain][opts.domain_part][key][opts.iteration][opts.sub_iteration];
*/


		// Subiteration specified 
		if( opts.sub_iteration !== undefined )
		{
			// there are actual subiterations
			if( Array.isArray(opts.instructions[opts.domain][opts.domain_part][key][opts.iteration]) )
				ret = opts.instructions[opts.domain][opts.domain_part][key][opts.iteration][opts.sub_iteration];
			else
				ret = opts.instructions[opts.domain][opts.domain_part][key][opts.iteration];
		}
		// Not specified 
		else
		{
			// there are actual subiterations
			if( Array.isArray(opts.instructions[opts.domain][opts.domain_part][key][opts.iteration]) )
				ret = opts.instructions[opts.domain][opts.domain_part][key][opts.iteration][0];			
			else
				ret = opts.instructions[opts.domain][opts.domain_part][key][opts.iteration];
		}

		




		if( ret.length != 0 )
		atleastone = true;
		
		return ret;

	})

	// If nothing was found
	if( back_lookup_empty )
	back_lookup = [];
	
	
	return { 
			atleastone: atleastone, 
			werehashes: werehashes, 
			persist_if_nothing: persist_if_nothing,
			max_different: max_different, 
			max_sub_different: max_sub_different, 
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
	var content_lines = 0;
	var current_domain = "";
	
	// It remembers how many times certain domain was described in the file 
	var domain_counter = {"":0};
	var can_be_domains = true;

	BrackRec( lines, can_be_domains, false );

	function BrackRec( lines, can_be_domains, inner_bracket_content_just_started )
	{	
		//console.log("BrackRec " + can_be_domains)
		//console.log(lines)

		function StoreProperly(instructions, domain_counter, domain, key_name, content, iteration )
		{
			var domain_part = domain_counter[domain];

			// Create domain if is doesn't exist
			if( instructions[domain] === undefined )
			{
				instructions[domain] = []; // domain is array
				//instructions[domain] = {}; // domain is object
			}


			// Create domain part if it doesn't exist
			if( instructions[domain][domain_part] === undefined )
			{
				instructions[domain][domain_part] = {};
			}


			// Key is empty — put the key
			if( instructions[domain][domain_part][key_name] === undefined )
			{
				instructions[domain][domain_part][key_name] = [];
			} 
			
			// Iteration is empty
			if( instructions[domain][domain_part][key_name][iteration] === undefined )
			instructions[domain][domain_part][key_name][iteration] = content;
			else
			{
				if( Array.isArray( instructions[domain][domain_part][key_name][iteration] ) )
				{
					instructions[domain][domain_part][key_name][iteration].push(content);

				} else
				{
					instructions[domain][domain_part][key_name][iteration] = [ instructions[domain][domain_part][key_name][iteration], content ];
				}
			}
		}

		function UpdateRepeats()
		{
			//console.log( "boundary_key: " + boundary_key );
			//console.log( "current_key: " + current_key );

			// There's a boundary key 
			if( boundary_key !== undefined )
			{
				// if the current_key equals a boundary key
				if( boundary_key == current_key )
				{
					current_iteration++;
					//console.log( "REPEATED" );
				}

			} else
			// There's NO boundary key yet
			{
				// If current key is already in instructions, remember current key as a boundary key
				if( namespace.indexOf( current_key ) >= 0 || inner_bracket_content_just_started )
				{
					boundary_key = current_key;

					if( !inner_bracket_content_just_started )
					current_iteration++;

					if( inner_bracket_content_just_started )
					inner_bracket_content_just_started = false;
					
					//console.log( "just set BK: " + boundary_key );
				} else
				{
					namespace.push( current_key );
				}
			}

			//console.log( "---" );
		}
		
		function FlushRepeats()
		{
			current_iteration = 0;
			boundary_key = undefined;	
			namespace = [];	
		}

		var open_count = 0;
		var close_count = 0;
		var hash_started = false;
		var pseudo_hash_started = false;
		var current_key = "";
		var current_content = "";

		var current_iteration = 0;
		var boundary_key = undefined;
		var namespace = [];

		var inner_started = false;
		var domain_started = false;
		var inner_lines = [];

		for( var i=0; i < lines.length; i++ ) 
		{
			// Comments -------------------------------------------------------------

			// Ignoring lines starting with // that aren't in the ### block
			if( !pseudo_hash_started && !hash_started && lines[i].trim()[0] == "/" && lines[i].trim()[1] == "/"  )
			{
				continue;
			}


			// Bracket groups -------------------------------------------------------------

			if( !hash_started && (inner_started || domain_started) )
			{

				//console.log("inner line: " + lines[i])

				// Pseudo ### ------------------------------------
				// Pseudohash begin
				if( !pseudo_hash_started && lines[i].indexOf(hashkey) >= 0 )
				{
					//console.log("opened hash")
					pseudo_hash_started = true;
					inner_lines.push( lines[i] );
					continue;
				}

				// Pseudohash end
				if( pseudo_hash_started && lines[i].indexOf(hashkey) >= 0 )
				{
					//console.log("closed hash")
					pseudo_hash_started = false;
					inner_lines.push( lines[i] );
					continue;
				}

				// Pseudohash body
				if( pseudo_hash_started )
				{
					inner_lines.push( lines[i] );
					continue;
				}


				// Everything else -------------------------------------------
				// If this is an inner-closing bracket 
				if( lines[i].trim()[0] == braceclose && open_count == close_count+1 )
				{
					// Pass on the } to the next instructions
				
				} else
				{
					if( !pseudo_hash_started && lines[i].trim()[0] == braceclose )
					close_count++;

					if( !pseudo_hash_started && lines[i].trim()[0] == braceopen )
					open_count++;

					
					inner_lines.push( lines[i] );
					continue;
				}
			}



			// DOMAIN ------------------------------------------------------------

			if( can_be_domains )
			{

				// {DOMAIN NAME}
				if( !hash_started && lines[i].trim()[0] == braceopen && open_count == close_count )
				{


					open_count++;
					

					
					// May be "" if no dmain specified
					current_domain = lines[i].split(braceopen)[1].trim();
						//console.log("current_domain: " + current_domain)
					
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

					domain_started = true;
					continue;
				}

				// END OF DOMAIN
				if( !hash_started && domain_started && lines[i].trim()[0] == braceclose && open_count == close_count+1 )
				{

					//console.log( "close domain" )
					close_count++;

					BrackRec( inner_lines, false, false );
					domain_started = false;
					inner_lines = [];
				
					current_domain = "";
			
					continue;
				}
			}



			// Inner { bracket group } ------------------------------------------------------------

			// Inner {
			if( !hash_started && lines[i].trim()[0] == braceopen && open_count == close_count )
			{

				//console.log("inner {");
				open_count++;

				inner_started = true;

				continue;
			}

			// Inner }
			if( !hash_started && inner_started && lines[i].trim()[0] == braceclose && open_count == close_count+1 )
			{

				//console.log("inner }");
				close_count++;

				BrackRec( inner_lines, false, true );
				inner_started = false;
				inner_lines = [];

				continue;
			}




			// console.log(lines[i])
			// console.log("current_domain: " + current_domain)
			// console.log("domain_part: " + domain_counter[current_domain])

			// console.log("current_iteration: " + current_iteration)
			// console.log("boundary_key: " + boundary_key)
			// console.log("namespace: " + namespace)


			// VARIABLES ------------------------------------------------------------

			// @@@
			if( !hash_started && lines[i].indexOf(atkey) > -1 )
			{
				//var arr = lines[i].trim().split(/[\s\t]+(.*)/);
				var arr = lines[i].trim().split(/\s+(.*)/, 2);
				
				current_key = arr[0].split(atkey)[1];
				current_content = (arr[1] !== undefined ? arr[1] : "").trim();

				//console.log("See var: " + current_key + ": " + current_content)

				UpdateRepeats();
				StoreProperly(instructions, domain_counter, current_domain, current_key, current_content, current_iteration);

				current_key = "";
				current_content = "";

				continue;
			}


			// OPEN ###
			if( !hash_started && lines[i].indexOf(hashkey) >= 0 )
			{			
				hash_started = true;

				current_key = lines[i].split(hashkey)[1].trim();

				continue;
			}

			if( hash_started )
			{
				//console.log("hash: " +  lines[i])

				//console.log( lines[i] );
				if( lines[i].indexOf(hashkey) == -1 )
				{
					if( content_lines > 0 )
					current_content += "\n";				

					current_content += lines[i];
					content_lines++;
				} else // CLOSE ###
				{				
					UpdateRepeats();
					StoreProperly(instructions, domain_counter, current_domain, current_key, current_content, current_iteration);
		
					current_key = "";
					current_content = "";
					content_lines = 0;

					hash_started = false;
				}
				
				continue;
			}
		}
	}	

	//console.log( JSON.stringify(instructions) )
	return instructions;
}

/*
function GetInstructionsFromFileContent( content )
{
	var lines = content.split(/\r?\n/);

	var instructions = {};	
	var content_lines = 0;
	var current_domain = "";
	
	// It remembers how many times certain domain was described in the file 
	var domain_counter = {"":0};
	var can_be_domains = true;

	BrackRec( lines, can_be_domains );

	function BrackRec( lines, can_be_domains )
	{	
		//console.log("BrackRec " + can_be_domains)
		//console.log(lines)

		function StoreProperly(instructions, domain_counter, domain, key_name, content, iteration )
		{
			var domain_part = domain_counter[domain];

			// Create domain if is doesn't exist
			if( instructions[domain] === undefined )
			{
				instructions[domain] = []; // domain is array
				//instructions[domain] = {}; // domain is object
			}


			// Create domain part if it doesn't exist
			if( instructions[domain][domain_part] === undefined )
			{
				instructions[domain][domain_part] = {};
			}


			// Key is empty — put the key
			if( instructions[domain][domain_part][key_name] === undefined )
			{
				instructions[domain][domain_part][key_name] = [];
			} 
			
			// Iteration is empty
			if( instructions[domain][domain_part][key_name][iteration] === undefined )
			instructions[domain][domain_part][key_name][iteration] = content;
			else
			{
				if( Array.isArray( instructions[domain][domain_part][key_name][iteration] ) )
				{
					instructions[domain][domain_part][key_name][iteration].push(content);

				} else
				{
					instructions[domain][domain_part][key_name][iteration] = [ instructions[domain][domain_part][key_name][iteration], content ];
				}
			}
		}

		function UpdateRepeats()
		{
			//console.log( boundary_key );
			//console.log( current_key );
			//console.log( "---" );

			// There's a boundary key 
			if( boundary_key !== undefined )
			{
				// if the current_key equals a boundary key
				if( boundary_key == current_key )
				{
					current_iteration++;
					//console.log( "REPEATED" );
				}

			} else
			// There's NO boundary key yet
			{
				// If current key is already in instructions, remember current key as a boundary key
				if( namespace.indexOf( current_key ) >= 0 )
				{
					boundary_key = current_key;
					current_iteration++;
					//console.log( boundary_key );
				} else
				{
					namespace.push( current_key );
				}
			}
		}
		
		function FlushRepeats()
		{
			current_iteration = 0;
			boundary_key = undefined;	
			namespace = [];	
		}

		var open_count = 0;
		var close_count = 0;
		var hash_started = false;
		var pseudo_hash_started = false;
		var current_key = "";
		var current_content = "";

		var current_iteration = 0;
		var boundary_key = undefined;
		var namespace = [];

		var inner_started = false;
		var domain_started = false;
		var inner_lines = [];

		for( var i=0; i < lines.length; i++ ) 
		{
			// Comments -------------------------------------------------------------

			// Ignoring lines starting with // that aren't in the ### block
			if( !pseudo_hash_started && !hash_started && lines[i].trim()[0] == "/" && lines[i].trim()[1] == "/"  )
			{
				continue;
			}



			// Bracket groups -------------------------------------------------------------

			if( !hash_started && (inner_started || domain_started) )
			{
				//console.log("inner line: " + lines[i])

				// Pseudo ### ------------------------------------
				// Pseudohash begin
				if( !pseudo_hash_started && lines[i].indexOf(hashkey) >= 0 )
				{
					//console.log("opened hash")
					pseudo_hash_started = true;
					inner_lines.push( lines[i] );
					continue;
				}

				// Pseudohash end
				if( pseudo_hash_started && lines[i].indexOf(hashkey) >= 0 )
				{
					//console.log("closed hash")
					pseudo_hash_started = false;
					inner_lines.push( lines[i] );
					continue;
				}

				// Pseudohash body
				if( pseudo_hash_started )
				{
					inner_lines.push( lines[i] );
					continue;
				}


				// Everything else -------------------------------------------
				// If this is an inner-closing bracket 
				if( lines[i].trim()[0] == braceclose && open_count == close_count+1 )
				{
					// Pass on the } to the next instructions
				
				} else
				{
					if( !pseudo_hash_started && lines[i].trim()[0] == braceclose )
					close_count++;

					if( !pseudo_hash_started && lines[i].trim()[0] == braceopen )
					open_count++;

					
					inner_lines.push( lines[i] );
					continue;
				}
			}



			// DOMAIN ------------------------------------------------------------

			if( can_be_domains )
			{
				// {DOMAIN NAME}
				if( !hash_started && lines[i].trim()[0] == braceopen && open_count == close_count )
				{
					open_count++;
					
					
					// May be "" if no dmain specified
					current_domain = lines[i].split(braceopen)[1].trim();
						//console.log("current_domain: " + current_domain)
					
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

					domain_started = true;
					continue;
				}

				// END OF DOMAIN
				if( !hash_started && domain_started && lines[i].trim()[0] == braceclose && open_count == close_count+1 )
				{
					//console.log( "close domain" )
					close_count++;

					BrackRec( inner_lines, false );
					domain_started = false;
					inner_lines = [];
				
					current_domain = "";
			
					continue;
				}
			}



			// Inner { bracket group } ------------------------------------------------------------

			// Inner {
			if( !hash_started && lines[i].trim()[0] == braceopen && open_count == close_count )
			{
				//console.log("inner {");
				open_count++;

				inner_started = true;

				continue;
			}

			// Inner }
			if( !hash_started && inner_started && lines[i].trim()[0] == braceclose && open_count == close_count+1 )
			{
				//console.log("inner }");
				close_count++;

				BrackRec( inner_lines, false );
				inner_started = false;
				inner_lines = [];

				continue;
			}




			// console.log(lines[i])
			// console.log("current_domain: " + current_domain)
			// console.log("domain_part: " + domain_counter[current_domain])

			// console.log("current_iteration: " + current_iteration)
			// console.log("boundary_key: " + boundary_key)
			// console.log("namespace: " + namespace)


			// VARIABLES ------------------------------------------------------------

			// @@@
			if( !hash_started && lines[i].indexOf(atkey) > -1 )
			{
				//var arr = lines[i].trim().split(/[\s\t]+(.*)/);
				var arr = lines[i].trim().split(/\s+(.*)/, 2);
				
				current_key = arr[0].split(atkey)[1];
				current_content = (arr[1] !== undefined ? arr[1] : "").trim();

				//console.log("See var: " + current_key)

				UpdateRepeats();
				StoreProperly(instructions, domain_counter, current_domain, current_key, current_content, current_iteration);

				current_key = "";
				current_content = "";

				continue;
			}


			// OPEN ###
			if( !hash_started && lines[i].indexOf(hashkey) >= 0 )
			{			
				hash_started = true;

				current_key = lines[i].split(hashkey)[1].trim();

				continue;
			}

			if( hash_started )
			{
				//console.log("hash: " +  lines[i])

				//console.log( lines[i] );
				if( lines[i].indexOf(hashkey) == -1 )
				{
					if( content_lines > 0 )
					current_content += "\n";				

					current_content += lines[i];
					content_lines++;
				} else // CLOSE ###
				{				
					UpdateRepeats();
					StoreProperly(instructions, domain_counter, current_domain, current_key, current_content, current_iteration);
		
					current_key = "";
					current_content = "";
					content_lines = 0;

					hash_started = false;
				}
				
				continue;
			}
		}
	}	

	//console.log( JSON.stringify(instructions) )
	return instructions;
}
*/


// Restoring instead of recursion on domains
/*
function GetInstructionsFromFileContent( content )
{
	var lines = content.split(/\r?\n/);

	var instructions = {};	
	var hash_started = false;
	var open_count = 0;
	var close_count = 0;
	var current_key = "";
	var current_content = "";
	var content_lines = 0;
	var current_domain = "";
	
	// It remembers how many times certain domain was described in the file 
	var domain_counter = {"":0};

	BrackRec( lines );

	function BrackRec( lines )
	{	
		console.log("BrackRec")
		//console.log(lines)

		function StoreProperly(instructions, domain_counter, domain, key_name, content, iteration )
		{
			var domain_part = domain_counter[domain];

			// Create domain if is doesn't exist
			if( instructions[domain] === undefined )
			{
				instructions[domain] = []; // domain is array
				//instructions[domain] = {}; // domain is object
			}


			// Create domain part if it doesn't exist
			if( instructions[domain][domain_part] === undefined )
			{
				instructions[domain][domain_part] = {};
			}


			// Key is empty — put the key
			if( instructions[domain][domain_part][key_name] === undefined )
			{
				instructions[domain][domain_part][key_name] = [];
			} 
			
			// Iteration is empty
			if( instructions[domain][domain_part][key_name][iteration] === undefined )
			instructions[domain][domain_part][key_name][iteration] = content;
			else
			{
				if( Array.isArray( instructions[domain][domain_part][key_name][iteration] ) )
				{
					instructions[domain][domain_part][key_name][iteration].push(content);

				} else
				{
					instructions[domain][domain_part][key_name][iteration] = [ instructions[domain][domain_part][key_name][iteration], content ];
				}
			}
		}

		function UpdateRepeats()
		{
			//console.log( boundary_key );
			//console.log( current_key );
			//console.log( "---" );

			// There's a boundary key 
			if( boundary_key !== undefined )
			{
				// if the current_key equals a boundary key
				if( boundary_key == current_key )
				{
					current_iteration++;
					//console.log( "REPEATED" );
				}

			} else
			// There's NO boundary key yet
			{
				// If current key is already in instructions, remember current key as a boundary key
				if( namespace.indexOf( current_key ) >= 0 )
				{
					boundary_key = current_key;
					current_iteration++;
					//console.log( boundary_key );
				} else
				{
					namespace.push( current_key );
				}
			}
		}
		
		function FlushRepeats()
		{
			current_iteration = 0;
			boundary_key = undefined;	
			namespace = [];	
		}

		function RestoreRepeats()
		{
			current_iteration = current_iteration_stored;
			boundary_key = boundary_key_stored;	
			namespace = namespace_stored;	
		}

		function SaveRepeats()
		{
			current_iteration_stored = current_iteration;
			boundary_key_stored = boundary_key;	
			namespace_stored = namespace;	
		}

		var current_iteration_stored = 0;
		var boundary_key_stored = undefined;
		var namespace_stored = [];

		var current_iteration = 0;
		var boundary_key = undefined;
		var namespace = [];

		var inner_started = false;
		var inner_lines = [];

		for( var i=0; i < lines.length; i++ ) 
		{
			// Inner { bracket group } ------------------------------------------------------------

				// Inner }
				if( inner_started && !hash_started && lines[i].trim()[0] == braceclose && open_count == close_count+2 )
				{
					//console.log("inner }");
					close_count++;

					//if( open_count == close_count+1 )
					//{
						BrackRec( inner_lines );
						inner_started = false;
						inner_lines = [];
					//}

					continue;
				}

				// Everything between inner { and }
				if( inner_started )
				{
					//console.log("inner line")

					if( lines[i].trim()[0] == braceclose )
					close_count++;

					if( lines[i].trim()[0] == braceopen )
					open_count++;

					inner_lines.push( lines[i] );
					continue;
				}

				// Inner {
				if( !hash_started && lines[i].trim()[0] == braceopen && open_count != close_count )
				{
					//console.log("inner {");
					open_count++;

					//FlushRepeats();
					inner_started = true;

					continue;
				}
			
			//---------------------------------------------------------------------------------------


			// Comments
			// Ignoring lines starting with // that aren't in the ### block
			if( !hash_started && lines[i].trim()[0] == "/" && lines[i].trim()[1] == "/"  )
			{
				continue;
			}

			// {DOMAIN NAME}
			if( !hash_started && lines[i].trim()[0] == braceopen && open_count == close_count )
			{
				open_count++;
				
				// Set repeat to 0 and boundary to undefined because this is a new domain
				SaveRepeats();
				FlushRepeats();
				
				// May be "" if no dmain specified
				current_domain = lines[i].split(braceopen)[1].trim();
				//console.log("current_domain: " + current_domain)
				
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



			// END OF DOMAIN
			if( !hash_started && lines[i].trim()[0] == braceclose && open_count == close_count+1 )
			{
				//console.log( "close domain" )
				close_count++;

				//FlushRepeats();
				RestoreRepeats();
				
				current_domain = "";
				
				continue;
			}





			// @@@
			if( lines[i].indexOf(atkey) > -1 )
			{
				//var arr = lines[i].trim().split(/[\s\t]+(.*)/);
				var arr = lines[i].trim().split(/\s+(.*)/, 2);
				
				current_key = arr[0].split(atkey)[1];
				current_content = (arr[1] !== undefined ? arr[1] : "").trim();

				//console.log("See var: " + current_key)

				UpdateRepeats();
				StoreProperly(instructions, domain_counter, current_domain, current_key, current_content, current_iteration);

				current_key = "";
				current_content = "";

				continue;
			}


			// OPEN ###
			if( !hash_started && lines[i].indexOf(hashkey) > -1 )
			{			
				hash_started = true;

				current_key = lines[i].split(hashkey)[1].trim();

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
					UpdateRepeats();
					StoreProperly(instructions, domain_counter, current_domain, current_key, current_content, current_iteration);
		
					current_key = "";
					current_content = "";
					content_lines = 0;

					hash_started = false;
				}
				
				continue;
			}
		}
	}	

	console.log( JSON.stringify(instructions) )
	return instructions;
}
*/




