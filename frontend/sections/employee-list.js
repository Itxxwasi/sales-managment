;(function() {
  let allEmployees = [];
  let filteredEmployees = [];

  function initEmployeeListSection() {
    // Check if section is visible
    const section = document.getElementById('employee-list-section');
    if (!section || section.style.display === 'none') {
      return;
    }
    
    // Check permissions
    if (typeof hasPermission === 'function' && !hasPermission('employees')) {
      const banner = document.getElementById('permission-denied-banner-employee-list');
      if (banner) banner.classList.remove('d-none');
      return;
    }
    
    const bannerOk = document.getElementById('permission-denied-banner-employee-list');
    if (bannerOk) bannerOk.classList.add('d-none');
    
    // Use the exact same approach as employees.js - call load functions directly
    // Load branches, departments, and designations just like employees.js does
    loadEmployeeListBranches();
    loadEmployeeListDepartments();
    loadEmployeeListDesignations();
    
    // Auto-load employee list on page load
    loadEmployeeListPage();
    
    // Update user info in header
    updateEmployeeListUserInfo();
    
    // Setup auto-search on filter changes and search field
    setTimeout(() => {
      setupAutoSearchOnFilters();
    }, 500);
  }

  function setupAutoSearchOnFilters() {
    // Auto-search when filters change
    const branchFilter = document.getElementById('employeeListBranchFilter');
    const deptFilter = document.getElementById('employeeListDepartmentFilter');
    const desigFilter = document.getElementById('employeeListDesignationFilter');
    const religionFilter = document.getElementById('employeeListReligionFilter');
    const employeeFilter = document.getElementById('employeeListEmployeeFilter');
    const globalSearch = document.getElementById('employeeListGlobalSearch');

    const triggerSearch = debounce(() => {
      performSearch();
    }, 300);

    if (branchFilter) branchFilter.addEventListener('change', triggerSearch);
    if (deptFilter) deptFilter.addEventListener('change', triggerSearch);
    if (desigFilter) desigFilter.addEventListener('change', triggerSearch);
    if (religionFilter) religionFilter.addEventListener('change', triggerSearch);
    if (employeeFilter) employeeFilter.addEventListener('change', triggerSearch);
    if (globalSearch) globalSearch.addEventListener('input', triggerSearch);
  }

  function updateEmployeeListUserInfo() {
    // Get current user info from appData
    if (typeof appData !== 'undefined' && appData.currentUser) {
      const user = appData.currentUser;
      const userName = user.name || user.username || 'User';
      const userInitial = userName.charAt(0).toUpperCase();
      
      const userNameEl = document.getElementById('employeeListUserName');
      const userInitialEl = document.getElementById('employeeListUserInitial');
      
      if (userNameEl) userNameEl.textContent = userName;
      if (userInitialEl) userInitialEl.textContent = userInitial;
    }
  }

  // Debounce function to limit search frequency
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  let autoSearchSetup = false;

  function setupAutoSearch() {
    // Prevent duplicate event listeners
    if (autoSearchSetup) return;
    
    // Auto-search for Emp Code
    const codeFilter = document.getElementById('employeeListCodeFilter');
    if (codeFilter && !codeFilter.hasAttribute('data-autosearch-setup')) {
      const debouncedCodeSearch = debounce(() => {
        searchEmployeeList();
      }, 300); // Wait 300ms after user stops typing
      
      codeFilter.addEventListener('input', debouncedCodeSearch);
      codeFilter.setAttribute('data-autosearch-setup', 'true');
    }

    // Auto-search for Emp Name
    const nameFilter = document.getElementById('employeeListNameFilter');
    if (nameFilter && !nameFilter.hasAttribute('data-autosearch-setup')) {
      const debouncedNameSearch = debounce(() => {
        searchEmployeeList();
      }, 300); // Wait 300ms after user stops typing
      
      nameFilter.addEventListener('input', debouncedNameSearch);
      nameFilter.setAttribute('data-autosearch-setup', 'true');
    }
    
    autoSearchSetup = true;
  }

  function loadFilterDropdowns() {
    // Use the exact same approach as employees.js - call functions directly
    // No need for Promise.all, just call them like employees.js does
    loadEmployeeListBranches();
    loadEmployeeListDepartments();
    loadEmployeeListDesignations();
  }

  function loadEmployeeListBranches() {
    const selector = document.getElementById('employeeListBranchFilter');
    if (!selector) {
      console.warn('Branch selector not found');
      return Promise.resolve();
    }
    
    // Use the exact same pattern as employees.js - api is available in closure
    // Add a small delay to ensure API is ready
    setTimeout(() => {
      selector.innerHTML = '<option value="">Select Branch</option>';
      selector.disabled = true;
      
      api.getBranches()
      .then(branches => {
        // Clear and add options
        selector.innerHTML = '<option value="">Select Branch</option>';
        
        if (branches && branches.length > 0) {
          // Sort branches by name
          const sortedBranches = [...branches].sort((a, b) => 
            (a.name || '').localeCompare(b.name || '')
          );
          
          sortedBranches.forEach(branch => {
            if (branch && branch._id && branch.name) {
              const option = document.createElement('option');
              option.value = branch._id;
              option.textContent = branch.name;
              selector.appendChild(option);
            }
          });
          
          console.log('Loaded', sortedBranches.length, 'branches in employee list filter');
        } else {
          console.warn('No branches found');
          selector.innerHTML = '<option value="">No branches found</option>';
        }
        
        selector.disabled = false;
        return branches;
      })
      .catch(error => {
        console.error('Error loading branches:', error);
        selector.innerHTML = '<option value="">Error loading branches</option>';
        selector.disabled = false;
        return [];
      });
    }, 100);
    return Promise.resolve();
  }

  function loadEmployeeListDepartments() {
    const selector = document.getElementById('employeeListDepartmentFilter');
    if (!selector) {
      console.warn('Department selector not found');
      return Promise.resolve();
    }
    
    // Use the exact same pattern as employees.js - api is available in closure
    // Add a small delay to ensure API is ready
    setTimeout(() => {
      selector.innerHTML = '<option value="">Select Department</option>';
      selector.disabled = true;
      
      api.getEmployeeDepartments()
      .then(departments => {
        selector.innerHTML = '<option value="">Select Department</option>';
        
        if (departments && departments.length > 0) {
          const activeDepts = departments
            .filter(dept => dept.isActive !== false)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          
          activeDepts.forEach(dept => {
            if (dept && dept._id && dept.name) {
              const option = document.createElement('option');
              option.value = dept._id;
              option.textContent = dept.name;
              selector.appendChild(option);
            }
          });
          
          console.log('Loaded', activeDepts.length, 'departments in employee list filter');
        } else {
          selector.innerHTML = '<option value="">No departments found</option>';
        }
        
        selector.disabled = false;
        return departments;
      })
      .catch(error => {
        console.error('Error loading departments:', error);
        selector.innerHTML = '<option value="">Error loading departments</option>';
        selector.disabled = false;
        return [];
      });
    }, 100);
    return Promise.resolve();
  }

  function loadEmployeeListDesignations() {
    const selector = document.getElementById('employeeListDesignationFilter');
    if (!selector) {
      console.warn('Designation selector not found');
      return Promise.resolve();
    }
    
    // Use the exact same pattern as employees.js - api is available in closure
    // Add a small delay to ensure API is ready
    setTimeout(() => {
      selector.innerHTML = '<option value="">Select Designation</option>';
      selector.disabled = true;
      
      api.getEmployeeDesignations()
      .then(designations => {
        selector.innerHTML = '<option value="">Select Designation</option>';
        
        if (designations && designations.length > 0) {
          const activeDesigs = designations
            .filter(desig => desig.isActive !== false)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          
          activeDesigs.forEach(desig => {
            if (desig && desig._id && desig.name) {
              const option = document.createElement('option');
              option.value = desig._id;
              option.textContent = desig.name;
              selector.appendChild(option);
            }
          });
          
          console.log('Loaded', activeDesigs.length, 'designations in employee list filter');
        } else {
          selector.innerHTML = '<option value="">No designations found</option>';
        }
        
        selector.disabled = false;
        return designations;
      })
      .catch(error => {
        console.error('Error loading designations:', error);
        selector.innerHTML = '<option value="">Error loading designations</option>';
        selector.disabled = false;
        return [];
      });
    }, 100);
    return Promise.resolve();
  }

  function loadEmployeeListPage() {
    if (typeof hasPermission === 'function' && !hasPermission('employees')) {
      if (typeof showNotification === 'function') {
        showNotification('You do not have permission to view employees', 'error');
      }
      return Promise.resolve();
    }

    // Use the exact same pattern as employees.js - api is available in closure
    // Add a small delay to ensure API is ready
    const tableBody = document.getElementById('employeeListTableBody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="18" class="text-center text-muted py-4">Loading employees...</td></tr>';
    }

    // Wait a bit for API to be ready, then load
    return new Promise((resolve) => {
      setTimeout(() => {
        api.getEmployees()
          .then(employees => {
            allEmployees = employees;
            filteredEmployees = employees;
            // Auto-render the list after loading
            renderEmployeeList(employees);
            resolve(employees);
          })
          .catch(error => {
            console.error('Error loading employees:', error);
            if (tableBody) {
              tableBody.innerHTML = '<tr><td colspan="18" class="text-center text-danger py-4">Error loading employees</td></tr>';
            }
            if (typeof showNotification === 'function') {
              showNotification('Failed to load employees: ' + (error.message || 'Unknown error'), 'error');
            }
            resolve([]);
          });
      }, 200);
    });
  }

  function searchEmployeeList() {
    // This function is kept for backward compatibility but now just calls performSearch
    performSearch();
  }

  function performSearch() {
    // If employees not loaded yet, load them first
    if (allEmployees.length === 0) {
      loadEmployeeListPage().then(() => {
        performSearch();
      });
      return;
    }

    const branchFilter = document.getElementById('employeeListBranchFilter')?.value || '';
    const departmentFilter = document.getElementById('employeeListDepartmentFilter')?.value || '';
    const designationFilter = document.getElementById('employeeListDesignationFilter')?.value || '';
    const religionFilter = document.getElementById('employeeListReligionFilter')?.value || '';
    const employeeFilter = document.getElementById('employeeListEmployeeFilter')?.value || '';
    const globalSearch = (document.getElementById('employeeListGlobalSearch')?.value || '').toLowerCase().trim();

    filteredEmployees = allEmployees.filter(emp => {
      // Branch filter
      if (branchFilter && emp.branchId?._id !== branchFilter && emp.branchId !== branchFilter) return false;
      
      // Department filter
      if (departmentFilter && emp.departmentId?._id !== departmentFilter && emp.departmentId !== departmentFilter) return false;
      
      // Designation filter
      if (designationFilter && emp.designationId?._id !== designationFilter && emp.designationId !== designationFilter) return false;
      
      // Religion filter
      if (religionFilter && emp.religion !== religionFilter) return false;
      
      // Employee type filter
      if (employeeFilter) {
        if (employeeFilter === 'commission' && !emp.commEmp) return false;
        // Add more employee type filters as needed
      }
      
      // Global search - search across all fields
      if (globalSearch) {
        const searchableText = [
          emp.code || '',
          emp.name || '',
          emp.fatherMother || '',
          emp.cnic || '',
          emp.mobileNo || '',
          emp.address || '',
          emp.accNo || '',
          emp.bankName || '',
          emp.branchId?.name || emp.branchId || '',
          emp.departmentId?.name || emp.departmentId || '',
          emp.designationId?.name || emp.designationId || emp.designation || ''
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(globalSearch)) return false;
      }
      
      return true;
    });

    renderEmployeeList(filteredEmployees);
    
    // Show notification only if there's a search/filter applied
    const hasFilter = branchFilter || departmentFilter || designationFilter || religionFilter || employeeFilter || globalSearch;
    if (hasFilter && typeof showNotification === 'function') {
      showNotification(`Found ${filteredEmployees.length} employee(s)`, 'info');
    }
  }

  function clearEmployeeListFilters() {
    document.getElementById('employeeListBranchFilter').value = '';
    document.getElementById('employeeListDepartmentFilter').value = '';
    document.getElementById('employeeListDesignationFilter').value = '';
    document.getElementById('employeeListReligionFilter').value = '';
    document.getElementById('employeeListEmployeeFilter').value = '';
    document.getElementById('employeeListGlobalSearch').value = '';
    
    // Show all employees after clearing filters
    filteredEmployees = allEmployees;
    renderEmployeeList(filteredEmployees);
    
    if (typeof showNotification === 'function') {
      showNotification('Filters cleared', 'info');
    }
  }

  function renderEmployeeList(employees) {
    const tableBody = document.getElementById('employeeListTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (employees.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="18" class="text-center text-muted py-4">No employees found</td></tr>';
      return;
    }

    // Get all branches, departments, designations for dropdowns
    const branches = [];
    const departments = [];
    const designations = [];

    // Collect unique values
    employees.forEach(emp => {
      if (emp.branchId && !branches.find(b => (b._id || b) === (emp.branchId._id || emp.branchId))) {
        branches.push(emp.branchId);
      }
      if (emp.departmentId && !departments.find(d => (d._id || d) === (emp.departmentId._id || emp.departmentId))) {
        departments.push(emp.departmentId);
      }
      if (emp.designationId && !designations.find(d => (d._id || d) === (emp.designationId._id || emp.designationId))) {
        designations.push(emp.designationId);
      }
    });

    employees.forEach((employee, index) => {
      const row = document.createElement('tr');
      const branchName = employee.branchId?.name || employee.branchId || '(F-6)';
      const branchId = employee.branchId?._id || employee.branchId || '';
      const deptName = employee.departmentId?.name || employee.departmentId || '';
      const deptId = employee.departmentId?._id || employee.departmentId || '';
      const desigName = employee.designationId?.name || employee.designation || '';
      const desigId = employee.designationId?._id || employee.designationId || '';
      const bankName = employee.bankName || '';
      const incrDate = employee.incrDate ? new Date(employee.incrDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
      const totalHrs = employee.totalHrs || 0;
      const salary = employee.salary || 0;
      const commission = employee.commission || 0;
      const fixAllowance = employee.fixAllowance || 0;
      const stLessAllowance = employee.stLessAllowance || 0;
      const cnic = employee.cnic || '-';
      const accNo = employee.accNo || '(Select)';

      // Build branch dropdown options - will be populated async
      let branchOptions = `<option value="">(F-6)</option>`;

      // Build department dropdown options - will be populated async
      let deptOptions = `<option value="">Select Department</option>`;

      // Build designation dropdown options - will be populated async
      let desigOptions = `<option value="">Select Designation</option>`;

      // Bank dropdown
      const bankOptions = `
        <option value="">(Select)</option>
        <option value="HBL" ${bankName === 'HBL' ? 'selected' : ''}>HBL</option>
        <option value="ALF" ${bankName === 'ALF' ? 'selected' : ''}>ALF</option>
        <option value="BOP" ${bankName === 'BOP' ? 'selected' : ''}>BOP</option>
        <option value="BIP" ${bankName === 'BIP' ? 'selected' : ''}>BIP</option>
        <option value="BAHL" ${bankName === 'BAHL' ? 'selected' : ''}>BAHL</option>
      `;

      row.innerHTML = `
        <td>${index + 1}</td>
        <td>
          <div class="d-flex align-items-center gap-1">
            <input type="text" class="form-control form-control-sm" value="${employee.code || ''}" 
                   style="width: 80px; background-color: #e9ecef; cursor: not-allowed;" 
                   data-field="code" data-id="${employee._id}" readonly>
            <button class="btn btn-primary btn-sm" onclick="editEmployeeFromList('${employee._id}')" title="Edit Full Details">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </td>
        <td>
          <select class="form-select form-select-sm" data-field="branchId" data-id="${employee._id}" 
                  style="background-color: #e9ecef; cursor: not-allowed;" disabled>
            ${branchOptions}
          </select>
        </td>
        <td>${employee.name || 'N/A'}</td>
        <td>${cnic}</td>
        <td>
          <select class="form-select form-select-sm" data-field="designationId" data-id="${employee._id}" 
                  style="background-color: #e9ecef; cursor: not-allowed;" disabled>
            ${desigOptions}
          </select>
        </td>
        <td>
          <select class="form-select form-select-sm" data-field="departmentId" data-id="${employee._id}" 
                  style="background-color: #e9ecef; cursor: not-allowed;" disabled>
            ${deptOptions}
          </select>
        </td>
        <td>
          <input type="text" class="form-control form-control-sm" value="${accNo}" 
                 data-field="accNo" data-id="${employee._id}"
                 style="background-color: #e9ecef; cursor: not-allowed;" readonly>
        </td>
        <td>
          <select class="form-select form-select-sm" data-field="bankName" data-id="${employee._id}" 
                  style="background-color: #e9ecef; cursor: not-allowed;" disabled>
            ${bankOptions}
          </select>
        </td>
        <td>
          <input type="number" class="form-control form-control-sm" value="${totalHrs}" 
                 data-field="totalHrs" data-id="${employee._id}" style="width: 80px; background-color: #e9ecef; cursor: not-allowed;" readonly>
        </td>
        <td>${incrDate}</td>
        <td>
          <input type="number" class="form-control form-control-sm" value="${salary}" 
                 data-field="salary" data-id="${employee._id}" style="width: 100px; background-color: #e9ecef; cursor: not-allowed;" readonly>
        </td>
        <td>
          <input type="number" class="form-control form-control-sm" value="${commission}" 
                 data-field="commission" data-id="${employee._id}" style="width: 100px; background-color: #e9ecef; cursor: not-allowed;" readonly>
        </td>
        <td>
          <input type="number" class="form-control form-control-sm" value="${fixAllowance}" 
                 data-field="fixAllowance" data-id="${employee._id}" style="width: 100px; background-color: #e9ecef; cursor: not-allowed;" readonly>
        </td>
        <td>
          <input type="number" class="form-control form-control-sm" value="${stLessAllowance}" 
                 data-field="stLessAllowance" data-id="${employee._id}" style="width: 100px; background-color: #e9ecef; cursor: not-allowed;" readonly>
        </td>
        <td class="text-center">
          <input type="checkbox" class="form-check-input" ${employee.isActive !== false ? 'checked' : ''} 
                 data-field="isActive" data-id="${employee._id}" 
                 style="cursor: not-allowed;" disabled>
        </td>
        <td class="text-center">
          <input type="checkbox" class="form-check-input" ${employee.pfstb ? 'checked' : ''} 
                 data-field="pfstb" data-id="${employee._id}" 
                 style="cursor: not-allowed;" disabled>
        </td>
        <td class="text-center">
          <input type="checkbox" class="form-check-input" ${employee.eobi ? 'checked' : ''} 
                 data-field="eobi" data-id="${employee._id}" 
                 style="cursor: not-allowed;" disabled>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Load branch, department and designation options asynchronously
    setTimeout(() => {
      // Use the exact same pattern as employees.js - api is available in closure
      // Populate branch dropdowns
      api.getBranches().then(allBranches => {
        document.querySelectorAll('[data-field="branchId"]').forEach(select => {
          const empId = select.getAttribute('data-id');
          const employee = employees.find(e => e._id === empId);
          if (employee) {
            const branchId = employee.branchId?._id || employee.branchId || '';
            select.innerHTML = '<option value="">(F-6)</option>';
            allBranches.forEach(branch => {
              const option = document.createElement('option');
              option.value = branch._id;
              option.textContent = branch.name;
              if (branch._id === branchId) option.selected = true;
              select.appendChild(option);
            });
          }
        });
      }).catch(err => console.error('Error loading branches:', err));
      
      // Populate department dropdowns
      api.getEmployeeDepartments().then(depts => {
        document.querySelectorAll('[data-field="departmentId"]').forEach(select => {
          const empId = select.getAttribute('data-id');
          const employee = employees.find(e => e._id === empId);
          if (employee) {
            const deptId = employee.departmentId?._id || employee.departmentId || '';
            select.innerHTML = '<option value="">Select Department</option>';
            depts.forEach(dept => {
              const option = document.createElement('option');
              option.value = dept._id;
              option.textContent = dept.name;
              if (dept._id === deptId) option.selected = true;
              select.appendChild(option);
            });
          }
        });
      }).catch(err => console.error('Error loading departments:', err));
      
      // Populate designation dropdowns
      api.getEmployeeDesignations().then(desigs => {
        document.querySelectorAll('[data-field="designationId"]').forEach(select => {
          const empId = select.getAttribute('data-id');
          const employee = employees.find(e => e._id === empId);
          if (employee) {
            const desigId = employee.designationId?._id || employee.designationId || '';
            select.innerHTML = '<option value="">Select Designation</option>';
            desigs.forEach(desig => {
              const option = document.createElement('option');
              option.value = desig._id;
              option.textContent = desig.name;
              if (desig._id === desigId) option.selected = true;
              select.appendChild(option);
            });
          }
        });
      }).catch(err => console.error('Error loading designations:', err));
    }, 500);
  }

  // Store pending changes
  const pendingChanges = {};

  function updateEmployeeField(employeeId, field, value) {
    if (!pendingChanges[employeeId]) {
      pendingChanges[employeeId] = {};
    }
    pendingChanges[employeeId][field] = value;
  }

  function saveEmployeeRow(employeeId) {
    const changes = { ...pendingChanges[employeeId] };
    
    // Get values from all input fields in the row
    const row = document.querySelector(`tr [data-id="${employeeId}"]`)?.closest('tr');
    if (row) {
      row.querySelectorAll('[data-field][data-id="' + employeeId + '"]').forEach(input => {
        const field = input.getAttribute('data-field');
        if (input.type === 'checkbox') {
          changes[field] = input.checked;
        } else if (input.type === 'number') {
          const val = parseFloat(input.value);
          changes[field] = isNaN(val) ? 0 : val;
        } else if (input.tagName === 'SELECT') {
          changes[field] = input.value;
        } else {
          changes[field] = input.value.trim();
        }
      });
    }

    // Get the employee first to merge changes
    api.getEmployee(employeeId)
      .then(employee => {
        // Merge changes with existing employee data
        const updatedData = {
          code: changes.code !== undefined ? changes.code : employee.code,
          branchId: changes.branchId !== undefined ? changes.branchId : (employee.branchId?._id || employee.branchId),
          departmentId: changes.departmentId !== undefined ? changes.departmentId : (employee.departmentId?._id || employee.departmentId),
          designationId: changes.designationId !== undefined ? changes.designationId : (employee.designationId?._id || employee.designationId),
          accNo: changes.accNo !== undefined ? changes.accNo : employee.accNo,
          bankName: changes.bankName !== undefined ? changes.bankName : employee.bankName,
          totalHrs: changes.totalHrs !== undefined ? changes.totalHrs : employee.totalHrs,
          salary: changes.salary !== undefined ? changes.salary : employee.salary,
          commission: changes.commission !== undefined ? changes.commission : employee.commission,
          fixAllowance: changes.fixAllowance !== undefined ? changes.fixAllowance : employee.fixAllowance,
          stLessAllowance: changes.stLessAllowance !== undefined ? changes.stLessAllowance : employee.stLessAllowance,
          isActive: changes.isActive !== undefined ? changes.isActive : employee.isActive,
          pfstb: changes.pfstb !== undefined ? changes.pfstb : employee.pfstb,
          eobi: changes.eobi !== undefined ? changes.eobi : employee.eobi
        };
        
        return api.updateEmployee(employeeId, updatedData);
      })
      .then(() => {
        delete pendingChanges[employeeId];
        if (typeof showNotification === 'function') {
          showNotification('Employee updated successfully!', 'success');
        }
        // Reload the list
        loadEmployeeListPage();
      })
      .catch(error => {
        console.error('Error saving employee:', error);
        if (typeof showNotification === 'function') {
          showNotification('Failed to save employee: ' + (error.message || 'Unknown error'), 'error');
        }
      });
  }

  function printEmployeeList() {
    window.print();
  }

  function showEmployeeRanking() {
    if (typeof showNotification === 'function') {
      showNotification('Employee Ranking feature coming soon', 'info');
    }
  }

  function editEmployeeFromList(employeeId) {
    // Navigate to employees section first
    if (typeof showSection === 'function') {
      showSection('employees');
      // Wait for section to fully load, then call editEmployee
      // Increased delay to ensure all dropdowns are ready
      setTimeout(() => {
        if (typeof editEmployee === 'function') {
          editEmployee(employeeId);
        }
      }, 600);
    } else if (typeof editEmployee === 'function') {
      // Fallback if showSection is not available
      editEmployee(employeeId);
    }
  }

  // Expose functions globally
  window.loadEmployeeListPage = loadEmployeeListPage;
  window.searchEmployeeList = searchEmployeeList;
  window.clearEmployeeListFilters = clearEmployeeListFilters;
  window.printEmployeeList = printEmployeeList;
  window.showEmployeeRanking = showEmployeeRanking;
  window.saveEmployeeRow = saveEmployeeRow;
  window.updateEmployeeField = updateEmployeeField;
  window.editEmployeeFromList = editEmployeeFromList;

  // Expose init function for showSection to call
  window.initEmployeeListSection = initEmployeeListSection;

  // Auto-initialize when section is shown
  // Listen for section activation
  const observer = new MutationObserver(() => {
    const section = document.getElementById('employee-list-section');
    if (section && section.classList.contains('active') && section.style.display !== 'none') {
      initEmployeeListSection();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const section = document.getElementById('employee-list-section');
      if (section) {
        observer.observe(section, { attributes: true, attributeFilter: ['class', 'style'] });
      }
    });
  } else {
    const section = document.getElementById('employee-list-section');
    if (section) {
      observer.observe(section, { attributes: true, attributeFilter: ['class', 'style'] });
    }
  }
})();

