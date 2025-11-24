;(function() {
  function initBranchesSection() {
    const addBtn = document.getElementById('addBranchBtn');
    if (addBtn) {
      const newBtn = addBtn.cloneNode(true);
      addBtn.parentNode.replaceChild(newBtn, addBtn);
      newBtn.addEventListener('click', function() {
        const form = document.getElementById('branchForm');
        if (form) form.reset();

        const saveBtn = document.getElementById('saveBranchBtn');
        if (saveBtn) {
          saveBtn.textContent = 'Save Branch';
          saveBtn.onclick = null;
          saveBtn.removeAttribute('onclick');
          saveBtn.onclick = function() {
            const formEl = document.getElementById('branchForm');
            if (formEl && formEl.checkValidity()) {
              if (typeof window.saveBranch === 'function') {
                window.saveBranch();
              } else {
                // Fallback if saveBranch not on window
                if (typeof saveBranch === 'function') saveBranch();
              }
            } else if (formEl) {
              formEl.reportValidity();
            }
          };
        }

        const modalEl = document.getElementById('addBranchModal');
        if (modalEl) {
          if (window.bootstrap && typeof window.bootstrap.Modal === 'function') {
            try {
              // Hide any existing modal instances first
              const existingModal = window.bootstrap.Modal.getInstance(modalEl);
              if (existingModal) {
                existingModal.hide();
              }
              // Create and show new modal
              const modal = new window.bootstrap.Modal(modalEl);
              modal.show();
            } catch (error) {
              console.error('Error showing branch modal:', error);
              // Fallback: manually show modal
              modalEl.style.display = 'block';
              modalEl.classList.add('show');
              modalEl.setAttribute('aria-hidden', 'false');
              document.body.classList.add('modal-open');
              const backdrop = document.createElement('div');
              backdrop.className = 'modal-backdrop fade show';
              backdrop.id = 'branchModalBackdrop';
              document.body.appendChild(backdrop);
            }
          } else {
            console.warn('Bootstrap not available, using fallback modal display');
            // Fallback: manually show modal
            modalEl.style.display = 'block';
            modalEl.classList.add('show');
            modalEl.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.id = 'branchModalBackdrop';
            document.body.appendChild(backdrop);
          }
        } else {
          console.error('Add Branch Modal element not found');
          if (typeof window.showNotification === 'function') {
            window.showNotification('Branch modal not found', 'error');
          }
        }
      });
    }

    const cardBtn = document.getElementById('branchCardViewBtn');
    const tableBtn = document.getElementById('branchTableViewBtn');
    const cardView = document.getElementById('branchCardView');
    const tableView = document.getElementById('branchTableView');
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
  }

  function loadBranches() {
    api.getBranches().then(function(branchesData){ appData.branches = branchesData; renderBranches(branchesData); }).catch(function(error){ console.error('Error loading branches:', error); if (typeof showNotification === 'function') showNotification('Failed to load branches', 'error'); });
  }

  function renderBranches(branchesData) {
    var sortedBranches = branchesData.slice().sort(function(a,b){ return new Date(a.createdAt) - new Date(b.createdAt); });
    var cardContainer = document.getElementById('branchesContainer'); if (cardContainer) { cardContainer.innerHTML = ''; sortedBranches.forEach(function(branch, index){ var card = document.createElement('div'); card.className = 'col-md-4 mb-3'; var branchNumber = index + 1; var fullId = branch._id; card.innerHTML = '<div class="card branch-card h-100"><div class="card-body"><div class="d-flex justify-content-between align-items-start mb-2"><h5 class="card-title mb-0">' + branch.name + '</h5><span class="badge bg-primary">#' + branchNumber + '</span></div><div class="mb-2"><small class="text-muted">ID: ' + fullId + '</small></div><p class="card-text"><i class="fas fa-map-marker-alt me-2"></i>' + (branch.address || 'N/A') + '<br><i class="fas fa-phone me-2"></i>' + (branch.phone || 'N/A') + '<br><i class="fas fa-envelope me-2"></i>' + (branch.email || 'N/A') + '</p><div class="d-flex justify-content-between"><button class="btn btn-sm btn-outline-primary" onclick="editBranch(\'' + branch._id + '\')"><i class="fas fa-edit"></i> Edit</button><button class="btn btn-sm btn-outline-danger" onclick="deleteBranch(\'' + branch._id + '\')"><i class="fas fa-trash"></i> Delete</button></div></div></div>'; cardContainer.appendChild(card); }); }
    var tableBody = document.getElementById('branchesTableBody'); if (tableBody) { tableBody.innerHTML = ''; sortedBranches.forEach(function(branch, index){ var row = document.createElement('tr'); var createdDate = new Date(branch.createdAt).toLocaleDateString(); var branchNumber = index + 1; var fullId = branch._id; row.innerHTML = '<td><div class="d-flex align-items-center"><span class="badge bg-primary me-2">#' + branchNumber + '</span><strong>' + branch.name + '</strong></div><small class="text-muted">ID: ' + fullId + '</small></td><td>' + (branch.address || 'N/A') + '</td><td>' + (branch.phone || 'N/A') + '</td><td>' + (branch.email || 'N/A') + '</td><td>' + createdDate + '</td><td><button class="btn btn-sm btn-outline-primary me-2" onclick="editBranch(\'' + branch._id + '\')"><i class="fas fa-edit"></i> Edit</button><button class="btn btn-sm btn-outline-danger" onclick="deleteBranch(\'' + branch._id + '\')"><i class="fas fa-trash"></i> Delete</button></td>'; tableBody.appendChild(row); }); }
  }

  function saveBranch() {
    var branchData = { name: document.getElementById('branchName').value.trim(), address: document.getElementById('branchAddress').value, phone: document.getElementById('branchPhone').value, email: document.getElementById('branchEmail').value };
    api.createBranch(branchData).then(function(){ if (window.bootstrap) window.bootstrap.Modal.getInstance(document.getElementById('addBranchModal')).hide(); document.getElementById('branchForm').reset(); if (typeof showNotification === 'function') showNotification('Branch saved successfully!', 'success'); if (typeof populateBranchSelectors === 'function') populateBranchSelectors(); loadBranches(); if (typeof loadDashboard === 'function') loadDashboard(); }).catch(function(error){ console.error('Error saving branch:', error); if (typeof showNotification === 'function') showNotification('Failed to save branch', 'error'); });
  }

  function editBranch(id) {
    api.getBranches().then(function(branchesData){ var branch = branchesData.find(function(b){ return b._id === id; }); if (branch) { document.getElementById('branchName').value = branch.name; document.getElementById('branchAddress').value = branch.address || ''; document.getElementById('branchPhone').value = branch.phone || ''; document.getElementById('branchEmail').value = branch.email || ''; var saveBtn = document.getElementById('saveBranchBtn'); if (saveBtn) { saveBtn.textContent = 'Update Branch'; saveBtn.onclick = function(){ var formEl = document.getElementById('branchForm'); if (formEl && formEl.checkValidity()) { updateBranch(id); } else { formEl.reportValidity(); } }; } if (window.bootstrap) { var modal = new window.bootstrap.Modal(document.getElementById('addBranchModal')); modal.show(); } } }).catch(function(error){ console.error('Error fetching branch data:', error); if (typeof showNotification === 'function') showNotification('Failed to load branch data', 'error'); });
  }

  function updateBranch(id) {
    var branchData = { name: document.getElementById('branchName').value, address: document.getElementById('branchAddress').value, phone: document.getElementById('branchPhone').value, email: document.getElementById('branchEmail').value };
    api.updateBranch(id, branchData).then(function(){ if (window.bootstrap) window.bootstrap.Modal.getInstance(document.getElementById('addBranchModal')).hide(); document.getElementById('branchForm').reset(); var saveBtn = document.getElementById('saveBranchBtn'); if (saveBtn) { saveBtn.textContent = 'Save Branch'; saveBtn.onclick = saveBranch; } if (typeof showNotification === 'function') showNotification('Branch updated successfully!', 'success'); if (typeof populateBranchSelectors === 'function') populateBranchSelectors(); loadBranches(); if (typeof loadDashboard === 'function') loadDashboard(); }).catch(function(error){ console.error('Error updating branch:', error); if (typeof showNotification === 'function') showNotification('Failed to update branch', 'error'); });
  }

  function deleteBranch(id) {
    if (confirm('Are you sure you want to delete this branch? This will also delete all sales data for this branch.')) { api.deleteBranch(id).then(function(){ if (typeof showNotification === 'function') showNotification('Branch deleted successfully!', 'success'); if (typeof populateBranchSelectors === 'function') populateBranchSelectors(); loadBranches(); if (typeof loadDashboard === 'function') loadDashboard(); }).catch(function(error){ console.error('Error deleting branch:', error); if (typeof showNotification === 'function') showNotification('Failed to delete branch', 'error'); }); }
  }

  window.loadBranches = loadBranches;
  window.renderBranches = renderBranches;
  window.saveBranch = saveBranch;
  window.editBranch = editBranch;
  window.updateBranch = updateBranch;
  window.deleteBranch = deleteBranch;

  // Listen for sectionLoaded event to initialize when section is loaded dynamically
  document.addEventListener('sectionLoaded', function(e) {
    if (e && e.detail && e.detail.sectionName === 'branches') {
      setTimeout(initBranchesSection, 0);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      requestAnimationFrame(initBranchesSection);
    });
  } else {
    requestAnimationFrame(initBranchesSection);
  }
})();
