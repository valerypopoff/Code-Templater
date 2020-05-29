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
			var c3obj = {};
			var convname;
			
			
			$$$ DOMAIN="PROPS" DELIMITER=","
			convname = "###NAME###".toLowerCase().replace(/[^a-zA-Z0-9 -]/g,'').split(" ").join("-");

			c3obj[convname] = 
			{
				idc3: "###ID_C3###",
				type: "###TYPE_C3###",
				combo: {
				$$${!!!
					"###PARAM_COMBO_TEXT###": "###PARAM_COMBO_ID###" 
				$$$}
				}
			}//
			$$$

			var value = undefined;


			var prop = c3obj[name];

			if( prop === undefined )
				return;

			switch( prop.type )
			{
				case "check": value = (parseInt(valueString) == 0 ? false : true); break;

				case "font":
				case "link":
				case "info":
				case "color": 
				case "group": break;

				case "percent":
				case "float": value = parseFloat(valueString); break;
				case "integer": value = parseInt(valueString); break;

				case "text":
				case "longtext": value = valueString; break;

				case "combo": value = prop.combo[valueString]; break;
			}


			if( value === undefined )
			return false;


			this._inst.SetPropertyValue(prop.idc3, value);
			return true;
			
		}

	};
}