import state from './state.js';

const csvUrl = "/proxy/iperf3-csv";
let csvData = [];

async function fetchAndParseCSV(url) {
  const res = await fetch(url);
  const text = await res.text();
  const rows = text.trim().split("\n").map(row => row.split(","));
  return rows;
}

function showPopup() {
  document.getElementById("overlay").style.display = "block";
  document.getElementById("popup").style.display = "block";
}

function hidePopup() {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("popup").style.display = "none";
}


function populateTable(data) {
  const thead = document.querySelector("#csvTable thead");
  const tbody = document.querySelector("#csvTable tbody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  const headers = data[0];
  const rows = data.slice(1);

  const headerRow = document.createElement("tr");
  headers.forEach(header => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      let displayCell = cell;
      if (displayCell.includes(' ') && displayCell.startsWith('"') && displayCell.endsWith('"')) {
        displayCell = displayCell.slice(1, -1);
      }
      const td = document.createElement("td");
      td.textContent = displayCell;
      tr.appendChild(td);
    });
    tr.addEventListener("click", () => {
      let selected = "";
      let dict = {}
      selected += '<div class="bubble-wrap">'
      for (let i = 0; i < headers.length; i++) {
        if (headers[i] != "IP/HOST" && row[i].length > 0) {
          if (headers[i] == "COUNTRY") {
            const countryCode = row[i].toLowerCase(); // e.g., "dz"
            selected += `<div class="bubble">${headers[i]} : <img src="https://flagcdn.com/w40/${countryCode}.png" alt="${row[i]} flag" style="vertical-align: middle; height: 16px;"></div><br>`;
          }
          else {
            selected += `<div class="bubble">${headers[i]} : ${row[i]}</div><br>`;

          }
        }
        dict[headers[i]] = row[i]
      }
      selected += '</div>'

      console.log(dict)
      state.ip = dict["IP/HOST"]
      if (dict["PORT"].includes('-')) {
        let port = dict["PORT"]
        let parts = port.split('-');
        state.port = parts[0]
      }
      else {
        state.port = dict["PORT"]
      }
      document.getElementById('target').value = state.ip;
      document.getElementById('port').value = state.port;
      const selectedDiv = document.getElementById("selectedServer");
      selectedDiv.innerHTML = selected;
      selectedDiv.style.display = "block";
      hidePopup();
    });
    tbody.appendChild(tr);
  });
}

function filterTable(query) {
  const tbody = document.querySelector("#csvTable tbody");
  const rows = tbody.querySelectorAll("tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query.toLowerCase()) ? "" : "none";
  });
}

function initializeCSVPicker() {
  const openBtn = document.getElementById("openPopupBtn");
  const searchInput = document.getElementById("searchInput");
  const overlay = document.getElementById("overlay");

  if (!openBtn || !searchInput || !overlay) {
    console.warn("CSV Picker: Required elements are missing in HTML.");
    return;
  }

  openBtn.addEventListener("click", async () => {
    if (csvData.length === 0) {
      csvData = await fetchAndParseCSV(csvUrl);
    }
    populateTable(csvData);
    showPopup();
  });

  searchInput.addEventListener("input", (e) => {
    filterTable(e.target.value);
  });

  overlay.addEventListener("click", hidePopup);
}

// Export the init function
export { initializeCSVPicker };
