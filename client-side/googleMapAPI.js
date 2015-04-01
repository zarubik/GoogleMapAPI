/**
 * Copyright (c) 2015 Petr Olišar (http://olisar.eu)
 *
 * For the full copyright and license information, please view
 * the file LICENSE.md that was distributed with this source code.
 */

var GoogleMap = GoogleMap || {};

GoogleMap = function(element)
{
	this.element = element;
	this.map;
	this.markers = [];
	this.options = {};
	this.boundsProperty;
	this.markersCluster = new Array();
	this.URL = "";
	this.allowColors = new Array('green', 'purple', 'yellow', 'blue', 'orange', 'red');
	
	this.init();
};

GoogleMap.prototype = {
	
	constructor: GoogleMap,
	
	init: function()
	{
		this.setProperties();
		return this;
	},
	
	setProperties: function()
	{
		var properties = JSON.parse(this.element.dataset.map);
		
		this.options.position = properties.position;
		this.options.proportions = [properties.width, properties.height];
		this.options.zoom = properties.zoom;
		this.options.type = properties.type;
		this.options.scrollable = properties.scrollable;
		this.options.key = properties.key;
		this.options.bound = properties.bound;
		this.options.cluster = properties.cluster;
		
		this.URL = this.element.dataset.markersfallback;
		
		return this;
	},
	
	initialize: function()
	{
		var base = this;
		
		base.doBounds('init');
		
		var mapOptions = {
			center: new google.maps.LatLng(base.options.position[0], base.options.position[1]),
			zoom: base.options.zoom,
			mapTypeId: google.maps.MapTypeId[base.options.type],
			scrollwheel: base.scrollable
		};

		// Display a map on the page
		base.map = new google.maps.Map(base.element, mapOptions);
		base.map.setTilt(45);
		base.loadMarkers();
	},
	
	loadMarkers: function()
	{
		var base = this;
		this.clearMarkers();
		
		var request = new XMLHttpRequest();
		request.open('GET', base.URL, true);

		request.onload = function() {
			if (request.status >= 200 && request.status < 400) {
				// Success!
				var data = JSON.parse(request.responseText);
				base.markers = data;
				base.insertMarkers(data);
			} else {
				// We reached our target server, but it returned an error
				console.log('We reached our target server, but it returned an error');
			}
		};

		request.onerror = function() {
			// There was a connection error of some sort
			console.log('There was a connection error of some sort');
		};

		request.send();
	},
	
	insertMarkers: function(markers)
	{
		var base = this;
		
		markers.forEach(function(item, i){
			var marker,
			position = new google.maps.LatLng(markers[i]['position'][0], markers[i]['position'][1]);
			base.doBounds('fill', position);
			
			marker = new google.maps.Marker({
				position: position,
				map: base.map,
				title: (("title" in markers[i]) ? markers[i]['title'] : null)
			});
			
			marker.setAnimation(base.doAdmination(item));
			
			base.doColor(item, marker);
			
			base.doIcon(item, marker);
			
			base.doMessage(item, marker);
			
			if (base.options.cluster)
			{
				base.markersCluster.push(marker);
			}
		});
		
		base.doBounds('fit');
		
		
		if (base.options.cluster)
		{
			if (typeof MarkerClusterer != 'undefined') {
				new MarkerClusterer(base.map, base.markersCluster);
			} else 
			{
				throw 'MarkerClusterer is not loaded!';
			}
		}
	},
	
	clearMarkers: function()
	{
		var base = this;
		for (var i = 0; i < base.markers.length; i++ ) {
			base.markers[i].setMap(null);
		}
		base.markers.length = 0;
	},
	
	doBounds: function(functionName, position)
	{
		var base = this;
		
		if (base.options.bound)
		{
			switch (functionName)
			{
				case 'init':
					init();
					break;
				case 'fill':
					fill();
					break;
				case 'fit':
					fit();
					break;
			}
			
			function init()
			{
				base.boundsProperty = new google.maps.LatLngBounds();
			}

			function fill()
			{
				base.boundsProperty.extend(position);
			}

			function fit()
			{
				base.map.fitBounds(base.boundsProperty);
			}
		}
	},
	
	doAdmination: function(marker)
	{
		var animation;
		if ("animation" in marker)
		{
			switch(marker['animation'])
			{
				case 'DROP':
				  animation = google.maps.Animation.DROP;
				  break;
				case 'BOUNCE':
				  animation = google.maps.Animation.BOUNCE;
				  break;
				default:
				  null;
			}
		}
		
		return animation;
	},
	
	doMessage: function(option, marker)
	{
		var base = this;
		var infoWindow = new google.maps.InfoWindow();
		// Allow each marker to have an info window    
		if (("message" in option))
		{
			google.maps.event.addListener(marker, 'click', function() {
				infoWindow.setContent('<div>'+option['message']+'</div>');
				infoWindow.open(base.map, marker);
			});

			if ("autoOpen" in option && option['autoOpen'])
			{
				infoWindow.setContent('<div>'+option['message']+'</div>');
				infoWindow.open(base.map, marker);
			}
		}
	},
	
	doProportions: function()
	{
		this.element.style.width = this.options.proportions[0];
		this.element.style.height = this.options.proportions[1];
	},
	
	doColor: function(option, marker)
	{
		var base = this;
		
		if ("color" in option && base.allowColors.indexOf(option['color']) >= 0)
		{
			marker.setIcon('http://maps.google.com/mapfiles/ms/icons/'+option['color']+'-dot.png');
		}
	},
	
	doIcon: function(option, marker)
	{
		if ("icon" in option)
		{
			marker.setIcon(option['icon']);
		}
	},
	
	getKey: function()
	{
		return this.options.key;
	}
};

var map;
Array.prototype.forEach.call(document.getElementsByClassName('googleMapAPI'), function(el, i){
	map = new GoogleMap(el);
	map.doProportions();
	if (typeof google === "undefined") {
            loadScript();
        } else {
            map.initialize();
        }
});

function loadScript() {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	var key = (map.getKey() !== null ? "&key="+map.getKey() : '');
	script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&' +
	'callback=map.initialize'+key;
	document.body.appendChild(script);
}