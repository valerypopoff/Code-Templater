"use strict";

{
	C3.Plugins.MyCustomPlugin.Type = class MyCustomPluginType extends C3.SDKTypeBase
	{
		constructor(objectClass)
		{
			super(objectClass);
		}
		
		Release()
		{
			super.Release();
		}
		
		OnCreate()
		{	
		}
	};
}