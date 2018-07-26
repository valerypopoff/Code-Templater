@@@PLUGIN_NAME					My Custom Plugin
@@@PLUGIN_VERSION				1.0.0
@@@PLUGIN_DESCRIPTION			An example third-party plugin.

@@@PLUGIN_AUTHOR				John Doe
@@@PLUGIN_AUTHOR_WEBSITE		http://johndoe.com/
@@@PLUGIN_HELP_URL				http://johndoe.com/mycustomplugin/

@@@PLUGIN_CATEGORY_C2			General
@@@PLUGIN_CATEGORY_C3			general

@@@PLUGIN_ID					MyCustomPlugin
@@@PLUGIN_ID_IN_LOWER_CASE		mycustomplugin

@@@PLUGIN_TYPE_C2				object
@@@PLUGIN_FLAGS_C2				pf_singleglobal
@@@PLUGIN_ISSINGLEGLOBAL_C3		true
@@@PLUGIN_SUPPORTED_RUNTIMES	"c2", "c3"


// Plugin properties
{	PROPS

	@@@ID_C3		test-property
	@@@TYPE_C2		ept_integer
	@@@TYPE_C3		integer
	@@@NAME			Test property
	@@@DESCRIPTION	Test roperty description.
	@@@INIT_VALUE	0

	@@@ID_C3		another-test-property
	@@@TYPE_C2		ept_integer
	@@@TYPE_C3		integer
	@@@NAME			Another test property
	@@@DESCRIPTION	Another test roperty description.
	@@@INIT_VALUE	0
}


//goes to the code before everything else
###CONSTRUCT2_C2_RUNTIME
	var __CONSTRUCT2_RUNTIME2__ = true;
	var __CONSTRUCT3_RUNTIME2__ = false;
	var __CONSTRUCT3_RUNTIME3__ = false;
### 

//goes to the code before everything else
###CONSTRUCT3_C2_RUNTIME
	var __CONSTRUCT2_RUNTIME2__ = false;
	var __CONSTRUCT3_RUNTIME2__ = true;
	var __CONSTRUCT3_RUNTIME3__ = false;
### 

//goes to the code before everything else
###CONSTRUCT3_C3_RUNTIME
	var __CONSTRUCT2_RUNTIME2__ = false;
	var __CONSTRUCT3_RUNTIME2__ = false;
	var __CONSTRUCT3_RUNTIME3__ = true;
### 


// Code that will go to the constructor body
###INSTANCE_CONSTRUCTOR_BODY
	this.testProperty = this.properties[0];
###

// Any code that will be accessible from the ACEs methods 
###ROUTINES
	var SomeFunction = function()
	{	
		//
	}
###

// Additional instance properties
###INSTANCE_OBJECT
{
	Foo(num)
	{
		console.log( "I got the number: " + num );
	},
	
	Bar(str)
	{
		console.log( "I got the string: " + str );
	}
}
###

