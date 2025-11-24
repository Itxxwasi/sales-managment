;(function() {
  function initSettingsSection() {
    const form = document.getElementById('settingsForm');
    if (form) {
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
      newForm.onsubmit = function(e) {
        e.preventDefault();
        if (typeof window.saveSettings === 'function') window.saveSettings();
        else if (typeof saveSettings === 'function') saveSettings();
      };
    }
    
    // Bind save settings button click handler
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
      const newBtn = saveSettingsBtn.cloneNode(true);
      saveSettingsBtn.parentNode.replaceChild(newBtn, saveSettingsBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.saveSettings === 'function') {
          window.saveSettings();
        } else if (typeof saveSettings === 'function') {
          saveSettings();
        }
      });
    }
    
    if (typeof window.loadSettings === 'function') window.loadSettings();
    else if (typeof loadSettings === 'function') loadSettings();

    
  }

  function initApiKeyEventListeners() {
    // Create API Key Button Event Listener
    const createApiKeyBtn = document.getElementById('createApiKeyBtn');
    if (createApiKeyBtn) {
      // Remove any existing listeners by cloning
      const newBtn = createApiKeyBtn.cloneNode(true);
      createApiKeyBtn.parentNode.replaceChild(newBtn, createApiKeyBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof resetApiKeyModal === 'function') {
          resetApiKeyModal();
        }
        const modalElement = document.getElementById('createApiKeyModal');
        if (modalElement) {
          try {
            // Use the same pattern as the rest of the codebase
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
          } catch (error) {
            console.error('Error opening API key modal:', error);
            // Fallback: try to get existing instance or create new
            let modal = bootstrap.Modal.getInstance(modalElement);
            if (!modal) {
              modal = new bootstrap.Modal(modalElement);
            }
            modal.show();
          }
        } else {
          console.error('API key modal element not found');
        }
      });
    }
    
    // Save API Key Button Event Listener
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    if (saveApiKeyBtn) {
      const newSaveBtn = saveApiKeyBtn.cloneNode(true);
      saveApiKeyBtn.parentNode.replaceChild(newSaveBtn, saveApiKeyBtn);
      newSaveBtn.addEventListener('click', function(e) {
        e.preventDefault();
        createApiKey();
      });
    }
    
    // Reset modal when closed
    const createApiKeyModal = document.getElementById('createApiKeyModal');
    if (createApiKeyModal) {
      createApiKeyModal.addEventListener('hidden.bs.modal', function() {
        resetApiKeyModal();
      });
    }
    
    // Backup and Restore Data Buttons
    const backupDataBtn = document.getElementById('backupDataBtn');
    if (backupDataBtn) {
      const newBackupBtn = backupDataBtn.cloneNode(true);
      backupDataBtn.parentNode.replaceChild(newBackupBtn, backupDataBtn);
      newBackupBtn.addEventListener('click', backupData);
    }
    
    const restoreDataBtn = document.getElementById('restoreDataBtn');
    if (restoreDataBtn) {
      const newRestoreBtn = restoreDataBtn.cloneNode(true);
      restoreDataBtn.parentNode.replaceChild(newRestoreBtn, restoreDataBtn);
      newRestoreBtn.addEventListener('click', function() {
        document.getElementById('restoreFile').click();
      });
    }
    
    const restoreFile = document.getElementById('restoreFile');
    if (restoreFile) {
      restoreFile.addEventListener('change', restoreData);
    }
  }

  async function loadSettings() {
    if (typeof ensureSectionViewLoaded === 'function') ensureSectionViewLoaded('settings');
    
    // Initialize API key event listeners after view is loaded
    // Wait for next tick to ensure DOM is ready
    setTimeout(() => {
      initApiKeyEventListeners();
    }, 100);
    
    if (typeof isAdmin === 'function' && !isAdmin()) { const banner = document.getElementById('permission-denied-banner-settings'); if (banner) banner.classList.remove('d-none'); return; }
    const bannerOk = document.getElementById('permission-denied-banner-settings'); if (bannerOk) bannerOk.classList.add('d-none');
    
    api.getSettings().then(settingsData => { 
      appData.settings = settingsData; 
      
      // Load Company Name
      const companyNameEl = document.getElementById('companyName'); 
      if (companyNameEl) companyNameEl.value = settingsData.companyName || 'D.Watson Group of Pharmacy'; 
      
      // Load Currency
      const currencyEl = document.getElementById('currency'); 
      if (currencyEl) currencyEl.value = settingsData.currency || ''; 
      
      // Load Date Format
      const dateFormatEl = document.getElementById('dateFormat'); 
      if (dateFormatEl) dateFormatEl.value = settingsData.dateFormat || 'DD/MM/YYYY'; 
      
      // Load Items Per Page (use itemsPerPageInput as primary)
      const itemsPerPageInputEl = document.getElementById('itemsPerPageInput');
      if (itemsPerPageInputEl) {
        itemsPerPageInputEl.value = settingsData.itemsPerPage || 20;
      }
      // Also update itemsPerPage if it exists
      const itemsPerPageEl = document.getElementById('itemsPerPage'); 
      if (itemsPerPageEl) itemsPerPageEl.value = settingsData.itemsPerPage || 10;
      
      // Load Default Cost Percent
      const defaultCostPercentEl = document.getElementById('defaultCostPercent');
      if (defaultCostPercentEl) {
        defaultCostPercentEl.value = settingsData.defaultCostPercent !== undefined ? settingsData.defaultCostPercent : 70;
      }
      
      // Load Theme
      const appThemeSelectEl = document.getElementById('appThemeSelect');
      if (appThemeSelectEl) {
        appThemeSelectEl.value = settingsData.theme || 'light';
        // Apply theme immediately when loaded
        if (typeof applyTheme === 'function') {
          applyTheme(settingsData.theme || 'light');
        }
      }

      
      if (settingsData.companyName) {
        try { localStorage.setItem('appCompanyName', settingsData.companyName); } catch(e) {}
        document.querySelectorAll('.company-name').forEach(el => { el.textContent = settingsData.companyName; });
      }
    }).catch(error => { 
      console.error('Error loading settings:', error); 
      if (typeof showNotification === 'function') showNotification('Failed to load settings: ' + error.message, 'error'); 
    }); 
    loadApiKeys();
  }

  function loadApiKeys() { 
    if (typeof isAdmin === 'function' && !isAdmin()) return; 
    api.getApiKeys().then(apiKeys => { 
      const tbody = document.getElementById('apiKeysTableBody'); 
      if (!tbody) return; 
      if (!apiKeys || apiKeys.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted"><i class="fas fa-key me-2"></i>No API keys found. Click "Create API Key" to generate one.</td></tr>'; 
        return; 
      } 
      tbody.innerHTML = apiKeys.map(key => { 
        const statusBadge = key.isActive ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Inactive</span>'; 
        const lastUsed = key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() + ' ' + new Date(key.lastUsed).toLocaleTimeString() : 'Never'; 
        const created = new Date(key.createdAt).toLocaleDateString(); 
        let expires = 'Never';
        let expiresBadge = '<span class="badge bg-secondary">Never</span>';
        if (key.expiresAt) {
          const expDate = new Date(key.expiresAt);
          expires = expDate.toLocaleDateString();
          const isExpired = expDate < new Date();
          expiresBadge = isExpired 
            ? '<span class="badge bg-danger">Expired</span>' 
            : '<span class="badge bg-warning text-dark">' + expires + '</span>';
        }
        return '<tr><td><strong>' + (key.name || 'Unnamed') + '</strong>' + (key.description ? '<br><small class="text-muted">' + key.description + '</small>' : '') + '</td><td><code class="text-primary">' + key.apiKey + '</code></td><td>' + statusBadge + '</td><td><span class="badge bg-info">' + (key.usageCount || 0) + '</span></td><td><small>' + lastUsed + '</small></td><td><small>' + created + '</small></td><td>' + expiresBadge + '</td><td><div class="btn-group btn-group-sm"><button class="btn btn-outline-primary" onclick="toggleApiKeyStatus(\'' + key._id + '\',' + key.isActive + ')" title="Toggle Status"><i class="fas fa-' + (key.isActive ? 'pause' : 'play') + '"></i></button><button class="btn btn-outline-danger" onclick="deleteApiKey(\'' + key._id + '\', \'' + (key.name || 'Unnamed').replace(/'/g, "\\'") + '\')" title="Delete"><i class="fas fa-trash"></i></button></div></td></tr>'; 
      }).join(''); 
    }).catch(error => { 
      console.error('Error loading API keys:', error); 
      const tbody = document.getElementById('apiKeysTableBody'); 
      if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Error loading API keys: ' + error.message + '</td></tr>'; 
    }); 
  }

  async function createApiKey() { 
    const name = document.getElementById('apiKeyName').value.trim(); 
    const description = document.getElementById('apiKeyDescription').value.trim(); 
    const expiresAt = document.getElementById('apiKeyExpiresAt').value; 
    if (!name) { 
      if (typeof showNotification === 'function') showNotification('API key name is required', 'error'); 
      return; 
    } 
    const btn = document.getElementById('saveApiKeyBtn'); 
    try { 
      btn.disabled = true; 
      btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creating...'; 
      const apiKeyData = { name, description: description || '', expiresAt: expiresAt || null }; 
      const result = await api.createApiKey(apiKeyData); 
      document.getElementById('apiKeyForm').style.display = 'none'; 
      document.getElementById('apiKeyResult').classList.remove('d-none'); 
      document.getElementById('generatedApiKey').value = result.apiKey; 
      document.getElementById('generatedApiSecret').value = result.apiSecret; 
      btn.innerHTML = '<i class="fas fa-check me-2"></i>Created!'; 
      loadApiKeys(); 
      if (typeof showNotification === 'function') showNotification('API key created successfully! Save the credentials now.', 'success'); 
    } catch (error) { 
      console.error('Error creating API key:', error); 
      if (typeof showNotification === 'function') showNotification('Failed to create API key: ' + error.message, 'error'); 
      btn.disabled = false; 
      btn.innerHTML = '<i class="fas fa-plus me-2"></i>Create API Key'; 
    } 
  }

  async function toggleApiKeyStatus(id, currentStatus) { 
    if (!confirm('Are you sure you want to ' + (currentStatus ? 'deactivate' : 'activate') + ' this API key?')) return; 
    try { 
      await api.updateApiKey(id, { isActive: !currentStatus }); 
      if (typeof showNotification === 'function') showNotification('API key ' + (currentStatus ? 'deactivated' : 'activated') + ' successfully', 'success'); 
      loadApiKeys(); 
    } catch (error) { 
      console.error('Error updating API key:', error); 
      if (typeof showNotification === 'function') showNotification('Failed to update API key: ' + error.message, 'error'); 
    } 
  }

  async function deleteApiKey(id, name) { 
    if (!confirm('Are you sure you want to delete the API key "' + name + '"? This action cannot be undone.')) return; 
    try { 
      await api.deleteApiKey(id); 
      if (typeof showNotification === 'function') showNotification('API key deleted successfully', 'success'); 
      loadApiKeys(); 
    } catch (error) { 
      console.error('Error deleting API key:', error); 
      if (typeof showNotification === 'function') showNotification('Failed to delete API key: ' + error.message, 'error'); 
    } 
  }

  function copyToClipboard(elementId) { 
    const element = document.getElementById(elementId); 
    element.select(); 
    element.setSelectionRange(0, 99999); 
    document.execCommand('copy'); 
    if (typeof showNotification === 'function') showNotification('Copied to clipboard!', 'success'); 
  }

  function resetApiKeyModal() { 
    document.getElementById('apiKeyForm').reset(); 
    document.getElementById('apiKeyForm').style.display = 'block'; 
    document.getElementById('apiKeyResult').classList.add('d-none'); 
    const btn = document.getElementById('saveApiKeyBtn'); 
    btn.disabled = false; 
    btn.innerHTML = '<i class="fas fa-plus me-2"></i>Create API Key'; 
  }

  async function saveSettings() { 
    if (typeof isAdmin === 'function' && !isAdmin()) { 
      if (typeof showNotification === 'function') showNotification('You need admin privileges to update settings', 'error'); 
      return; 
    } 
    
    // Get all form elements
    const companyNameEl = document.getElementById('companyName');
    const currencyEl = document.getElementById('currency');
    const dateFormatEl = document.getElementById('dateFormat');
    const itemsPerPageInputEl = document.getElementById('itemsPerPageInput');
    const itemsPerPageEl = document.getElementById('itemsPerPage');
    const defaultCostPercentEl = document.getElementById('defaultCostPercent');
    const appThemeSelectEl = document.getElementById('appThemeSelect');
    
    // Validate default cost percent
    let defaultCostPercent = defaultCostPercentEl ? parseFloat(defaultCostPercentEl.value) : 70;
    if (isNaN(defaultCostPercent) || defaultCostPercent < 0 || defaultCostPercent > 100) {
      if (typeof showNotification === 'function') {
        showNotification('Default Cost Percent must be a number between 0 and 100', 'error');
      }
      return;
    }
    
    // Get items per page (prefer itemsPerPageInput, fallback to itemsPerPage)
    const itemsPerPage = itemsPerPageInputEl ? parseInt(itemsPerPageInputEl.value) : (itemsPerPageEl ? parseInt(itemsPerPageEl.value) : 20);
    
    // Validate items per page
    if (isNaN(itemsPerPage) || itemsPerPage < 10 || itemsPerPage > 200) {
      if (typeof showNotification === 'function') {
        showNotification('Items Per Page must be a number between 10 and 200', 'error');
      }
      return;
    }
    
    const settingsData = { 
      companyName: companyNameEl ? companyNameEl.value.trim() : 'D.Watson Group of Pharmacy',
      currency: currencyEl ? currencyEl.value : '',
      dateFormat: dateFormatEl ? dateFormatEl.value : 'DD/MM/YYYY',
      itemsPerPage: itemsPerPage,
      defaultCostPercent: defaultCostPercent,
      theme: appThemeSelectEl ? appThemeSelectEl.value : 'light'
    }; 
    
    // Show loading notification
    if (typeof showNotification === 'function') {
      showNotification('Saving settings...', 'info');
    }
    
    try {
      const savedSettings = await api.updateSettings(settingsData);
      appData.settings = savedSettings;
      if (settingsData.theme && typeof applyTheme === 'function') {
        applyTheme(settingsData.theme);
      }
      
      if (settingsData.companyName) {
        document.querySelectorAll('.company-name').forEach(el => { el.textContent = settingsData.companyName; });
      }
      if (typeof showNotification === 'function') {
        showNotification('Settings saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      if (typeof showNotification === 'function') {
        showNotification('Failed to save settings: ' + (error.message || error), 'error');
      }
    }
  }

  function backupData() {
    Promise.all([
      api.getSales(),
      api.getDepartmentSales(),
      api.getPayments('/payments'),
      api.getCategoryPayments(),
      api.getSuppliers(),
      api.getBranches(),
      api.getCategories(),
      api.getGroups(),
      api.getUsers(),
      api.getSettings(),
      api.getDepartments(),
      api.getSubDepartments(),
      api.getEmployees(),
      api.getEmployeeDepartments(),
      api.getEmployeeDesignations()
    ]).then(([
      salesData,
      departmentSalesData,
      paymentsData,
      categoryPaymentsData,
      suppliersData,
      branchesData,
      categoriesData,
      groupsData,
      usersData,
      settingsData,
      departmentsData,
      subDepartmentsData,
      employeesData,
      employeeDepartmentsData,
      employeeDesignationsData
    ]) => {
      const backup = {
        salesData,
        departmentSalesData,
        paymentsData,
        categoryPaymentsData,
        suppliersData,
        branchesData,
        categoriesData,
        groupsData,
        usersData,
        settingsData,
        departmentsData,
        subDepartmentsData,
        employeesData,
        employeeDepartmentsData,
        employeeDesignationsData,
        timestamp: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'backup_' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      window.URL.revokeObjectURL(url);
      if (typeof showNotification === 'function') showNotification('Data backed up successfully!', 'success');
    }).catch(error => {
      console.error('Error backing up data:', error);
      if (typeof showNotification === 'function') showNotification('Failed to backup data: ' + (error.message || error), 'error');
    });
  }

  async function restoreData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(event) {
      try {
        // Parse the backup JSON file
        const backup = JSON.parse(event.target.result);
        
        // Validate backup structure
        if (!backup || typeof backup !== 'object') {
          if (typeof showNotification === 'function') {
            showNotification('Invalid backup file format', 'error');
          }
          e.target.value = '';
          return;
        }
        
        // Show confirmation dialog
        const confirmed = confirm(
          '⚠️ WARNING: Restoring this backup will REPLACE ALL existing data!\n\n' +
          'This includes:\n' +
          '- All sales records\n' +
          '- Department-wise sales records\n' +
          '- Supplier payment vouchers\n' +
          '- Category payment vouchers\n' +
          '- All branches\n' +
          '- All categories\n' +
          '- All suppliers\n' +
          '- All departments and sub-departments\n' +
          '- All users and groups\n' +
          '- All settings\n\n' +
          'This action cannot be undone. Are you sure you want to continue?'
        );
        
        if (!confirmed) {
          e.target.value = '';
          return;
        }
        
        // Show loading notification
        if (typeof showNotification === 'function') {
          showNotification('Restoring data... This may take a moment.', 'info');
        }
        
        // Send backup data to server
        const response = await api.restoreData(backup);
        
        if (response.success) {
          const restoredInfo = response.restored;
          const message = `Data restored successfully!\n\n` +
            `Restored:\n` +
            `- Settings: ${restoredInfo.settings}\n` +
            `- Groups: ${restoredInfo.groups}\n` +
            `- Branches: ${restoredInfo.branches}\n` +
            `- Categories: ${restoredInfo.categories}\n` +
            `- Suppliers: ${restoredInfo.suppliers || 0}\n` +
            `- Supplier Payments: ${restoredInfo.payments || 0}\n` +
            `- Category Payments: ${restoredInfo.categoryPayments || 0}\n` +
            `- Users: ${restoredInfo.users}\n` +
            `- Departments: ${restoredInfo.departments || 0}\n` +
            `- Sub-Departments: ${restoredInfo.subDepartments || 0}\n` +
            `- Department Sales: ${restoredInfo.departmentSales || 0}\n` +
            `- Sales: ${restoredInfo.sales}\n\n` +
            `Backup timestamp: ${response.timestamp || 'Unknown'}`;
          
          if (typeof showNotification === 'function') {
            showNotification(message, 'success');
          }
          
          // Reload the page after a short delay to refresh all data
          setTimeout(() => {
            if (confirm('Page will reload to refresh all data. Click OK to continue.')) {
              window.location.reload();
            }
          }, 2000);
        } else {
          throw new Error(response.message || 'Restore failed');
        }
        
      } catch (error) {
        console.error('Error restoring data:', error);
        const errorMessage = error.message || 'Failed to restore data. Please check the file format and try again.';
        if (typeof showNotification === 'function') {
          showNotification('Error: ' + errorMessage, 'error');
        }
      } finally {
        // Reset file input
        e.target.value = '';
      }
    };
    
    reader.onerror = function() {
      if (typeof showNotification === 'function') {
        showNotification('Error reading file', 'error');
      }
      e.target.value = '';
    };
    
    reader.readAsText(file);
  }

  window.loadSettings = loadSettings;
  window.saveSettings = saveSettings;
  window.loadApiKeys = loadApiKeys;
  window.createApiKey = createApiKey;
  window.toggleApiKeyStatus = toggleApiKeyStatus;
  window.deleteApiKey = deleteApiKey;
  window.copyToClipboard = copyToClipboard;
  window.resetApiKeyModal = resetApiKeyModal;
  window.backupData = backupData;
  window.restoreData = restoreData;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      requestAnimationFrame(initSettingsSection);
    });
  } else {
    requestAnimationFrame(initSettingsSection);
  }
})();
