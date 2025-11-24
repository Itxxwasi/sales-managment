;(function() {
  function initSuppliersSection() {
    const addBtn = document.getElementById('addSupplierBtn');
    if (addBtn) {
      const newBtn = addBtn.cloneNode(true);
      addBtn.parentNode.replaceChild(newBtn, addBtn);
      newBtn.addEventListener('click', function() {
        const form = document.getElementById('supplierForm');
        if (form) form.reset();
        const label = document.getElementById('addSupplierModalLabel');
        if (label) label.textContent = 'Add New Supplier';
        const saveBtn = document.getElementById('saveSupplierBtn');
        if (saveBtn) {
          saveBtn.textContent = 'Save Supplier';
          saveBtn.onclick = null;
          saveBtn.removeAttribute('onclick');
          saveBtn.onclick = function() {
            const formEl = document.getElementById('supplierForm');
            if (formEl && formEl.checkValidity()) {
              if (typeof window.saveSupplier === 'function') window.saveSupplier();
              else if (typeof saveSupplier === 'function') saveSupplier();
            } else if (formEl) {
              formEl.reportValidity();
            }
          };
        }
        const modalEl = document.getElementById('addSupplierModal');
        if (modalEl && window.bootstrap && typeof window.bootstrap.Modal === 'function') {
          const modal = new window.bootstrap.Modal(modalEl);
          modal.show();
        }
      });
    }
    const cardBtn = document.getElementById('supplierCardViewBtn');
    const tableBtn = document.getElementById('supplierTableViewBtn');
    const cardView = document.getElementById('supplierCardView');
    const tableView = document.getElementById('supplierTableView');
    if (cardBtn && tableBtn && cardView && tableView) {
      const cardBtnNew = cardBtn.cloneNode(true);
      cardBtn.parentNode.replaceChild(cardBtnNew, cardBtn);
      const tableBtnNew = tableBtn.cloneNode(true);
      tableBtn.parentNode.replaceChild(tableBtnNew, tableBtn);
      cardBtnNew.addEventListener('click', function() {
        cardBtnNew.classList.add('active');
        tableBtnNew.classList.remove('active');
        cardView.style.display = 'block';
        tableView.style.display = 'none';
      });
      tableBtnNew.addEventListener('click', function() {
        tableBtnNew.classList.add('active');
        cardBtnNew.classList.remove('active');
        tableView.style.display = 'block';
        cardView.style.display = 'none';
      });
    }
    if (typeof window.loadSuppliers === 'function') window.loadSuppliers();
    else if (typeof loadSuppliers === 'function') loadSuppliers();
  }

  function saveSupplier() {
    const supplierData = { name: document.getElementById('supplierName').value.trim(), description: document.getElementById('supplierDescription').value, contact: document.getElementById('supplierContact').value, phone: document.getElementById('supplierPhone').value, email: document.getElementById('supplierEmail').value, address: document.getElementById('supplierAddress').value };
    api.createSupplier(supplierData).then(() => { if (window.bootstrap) window.bootstrap.Modal.getInstance(document.getElementById('addSupplierModal')).hide(); document.getElementById('supplierForm').reset(); const label = document.getElementById('addSupplierModalLabel'); if (label) label.textContent = 'Add New Supplier'; if (typeof showNotification === 'function') showNotification('Supplier saved successfully!', 'success'); if (typeof populatePaymentVoucherDropdowns === 'function') populatePaymentVoucherDropdowns(); if (typeof populatePaymentModuleFilters === 'function') populatePaymentModuleFilters(); loadSuppliers(); }).catch(error => { console.error('Error saving supplier:', error); if (error.message && (error.message.includes('duplicate key') || error.message.includes('already exists'))) { if (typeof showNotification === 'function') showNotification('Supplier name already exists. Please use a different name.', 'error'); } else { if (typeof showNotification === 'function') showNotification('Failed to save supplier: ' + (error.message || 'Unknown error'), 'error'); } });
  }

  function loadSuppliers() { api.getSuppliers().then(suppliersData => { appData.suppliers = suppliersData; renderSuppliers(suppliersData); }).catch(error => { console.error('Error loading suppliers:', error); if (typeof showNotification === 'function') showNotification('Failed to load suppliers', 'error'); }); }

  function renderSuppliers(suppliersData) {
    const sortedSuppliers = [...suppliersData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const cardContainer = document.getElementById('suppliersContainer'); if (cardContainer) { cardContainer.innerHTML = ''; if (sortedSuppliers.length === 0) { cardContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">No suppliers found. Click "Add Supplier" to create one.</div></div>'; const tableBody = document.getElementById('suppliersTableBody'); if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No suppliers found</td></tr>'; } else { sortedSuppliers.forEach((supplier, index) => { const card = document.createElement('div'); card.className = 'col-md-4 mb-3'; card.innerHTML = '<div class="card"><div class="card-body"><div class="d-flex justify-content-between align-items-start mb-2"><h5 class="card-title mb-0">' + supplier.name + '</h5><span class="badge bg-primary">#' + (index + 1) + '</span></div><p class="card-text text-muted small mb-2">' + (supplier.description || 'No description') + '</p><div class="mb-2">' + (supplier.contact ? '<small class="text-muted"><i class="fas fa-user"></i> ' + supplier.contact + '</small><br>' : '') + (supplier.phone ? '<small class="text-muted"><i class="fas fa-phone"></i> ' + supplier.phone + '</small><br>' : '') + (supplier.email ? '<small class="text-muted"><i class="fas fa-envelope"></i> ' + supplier.email + '</small><br>' : '') + (supplier.address ? '<small class="text-muted"><i class="fas fa-map-marker-alt"></i> ' + supplier.address + '</small>' : '') + '</div><div class="d-flex justify-content-between mt-3"><button class="btn btn-sm btn-outline-primary" onclick="editSupplier(\'' + supplier._id + '\')"><i class="fas fa-edit"></i> Edit</button><button class="btn btn-sm btn-outline-danger" onclick="deleteSupplier(\'' + supplier._id + '\')"><i class="fas fa-trash"></i> Delete</button></div></div></div>'; cardContainer.appendChild(card); }); } }
    const tableBody = document.getElementById('suppliersTableBody'); if (!tableBody) return; tableBody.innerHTML = ''; sortedSuppliers.forEach(supplier => { const row = document.createElement('tr'); const createdDate = new Date(supplier.createdAt).toLocaleDateString(); row.innerHTML = '<td><strong>' + supplier.name + '</strong></td><td>' + (supplier.description || 'No description') + '</td><td>' + (supplier.contact || '-') + '</td><td>' + (supplier.phone || '-') + '</td><td>' + (supplier.email || '-') + '</td><td>' + createdDate + '</td><td><button class="btn btn-sm btn-outline-primary me-2" onclick="editSupplier(\'' + supplier._id + '\')"><i class="fas fa-edit"></i> Edit</button><button class="btn btn-sm btn-outline-danger" onclick="deleteSupplier(\'' + supplier._id + '\')"><i class="fas fa-trash"></i> Delete</button></td>'; tableBody.appendChild(row); });
  }

  function editSupplier(id) {
    api.getSuppliers().then(suppliersData => { const supplier = suppliersData.find(s => s._id === id); if (supplier) { document.getElementById('supplierName').value = supplier.name || ''; document.getElementById('supplierDescription').value = supplier.description || ''; document.getElementById('supplierContact').value = supplier.contact || ''; document.getElementById('supplierPhone').value = supplier.phone || ''; document.getElementById('supplierEmail').value = supplier.email || ''; document.getElementById('supplierAddress').value = supplier.address || ''; const label = document.getElementById('addSupplierModalLabel'); if (label) label.textContent = 'Edit Supplier'; const saveBtn = document.getElementById('saveSupplierBtn'); if (saveBtn) { saveBtn.textContent = 'Update Supplier'; saveBtn.onclick = null; saveBtn.removeAttribute('onclick'); saveBtn.onclick = function() { const formEl = document.getElementById('supplierForm'); if (formEl && formEl.checkValidity()) updateSupplier(id); else formEl.reportValidity(); }; } if (window.bootstrap) { const modal = new window.bootstrap.Modal(document.getElementById('addSupplierModal')); modal.show(); } } }).catch(error => { console.error('Error loading supplier for editing:', error); if (typeof showNotification === 'function') showNotification('Failed to load supplier details', 'error'); });
  }

  function updateSupplier(id) {
    const supplierData = { name: document.getElementById('supplierName').value.trim(), description: document.getElementById('supplierDescription').value, contact: document.getElementById('supplierContact').value, phone: document.getElementById('supplierPhone').value, email: document.getElementById('supplierEmail').value, address: document.getElementById('supplierAddress').value };
    api.updateSupplier(id, supplierData).then(() => { if (window.bootstrap) window.bootstrap.Modal.getInstance(document.getElementById('addSupplierModal')).hide(); document.getElementById('supplierForm').reset(); const label = document.getElementById('addSupplierModalLabel'); if (label) label.textContent = 'Add New Supplier'; if (typeof showNotification === 'function') showNotification('Supplier updated successfully!', 'success'); if (typeof populatePaymentVoucherDropdowns === 'function') populatePaymentVoucherDropdowns(); if (typeof populatePaymentModuleFilters === 'function') populatePaymentModuleFilters(); loadSuppliers(); }).catch(error => { console.error('Error updating supplier:', error); if (error.message && (error.message.includes('duplicate key') || error.message.includes('already exists'))) { if (typeof showNotification === 'function') showNotification('Supplier name already exists. Please use a different name.', 'error'); } else { if (typeof showNotification === 'function') showNotification('Failed to update supplier: ' + (error.message || 'Unknown error'), 'error'); } });
  }

  function deleteSupplier(id) {
    if (confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) { api.deleteSupplier(id).then(() => { if (typeof showNotification === 'function') showNotification('Supplier deleted successfully!', 'success'); if (typeof populatePaymentVoucherDropdowns === 'function') populatePaymentVoucherDropdowns(); if (typeof populatePaymentModuleFilters === 'function') populatePaymentModuleFilters(); loadSuppliers(); }).catch(error => { console.error('Error deleting supplier:', error); if (typeof showNotification === 'function') showNotification('Failed to delete supplier: ' + (error.message || 'Unknown error'), 'error'); }); }
  }

  window.saveSupplier = saveSupplier;
  window.loadSuppliers = loadSuppliers;
  window.renderSuppliers = renderSuppliers;
  window.editSupplier = editSupplier;
  window.updateSupplier = updateSupplier;
  window.deleteSupplier = deleteSupplier;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      requestAnimationFrame(initSuppliersSection);
    });
  } else {
    requestAnimationFrame(initSuppliersSection);
  }
})();
