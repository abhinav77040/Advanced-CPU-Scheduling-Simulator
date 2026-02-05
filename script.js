let processes = [];
let processIdCounter = 1;

document.getElementById('algorithm').addEventListener('change', function() {
    const timeQuantumInput = document.getElementById('timeQuantumInput');
    timeQuantumInput.style.display = this.value === 'rr' ? 'block' : 'none';
});

function addProcess() {
    const arrivalTime = parseInt(document.getElementById('arrivalTime').value);
    const burstTime = parseInt(document.getElementById('burstTime').value);
    const priority = parseInt(document.getElementById('priority').value) || 1;
    
    if (isNaN(arrivalTime) || isNaN(burstTime) || burstTime <= 0) {
        alert('Please enter valid arrival time and burst time');
        return;
    }
    
    const process = {
        pid: processIdCounter++,
        arrivalTime: arrivalTime,
        burstTime: burstTime,
        priority: priority,
        remainingTime: burstTime
    };
    
    processes.push(process);
    updateProcessTable();
    clearInputs();
}

function clearInputs() {
    document.getElementById('arrivalTime').value = '';
    document.getElementById('burstTime').value = '';
    document.getElementById('priority').value = '';
}

function deleteProcess(pid) {
    processes = processes.filter(p => p.pid !== pid);
    updateProcessTable();
}

function updateProcessTable() {
    const tableBody = document.getElementById('processTableBody');
    tableBody.innerHTML = '';
    
    processes.forEach(process => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>P${process.pid}</td>
            <td>${process.arrivalTime}</td>
            <td>${process.burstTime}</td>
            <td>${process.priority}</td>
            <td><button class="delete-btn" onclick="deleteProcess(${process.pid})">Delete</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function simulate() {
    if (processes.length === 0) {
        alert('Please add at least one process');
        return;
    }
    
    const algorithm = document.getElementById('algorithm').value;
    let results;
    
    switch(algorithm) {
        case 'fcfs':
            results = simulateFCFS();
            break;
        case 'sjf':
            results = simulateSJF();
            break;
        case 'priority':
            results = simulatePriority();
            break;
        case 'rr':
            const timeQuantum = parseInt(document.getElementById('timeQuantum').value);
            results = simulateRR(timeQuantum);
            break;
    }
    
    displayResults(results);
    displayGanttChart(results);
    calculateAndDisplayMetrics(results);
}

function simulateFCFS() {
    const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = sortedProcesses[0].arrivalTime;
    
    return sortedProcesses.map(process => {
        const startTime = Math.max(currentTime, process.arrivalTime);
        const completionTime = startTime + process.burstTime;
        const turnaroundTime = completionTime - process.arrivalTime;
        const waitingTime = turnaroundTime - process.burstTime;
        const responseTime = startTime - process.arrivalTime;
        
        currentTime = completionTime;
        
        return {
            ...process,
            startTime,
            completionTime,
            turnaroundTime,
            waitingTime,
            responseTime
        };
    });
}

function simulateSJF() {
    const processQueue = [...processes].map(p => ({...p}));
    const results = [];
    let currentTime = Math.min(...processQueue.map(p => p.arrivalTime));
    
    while (processQueue.length > 0) {
        const availableProcesses = processQueue.filter(p => p.arrivalTime <= currentTime);
        
        if (availableProcesses.length === 0) {
            currentTime = Math.min(...processQueue.map(p => p.arrivalTime));
            continue;
        }
        
        const shortestJob = availableProcesses.reduce((prev, curr) => 
            prev.burstTime < curr.burstTime ? prev : curr
        );
        
        const processIndex = processQueue.findIndex(p => p.pid === shortestJob.pid);
        const process = processQueue.splice(processIndex, 1)[0];
        
        const startTime = currentTime;
        const completionTime = startTime + process.burstTime;
        const turnaroundTime = completionTime - process.arrivalTime;
        const waitingTime = turnaroundTime - process.burstTime;
        const responseTime = startTime - process.arrivalTime;
        
        results.push({
            ...process,
            startTime,
            completionTime,
            turnaroundTime,
            waitingTime,
            responseTime
        });
        
        currentTime = completionTime;
    }
    
    return results;
}

function simulatePriority() {
    const processQueue = [...processes].map(p => ({...p}));
    const results = [];
    let currentTime = Math.min(...processQueue.map(p => p.arrivalTime));
    
    while (processQueue.length > 0) {
        const availableProcesses = processQueue.filter(p => p.arrivalTime <= currentTime);
        
        if (availableProcesses.length === 0) {
            currentTime = Math.min(...processQueue.map(p => p.arrivalTime));
            continue;
        }
        
        const highestPriority = availableProcesses.reduce((prev, curr) => 
            prev.priority < curr.priority ? prev : curr
        );
        
        const processIndex = processQueue.findIndex(p => p.pid === highestPriority.pid);
        const process = processQueue.splice(processIndex, 1)[0];
        
        const startTime = currentTime;
        const completionTime = startTime + process.burstTime;
        const turnaroundTime = completionTime - process.arrivalTime;
        const waitingTime = turnaroundTime - process.burstTime;
        const responseTime = startTime - process.arrivalTime;
        
        results.push({
            ...process,
            startTime,
            completionTime,
            turnaroundTime,
            waitingTime,
            responseTime
        });
        
        currentTime = completionTime;
    }
    
    return results;
}

function simulateRR(timeQuantum) {
    const processQueue = [...processes].map(p => ({...p}));
    const results = [];
    const timeline = [];
    let currentTime = Math.min(...processQueue.map(p => p.arrivalTime));
    
    while (processQueue.length > 0) {
        const availableProcesses = processQueue.filter(p => p.arrivalTime <= currentTime);
        
        if (availableProcesses.length === 0) {
            currentTime = Math.min(...processQueue.map(p => p.arrivalTime));
            continue;
        }
        
        const process = availableProcesses[0];
        const executeTime = Math.min(timeQuantum, process.remainingTime);
        
        timeline.push({
            pid: process.pid,
            startTime: currentTime,
            endTime: currentTime + executeTime
        });
        
        process.remainingTime -= executeTime;
        currentTime += executeTime;
        
        if (process.remainingTime > 0) {
            processQueue.push(processQueue.shift());
        } else {
            processQueue.shift();
            const firstResponse = timeline.find(t => t.pid === process.pid);
            results.push({
                ...process,
                startTime: firstResponse.startTime,
                completionTime: currentTime,
                turnaroundTime: currentTime - process.arrivalTime,
                waitingTime: currentTime - process.arrivalTime - process.burstTime,
                responseTime: firstResponse.startTime - process.arrivalTime
            });
        }
    }
    
    results.timeline = timeline;
    return results;
}

function displayResults(results) {
    const tableBody = document.getElementById('resultTableBody');
    tableBody.innerHTML = '';
    
    results.forEach(process => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>P${process.pid}</td>
            <td>${process.arrivalTime}</td>
            <td>${process.burstTime}</td>
            <td>${process.priority}</td>
            <td>${process.completionTime}</td>
            <td>${process.turnaroundTime}</td>
            <td>${process.waitingTime}</td>
            <td>${process.responseTime}</td>
        `;
        tableBody.appendChild(row);
    });
    
    document.getElementById('results').style.display = 'block';
}

function displayGanttChart(results) {
    const ganttChart = document.getElementById('ganttChart');
    ganttChart.innerHTML = '';
    
    if (results.timeline) {
        // Round Robin timeline
        results.timeline.forEach(block => {
            const div = document.createElement('div');
            div.className = 'gantt-block';
            div.innerHTML = `P${block.pid}<br>${block.startTime} - ${block.endTime}`;
            ganttChart.appendChild(div);
        });
    } else {
        // Other algorithms
        results.forEach(process => {
            const block = document.createElement('div');
            block.className = 'gantt-block';
            block.innerHTML = `P${process.pid}<br>${process.startTime} - ${process.completionTime}`;
            ganttChart.appendChild(block);
        });
    }
}

function calculateAndDisplayMetrics(results) {
    const totalProcesses = results.length;
    const totalWaitingTime = results.reduce((sum, process) => sum + process.waitingTime, 0);
    const totalTurnaroundTime = results.reduce((sum, process) => sum + process.turnaroundTime, 0);
    const totalResponseTime = results.reduce((sum, process) => sum + process.responseTime, 0);
    
    const avgWaiting = (totalWaitingTime / totalProcesses).toFixed(2);
    const avgTurnaround = (totalTurnaroundTime / totalProcesses).toFixed(2);
    const avgResponse = (totalResponseTime / totalProcesses).toFixed(2);
    
    const maxCompletionTime = Math.max(...results.map(p => p.completionTime));
    const totalBurstTime = results.reduce((sum, process) => sum + process.burstTime, 0);
    const cpuUtilization = ((totalBurstTime / maxCompletionTime) * 100).toFixed(2);
    const throughput = (totalProcesses / maxCompletionTime).toFixed(2);
    
    document.getElementById('avgWaitingTime').textContent = avgWaiting;
    document.getElementById('avgTurnaroundTime').textContent = avgTurnaround;
    document.getElementById('avgResponseTime').textContent = avgResponse;
    document.getElementById('cpuUtilization').textContent = cpuUtilization;
    document.getElementById('throughput').textContent = throughput;
}