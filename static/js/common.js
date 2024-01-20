async function getChartData(counter_id) {
    const counter_data = {
        'counter_id': counter_id
    };

    let response = await fetch("/getMarkerData", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(counter_data),
        cache: 'no-cache'
    });

    return await response.json()
}

function drawChart(ctx, x, y, x_lbl) {
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: x,
            datasets: [{
                label: x_lbl,
                data: y,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}