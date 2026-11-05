const $ = s => document.querySelector(s);
const m = $('#modal');
let inventoryData = []; // Store state globally to enable instant filtering

// UI Helper: Safely access object properties
const val = (x, k) => x[k] ?? x[k.toLowerCase()] ?? x[k.toUpperCase()] ?? '';
const sel = (id, a) => `<select id="${id}">${a.map(v => `<option value="${v}">${v}</option>`).join('')}</select>`;

async function load() {
    try {
        inventoryData = await fetch('/api/equipment').then(r => r.json());
        render(); // Use the unified render method to populate data and stats
    } catch (err) {
        console.error("Failed to load inventory", err);
    }
}

function render() {
    const searchTerm = $('#search').value.toLowerCase();
    const filterStatus = $('#filter').value;

    // Filter logic
    const filtered = inventoryData.filter(x => {
        const matchesSearch = val(x, 'name').toLowerCase().includes(searchTerm) || 
                              val(x, 'code').toLowerCase().includes(searchTerm);
        const matchesStatus = filterStatus === 'ALL' || val(x, 'status') === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Update statistics
    $('#total').textContent = inventoryData.length;
    $('#available').textContent = inventoryData.filter(x => val(x, 'status') === 'AVAILABLE').length;
    $('#borrowed').textContent = inventoryData.filter(x => val(x, 'status') === 'BORROWED').length;

    // Render cards
    $('#list').innerHTML = filtered.map(x => `
        <article class="card">
            <div><span class="code">${val(x, 'code')}</span></div>
            <h3>${val(x, 'name')}</h3>
            <small>${val(x, 'category')} · ${val(x, 'location')}</small>
            <p class="tags">
                <span class="tag ${val(x, 'status')}">${val(x, 'status')}</span> 
                <span class="tag GOOD">${val(x, 'condition_state')}</span>
            </p>
            <div class="actions">
                ${val(x, 'status') === 'AVAILABLE' 
                    ? `<button class="primary-action" onclick="act(${val(x, 'id')},'borrow')">Borrow</button>` 
                    : `<button class="primary-action" onclick="act(${val(x, 'id')},'return')">Return</button>`}
                <button onclick="act(${val(x, 'id')},'inspect')">Inspect</button>
                <button class="danger" onclick="del(${val(x, 'id')})">Delete</button>
            </div>
        </article>
    `).join('');
}

async function act(id, action) {
    let condition = prompt('Update equipment condition (GOOD / FAIR / DAMAGED):', 'GOOD');
    if (condition) {
        await fetch(`/api/equipment/${id}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ condition: condition.toUpperCase() })
        });
        load();
    }
}

async function del(id) {
    if (confirm('Are you sure you want to permanently delete this equipment? This action cannot be undone.')) {
        await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
        load();
    }
}

function openAdd() {
    $('#form').innerHTML = `
        <h2>Add new equipment</h2>
        <label>Asset code</label>
        <input id="code" required placeholder="e.g. MIC-003">
        
        <label>Equipment name</label>
        <input id="name" required placeholder="e.g. Digital Microscope">
        
        <label>Category</label>
        ${sel('category', ['Optics', 'Electronics', 'Chemistry', 'Computing', 'Mechanical', 'Safety', 'Measurement'])}
        
        <label>Location</label>
        ${sel('location', ['Cabinet A', 'Cabinet B', 'Shelf A', 'Shelf B', 'Electronics Lab', 'Chemistry Lab', 'Store Room'])}
        
        <label>Status</label>
        ${sel('status', ['AVAILABLE', 'BORROWED', 'MAINTENANCE', 'RESERVED', 'RETIRED', 'LOST'])}
        
        <label>Condition</label>
        ${sel('condition', ['GOOD', 'FAIR', 'DAMAGED', 'EXCELLENT', 'NEEDS_SERVICE', 'OUT_OF_ORDER'])}
        
        <button class="primary" type="button" onclick="add()">Save equipment</button>
    `;
    m.showModal();
}

async function add() {
    let payload = ['code', 'name', 'category', 'location', 'status', 'condition'].reduce((obj, key) => {
        obj[key] = $('#' + key).value;
        return obj;
    }, {});

    if (!payload.code || !payload.name) {
        return alert('Please enter both asset code and equipment name.');
    }

    let response = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) return alert('Asset code already exists or invalid data.');
    
    m.close();
    load();
}

// Initial load
load();