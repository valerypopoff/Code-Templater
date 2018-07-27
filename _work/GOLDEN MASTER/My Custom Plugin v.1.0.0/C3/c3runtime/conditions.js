"use strict";

{
	var CndsObject =
	{
	IsLargeNumber(number)
    {   
        return number > 100;
    }
	};	

	C3.Plugins.MyCustomPlugin.Cnds = {};

	for( var k in CndsObject )
	{
		C3.Plugins.MyCustomPlugin.Cnds[k] = CndsObject[k];
	}
}

C3.Plugins.MyCustomPlugin.Instance.prototype.CNDS = C3.Plugins.MyCustomPlugin.Cnds;
