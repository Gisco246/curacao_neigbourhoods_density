// initial Leaflet map options
const options = {
	zoomSnap: .1,
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
				// console.log(i.properties.additionalData )

				// no need to keep looping, break from inner loop
				break;
			}
		}
	}
	// empty array to store all the data values
	const rates = [];

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
	// create class breaks
	var breaks = chroma.limits(rates, 'q', 5);

	// create color generator function
	var colorize = chroma.scale(['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026']).classes(breaks).mode('lab');// removed , colors not representative of map

	//console.log(colorize) // function (a){var b;return b=s(u(a)),m&&b[m]?b[m]():b}
	if (neigborhoods.name == 'Neigbourhoods_centroids') {
		selectAttributeCheckbox(neigborhoods);
	} else {
		// getBreaks(neigborhoods, "number of households")
		drawMap(neigborhoods);
		// drawLegend(breaks,colorize) ; // wait until variable is selected
	}
}

function drawMap(joinedData) {

	//console.log(joinedData); // data is now accessible here
	// create Leaflet data layer and add to map
	const neigborhoods = L.geoJson(joinedData, {
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
					//console.log(feature.properties);
					// change the stroke color and bring that element to the front
					layer.setStyle({
						fillColor: '#fffe00'
					});//.bringToFront();
				});

				// on mousing off layer
				layer.on('mouseout', function () {

					// reset the layer style to its original stroke color
					layer.setStyle({
						fillColor: '#000'
					});//.bringToBack();
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
	selectAttributeDropdown(neigborhoods, joinedData);
	//addUi(neighbourhoods); // add the UI controls
	//updateMap(neighbourhoods); // draw the map 
	//console.log(neigborhoods)

	const subject = "population size"
	const breaks = getBreaks(joinedData, subject)
	updateMap(neigborhoods, subject, breaks)
	drawLegend(breaks, subject)

}

function selectAttributeDropdown(neigborhoods, joinedData) {
	$("#dropdown-ui select").change(function () {
	L.DomEvent.disableScrollPropagation(div);
	$("#dropdown-ui select").change(function (e) {
	
		console.log($(this).val())
		const subject = $(this).val()
		const breaks = getBreaks(joinedData, subject)
		updateMap(neigborhoods, subject, breaks);
		drawLegend(breaks, subject)
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
					fillOpacity: 0,
					color: '#ff00ff'
				})
			}
		}
	}, { pane: 'circles' })

	neigborhoods.eachLayer(function (layer) {
		//console.log('this_layer', Number(layer.feature.properties.additionalData.income_ang))
		radius = Number(layer.feature.properties.additionalData.income_ang) / 1000
		layer.setRadius(radius);
		let tooltipInfo = `<b>Average Income of Neighbourhood</b>: Fl.${Number(layer.feature.properties.additionalData.income_ang).toFixed(2).toLocaleString()}`
		layer.bindTooltip(tooltipInfo, {
			// sticky property so tooltip follows the mouse
			sticky: true, className: 'income-tooltip'
		});
		layer.on('mouseover', function () {
			// change the fill color 
			layer.setStyle({
				color: '#0000ff'
			});//.bringToFront();
		});

		// on mousing off layer
		layer.on('mouseout', function () {
			// reset the layer style to its original stroke color
			layer.setStyle({
				color: '#ff00ff'
			});//.bringToBack();
		});

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
	$(".checkbox").click(function (event) {

		L.DomEvent.stopPropagation(event);
		event.stopPropagation();
	});

}
function updateMap(dataLayer, subject, breaks) {

	const colorize = getColor(breaks)

	dataLayer.eachLayer(function (layer) {

		const props = layer.feature.properties.additionalData;

		if (typeof (props) != 'undefined' && subject != '') {
			if (subject == "population size" || subject == "number of households") {
				//console.log('props', props);
				// set the fill color of layer based on its normalized data value
				let subjectPerArea = Number(props[subject] / layer.feature.properties['area_sq_km']).toFixed(0);
				layer.setStyle({
					fillColor: colorize(subjectPerArea)
				});

				layer.on('mouseover', function () {
					// change the fill color 
					layer.setStyle({
						fillColor: '#fffe00'
					});//.bringToFront();
				});

				// on mousing off layer
				layer.on('mouseout', function () {
					// reset the layer style to its original stroke color
					layer.setStyle({
						fillColor: colorize(subjectPerArea)
					});//.bringToBack();
				});
				let tooltipInfo = `<b>${layer.feature.properties['NAME']}</b><br>${subject} per Km&sup2; <b>${subjectPerArea}</b>`

				// bind a tooltip to layer with county-specific information
				layer.bindTooltip(tooltipInfo, {
					// sticky property so tooltip follows the mouse
					sticky: true
				});
			} else {
				// set the fill color of layer based on its normalized data value
				let value = Number(props[subject]);
				layer.setStyle({
					fillColor: colorize(value)
				});

				layer.on('mouseover', function () {
					// change the fill color 
					layer.setStyle({
						fillColor: '#fffe00'
					});//.bringToFront();
				});

				// on mousing off layer
				layer.on('mouseout', function () {
					// reset the layer style to its original stroke color
					layer.setStyle({
						fillColor: colorize(value)
					});//.bringToBack();
				});
				let tooltipInfo = `<b>${layer.feature.properties['NAME']}</b><br>${subject} <b>${value}</b>`

				// bind a tooltip to layer with county-specific information
				layer.bindTooltip(tooltipInfo, {
					// sticky property so tooltip follows the mouse
					sticky: true
				});
			}
		} else {
			if (layer.feature.geometry.type == "MultiPolygon") {
				layer.setStyle({
					fillColor: 'black'
				});
				layer.on('mouseout', function () {
					// reset the layer style to its original stroke color
					layer.setStyle({
						fillColor: '#000'
					});//.bringToBack();
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

function addLegend() {
	var legendControl = L.control({
		position: 'topleft'
	});
	legendControl.onAdd = function (map) {

		var legend = L.DomUtil.create('div', 'legend');
		return legend;

	};

	legendControl.addTo(map);
}

addLegend()

function getBreaks(neighborhoods, selected) {

	const rates = [];
	//console.log('Neigbourhoods..', neigborhoods)
	// iterate through all the neigborhoods
	neighborhoods.features.forEach(function (neighborhood) {

		// iterate through all the props of each neighborhood
		for (const prop in neighborhood.properties.additionalData) {
			if (neighborhood.geometry.type == "MultiPolygon") {

				if (selected == "population size" || selected == "number of households") {

					rates.push(Number(neighborhood.properties.additionalData[selected] / neighborhood.properties['area_sq_km']));

				}

				else if (prop == selected) {
					if (Number(neighborhood.properties.additionalData[selected])> 0){
					rates.push(Number(neighborhood.properties.additionalData[selected]))}
				}
			}
		}

	})
	console.log(rates)
	return chroma.limits(rates, 'q', 5);
};

function getColor(breaks) {
	// create color generator function
	return chroma.scale(['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026']).classes(breaks).mode('lab');
}

function drawLegend(breaks, subject) {
	if (subject != '') {
		const colorize = getColor(breaks)
		const legend = $('.legend').html(`<h3><span>2011</span> ${subject}</h3><ul>`);

		for (let i = 0; i < breaks.length - 1; i++) {
			value1 = (subject == "population size" || subject == "number of households")? Number(breaks[i]).toFixed(0).toLocaleString(): Number(breaks[i]).toLocaleString()
			value2 = (subject == "population size" || subject == "number of households")? Number(breaks[i + 1]).toFixed(0).toLocaleString(): Number(breaks[i + 1]).toLocaleString()
			const color = colorize(breaks[i], breaks);
			const classRange = `<li><span style="background:${color}"></span>
			${value1} &mdash;
			${value2} </li>`
			$('.legend ul').append(classRange);
		}

		// Add legend item for missing data
		$('.legend ul').append(`<li><span style="background:black"></span>
			Data not available</li>`)

		legend.append("</ul>");
	}
}