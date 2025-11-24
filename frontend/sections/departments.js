;(function(){
  function initDepartmentsSection(){
    var section = document.getElementById('departments-section');
    if (!section) return;
    if (typeof window.loadDepartmentBranches === 'function') window.loadDepartmentBranches();
    var branchFilter = document.getElementById('departmentBranchFilter');
    if (branchFilter){
      var newFilter = branchFilter.cloneNode(true);
      branchFilter.parentNode.replaceChild(newFilter, branchFilter);
      newFilter.addEventListener('change', function(){
        if (typeof window.loadDepartments === 'function') window.loadDepartments(this.value);
      });
      if (newFilter.value){
        if (typeof window.loadDepartments === 'function') window.loadDepartments(newFilter.value);
      }
    }
    
    // Setup Add Department button event handler
    var addDepartmentBtn = document.getElementById('addDepartmentBtn');
    if (addDepartmentBtn) {
      // Clone and replace to avoid duplicate event listeners
      var newAddBtn = addDepartmentBtn.cloneNode(true);
      addDepartmentBtn.parentNode.replaceChild(newAddBtn, addDepartmentBtn);
      
      newAddBtn.addEventListener('click', function() {
        // Get the selected branch from the filter dropdown
        var selectedBranchId = null;
        var branchFilter = document.getElementById('departmentBranchFilter');
        if (branchFilter && branchFilter.value) {
          selectedBranchId = branchFilter.value;
        }
        
        // Reset form
        var form = document.getElementById('departmentForm');
        if (form) form.reset();
        
        // Set modal label
        var modalLabel = document.getElementById('addDepartmentModalLabel');
        if (modalLabel) modalLabel.textContent = 'Add New Department';
        
        // Set save button
        var saveBtn = document.getElementById('saveDepartmentBtn');
        if (saveBtn) {
          saveBtn.textContent = 'Save Department';
          // Try window.saveDepartment first, then just saveDepartment (global scope)
          var saveDeptFunc = (typeof window.saveDepartment === 'function') ? window.saveDepartment : 
                             (typeof saveDepartment === 'function') ? saveDepartment : null;
          if (saveDeptFunc) {
            saveBtn.onclick = saveDeptFunc;
          } else {
            console.warn('saveDepartment function not found');
          }
        }
        
        // Function to set the selected branch in the modal
        var setSelectedBranch = function(branchSelectElement, branchId) {
          if (!branchSelectElement || !branchId) return;
          
          // Check if the branch option exists in the dropdown
          var optionExists = Array.from(branchSelectElement.options).some(function(option) {
            return option.value === branchId;
          });
          
          if (optionExists) {
            branchSelectElement.value = branchId;
            // Trigger change event in case any other handlers are listening
            branchSelectElement.dispatchEvent(new Event('change', { bubbles: true }));
          }
        };
        
        // Load branches if not already loaded, then set the selected branch
        var branchSelect = document.getElementById('departmentBranchId');
        if (branchSelect) {
          // Check if branches need to be loaded
          if (branchSelect.options.length <= 1) {
            if (typeof window.loadDepartmentBranches === 'function') {
              window.loadDepartmentBranches();
            }
          }
          
          // Try to set the branch immediately if it's already loaded
          if (selectedBranchId) {
            setSelectedBranch(branchSelect, selectedBranchId);
          }
        }
        
        // Show the modal
        var modalElement = document.getElementById('addDepartmentModal');
        if (modalElement && typeof window.bootstrap !== 'undefined') {
          var modal = new window.bootstrap.Modal(modalElement);
          
          // Function to ensure branch is selected after modal is fully shown
          var ensureBranchSelected = function() {
            var branchSelectEl = document.getElementById('departmentBranchId');
            if (selectedBranchId && branchSelectEl) {
              // Try multiple times to handle async branch loading
              var attempts = 0;
              var maxAttempts = 10;
              
              var trySetBranch = function() {
                attempts++;
                var optionExists = Array.from(branchSelectEl.options).some(function(option) {
                  return option.value === selectedBranchId;
                });
                
                if (optionExists) {
                  branchSelectEl.value = selectedBranchId;
                  branchSelectEl.dispatchEvent(new Event('change', { bubbles: true }));
                } else if (attempts < maxAttempts) {
                  // Retry after a short delay if branch not loaded yet
                  setTimeout(trySetBranch, 100);
                }
              };
              
              trySetBranch();
            }
          };
          
          // Set branch when modal is shown
          modalElement.addEventListener('shown.bs.modal', function onModalShown() {
            ensureBranchSelected();
            // Remove the event listener after first use
            modalElement.removeEventListener('shown.bs.modal', onModalShown);
          });
          
          modal.show();
        } else if (modalElement) {
          console.error('Bootstrap not available or modal element not found');
        } else {
          console.error('Add Department Modal not found');
        }
      });
    }
    
    // Setup form submit handler
    var departmentForm = document.getElementById('departmentForm');
    if (departmentForm) {
      var newForm = departmentForm.cloneNode(true);
      departmentForm.parentNode.replaceChild(newForm, departmentForm);
      
      newForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (this.checkValidity()) {
          // Try window.saveDepartment first, then just saveDepartment (global scope)
          var saveDeptFunc = (typeof window.saveDepartment === 'function') ? window.saveDepartment : 
                             (typeof saveDepartment === 'function') ? saveDepartment : null;
          if (saveDeptFunc) {
            saveDeptFunc();
          } else {
            console.error('saveDepartment function not found');
            if (typeof window.showNotification === 'function') {
              window.showNotification('Save function not available', 'error');
            }
          }
        } else {
          this.reportValidity();
        }
      });
    }
  }

  document.addEventListener('sectionLoaded', function(e){
    if (e && e.detail && e.detail.sectionName === 'departments'){
      setTimeout(initDepartmentsSection, 0);
    }
  });

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      requestAnimationFrame(initDepartmentsSection);
    });
  } else {
    requestAnimationFrame(initDepartmentsSection);
  }
})();
