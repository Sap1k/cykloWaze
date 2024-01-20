const API_KEY_GOLEMIO = "xxx"

async function drawDetails() {
    const response = await fetch("https://api.golemio.cz/v2/bicyclecounters?latlng=50.124935,14.457204&range=50000", {
        "headers": {
            "X-Access-Token": API_KEY_GOLEMIO
        }
    });

    let counters = await response.json();
    counters = counters["features"];
    // Get ID in details page
    let counter_id = document.querySelector("#counter_id").innerHTML;
    let counter_name = 'Neznámé'
    let counter_directions = 'Neznámé'
    let counter_route = 'Neznámá'


    for (let i = 0; i < counters.length; i++) {
        if (counters[i]["properties"]["id"] === counter_id) {
            counter_name = counters[i]["properties"]["name"]
            counter_route = counters[i]["properties"]["route"]
            counter_directions = counters[i]["properties"]["directions"]
            break;
        }
    }
    document.querySelector("#name").innerHTML = "Detaily sčítače - " + counter_name
    document.querySelector("#route").innerHTML = "Cyklotrasa " + counter_route

    let chartData = await getChartData(counter_id)
    let graphContainer = document.querySelector('#graph_container');


    let dirText = graphContainer.appendChild(document.createElement("h2"))
    dirText.innerHTML = "Všeobecná data"
    dirText.classList.add("mt-3")
    let tempGraphDiv = graphContainer.appendChild(document.createElement("div"))
    tempGraphDiv.classList.add("col-md-4")
    let tempGraph = tempGraphDiv.appendChild(document.createElement("canvas"))
    await drawChart(tempGraph, Object.values(chartData)[0]["dates"], Object.values(chartData)[0]["avg_temp"], "Průměrná teplota")

    for (let i = 0; i < Object.keys(chartData).length; i++) {
        for (let j = 0; j < counter_directions.length; j++) {
            if (counter_directions[j]["id"] === Object.keys(chartData)[i]) {
                let dirText = graphContainer.appendChild(document.createElement("h2"))
                dirText.innerHTML = "➔ " + counter_directions[j]["name"]
                dirText.classList.add("mt-3")

                // Add graph divs
                let cycleGraphDiv = graphContainer.appendChild(document.createElement("div"))
                cycleGraphDiv.classList.add("col-md-4")
                let pedGraphDiv= graphContainer.appendChild(document.createElement("div"))
                pedGraphDiv.classList.add("col-md-4")

                // Add graph canvases
                let cycleGraph = cycleGraphDiv.appendChild(document.createElement("canvas"))
                let pedGraph = pedGraphDiv.appendChild(document.createElement("canvas"))

                // Draw graphs
                await drawChart(cycleGraph, Object.values(chartData)[i]["dates"], Object.values(chartData)[i]["cycles"], "Počet cyklistů")
                await drawChart(pedGraph, Object.values(chartData)[i]["dates"], Object.values(chartData)[i]["pedestrians"], "Počet chodců")

                break;
            }
        }
    }

}


