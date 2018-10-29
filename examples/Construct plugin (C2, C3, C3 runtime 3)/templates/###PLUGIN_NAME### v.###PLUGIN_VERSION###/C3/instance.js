"use strict";

###ANY_RUNTIME###

###CONSTRUCT3_C3_RUNTIME###

###ROUTINES###

{
	const PLUGIN_CLASS = SDK.Plugins.###PLUGIN_ID###;

	$$$
	// Ignore this: ###PLUGIN_IS_OBJECT_TYPE###
	$$${
	PLUGIN_CLASS.Instance = class ###PLUGIN_ID###Instance extends SDK.IInstanceBase
	$$$}
	$$$

	$$$
	// Ignore this: ###PLUGIN_IS_WORLD_TYPE###	
	$$${
	PLUGIN_CLASS.Instance = class ###PLUGIN_ID###Instance extends SDK.IWorldInstanceBase
	$$$}
	$$$
	{
		constructor(sdkType, inst)
		{
			super(sdkType, inst);
		}
		
		Release()
		{
		}
		
		OnCreate()
		{
		}

		Draw(iRenderer, iDrawParams)
		{
			###C3_EDITOR_DRAW_FUNCTION_BODY###
		}

		OnPropertyChanged(id, value)
		{
		}
		
		LoadC2Property(name, valueString)
		{
			switch(name) 
			{
				$$$ DOMAIN="PROPS" DELIMITER=""
				case "###NAME###".toLowerCase().split(" ").join("-"):
					this._inst.SetPropertyValue("###ID_C3###", valueString);
					return true;

				$$$
			}
			
			return false;
		}
	};
}