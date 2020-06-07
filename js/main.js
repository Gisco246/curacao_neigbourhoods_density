// initial Leaflet map options
const options = {
	zoomSnap: .1,
	//center: [40, -90],
	//zoom: 4,
	zoomControl: false
}

// create Leaflet map and apply options
const map = L.map('map', options);
map.doubleClickZoom.disable(); 
// request a basemap tile layer and add to the map
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.DomUtil.get("dropdown-ui");

$.getJSON("data/Neigbourhoods.geojson", function (neigborhoods) {

	Papa.parse('data/Population size.csv', {
		download: true,
		header: true,
		complete: function (data) {
			processData(neigborhoods, data);
			// data is accessible to us here
			//console.log('data: ', data);

			// note that neigborhoods is also accessible here!
			//console.log('neigborhoods: ', neigborhoods);

		}
	}); // end of Papa.parse()

});

$.getJSON("data/Neigbourhoods_centroids.geojson", function (neigborhoods_cen) {
	Papa.parse('data/Population size.csv', {
		download: true,
		header: true,
		complete: function (data) {
			processData(neigborhoods_cen, data);
			// data is accessible to us here
			//console.log('data: ', data);

			// note that neigborhoods is also accessible here!
			//console.log('neigborhoods: ', neigborhoods);

		}
	}); // end of Papa.parse()

});





function processData(neigborhoods, data) {
	// loop through all the neigborhoods
	// loop through all the neigborhoods
	//let kont = 0;
	for (let i of neigborhoods.features) {
		// for each of the CSV data rows
		for (let j of data.data) {
			if (Number(i.properties.FID) === Number(j.fid)) {

				// re-assign the data for that county as the county's props
				i.properties.additionalData = j;

				// no need to keep looping, break from inner loop
				break;
			}
		}
	}
	//console.log('after: ', neigborhoods.name);

	//second loop
	// empty array to store all the data values
	const rates = [];
	const drates = [];
	//console.log('Neigbourhoods..', neigborhoods)
	// iterate through all the neigborhoods
	neigborhoods.features.forEach(function (neighborhood) {

		// iterate through all the props of each neighborhood
		for (const prop in neighborhood.properties.additionalData) {
			if (neighborhood.geometry.type == "MultiPolygon") {
				// if the attribute is a number 
				if (prop == "population size" || prop == "number of households") {

					if (neighborhood.properties.additionalData[prop] > 0) {
						//console.log(neighborhood.properties.additionalData[prop])
						rates.push(Number(neighborhood.properties.additionalData[prop] / neighborhood.properties['area_sq_km']));
					}
				}
			}

		}
	});

	// verify the result!
	//console.log('rates:', rates);

	// create class breaks
	var breaks = chroma.limits(rates, 'q', 5);

	// create color generator function
	//var colorize = chroma.scale(chroma.brewer.OrRd).classes(breaks).mode('lab');
	//var colorize = chroma.scale(['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c']).classes(breaks).mode('lab');// removed , colors not representative of map
	var colorize = chroma.scale(['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026']).classes(breaks).mode('lab');// removed , colors not representative of map
	//var colorize = chroma.scale(['#080000','#400100','#800200','#BF0300','#FF0400']).classes(breaks).mode('lab');// removed , colors not representative of map

	//console.log(colorize) // function (a){var b;return b=s(u(a)),m&&b[m]?b[m]():b}
	if (neigborhoods.name == 'Neigbourhoods_centroids') {
		selectAttributeCheckbox(neigborhoods);
	} else {
		drawMap(neigborhoods, colorize);
	}


}



function drawMap(data, colorize) {

	console.log(data); // data is now accessible here
	// create Leaflet data layer and add to map

	const neigborhoods = L.geoJson(data, {
		// style neighbourhoods with initial default path options
		style: function (feature) {
			if (feature.geometry.type == "MultiPolygon") {
				return {
					color: '#525252',
					weight: 2,
					fillOpacity: 1,
					fillColor: '#000'
				};
			}
		},
		// add hover/touch functionality to each feature layer
		onEachFeature: function (feature, layer) {
			//console.log('here', feature)
			if (feature.geometry.type == "MultiPolygon") {
				// when mousing over a layer
				layer.on('mouseover', function () {
					console.log(feature.properties);
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
					}).bringToBack();
				});
			}
		},
		pointToLayer: function (feature, ll) {
			if (feature.geometry.type == "Point") {



				return L.circleMarker(ll, {
					opacity: 1,
					weight: 2,
					fillOpacity: 1,
					radius: 3

				})
			}
		}
	}).addTo(map);


	map.fitBounds(neigborhoods.getBounds(), {
		padding: [18, 18] // add padding around neighbourhoods
	});
	selectAttributeDropdown(neigborhoods, colorize);
	//addUi(neighbourhoods); // add the UI controls
	//updateMap(neighbourhoods); // draw the map 
	updateMap(neigborhoods, colorize, '');

}


function selectAttributeDropdown(neigborhoods, colorize) {
	$("#dropdown-ui select").change(function () {
		console.log($(this).val())
		updateMap(neigborhoods, colorize, $(this).val());
	});
}
function selectAttributeCheckbox(data) {
	map.createPane('circles');
	map.getPane('circles').style.zIndex = 655;
	map.getPane('circles').style.pointerEvents = 'none';

	const neigborhoods = L.geoJson(data, {
		pointToLayer: function (feature, ll) {
			if (feature.geometry.type == "Point") {
				return L.circleMarker(ll, {
					opacity: 1,
					weight: 2,
					fillOpacity: 0


				})
			}
		}
	}, { pane: 'circles' })

	neigborhoods.eachLayer(function (layer) {
		console.log('this_layer', Number(layer.feature.properties.additionalData.income_ang))
		radius = Number(layer.feature.properties.additionalData.income_ang) / 1000
		layer.setRadius(radius);
	});
	

	$('.checkbox input[type="checkbox"]').click(function (e) {
		e.stopPropagation();
		if ($(this).prop("checked") == true) {

			neigborhoods.addTo(map);
		}
		else if ($(this).prop("checked") == false) {
			map.removeLayer(neigborhoods);
		}
	});
	$(".checkbox").click(function(event){
		
		L.DomEvent.stopPropagation(event);
		 event.stopPropagation();
	});

}
function updateMap(dataLayer, colorize, subject) {

	dataLayer.eachLayer(function (layer) {

		const props = layer.feature.properties.additionalData;

		if (typeof (props) != 'undefined' && subject != '') {
			console.log('props', props);
			// set the fill color of layer based on its normalized data value
			let subjectPerArea = Number(props[subject] / layer.feature.properties['area_sq_km']).toFixed(0);
			layer.setStyle({
				fillColor: colorize(subjectPerArea)
			});

			let tooltipInfo = `<b>${layer.feature.properties['NAME']}</b><br>${subject} per Km&sup2; <b>${subjectPerArea}</b>`

			// bind a tooltip to layer with county-specific information
			layer.bindTooltip(tooltipInfo, {
				// sticky property so tooltip follows the mouse
				sticky: true
			});
		} else {
			if (layer.feature.geometry.type == "MultiPolygon") {
				layer.setStyle({
					fillColor: 'black'
				});
				let tooltipInfo = `<b>${layer.feature.properties['NAME']}</b></b>`

				// bind a tooltip to layer with county-specific information
				layer.bindTooltip(tooltipInfo, {
					// sticky property so tooltip follows the mouse
					sticky: true
				});
			}
		}
	});

} // end updateMap()