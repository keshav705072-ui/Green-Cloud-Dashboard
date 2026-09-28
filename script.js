// 1. Right-sizing & Autoscaling Logic (Paper Concept: Section IV.1 & IV.2)
function updateScaling() {
    let cpu = document.getElementById("cpuSlider").value;
    document.getElementById("cpuVal").innerText = cpu;
    let countText = document.getElementById("instanceCount");

     if (cpu < 25) {
        countText.innerText = "1 Server Instance (Scale In - Low Power)";
    } else if (cpu >= 25 && cpu < 50) {
        countText.innerText = "2 Server Instances (Normal Balance)";
    } else if (cpu >= 50 && cpu <75) {
        countText.innerText = "3 Server Instances (Medium Traffic load)";
    }
     else {
        countText.innerText = "4 Server Instances (Scale Out - High Traffic)";
    }
}


// 2. Carbon-Aware Workload Scheduling Logic (Paper Concept: Section IV.4)
function scheduleJob() {
    let status = document.getElementById("carbonStatus");
    status.innerText = "Checking Electricity Grid Carbon Intensity...";
    
    setTimeout(() => {
        // Simulating high grid carbon right now
        status.innerHTML = "<b>Carbon Intensity: HIGH</b><br>⚡ Job Shifted! Scheduled for 02:00 AM (Low-Carbon Renewable Time).";
    }, 1200);
}

// 3. Storage Lifecycle Management Logic (Paper Concept: Section IV.6)
function runLifecycle() {
    let status = document.getElementById("storageStatus");
    status.innerText = "Scanning Blob Storage...";

    setTimeout(() => {
        status.innerHTML = "<b>Lifecycle Policy Executed:</b><br>📁 12 GB inactive logs moved to Cool Tier.<br>🗑️ 5 GB temporary data deleted.";
    }, 1200);
}
