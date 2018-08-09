// Readme v.0.2

// Any line STARTING with // is a comment. Multiline comments like this: /* don't work */, don't use them





// VARIABLES
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// Variables are containers for storing text values.

// This is a single-line variable. The line starts with @@@ followed by the variable name without spaces or tabs between @@@ and the name. The value goes after one or more spaces or tabs on the same line:

@@@PLUGIN_ID	Foo


// The declaration and the assignation of the value ALWAYS come together. There's no chance of just declaring a variable and assgning no value to it or assigning it later. If you declare a variable without the value, it means that you assign to it the value of empty text:

@@@PLUGIN_ID


// This is a multi-line variable. The line starts with ### followed by the variable name without spaces or tabs between ### and the name. Everything between ###NAME and ### is the variable's value. It can be any number of lines:

###SCRIPT
IsLargeNumber(number)
{   
    return number > 100;
}
###


// A file or a folder with files that have variables in their contents or names, is called Template. When you declared variables, put their names between a pair of ### (like this ###VARABLE_NAME###) anywhere in the template. Templater will run through all the files of your template and replace variables with their values. This is the simplest application of Code Templater.





// MULTIPLE VARIABLE DECLARATION
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// If you declare a variable twice, Templater will remember both values:

@@@TEMP Hello
@@@TEMP World

// Declaring the same variable even more times will make Templater remember even more values. But if you put ###TEMP### to the template, it will be replaced with the very FIRST value of the variable. To learn how to use the values other then the first one, read "PATTERNS".





// PATTERNS
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// Sometimes it's not enough to, like, "Put the plugin ID here". Sometimes you want it, like, "Print the list of all paramaters". For this purposes use Patterns.

// A pattern is a specially formatted piece of text in the template. A pattern consists of a pattern expression — a pair of $$$ — and text containing variables that you put in between $$$'s. Remember, patterns go to the templates, not to the instructions.

// This is a pattern:

/**/	$$$
/**/	###TEMP###
/**/	$$$

//This pattern says: take everything that's between a pair of $$$ and repeat it as many times as there are values of the variables that you can find, every time replacing variables with new values. Templater operates with lines, so it "repeats" every time on a new line. This pattern will be translated to:

/**/	Hello
/**/	World


// A pattern only works when there's variables with values inside. If there's no variables in the pattern, or variables that have no value, it will be translated into emty text. So this pattern will be translated to nothing:

/**/	$$$
/**/	Whatever
/**/	###SOME_VAR_THATS_NEVER_BEEN_DECLARED###
/**/	$$$


// There can be any text in the pattern besides variables:

/**/	$$$
/**/	<div>
/**/		<p>I'm telling you: "###TEMP###"</p>
/**/	</div>
/**/	
/**/	$$$

// Will be translated to:

/**/	<div>
/**/		<p>I'm telling you: "Hello"</p>
/**/	</div>
/**/	
/**/	<div>
/**/		<p>I'm telling you: "World"</p>
/**/	</div>
/**/	


// You can specify a delimiter for a pattern. Templater will put a delimiter in the end of every iteration except the last one. So the pattern:

/**/	$$$ DELIMITER="<span class='line'></span>"
/**/	<div>
/**/		<p>I'm telling you: "###TEMP###"</p>
/**/	</div>
/**/	
/**/	$$$

// Will be translated to:

/**/	<div>
/**/		<p>I'm telling you: "Hello"</p>
/**/	</div>
/**/	<span class='line'></span>
/**/	<div>
/**/		<p>I'm telling you: "World"</p>
/**/	</div>
/**/	


// Get use of multiple variable declaration and patterns if you want to print sevaral "objets". Imagine you want to print all parameters that you described like this:

@@@PARAM_ID 	0
@@@PARAM_MAME	First

@@@PARAM_ID 	1
@@@PARAM_MAME	Second

@@@PARAM_ID 	2
@@@PARAM_MAME	Third

// This template: 

/**/	Parameters:
/**/	$$$
/**/		###PARAM_ID###: ###PARAM_MAME###
/**/	$$$

// Translates to:

/**/	Parameters:
/**/		0: First
/**/		1: Second
/**/		2: Third





// NESTED PATTERNS
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// A nested pattern is a pattern inside of another pattern. Imagine you have an object with sub-objects. Like a plugin with parameters:

@@@PLUGIN_ID	plug_CustomPlugin
@@@PLUGIN_NAME	Custom Plugin
@@@PLUGIN_TYPE	object

@@@PARAM_ID 	0
@@@PARAM_MAME	First

@@@PARAM_ID 	1
@@@PARAM_MAME	Second

@@@PARAM_ID 	2
@@@PARAM_MAME	Third


// To declare a sub-pattern, use $$${ and $$$}: 

/**/	$$$
/**/	Here's a plugin:
/**/		Pligin ID: ###PLUGIN_ID###
/**/		Pligin name: ###PLUGIN_NAME###
/**/		Pligin type: ###PLUGIN_TYPE###
/**/	
/**/	The plugin has parameters:
/**/		$$${
/**/		###PARAM_ID###: ###PARAM_MAME###
/**/		$$$}
/**/	$$$

//Templater reads it like this: The text between a pair of $$$ contains a sub-pattern but I don't care about it for now. Besides the sub-pattern, there are variables PLUGIN_ID, PLUGIN_NAME and PLUGIN_TYPE, every one of which has no more than one value. So I'll do 1 iteration repeating the whole pattern. I'll print all the lines of the pattern substituting variables with their first (because it's the first iteration) value. Then goes the sub-pattern. There are variables PARAM_ID and PARAM_MAME, every one of which has no more than 3 values. So I'll do 3 iterations repeating the whole sub-pattern. In every iteration I'll print all the lines of the sub-pattern substituting variables with their n-th value: 1st, 2nd and 3rd.

// So the pattern translates to:

/**/	Here's a plugin:
/**/		Pligin ID: plug_CustomPlugin
/**/		Pligin name: Custom Plugin
/**/		Pligin type: object
/**/	
/**/	The plugin has parameters:
/**/		0: First
/**/		1: Second
/**/		2: Third





// ENTITIIES
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// Templater doesn't store declared variables in a simple list. It stores them grouped in special containers called Entities. Technically, every entity is an object:

/**/	Entities: 
/**/	[
/**/	  { SOMEVAR: "Zero",  VARTOO: "One"					}, // Entity#0
/**/	  { SOMEVAR: "Foo",		              BRR: "Smthng"	}, // Entity#1
/**/	  { SOMEVAR: "00000", VARTOO: "Bar", 				}  // Entity#2
/**/	]


// Remember when you're declaring the same variable several times, Templater remembers several values? It's not because variables have multiple values. It's because there are several entities, every one of which can have the same variable with it's own value. 

//Templater decides in which entity to put a certain variable, based on the mechanism of variable grouping.





// VARIABLE GROUPING
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// Templater groups variables in entities based on when they repeat. 

// Templater starts with entity #0 and puts all the variables there until it encounters the variable that has already been declared. Then it starts putting variables to the entity #1. Templater also remembers the name of the variable that triggered incrementing so it can later switch to the next entity again when it sees this variable again. Look at this example:

@@@PLUGIN_ID	plug_CustomPlugin
@@@PLUGIN_NAME	Custom Plugin

@@@PARAM_ID		0

@@@PARAM_ID		1

@@@SOME_VAR		Brrrr

@@@PARAM_ID		2
@@@PARAM_FOO	Whatever
@@@PARAM_BAR	Whatsoever

// This is how Templater reads this:

// Start with entity #0.

// Entity #0:
// -----------------------------------
// @@@PLUGIN_ID		plug_CustomPlugin
// @@@PLUGIN_NAME	Custom Plugin
// @@@PARAM_ID		0

// The next variable @@@PARAM_ID has already been declared. Now everything goes to the entity #1. Remember @@@PARAM_ID as an entity incrementer. From now on only increment entity counter when it encounters @@@PARAM_ID again. Until then, EVERY variable goes to the entity #1.

// Entity #1:
// -----------------------------------
// @@@PARAM_ID		1
// @@@SOME_VAR		Brrrr

// The next variable @@@PARAM_ID is an entity incrementer. Now everything goes to the entity #2

// Entity #2:
// -----------------------------------
//	@@@PARAM_ID		2	
//	@@@PARAM_FOO	Whatever
//	@@@PARAM_BAR	Whatsoever

// Done. 





// ENTITIIES AND PATTERNS
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// Entities — are the things through which Templater actually iterates in patterns, not values. 

// In every iteration pattern looks for the variables in n-th entity only. It means that there can be such a pattern where Templater iterates through entities and in some of them it doesn't find the variable it needs to print. In this case it prints empty text. 

// If you declare these variables:

@@@SOMEVAR	Zero
@@@VARTOO	One

@@@SOMEVAR	Foo
@@@BRR		Smthng

@@@SOMEVAR	00000
@@@VARTOO	Bar

// templater will group them in entities like this:

/**/	Entities: 
/**/	[
/**/	  { SOMEVAR: "Zero",  VARTOO: "One"					}, // Entity#0
/**/	  { SOMEVAR: "Foo",		              BRR: "Smthng"	}, // Entity#1
/**/	  { SOMEVAR: "00000", VARTOO: "Bar", 				}  // Entity#2
/**/	]

// so the pattern:

/**/	$$$
/**/	###SOMEVAR###, ###VARTOO###, ###BRR###
/**/	$$$

// will be translated too:

/**/	Zero, One, 
/**/	Foo, , Smthng
/**/	00000, Bar, 

// Templater reads this pattern like this: There are variables SOMEVAR, VARTOO and BRR. Maximum entity index that contains the value of SOMEVAR is 2. Maximum entity index that contains the value of VARTOO is 2. Maximum entity index that contains the value of BRR is 1. Maximum out of 2, 2 and 1 is 2. So I'll repeat the pattern with iteration indexes 0...2. Every iteration I'll take values from the entity with the index of a current iteration. Like this:

//	for( var i=0; i<=max_entity_index; i++ )
//	{
//		// For every variable:		
//		variable_value = entities[i][variable_name];  
//	}

// Sometimes variable value is undefined. Like the value of SOMEVAR in the entity #1. It's just not there. In this case it prints empty text.






// PATTERNS AND HIERARCHIES
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// Templater doesn't know about hierarchy of things you describe:

@@@PLUGIN_ID	plug_CustomPlugin

@@@PARAM_ID		0
@@@PARAM_NAME	Width


@@@PLUGIN_ID	plug_CustomPlugin2

@@@PARAM_ID		1
@@@PARAM_NAME	Height

// Try and print it with the same pattern we used earlier:

/**/	$$$
/**/	Here's a plugin:
/**/	Pligin ID: ###PLUGIN_ID###
/**/	
/**/	The plugin has parameters:
/**/		$$${
/**/		###PARAM_ID###: ###PARAM_NAME###
/**/		$$$}
/**/	
/**/	$$$

// You would think that it would print two plugins each with the corresponding patameter. But it prints ALL the parameters:

/**/	Here's a plugin:
/**/	Pligin ID: plug_CustomPlugin
/**/		
/**/	The plugin has parameters:
/**/		0: Width
/**/		1: Height
/**/	
/**/	Here's a plugin:
/**/	Pligin ID: plug_CustomPlugin2
/**/		
/**/	The plugin has parameters:
/**/		0: Width
/**/		1: Height

// Here's what happens here. The pattern iterates through all entities looking for PLUGIN_ID valuse and finds 2 of them. In each of these iterations the sub-pattern iterates through all entities looking for PARAM_ID and PARAM_NAME valuse and finds 2 of each. So it prints everything it finds: two plugins with two parameters each, like, "Look what I've found". 

// Templater doesn't know about hierarchy of things you describe. But there's a way for you to let it know.





// DOMAINS
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// Domain is a named set of variables: a bracket group on the outer level of the document. The name does NOT have to be unique. The name should go on the same line with the open bracket:

{ SOME_NAMED_SET

	@@@VAR_1	One
	@@@VAR_2	Two
	@@@VAR_3	Three
}

// Every declared domain has it's own entities for storing variables separately from the other domains. It means that you can use same variable names in different domains and they will never mix together:

{	PLUGIN

	@@@PLUGIN_ID	plug_CustomPlugin

	@@@PARAM_ID		0
	@@@PARAM_NAME	Width
}

{	PLUGIN

	@@@PLUGIN_ID	plug_CustomPlugin2

	@@@PARAM_ID		1
	@@@PARAM_NAME	Height
}

// You can specify a domain name when declaring a pattern so it iterates through all domains with that name before iterating through the entities. It makes domains perfect for describing objects like plugins, functions, anything that has properties. This pattren:

/**/	$$$ DOMAIN="PLUGIN"
/**/	Here's a plugin:
/**/		Pligin ID: ###PLUGIN_ID###
/**/	
/**/	The plugin has parameters:
/**/		$$${
/**/		###PARAM_ID###: ###PARAM_NAME###
/**/		$$$}
/**/	
/**/	
/**/	$$$

// Translates to exactly what we wanted:

/**/	Here's a plugin:
/**/		Pligin ID: plug_CustomPlugin
/**/		
/**/	The plugin has parameters:
/**/		0: Width
/**/	
/**/	
/**/	Here's a plugin:
/**/		Pligin ID: plug_CustomPlugin2
/**/		
/**/	The plugin has parameters:
/**/		1: Height

// It works like this. Templater sees that you want to iterate through the domains with the name PLUGIN. There's two. So it repaeats the whole pattern twice, every time using only the entities of n-th domain. Kinda pretending that it only knows about the variables declared in the domain #n.





// UNNAMED DOMAIN
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// There's an implicit unnamed domain in the instructions. It contains all variables that you declare on the outer level of the document. It's called Main Domain and it has no name. When you declare a variable outside any named domain, it goes to the main domain. You can explicitly declare an unnamed domain and put variables inside: 

{
	@@@SINGLE_LINE_VAR	Foo

	###SCRIPT
	IsLargeNumber(number)
	{   
	    return number > 100;
	}
	###
}

// ↑ This is equivalent to declaring these variables on the outer level like we did before. 

// Unlike with named domains, there's only one unnamed domain. Declaring several unnamed domains is equivalent to declaring one. All these variables will go to the same Unnamed Domain Entities: 

{
	@@@SINGLE_LINE_VAR	Foo
}

{
	###SCRIPT
	IsLargeNumber(number)
	{   
	    return number > 100;
	}
	###
}

// Actually, when you declare a pattern with no domain specified, it is a pattern with a Main Domain. So this:

/**/	$$$
/**/	###SOME_VAR###
/**/	$$$

// is equivalent to this:

/**/	$$$ DOMAIN=""
/**/	###SOME_VAR###
/**/	$$$

// and works similarly to the named domain patterns: the whole pattern repeats as many times as there's domains with the name "". One. Because there's only one unnamed domain.





// COUNTSPACES
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// Remember that Templater starts with entity #0 when it does the variable grouping? (Read "Variable grouping"). Actually, it doesn't only start counting from 0 at the begining of the instructions. It also starts from 0 at the begining of a countspace.

// Countspaces are limited to the { bracket groups } both named and unnamed. It means that Templater starts counting from entity #0 and remembering no entity-delimiter at the begining of every domain.

@@@TEMP Hello
@@@TEMP World

{	PLUGIN
	
	@@@PLUGIN_ID	plug_CustomPlugin
	@@@PARAM_ID		0
	@@@PARAM_NAME	Width
}

@@@TEMP Okay

{	PLUGIN
	
	@@@PLUGIN_ID	plug_CustomPlugin2
	@@@PARAM_ID		1
	@@@PARAM_NAME	Height
}


// ↑ Templater reads it like this:

	// This is the begining of instructions, start putting variables to the main domain's entity #0

@@@TEMP Hello

	// Variable name repeats. Start putting variables to the main domain's entity #1. Remember @@@TEMP as an entity delimiter.
@@@TEMP World

{	PLUGIN
	// This is the begining of a new countspace, start putting variables to the current domain's entity #0

	@@@PLUGIN_ID	plug_CustomPlugin

	@@@PARAM_ID		0
	@@@PARAM_NAME	Width
}

	// Get back to putting variables to the main domain's entity #1

	// @@@TEMP is an entity delimiter. Start putting variables to the main domain's entity #2

@@@TEMP Okay

{	PLUGIN
	// This is the begining of a new countspace, start putting variables to the current domain's entity #0.

	@@@PLUGIN_ID	plug_CustomPlugin2

	@@@PARAM_ID		1
	@@@PARAM_NAME	Height
}

	// Get back to putting variables to the main domain's entity #2





// INLINE BRACKET GROUPS
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// You can introduce bracket groups inside of domains. Inline bracket groups are countspaces too. When entering inline brcket group, Templater starts counting from 0 and forget the current entity delimiter. After the bracket group ends, Templater gets back to the the previous entity number and the previous entity delimiter if there was such:

@@@TEMP Hello
@@@TEMP World

{	PLUGIN
	// This is the begining of a countspace, start putting variables to the current domain's entity #0.

	@@@PLUGIN_ID	plug_CustomPlugin
	
	{
		// This is the begining of an inline countspace, start putting variables to the current domain's entity #0.

		@@@PARAM_ID		0
		@@@PARAM_NAME	Width

		// Variable name repeats. Start putting variables to the current domain's entity #1. Remember @@@PARAM_ID as an entity delimiter.
		@@@PARAM_ID		1
		@@@PARAM_NAME	Height

		// @@@PARAM_ID is an entity delimiter. Start putting variables to the current domain's entity #2
		@@@PARAM_ID		2
		@@@PARAM_NAME	Width
	}
	// This is end of an inline countspace, get back to putting variables to the current domain's entity #0. Forget that @@@PARAM_ID is an entity delimiter. 
}



























