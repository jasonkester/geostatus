Parse.initialize("fh3OmeVIa3zW1t7EwvuHyQ3xQmT0xo0iabHor4uM", "asjq9Jd1zM8xkURHZgcerPS0HjGJJ9Md95R7vA4B");

var Person = Parse.Object.extend("Person");
var map;
var myUser;
var markers = [];

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
			for (var i = 0; i < results.length; i++) 
			{ 
				var person = results[i];
				var pos = new google.maps.LatLng(person.get("lat"), person.get("long"));

				var contentString = '<div class="person">' + person.get("name") + '</div>';
				if (person.id == myUser.id && !person.get("name"))
				//if (person.id == myUser.id)
				{
					contentString = '<div class="person"><input id="myname" type="text" placeholder="What\'s your name?" value="' + person.get("name") + '" /></div>';
				}

				var infowindow = new google.maps.InfoWindow({
					position: pos,
					map: map,
					disableAutoPan: true,
					content: contentString
				});
				infowindow.open(map);

				markers.push(infowindow);

				setTimeout(function()
				{
					$("#myname").bind("change,blur", function()
					{
						if (this.value != myUser.get("name"))
						{
							myUser.set("name", this.value);
							myUser.save();
						}
						$("#myname").parent().text(this.value);
					});

					$("#myname").bind("blur", function()
					{
						var val = this.value;
						setTimeout(function()
						{
							$("#myname").parent().text(val);
						}, 100);
					});

					$("#myname").get(0).select();
				}, 500);
			}
		},
		error: function(error)
		{
			console.log("update error", error);
		}
	});
}

function initLocation()
{


	if (navigator.geolocation)
	{
		var browserSupportFlag = true;
		navigator.geolocation.getCurrentPosition(function(position)
		{
			var initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			map.setCenter(initialLocation);

			if (!myUser)
			{
				console.log("new user");
				myUser = new Person();
				myUser.set("name", "");
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

	update();
}
google.maps.event.addDomListener(window, 'load', initialize);
