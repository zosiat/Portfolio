// initialize the map
var map = L.map('map').setView([40.76, -111.89], 10); // Salt Lake coordinates

// add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// create a placeholder polygon for the lake
var lakePolygon = L.polygon([
    [40.80, -111.95],
    [40.80, -111.85],
    [40.70, -111.85],
    [40.70, -111.95]
], {color: 'blue', fillOpacity: 0.5}).addTo(map);

// reference slider and display
var elevInput = document.getElementById('elev');
var elevValue = document.getElementById('elev-value');

// load CSV data
var lakeData = [];
Papa.parse('data/lake_levels.csv', {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function(results) {
        lakeData = results.data;
        console.log("Lake data loaded", lakeData);
    }
});

// function to update lake based on elevation
function updateLake(elev) {
    // find closest elevation entry
    var entry = lakeData.reduce((prev, curr) => {
        return (Math.abs(curr.elev_ft_NAVD88 - elev) < Math.abs(prev.elev_ft_NAVD88 - elev)) ? curr : prev;
    });

    // scale fillOpacity as a simple placeholder for area
    if (entry) {
        var opacity = Math.min(1, 0.1 + entry.area_m2 / 2e7); // normalize for demo
        lakePolygon.setStyle({fillOpacity: opacity});
    }
}

// slider event
elevInput.addEventListener('input', function() {
    var elev = parseFloat(elevInput.value);
    elevValue.textContent = elev.toFixed(2);
    updateLake(elev);
});
