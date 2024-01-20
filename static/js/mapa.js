const API_KEY_MAPY = "xxx"
const API_KEY_GOLEMIO = "xxx"

let map = L.map('map').setView([50.07528203465035, 14.432005457870595], 13);

async function loadMap() {
    L.tileLayer(`https://api.mapy.cz/v1/maptiles/outdoor/256@2x/{z}/{x}/{y}?apikey=${API_KEY_MAPY}`, {
        minZoom: 0,
        maxZoom: 19,
        attribution: '<a href="https://api.mapy.cz/copyright" target="_blank">&copy; Seznam.cz a.s. a další</a>',
    }).addTo(map);

    /*
    We also require you to include our logo somewhere over the map.
    We create our own map control implementing a documented interface,
    that shows a clickable logo.
    See https://leafletjs.com/reference.html#control
    */
    const LogoControl = L.Control.extend({
        options: {
            position: 'bottomleft',
        },

        onAdd: function (map) {
            const container = L.DomUtil.create('div');
            const link = L.DomUtil.create('a', '', container);

            link.setAttribute('href', 'http://mapy.cz/');
            link.setAttribute('target', '_blank');
            link.innerHTML = '<img src="https://api.mapy.cz/img/api/logo.svg" />';
            L.DomEvent.disableClickPropagation(link);

            return container;
        },
    });

// finally we add our LogoControl to the map
    new LogoControl().addTo(map);

    // Call function to add markers
    await addMarkers()
}

function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.popupContent) {
        layer.bindPopup(feature.properties.popupContent);
    }
}

function markerOnClick(e) {
    getChartData(e.target.id).then(response => {
        console.log(response)
        for (let i = 0; i < e.target.directions.length; i++) {
            drawChart(document.querySelector('#myChart_' + e.target.directions[i].id), response[e.target.directions[i].id]["dates"], response[e.target.directions[i].id]["cycles"], "Počet cyklistů")
    }
    })
}

async function addMarkers() {
    const response = await fetch("https://api.golemio.cz/v2/bicyclecounters?latlng=50.124935,14.457204&range=50000", {
        "headers": {
            "X-Access-Token": API_KEY_GOLEMIO
        }
    });

    const counters = await response.json();


    let iconRed = L.IconMaterial.icon({
        icon: 'directions_bike',              // Name of Material icon
        iconColor: 'rgb(35,35,35)',          // Material icon color (could be rgba, hex, html name...)
        markerColor: 'rgba(205,92,92,0.5)',  // Marker fill color
        outlineColor: 'rgb(237,41,57)',        // Marker outline color
        outlineWidth: 1,                     // Marker outline width
        iconSize: [45, 50]                   // Width and height of the icon
    });

    let iconGreen = L.IconMaterial.icon({
        icon: 'directions_bike',              // Name of Material icon
        iconColor: 'rgb(35,35,35)',          // Material icon color (could be rgba, hex, html name...)
        markerColor: 'rgba(97,153,59,0.5)',  // Marker fill color
        outlineColor: 'rgb(0,128,0)',        // Marker outline color
        outlineWidth: 1,                     // Marker outline width
        iconSize: [45, 50]                   // Width and height of the icon
    });

    let iconOrange = L.IconMaterial.icon({
        icon: 'directions_bike',              // Name of Material icon
        iconColor: 'rgb(35,35,35)',          // Material icon color (could be rgba, hex, html name...)
        markerColor: 'rgba(255,168,54,0.5)',  // Marker fill color
        outlineColor: 'rgb(255,140,0)',        // Marker outline color
        outlineWidth: 1,                     // Marker outline width
        iconSize: [45, 50]                   // Width and height of the icon
    });

    const qualityReq = await fetch("/markerQuality");
    const qualityData = await qualityReq.json();

    let markery = L.geoJSON(counters, {
        onEachFeature: function (feature, layer) {
            let smery = '';
            for (let i = 0; i < feature.properties.directions.length; i++) {
                smery = smery + '<h6>➔ ' + feature.properties.directions[i].name + '</h6>' +
                    '<div>\n' +
                    '<canvas id="myChart_' + feature.properties.directions[i].id + '"></canvas>\n' +
                    '</div>'
            }
            layer.bindPopup('<h4>' + feature.properties.name + '</h4>' + smery +
                '<a href="/details/' + feature.properties.id + '" type="button" class="btn btn-primary me-2 mt-2" style="color: white;" role="button">Detaily</a>' +
                                '<a href="/history" type="button" class="btn btn-secondary mt-2" style="color: white;" role="button">Historie měření</a>' +
            '\n'
            );
            layer.directions = feature.properties.directions
            layer.id = feature.properties.id
            layer.on('click', markerOnClick)

            // get the object containing name as `name2`
            let obj = qualityData.find(function (v) {
                return v.counter_id === feature.properties.id;
            });

            // get value property if object is defined
            let res = obj && obj.quality;

            console.log(res)
            if (res === "good") {
                layer.setIcon(iconGreen)
            } else if (res === "ok") {
                layer.setIcon(iconOrange)
            } else {
                layer.setIcon(iconRed)
            }
        }
    }).addTo(map);
    console.log(markery);
}