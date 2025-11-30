import state from './state.js';

document.getElementById('target').addEventListener('input', () => {
    state.ip = document.getElementById('target').value;
    // console.log('Updated IP:', state.ip);
});

document.getElementById('port').addEventListener('input', () => {
    state.port = document.getElementById('port').value;
    // console.log('Updated port:', state.port);
});

document.getElementById('streams').addEventListener('input', () => {
    state.streams = document.getElementById('streams').value;
    // console.log('Updated streams:', state.streams);
});

document.getElementById('bandwidth').addEventListener('input', () => {
    state.bandwidth = document.getElementById('bandwidth').value;
    // console.log('Updated bandwidth:', state.bandwidth);
});

document.getElementById('continuousToggle').addEventListener('change', (event) => {
    state.continuousMode = event.target.checked;
});



document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('uploadBtn').classList.add('active');
    document.getElementById('downloadBtn').classList.remove('active');
    state.mode = 'upload';
    console.log('Selected mode: Upload');
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    document.getElementById('downloadBtn').classList.add('active');
    document.getElementById('uploadBtn').classList.remove('active');
    state.mode = 'download';
    console.log('Selected mode: Download');
});

document.getElementById('tcpBtn').addEventListener('click', () => {
    document.getElementById('tcpBtn').classList.add('active');
    document.getElementById('udpBtn').classList.remove('active');
    state.protocol = 'tcp';
    document.getElementById('bandwidth-field').style.display = 'none';
});

document.getElementById('udpBtn').addEventListener('click', () => {
    document.getElementById('udpBtn').classList.add('active');
    document.getElementById('tcpBtn').classList.remove('active');
    state.protocol = 'udp';
    document.getElementById('bandwidth-field').style.display = '';
});

['Kbits', 'Mbits', 'Gbits'].forEach(unit => {
    document.getElementById(unit).addEventListener('click', () => {
        ['Kbits', 'Mbits', 'Gbits'].forEach(u => document.getElementById(u).classList.remove('active'));
        document.getElementById(unit).classList.add('active');

        state.units = unit.replace('bits', 'bps');
        document.querySelector(".units").textContent = unit.replace('bits', 'bps');
        console.log(`Selected units: ${state.units.replace('bits', 'bps')}`);
    });
});
