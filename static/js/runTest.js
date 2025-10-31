import state from './state.js';
import { initGauge, updateGauge } from './gauge.js';

const runBtn = document.getElementById('runBtn');
const resultEl = document.getElementById('result');
runBtn.addEventListener('click', async () => {
    const target = state.ip;
    const port = state.port;
    const streams = state.streams;
    let bandwidth = state.bandwidth.trim();
    const protocol = state.protocol;
    const mode = state.mode;
    const units = state.units;
    console.log(target, port, streams, bandwidth, protocol, mode, units)

    const regex = /^\d+(\.\d+)?[KMG]$/i;

    if (!regex.test(bandwidth)) bandwidth = "0";

    resultEl.textContent = "Running iPerf3...\n";
    state.bandwidthSum = 0;
    state.bandwidthCount = 0;
    state.maxBandwidth = 0;
    initGauge();

    try {
        const response = await fetch('/run_iperf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ protocol, mode, streams, target, bandwidth, port, units })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error starting iPerf3.');
        }

        let eventSource = new EventSource('/stream_iperf');

        eventSource.onmessage = (event) => {
            if (parseFloat(event.data) < 0) {
                document.querySelector(".status").textContent = "Complete";
                eventSource.close();
                // return;
            }

            const avg = state.bandwidthCount > 0 ? (state.bandwidthSum / state.bandwidthCount).toFixed(2) : 0;
            if (event.data === "--- TEST COMPLETED ---") {
                resultEl.textContent += "Test completed successfully.\n";
                eventSource.close();
            }
            else if (event.data === "server is busy"){
                document.querySelector(".status").textContent = "Server is Busy";
            }
            else {
                let bandwidthValue = parseFloat(event.data);
                if (!isNaN(bandwidthValue)) {
                    if (bandwidthValue >= 0) {
                        updateGauge(bandwidthValue);
                        state.bandwidthSum += bandwidthValue;
                        state.bandwidthCount += 1;
                        if (bandwidthValue > state.maxBandwidth) state.maxBandwidth = bandwidthValue;

                        document.querySelector(".status").textContent = "Running";
                        resultEl.textContent += event.data + '\n';
                    } else {
                        document.querySelector(".status").textContent = "Complete";
                        document.querySelector(".avg_speed").textContent = `${avg} ${units}`;
                        document.querySelector(".max_speed").textContent = `${state.maxBandwidth} ${units}`;
                    }
                }
            }
        };

        eventSource.onerror = (error) => {
            console.error("Stream error:", error);
            resultEl.textContent = "Error occurred while streaming the output.";
            eventSource.close();
        };
    } catch (error) {
        console.error("Stream error:", error);
        resultEl.textContent = error.message;
    }
});
