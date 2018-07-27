// ECMAScript 5 strict mode
"use strict";

	var __CONSTRUCT2_RUNTIME2__ = true;
	var __CONSTRUCT3_RUNTIME2__ = false;
	var __CONSTRUCT3_RUNTIME3__ = false;


assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

/////////////////////////////////////
// Plugin class
cr.plugins_.MyCustomPlugin = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var pluginProto = cr.plugins_.MyCustomPlugin.prototype;
		
	/////////////////////////////////////
	// Object type class
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};

	var typeProto = pluginProto.Type.prototype;

	// called on startup for each object type
	typeProto.onCreate = function()
	{
	};

	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
		
		// any other properties you need, e.g...
		// this.myValue = 0;
	};
	
	var instanceProto = pluginProto.Instance.prototype;

	instanceProto.onCreate = function()
	{
			this.testProperty = this.properties[0];
	};
	
	// only called if a layout object - draw to a canvas 2D context
	instanceProto.draw = function(ctx)
	{
	};
	
	// only called if a layout object in WebGL mode - draw to the WebGL context
	// 'glw' is not a WebGL context, it's a wrapper - you can find its methods in GLWrap.js in the install
	// directory or just copy what other plugins do.
	instanceProto.drawGL = function (glw)
	{
	};

		var SomeFunction = function()
	{	
		//
	}
	
	var InstanceFunctionsObject = {
	Foo(num)
	{
		console.log( "I got the number: " + num );
	},
	
	Bar(str)
	{
		console.log( "I got the string: " + str );
	}
}
	for( var k in InstanceFunctionsObject )
	{
		instanceProto[k] = InstanceFunctionsObject[k];
	}


	//////////////////////////////////////
	// Conditions
	function Cnds() {};

	var CndsObject =
	{
	IsLargeNumber(number)
    {   
        return number > 100;
    }
	};

	for( var k in CndsObject )
	{
		Cnds.prototype[k] = CndsObject[k];
	}
	
	pluginProto.cnds = new Cnds();


	//////////////////////////////////////
	// Actions
	function Acts() {};

	var ActsObject =
	{
	Alert(alert_msg, combo)
	{
		var combo_text;
		switch( combo )
		{
			case 0: combo_text = "And I don't care"; break;
			case 1: combo_text = "And don't call me Shirley"; break;
			case 2: combo_text = "So kiss me darling"; break;
		}

		alert(alert_msg + " " + combo_text);
		alert("By the way, first plugin property = " + this.testProperty);
		alert("By the way, 512 is large = " + this.CNDS.IsLargeNumber(512));

		// These two functions will log to the console
		this.Foo( 1024 );
		this.Bar( "One thousand and twenty four" );
	}
	};

	for( var k in ActsObject )
	{
		Acts.prototype[k] = ActsObject[k];
	}

	
	pluginProto.acts = new Acts();


	//////////////////////////////////////
	// Expressions
	function Exps() {};

	var ExpsObject =
	{
	Double(ret, number) 
    {
		ret.set_any(number * 2);    	
    }
	};

	for( var k in ExpsObject )
	{
		Exps.prototype[k] = ExpsObject[k];
	}
	
	pluginProto.exps = new Exps();

	instanceProto.EXPS = pluginProto.exps;
	instanceProto.CNDS = pluginProto.cnds;
	instanceProto.ACTS = pluginProto.acts;
}());