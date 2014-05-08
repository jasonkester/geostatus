Parse.initialize("fh3OmeVIa3zW1t7EwvuHyQ3xQmT0xo0iabHor4uM", "asjq9Jd1zM8xkURHZgcerPS0HjGJJ9Md95R7vA4B");

var Person = Parse.Object.extend("Person");
var map;
var myUser;
var markers = [];
var placeholderName = "Somebody";

function clearMarkers()
{
	markers.forEach(function(marker)
	{
		marker.close();
	});
	markers = [];
}

function update()
{
	var query = new Parse.Query(Person);
	query.find({
		success: function(results)
		{
			clearMarkers();
			var now = new Date();
			for (var i = 0; i < results.length; i++) 
			{ 
				var person = results[i];
				var pos = new google.maps.LatLng(person.get("lat"), person.get("long"));

				console.log("updating", person);
				var imageString = "";
				if (person.get("photo"))
				{
					imageString = "<img class='thumb' src='" + person.get("photo").url() + "'><br>";
				}
				var contentString = '<div class="person">' + imageString + person.get("name") + '</div>';

				var bg = "#ddd";
				if ((now - person.updatedAt) < 2 * 60 * 1000)
				{
					bg = "#afa";
				}

				var infoBubble = new InfoBubble({
					map: map,
					content: contentString,
					position: pos,
					shadowStyle: 0,
					padding: 0,
					backgroundColor: bg,
					borderRadius: 4,
					arrowSize: 10,
					borderWidth: 3,
					borderColor: '#fff',
					disableAnimation: true,
					disableAutoPan: true,
					hideCloseButton: true,
					arrowPosition: 50,
					backgroundClassName: 'bubble',
					arrowStyle: 0
				});
				infoBubble.open();
				markers.push(infoBubble);


			}
		},
		error: function(error)
		{
			console.log("update error", error);
		}
	});
}

function ping()
{
	myUser.save();
}

function initLocation()
{
	if (navigator.geolocation)
	{
		navigator.geolocation.getCurrentPosition(function(position)
		{
			var initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			map.setCenter(initialLocation);

			if (!myUser)
			{
				console.log("new user");
				myUser = new Person();
				myUser.set("name", placeholderName);
			}
			myUser.set("lat", position.coords.latitude);
			myUser.set("long", position.coords.longitude);

			myUser.save(null, {
				success: function(object)
				{
					console.log("saved", object.id, object, myUser);
					localStorage.setItem("id", object.id);
					update();
				},
				error: function(model, error)
				{
					console.log("error", model, error);
				}
			});
		}, function()
		{
			alert("can't locate you");
		});
	}

}

function initialize()
{
	var myname = $("#myname");

	var mapOptions = {
		zoom: 3
	};
	map = new google.maps.Map(document.getElementById("map-canvas"),
		mapOptions);

	var id = localStorage.getItem("id");
	if (id)
	{
		var query = new Parse.Query(Person);
		query.get(id, {
			success: function(object)
			{
				console.log("retrieved user", myUser);
				myUser = object;
				if (object.get("name") != placeholderName)
				{
					myname.val(object.get("name"));
				}
				initLocation();
			},
			error: function(object, error)
			{
				console.log("couldn't find user", object, error);
				initLocation();
			}
		});
	}
	else
	{
		initLocation();

	}


	myname.bind("change", function()
	{
		if (this.value != myUser.get("name"))
		{
			myUser.set("name", this.value);
			myUser.save();
			update();
		}
	});

	var fileUploadControl = $("#profilePhotoFileUpload");
	fileUploadControl.bind("change", function()
	{
		if (fileUploadControl[0].files.length > 0)
		{

			var file = fileUploadControl[0].files[0];
			var name = "photo.jpg";

			var parseFile = new Parse.File(name, file);

			fileUploadControl.hide();
			$("#uploading").show();
			parseFile.save().then(function()
			{
				$("#uploading").hide();
				fileUploadControl.show();
				update();
			}, function(error)
			{
				$("#uploading").hide();
				fileUploadControl.show();
				update();

				console.log("error saving photo", error);
			});

			myUser.set("photo", parseFile);
			myUser.save();

		}
	});

	$(".closebutton").click(function()
	{
		$("#info").hide();
	});

	update();

	setInterval(update, 10 * 1000);
	setInterval(ping, 60 * 1000);
}
google.maps.event.addDomListener(window, 'load', initialize);
