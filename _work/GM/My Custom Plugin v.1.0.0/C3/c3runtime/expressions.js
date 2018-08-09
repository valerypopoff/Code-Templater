"use strict";

{
	var ExpsObject =
	{
	Double(number) 
    {
    	return number * 2;
    }
	};

	C3.Plugins.MyCustomPlugin.Exps = {};

	for( var k in ExpsObject )
	{
		C3.Plugins.MyCustomPlugin.Exps[k] = ExpsObject[k];
	}

}

C3.Plugins.MyCustomPlugin.Instance.prototype.EXPS = C3.Plugins.MyCustomPlugin.Exps;