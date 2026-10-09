// --- Speech Synthesis Helper (Hindi Voice Voice Engine) ---
function speakAlert(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN'; // Hindi (India) locale
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        // Best available Hindi voice select karna
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find(v => v.lang === 'hi-IN' || v.name.includes('Hindi') || v.lang.startsWith('hi'));
        if (hindiVoice) {
            utterance.voice = hindiVoice;
        }

        window.speechSynthesis.speak(utterance);
    }
}

// Voices load listener for Chrome
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

// --- Dual-Axis Chart.js Telemetry Initialization ---
const ctx = document.getElementById('telemetryChart').getContext('2d');
const chartData = {
    labels: ['-30s', '-24s', '-18s', '-12s', '-6s', 'Live'],
    datasets: [
        {
            label: 'Grid Carbon Intensity (gCO₂/kWh)',
            data: [260, 245, 230, 220, 215, 210],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
        },
        {
            label: 'Cloud Power Draw (Watts)',
            data: [195, 195, 130, 130, 65, 65],
            borderColor: '#0ea5e9',
            borderDash: [5, 5],
            borderWidth: 2,
            tension: 0.2,
            fill: false,
            yAxisID: 'y1'
        }
    ]
};

const telemetryChart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                grid: { color: '#1e293b' },
                ticks: { color: '#10b981', font: { size: 10 } },
                title: { display: true, text: 'gCO₂/kWh', color: '#10b981' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: { color: '#0ea5e9', font: { size: 10 } },
                title: { display: true, text: 'Watts (W)', color: '#0ea5e9' }
            }
        },
        plugins: {
            legend: { labels: { color: '#e2e8f0', boxWidth: 12, font: { size: 11 } } }
        }
    }
});

// --- Server-Sent Events (SSE) Live Telemetry Stream ---
const eventSource = new EventSource('/api/stream');
const liveGridCarbon = document.getElementById('liveGridCarbon');
const totalRupeesSaved = document.getElementById('totalRupeesSaved');
const totalCarbonSaved = document.getElementById('totalCarbonSaved');
const kpiInstances = document.getElementById('kpiInstances');
const powerEstimate = document.getElementById('powerEstimate');
const logsTableBody = document.getElementById('logsTableBody');
const aiForecastText = document.getElementById('aiForecastText');

const ciIndia = document.getElementById('ci-india');
const ciEurope = document.getElementById('ci-europe');
const ciUs = document.getElementById('ci-us');

eventSource.onmessage = (event) => {
    const packet = JSON.parse(event.data);

    if (packet.carbonIntensity !== undefined) {
        liveGridCarbon.innerText = `${packet.carbonIntensity} gCO₂`;
        chartData.datasets[0].data.shift();
        chartData.datasets[0].data.push(packet.carbonIntensity);
    }

    if (packet.powerDraw !== undefined) {
        chartData.datasets[1].data.shift();
        chartData.datasets[1].data.push(packet.powerDraw);
        if (powerEstimate) powerEstimate.innerText = `Estimated Power: ${packet.powerDraw} Watts`;
    }

    telemetryChart.update();

    if (packet.rupeesSaved) totalRupeesSaved.innerText = `₹${packet.rupeesSaved}`;
    if (packet.avoidedCarbon) totalCarbonSaved.innerText = `${packet.avoidedCarbon} kg`;
    if (packet.instances) {
        kpiInstances.innerText = `${packet.instances} Node${packet.instances > 1 ? 's' : ''}`;
        updatePodTopology(packet.instances);
    }
    if (packet.forecast && aiForecastText) {
        aiForecastText.innerText = packet.forecast;
    }

    if (packet.regions) {
        if (ciIndia && packet.regions['Central India']) ciIndia.innerText = `${packet.regions['Central India'].ci} gCO₂`;
        if (ciEurope && packet.regions['North Europe']) ciEurope.innerText = `${packet.regions['North Europe'].ci} gCO₂`;
        if (ciUs && packet.regions['East US']) ciUs.innerText = `${packet.regions['East US'].ci} gCO₂`;
    }

    if (packet.type === 'CHAOS_ALERT') {
        document.body.classList.add('chaos-alert-active');
        setTimeout(() => document.body.classList.remove('chaos-alert-active'), 5000);
        speakAlert(packet.audioAlert || 'Chetavani! Carbon emission spike aya hai.');
    }

    if (packet.log) {
        prependLogRow(packet.log);
    }
};

function updatePodTopology(activeCount) {
    for (let i = 1; i <= 4; i++) {
        const pod = document.getElementById(`pod-${i}`);
        if (pod) {
            if (i <= activeCount) {
                pod.classList.add('running');
            } else {
                pod.classList.remove('running');
            }
        }
    }
}

function prependLogRow(log) {
    if (!logsTableBody) return;
    let badgeClass = 'badge-auto';
    if (log.actionType === 'CARBON_SCHEDULING') badgeClass = 'badge-carbon';
    if (log.actionType === 'STORAGE_LIFECYCLE') badgeClass = 'badge-storage';
    if (log.actionType === 'CHAOS_TEST') badgeClass = 'badge-chaos';

    const rowHtml = `
        <tr>
            <td style="color: #94a3b8;">${new Date(log.timestamp).toLocaleTimeString()}</td>
            <td><span class="badge ${badgeClass}">${log.actionType}</span></td>
            <td>${log.statusMessage}</td>
        </tr>
    `;
    logsTableBody.insertAdjacentHTML('afterbegin', rowHtml);
}

// 1. Autoscaling Slider
const slider = document.getElementById('cpuSlider');
const cpuValue = document.getElementById('cpuValue');
const instanceCount = document.getElementById('instanceCount');

if (slider) {
    slider.addEventListener('input', async (e) => {
        const val = Number(e.target.value);
        if (cpuValue) cpuValue.innerText = `${val}%`;

        const res = await fetch('/api/autoscale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpuLoad: val })
        });
        const data = await res.json();
        if (instanceCount) instanceCount.innerText = `${data.instances} Node${data.instances > 1 ? 's' : ''} Active`;
        updatePodTopology(data.instances);
    });
}

// 2. Spatial Carbon Workload Router
const backupBtn = document.getElementById('backupBtn');
const backupStatus = document.getElementById('backupStatus');
if (backupBtn) {
    backupBtn.addEventListener('click', async () => {
        backupStatus.innerText = 'Global grid emissions ka vishleshan kiya ja raha hai...';
        const res = await fetch('/api/carbon-job', { method: 'POST' });
        const data = await res.json();
        backupStatus.innerHTML = `<strong>[${data.status}]</strong> ${data.message}`;
    });
}

// 3. Storage Lifecycle (FinOps INR)
const storageBtn = document.getElementById('storageBtn');
const storageStatus = document.getElementById('storageStatus');
if (storageBtn) {
    storageBtn.addEventListener('click', async () => {
        storageStatus.innerText = 'Dormant data ko archive tier me bheja ja raha hai...';
        const res = await fetch('/api/storage-lifecycle', { method: 'POST' });
        const data = await res.json();
        storageStatus.innerHTML = `Tier: <strong>${data.tier}</strong> (${data.savedEnergy}) | FinOps: <span style="color:#0ea5e9;">${data.rupeesSaved}</span>`;
    });
}

// 4. Chaos Carbon Spike Simulator
const chaosBtn = document.getElementById('chaosBtn');
if (chaosBtn) {
    chaosBtn.addEventListener('click', async () => {
        const res = await fetch('/api/simulate-spike', { method: 'POST' });
        const data = await res.json();
        backupStatus.innerHTML = `<span style="color:#ef4444;"><strong>${data.message}</strong></span>`;
    });
}

// 5. Enterprise ESG & FinOps Audit PDF Export
const exportPdfBtn = document.getElementById('exportPdfBtn');
if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setTextColor(16, 185, 129);
        doc.text("Autonomous Green Cloud Architecture - ESG Audit", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()} | Compliance: GHG Protocol Scope 2`, 14, 28);
        doc.line(14, 32, 196, 32);

        doc.setFontSize(13);
        doc.setTextColor(20);
        doc.text("Executive Summary & FinOps Ledger", 14, 42);

        doc.setFontSize(11);
        doc.text(`• Total Cloud Cost Saved: ${totalRupeesSaved.innerText}`, 14, 52);
        doc.text(`• Net Carbon Footprint Avoided: ${totalCarbonSaved.innerText}`, 14, 60);
        doc.text(`• Active Grid Carbon Intensity: ${liveGridCarbon.innerText}`, 14, 68);
        doc.text(`• Running Infrastructure Nodes: ${kpiInstances.innerText}`, 14, 76);

        doc.setFontSize(13);
        doc.text("Recent Architectural Audit Log (Sample)", 14, 92);

        const rows = Array.from(logsTableBody.querySelectorAll('tr')).slice(0, 8);
        let yPos = 102;
        rows.forEach((r, idx) => {
            const cols = r.querySelectorAll('td');
            if (cols.length >= 3) {
                const text = `${cols[0].innerText} | ${cols[1].innerText}: ${cols[2].innerText}`;
                doc.setFontSize(9);
                doc.setTextColor(60);
                doc.text(doc.splitTextToSize(text, 180), 14, yPos);
                yPos += 14;
            }
        });

        doc.save("Green_Cloud_ESG_FinOps_Report.pdf");
    });
}

async function initialLoad() {
    const res = await fetch('/api/metrics');
    const data = await res.json();
    if (data.data && data.data.length > 0) {
        logsTableBody.innerHTML = '';
        data.data.forEach(log => prependLogRow(log));
    }
}
initialLoad();