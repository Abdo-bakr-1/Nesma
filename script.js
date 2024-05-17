let characteristic;
const joystick = document.getElementById('joystick');
const stick = document.getElementById('stick');

async function connectBluetooth() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'HC-05' }],
            optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb']
        });
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
        characteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
        console.log('Connected to Bluetooth');
    } catch (error) {
        console.error('Connection failed', error);
    }
}

document.getElementById('connect-button').addEventListener('click', connectBluetooth);

joystick.addEventListener('pointerdown', startDrag);
joystick.addEventListener('pointermove', drag);
joystick.addEventListener('pointerup', endDrag);
joystick.addEventListener('pointerleave', endDrag);

let dragging = false;

function startDrag(event) {
    dragging = true;
    drag(event);
}

function drag(event) {
    if (!dragging) return;
    const rect = joystick.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const angle = Math.atan2(y, x);
    const distance = Math.min(Math.sqrt(x * x + y * y), rect.width / 2);
    const normalizedX = Math.cos(angle) * distance / (rect.width / 2);
    const normalizedY = Math.sin(angle) * distance / (rect.height / 2);

    stick.style.transform = `translate(${normalizedX * (rect.width / 2)}px, ${normalizedY * (rect.height / 2)}px)`;

    sendCommand(normalizedX, normalizedY);
}

function endDrag() {
    dragging = false;
    stick.style.transform = 'translate(-50%, -50%)';
    sendCommand(0, 0);
}

function sendCommand(x, y) {
    if (!characteristic) return;

    let command;
    if (y < -0.5) {
        command = 'forward';
    } else if (y > 0.5) {
        command = 'backward';
    } else if (x < -0.5) {
        command = 'left';
    } else if (x > 0.5) {
        command = 'right';
    } else {
        command = 'stop';
    }

    const encoder = new TextEncoder();
    characteristic.writeValue(encoder.encode(command)).catch(err => console.error('Error sending command:', err));
}
