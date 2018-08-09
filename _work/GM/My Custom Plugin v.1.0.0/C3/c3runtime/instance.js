"use strict";

	var SomeFunction = function()
	{	
		//
	}

{
	// Ignore this: yes
	C3.Plugins.MyCustomPlugin.Instance = class MyCustomPluginInstance extends C3.SDKInstanceBase

	{
		constructor(inst, properties)
		{
			super(inst);
			
			// Backward compatibility for C2 runtime
			this.properties = properties;

				this.testProperty = this.properties[0];
		}
		
		Release()
		{
			super.Release();
		}
		
		SaveToJson()
		{
			return {
				// data to be saved for savegames
			};
		}
		
		LoadFromJson(o)
		{
			// load state for savegames
		}
	};


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
		C3.Plugins.MyCustomPlugin.Instance.prototype[k] = InstanceFunctionsObject[k];
	}
	
}