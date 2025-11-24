(() => {
  function initializePaymentVoucherForm() {
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializePaymentVoucherForm); return; }
    const today = new Date().toISOString().split('T')[0];
    const voucherDateEl = document.getElementById('paymentVoucherDate');
    if (voucherDateEl) voucherDateEl.value = today;
    generatePaymentVoucherNumber();
    populatePaymentVoucherDropdowns();
    requestAnimationFrame(() => {
      const section = document.getElementById('payment-vouchers-section');
      if (section) { section.style.display = 'block'; section.style.visibility = 'visible'; section.style.opacity = '1'; }
      const card = section?.querySelector('.card'); if (card) { card.style.display = 'block'; card.style.visibility = 'visible'; card.style.opacity = '1'; }
      const form = section?.querySelector('#paymentVoucherForm'); if (form) { form.style.display = 'block'; form.style.visibility = 'visible'; }
      const cardBody = section?.querySelector('.card-body'); if (cardBody) { cardBody.style.display = 'block'; cardBody.style.visibility = 'visible'; }
      const header = section?.querySelector('.dashboard-header'); if (header) { header.style.display = 'block'; header.style.visibility = 'visible'; }
    });
  }

  function generatePaymentVoucherNumber() {
    const voucherNumberEl = document.getElementById('paymentVoucherNumber');
    if (!voucherNumberEl) return;
    api.getNextVoucherNumber()
      .then(response => { voucherNumberEl.value = (response && response.voucherNumber) ? response.voucherNumber : (voucherNumberEl.value || 'PV1001'); })
      .catch(() => { if (!voucherNumberEl.value) voucherNumberEl.value = 'PV1001'; });
  }

  function saveNewPaymentVoucher() {
    const voucherNumber = document.getElementById('paymentVoucherNumber').value;
    const date = document.getElementById('paymentVoucherDate').value;
    const supplierId = document.getElementById('paymentVoucherSupplier').value;
    const branchId = document.getElementById('paymentVoucherBranch').value;
    const paymentMethod = document.getElementById('paymentVoucherMethod').value;
    const amount = parseFloat(document.getElementById('paymentVoucherAmount').value);
    const description = document.getElementById('paymentVoucherDescription').value;
    if (!date || !supplierId || !branchId || !paymentMethod || !amount) { showNotification('Please fill in all required fields', 'error'); return; }
    const voucherData = { voucherNumber, voucherType: 'supplier', date, supplierId, branchId, paymentMethod, amount, description, status: 'Pending' };
    api.createPayment(voucherData)
      .then(() => { 
        showNotification('Voucher saved successfully!', 'success'); 
        resetPaymentVoucherForm(); 
        loadPaymentVoucherList(); 
        updatePaymentDashboard(); 
        // Stay on voucher form - don't navigate to list
        // showPaymentTab('payment-voucher-list'); 
      })
      .catch(error => { showNotification('Failed to save voucher: ' + (error.message || 'Unknown error'), 'error'); });
  }

  function updatePaymentVoucher(id) {
    const date = document.getElementById('paymentVoucherDate').value;
    const supplierId = document.getElementById('paymentVoucherSupplier').value;
    const branchId = document.getElementById('paymentVoucherBranch').value;
    const paymentMethod = document.getElementById('paymentVoucherMethod').value;
    const amount = parseFloat(document.getElementById('paymentVoucherAmount').value);
    const description = document.getElementById('paymentVoucherDescription').value;
    if (!date || !supplierId || !branchId || !paymentMethod || !amount) { showNotification('Please fill in all required fields', 'error'); return; }
    const voucherData = { voucherType: 'supplier', date, supplierId, branchId, paymentMethod, amount, description };
    api.updatePayment(id, voucherData)
      .then(() => { 
        showNotification('Voucher updated successfully!', 'success'); 
        document.getElementById('paymentVoucherForm').removeAttribute('data-voucher-id'); 
        resetPaymentVoucherForm(); 
        loadPaymentVoucherList(); 
        updatePaymentDashboard(); 
        // Stay on voucher form - don't navigate to list
        // showPaymentTab('payment-voucher-list'); 
      })
      .catch(() => { showNotification('Failed to update voucher', 'error'); });
  }

  function populatePaymentVoucherDropdowns() {
    if (!appData.suppliers || !Array.isArray(appData.suppliers)) return;
    const supplierSelect = document.getElementById('paymentVoucherSupplier');
    if (supplierSelect) { const firstOption = supplierSelect.options[0]; supplierSelect.innerHTML = ''; if (firstOption) supplierSelect.appendChild(firstOption); appData.suppliers.forEach(s => { const o = document.createElement('option'); o.value = s._id; o.textContent = s.name; supplierSelect.appendChild(o); }); }
    if (!appData.branches || !Array.isArray(appData.branches)) return;
    const branchSelect = document.getElementById('paymentVoucherBranch');
    if (branchSelect) { const firstOption = branchSelect.options[0]; branchSelect.innerHTML = ''; if (firstOption) branchSelect.appendChild(firstOption); appData.branches.forEach(b => { const o = document.createElement('option'); o.value = b._id; o.textContent = b.name; branchSelect.appendChild(o); }); }
    populatePaymentModuleFilters();
  }

  function populatePaymentModuleFilters() {
    const selectors = ['paymentDashboardBranchFilter','paymentDashboardSupplierFilter','paymentVoucherListBranchFilter','paymentVoucherListSupplierFilter','paymentReportBranch','paymentReportSupplier'];
    selectors.forEach(id => {
      const selector = document.getElementById(id);
      if (selector) {
        const firstOption = selector.options[0]; selector.innerHTML = ''; if (firstOption) selector.appendChild(firstOption);
        if (id.includes('Branch') && appData.branches && Array.isArray(appData.branches)) { appData.branches.forEach(b => { const o = document.createElement('option'); o.value = b._id; o.textContent = b.name; selector.appendChild(o); }); }
        else if (id.includes('Supplier') && appData.suppliers && Array.isArray(appData.suppliers)) { appData.suppliers.forEach(s => { const o = document.createElement('option'); o.value = s._id; o.textContent = s.name; selector.appendChild(o); }); }
      }
    });
  }

  function initializeCategoryVoucherForm() {
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeCategoryVoucherForm); return; }
    const today = new Date().toISOString().split('T')[0];
    const voucherDateEl = document.getElementById('categoryVoucherDate');
    if (voucherDateEl) voucherDateEl.value = today;
    generateCategoryVoucherNumber();
    populateCategoryVoucherDropdowns();
  }

  function generateCategoryVoucherNumber() {
    const voucherNumberEl = document.getElementById('categoryVoucherNumber');
    if (!voucherNumberEl) return;
    api.getNextCategoryVoucherNumber()
      .then(response => { voucherNumberEl.value = (response && response.voucherNumber) ? response.voucherNumber : (voucherNumberEl.value || 'PV1001'); })
      .catch(() => { if (!voucherNumberEl.value) voucherNumberEl.value = 'PV1001'; });
  }

  function saveNewCategoryVoucher() {
    const voucherNumber = document.getElementById('categoryVoucherNumber').value;
    const date = document.getElementById('categoryVoucherDate').value;
    const categoryId = document.getElementById('categoryVoucherCategory').value;
    const branchId = document.getElementById('categoryVoucherBranch').value;
    const paymentMethod = document.getElementById('categoryVoucherMethod').value;
    const amount = parseFloat(document.getElementById('categoryVoucherAmount').value);
    const description = document.getElementById('categoryVoucherDescription').value;
    if (!date || !categoryId || !branchId || !paymentMethod || !amount) { showNotification('Please fill in all required fields', 'error'); return; }
    const categoryName = appData.categories.find(c => c._id === categoryId)?.name || 'Category Payment';
    const voucherData = { voucherNumber, date, categoryId, category: categoryName, branchId, paymentMethod, amount, description, status: 'Pending' };
    api.createCategoryPayment(voucherData)
      .then(() => { 
        showNotification('Category voucher saved successfully!', 'success'); 
        resetCategoryVoucherForm(); 
        loadCategoryVoucherListTab(); 
        updatePaymentDashboard(); 
        // Stay on category voucher form - don't navigate to list
        // showSection('payment-voucher-list'); 
        // setTimeout(() => { const categoryTab = document.getElementById('category-voucher-list-tab'); if (categoryTab) { const bsTab = new bootstrap.Tab(categoryTab); bsTab.show(); } }, 300); 
      })
      .catch(error => { showNotification('Failed to save voucher: ' + (error.message || 'Unknown error'), 'error'); });
  }

  function updateCategoryVoucher(id) {
    const date = document.getElementById('categoryVoucherDate').value;
    const categoryId = document.getElementById('categoryVoucherCategory').value;
    const branchId = document.getElementById('categoryVoucherBranch').value;
    const paymentMethod = document.getElementById('categoryVoucherMethod').value;
    const amount = parseFloat(document.getElementById('categoryVoucherAmount').value);
    const description = document.getElementById('categoryVoucherDescription').value;
    if (!date || !categoryId || !branchId || !paymentMethod || !amount) { showNotification('Please fill in all required fields', 'error'); return; }
    const categoryName = appData.categories.find(c => c._id === categoryId)?.name || 'Category Payment';
    const voucherData = { date, categoryId, category: categoryName, branchId, paymentMethod, amount, description };
    api.updateCategoryPayment(id, voucherData)
      .then(() => { 
        showNotification('Category voucher updated successfully!', 'success'); 
        document.getElementById('categoryVoucherForm').removeAttribute('data-voucher-id'); 
        resetCategoryVoucherForm(); 
        loadCategoryVoucherListTab(); 
        updatePaymentDashboard(); 
        // Stay on category voucher form - don't navigate to list
        // showSection('payment-voucher-list'); 
        // setTimeout(() => { const categoryTab = document.getElementById('category-voucher-list-tab'); if (categoryTab) { const bsTab = new bootstrap.Tab(categoryTab); bsTab.show(); } }, 300); 
      })
      .catch(() => { showNotification('Failed to update voucher', 'error'); });
  }

  function populateCategoryVoucherDropdowns() {
    if (!appData.categories || !Array.isArray(appData.categories)) { if (api && api.getCategories) { api.getCategories().then(categories => { if (categories && Array.isArray(categories)) { appData.categories = categories; populateCategoryVoucherDropdowns(); } }).catch(() => {}); } return; }
    const categorySelect = document.getElementById('categoryVoucherCategory');
    if (categorySelect) { const firstOption = categorySelect.options[0]; categorySelect.innerHTML = ''; if (firstOption) categorySelect.appendChild(firstOption); appData.categories.forEach(c => { const o = document.createElement('option'); o.value = c._id; o.textContent = c.name; categorySelect.appendChild(o); }); }
    if (!appData.branches || !Array.isArray(appData.branches)) return;
    const branchSelect = document.getElementById('categoryVoucherBranch');
    if (branchSelect) { const firstOption = branchSelect.options[0]; branchSelect.innerHTML = ''; if (firstOption) branchSelect.appendChild(firstOption); appData.branches.forEach(b => { const o = document.createElement('option'); o.value = b._id; o.textContent = b.name; branchSelect.appendChild(o); }); }
  }

  function resetPaymentVoucherForm() {
    const form = document.getElementById('paymentVoucherForm');
    if (form) { form.reset(); generatePaymentVoucherNumber(); const today = new Date().toISOString().split('T')[0]; const voucherDateEl = document.getElementById('paymentVoucherDate'); if (voucherDateEl) voucherDateEl.value = today; }
  }

  function resetCategoryVoucherForm() {
    const form = document.getElementById('categoryVoucherForm');
    if (form) { form.reset(); generateCategoryVoucherNumber(); const today = new Date().toISOString().split('T')[0]; const voucherDateEl = document.getElementById('categoryVoucherDate'); if (voucherDateEl) voucherDateEl.value = today; }
  }

  window.initializePaymentVoucherForm = initializePaymentVoucherForm;
  window.generatePaymentVoucherNumber = generatePaymentVoucherNumber;
  window.saveNewPaymentVoucher = saveNewPaymentVoucher;
  window.updatePaymentVoucher = updatePaymentVoucher;
  window.populatePaymentVoucherDropdowns = populatePaymentVoucherDropdowns;
  window.populatePaymentModuleFilters = populatePaymentModuleFilters;
  window.initializeCategoryVoucherForm = initializeCategoryVoucherForm;
  window.generateCategoryVoucherNumber = generateCategoryVoucherNumber;
  window.saveNewCategoryVoucher = saveNewCategoryVoucher;
  window.updateCategoryVoucher = updateCategoryVoucher;
  window.populateCategoryVoucherDropdowns = populateCategoryVoucherDropdowns;
  window.resetPaymentVoucherForm = resetPaymentVoucherForm;
  window.resetCategoryVoucherForm = resetCategoryVoucherForm;

  const supplierTab = document.getElementById('supplier-voucher-tab');
  if (supplierTab) supplierTab.addEventListener('shown.bs.tab', function() { if (typeof initializePaymentVoucherForm === 'function') initializePaymentVoucherForm(); });
  const categoryTab = document.getElementById('category-voucher-tab');
  if (categoryTab) categoryTab.addEventListener('shown.bs.tab', function() { if (typeof initializeCategoryVoucherForm === 'function') initializeCategoryVoucherForm(); });

  const supplierForm = document.getElementById('paymentVoucherForm');
  if (supplierForm) supplierForm.addEventListener('submit', function(e){ e.preventDefault(); const id = this.getAttribute('data-voucher-id'); if (id) updatePaymentVoucher(id); else saveNewPaymentVoucher(); });
  const categoryForm = document.getElementById('categoryVoucherForm');
  if (categoryForm) categoryForm.addEventListener('submit', function(e){ e.preventDefault(); const id = this.getAttribute('data-voucher-id'); if (id) updateCategoryVoucher(id); else saveNewCategoryVoucher(); });

  initializePaymentVoucherForm();
})();
