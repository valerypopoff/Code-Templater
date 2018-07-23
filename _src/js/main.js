$( document ).ready(function() 
{
	var templates;
	var instructions;

	document.getElementById('templates').onchange = function(e) 
	{
		templates = e.target.files;		
		//console.log( templates)
	}

	document.getElementById('instructions').onchange = function(e) 
	{
		instructions = e.target.files;		
	}

	var form = document.forms[0];
	form.onsubmit = function(event) 
	{    
    event.preventDefault();
		uploadFiles();
	};


	function uploadFiles()
	{
		if( templates === undefined || instructions === undefined )
		return;
    
    $('#submit').attr("disabled","disabled");
    $("#progress_block").css("display","block");

    // if( templates === undefined || instructions === undefined )
    // return;

    
    var data = new FormData();
		
		for (var i in templates)
		{
			data.append("templates", templates[i]);
		};

		for (var i in instructions)
		{
			data.append("instructions", instructions[i]);
		};



    $.ajax({
      xhr: function()
      {
        var xhr = new window.XMLHttpRequest();
        //Upload progress
        xhr.upload.addEventListener("progress", function(evt){
        if (evt.lengthComputable)
        {
          var percentComplete = evt.loaded / evt.total;
          //console.log(percentComplete);
          $("progress").attr( "value", percentComplete*100 );
        }
        }, false);

        //Download progress
        xhr.addEventListener("progress", function(evt){
          if (evt.lengthComputable) {
            var percentComplete = evt.loaded / evt.total;
            //Do something with download progress
            //$("progress").attr( "value", percentComplete*100 );
          }
        }, false);
        return xhr;
      },

      type: 'POST',
      url: "/upload",
      data: data,
      processData: false,
      contentType: false,
      success: function(data)
      {
        console.log("ajaxed successfully");
        window.location.href = '/download' + "/" + data;
      }
    });
    
    
 
    
  }

  
  
  
  
});

