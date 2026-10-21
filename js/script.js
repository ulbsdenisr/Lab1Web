// Put your CarsXE API key here.
// 1) Sign in to the CarsXE dashboard
// 2) Copy your API key
// 3) Replace the placeholder below
const API_KEY = 'gennqjcyf_g12od2e1j_ua3ie26nd';

const form = document.getElementById('vin-form');
const vinInput = document.getElementById('vin');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');

const fields = {
  year: document.getElementById('year'),
  make: document.getElementById('make'),
  model: document.getElementById('model'),
  trim: document.getElementById('trim'),
  engine: document.getElementById('engine'),
  drivetrain: document.getElementById('drivetrain')
};

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = 'status';

  if (type) {
    statusEl.classList.add(type);
  }
}

function normalizeVin(value) {
  return value.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
}

async function decodeVin(vin) {
  const url = `https://api.carsxe.com/specs?key=${encodeURIComponent(API_KEY)}&vin=${encodeURIComponent(vin)}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data?.error || !data?.attributes) {
    throw new Error(data?.message || 'VIN not found or API request failed.');
  }

  return data.attributes;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const vin = normalizeVin(vinInput.value);

  if (vin.length !== 17) {
    setStatus('Please enter a valid 17-character VIN.', 'error');
    resultEl.classList.add('hidden');
    return;
  }

  if (!API_KEY || API_KEY.trim() === '' || API_KEY === 'gennqjcyf_g12od2e1j_ua3ie26nd') {
    setStatus('Add your CarsXE API key in js/script.js before decoding.', 'error');
    resultEl.classList.add('hidden');
    return;
  }

  setStatus('Decoding VIN...', '');
  resultEl.classList.add('hidden');

  try {
    const vehicle = await decodeVin(vin);

    fields.year.textContent = vehicle.year || '—';
    fields.make.textContent = vehicle.make || '—';
    fields.model.textContent = vehicle.model || '—';
    fields.trim.textContent = vehicle.trim || '—';
    fields.engine.textContent = vehicle.engine || '—';
    fields.drivetrain.textContent = vehicle.drivetrain || '—';

    resultEl.classList.remove('hidden');
    setStatus('VIN decoded successfully.', 'success');
  } catch (error) {
    setStatus(error.message || 'Something went wrong. Please try again.', 'error');
  }
});

vinInput.addEventListener('input', () => {
  vinInput.value = normalizeVin(vinInput.value);
});
