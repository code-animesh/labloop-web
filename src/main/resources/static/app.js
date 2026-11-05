const $ = s => document.querySelector(s);
const m = $('#modal');
let inventoryData = [];

const val = (x, k) => x[k] ?? x[k.toLowerCase()] ?? x[k.toUpperCase()] ?? '';
const sel = (id, a, selectedVal = '') => `<select id="${id}">${a.map(v => `<option value="${v}" ${v === selectedVal ? 'selected' : ''}>${v}</option>`).join('')}</select>`;

// Toast Notification System
const toast = (msg, type = 'success') => {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.style.transform = 'translateY(0)');
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateY(10px)';
        setTimeout(() => t.remove(), 300);
    }, 3000);
};

async function load() {
    try {
        inventoryData = await fetch('/api/equipment').then(r => r.json());
        render();
    } catch (err) {
        toast("Failed to load inventory", "error");
    }
}

function render() {
    const searchTerm = $('#search').value.toLowerCase();
    const filterStatus = $('#filter').value;

    const filtered = inventoryData.filter(x => {
        const matchesSearch = val(x, 'name').toLowerCase().includes(searchTerm) || val(x, 'code').toLowerCase().includes(searchTerm);
        const matchesStatus = filterStatus === 'ALL' || val(x, 'status') === filterStatus;
        return matchesSearch && matchesStatus;
    });

    $('#total').textContent = inventoryData.length;
    $('#available').textContent = inventoryData.filter(x => val(x, 'status') === 'AVAILABLE').length;
    $('#borrowed').textContent = inventoryData.filter(x => val(x, 'status') === 'BORROWED').length;

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
                    ? `<button class="primary-action" onclick="promptAction(${val(x, 'id')},'borrow')">Borrow</button>` 
                    : `<button class="primary-action" onclick="promptAction(${val(x, 'id')},'return')">Return</button>`}
                <button onclick="openForm(${val(x, 'id')})">Edit</button>
                <button onclick="viewHistory(${val(x, 'id')})">History</button>
                <button class="danger-btn" style="padding:10px" onclick="confirmDelete(${val(x, 'id')})">Delete</button>
            </div>
        </article>
    `).join('');
}

// Custom Modals replacing prompt() and confirm()
function promptAction(id, action) {
    const item = inventoryData.find(x => x.id === id);
    m.innerHTML = `
        <button class="close" type="button" onclick="document.getElementById('modal').close()">×</button>
        <h2>${action === 'borrow' ? 'Borrow' : action === 'return' ? 'Return' : 'Inspect'} Equipment</h2>
        <p>Asset: <strong>${val(item, 'name')} (${val(item, 'code')})</strong></p>
        <label>Update Condition</label>
        ${sel('action-condition', ['GOOD', 'FAIR', 'DAMAGED', 'EXCELLENT', 'NEEDS_SERVICE', 'OUT_OF_ORDER'], val(item, 'condition_state'))}
        <button class="primary" type="button" onclick="executeAction(${id}, '${action}')">Confirm ${action}</button>
    `;
    m.showModal();
}

async function executeAction(id, action) {
    let condition = $('#action-condition').value;
    let response = await fetch(`/api/equipment/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: condition.toUpperCase() })
    });
    if (response.ok) {
        m.close();
        toast(`Equipment successfully marked as ${action}ed.`);
        load();
    }
}

function confirmDelete(id) {
    m.innerHTML = `
        <button class="close" type="button" onclick="document.getElementById('modal').close()">×</button>
        <h2>Confirm Deletion</h2>
        <p style="margin-bottom: 24px;">Are you sure you want to permanently delete this equipment? This action cannot be undone.</p>
        <div style="display:flex; gap:12px;">
            <button style="flex:1; padding:12px; border-radius:8px; border:1px solid #cbd5e1; background:white; cursor:pointer;" type="button" onclick="document.getElementById('modal').close()">Cancel</button>
            <button style="flex:1" class="danger-btn" type="button" onclick="executeDelete(${id})">Delete Asset</button>
        </div>
    `;
    m.showModal();
}

async function executeDelete(id) {
    await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
    m.close();
    toast('Equipment deleted.', 'error');
    load();
}

// Form logic handling both Add and Edit
function openForm(id = null) {
    const item = id ? inventoryData.find(x => x.id === id) : null;
    m.innerHTML = `
        <button class="close" type="button" onclick="document.getElementById('modal').close()">×</button>
        <h2>${item ? 'Edit' : 'Add new'} equipment</h2>
        <label>Asset code</label>
        <input id="code" required placeholder="e.g. MIC-003" value="${item ? val(item, 'code') : ''}" ${item ? 'disabled' : ''}>
        
        <label>Equipment name</label>
        <input id="name" required placeholder="e.g. Digital Microscope" value="${item ? val(item, 'name') : ''}">
        
        <label>Category</label>
        ${sel('category', ['Optics', 'Electronics', 'Chemistry', 'Computing', 'Mechanical', 'Safety', 'Measurement'], item ? val(item, 'category') : '')}
        
        <label>Location</label>
        ${sel('location', ['Cabinet A', 'Cabinet B', 'Shelf A', 'Shelf B', 'Electronics Lab', 'Chemistry Lab', 'Store Room'], item ? val(item, 'location') : '')}
        
        <label>Status</label>
        ${sel('status', ['AVAILABLE', 'BORROWED', 'MAINTENANCE', 'RESERVED', 'RETIRED', 'LOST'], item ? val(item, 'status') : 'AVAILABLE')}
        
        <label>Condition</label>
        ${sel('condition', ['GOOD', 'FAIR', 'DAMAGED', 'EXCELLENT', 'NEEDS_SERVICE', 'OUT_OF_ORDER'], item ? val(item, 'condition_state') : 'GOOD')}
        
        <button class="primary" type="button" onclick="saveForm(${id})">${item ? 'Update' : 'Save'} equipment</button>
    `;
    m.showModal();
}

async function saveForm(id) {
    let payload = ['code', 'name', 'category', 'location', 'status', 'condition'].reduce((obj, key) => {
        obj[key] = $('#' + key).value;
        return obj;
    }, {});

    if (!payload.code || !payload.name) {
        return toast('Please enter both asset code and equipment name.', 'error');
    }

    const url = id ? `/api/equipment/${id}` : '/api/equipment';
    const method = id ? 'PUT' : 'POST';

    let response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) return toast('Asset code already exists or invalid data.', 'error');
    
    m.close();
    toast(`Equipment ${id ? 'updated' : 'added'} successfully.`);
    load();
}

// Activity History Tracking
async function viewHistory(id) {
    const history = await fetch(`/api/equipment/${id}/activity`).then(r => r.json());
    const item = inventoryData.find(x => x.id === id);
    m.innerHTML = `
        <button class="close" type="button" onclick="document.getElementById('modal').close()">×</button>
        <h2>Activity Log</h2>
        <p>Asset tracking for: <strong>${val(item, 'name')} (${val(item, 'code')})</strong></p>
        <div class="history-list">
            ${history.length ? history.map(h => `
                <div class="history-item">
                    <small>${new Date(val(h, 'created_at')).toLocaleString()}</small>
                    <p><strong>${val(h, 'action')}</strong> — ${val(h, 'note')}</p>
                </div>
            `).join('') : '<p style="color: #64748b; margin-top: 16px;">No activity recorded yet.</p>'}
        </div>
    `;
    m.showModal();
}

load();