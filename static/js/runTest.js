import state from './state.js';
import { initGauge, updateGauge } from './gauge.js';

const runBtn = document.getElementById('runBtn');
const stopBtn = document.getElementById('stopBtn');
const continuousToggle = document.getElementById('continuousToggle');
const resultEl = document.getElementById('result');
const statusEl = document.querySelector('.status');
const avgEl = document.querySelector('.avg_speed');
const maxEl = document.querySelector('.max_speed');

let eventSource = null;
let isRunning = false;
let shouldLoop = false;
stopBtn.disabled = true;

const getAverage = () =>
  state.bandwidthCount > 0
    ? (state.bandwidthSum / state.bandwidthCount).toFixed(2)
    : 0;

const resetStats = () => {
  state.bandwidthSum = 0;
  state.bandwidthCount = 0;
  state.maxBandwidth = 0;
};

const buildPayload = () => {
  const payload = {
    target: state.ip,
    port: state.port,
    streams: state.streams,
    bandwidth: state.bandwidth.trim(),
    protocol: state.protocol,
    mode: state.mode,
    units: state.units,
  };

  const regex = /^\d+(\.\d+)?[KMG]$/i;
  if (!regex.test(payload.bandwidth)) payload.bandwidth = '0';
  return payload;
};

async function runSingleTest(runNumber) {
  resetStats();
  initGauge();

  if (runNumber === 1) {
    resultEl.textContent = 'Running iPerf3...\n';
  } else {
    resultEl.textContent += `\n--- Durchlauf ${runNumber} ---\n`;
  }
  statusEl.textContent = 'Running';

  const payload = buildPayload();

  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch('/run_iperf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error starting iPerf3.');
      }
    } catch (error) {
      reject(error);
      return;
    }

    eventSource = new EventSource('/stream_iperf');

    const cleanupStream = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };

    const finalizeRun = () => {
      cleanupStream();
      const avg = getAverage();
      avgEl.textContent = `${avg} ${state.units}`;
      maxEl.textContent = `${state.maxBandwidth} ${state.units}`;
      statusEl.textContent =
        shouldLoop && state.continuousMode
          ? 'Starting next run...'
          : 'Complete';
      resolve();
    };

    eventSource.onmessage = (event) => {
      if (parseFloat(event.data) < 0 || event.data === '--- TEST COMPLETED ---') {
        finalizeRun();
        return;
      }

      if (event.data === 'server is busy') {
        statusEl.textContent = 'Server is Busy';
        return;
      }

      const bandwidthValue = parseFloat(event.data);
      if (!isNaN(bandwidthValue) && bandwidthValue >= 0) {
        updateGauge(bandwidthValue);
        state.bandwidthSum += bandwidthValue;
        state.bandwidthCount += 1;
        if (bandwidthValue > state.maxBandwidth) state.maxBandwidth = bandwidthValue;

        statusEl.textContent = 'Running';
        resultEl.textContent += `${event.data}\n`;
      }
    };

    eventSource.onerror = () => {
      cleanupStream();
      reject(new Error('Error occurred while streaming the output.'));
    };
  });
}

runBtn.addEventListener('click', async () => {
  if (isRunning) return;

  shouldLoop = state.continuousMode;
  isRunning = true;
  runBtn.disabled = true;
  stopBtn.disabled = false;
  avgEl.textContent = '--';
  maxEl.textContent = '--';

  let runCounter = 1;

  try {
    do {
      await runSingleTest(runCounter);
      runCounter += 1;
    } while (shouldLoop && state.continuousMode);
  } catch (error) {
    statusEl.textContent = 'Error';
    resultEl.textContent = error.message;
  } finally {
    isRunning = false;
    runBtn.disabled = false;
    stopBtn.disabled = true;
    shouldLoop = false;
  }
});

stopBtn.addEventListener('click', () => {
  shouldLoop = false;
  state.continuousMode = false;
  continuousToggle.checked = false;
  statusEl.textContent = 'Stopping after current run';
});
