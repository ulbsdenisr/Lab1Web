const form = document.getElementById('vin-form');
const vinInput = document.getElementById('vin');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');
const resetButton = document.getElementById('reset-form');
const summaryLabel = document.getElementById('summary-label');

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

function updateSummaryLabel() {
  const make = fields.make.textContent.trim();
  const model = fields.model.textContent.trim();
  const year = fields.year.textContent.trim();

  if (make !== '—' && model !== '—' && year !== '—') {
    summaryLabel.textContent = `${year} ${make} ${model}`;
    return;
  }

  summaryLabel.textContent = 'Vehicle profile';
}

function resetFormState() {
  form.reset();
  vinInput.value = '';
  resultEl.classList.add('hidden');
  setStatus('Enter a 17-character VIN to begin.');

  Object.values(fields).forEach((field) => {
    field.textContent = '—';
  });

  updateSummaryLabel();
}

async function decodeVin(vin) {
  const url = `/api/decode?vin=${encodeURIComponent(vin)}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data?.error || !data?.attributes) {
    throw new Error(data?.error || data?.message || 'VIN not found or API request failed.');
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

    updateSummaryLabel();
    resultEl.classList.remove('hidden');
    setStatus('VIN decoded successfully.', 'success');
  } catch (error) {
    setStatus(error.message || 'Something went wrong. Please try again.', 'error');
  }
});

vinInput.addEventListener('input', () => {
  vinInput.value = normalizeVin(vinInput.value);
});

resetButton.addEventListener('click', resetFormState);

updateSummaryLabel();
