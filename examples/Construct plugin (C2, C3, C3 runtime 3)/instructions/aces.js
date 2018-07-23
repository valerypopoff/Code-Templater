{	ACE
	
	@@@ACES_C2_EDITTIME		Condition
	@@@ACES_C3_JSON_TYPE	conditions
	@@@CATEGORY_ID			custom
	@@@CATEGORY_NAME 		Custom

	@@@ID_C2				0
	@@@ID_C3				is-large-number
	@@@FLAGS_C2				cf_none
	@@@HIGHLIGHT			true
	@@@LIST_NAME			Is large number
	@@@DISPLAY_STRING 		Is [i]{0}[/i] a large number. There's also {1} that doesn't matter
	@@@DESCRIPTION 			Test if a number is greater than 100.

	@@@SCRIPT_NAME 			IsLargeNumber


	// Params
		
	@@@PARAM_TYPE_C2 		AnyTypeParam
	@@@PARAM_TYPE_C3 		any
	@@@PARAM_ID_C3 			comparison-options
	@@@PARAM_LABEL 			Number
	@@@PARAM_DESCRIPTION	Number to test if greater than 100.
	@@@PARAM_INIT_VALUE		50
	
	@@@PARAM_TYPE_C2 		AnyTypeParam
	@@@PARAM_TYPE_C3 		any
	@@@PARAM_ID_C3 			some-param
	@@@PARAM_LABEL 			Some param
	@@@PARAM_DESCRIPTION	An exessive value.
	@@@PARAM_INIT_VALUE		

	
	###SCRIPT
	IsLargeNumber(number)
    {   
        return number > 100;
    }
	###
}

{	ACE
	
	@@@ACES_C2_EDITTIME		Action
	@@@ACES_C3_JSON_TYPE	actions
	@@@CATEGORY_ID			super-custom
	@@@CATEGORY_NAME 		Super custom

	@@@ID_C2				0
	@@@ID_C3				do-alert
	@@@FLAGS_C2				af_none
	@@@HIGHLIGHT			true
	@@@LIST_NAME			Do alert
	@@@DISPLAY_STRING 		Do alert with message {0} and \"{1}\"
	@@@DESCRIPTION 			Do a dummy alert.

	@@@SCRIPT_NAME 			Alert

	
	// Params
	{
		// About Combo parameters
		// If there's at least one combo parameter in parameters list, every parameter 
		// must have "IS_COMBO_PARAM" filed. Regular parameters must have this field empty. 
		// Combo parameters must have this field not empty. This is how the templater 
		// knows which parameter is a combo parameter (it can't see the values, only field names).

		// About parameters in general
		// All parameters inside of ACE must have the same set of fields so the templater works 
		// correctly. That's why a non-combo parameter has @@@PARAM_INIT_COMBO_C3 and 
		// @@@PARAM_INIT_COMBO_C2 that don't apply. And that's why a combo parameter has 
		// @@@PARAM_INIT_VALUE that is only needed for non-combo parameters. There MUST be specified 
		// NO VALUES for the fields that don't apply so that they are ignored by the templater.
		

		// Non-combo parapeter
		@@@IS_COMBO_PARAM
		@@@PARAM_TYPE_C2 		StringParam
		@@@PARAM_TYPE_C3 		string
		@@@PARAM_ID_C3 			alert-text
		@@@PARAM_LABEL 			Alert text
		@@@PARAM_DESCRIPTION	Enter alert message.
		@@@PARAM_INIT_VALUE		\"Hello world\"
		@@@PARAM_INIT_COMBO_C3
		@@@PARAM_INIT_COMBO_C2



		@@@PARAM_COMBO_ID		dont-care
		@@@PARAM_COMBO_TEXT		And I don't care

		@@@PARAM_COMBO_ID		dont-call-me
		@@@PARAM_COMBO_TEXT		And don't call me Shirley

		@@@PARAM_COMBO_ID		so-kiss-me
		@@@PARAM_COMBO_TEXT		So kiss me darling

		
		// combo parapeter
		@@@IS_COMBO_PARAM		true or whatever that is not an empty string
		@@@PARAM_TYPE_C2 		ComboParam
		@@@PARAM_TYPE_C3 		combo
		@@@PARAM_ID_C3 			alert-add-variants
		@@@PARAM_LABEL 			What to add
		@@@PARAM_DESCRIPTION	What to add to the alert message.
		@@@PARAM_INIT_VALUE
		@@@PARAM_INIT_COMBO_C3	dont-call-me
		@@@PARAM_INIT_COMBO_C2	1
	}

	###SCRIPT
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
	###
}

{	ACE
	
	@@@ACES_C2_EDITTIME		Expression
	@@@ACES_C3_JSON_TYPE	expressions
	@@@CATEGORY_ID			custom
	@@@CATEGORY_NAME 		Custom

	@@@ID_C2				0
	@@@ID_C3				double
	@@@FLAGS_C2				ef_return_any | ef_variadic_parameters
	@@@RETURN_TYPE_C3		any
	@@@VARIADIC_PARAMS_C3	true
	@@@HIGHLIGHT			true
	@@@LIST_NAME			Double
	@@@DESCRIPTION 			Double a number.

	@@@SCRIPT_NAME 			Double

	###SCRIPT
	Double(ret, number) 
    {
		ret.set_any(number * 2);    	
    }
	###

	###SCRIPT_C3_RUNTIME
	Double(number) 
    {
    	return number * 2;
    }
	###
}
