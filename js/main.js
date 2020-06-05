		// initial Leaflet map options
		const options = {
			zoomSnap: .1,
			//center: [40, -90],
			//zoom: 4,
			zoomControl: false
		}

		// create Leaflet map and apply options
		const map = L.map('map', options);

		// request a basemap tile layer and add to the map
		L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);
		
		L.DomUtil.get("dropdown-ui");

		// set global variables for map layer,
		// mapped attribute, and normalizing attribute
		let attributeValue = "OWNED_MORT";
		const normValue = "OCCUPIED";

		// create object to hold legend titles
		const labels = {
		"OWNED_MORT": "Occupied housing units owned with mortgage",
		"OWNED_FREE": "Occupied housing units owned free and clear",
		"RENTER": "Occupied housing units rented"
		}

		$.getJSON("data/Neigbourhoods_p.geojson", function (data) {
			// jQuery method uses AJAX request for the GeoJSON data
			//console.log(data);
			   // call draw map and send data as paramter
			drawMap(data);
		});

		function drawMap(data) {
			//console.log(data); // data is now accessible here
			// create Leaflet data layer and add to map
			const neigborhoods = L.geoJson(data, {
			// style neighbourhoods with initial default path options
			style: function (feature) {
				return {
				color: '#525252',
				weight: 2,
				fillOpacity: 1,
				fillColor: '#000'
				};
			},
			// add hover/touch functionality to each feature layer
			onEachFeature: function (feature, layer) {

				// when mousing over a layer
				layer.on('mouseover', function () {

				// change the stroke color and bring that element to the front
				layer.setStyle({
					color: '#fffe00'
				}).bringToFront();
				});

				// on mousing off layer
				layer.on('mouseout', function () {

				// reset the layer style to its original stroke color
				layer.setStyle({
					color: '#525252'
				});
				});
			}
			}).addTo(map);
			map.fitBounds(neigborhoods.getBounds(), {
			padding: [18, 18] // add padding around neighbourhoods
			});
			//addUi(neighbourhoods); // add the UI controls
			//updateMap(neighbourhoods); // draw the map 
			
		}