"use strict";

{
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

	C3.Plugins.MyCustomPlugin.Acts = {};

	for( var k in ActsObject )
	{
		C3.Plugins.MyCustomPlugin.Acts[k] = ActsObject[k];
	}
}

C3.Plugins.MyCustomPlugin.Instance.prototype.ACTS = C3.Plugins.MyCustomPlugin.Acts;
