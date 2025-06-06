let protocol = 'tcp'; // Default protocol is TCP
let speedtest_state = "READY" // READY or RUNNING
let bandwidthSum = 0;  // Running total of bandwidth values
let bandwidthCount = 0;  // Count of bandwidth values
let maxBandwidth = 0;  // Maximum bandwidth value
document.getElementById('uploadBtn').classList.remove('active');
document.getElementById('downloadBtn').classList.add('active');
const bandwidthField = document.getElementById('bandwidth-field');
const bandwidth_value = document.getElementById('bandwidth')

function getCSSVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

document.getElementById('tcpBtn').addEventListener('click', function() {
    document.getElementById('tcpBtn').classList.add('active');
    document.getElementById('udpBtn').classList.remove('active');
    protocol = 'tcp'; // Set protocol to TCP
    bandwidthField.style.display = 'none';

});
document.getElementById('udpBtn').addEventListener('click', function() {
    document.getElementById('udpBtn').classList.add('active');
    document.getElementById('tcpBtn').classList.remove('active');
    protocol = 'udp'; // Set protocol to UDP
    bandwidthField.style.display = '';

});

let mode = 'download'; // Default mode is 'upload'

document.getElementById('uploadBtn').addEventListener('click', function() {
    document.getElementById('uploadBtn').classList.add('active');
    document.getElementById('downloadBtn').classList.remove('active');
    mode = 'upload';
    console.log('Selected mode: Upload');
});

document.getElementById('downloadBtn').addEventListener('click', function() {
    document.getElementById('downloadBtn').classList.add('active');
    document.getElementById('uploadBtn').classList.remove('active');
    mode = 'download';
    console.log('Selected mode: Download');
});

let units = "Mbps"

document.getElementById('Kbits').addEventListener('click', function() {
    document.getElementById('Kbits').classList.add('active');
    document.getElementById('Mbits').classList.remove('active');
    document.getElementById('Gbits').classList.remove('active');

    document.querySelector(".units").textContent = `Kbps`; 

    units = 'Kbits';
    console.log('Selected units: Kbits');
    sendUnitToServer(units);

});

document.getElementById('Mbits').addEventListener('click', function() {
    document.getElementById('Mbits').classList.add('active');
    document.getElementById('Kbits').classList.remove('active');
    document.getElementById('Gbits').classList.remove('active');
    document.querySelector(".units").textContent = `Mbps`; 

    units = 'Mbits';
    console.log('Selected units: Mbits');
    sendUnitToServer(units);

});

document.getElementById('Gbits').addEventListener('click', function() {
    document.getElementById('Gbits').classList.add('active');
    document.getElementById('Mbits').classList.remove('active');
    document.getElementById('Kbits').classList.remove('active');
  
    document.querySelector(".units").textContent = `Gbps`; 


    units = 'Gbits';
    console.log('Selected units: Gbits');
    sendUnitToServer(units);

});

fetch('/iperf_version')
    .then(response => response.json())
    .then(data => {
        document.getElementById('iperf_version').textContent = data.version;
    })
    .catch(error => {
        document.getElementById('iperf_version').textContent = 'Error fetching version';
    });

const runBtn = document.getElementById('runBtn');
const targetInput = document.getElementById('target');
const targetPort = document.getElementById('port');

// const protocolInput = document.getElementById('protocol');
const streamsInput = document.getElementById('streams');
const resultEl = document.getElementById('result');
const canvas = document.getElementById('speedometer');
const ctx = canvas.getContext('2d');
const currentValueElement = document.getElementById('current-value');

// Speedometer Configuration
const canvasSize = Math.min(window.innerWidth * 0.8, 400); // 80% of viewport width or max 400px
canvas.width = canvasSize;
canvas.height = canvasSize;

const minValue = 0;
let maxValue = 0;
const breakdown = 5;
const arcLength = Math.PI;
const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

gradient.addColorStop(0, getCSSVariable("--speedometer_gradient_1"));
gradient.addColorStop(0.5, getCSSVariable("--speedometer_gradient_2"));
gradient.addColorStop(1, getCSSVariable("--speedometer_gradient_3"));
let currentValue = 0;

function drawSpeedometer(value) {
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background arc
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, 140, startAngle, endAngle);
    ctx.lineWidth = 30;
    ctx.strokeStyle = '#232f4e';
    ctx.stroke();

    // active Speedometer arc
    const angle = startAngle + (value / maxValue) * arcLength;
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, 140, startAngle, angle);
    ctx.lineWidth = 30;
    ctx.strokeStyle = gradient;
    ctx.stroke();

    drawMarkers(startAngle, endAngle);
    // console.log("debug:",startAngle,endAngle)
    // drawMarkers(-180, 180);

    drawNeedle(value);

   
}
function generateBreakdownList(maxValue, numSteps) {
    const breakdownList = [];
    numSteps = numSteps - 1;
    if (numSteps <= 0 || maxValue <= 0) return breakdownList;

    let rawStep = maxValue / numSteps;
    let magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    let niceStep = Math.ceil(rawStep / magnitude) * magnitude;

    let adjustedMax = niceStep * numSteps;

    for (let i = 0; i <= numSteps; i++) {
        let value = (i * niceStep);
        if (adjustedMax < 10) {
            breakdownList.push(parseFloat(value.toFixed(1)));
        } else {
            breakdownList.push(Math.round(value));
        }
    }

    console.log(breakdownList);
    return breakdownList;
}

function drawMarkers(startAngle, endAngle) {
    const markerValues = generateBreakdownList(maxValue, breakdown);
    const markerRadius = 100;
    const arcLength = endAngle - startAngle;

    ctx.font = '16px Montserrat';
    ctx.fillStyle = getCSSVariable('--text');
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    markerValues.forEach((markerValue) => {
        const markerAngle = startAngle + (markerValue / maxValue) * arcLength;
        const xPos = canvasSize / 2 + Math.cos(markerAngle) * markerRadius;
        const yPos = canvasSize / 2 + Math.sin(markerAngle) * markerRadius;
        // console.log("debug:>>", Math.cos(markerAngle) * markerRadius, (markerValue / maxValue));
        ctx.fillText(markerValue.toFixed(1), xPos, yPos);
    });
}


function drawNeedle(value) {
    const startAngle = (3 * Math.PI) / 2;
    const needleAngle = startAngle + (value / maxValue) * arcLength;

    ctx.save();
    ctx.translate(canvasSize / 2, canvasSize / 2);
    ctx.rotate(needleAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -90);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#141526';
    ctx.stroke();
    ctx.restore();
}

let previousValue = 0;
const smoothingFactor = 0.1; // Smoothing factor
let targetValue = 0;
const animationSpeed = 0.05; // animation speed

function updateSpeedometer(value) {
    currentValue = value;
    targetValue = value;
    if ( currentValue > maxValue*0.80)
    {
        maxValue = currentValue + (currentValue*0.2)
    }

    animateNeedle(previousValue, targetValue);

    previousValue = targetValue;

    currentValueElement.innerText = targetValue.toFixed(2);
}
function animateNeedle(startValue, endValue) {
    const frameRate = 60;
    let currentValue = startValue;

    const step = () => {
        currentValue = lerp(currentValue, endValue, animationSpeed);

        drawSpeedometer(currentValue);

        if (Math.abs(currentValue - endValue) > 0.01) {
            requestAnimationFrame(step);
        } else {
            drawSpeedometer(endValue);
        }
    };

    requestAnimationFrame(step);
}
function lerp(start, end, t) {
    return start + (end - start) * t;
}

function sendUnitToServer(selectedUnit) {
    fetch('/set_unit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ unit: selectedUnit })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Server response:', data);
    })
    .catch(error => {
        console.error('Error sending unit to server:', error);
    });
}


runBtn.addEventListener('click', async () => {
    const target = targetInput.value;
    const port = targetPort?.value || 5201;
    // const protocol = protocolInput.value;
    let bandwidth = bandwidth_value.value.trim();
    const regex = /^\d+(\.\d+)?[KMG]$/i;

    if (regex.test(bandwidth)) {
        console.log("bandwidth valid");
    } else {
        console.log("bandwidth invalid, setting it to -b0 (maximum bw)");
        bandwidth = "0"
    }
    const streams = parseInt(streamsInput.value);
    console.log("streams=",streams);
    resultEl.textContent = "Running iPerf3...";
    console.log(protocol,mode, streams, target,port)
    try {
        // Start the iPerf3 process
        const response = await fetch('/run_iperf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ protocol,mode, streams, target, bandwidth, port })
        });

        if (!response.ok) {
            throw new Error('Error starting iPerf3.');
        }

        // Listen to SSE
        const eventSource = new EventSource('/stream_iperf');

        eventSource.onmessage = (event) => {
            console.log(event.data);
            const averageBandwidth = bandwidthCount > 0 ? (bandwidthSum / bandwidthCount).toFixed(2) : 0;
            console.log("average: "+ averageBandwidth)
            if (event.data === "--- TEST COMPLETED ---") {
                resultEl.textContent += "Test completed successfully.\n";
                eventSource.close(); // Close the connection


            } else {
                const bandwidthValue = parseFloat(event.data);
                if (!isNaN(bandwidthValue)) {
                    if(bandwidthValue >= 0){
                        speedtest_state = "RUNNING"
                        updateSpeedometer(bandwidthValue);
                        bandwidthSum += bandwidthValue; // Add to running total
                        bandwidthCount += 1; // Increment count
                        if (bandwidthValue > maxBandwidth) {
                            maxBandwidth = bandwidthValue;
                        }
                        document.querySelector(".status").textContent = "Status: Running"; // Update status
                        resultEl.textContent += event.data + '\n';
                    }
                    else{
                        speedtest_state = "READY"
                        document.querySelector(".status").textContent = "Status: Completed"; // Update status
                        document.querySelector(".avg_speed").textContent = `AVG: ${averageBandwidth} ${units}`; // Update avg_speed div
                        document.querySelector(".max_speed").textContent = `MAX: ${maxBandwidth} ${units}`;

                    }

                }
            }
        };

        eventSource.onerror = () => {
            resultEl.textContent = "Error occurred while streaming the output.";
            eventSource.close();
        };
    } catch (error) {
        resultEl.textContent = error.message;
    }
});

