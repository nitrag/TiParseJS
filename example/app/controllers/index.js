require('tiparsejs_wrapper')(Alloy.CFG.parseOptions);


setTimeout(function(){
	var Test = Parse.Object.extend("Test");

	// Create a new instance of that class.
	var obj = new Test();
	obj.set("Name", "Testing 123 - Parse module");
	Ti.API.info("Name set to: " + obj.get("Name"));
	obj.save(null, {
	  success: function(gameScore) {
	    // Execute any logic that should take place after the object is saved.
	    alert('New object created with objectId: ' + gameScore.id);
	  },
	  error: function(gameScore, error) {
	    // Execute any logic that should take place if the save fails.
	    // error is a Parse.Error with an error code and message.
	    alert('Failed to create new object, with error code: ' + error.message);
	  }
	}).then(function(result) {
			Ti.API.info(JSON.stringify(result));
		}, function(error) {
	    	Ti.API.info("Error: " + error.code + " " + error.message);
	});
},3000);


function doClick(e) {
    alert($.label.text);
}

$.index.open();
