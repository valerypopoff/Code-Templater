function Unescape(str)
{
	return str.replace(/\\n/g, "\n").
				replace(/\\t/g, "\t").
				replace(/\\r/g, "\r");
}


function GetWhatInQuotes( str, i )
{
	var reg = /"([^"]*)"/g;
	var temp = [];

	var some;
	while((some = reg.exec(str)) !== null)
	{
		temp.push(some);
	}

	return temp[i] === undefined ? "" : temp[i][1];
}

function GetConditions( str )
{
    // Return [] if there's no WHERE
    if( str.indexOf("WHERE") < 0 )
    return [];
    
    
    var conditions_str = "";
    
    // Getting string thet goes after WHERE
    var split = str.split("WHERE");
    conditions_str = split[ split.length-1 ];
    
    var regex = /[\s\t]*([^\s\t=\!]*)[\s\t]*([^\s\t]*?)[\s\t]*"[\s\t]*(.*?)[\s\t]*"/g;
    var matches, output = [];
    while (matches = regex.exec(conditions_str))
    {
        output.push( { field: matches[1], cmp: matches[2], value: matches[3] } );
    }

    //console.log( output )
    
    return output;
}

//var str = '$$$ DOMAIN="ACE" DELIMITER="," WHERE PARAM_TYPE_C2 != "StringParam" PARAM_TYPE_C4 == "StringParam2"';

//console.log( JSON.stringify(GetConditions(str)) );




function DomainPartFulfils(conditions, domainpart)
{
	var result_bool = true;
	
	// Run through all conditions
	conditions.forEach(function(curr)
	{
		// Current target to compare to
		var target = domainpart[curr.field];
		
		// If current filed doesn't exist, pretend it's ""
		if( target === undefined )
		target = "";
		
		
		if( Array.isArray(target) )
		{
			var temp_bool = false;
			
			target.forEach(function(target_iter)
			{
				switch( curr.cmp )
				{
					case "=":	temp_bool = temp_bool || (target_iter == curr.value); break;
					case "==":	temp_bool = temp_bool || (target_iter == curr.value); break;
					case "!=":	{
									if( target_iter == curr.value )
									result_bool = false;
									
									if( target_iter != curr.value )
									temp_bool = temp_bool || (target_iter != curr.value);
								} break;
				}
			});
			
			result_bool = result_bool && temp_bool;
		} else
		{
			switch( curr.cmp )
			{
				case "=":	result_bool = result_bool && (target == curr.value); break;
				case "==":	result_bool = result_bool && (target == curr.value); break;
				case "!=":	result_bool = result_bool && (target != curr.value); break;
			}
		}				
	});
	
	return result_bool;
}



/*function GetCondition( str )
{
    var temp = str.match( /WHERE[\s\t]+([^\s\t]*)[\s\t]*=[\s\t]*"(.+)"/ );

    if( temp === null )
        return { field: "", value: "" };
    else
        return { field: temp[1], value: temp[2] };
}*/

function GetDomainName( str )
{
    var temp = str.match( /DOMAIN[\s\t]*=[\s\t]*"(.*?)"/ );

    if( temp === null )
        return "";
    else
        return temp[1];
}

function GetDelimiter( str )
{
    //var temp = str.match( /DELIMITER[\s\t]*=[\s\t]*"(.*?)"/ );
    var temp = str.match( /DELIMITER[\s\t]*=[\s\t]*"(.*?)(?<!(?<!\\)\\)"/ );

    if( temp === null )
        return "";
    else
    {
        //return temp[1];

        try
        {
            return JSON.parse('"' + temp[1] + '"')
        }
        catch(e)
        {
            return temp[1];
        }

    }
}


function deleteFolderRecursive(dirpath) 
{
    var files = [];
    if( fs.existsSync(dirpath) ) 
    {
        files = fs.readdirSync(dirpath);
        files.forEach(function(file,index)
        {
            //var curPath = dirpath + "/" + file;
            var curPath = path.join(dirpath, file);

            if(fs.lstatSync(curPath).isDirectory()) 
            { 
            	// recurse
                deleteFolderRecursive(curPath);
            } else 
            { 	
            	// delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dirpath);
    }
};

Array.prototype.removeByValueVP = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

function CountOccur( value, arr )
{
    count = 0;

    for( var i=0; i<arr.length; i++ )
    if( arr[i] == value )
    count++;

    return count;
}

function CheckIs( target, one_, two_ )
{
	one = one_.map(function(arr){return arr.slice()});
	two = two_.map(function(arr){return arr.slice()});
    
    for( var i=0; i<target.length; i++ )
    {
        for( var k=0; k<one.length; k++ )
        if( one[k].indexOf( target[i] ) >= 0 )
        one[k][ one[k].indexOf(target[i]) ] = "x";

        for( var k=0; k<two.length; k++ )
        if( two[k].indexOf(target[i]) >= 0 )
        two[k][ two[k].indexOf(target[i]) ] = "x";
    }

    for( var k=0; k<one.length; k++ )
    if( target.length == CountOccur('x', one[k]) )
    return true;

    for( var k=0; k<two.length; k++ )
    if( target.length == CountOccur('x', two[k]) )
    return true;
	

    //console.log( one );
    //console.log( two );
    return false;
}

function CheckNot( target, one_, two_ )
{
	one = one_.map(function(arr){return arr.slice()});
	two = two_.map(function(arr){return arr.slice()});
	
    for( var i=0; i<target.length; i++ )
    {
        for( var k=0; k<one.length; k++ )
        if( one[k].indexOf( target[i] ) >= 0 )
        one[k][ one[k].indexOf(target[i]) ] = "x";

        for( var k=0; k<two.length; k++ )
        if( two[k].indexOf(target[i]) >= 0 )
        two[k][ two[k].indexOf(target[i]) ] = "x";
    }
    
    for( var k=0; k<one.length; k++ )
    {
        var occur = CountOccur('x', one[k]);

        if( occur > 0 && target.length != occur )
        return false;
    }

    for( var k=0; k<two.length; k++ )
    {
        var occur = CountOccur('x', two[k]);

        if( occur > 0 && target.length != occur )
        return false;
    }
	

    //console.log( one );
    //console.log( two );
    return true;
}


/*
var back_lookup =   [ [0,2,5],[1] ];
var lookup =        [  ];

// [0] [1] [2] [3]

//var target =        [0,3];

//console.log( CheckIs( target, back_lookup, lookup ) );
//console.log( CheckNot( target, back_lookup, lookup ) );



var new_lookup = AddLookup( back_lookup, lookup );

console.log ( "------------------------------------" );
console.log ( "result: " );
console.log ( new_lookup );
*/

function AddLookup( back_lookup, lookup )
{
    //console.log( "I am AddLookup()" )
    //console.log ( "------------------------------------" );

    var all = [];

    for( var i=0; i<back_lookup.length; i++ )
    for( var k=0; k<back_lookup[i].length; k++ )
    if( all.indexOf( back_lookup[i][k] ) == -1 )
    all.push( back_lookup[i][k] );

    for( var i=0; i<lookup.length; i++ )
    for( var k=0; k<lookup[i].length; k++ )
    if( all.indexOf( lookup[i][k] ) == -1 )
    all.push( lookup[i][k] );

	all.sort(function(a,b){return a - b});

    //console.log( "all" );
    //console.log( all );
    //console.log ( "" );

    var new_lookup = [];
    var temp = [];

    while( all.length > 0 )
    {
        //console.log( "iter" );

        var pseudoall = all.slice(0);
        //console.log( "pseudoall" )
        //console.log( pseudoall )
        //console.log ( "" );


        for( var i=0; i<pseudoall.length; i++ )
        {
            //console.log( "pseudoall[i]: " + pseudoall[i] )
            
            if( CheckIs( temp.concat(pseudoall[i]),back_lookup,lookup) && CheckNot(temp.concat(pseudoall[i]),back_lookup,lookup) )
            {
                //console.log( "checks: " + JSON.stringify( temp.concat(pseudoall[i]) ) );
                //console.log( "putting to temp: " + pseudoall[i] );

                temp.push( pseudoall[i] );
                all.removeByValueVP( pseudoall[i] );
            }
            else
            {
                //console.log( "no check" );
                
                if( temp.length == 0 )
                {
                	//console.log( "putting to empty temp: " + pseudoall[i] );
                	temp.push( pseudoall[i] )
            	}
            }
        }

        if( temp.length > 0 )
        {
            //console.log( "putting temp to new_lookup after all ALL" );
            //console.log( temp );
            
            temp.sort(function(a,b){return a - b});
            new_lookup.push( temp );
            temp = [];            
        }

        
    }


    //new_lookup = [ [4,63,1], [0,11,3], [4], [333,10] ];

    new_lookup.forEach(function(curr)
    {
    	curr.sort(function(a,b){return a - b});
    });

    new_lookup.sort(function(a,b)
    {
    	if (a[0] < b[0]) return -1;
    	if (a[0] > b[0]) return 1;
    	return 0;
    });


    return new_lookup;
}


/*
function AliasCallReturnValue(alias_exp_)  
{
    var ret = {set_int(){}, set_float(){}, set_string(){}, set_any(){}};
    if( __CONSTRUCT3_RUNTIME3__ == false )
    {
        ret = arguments[0];
        for( var i=0; i<arguments.length-1; i++ ) 
        arguments[i] = arguments[i+1];
    }
    
    console.log( "Works if text: " + alias_exp_ );
    
    ret.set_any(666);
}

// C3
var __CONSTRUCT3_RUNTIME3__ = true;
AliasCallReturnValue( "Exppression it is" );
*/
// C2
// var __CONSTRUCT3_RUNTIME3__ = false;
// var ret = {set_any(num){ console.log("ok ret is still working: " + num) }};
// AliasCallReturnValue( ret, "Exppression it is" );


function RandomName(len)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
    for( var i = 0; i < len; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));
    
    return text;
}


function RemoveJunk( dir, minutes )
{
	var files = fs.readdirSync( dir ); 
	
    files.forEach( function( filename, index )
    {
		var Path = path.join( dir, filename );
		var stat = fs.statSync( Path ); 

		var mspassed = Date.now() - Date.parse(stat.birthtime);
		
		if( mspassed < 0 || mspassed/1000/60 > minutes )
		{
		    if( stat.isFile() )
			fs.unlinkSync(Path);
			
		    if( stat.isDirectory() )
		    deleteFolderRecursive(Path);
		}
    });	
	
}


function MakeLookup( domain, key, opts )
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


function Empty(key, opts)
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










        