// Any line STARTING with // is a comment. Multiline comments like this: /*don't work*/


// This is a single-line variable. The line starts with @@@ followed by the variable name without spaces or tabs between @@@ and the name. After one or more spaces or tabs goes the variable value:

@@@SINGLE_LINE_VAR	Foo


// This is a multi-line variable. The line starts with ### followed by the variable name without spaces or tabs between ### and the name. Everything between ###NAME and ### is the variable value. It can be any number of lines:

###SCRIPT
IsLargeNumber(number)
{   
    return number > 100;
}
###


// This is a named set of variables: a bracket group on the outer level of the document. The set name should go on the same line with the open bracket:

{ SOME_NAMED_SET


}


// Every variable declared on the outer level — like the two above — go to the unnamed set of variables. Thus, declaring variables on the outer level is equivalent to explicitly declaring them in the unnamed set — the set that has no name:

{
	@@@SINGLE_LINE_VAR	Foo

	###SCRIPT
	IsLargeNumber(number)
	{   
	    return number > 100;
	}
	###
}


// There's only one unnamed set in the project. Declaring variables in the unnamed set is equivalent to declaring them in different unnamed sets: 

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



// About namespaces and entities

// You never explicitly declare entities, like, "Here goes the first parameter and it's variables". Instead of this you just describe entities one after another. Templater can tell one entity from another with the mechanism of namespaces and entity counting.

// Namespaces are limited to the { bracket groups } both named and unnamed. Templater counts declared variables in every namespace and sees when they start to repeat.


// Consider this:

{	EXAMPLE

	@@@PARAM_ID		0
	@@@PARAM_NAME	Width

	@@@PARAM_ID		1
	@@@PARAM_NAME	Height
	
	@@@SOME_VAR		Brrrr

	@@@PARAM_ID		2
	@@@PARAM_FOO	Whatever
	@@@PARAM_BAR	Whatsoever
}

// After an opening bracket, Templater parses variables one by one. It knows that this is a new entity when it encounters a variable that has already been declared in a current namespace:

// @@@PARAM_ID		0		goes to the entity #0
// @@@PARAM_NAME	Width	goes to the entity #0

// BINGO! The next variable @@@PARAM_ID has already been declared. Now everything goes to the entity #1. Templater also remembers @@@PARAM_ID as an entity delimiter for a given namespace. So it will only increment entity counter when it encounters @@@PARAM_ID again. Until then, EVERYTHING will be considered a part of the current entity.

// @@@PARAM_ID		1		goes to the entity #1
// @@@PARAM_NAME	Height	goes to the entity #1
// @@@SOME_VAR		Brrrr	goes to the entity #1

// BINGO! The next variable @@@PARAM_ID is remembered as an entity delimiter. Now everything goes to the entity #2

//	@@@PARAM_ID		2			goes to the entity #2
//	@@@PARAM_FOO	Whatever	goes to the entity #2
//	@@@PARAM_BAR	Whatsoever	goes to the entity #2

// P.S.: As you could already notice, the first variable that ever repeats in a given namespace — is an entity delimiter of this namespace.


































