;(function() {
  // Ensure shared appData exists before using it anywhere in this module
  if (!window.appData) {
    window.appData = {
      branches: [],
      categories: [],
      departments: [],
      sales: [],
      currentUser: {}
    };
  }
  const appData = window.appData;
  // Try to expose api to window if it exists but isn't exposed
  function tryExposeAPI() {
    try {
      // Check if api exists in closure but not on window
      if (typeof api !== 'undefined' && typeof api.getBranches === 'function' && !window.api) {
        window.api = api;
        console.log('✅ Exposed api to window.api from closure');
        return true;
      }
      // Check if APIService class exists and we can create an instance
      if (typeof APIService !== 'undefined' && !window.api) {
        window.api = new APIService();
        console.log('✅ Created new APIService instance for window.api');
        return true;
      }
      // Check if window.api is already set (from index.html)
      if (window.api && typeof window.api.getBranches === 'function') {
        console.log('✅ window.api is already available');
        return true;
      }
    } catch(e) {
      // Silently fail, api might not be in scope
    }
    return false;
  }
  
  // Try immediately and log status
  console.log('🔍 Checking for window.api on sales.js load...', {
    'window.api exists': !!window.api,
    'typeof api': typeof api,
    'window.APIService': typeof window.APIService
  });
  
  if (tryExposeAPI()) {
    console.log('✅ window.api is ready');
  } else {
    console.log('⏳ window.api not ready yet, will retry...');
  }
  
  // Also try after delays (in case scripts load in order)
  setTimeout(function() {
    if (tryExposeAPI()) console.log('✅ window.api ready after 100ms');
  }, 100);
  setTimeout(function() {
    if (tryExposeAPI()) console.log('✅ window.api ready after 500ms');
  }, 500);
  setTimeout(function() {
    if (tryExposeAPI()) console.log('✅ window.api ready after 1000ms');
  }, 1000);
  
  // Helper function to wait for window.api to be available
  function waitForAPI(callback, retryCount = 0, maxRetries = 50, delay = 100) {
    // Try to expose api on each retry
    if (retryCount % 5 === 0) {
      tryExposeAPI();
    }
    
    // Check if window.api is available
    if (window.api && typeof window.api.getBranches === 'function') {
      console.log('✅ window.api confirmed available, executing callback');
      callback();
      return;
    }
    
    if (retryCount < maxRetries) {
      setTimeout(function() {
        waitForAPI(callback, retryCount + 1, maxRetries, delay);
      }, delay);
    } else {
      console.error('❌ window.api not available after', maxRetries, 'retries');
      console.error('❌ Debug info:', {
        'window.api': !!window.api,
        'window.api type': typeof window.api,
        'window.api.getBranches': window.api ? typeof window.api.getBranches : 'N/A',
        'typeof api': typeof api,
        'window.APIService': typeof window.APIService,
        'window.appData': !!window.appData
      });
      // Don't call callback if API is not available
    }
  }

  function initSalesSection() {
    const section = document.getElementById('sales-section');
    if (!section) return;
    
    // Set current date for Warehouse Sale entry form
    const saleDate = document.getElementById('saleDate');
    if (saleDate && !saleDate.value) saleDate.value = new Date().toISOString().split('T')[0];
    
    // Set current date for Shop Sale entry form
    const bulkDeptSaleDateField = document.getElementById('bulkDeptSaleDateTab2');
    if (bulkDeptSaleDateField && !bulkDeptSaleDateField.value) {
      const today = new Date().toISOString().split('T')[0];
      bulkDeptSaleDateField.value = today;
      console.log('📅 Initialized Shop Sale date in initSalesSection:', today);
    }

    populateSaleBranch();
    if (typeof window.generateCategoryInputs === 'function') window.generateCategoryInputs();
    
    // Ensure button visibility is set correctly on initial load
    setTimeout(function() {
      const deptTabContent = document.getElementById('department-sales-content');
      const categoryTabContent = document.getElementById('category-sales-content');
      const viewDeptSalesListBtn = document.getElementById('viewDeptSalesListBtn');
      const viewSalesListBtn = document.getElementById('viewSalesListBtn');
      
      if (deptTabContent && (deptTabContent.classList.contains('active') || deptTabContent.classList.contains('show'))) {
        // Shop Sale tab is active
        if (viewDeptSalesListBtn) {
          viewDeptSalesListBtn.style.display = 'block';
          console.log('✅ View Department Sales List button shown (Shop Sale tab active)');
        }
        if (viewSalesListBtn) {
          viewSalesListBtn.style.display = 'none';
        }
      } else if (categoryTabContent && (categoryTabContent.classList.contains('active') || categoryTabContent.classList.contains('show'))) {
        // Warehouse Sale tab is active
        if (viewSalesListBtn) {
          viewSalesListBtn.style.display = 'block';
        }
        if (viewDeptSalesListBtn) {
          viewDeptSalesListBtn.style.display = 'none';
        }
      } else {
        // Default: show Warehouse Sale button, hide Shop Sale button
        if (viewSalesListBtn) {
          viewSalesListBtn.style.display = 'block';
        }
        if (viewDeptSalesListBtn) {
          viewDeptSalesListBtn.style.display = 'none';
        }
      }
    }, 100);
    
    // Check if Shop Sale tab is active and load departments if branch is already selected
    // Use a retry mechanism to wait for elements and API to be ready
    function checkAndLoadDepartments(retryCount = 0) {
      const maxRetries = 10;
      const retryDelay = 200;
      
      if (!window.api) {
        if (retryCount < maxRetries) {
          setTimeout(function() {
            checkAndLoadDepartments(retryCount + 1);
          }, retryDelay);
          return;
        }
        return;
      }
      
      const deptTab = document.getElementById('department-tab');
      const branchSelect = document.getElementById('bulkDeptSaleBranchTab2');
      const deptTabContent = document.getElementById('department-sales-content');
      
      if (deptTab && branchSelect && deptTabContent) {
        const isActive = deptTab.classList.contains('active') || 
                        deptTab.getAttribute('aria-selected') === 'true' ||
                        deptTabContent.classList.contains('active') ||
                        deptTabContent.classList.contains('show');
        
        if (isActive && branchSelect.value && branchSelect.value !== '') {
          console.log('🔄 Shop Sale tab is active with branch selected, loading departments...');
          loadDepartmentsForBulkSalesTab2();
        }
      } else if (retryCount < maxRetries) {
        setTimeout(function() {
          checkAndLoadDepartments(retryCount + 1);
        }, retryDelay);
      }
    }
    
    setTimeout(function() {
      checkAndLoadDepartments();
    }, 500);

    if (typeof window.__savingSales === 'undefined') {
      window.__savingSales = false;
    }

    const saveBtn = document.getElementById('saveSalesButton') || document.querySelector('#salesEntryForm button[type="submit"]');
    if (saveBtn) {
      const newBtn = saveBtn.cloneNode(true);
      saveBtn.parentNode.replaceChild(newBtn, saveBtn);
      newBtn.addEventListener('click', function(e){
        e.preventDefault();
        if (window.__savingSales) { if (typeof showNotification === 'function') showNotification('Already saving...', 'info'); return; }
        if (typeof window.saveSalesEntry === 'function') window.saveSalesEntry();
      });
    }

    const salesEntryForm = document.getElementById('salesEntryForm');
    if (salesEntryForm) {
      const newForm = salesEntryForm.cloneNode(true);
      salesEntryForm.parentNode.replaceChild(newForm, salesEntryForm);
      newForm.addEventListener('submit', function(e){ e.preventDefault(); });
    }

    const resetBtn = document.getElementById('resetSalesForm');
    if (resetBtn) {
      const newReset = resetBtn.cloneNode(true);
      resetBtn.parentNode.replaceChild(newReset, resetBtn);
      newReset.addEventListener('click', function(){
        const form = document.getElementById('salesEntryForm');
        if (form) form.reset();
        const ts = document.getElementById('totalSales'); if (ts) ts.value = '';
        const tc = document.getElementById('totalCost'); if (tc) tc.value = '';
        const tp = document.getElementById('totalProfit'); if (tp) tp.value = '';
        if (saleDate) saleDate.value = new Date().toISOString().split('T')[0];
      });
    }

    if (!window.__salesSaveDelegated) {
      document.addEventListener('click', function(e){
        var btn = e.target.closest('#sales-section #salesEntryForm button.btn-primary, #sales-section #saveSalesButton');
        if (btn) {
          e.preventDefault();
          if (window.__savingSales) { if (typeof showNotification === 'function') showNotification('Already saving...', 'info'); return; }
          if (typeof window.saveSalesEntry === 'function') window.saveSalesEntry();
        }
      });
      window.__salesSaveDelegated = true;
    }
    if (!window.__deptListDelegated) {
      document.addEventListener('click', function(e){
        var openBtn = e.target.closest('#viewDeptSalesListBtn');
        if (openBtn) {
          var s = document.getElementById('deptSalesListSection');
          var card = document.querySelector('#sales-section > .card');
          if (s) { s.style.display = 'block'; s.classList.add('full-page'); }
          document.body.classList.add('full-page-active');
          if (card && !card.closest('#deptSalesListSection')) { card.classList.add('sales-entry-hidden'); }
          
          // Load departments if branch is already selected
          setTimeout(function() {
            const branchSelect = document.getElementById('deptSalesListBranch');
            const branchId = branchSelect ? (branchSelect.value || '').trim() : '';
            
            if (branchId && branchId !== '') {
              // Try to use the function from index.html first, if available
              if (typeof window.loadDepartmentsForDeptSalesList === 'function') {
                window.loadDepartmentsForDeptSalesList();
              } else if (typeof loadDepartmentsForDeptSalesList === 'function') {
                loadDepartmentsForDeptSalesList();
              } else if (typeof loadDepartmentsForDeptSalesListFilter === 'function') {
                loadDepartmentsForDeptSalesListFilter(branchId);
              }
            }
            
            // Load the sales list
            if (typeof window.loadDeptSalesList === 'function') window.loadDeptSalesList();
          }, 100);
        }
        var backBtn = e.target.closest('#backToDeptSalesBtn');
        if (backBtn) {
          var s2 = document.getElementById('deptSalesListSection');
          var card2 = document.querySelector('#sales-section > .card');
          if (s2) { s2.style.display = 'none'; s2.classList.remove('full-page'); }
          document.body.classList.remove('full-page-active');
          if (card2 && !card2.closest('#deptSalesListSection')) { card2.classList.remove('sales-entry-hidden'); }
        }
        var hideBtn = e.target.closest('#hideDeptSalesListBtn');
        if (hideBtn) {
          var s3 = document.getElementById('deptSalesListSection');
          var card3 = document.querySelector('#sales-section > .card');
          if (s3) { s3.style.display = 'none'; s3.classList.remove('full-page'); }
          document.body.classList.remove('full-page-active');
          if (card3 && !card3.closest('#deptSalesListSection')) { card3.classList.remove('sales-entry-hidden'); }
        }
        var filterBtn = e.target.closest('#filterDeptSalesList');
        if (filterBtn) {
          if (typeof window.loadDeptSalesList === 'function') window.loadDeptSalesList();
        }
      });
      window.__deptListDelegated = true;
    }

    bindShopSaleEvents();
    const dateFrom = document.getElementById('deptSalesListDateFrom');
    const dateTo = document.getElementById('deptSalesListDateTo');
    const today = new Date().toISOString().split('T')[0];
    if (dateFrom && !dateFrom.value) dateFrom.value = today;
    if (dateTo && !dateTo.value) dateTo.value = today;
    const branchFilter = document.getElementById('deptSalesListBranch');
    if (branchFilter) {
      const newBranch = branchFilter.cloneNode(true);
      branchFilter.parentNode.replaceChild(newBranch, branchFilter);
      newBranch.addEventListener('change', function() {
        const branchId = this.value || '';
        
        // First load departments for the selected branch in the filter
        if (branchId && branchId !== '') {
          // Try to use the function from index.html first, if available
          if (typeof window.loadDepartmentsForDeptSalesList === 'function') {
            console.log('✅ Using window.loadDepartmentsForDeptSalesList()');
            window.loadDepartmentsForDeptSalesList();
          } else if (typeof loadDepartmentsForDeptSalesList === 'function') {
            console.log('✅ Using loadDepartmentsForDeptSalesList()');
            loadDepartmentsForDeptSalesList();
          } else {
            // Fallback to our local function
            console.log('✅ Using fallback loadDepartmentsForDeptSalesListFilter()');
            loadDepartmentsForDeptSalesListFilter(branchId);
          }
        } else {
          // Clear departments if no branch selected
          const departmentSelect = document.getElementById('deptSalesListDepartment');
          if (departmentSelect) {
            departmentSelect.innerHTML = '<option value="">All Departments</option>';
            departmentSelect.disabled = false;
          }
        }
        
        // Then load the sales list after a short delay to allow departments to populate
        setTimeout(function() {
          if (typeof window.loadDeptSalesList === 'function') window.loadDeptSalesList();
          else if (typeof loadDeptSalesList === 'function') loadDeptSalesList();
        }, 300);
      });
    }
    var hasTokenInit = !!localStorage.getItem('authToken');
    if (hasTokenInit) {
      if (typeof window.loadDeptSalesList === 'function') window.loadDeptSalesList();
      else if (typeof loadDeptSalesList === 'function') loadDeptSalesList();
    }
  }

  document.addEventListener('sectionLoaded', function(e){
    if (e && e.detail && e.detail.sectionName === 'sales') {
      setTimeout(initSalesSection, 0);
    }
  });

  function populateSaleBranch(){
    var select = document.getElementById('saleBranch');
    if (!select) return;
    var setOptions = function(branches){
      select.innerHTML = '<option value="" selected disabled>Select Branch</option>' +
        (branches || []).map(function(b){ return '<option value="' + b._id + '">' + (b.name || 'Branch') + '</option>'; }).join('');
    };
    if (window.appData && Array.isArray(appData.branches) && appData.branches.length){
      setOptions(appData.branches);
    } else if (window.api && typeof window.api.getBranches === 'function'){
      var hasToken = !!localStorage.getItem('authToken');
      if (!hasToken) { setOptions([]); return; }
      window.api.getBranches().then(function(branches){
        if (window.appData) appData.branches = branches;
        setOptions(branches);
      }).catch(function(){ setOptions([]); });
    }
  }

  function bindShopSaleEvents(){
    // Use a helper function to safely get elements and bind events
    function safeBindShopSaleEvents(retryCount = 0) {
      const maxRetries = 10;
      const retryDelay = 100;
      
      const deptTab = document.getElementById('department-tab');
      const branchSelect = document.getElementById('bulkDeptSaleBranchTab2');
      
      if (!deptTab || !branchSelect) {
        if (retryCount < maxRetries) {
          setTimeout(function() {
            safeBindShopSaleEvents(retryCount + 1);
          }, retryDelay);
          return;
        } else {
          console.warn('⚠️ Shop Sale elements not found, events may not be bound');
          return;
        }
      }
      
      // Bind tab show event
      if (deptTab) {
        deptTab.addEventListener('shown.bs.tab', function(){
          console.log('🔄 Shop Sale tab shown, loading branches and departments...');
          
          // Set current date for Shop Sale entry form
          const bulkDeptSaleDateField = document.getElementById('bulkDeptSaleDateTab2');
          if (bulkDeptSaleDateField) {
            const today = new Date().toISOString().split('T')[0];
            bulkDeptSaleDateField.value = today;
            console.log('📅 Set Shop Sale date to current date:', today);
          }
          
          // Show the View Department Sales List button
          const viewDeptSalesListBtn = document.getElementById('viewDeptSalesListBtn');
          if (viewDeptSalesListBtn) {
            viewDeptSalesListBtn.style.display = 'block';
            console.log('✅ View Department Sales List button shown');
          }
          
          // Hide the View Sales List button (for Warehouse Sale tab)
          const viewSalesListBtn = document.getElementById('viewSalesListBtn');
          if (viewSalesListBtn) {
            viewSalesListBtn.style.display = 'none';
          }
          
          // Wait a bit for tab animation, then load
          setTimeout(function() {
            loadBranchesForBulkSalesTab2();
            // Wait for branches to load, then load departments
            setTimeout(function() {
              const branchSelect = document.getElementById('bulkDeptSaleBranchTab2');
              if (branchSelect && branchSelect.value) {
                console.log('✅ Branch already selected, loading departments...');
                loadDepartmentsForBulkSalesTab2();
              }
            }, 300);
          }, 100);
        });
        
        // Also handle when tab is initially active (on page load)
        const deptTabContent = document.getElementById('department-sales-content');
        if (deptTabContent && (deptTabContent.classList.contains('active') || deptTabContent.classList.contains('show'))) {
          // Set current date for Shop Sale entry form on initial load
          const bulkDeptSaleDateField = document.getElementById('bulkDeptSaleDateTab2');
          if (bulkDeptSaleDateField && !bulkDeptSaleDateField.value) {
            const today = new Date().toISOString().split('T')[0];
            bulkDeptSaleDateField.value = today;
            console.log('📅 Initialized Shop Sale date on page load:', today);
          }
          
          const viewDeptSalesListBtn = document.getElementById('viewDeptSalesListBtn');
          if (viewDeptSalesListBtn) {
            viewDeptSalesListBtn.style.display = 'block';
          }
          const viewSalesListBtn = document.getElementById('viewSalesListBtn');
          if (viewSalesListBtn) {
            viewSalesListBtn.style.display = 'none';
          }
        }
      }
      
      // Also handle Warehouse Sale tab to show/hide buttons correctly
      const categoryTab = document.getElementById('category-tab');
      if (categoryTab) {
        categoryTab.addEventListener('shown.bs.tab', function(){
          // Show the View Sales List button (for Warehouse Sale tab)
          const viewSalesListBtn = document.getElementById('viewSalesListBtn');
          if (viewSalesListBtn) {
            viewSalesListBtn.style.display = 'block';
          }
          
          // Hide the View Department Sales List button
          const viewDeptSalesListBtn = document.getElementById('viewDeptSalesListBtn');
          if (viewDeptSalesListBtn) {
            viewDeptSalesListBtn.style.display = 'none';
          }
        });
        
        // Check if Warehouse Sale tab is initially active
        const categoryTabContent = document.getElementById('category-sales-content');
        if (categoryTabContent && (categoryTabContent.classList.contains('active') || categoryTabContent.classList.contains('show'))) {
          const viewSalesListBtn = document.getElementById('viewSalesListBtn');
          if (viewSalesListBtn) {
            viewSalesListBtn.style.display = 'block';
          }
          const viewDeptSalesListBtn = document.getElementById('viewDeptSalesListBtn');
          if (viewDeptSalesListBtn) {
            viewDeptSalesListBtn.style.display = 'none';
          }
        }
      }
      
      // Bind branch change event - use delegation to avoid cloning issues
      if (branchSelect) {
        // Remove any existing event listeners by cloning
        const newBranch = branchSelect.cloneNode(true);
        branchSelect.parentNode.replaceChild(newBranch, branchSelect);
        
        // Add change event handler with proper debouncing and error handling
        let loadTimeout = null;
        newBranch.addEventListener('change', function(){
          console.log('🔄 Branch selection changed:', this.value);
          
          // Clear any pending load
          if (loadTimeout) clearTimeout(loadTimeout);
          
          // Debounce the department load to avoid rapid-fire calls
          loadTimeout = setTimeout(function() {
            const currentBranchId = newBranch.value;
            if (currentBranchId && currentBranchId.trim() !== '') {
              console.log('🔄 Loading departments for branch:', currentBranchId);
              loadDepartmentsForBulkSalesTab2();
            } else {
              // Clear departments if no branch selected
              const departmentSelect = document.getElementById('bulkDeptSaleDepartmentTab2');
              const container = document.getElementById('bulkSubDepartmentsContainerTab2');
              if (departmentSelect) {
                departmentSelect.innerHTML = '<option value="" selected disabled>Select Department</option>';
                departmentSelect.disabled = false;
              }
              if (container) {
                container.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>Please select a branch and department to load sub-departments</div>';
              }
            }
          }, 100);
        });
        
        // Only load branches if tab is active or will be active
        const deptTabContent = document.getElementById('department-sales-content');
        if (deptTabContent && (deptTabContent.classList.contains('active') || deptTabContent.classList.contains('show'))) {
          // Load branches if tab is already active
          loadBranchesForBulkSalesTab2();
        }
      }
    }
    
    // Start binding with retry mechanism
    safeBindShopSaleEvents();
    const deptSelect = document.getElementById('bulkDeptSaleDepartmentTab2');
    if (deptSelect) {
      const newDept = deptSelect.cloneNode(true);
      deptSelect.parentNode.replaceChild(newDept, deptSelect);
      newDept.addEventListener('change', function(){
        console.log('🔄 Department changed, current value:', newDept.value);
        try {
          localStorage.setItem('shopSale.departmentId', newDept.value || '');
          const txt = newDept.options[newDept.selectedIndex] ? newDept.options[newDept.selectedIndex].text : '';
          localStorage.setItem('shopSale.departmentName', txt || '');
        } catch(e) {}
        loadSubDepartmentsForBulkSalesTab2();
      });
    }
    if (!window.__deptChangeDelegated) {
      document.addEventListener('change', function(e){
        if (e.target && e.target.id === 'bulkDeptSaleDepartmentTab2') {
          loadSubDepartmentsForBulkSalesTab2();
        }
      });
      window.__deptChangeDelegated = true;
    }
  }

  function loadBranchesForBulkSalesTab2(retryCount = 0){
    const maxRetries = 10;
    const retryDelay = 200;
    
    const branchSelect = document.getElementById('bulkDeptSaleBranchTab2');
    if (!branchSelect) {
      if (retryCount < maxRetries) {
        setTimeout(function() {
          loadBranchesForBulkSalesTab2(retryCount + 1);
        }, retryDelay);
        return;
      } else {
        console.error('❌ loadBranchesForBulkSalesTab2: Element bulkDeptSaleBranchTab2 not found after retries');
        return;
      }
    }
    
    // Check if the tab is actually visible (not just in DOM)
    const deptTabContent = document.getElementById('department-sales-content');
    if (deptTabContent && !deptTabContent.classList.contains('active') && !deptTabContent.classList.contains('show')) {
      console.log('⏳ Shop Sale tab not active yet, skipping branch load');
      return;
    }
    
    // Use waitForAPI helper to ensure API is available
    waitForAPI(function() {
      console.log('🔄 Loading branches for bulk sales tab 2...');
      const apiInstance = window.api || (typeof api !== 'undefined' ? api : null);
      if (!apiInstance) {
        console.error('❌ API instance not available after wait');
        const departmentSelect = document.getElementById('bulkDeptSaleDepartmentTab2');
        if (departmentSelect) {
          departmentSelect.innerHTML = '<option value="" selected disabled>Error: API not available</option>';
          departmentSelect.disabled = false;
        }
        return;
      }
      
      // Check if getBranches method exists
      if (typeof apiInstance.getBranches !== 'function') {
        console.error('❌ getBranches method not available on API instance');
        const departmentSelect = document.getElementById('bulkDeptSaleDepartmentTab2');
        if (departmentSelect) {
          departmentSelect.innerHTML = '<option value="" selected disabled>Error: API method not available</option>';
          departmentSelect.disabled = false;
        }
        return;
      }
      
      console.log('✅ API ready, calling getBranches()...');
      apiInstance.getBranches().then(function(all){
        console.log('✅ getBranches() returned:', Array.isArray(all) ? all.length : 'non-array', 'items');
        
        if (!Array.isArray(all)) {
          console.warn('⚠️ getBranches() returned non-array:', all);
          all = [];
        }
        
        let userBranches = all;
        if (window.appData && appData.currentUser && Array.isArray(appData.currentUser.branches) && appData.currentUser.branches.length){
          const ids = appData.currentUser.branches.map(function(b){ return b._id || b; });
          userBranches = all.filter(function(br){ return ids.includes(br._id); });
          console.log('✅ Filtered branches for user:', userBranches.length, 'of', all.length);
        }
        
        if (window.appData) appData.branches = userBranches;
        
        // Save the current selection BEFORE clearing
        const previousValue = (branchSelect.value || '').trim();
        let previousText = '';
        if (branchSelect.options && branchSelect.selectedIndex >= 0 && branchSelect.selectedIndex < branchSelect.options.length) {
          const selectedOption = branchSelect.options[branchSelect.selectedIndex];
          previousText = (selectedOption.text || '').trim();
        }
        
        console.log('📋 Previous branch state:', { value: previousValue, text: previousText });
        
        branchSelect.innerHTML = '<option value="">Select Branch</option>';
        userBranches.forEach(function(br){
          if (!br || (!br._id && !br.id) || !br.name) {
            console.warn('⚠️ Invalid branch object:', br);
            return;
          }
          const id = br._id || br.id;
          const opt = document.createElement('option');
          opt.value = id;
          opt.textContent = br.name;
          branchSelect.appendChild(opt);
        });
        
        console.log('✅ Populated', userBranches.length, 'branches in dropdown');
        
        let resolvedId = '';
        const savedBranchId = (localStorage.getItem('shopSale.branchId') || '').trim();
        const savedBranchName = (localStorage.getItem('shopSale.branchName') || '').trim().toLowerCase();
        if (/^[a-fA-F0-9]{24}$/.test(savedBranchId)) {
          const existsSaved = userBranches.find(function(br){ return (br._id || br.id) === savedBranchId; });
          if (existsSaved) resolvedId = savedBranchId;
        }
        if (/^[a-fA-F0-9]{24}$/.test(previousValue)) {
          // Check if the previous value still exists in the new branch list
          const branchExists = userBranches.find(function(br){ return br._id === previousValue; });
          if (branchExists) {
            resolvedId = previousValue;
            console.log('✅ Resolved branch ID from previous value:', resolvedId);
          }
        } else if (!resolvedId && previousText) {
          const matchByText = userBranches.find(function(br){ return (br.name || '').trim().toLowerCase() === previousText.trim().toLowerCase(); });
          if (matchByText) {
            resolvedId = matchByText._id;
            console.log('✅ Resolved branch ID from previous text:', resolvedId);
          }
        }
        if (!resolvedId && savedBranchName) {
          const matchSavedByText = userBranches.find(function(br){ return (br.name || '').trim().toLowerCase() === savedBranchName; });
          if (matchSavedByText) resolvedId = matchSavedByText._id || matchSavedByText.id;
        }
        
        // If no resolved ID but only one branch, auto-select it
        if (!resolvedId && userBranches.length === 1) {
          resolvedId = userBranches[0]._id;
          console.log('✅ Auto-selecting single branch:', resolvedId);
        }
        
        // Set the branch value if we have a resolved ID
        if (resolvedId) {
          branchSelect.value = resolvedId;
          console.log('✅ Branch selected:', resolvedId);
          try {
            localStorage.setItem('shopSale.branchId', resolvedId);
            const txt = branchSelect.options[branchSelect.selectedIndex] ? branchSelect.options[branchSelect.selectedIndex].text : '';
            localStorage.setItem('shopSale.branchName', txt || '');
          } catch(e) {}
          
          // Try to dispatch change event
          try {
            const changeEvent = new Event('change', { bubbles: true });
            branchSelect.dispatchEvent(changeEvent);
            console.log('✅ Change event dispatched');
          } catch(e) {
            console.warn('⚠️ Could not dispatch change event:', e);
          }
          
          // Always load departments after branch is set
          setTimeout(function() {
            console.log('🔄 Auto-loading departments after branch selection...');
            // Try window.loadDepartmentsForBulkSalesTab2 first, then local function
            const loadDeptFunc = (typeof window.loadDepartmentsForBulkSalesTab2 === 'function') 
              ? window.loadDepartmentsForBulkSalesTab2 
              : (typeof loadDepartmentsForBulkSalesTab2 === 'function') 
                ? loadDepartmentsForBulkSalesTab2 
                : null;
            
            if (loadDeptFunc) {
              console.log('✅ Calling loadDepartmentsForBulkSalesTab2...');
              loadDeptFunc();
            } else {
              console.error('❌ loadDepartmentsForBulkSalesTab2 function not available');
              console.error('❌ Debug info:', {
                'window.loadDepartmentsForBulkSalesTab2': typeof window.loadDepartmentsForBulkSalesTab2,
                'loadDepartmentsForBulkSalesTab2': typeof loadDepartmentsForBulkSalesTab2
              });
            }
          }, 200);
        } else {
          // After populating, check if branch dropdown has a value (maybe set elsewhere)
          // Use a small delay to allow any other code to set the value first
          setTimeout(function() {
            const currentValue = (branchSelect.value || '').trim();
            console.log('🔍 Checking branch selection after populate...', { 
              currentValue: currentValue,
              hasValue: currentValue !== '',
              isValidId: /^[a-fA-F0-9]{24}$/.test(currentValue)
            });
            
            if (currentValue && currentValue !== '' && /^[a-fA-F0-9]{24}$/.test(currentValue)) {
              // Verify this branch exists in our list
              const branchExists = userBranches.find(function(br){ return br._id === currentValue; });
              if (branchExists) {
                console.log('✅ Branch already selected by user/external code:', currentValue);
                
                // Try to dispatch change event
                try {
                  const changeEvent = new Event('change', { bubbles: true });
                  branchSelect.dispatchEvent(changeEvent);
                  console.log('✅ Change event dispatched');
                } catch(e) {
                  console.warn('⚠️ Could not dispatch change event:', e);
                }
                
                // Load departments for this branch
                setTimeout(function() {
                  console.log('🔄 Loading departments for existing branch selection...');
                  const loadDeptFunc = (typeof window.loadDepartmentsForBulkSalesTab2 === 'function') 
                    ? window.loadDepartmentsForBulkSalesTab2 
                    : (typeof loadDepartmentsForBulkSalesTab2 === 'function') 
                      ? loadDepartmentsForBulkSalesTab2 
                      : null;
                  
                  if (loadDeptFunc) {
                    console.log('✅ Calling loadDepartmentsForBulkSalesTab2...');
                    loadDeptFunc();
                  } else {
                    console.error('❌ loadDepartmentsForBulkSalesTab2 function not available');
                  }
                }, 100);
              } else {
                console.warn('⚠️ Selected branch not found in user branches list:', currentValue);
              }
            } else {
              if (!currentValue && userBranches.length > 0) {
                const firstId = userBranches[0]._id || userBranches[0].id;
                if (firstId) {
                  branchSelect.value = firstId;
                  try {
                    localStorage.setItem('shopSale.branchId', firstId);
                    const txt = branchSelect.options[branchSelect.selectedIndex] ? branchSelect.options[branchSelect.selectedIndex].text : '';
                    localStorage.setItem('shopSale.branchName', txt || '');
                  } catch(e) {}
                  try {
                    const changeEvent = new Event('change', { bubbles: true });
                    branchSelect.dispatchEvent(changeEvent);
                  } catch(e) {}
                  setTimeout(function() {
                    const loadDeptFunc = (typeof window.loadDepartmentsForBulkSalesTab2 === 'function') 
                      ? window.loadDepartmentsForBulkSalesTab2 
                      : (typeof loadDepartmentsForBulkSalesTab2 === 'function') 
                        ? loadDepartmentsForBulkSalesTab2 
                        : null;
                    if (loadDeptFunc) loadDeptFunc();
                  }, 100);
                }
              }
              console.log('ℹ️ No branch selected yet. Departments will load when branch is selected.');
            }
          }, 200);
        }

        if (!window.__shopSaleBranchBound) {
          const prevValue2 = branchSelect.value || '';
          const clone = branchSelect.cloneNode(true);
          branchSelect.parentNode.replaceChild(clone, branchSelect);
          if (prevValue2) clone.value = prevValue2;
          clone.addEventListener('change', function(){
            try {
              localStorage.setItem('shopSale.branchId', clone.value || '');
              const txt = clone.options[clone.selectedIndex] ? clone.options[clone.selectedIndex].text : '';
              localStorage.setItem('shopSale.branchName', txt || '');
            } catch(e) {}
            if (typeof window.loadDepartmentsForBulkSalesTab2 === 'function') window.loadDepartmentsForBulkSalesTab2();
          });
          window.__shopSaleBranchBound = true;
        }
      }).catch(function(err){
        console.error('❌ Error loading branches:', err);
        console.error('❌ Error details:', {
          message: err.message,
          stack: err.stack,
          status: err.status,
          response: err.response
        });
        
        // Clear department dropdown on error
        const departmentSelect = document.getElementById('bulkDeptSaleDepartmentTab2');
        if (departmentSelect) {
          departmentSelect.innerHTML = '<option value="" selected disabled>Error loading branches</option>';
          departmentSelect.disabled = false;
        }
        
        if (typeof showNotification === 'function') {
          showNotification('Failed to load branches: ' + (err.message || 'Unknown error'), 'error');
        }
      });
    }, 0, 50, 100); // Wait up to 5 seconds for API
  }

  // Prevent multiple simultaneous API calls
  let isLoadingDepartments = false;
  let lastBranchId = null;
  
  function loadDepartmentsForBulkSalesTab2(retryCount = 0){
    const maxRetries = 3;
    const retryDelay = 200;
    
    const branchSelect = document.getElementById('bulkDeptSaleBranchTab2');
    const departmentSelect = document.getElementById('bulkDeptSaleDepartmentTab2');
    const container = document.getElementById('bulkSubDepartmentsContainerTab2');
    
    if (!branchSelect || !departmentSelect) {
      if (retryCount < maxRetries) {
        console.log('⏳ Waiting for elements to be available, retry:', retryCount + 1);
        setTimeout(function() {
          loadDepartmentsForBulkSalesTab2(retryCount + 1);
        }, retryDelay);
        return;
      }
      console.error('❌ Missing required elements after retries:', { branchSelect: !!branchSelect, departmentSelect: !!departmentSelect });
      return;
    }
    
    const branchId = (branchSelect.value || '').trim();
    if (!branchId) {
      console.log('⏳ No branch selected yet');
      isLoadingDepartments = false;
      lastBranchId = null;
      if (departmentSelect) {
        departmentSelect.innerHTML = '<option value="" selected disabled>Select Department</option>';
        departmentSelect.disabled = false;
      }
      if (container) {
        container.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>Please select a branch and department to load sub-departments</div>';
      }
      return;
    }
    
    // Prevent duplicate calls for the same branch
    if (isLoadingDepartments && lastBranchId === branchId) {
      console.log('⏳ Departments already loading for branch:', branchId);
      return;
    }
    
    isLoadingDepartments = true;
    lastBranchId = branchId;
    
    // Use waitForAPI helper with better error handling
    waitForAPI(function() {
      const apiInstance = window.api || (typeof api !== 'undefined' ? api : null);
      if (!apiInstance) {
        console.error('❌ API instance not available after wait');
        isLoadingDepartments = false;
        if (departmentSelect) {
          departmentSelect.innerHTML = '<option value="" selected disabled>Error: API not available</option>';
          departmentSelect.disabled = false;
        }
        return;
      }
      
      console.log('✅ API ready, loading departments for branch:', branchId);
      loadDepartmentsInternal(branchSelect, departmentSelect, container, apiInstance, function() {
        // Reset loading flag when done
        isLoadingDepartments = false;
      });
    }, 0, 50, 100);
  }
  
  function loadDepartmentsInternal(branchSelect, departmentSelect, container, apiInstance, onComplete){
    let branchId = (branchSelect.value || '').trim();
    const __token = String(Date.now()) + '-' + String(Math.random());
    window.__deptLoadToken = __token;
    const __apply = function(cb){ if (window.__deptLoadToken === __token) { try { cb(); } catch(e){} } };
    if (!/^[a-fA-F0-9]{24}$/.test(branchId)) {
      const branches = (window.appData && Array.isArray(appData.branches)) ? appData.branches : [];
      let match = null;
      if (branches.length) {
        match = branches.find(function(b){ return (b.name || '').trim().toLowerCase() === branchId.trim().toLowerCase(); });
      }
      if (!match && branchId) {
        // Fallback: fetch branches from API to resolve name→_id mapping, then re-run
        if (typeof apiInstance.getBranches === 'function') {
          apiInstance.getBranches().then(function(fetched){
            if (Array.isArray(fetched) && fetched.length) {
              if (window.appData) appData.branches = fetched;
              const m2 = fetched.find(function(b){ return (b.name || '').trim().toLowerCase() === branchId.trim().toLowerCase(); });
              if (m2) {
                branchSelect.value = m2._id;
                // Re-run with resolved ID
                loadDepartmentsInternal(branchSelect, departmentSelect, container, apiInstance, onComplete);
                return;
              }
            }
            // Proceed without mapping if no match
            proceed();
          }).catch(function(){ proceed(); });
          // Stop current flow; it will continue in the promise above
          return;
        }
      }
      if (match) {
        branchId = match._id;
        branchSelect.value = match._id;
      }
    }
    function proceed(){
      if (!branchId){
        departmentSelect.innerHTML = '<option value="" selected disabled>Select Department</option>';
        departmentSelect.disabled = false;
        if (container) container.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>Please select a branch and department to load sub-departments</div>';
        return;
      }
      // Show loading state
      departmentSelect.innerHTML = '<option value="">Loading departments...</option>';
      departmentSelect.disabled = true;
      if (container) {
        container.innerHTML = '<div class="text-center p-3"><i class="fas fa-spinner fa-spin me-2"></i>Loading departments...</div>';
      }
      try { console.log('🔄 Loading departments for branch:', branchId); } catch(e) {}
      // Ensure API method exists
      if (!apiInstance || typeof apiInstance.getDepartments !== 'function') {
        console.error('❌ API instance or getDepartments method not available');
        departmentSelect.innerHTML = '<option value="" selected disabled>Error: API method not available</option>';
        departmentSelect.disabled = false;
        if (container) {
          container.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Error: API method not available</div>';
        }
        return;
      }
      apiInstance.getDepartments(branchId).then(function(departments){
        try { 
          console.log('✅ Departments loaded:', Array.isArray(departments) ? departments.length : 0);
          if (!Array.isArray(departments)) {
            console.error('❌ Departments response is not an array:', departments);
          }
        } catch(e) {}
        if (Array.isArray(departments) && departments.length) {
          __apply(function(){ fillDepartments(departments, departmentSelect, container, onComplete); });
          return;
        }
        (typeof apiInstance.getDepartmentsByBranch === 'function' ? apiInstance.getDepartmentsByBranch(branchId) : Promise.reject()).then(function(deptsByBranch){
          try { 
            console.log('✅ Departments loaded by branch route:', Array.isArray(deptsByBranch) ? deptsByBranch.length : 0); 
          } catch(e) {}
          if (Array.isArray(deptsByBranch) && deptsByBranch.length) {
            __apply(function(){ fillDepartments(deptsByBranch, departmentSelect, container); });
            return;
          }
          apiInstance.getDepartments().then(function(allDepts){
            let filtered = (allDepts || []).filter(function(d){
              const bid = (d.branchId && (d.branchId._id || d.branchId)) || d.branchId;
              return String(bid) === String(branchId);
            });
            if ((!filtered || filtered.length === 0) && branchSelect && branchSelect.selectedIndex >= 0) {
              const branchName = (branchSelect.options[branchSelect.selectedIndex].text || '').trim().toLowerCase();
              filtered = (allDepts || []).filter(function(d){
                const bname = (d.branchId && d.branchId.name) ? d.branchId.name : '';
                return (bname || '').trim().toLowerCase() === branchName;
              });
              try { console.log('🔄 Fallback by branch name matched departments:', filtered.length); } catch(e) {}
            }
            try { console.log('✅ Departments loaded via all-departments fallback:', filtered.length); } catch(e) {}
            __apply(function(){ fillDepartments(filtered, departmentSelect, container); });
          }).catch(function(err){
            console.error('❌ Error loading departments (fallback):', err);
            __apply(function(){ departmentSelect.innerHTML = '<option value="" selected disabled>Error loading departments</option>'; departmentSelect.disabled = false; });
            const errorMsg = err.message || err.error || 'Unknown error';
            if (typeof showNotification === 'function') {
              showNotification('Failed to load departments: ' + errorMsg + (err.status === 'database_unavailable' ? ' (Database connection issue)' : ''), 'error');
            }
          });
        }).catch(function(err){
          console.error('❌ Error in getDepartmentsByBranch fallback:', err);
          apiInstance.getDepartments().then(function(allDepts){
            let filtered = (allDepts || []).filter(function(d){
              const bid = (d.branchId && (d.branchId._id || d.branchId)) || d.branchId;
              return String(bid) === String(branchId);
            });
            if ((!filtered || filtered.length === 0) && branchSelect && branchSelect.selectedIndex >= 0) {
              const branchName = (branchSelect.options[branchSelect.selectedIndex].text || '').trim().toLowerCase();
              filtered = (allDepts || []).filter(function(d){
                const bname = (d.branchId && d.branchId.name) ? d.branchId.name : '';
                return (bname || '').trim().toLowerCase() === branchName;
              });
              try { console.log('🔄 Fallback by branch name matched departments (inner):', filtered.length); } catch(e) {}
            }
            try { console.log('✅ Departments loaded via all-departments fallback (inner):', filtered.length); } catch(e) {}
            __apply(function(){ fillDepartments(filtered, departmentSelect, container); });
          }).catch(function(err2){
            console.error('❌ Error in all-departments fallback (inner):', err2);
            // Final fallback: use cached departments from Department Management
            const cached = (window.appData && Array.isArray(appData.departments)) ? appData.departments : [];
            const filteredCached = cached.filter(function(d){
              const bid = (d.branchId && (d.branchId._id || d.branchId)) || d.branchId;
              return String(bid) === String(branchId);
            });
            try { console.log('📦 Departments loaded from cache (inner):', filteredCached.length); } catch(e) {}
            if (filteredCached.length) {
              __apply(function(){ fillDepartments(filteredCached, departmentSelect, container); });
            } else {
              __apply(function(){ departmentSelect.innerHTML = '<option value="" selected disabled>Error loading departments</option>'; departmentSelect.disabled = false; });
              const errorMsg = err2.message || err2.error || 'Unknown error';
              if (typeof showNotification === 'function') {
                showNotification('Failed to load departments: ' + errorMsg + (err2.status === 'database_unavailable' ? ' (Database connection issue)' : ''), 'error');
              }
            }
          });
        });
      }).catch(function(err){
        console.error('❌ Error loading departments (primary):', err);
        if (typeof apiInstance.getDepartmentsByBranch === 'function'){
          apiInstance.getDepartmentsByBranch(branchId).then(function(departments){
            try { 
              console.log('✅ Departments loaded by branch route:', Array.isArray(departments) ? departments.length : 0); 
            } catch(e) {}
            __apply(function(){ fillDepartments(departments, departmentSelect, container, onComplete); });
          }).catch(function(err2){
            console.error('❌ Error loading departments by branch route:', err2);
            __apply(function(){ departmentSelect.innerHTML = '<option value="" selected disabled>Error loading departments</option>'; departmentSelect.disabled = false; });
            const errorMsg = err2.message || err2.error || 'Unknown error';
            if (typeof showNotification === 'function') {
              showNotification('Failed to load departments: ' + errorMsg + (err2.status === 'database_unavailable' ? ' (Database connection issue)' : ''), 'error');
            }
          });
        } else {
          apiInstance.getDepartments().then(function(allDepts){
            let filtered = (allDepts || []).filter(function(d){
              const bid = (d.branchId && (d.branchId._id || d.branchId)) || d.branchId;
              return String(bid) === String(branchId);
            });
            if ((!filtered || filtered.length === 0) && branchSelect && branchSelect.selectedIndex >= 0) {
              const branchName = (branchSelect.options[branchSelect.selectedIndex].text || '').trim().toLowerCase();
              filtered = (allDepts || []).filter(function(d){
                const bname = (d.branchId && d.branchId.name) ? d.branchId.name : '';
                return (bname || '').trim().toLowerCase() === branchName;
              });
              try { console.log('🔄 Fallback by branch name matched departments (outer):', filtered.length); } catch(e) {}
            }
            try { console.log('✅ Departments loaded via all-departments fallback (outer):', filtered.length); } catch(e) {}
            if (filtered.length) {
              __apply(function(){ fillDepartments(filtered, departmentSelect, container); });
            } else {
              const cached = (window.appData && Array.isArray(appData.departments)) ? appData.departments : [];
              const filteredCached = cached.filter(function(d){
                const bid = (d.branchId && (d.branchId._id || d.branchId)) || d.branchId;
                return String(bid) === String(branchId);
              });
              if ((!filteredCached || filteredCached.length === 0) && branchSelect && branchSelect.selectedIndex >= 0) {
                const branchName = (branchSelect.options[branchSelect.selectedIndex].text || '').trim().toLowerCase();
                filteredCached = (cached || []).filter(function(d){
                  const bname = (d.branchId && d.branchId.name) ? d.branchId.name : '';
                  return (bname || '').trim().toLowerCase() === branchName;
                });
                try { console.log('📦 Departments loaded from cache by name (outer):', filteredCached.length); } catch(e) {}
              } else {
                try { console.log('📦 Departments loaded from cache (outer):', filteredCached.length); } catch(e) {}
              }
              if (filteredCached.length) {
                __apply(function(){ fillDepartments(filteredCached, departmentSelect, container); });
              } else {
                __apply(function(){ departmentSelect.innerHTML = '<option value="" selected disabled>No departments found</option>'; departmentSelect.disabled = false; });
                if (typeof showNotification === 'function') showNotification('No departments found for this branch. Please add departments first.', 'warning');
              }
            }
          }).catch(function(err){
            console.error('❌ Error in all-departments fallback (outer):', err);
            const cached = (window.appData && Array.isArray(appData.departments)) ? appData.departments : [];
            const filteredCached = cached.filter(function(d){
              const bid = (d.branchId && (d.branchId._id || d.branchId)) || d.branchId;
              return String(bid) === String(branchId);
            });
            try { console.log('📦 Departments loaded from cache (outer):', filteredCached.length); } catch(e) {}
            if (filteredCached.length) {
              __apply(function(){ fillDepartments(filteredCached, departmentSelect, container); });
            } else {
              __apply(function(){ departmentSelect.innerHTML = '<option value="" selected disabled>Error loading departments</option>'; departmentSelect.disabled = false; });
              const errorMsg = err.message || err.error || 'Unknown error';
              if (typeof showNotification === 'function') {
                showNotification('Failed to load departments: ' + errorMsg + (err.status === 'database_unavailable' ? ' (Database connection issue)' : ''), 'error');
              }
            }
          });
        }
      });
    }
  }

  function fillDepartments(departments, departmentSelect, container, onComplete){
    if (!Array.isArray(departments)) {
      console.error('❌ fillDepartments: departments is not an array:', departments);
      departmentSelect.innerHTML = '<option value="" selected disabled>Error: Invalid data</option>';
      departmentSelect.disabled = false;
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    departmentSelect.innerHTML = '<option value="" selected disabled>Select Department</option>';
    const prevText = departmentSelect.options && departmentSelect.selectedIndex >= 0 ? (departmentSelect.options[departmentSelect.selectedIndex].text || '') : '';
    
    if (departments.length > 0){
      console.log('✅ Filling', departments.length, 'departments into dropdown');
      departments.forEach(function(dept){
        if (!dept || !dept._id || !dept.name) {
          console.warn('⚠️ Invalid department object:', dept);
          return;
        }
        const opt = document.createElement('option'); 
        opt.value = dept._id; 
        opt.textContent = dept.name; 
        departmentSelect.appendChild(opt);
      });
      departmentSelect.disabled = false;
      let resolvedDept = '';
      const savedDeptId = (localStorage.getItem('shopSale.departmentId') || '').trim();
      const savedDeptName = (localStorage.getItem('shopSale.departmentName') || '').trim().toLowerCase();
      if (/^[a-fA-F0-9]{24}$/.test(savedDeptId)) {
        const exists = departments.find(function(d){ return d._id === savedDeptId; });
        if (exists) resolvedDept = savedDeptId;
      }
      if (prevText) {
        const matchByText = departments.find(function(d){ return (d.name || '').trim().toLowerCase() === prevText.trim().toLowerCase(); });
        if (matchByText) resolvedDept = matchByText._id;
      }
      if (!resolvedDept && savedDeptName) {
        const matchSaved = departments.find(function(d){ return (d.name || '').trim().toLowerCase() === savedDeptName; });
        if (matchSaved) resolvedDept = matchSaved._id;
      }
      if (!resolvedDept && departments.length === 1) {
        resolvedDept = departments[0]._id;
      }
      if (resolvedDept) {
        departmentSelect.value = resolvedDept;
        try { departmentSelect.dispatchEvent(new Event('change')); } catch(e) {}
      }
      if (typeof onComplete === 'function') onComplete();
    } else {
      console.warn('⚠️ No departments to fill');
      departmentSelect.innerHTML = '<option value="" selected disabled>No departments found</option>';
      departmentSelect.disabled = false;
      if (container) container.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i>No departments found for this branch. Please add departments first.</div>';
      if (typeof onComplete === 'function') onComplete();
    }
  }

  function loadSubDepartmentsForBulkSalesTab2(){
    const departmentId = (document.getElementById('bulkDeptSaleDepartmentTab2')?.value || '').trim();
    const container = document.getElementById('bulkSubDepartmentsContainerTab2');
    if (!departmentId || !container) return;
    
    // Use waitForAPI helper
    waitForAPI(function() {
      const apiInstance = window.api || (typeof api !== 'undefined' ? api : null);
      if (!apiInstance) {
        console.error('❌ API instance not available');
        return;
      }
      
      loadSubDepartmentsInternal(departmentId, container, apiInstance);
    }, 0, 50, 100);
  }
  
  // Load departments for the department sales list filter dropdown
  function loadDepartmentsForDeptSalesListFilter(branchId) {
    const departmentSelect = document.getElementById('deptSalesListDepartment');
    if (!departmentSelect) {
      console.warn('⚠️ Department select element not found for deptSalesListDepartment');
      return;
    }
    
    if (!branchId || branchId.trim() === '') {
      departmentSelect.innerHTML = '<option value="">All Departments</option>';
      departmentSelect.disabled = false;
      return;
    }
    
    // Show loading state
    departmentSelect.innerHTML = '<option value="">Loading departments...</option>';
    departmentSelect.disabled = true;
    
    console.log('🔄 Loading departments for filter, branch:', branchId);
    
    // Use waitForAPI helper to ensure API is available
    waitForAPI(function() {
      const apiInstance = window.api || (typeof api !== 'undefined' ? api : null);
      if (!apiInstance || typeof apiInstance.getDepartments !== 'function') {
        console.error('❌ API instance or getDepartments method not available');
        departmentSelect.innerHTML = '<option value="">All Departments</option>';
        departmentSelect.disabled = false;
        if (typeof showNotification === 'function') {
          showNotification('Error: API not available to load departments', 'error');
        }
        return;
      }
      
      // Try primary method: getDepartments(branchId)
      apiInstance.getDepartments(branchId).then(function(departments) {
        console.log('✅ Departments loaded for filter:', Array.isArray(departments) ? departments.length : 0);
        
        departmentSelect.innerHTML = '<option value="">All Departments</option>';
        
        if (Array.isArray(departments) && departments.length > 0) {
          departments.forEach(function(dept) {
            if (dept && dept._id && dept.name) {
              const option = document.createElement('option');
              option.value = dept._id;
              option.textContent = dept.name;
              departmentSelect.appendChild(option);
            }
          });
        }
        
        departmentSelect.disabled = false;
      }).catch(function(err) {
        console.error('❌ Error loading departments for filter (primary method):', err);
        
        // Fallback: try getDepartments() and filter by branchId
        if (typeof apiInstance.getDepartments === 'function') {
          apiInstance.getDepartments().then(function(allDepts) {
            const filtered = (allDepts || []).filter(function(d) {
              const bid = (d.branchId && (d.branchId._id || d.branchId)) || d.branchId;
              return String(bid) === String(branchId);
            });
            
            console.log('✅ Departments loaded for filter (fallback):', filtered.length);
            
            departmentSelect.innerHTML = '<option value="">All Departments</option>';
            
            if (filtered.length > 0) {
              filtered.forEach(function(dept) {
                if (dept && dept._id && dept.name) {
                  const option = document.createElement('option');
                  option.value = dept._id;
                  option.textContent = dept.name;
                  departmentSelect.appendChild(option);
                }
              });
            }
            
            departmentSelect.disabled = false;
          }).catch(function(err2) {
            console.error('❌ Error loading departments for filter (fallback):', err2);
            
            // Final fallback: use cached departments
            const cached = (window.appData && Array.isArray(appData.departments)) ? appData.departments : [];
            const filteredCached = cached.filter(function(d) {
              const bid = (d.branchId && (d.branchId._id || d.branchId)) || d.branchId;
              return String(bid) === String(branchId);
            });
            
            console.log('📦 Departments loaded for filter from cache:', filteredCached.length);
            
            departmentSelect.innerHTML = '<option value="">All Departments</option>';
            
            if (filteredCached.length > 0) {
              filteredCached.forEach(function(dept) {
                if (dept && dept._id && dept.name) {
                  const option = document.createElement('option');
                  option.value = dept._id;
                  option.textContent = dept.name;
                  departmentSelect.appendChild(option);
                }
              });
            } else {
              departmentSelect.innerHTML = '<option value="">No departments found</option>';
            }
            
            departmentSelect.disabled = false;
          });
        } else {
          departmentSelect.innerHTML = '<option value="">Error loading departments</option>';
          departmentSelect.disabled = false;
          if (typeof showNotification === 'function') {
            showNotification('Failed to load departments: ' + (err.message || 'Unknown error'), 'error');
          }
        }
      });
    }, 0, 50, 100);
  }
  
  function loadSubDepartmentsInternal(departmentId, container, apiInstance){
    container.innerHTML = '<div class="text-center p-3"><i class="fas fa-spinner fa-spin me-2"></i>Loading sub-departments...</div>';
    try { console.log('Loading sub-departments for department', departmentId); } catch(e) {}
    const build = function(subDepts){
      if (!subDepts || !subDepts.length){
        container.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i>No sub-departments found for this department</div>';
        return;
      }
      try { console.log('Sub-departments loaded', Array.isArray(subDepts) ? subDepts.length : 0); } catch(e) {}
      container.innerHTML = '';
      const table = document.createElement('table');
      table.className = 'table table-bordered table-hover';
      table.innerHTML = '<thead class="table-light"><tr><th>Sub-Department</th><th class="text-end">Gross Sale</th><th class="text-end">Discount Amount</th><th class="text-end">Discount %</th><th class="text-end">Sale Value</th><th class="text-end">Return</th><th class="text-end">GST</th><th class="text-end">Net Sale</th></tr></thead><tbody id="bulkSubDeptTableBodyTab2"></tbody><tfoot class="table-info fw-bold"><tr id="bulkSubDeptTotalsRowTab2"><td><strong>Total</strong></td><td class="text-end" id="totalGrossSaleTab2">0.00</td><td class="text-end" id="totalDiscountTab2">0.00</td><td class="text-end" id="avgDiscountPercentTab2">0.00%</td><td class="text-end" id="totalSaleValueTab2">0.00</td><td class="text-end" id="totalReturnTab2">0.00</td><td class="text-end" id="totalGSTTab2">0.00</td><td class="text-end" id="totalNetSaleTab2">0.00</td></tr></tfoot>';
      const tbody = table.querySelector('#bulkSubDeptTableBodyTab2');
      subDepts.forEach(function(sd){
        const row = document.createElement('tr');
        row.innerHTML = '<td><strong>' + sd.name + '</strong><input type="hidden" class="bulk-subdept-id-tab2" value="' + sd._id + '"></td>' +
          '<td><input type="number" class="form-control text-end bulk-gross-sale-tab2" data-subdept="' + sd._id + '" min="0" step="0.01" placeholder="0.00" value="0"></td>' +
          '<td><input type="number" class="form-control text-end bulk-discount-tab2" data-subdept="' + sd._id + '" min="0" step="0.01" placeholder="0.00" value="0"></td>' +
          '<td><input type="number" class="form-control text-end bulk-discount-percent-tab2" data-subdept="' + sd._id + '" readonly placeholder="0.00%" style="background-color:#e7f3ff;" value="0"></td>' +
          '<td><input type="number" class="form-control text-end bulk-sale-value-tab2" data-subdept="' + sd._id + '" readonly placeholder="0.00" style="background-color:#e7f3ff;"></td>' +
          '<td><input type="number" class="form-control text-end bulk-return-tab2" data-subdept="' + sd._id + '" min="0" step="0.01" placeholder="0.00" value="0"></td>' +
          '<td><input type="number" class="form-control text-end bulk-gst-tab2" data-subdept="' + sd._id + '" min="0" step="0.01" placeholder="0.00" value="0"></td>' +
          '<td><input type="number" class="form-control text-end bulk-net-sale-tab2" data-subdept="' + sd._id + '" readonly placeholder="0.00" style="background-color:#e7f3ff;"></td>';
        tbody.appendChild(row);
        const gross = row.querySelector('.bulk-gross-sale-tab2');
        const disc = row.querySelector('.bulk-discount-tab2');
        const ret = row.querySelector('.bulk-return-tab2');
        const gst = row.querySelector('.bulk-gst-tab2');
        const recalc = function(){
          calculateBulkSubDeptTotalsTab2(sd._id);
          if (typeof window.calculateBulkTotalsTab2 === 'function') window.calculateBulkTotalsTab2();
        };
        [gross, disc, ret, gst].forEach(function(inp){ if (inp){ inp.addEventListener('input', recalc); inp.addEventListener('change', recalc); } });
      });
      container.appendChild(table);
      setTimeout(function(){ if (typeof window.calculateBulkTotalsTab2 === 'function') window.calculateBulkTotalsTab2(); }, 100);
    };
    apiInstance.getSubDepartmentsByDepartment(departmentId).then(build).catch(function(){
      if (typeof apiInstance.getSubDepartments === 'function'){
        apiInstance.getSubDepartments({ departmentId: departmentId }).then(build).catch(function(err){
          if (typeof showNotification === 'function') showNotification('Failed to load sub-departments: ' + (err.message || 'Unknown error'), 'error');
          container.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Failed to load sub-departments</div>';
        });
      } else {
        // Final fallback: use cached departments
        const cached = (window.appData && Array.isArray(appData.departments)) ? appData.departments : [];
        const dept = cached.find(function(d){ return String(d._id) === String(departmentId); });
        if (dept && Array.isArray(dept.subDepartments) && dept.subDepartments.length){
          build(dept.subDepartments);
        } else {
          container.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Failed to load sub-departments</div>';
        }
      }
    });
  }

  function generateCategoryInputs() {
    var container = document.getElementById('categoryInputs');
    if (!container) return;
    container.innerHTML = '';
    (appData.categories || []).forEach(function(category){
      var inputGroup = document.createElement('div');
      inputGroup.className = 'category-input-group';
      inputGroup.innerHTML = '<label>' + category.name + '</label>' +
        '<div class="row">' +
        '<div class="col-md-6 mb-2"><div class="input-group"><span class="input-group-text">Sales</span>' +
        '<input type="number" class="form-control category-sales" data-category="' + category._id + '" min="0" step="0.01" placeholder="0.00"></div></div>' +
        '<div class="col-md-6 mb-2"><div class="input-group"><span class="input-group-text">Cost</span>' +
        '<input type="number" class="form-control category-cost" data-category="' + category._id + '" min="0" step="0.01" placeholder="0.00"></div></div>' +
        '</div>';
      container.appendChild(inputGroup);
    });
    var inputs = container.querySelectorAll('.category-sales, .category-cost');
    inputs.forEach(function(input){
      var newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);
      var handler = function(){
        if (typeof window.calculateSalesTotals === 'function') window.calculateSalesTotals();
      };
      newInput.addEventListener('input', handler);
      newInput.addEventListener('change', handler);
    });
    if (typeof window.calculateSalesTotals === 'function') window.calculateSalesTotals();
  }

  function updatePagination(totalItems, currentPage, perPage, paginationId, callback) {
    var pagination = document.getElementById(paginationId); if (!pagination) return; pagination.innerHTML = ''; var totalPages = Math.ceil(totalItems / perPage); if (totalPages <= 1) return; var prevLi = document.createElement('li'); prevLi.className = 'page-item ' + (currentPage === 1 ? 'disabled' : ''); prevLi.innerHTML = '<a class="page-link" href="#" data-page="' + (currentPage - 1) + '">Previous</a>'; pagination.appendChild(prevLi); for (var i=1;i<=totalPages;i++){ if (i===1||i===totalPages||(i>=currentPage-1&&i<=currentPage+1)){ var li=document.createElement('li'); li.className = 'page-item ' + (i===currentPage ? 'active' : ''); li.innerHTML = '<a class="page-link" href="#" data-page="' + i + '">' + i + '</a>'; pagination.appendChild(li); } else if (i===currentPage-2 || i===currentPage+2){ var li2=document.createElement('li'); li2.className='page-item disabled'; li2.innerHTML='<span class="page-link">...</span>'; pagination.appendChild(li2); } }
    var nextLi = document.createElement('li'); nextLi.className = 'page-item ' + (currentPage === totalPages ? 'disabled' : ''); nextLi.innerHTML = '<a class="page-link" href="#" data-page="' + (currentPage + 1) + '">Next</a>'; pagination.appendChild(nextLi); pagination.querySelectorAll('.page-link').forEach(function(link){ link.addEventListener('click', function(e){ e.preventDefault(); var page = parseInt(this.getAttribute('data-page')); if (page>0 && page<=totalPages){ callback(page, perPage); } }); });
  }

  function loadDeptSalesInvoices(sales){ var container = document.getElementById('deptSalesInvoicesContainer'); if (!container) return; container.innerHTML=''; if (!sales || sales.length===0){ container.innerHTML = '<div class="col-12 text-center text-muted p-4">No department sales found</div>'; return; } var permissions = (appData.currentUser && appData.currentUser.permissions) || []; var isAdmin = permissions.indexOf('admin') !== -1; var canEditSale = isAdmin || permissions.indexOf('sales-edit') !== -1; var canDeleteSale = isAdmin || permissions.indexOf('sales-delete') !== -1; sales.forEach(function(sale){ var card=document.createElement('div'); card.className='col-md-6 col-lg-4 mb-3'; card.innerHTML = '<div class="invoice-card"><div class="invoice-header"><span>' + (typeof formatDate==='function' ? formatDate(sale.date) : new Date(sale.date).toLocaleDateString()) + '</span></div><div class="invoice-body"><div class="invoice-details"><span class="invoice-detail-label">Branch:</span><span class="invoice-detail-value">' + (sale.branchId && sale.branchId.name || 'Unknown') + '</span></div><div class="invoice-details"><span class="invoice-detail-label">Department:</span><span class="invoice-detail-value">' + (sale.departmentId && sale.departmentId.name || 'Unknown') + '</span></div><div class="invoice-details"><span class="invoice-detail-label">Sub-Department:</span><span class="invoice-detail-value">' + (sale.subDepartmentId && sale.subDepartmentId.name || 'Unknown') + '</span></div><div class="invoice-details"><span class="invoice-detail-label">Gross Sale:</span><span class="invoice-detail-value">' + ((sale.grossSale||0).toLocaleString()) + '</span></div><div class="invoice-details"><span class="invoice-detail-label">Discount:</span><span class="invoice-detail-value">' + ((sale.discountAmount||0).toLocaleString()) + '</span></div><div class="invoice-details"><span class="invoice-detail-label">Return:</span><span class="invoice-detail-value">' + ((sale.returnAmount||0).toLocaleString()) + '</span></div><div class="invoice-details"><span class="invoice-detail-label">GST:</span><span class="invoice-detail-value">' + ((sale.gst||0).toLocaleString()) + '</span></div><div class="invoice-details"><span class="invoice-detail-label">Net Sale:</span><span class="invoice-detail-value text-success"><strong>' + ((sale.netSale||0).toLocaleString()) + '</strong></span></div><div class="invoice-actions">' + (canEditSale ? '<button class="btn btn-sm btn-primary" onclick="editDeptSale(\'' + sale._id + '\')"><i class="fas fa-edit"></i> Edit</button>' : '') + (canDeleteSale ? '<button class="btn btn-sm btn-danger" onclick="deleteDeptSale(\'' + sale._id + '\')"><i class="fas fa-trash"></i> Delete</button>' : '') + '</div></div></div>'; container.appendChild(card); }); }

  function loadDeptSalesTable(sales, grandTotals){ var tableBody = document.getElementById('deptSalesListTableBody'); if (!tableBody) return; tableBody.innerHTML=''; var permissions = (appData.currentUser && appData.currentUser.permissions) || []; var isAdmin = permissions.indexOf('admin') !== -1; var canEditSale = isAdmin || permissions.indexOf('sales-edit') !== -1; var canDeleteSale = isAdmin || permissions.indexOf('sales-delete') !== -1; sales.forEach(function(sale){ var row=document.createElement('tr'); row.innerHTML = '<td>' + (typeof formatDate==='function' ? formatDate(sale.date) : new Date(sale.date).toLocaleDateString()) + '</td><td>' + (sale.branchId && sale.branchId.name || 'Unknown') + '</td><td>' + (sale.departmentId && sale.departmentId.name || 'Unknown') + '</td><td>' + (sale.subDepartmentId && sale.subDepartmentId.name || 'Unknown') + '</td><td>' + ((sale.grossSale||0).toLocaleString()) + '</td><td>' + ((sale.discountAmount||0).toLocaleString()) + '</td><td>' + ((sale.returnAmount||0).toLocaleString()) + '</td><td>' + ((sale.gst||0).toLocaleString()) + '</td><td class="' + ((sale.netSale||0) >= 0 ? 'text-success' : 'text-danger') + '"><strong>' + ((sale.netSale||0).toLocaleString()) + '</strong></td><td><div class="sales-list-actions">' + (canEditSale ? '<button class="btn btn-sm btn-primary" onclick="editDeptSale(\'' + sale._id + '\')"><i class="fas fa-edit"></i></button>' : '') + (canDeleteSale ? '<button class="btn btn-sm btn-danger" onclick="deleteDeptSale(\'' + sale._id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div></td>'; tableBody.appendChild(row); }); if (grandTotals && (grandTotals.grossSale > 0 || grandTotals.netSale !== 0)){ var footer = document.getElementById('deptSalesListTotals'); if (footer){ footer.innerHTML = '<tr class="table-warning fw-bold" style="background-color: #fff3cd;"><td colspan="4"><strong>GRAND TOTALS</strong></td><td class="text-end"><strong>' + ((grandTotals.grossSale||0).toLocaleString()) + '</strong></td><td class="text-end"><strong>' + ((grandTotals.discountAmount||0).toLocaleString()) + '</strong></td><td class="text-end"><strong>' + ((grandTotals.returnAmount||0).toLocaleString()) + '</strong></td><td class="text-end"><strong>' + ((grandTotals.gst||0).toLocaleString()) + '</strong></td><td class="text-end ' + ((grandTotals.netSale||0) >= 0 ? 'text-success' : 'text-danger') + '"><strong>' + ((grandTotals.netSale||0).toLocaleString()) + '</strong></td><td></td></tr>'; footer.style.display = ''; } else { var grandTotalRow = document.createElement('tr'); grandTotalRow.className = 'table-warning fw-bold'; grandTotalRow.style.backgroundColor = '#fff3cd'; grandTotalRow.innerHTML = '<td colspan="4"><strong>GRAND TOTALS</strong></td><td class="text-end"><strong>' + ((grandTotals.grossSale||0).toLocaleString()) + '</strong></td><td class="text-end"><strong>' + ((grandTotals.discountAmount||0).toLocaleString()) + '</strong></td><td class="text-end"><strong>' + ((grandTotals.returnAmount||0).toLocaleString()) + '</strong></td><td class="text-end"><strong>' + ((grandTotals.gst||0).toLocaleString()) + '</strong></td><td class="text-end ' + ((grandTotals.netSale||0) >= 0 ? 'text-success' : 'text-danger') + '"><strong>' + ((grandTotals.netSale||0).toLocaleString()) + '</strong></td><td></td>'; tableBody.appendChild(grandTotalRow); } }
  }

  function loadDepartmentSummary(sales){ var summarySection = document.getElementById('departmentSummarySection'); var summaryCards = document.getElementById('departmentSummaryCards'); if (!sales || sales.length===0){ if (summarySection) summarySection.style.display='none'; return; } var departmentData = {}; if (appData.departments && appData.departments.length>0){ appData.departments.forEach(function(department){ departmentData[department._id] = { name: department.name, grossSale:0, discount:0, returnAmount:0, gst:0, netSale:0, transactions:[] }; }); } var sortedSales = sales.slice().sort(function(a,b){ return new Date(b.date) - new Date(a.date); }); sortedSales.forEach(function(sale){ var departmentId = (sale.departmentId && sale.departmentId._id) || sale.departmentId; if (departmentId){ if (!departmentData[departmentId]){ var deptName = (sale.departmentId && sale.departmentId.name) || 'Unknown Department'; departmentData[departmentId] = { name: deptName, grossSale:0, discount:0, returnAmount:0, gst:0, netSale:0, transactions:[] }; } departmentData[departmentId].grossSale += sale.grossSale || 0; departmentData[departmentId].discount += sale.discountAmount || 0; departmentData[departmentId].returnAmount += sale.returnAmount || 0; departmentData[departmentId].gst += sale.gst || 0; departmentData[departmentId].netSale += sale.netSale || 0; departmentData[departmentId].transactions.push({ date: sale.date, grossSale: sale.grossSale || 0, discount: sale.discountAmount || 0, returnAmount: sale.returnAmount || 0, gst: sale.gst || 0, netSale: sale.netSale || 0, branch: (sale.branchId && sale.branchId.name) || 'Unknown', subDepartment: (sale.subDepartmentId && sale.subDepartmentId.name) || 'Unknown' }); } }); var hasData = Object.values(departmentData).some(function(dept){ return dept.netSale > 0; }); if (summarySection) summarySection.style.display = hasData ? 'block' : 'none'; if (!hasData || !summaryCards) return; summaryCards.innerHTML=''; var departmentsWithSales = Object.values(departmentData).filter(function(dept){ return dept.netSale > 0; }).sort(function(a,b){ return b.netSale - a.netSale; }); var grandTotalGrossSale=0, grandTotalDiscount=0, grandTotalReturn=0, grandTotalGST=0, grandTotalNetSale=0, grandTotalTransactions=0; departmentsWithSales.forEach(function(department){ grandTotalGrossSale += department.grossSale; grandTotalDiscount += department.discount; grandTotalReturn += department.returnAmount; grandTotalGST += department.gst; grandTotalNetSale += department.netSale; grandTotalTransactions += department.transactions.length; });
    
    // Add Grand Total card at the beginning (top)
    if (departmentsWithSales.length > 0) {
      var grandTotalCard = document.createElement('div');
      grandTotalCard.className = 'col-12 mb-4';
      grandTotalCard.innerHTML = '<div class="card border-0 shadow-lg" style="border: 2px solid #ffc107 !important;"><div class="card-header bg-warning" style="padding: 0.5rem 1rem;"><div class="row align-items-center"><div class="col-md-8"><h5 class="mb-0 fw-bold text-white"><i class="fas fa-calculator me-2"></i>GRAND TOTAL (All Departments)</h5></div><div class="col-md-4 text-end"><span class="badge bg-dark text-white">' + grandTotalTransactions + ' Total Transactions</span></div></div></div><div class="card-body" style="background-color: #fff9e6; padding: 0.75rem 1rem;"><div class="row mb-3"><div class="col-md-2"><div class="stat-box"><div class="stat-label fw-bold">Gross Sale</div><div class="stat-value fw-bold" style="font-size: 1.2em;">' + grandTotalGrossSale.toLocaleString() + '</div></div></div><div class="col-md-2"><div class="stat-box"><div class="stat-label fw-bold">Discount</div><div class="stat-value fw-bold" style="font-size: 1.2em;">' + grandTotalDiscount.toLocaleString() + '</div></div></div><div class="col-md-2"><div class="stat-box"><div class="stat-label fw-bold">Return</div><div class="stat-value fw-bold" style="font-size: 1.2em;">' + grandTotalReturn.toLocaleString() + '</div></div></div><div class="col-md-2"><div class="stat-box"><div class="stat-label fw-bold">GST</div><div class="stat-value fw-bold" style="font-size: 1.2em;">' + grandTotalGST.toLocaleString() + '</div></div></div><div class="col-md-2"><div class="stat-box"><div class="stat-label fw-bold">Net Sale</div><div class="stat-value fw-bold text-success" style="font-size: 1.3em;"><strong>' + grandTotalNetSale.toLocaleString() + '</strong></div></div></div><div class="col-md-2"><div class="stat-box"><div class="stat-label fw-bold">Transactions</div><div class="stat-value fw-bold" style="font-size: 1.2em;">' + grandTotalTransactions + '</div></div></div></div></div></div>';
      summaryCards.appendChild(grandTotalCard);
    }
    
    departmentsWithSales.forEach(function(department){ var card=document.createElement('div'); card.className='col-12 mb-4'; card.innerHTML = '<div class="card border-0 shadow-sm h-100"><div class="card-header bg-primary text-white"><div class="row align-items-center"><div class="col-md-8"><h6 class="mb-0"><i class="fas fa-building me-2"></i>' + department.name + '</h6></div><div class="col-md-4 text-end"><span class="badge bg-light text-dark">' + department.transactions.length + ' Transactions</span></div></div></div><div class="card-body"><div class="row mb-3 border-bottom pb-3"><div class="col-md-2"><div class="stat-box"><div class="stat-label">Gross Sale</div><div class="stat-value">' + (department.grossSale.toLocaleString()) + '</div></div></div><div class="col-md-2"><div class="stat-box"><div class="stat-label">Discount</div><div class="stat-value">' + (department.discount.toLocaleString()) + '</div></div></div><div class="col-md-2"><div class="stat-box"><div class="stat-label">Return</div><div class="stat-value">' + (department.returnAmount.toLocaleString()) + '</div></div></div><div class="col-md-2"><div class="stat-box"><div class="stat-label">GST</div><div class="stat-value">' + (department.gst.toLocaleString()) + '</div></div></div><div class="col-md-2"><div class="stat-box"><div class="stat-label">Net Sale</div><div class="stat-value text-success"><strong>' + (department.netSale.toLocaleString()) + '</strong></div></div></div><div class="col-md-2"><div class="stat-box"><div class="stat-label">Transactions</div><div class="stat-value">' + (department.transactions.length) + '</div></div></div></div><div class="table-responsive"><table class="table table-sm table-hover"><thead><tr><th>Date</th><th>Branch</th><th>Sub-Department</th><th>Gross</th><th>Discount</th><th>Return</th><th>GST</th><th>Net</th></tr></thead><tbody>' + department.transactions.map(function(t){ return '<tr><td>' + (typeof formatDate==='function' ? formatDate(t.date) : new Date(t.date).toLocaleDateString()) + '</td><td>' + t.branch + '</td><td>' + t.subDepartment + '</td><td class="text-end">' + t.grossSale.toLocaleString() + '</td><td class="text-end">' + t.discount.toLocaleString() + '</td><td class="text-end">' + t.returnAmount.toLocaleString() + '</td><td class="text-end">' + t.gst.toLocaleString() + '</td><td class="text-end"><strong>' + t.netSale.toLocaleString() + '</strong></td></tr>'; }).join('') + '<tr class="table-warning fw-bold" style="background-color: #fff3cd;"><td colspan="3" class="text-end"><strong>Department Total</strong></td><td class="text-end"><strong>' + department.grossSale.toLocaleString() + '</strong></td><td class="text-end"><strong>' + department.discount.toLocaleString() + '</strong></td><td class="text-end"><strong>' + department.returnAmount.toLocaleString() + '</strong></td><td class="text-end"><strong>' + department.gst.toLocaleString() + '</strong></td><td class="text-end text-success"><strong>' + department.netSale.toLocaleString() + '</strong></td></tr></tbody></table></div></div></div>'; summaryCards.appendChild(card); });
  }

  function loadDeptSalesList(page, perPage){ page = page || 1; perPage = perPage || 10; var dateFrom = document.getElementById('deptSalesListDateFrom') && document.getElementById('deptSalesListDateFrom').value || ''; var dateTo = document.getElementById('deptSalesListDateTo') && document.getElementById('deptSalesListDateTo').value || ''; var branchId = document.getElementById('deptSalesListBranch') && document.getElementById('deptSalesListBranch').value || ''; var departmentId = document.getElementById('deptSalesListDepartment') && document.getElementById('deptSalesListDepartment').value || ''; if (!dateFrom && !dateTo){ var invoicesContainer = document.getElementById('deptSalesInvoicesContainer'); var salesTableBody = document.getElementById('deptSalesListTableBody'); if (invoicesContainer) invoicesContainer.innerHTML = '<div class="text-center text-muted p-4">Please select at least one date (From or To) to view department sales list</div>'; if (salesTableBody) salesTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Please select at least one date (From or To) to view department sales list</td></tr>'; var invoicesPagination = document.getElementById('deptSalesInvoicesPagination'); var listPagination = document.getElementById('deptSalesListPagination'); if (invoicesPagination) invoicesPagination.innerHTML=''; if (listPagination) listPagination.innerHTML=''; if (typeof showNotification === 'function') showNotification('Please select at least one date (From or To) to view department sales list', 'info'); return; } var filters = {}; if (dateFrom) filters.from = dateFrom; if (dateTo) filters.to = dateTo; if (branchId) filters.branchId = branchId; if (departmentId) filters.departmentId = departmentId; api.getDepartmentSales(filters).then(function(salesData){ var sortedSales = salesData.slice().sort(function(a,b){ return new Date(b.date) - new Date(a.date); }); var grandTotals = { grossSale:0, discountAmount:0, netSale:0, returnAmount:0, gst:0 }; salesData.forEach(function(sale){ grandTotals.grossSale += sale.grossSale || 0; grandTotals.discountAmount += sale.discountAmount || 0; grandTotals.netSale += sale.netSale || 0; grandTotals.returnAmount += sale.returnAmount || 0; grandTotals.gst += sale.gst || 0; }); loadDepartmentSummary(salesData); var startIndex = (page - 1) * perPage; var endIndex = startIndex + perPage; var paginatedSales = sortedSales.slice(startIndex, endIndex); loadDeptSalesInvoices(paginatedSales); loadDeptSalesTable(paginatedSales, grandTotals); updatePagination(sortedSales.length, page, perPage, 'deptSalesInvoicesPagination', function(newPage, pp){ loadDeptSalesList(newPage, pp); }); updatePagination(sortedSales.length, page, perPage, 'deptSalesListPagination', function(newPage, pp){ loadDeptSalesList(newPage, pp); }); }).catch(function(error){ console.error('Error loading department sales list:', error); if (typeof showNotification === 'function') showNotification('Failed to load department sales list', 'error'); }); }

  window.loadDeptSalesList = loadDeptSalesList;
  window.loadDeptSalesInvoices = loadDeptSalesInvoices;
  window.loadDepartmentSummary = loadDepartmentSummary;
  window.loadDeptSalesTable = loadDeptSalesTable;
  window.updatePagination = updatePagination;
  window.generateCategoryInputs = generateCategoryInputs;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      requestAnimationFrame(initSalesSection);
    });
  } else {
    requestAnimationFrame(initSalesSection);
  }
})();
  function saveSalesEntry() {
    if (window.__savingSales) { return; }
    window.__savingSales = true;
    const date = document.getElementById('saleDate').value;
    const branchId = document.getElementById('saleBranch').value;
    const notes = document.getElementById('saleNotes').value;
    if (typeof showNotification === 'function') {
      showNotification('Saving sales...', 'info');
    }
    if (!branchId || branchId === '') {
      showNotification('Please select a branch before saving', 'error');
      document.getElementById('saleBranch').focus();
      window.__savingSales = false;
      return;
    }
    if (!date) {
      showNotification('Please select a date before saving', 'error');
      document.getElementById('saleDate').focus();
      window.__savingSales = false;
      return;
    }
    var actionBtn = document.getElementById('saveSalesButton') || document.querySelector('#salesEntryForm button[type="submit"]');
    if (actionBtn) { try { actionBtn.disabled = true; actionBtn.dataset.originalText = actionBtn.innerHTML; actionBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...'; } catch(e) {} }
    Array.prototype.forEach.call(document.querySelectorAll('#salesEntryForm input, #salesEntryForm select, #salesEntryForm button'), function(el){ try { el.disabled = true; } catch(e) {} });
    const salesPromises = [];
    document.querySelectorAll('.category-sales').forEach(function(input){
      const categoryId = input.getAttribute('data-category');
      const sales = parseFloat(input.value) || 0;
      const costInput = document.querySelector('.category-cost[data-category="' + categoryId + '"]');
      const cost = parseFloat(costInput && costInput.value) || 0;
      if (sales > 0) {
        const saleData = { date: date, branchId: branchId, categoryId: categoryId, total: sales, costTotal: cost, profit: sales - cost, notes: notes };
        if (window.api && typeof window.api.createSale === 'function') {
          salesPromises.push(window.api.createSale(saleData));
        }
      }
    });
    if (salesPromises.length === 0) {
      if (typeof showNotification === 'function') showNotification('Enter at least one category sale amount', 'warning');
      if (actionBtn) { try { actionBtn.disabled = false; actionBtn.innerHTML = actionBtn.dataset.originalText || 'Save'; } catch(e) {} }
      Array.prototype.forEach.call(document.querySelectorAll('#salesEntryForm input, #salesEntryForm select, #salesEntryForm button'), function(el){ try { el.disabled = false; } catch(e) {} });
      window.__savingSales = false;
      return;
    }
    Promise.all(salesPromises).then(function(){
      document.getElementById('salesEntryForm').reset();
      document.getElementById('totalSales').value = '';
      document.getElementById('totalCost').value = '';
      document.getElementById('totalProfit').value = '';
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('saleDate').value = today;
      showNotification('Sales entry saved successfully!', 'success');
      if (document.getElementById('dashboard-section').classList.contains('active')) { if (typeof window.loadDashboard === 'function') window.loadDashboard(); }
      if (actionBtn) { try { actionBtn.disabled = false; actionBtn.innerHTML = actionBtn.dataset.originalText || 'Save'; } catch(e) {} }
      Array.prototype.forEach.call(document.querySelectorAll('#salesEntryForm input, #salesEntryForm select, #salesEntryForm button'), function(el){ try { el.disabled = false; } catch(e) {} });
      window.__savingSales = false;
    }).catch(function(error){
      showNotification('Failed to save sales entry', 'error');
      if (actionBtn) { try { actionBtn.disabled = false; actionBtn.innerHTML = actionBtn.dataset.originalText || 'Save'; } catch(e) {} }
      Array.prototype.forEach.call(document.querySelectorAll('#salesEntryForm input, #salesEntryForm select, #salesEntryForm button'), function(el){ try { el.disabled = false; } catch(e) {} });
      window.__savingSales = false;
    });
  }

  window.saveSalesEntry = saveSalesEntry;
  window.loadBranchesForBulkSalesTab2 = loadBranchesForBulkSalesTab2;
  window.loadDepartmentsForBulkSalesTab2 = loadDepartmentsForBulkSalesTab2;
  window.loadSubDepartmentsForBulkSalesTab2 = loadSubDepartmentsForBulkSalesTab2;
