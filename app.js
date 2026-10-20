// BLE 相關設定常數
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26aae";

let bluetoothDevice = null;
let bluetoothCharacteristic = null;

// DOM 元素抓取
const connectBtn = document.getElementById('connectBtn');
const statusText = document.getElementById('status');
const onBtn = document.getElementById('onBtn');
const offBtn = document.getElementById('offBtn');
const autoBtn = document.getElementById('autoBtn');
const colorPicker = document.getElementById('colorPicker');
const brightnessRange = document.getElementById('brightnessRange');

// 1. 點擊按鈕連接藍牙
connectBtn.addEventListener('click', async () => {
    try {
        statusText.innerText = '狀態: 搜尋中...';
        
        // 請求搜尋指定名稱的藍牙裝置
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'ESP32-LED-Control' }],
            optionalServices: [SERVICE_UUID]
        });

        // 監聽斷線事件
        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);

        // 連接 GATT 伺服器
        statusText.innerText = '狀態: 連接中...';
        const server = await bluetoothDevice.gatt.connect();

        // 取得指定的 Service 與 Characteristic
        const service = await server.getPrimaryService(SERVICE_UUID);
        bluetoothCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        statusText.innerText = '狀態: 已連線';
        connectBtn.style.backgroundColor = '#6c757d';
        connectBtn.innerText = '已連線';

    } catch (error) {
        console.error('藍牙連線錯誤:', error);
        statusText.innerText = '狀態: 連線失敗或取消';
    }
});

// 2. 傳送資料到 ESP32 的共用函式
async function sendData(dataStr) {
    if (!bluetoothCharacteristic) {
        alert('請先點擊「連接藍牙裝置」！');
        return;
    }
    try {
        const encoder = new TextEncoder();
        await bluetoothCharacteristic.writeValue(encoder.encode(dataStr));
        console.log('已發送指令:', dataStr);
    } catch (error) {
        console.error('發送失敗:', error);
    }
}

// 3. 綁定按鈕事件
onBtn.addEventListener('click', () => sendData('ON'));
offBtn.addEventListener('click', () => sendData('OFF'));
autoBtn.addEventListener('click', () => sendData('AUTO'));

// 4. 顏色與亮度變動時即時發送 (格式: R,G,B,Brightness)
function updateLED() {
    const hex = colorPicker.value;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const bright = brightnessRange.value;

    sendData(`${r},${g},${b},${bright}`);
}

colorPicker.value = '#ffffff'; // 預設白光
colorPicker.addEventListener('input', updateLED);
brightnessRange.addEventListener('input', updateLED);

// 5. 斷線處理函式
function onDisconnected(event) {
    statusText.innerText = '狀態: 裝置已斷線';
    connectBtn.style.backgroundColor = '#007bff';
    connectBtn.innerText = '連接藍牙裝置';
    bluetoothCharacteristic = null;
    console.log('藍牙裝置已中斷連線');
}
