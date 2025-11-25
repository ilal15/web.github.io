// **********************************************
// 🚨 KONFIGURASI BROKER ANDA 🚨
// **********************************************
// Menggunakan konfigurasi yang SAMA PERSIS dengan file emqx.ino dan konfigurasi sebelumnya
const HOST = "wfd171ac.ala.asia-southeast1.emqxsl.com"; // Address broker Anda
const PORT = 8084;                                       // Port WebSocket Secure (WSS)
const USERNAME = "admin";                                // Username Autentikasi
const PASSWORD = "admin";                                // Password Autentikasi
const CLIENT_ID = "web_monitor_" + parseInt(Math.random() * 100000); // ID Unik
const SUBSCRIBE_TOPIC = "sensor/data";                   // Topik untuk Subscribe (sesuai Arduino)
// **********************************************

let client = null;

// --- Fungsi untuk memperbarui tampilan status ---
function updateStatus(status) {
    const statusBox = document.getElementById('status-box');
    statusBox.textContent = "Status: " + status;
    
    statusBox.className = '';
    if (status.includes('Connected')) {
        statusBox.classList.add('status-connected');
    } else if (status.includes('Connecting')) {
        statusBox.classList.add('status-connecting');
    } else {
        statusBox.classList.add('status-disconnected');
    }
}

// --- Fungsi untuk logging pesan ---
function logMessage(text) {
    const logElement = document.getElementById('message-log');
    logElement.textContent += `[${new Date().toLocaleTimeString()}] ${text}\n`;
    logElement.scrollTop = logElement.scrollHeight; // Scroll ke bawah
}

// --- Handler ketika koneksi berhasil ---
function onConnect() {
    updateStatus("Connected! ✅");
    logMessage(`Koneksi berhasil ke ${HOST}:${PORT}.`);
    
    // Lakukan Subscribe ke Topik setelah berhasil terhubung
    client.subscribe(SUBSCRIBE_TOPIC);
    logMessage(`Berhasil Subscribe ke topik: ${SUBSCRIBE_TOPIC}`);
}

// --- Handler ketika koneksi gagal atau terputus ---
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        updateStatus(`Connection Lost! (${responseObject.errorMessage})`);
        logMessage(`ERROR: Koneksi terputus: ${responseObject.errorMessage}`);
    }
}

// --- Fungsi UTAMA untuk memperbarui tampilan data sensor ---
function updateSensorDisplay(data) {
    // Memperbarui elemen HTML dengan data yang diterima
    document.getElementById('data-temperature').textContent = `${data.temperature} °C`;
    document.getElementById('data-humidity').textContent = `${data.humidity} %`;
    document.getElementById('data-ph').textContent = `${data.ph}`;
}

// --- Handler ketika pesan diterima dari broker ---
function onMessageArrived(message) {
    const topic = message.destinationName;
    const payload = message.payloadString;
    logMessage(`Pesan dari [${topic}]: ${payload}`);

    if (topic === SUBSCRIBE_TOPIC) {
        try {
            // Parsing payload string menjadi objek JSON
            const sensorData = JSON.parse(payload);
            
            // Panggil fungsi untuk memperbarui tampilan
            updateSensorDisplay(sensorData);

        } catch (e) {
            logMessage(`ERROR Parsing JSON: ${e.message}`);
        }
    }
}

// --- Fungsi Utama untuk Koneksi ke Broker ---
function connectToBroker() {
    updateStatus("Connecting...");
    logMessage(`Mencoba terhubung ke wss://${HOST}:${PORT}...`);
    
    client = new Paho.MQTT.Client(HOST, PORT, CLIENT_ID);

    // Set callback functions
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    
    // Opsi Koneksi (Wajib menggunakan useSSL: true dan Autentikasi)
    const options = {
        useSSL: true, // Wajib menggunakan WSS (Port 8084)
        timeout: 3,
        onSuccess: onConnect,
        onFailure: (response) => {
            updateStatus("Failed to Connect! ❌");
            logMessage(`ERROR: Gagal terhubung: ${response.errorMessage}`);
        },
        // Autentikasi (Sama dengan Arduino dan konfigurasi lama)
        userName: USERNAME,
        password: PASSWORD
    };

    // Mulai koneksi
    client.connect(options);
}

// Mulai koneksi secara otomatis saat halaman dimuat
window.onload = connectToBroker;