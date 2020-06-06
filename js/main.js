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

$.getJSON("data/Neigbourhoods_p.geojson", function (neigborhoods) {

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

	// jQuery method uses AJAX request for the GeoJSON data
	//console.log(data);
	// call draw map and send data as paramter
	//drawMap(neigborhoods);
});

function processData(neigborhoods, data) {
	// loop through all the neigborhoods
	// loop through all the neigborhoods
	//let kont = 0;
	for (let i of neigborhoods.features) {
		// for each of the CSV data rows
		for (let j of data.data) {
			if (i.properties.FID == j.fid) {

				// re-assign the data for that county as the county's props
				i.properties.additionalData = j;

				// no need to keep looping, break from inner loop
				break;
			}
		}
	}
	//console.log('after: ', neigborhoods);

	//second loop
	// empty array to store all the data values
	const rates = [];
	console.log('Neigbourhoods', neigborhoods)
	// iterate through all the neigborhoods
	neigborhoods.features.forEach(function (neighborhood) {

		// iterate through all the props of each neighborhood
		for (const prop in neighborhood.properties.additionalData) {
			
			// if the attribute is a number and not one of the fips codes or name
			if (prop == "population size" || prop == "households" ) {
				// console.log('prop:',prop);
				// push that attribute value into the array
				
				if (neighborhood.properties.additionalData[prop]> 0){
					//console.log(neighborhood.properties.additionalData[prop])
				rates.push(Number(neighborhood.properties.additionalData[prop]));}
			}
		}
	});

	// verify the result!
	console.log('rates:', rates);

	// create class breaks
	var breaks = chroma.limits(rates, 'k', 5);

	// create color generator function
	var colorize = chroma.scale(chroma.brewer.OrRd).classes(breaks).mode('lab');
	//var colorize = chroma.scale(['#eff3ff','#bdd7e7','#6baed6','#3182bd','#08519c']).classes(breaks).mode('lab'); removed , colors not representative of map

	//console.log(colorize) // function (a){var b;return b=s(u(a)),m&&b[m]?b[m]():b}

	drawMap(neigborhoods, colorize);
	//drawLegend(breaks, colorize);
}



function drawMap(data, colorize) {
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
	//updateMap(neigborhoods, colorize, 'number of households');

}
function updateMap(dataLayer, colorize, subject) {

	dataLayer.eachLayer(function (layer) {

		const props = layer.feature.properties.additionalData;

		if (typeof (props) != 'undefined') {
			// console.log('props',props);
			// set the fill color of layer based on its normalized data value
			layer.setStyle({
				fillColor: colorize(Number(props[subject]))
			});

			let tooltipInfo = `<b>${props["neighbourhood"]}</b><br>Population <b>${props[subject]}</b>`

			// bind a tooltip to layer with county-specific information
			layer.bindTooltip(tooltipInfo, {
				// sticky property so tooltip follows the mouse
				sticky: true
			});
		}
	});

} // end updateMap()