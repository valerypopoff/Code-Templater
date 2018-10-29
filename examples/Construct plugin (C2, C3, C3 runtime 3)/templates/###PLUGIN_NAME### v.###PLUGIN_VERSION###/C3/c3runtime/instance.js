"use strict";



{
	$$$
	// Ignore this: ###PLUGIN_IS_OBJECT_TYPE###
	$$${
	C3.Plugins.###PLUGIN_ID###.Instance = class ###PLUGIN_ID###Instance extends C3.SDKInstanceBase
	$$$}
	$$$

	$$$
	// Ignore this: ###PLUGIN_IS_WORLD_TYPE###	
	$$${
	C3.Plugins.###PLUGIN_ID###.Instance = class ###PLUGIN_ID###Instance extends C3.SDKWorldInstanceBase
	$$$}
	$$$
	{
		constructor(inst, properties)
		{
			super(inst);
			
			// Backward compatibility for C2 runtime
			this.properties = properties;

			###INSTANCE_CONSTRUCTOR_BODY###
		}
		
		Release()
		{
			super.Release();
		}

		Draw(renderer)
		{
			###C3_RUNTIME_DRAW_FUNCTION_BODY###
		}

		SaveToJson()
		{
			###SAVETOJSON_FUNCTION_BODY###
		}
		
		LoadFromJson(o)
		{
			###LOADFROMJSON_FUNCTION_BODY###
		}

		Tick()
		{
			###TICK_FUNCTION_BODY###
		}

		Tick2()
		{
			###TICK2_FUNCTION_BODY###
		}
	};


	var InstanceFunctionsObject = ###INSTANCE_OBJECT###
	for( var k in InstanceFunctionsObject )
	{
		C3.Plugins.###PLUGIN_ID###.Instance.prototype[k] = InstanceFunctionsObject[k];
	}
	
}