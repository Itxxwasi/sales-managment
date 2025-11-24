;(function() {
  let currentEmployeeId = null;

  function initEmployeesSection() {
    if (typeof ensureSectionViewLoaded === 'function') {
      ensureSectionViewLoaded('employees');
    }
    
    // Check permissions
    if (typeof hasPermission === 'function' && !hasPermission('employees')) {
      const banner = document.getElementById('permission-denied-banner-employees');
      if (banner) banner.classList.remove('d-none');
      return;
    }
    
    const bannerOk = document.getElementById('permission-denied-banner-employees');
    if (bannerOk) bannerOk.classList.add('d-none');
    
    // Setup image preview
    const imageInput = document.getElementById('employeeImage');
    if (imageInput) {
      imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(e) {
            const preview = document.getElementById('employeeImagePreview');
            if (preview) {
              preview.src = e.target.result;
              preview.style.display = 'block';
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
    
    // Setup bank account number syncing between Acc No and Bank Details
    setupBankAccountSyncing();
    
    // Setup auto-calculation for Total Hrs from duty times
    setupTotalHoursCalculation();
    
    // Load branches directly - ensure all branches are loaded
    loadEmployeeBranches();
    
    // Load employee departments and designations
    loadEmployeeDepartments();
    loadEmployeeDesignations();
    
    // Generate employee code if empty (async) - ensure it runs
    setTimeout(() => {
    generateEmployeeCode();
    }, 300);
    
    // Check permission for Employee List button - delay to ensure DOM is ready
    setTimeout(() => {
      checkEmployeeListPermission();
    }, 200);
    
    // Also check when section becomes visible
    const section = document.getElementById('employees-section');
    if (section) {
      const observer = new MutationObserver(() => {
        if (section.classList.contains('active') && section.style.display !== 'none') {
          setTimeout(checkEmployeeListPermission, 100);
        }
      });
      observer.observe(section, { attributes: true, attributeFilter: ['class', 'style'] });
    }
  }

  function checkEmployeeListPermission() {
    const employeeListBtn = document.getElementById('employeeListBtn');
    if (!employeeListBtn) {
      // Retry after a short delay if button not found yet
      setTimeout(checkEmployeeListPermission, 100);
      return;
    }
    
    // Check if user has employee-list permission or employees permission (which includes list access)
    const permissions = window.appData?.currentUser?.permissions || [];
    const hasListPermission = permissions.includes('employee-list') || 
                              permissions.includes('employees') || 
                              permissions.includes('admin');
    
    console.log('Employee List Button Permission Check:', {
      permissions: permissions,
      hasListPermission: hasListPermission,
      hasEmployeeList: permissions.includes('employee-list'),
      hasEmployees: permissions.includes('employees'),
      hasAdmin: permissions.includes('admin')
    });
    
    if (hasListPermission) {
      // Show button by setting display to block or removing the inline style
      employeeListBtn.style.setProperty('display', 'inline-block', 'important');
      console.log('Employee List button shown');
    } else {
      employeeListBtn.style.setProperty('display', 'none', 'important');
      console.log('Employee List button hidden - no permission');
    }
  }

  async function generateEmployeeCode() {
    const codeInput = document.getElementById('employeeCode');
    if (!codeInput) return;
    
    // Only generate if creating new employee (no currentEmployeeId) and field is empty
    if (!currentEmployeeId && !codeInput.value) {
      try {
        // Get all employees to find the highest code starting from 1001
        const employees = await api.getEmployees();
        
        let maxCode = 1000; // Start from 1000, so first code will be 1001
        let foundValidCodes = false;
        
        employees.forEach(emp => {
          if (emp.code) {
            // Extract numeric part from code (e.g., EMP1234 -> 1234)
            const match = emp.code.match(/\d+/);
            if (match) {
              const num = parseInt(match[0], 10);
              // Only consider codes >= 1001 and < 10000 (reasonable range)
              // Ignore very high codes like 979877, 979878 as they are old/invalid
              if (num >= 1001 && num < 10000) {
                foundValidCodes = true;
                if (num > maxCode) {
                  maxCode = num;
                }
              }
            }
          }
        });
        
        // Generate next sequential code starting from 1001
        let finalCode;
        if (foundValidCodes && maxCode < 10000) {
          // If we found valid codes in reasonable range (1001-9999), increment from the highest
          finalCode = maxCode + 1;
        } else {
          // If no valid codes in range or codes are too high, start from 1001
          finalCode = 1001;
        }
        
        codeInput.value = 'EMP' + finalCode.toString();
        
        console.log('Generated employee code:', codeInput.value, 'from maxCode:', maxCode, 'foundValidCodes:', foundValidCodes);
        
        // Lock the field for new employees
        codeInput.readOnly = true;
        codeInput.style.backgroundColor = '#e9ecef';
        codeInput.style.cursor = 'not-allowed';
      } catch (error) {
        console.error('Error generating employee code:', error);
        // Fallback: start from 1001
        codeInput.value = 'EMP1001';
        codeInput.readOnly = true;
        codeInput.style.backgroundColor = '#e9ecef';
        codeInput.style.cursor = 'not-allowed';
      }
    } else if (currentEmployeeId) {
      // When editing, keep it readonly (code shouldn't change)
      codeInput.readOnly = true;
      codeInput.style.backgroundColor = '#e9ecef';
      codeInput.style.cursor = 'not-allowed';
    }
  }

  function loadEmployeeBranches() {
    const selector = document.getElementById('employeeBranch');
    if (!selector) return Promise.resolve();
    
    selector.innerHTML = '<option value="">Select Branches</option>';
    selector.disabled = true;
    
    return api.getBranches()
      .then(branches => {
        selector.innerHTML = '<option value="">Select Branches</option>';
        
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
  }

  function loadEmployees() {
    initEmployeesSection();
  }

  function clearEmployeeForm() {
    const form = document.getElementById('employeeForm');
    if (form) form.reset();
    
    currentEmployeeId = null;
    
    // Clear and unlock code field for new employee generation
    const codeInput = document.getElementById('employeeCode');
    if (codeInput) {
      codeInput.value = ''; // Clear the value first
      codeInput.readOnly = false;
      codeInput.style.backgroundColor = '';
      codeInput.style.cursor = '';
    }
    
    // Ensure Acc No is locked for new employee
    const accNoInput = document.getElementById('employeeAccNo');
    if (accNoInput) {
      accNoInput.readOnly = true;
      accNoInput.style.backgroundColor = '#e9ecef';
      accNoInput.style.cursor = 'not-allowed';
      accNoInput.value = '';
    }
    
    // Reload branches
    loadEmployeeBranches();
    
    // Generate new employee code after a short delay to ensure form is cleared
    setTimeout(() => {
    generateEmployeeCode();
    }, 100);
    
    const preview = document.getElementById('employeeImagePreview');
    if (preview) {
      preview.src = '';
      preview.style.display = 'none';
    }
    
    const saveBtn = document.getElementById('saveEmployeeBtn');
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save';
      saveBtn.onclick = function() {
        if (typeof saveEmployee === 'function') saveEmployee();
      };
    }
    
    // Set defaults
    document.getElementById('employeeGender').value = 'Male';
    document.getElementById('employeeReligion').value = 'Islam';
    document.getElementById('employeeActive').checked = true;
    document.getElementById('employeeAllowOvertime').checked = true;
    document.getElementById('employeeAllowEmployeeAdvances').checked = true;
    document.getElementById('employeeOffDay').value = 'Sunday';
    document.getElementById('employeeSalaryPeriod').value = 'Per Month';
    document.getElementById('employeeAllowFood').value = 'No Food';
    
    // Ensure Total Hrs is locked and reset
    const totalHrsInput = document.getElementById('employeeTotalHrs');
    if (totalHrsInput) {
      totalHrsInput.value = '0';
      totalHrsInput.readOnly = true;
      totalHrsInput.style.backgroundColor = '#e9ecef';
      totalHrsInput.style.cursor = 'not-allowed';
    }
    
    // Re-setup total hours calculation
    setTimeout(() => {
      if (typeof setupTotalHoursCalculation === 'function') {
        setupTotalHoursCalculation();
      }
    }, 100);
  }

  function saveEmployee() {
    if (typeof hasPermission === 'function' && !hasPermission('employees')) {
      if (typeof showNotification === 'function') {
        showNotification('You do not have permission to manage employees', 'error');
      }
      return;
    }

    const code = document.getElementById('employeeCode').value.trim();
    const name = document.getElementById('employeeName').value.trim();
    
    if (!code || !name) {
      if (typeof showNotification === 'function') {
        showNotification('Code and name are required', 'error');
      }
      return;
    }

    const employeeData = {
      code,
      name,
      fatherMother: document.getElementById('employeeFatherMother').value.trim(),
      cnic: document.getElementById('employeeCNIC').value.trim(),
      branchId: document.getElementById('employeeBranch').value || null,
      departmentId: document.getElementById('employeeDepartment').value || null,
      designationId: document.getElementById('employeeDesignation').value || null,
      designation: (function() {
        // Get designation name from selected option for backward compatibility
        const desigSelect = document.getElementById('employeeDesignation');
        if (desigSelect && desigSelect.value) {
          const selectedOption = desigSelect.options[desigSelect.selectedIndex];
          return selectedOption ? selectedOption.textContent : '';
        }
        return '';
      })(),
      address: document.getElementById('employeeAddress').value.trim(),
      accNo: (function() {
        // Get account number from selected bank field if bank is selected
        const empBankSelect = document.getElementById('employeeBankSelect');
        const selectedBank = empBankSelect ? empBankSelect.value : '';
        if (selectedBank) {
          const bankFields = {
            'HBL': document.getElementById('employeeHBL'),
            'ALF': document.getElementById('employeeALF'),
            'BOP': document.getElementById('employeeBOP'),
            'BIP': document.getElementById('employeeBIP'),
            'BAHL': document.getElementById('employeeBAHL')
          };
          if (bankFields[selectedBank]) {
            return bankFields[selectedBank].value.trim();
          }
        }
        // Fallback to Acc No field
        return document.getElementById('employeeAccNo').value.trim();
      })(),
      bankName: document.getElementById('employeeBankSelect').value,
      mobileNo: document.getElementById('employeeMobileNo').value.trim(),
      dob: document.getElementById('employeeDOB').value || null,
      joiningDate: document.getElementById('employeeJoiningDate').value || null,
      issueDate: document.getElementById('employeeIssueDate').value || null,
      expiryDate: document.getElementById('employeeExpiryDate').value || null,
      incrDate: document.getElementById('employeeIncrDate').value || null,
      gender: document.getElementById('employeeGender').value,
      religion: document.getElementById('employeeReligion').value,
      salesman: document.getElementById('employeeSalesman').checked,
      isActive: document.getElementById('employeeActive').checked,
      
      // Fix section
      opening: parseFloat(document.getElementById('employeeOpening').value) || 0,
      salary: parseFloat(document.getElementById('employeeSalary').value) || 0,
      salaryPeriod: document.getElementById('employeeSalaryPeriod').value,
      fixAllowance: parseFloat(document.getElementById('employeeFixAllowance').value) || 0,
      stLessAllowance: parseFloat(document.getElementById('employeeStLessAllowance').value) || 0,
      otherAllowances: parseFloat(document.getElementById('employeeOtherAllowances').value) || 0,
      commEmp: document.getElementById('employeeCommEmp').checked,
      allowFood: document.getElementById('employeeAllowFood').value,
      perTimeFoodRs: parseFloat(document.getElementById('employeePerTimeFoodRs').value) || 0,
      bankCash: parseFloat(document.getElementById('employeeBankCash').value) || 0,
      securityDeposit: parseFloat(document.getElementById('employeeSecurityDeposit').value) || 0,
      deduction: parseFloat(document.getElementById('employeeDeduction').value) || 0,
      
      // Duty section
      fDutyTime: document.getElementById('employeeFDutyTime').value || '',
      tDutyTime: document.getElementById('employeeTDutyTime').value || '',
      offDay: document.getElementById('employeeOffDay').value,
      totalHrs: parseFloat(document.getElementById('employeeTotalHrs').value) || 0,
      
      // Access controls
      allowOvertime: document.getElementById('employeeAllowOvertime').checked,
      otstThirtyWorkingDays: document.getElementById('employeeOtstThirtyWorkingDays').checked,
      eobi: document.getElementById('employeeEobi').checked,
      payFullSalaryThroughBank: document.getElementById('employeePayFullSalaryThroughBank').checked,
      electricityBill: document.getElementById('employeeElectricityBill').checked,
      thirtyWorkingDays: document.getElementById('employeeThirtyWorkingDays').checked,
      allowEmployeeAdvances: document.getElementById('employeeAllowEmployeeAdvances').checked,
      allowRottiPerks: document.getElementById('employeeAllowRottiPerks').checked,
      dontAllowRottiPerks: document.getElementById('employeeDontAllowRottiPerks').checked,
      allowNashtaPerks: document.getElementById('employeeAllowNashtaPerks').checked,
      dontAllowNashtaPerks: document.getElementById('employeeDontAllowNashtaPerks').checked,
      rottiTimes: document.getElementById('employeeRottiTimes').value.trim(),
      
      // Bank details
      hbl: document.getElementById('employeeHBL').value.trim(),
      alf: document.getElementById('employeeALF').value.trim(),
      bop: document.getElementById('employeeBOP').value.trim(),
      bip: document.getElementById('employeeBIP').value.trim(),
      bahl: document.getElementById('employeeBAHL').value.trim(),
    };

    // Handle image upload (base64 conversion for now)
    const imageInput = document.getElementById('employeeImage');
    if (imageInput && imageInput.files && imageInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        employeeData.image = e.target.result;
        performSave(employeeData);
      };
      reader.readAsDataURL(imageInput.files[0]);
    } else {
      performSave(employeeData);
    }
  }

  function performSave(employeeData) {
    const saveBtn = document.getElementById('saveEmployeeBtn');
    const originalText = saveBtn ? saveBtn.innerHTML : '';
    
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
      saveBtn.disabled = true;
    }

    const apiCall = currentEmployeeId
      ? api.updateEmployee(currentEmployeeId, employeeData)
      : api.createEmployee(employeeData);

    apiCall
      .then(() => {
        if (typeof showNotification === 'function') {
          showNotification(
            currentEmployeeId ? 'Employee updated successfully!' : 'Employee saved successfully!',
            'success'
          );
        }
        
        // Store whether this was a new employee before clearing
        const wasNewEmployee = !currentEmployeeId;
        
        // Clear the form
        clearEmployeeForm();
        
        // If it was a new employee (not update), generate next sequential code
        // Wait a bit to ensure the saved employee is in the database
        if (wasNewEmployee) {
          setTimeout(() => {
            // Fetch fresh employee list and generate next code
            // Make sure code field is empty before generating
            const codeInput = document.getElementById('employeeCode');
            if (codeInput) {
              codeInput.value = '';
            }
            generateEmployeeCode();
          }, 800);
        }
        
        if (typeof loadEmployeeList === 'function') {
          loadEmployeeList();
        }
      })
      .catch(error => {
        console.error('Error saving employee:', error);
        if (typeof showNotification === 'function') {
          showNotification('Failed to save employee: ' + (error.message || 'Unknown error'), 'error');
        }
      })
      .finally(() => {
        if (saveBtn) {
          saveBtn.innerHTML = originalText;
          saveBtn.disabled = false;
        }
      });
  }

  function editEmployee(id) {
    if (typeof hasPermission === 'function' && !hasPermission('employees')) {
      if (typeof showNotification === 'function') {
        showNotification('You do not have permission to edit employees', 'error');
      }
      return;
    }

    api.getEmployee(id)
      .then(employee => {
        currentEmployeeId = employee._id;
        
        // Basic info
        const codeInput = document.getElementById('employeeCode');
        if (codeInput) {
          codeInput.value = employee.code || '';
          // Lock code field when editing
          codeInput.readOnly = true;
          codeInput.style.backgroundColor = '#e9ecef';
          codeInput.style.cursor = 'not-allowed';
        }
        document.getElementById('employeeName').value = employee.name || '';
        document.getElementById('employeeFatherMother').value = employee.fatherMother || '';
        document.getElementById('employeeCNIC').value = employee.cnic || '';
        // Load all dropdowns first, then set values after they're loaded
        Promise.all([
          loadEmployeeBranches() || Promise.resolve(),
          loadEmployeeDepartments() || Promise.resolve(),
          loadEmployeeDesignations() || Promise.resolve()
        ]).then(() => {
          // Set branch value
          const branchSelect = document.getElementById('employeeBranch');
          if (branchSelect) {
            const branchId = employee.branchId?._id || employee.branchId || '';
            branchSelect.value = branchId;
            // If value not set, try again after a short delay
            if (!branchSelect.value && branchId) {
        setTimeout(() => {
                branchSelect.value = branchId;
              }, 200);
            }
          }
          
          // Set department value
          const deptSelect = document.getElementById('employeeDepartment');
          if (deptSelect) {
            const deptId = employee.departmentId?._id || employee.departmentId || '';
            deptSelect.value = deptId;
            // If value not set, try again after a short delay
            if (!deptSelect.value && deptId) {
        setTimeout(() => {
                deptSelect.value = deptId;
              }, 200);
            }
          }
          
          // Set designation value
          const desigSelect = document.getElementById('employeeDesignation');
          if (desigSelect) {
            // Try designationId first
            if (employee.designationId?._id || employee.designationId) {
              const desigId = employee.designationId._id || employee.designationId;
              desigSelect.value = desigId;
              // If value not set, try again after a short delay
              if (!desigSelect.value && desigId) {
                setTimeout(() => {
                  desigSelect.value = desigId;
                }, 200);
              }
            } else if (employee.designation) {
              // If no designationId but has designation string, try to find matching option
              const options = Array.from(desigSelect.options);
              const matchingOption = options.find(opt => opt.textContent.trim().toLowerCase() === employee.designation.trim().toLowerCase());
              if (matchingOption) {
                desigSelect.value = matchingOption.value;
              }
            }
          }
        }).catch(error => {
          console.error('Error loading dropdowns for edit:', error);
        });
        document.getElementById('employeeAddress').value = employee.address || '';
        const employeeBankSelect = document.getElementById('employeeBankSelect');
        if (employeeBankSelect) {
          employeeBankSelect.value = employee.bankName || '';
        }
        // Acc No will be synced from bank details after bank fields are loaded
        document.getElementById('employeeMobileNo').value = employee.mobileNo || '';
        document.getElementById('employeeDOB').value = employee.dob ? new Date(employee.dob).toISOString().split('T')[0] : '';
        document.getElementById('employeeJoiningDate').value = employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '';
        document.getElementById('employeeIssueDate').value = employee.issueDate ? new Date(employee.issueDate).toISOString().split('T')[0] : '';
        document.getElementById('employeeExpiryDate').value = employee.expiryDate ? new Date(employee.expiryDate).toISOString().split('T')[0] : '';
        document.getElementById('employeeIncrDate').value = employee.incrDate ? new Date(employee.incrDate).toISOString().split('T')[0] : '';
        document.getElementById('employeeGender').value = employee.gender || 'Male';
        document.getElementById('employeeReligion').value = employee.religion || 'Islam';
        document.getElementById('employeeSalesman').checked = employee.salesman || false;
        document.getElementById('employeeActive').checked = employee.isActive !== false;
        
        // Fix section
        document.getElementById('employeeOpening').value = employee.opening || 0;
        document.getElementById('employeeSalary').value = employee.salary || 0;
        document.getElementById('employeeSalaryPeriod').value = employee.salaryPeriod || 'Per Month';
        document.getElementById('employeeFixAllowance').value = employee.fixAllowance || 0;
        document.getElementById('employeeStLessAllowance').value = employee.stLessAllowance || 0;
        document.getElementById('employeeOtherAllowances').value = employee.otherAllowances || 0;
        document.getElementById('employeeCommEmp').checked = employee.commEmp || false;
        document.getElementById('employeeAllowFood').value = employee.allowFood || 'No Food';
        document.getElementById('employeePerTimeFoodRs').value = employee.perTimeFoodRs || 0;
        document.getElementById('employeeBankCash').value = employee.bankCash || 0;
        document.getElementById('employeeSecurityDeposit').value = employee.securityDeposit || 0;
        document.getElementById('employeeDeduction').value = employee.deduction || 0;
        
        // Duty section
        document.getElementById('employeeFDutyTime').value = employee.fDutyTime || '';
        document.getElementById('employeeTDutyTime').value = employee.tDutyTime || '';
        document.getElementById('employeeOffDay').value = employee.offDay || 'Sunday';
        
        // Total Hrs will be auto-calculated, but set initial value
        const totalHrsInput = document.getElementById('employeeTotalHrs');
        if (totalHrsInput) {
          totalHrsInput.value = employee.totalHrs || 0;
          // Ensure it's locked
          totalHrsInput.readOnly = true;
          totalHrsInput.style.backgroundColor = '#e9ecef';
          totalHrsInput.style.cursor = 'not-allowed';
        }
        
        // Recalculate total hours after setting duty times
        setTimeout(() => {
          if (typeof setupTotalHoursCalculation === 'function') {
            setupTotalHoursCalculation();
          }
        }, 200);
        
        // Access controls
        document.getElementById('employeeAllowOvertime').checked = employee.allowOvertime !== false;
        document.getElementById('employeeOtstThirtyWorkingDays').checked = employee.otstThirtyWorkingDays || false;
        document.getElementById('employeeEobi').checked = employee.eobi || false;
        document.getElementById('employeePayFullSalaryThroughBank').checked = employee.payFullSalaryThroughBank || false;
        document.getElementById('employeeElectricityBill').checked = employee.electricityBill || false;
        document.getElementById('employeeThirtyWorkingDays').checked = employee.thirtyWorkingDays || false;
        document.getElementById('employeeAllowEmployeeAdvances').checked = employee.allowEmployeeAdvances !== false;
        document.getElementById('employeeAllowRottiPerks').checked = employee.allowRottiPerks || false;
        document.getElementById('employeeDontAllowRottiPerks').checked = employee.dontAllowRottiPerks || false;
        document.getElementById('employeeAllowNashtaPerks').checked = employee.allowNashtaPerks || false;
        document.getElementById('employeeDontAllowNashtaPerks').checked = employee.dontAllowNashtaPerks || false;
        document.getElementById('employeeRottiTimes').value = employee.rottiTimes || '';
        
        // Bank details
        document.getElementById('employeeHBL').value = employee.hbl || '';
        document.getElementById('employeeALF').value = employee.alf || '';
        document.getElementById('employeeBOP').value = employee.bop || '';
        document.getElementById('employeeBIP').value = employee.bip || '';
        document.getElementById('employeeBAHL').value = employee.bahl || '';
        
        // Sync Acc No with selected bank after loading bank details
        setTimeout(() => {
          const accNoInput = document.getElementById('employeeAccNo');
          if (accNoInput) {
            // Ensure Acc No is locked
            accNoInput.readOnly = true;
            accNoInput.style.backgroundColor = '#e9ecef';
            accNoInput.style.cursor = 'not-allowed';
          }
          
        if (employeeBankSelect && employeeBankSelect.value) {
          const selectedBank = employeeBankSelect.value;
          const bankFields = {
            'HBL': document.getElementById('employeeHBL'),
            'ALF': document.getElementById('employeeALF'),
            'BOP': document.getElementById('employeeBOP'),
            'BIP': document.getElementById('employeeBIP'),
            'BAHL': document.getElementById('employeeBAHL')
          };
            
          if (bankFields[selectedBank] && accNoInput) {
              // Get account number from the bank detail field
              const bankAccNo = bankFields[selectedBank].value || employee.accNo || '';
              accNoInput.value = bankAccNo;
          }
          // Trigger change event to sync
          employeeBankSelect.dispatchEvent(new Event('change'));
          } else if (accNoInput) {
            // If no bank selected, use saved accNo if available
            accNoInput.value = employee.accNo || '';
        }
        }, 100);
        
        // Image
        if (employee.image) {
          const preview = document.getElementById('employeeImagePreview');
          if (preview) {
            preview.src = employee.image;
            preview.style.display = 'block';
          }
        }
        
        // Update save button
        const saveBtn = document.getElementById('saveEmployeeBtn');
        if (saveBtn) {
          saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Update';
          saveBtn.onclick = function() {
            if (typeof saveEmployee === 'function') saveEmployee();
          };
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(error => {
        console.error('Error fetching employee:', error);
        if (typeof showNotification === 'function') {
          showNotification('Failed to load employee: ' + (error.message || 'Unknown error'), 'error');
        }
      });
  }

  function deleteEmployee(id) {
    if (typeof hasPermission === 'function' && !hasPermission('employees')) {
      if (typeof showNotification === 'function') {
        showNotification('You do not have permission to delete employees', 'error');
      }
      return;
    }

    if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      api.deleteEmployee(id)
        .then(() => {
          if (typeof showNotification === 'function') {
            showNotification('Employee deleted successfully!', 'success');
          }
          if (typeof loadEmployeeList === 'function') {
            loadEmployeeList();
          }
        })
        .catch(error => {
          console.error('Error deleting employee:', error);
          if (typeof showNotification === 'function') {
            showNotification('Failed to delete employee: ' + (error.message || 'Unknown error'), 'error');
          }
        });
    }
  }

  function loadEmployeeList() {
    // Redirect to full-page employee list instead of showing modal
    if (typeof showSection === 'function') {
      showSection('employee-list');
    }
  }

  let currentEmployeeDepartmentId = null;

  function showEmployeeDepartmentModal() {
    resetEmployeeDepartmentForm();
    loadEmployeeDepartmentList();
    
    const modalElement = document.getElementById('employeeDepartmentModal');
    if (modalElement && window.bootstrap && typeof window.bootstrap.Modal === 'function') {
      const modal = new window.bootstrap.Modal(modalElement);
      modal.show();
    } else {
      console.error('Employee Department Modal not found or Bootstrap not available');
      if (typeof showNotification === 'function') {
        showNotification('Department modal not found', 'error');
      }
    }
  }

  function resetEmployeeDepartmentForm() {
    currentEmployeeDepartmentId = null;
    const form = document.getElementById('employeeDepartmentForm');
    if (form) form.reset();
    
    document.getElementById('employeeDepartmentActive').checked = true;
    document.getElementById('employeeDepartmentFormTitle').textContent = 'Add New Department';
    
    const saveBtn = document.getElementById('saveEmployeeDepartmentBtn');
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save';
      saveBtn.onclick = function() {
        if (typeof saveEmployeeDepartment === 'function') saveEmployeeDepartment();
      };
    }
  }

  function saveEmployeeDepartment() {
    const name = document.getElementById('employeeDepartmentName').value.trim();
    if (!name) {
      if (typeof showNotification === 'function') {
        showNotification('Department name is required', 'error');
      }
      return;
    }

    const departmentData = {
      name: name,
      description: document.getElementById('employeeDepartmentDescription').value.trim(),
      isActive: document.getElementById('employeeDepartmentActive').checked
    };

    const saveBtn = document.getElementById('saveEmployeeDepartmentBtn');
    const originalText = saveBtn ? saveBtn.innerHTML : '';
    
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
      saveBtn.disabled = true;
    }

    const apiCall = currentEmployeeDepartmentId
      ? api.updateEmployeeDepartment(currentEmployeeDepartmentId, departmentData)
      : api.createEmployeeDepartment(departmentData);

    apiCall
      .then((savedDepartment) => {
        if (typeof showNotification === 'function') {
          showNotification(
            currentEmployeeDepartmentId ? 'Department updated successfully!' : 'Department saved successfully!',
            'success'
          );
        }
        resetEmployeeDepartmentForm();
        loadEmployeeDepartmentList();
        loadEmployeeDepartments(); // Refresh dropdown
        
        // Auto-select the newly created/updated department in employee form
        setTimeout(() => {
          const deptSelect = document.getElementById('employeeDepartment');
          if (deptSelect && savedDepartment && savedDepartment._id) {
            deptSelect.value = savedDepartment._id;
          }
        }, 300);
      })
      .catch(error => {
        console.error('Error saving employee department:', error);
        const errorMsg = error.message || 'Unknown error';
        if (typeof showNotification === 'function') {
          showNotification('Failed to save department: ' + errorMsg, 'error');
        }
      })
      .finally(() => {
        if (saveBtn) {
          saveBtn.innerHTML = originalText;
          saveBtn.disabled = false;
        }
      });
  }

  function editEmployeeDepartment(id) {
    api.getEmployeeDepartment(id)
      .then(department => {
        currentEmployeeDepartmentId = department._id;
        
        document.getElementById('employeeDepartmentId').value = department._id;
        document.getElementById('employeeDepartmentName').value = department.name || '';
        document.getElementById('employeeDepartmentDescription').value = department.description || '';
        document.getElementById('employeeDepartmentActive').checked = department.isActive !== false;
        
        document.getElementById('employeeDepartmentFormTitle').textContent = 'Edit Department';
        
        const saveBtn = document.getElementById('saveEmployeeDepartmentBtn');
        if (saveBtn) {
          saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Update';
          saveBtn.onclick = function() {
            if (typeof saveEmployeeDepartment === 'function') saveEmployeeDepartment();
          };
        }
        
        // Scroll to form
        const formCard = document.querySelector('#employeeDepartmentForm').closest('.card');
        if (formCard) {
          formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      })
      .catch(error => {
        console.error('Error fetching employee department:', error);
        if (typeof showNotification === 'function') {
          showNotification('Failed to load department: ' + (error.message || 'Unknown error'), 'error');
        }
      });
  }

  function deleteEmployeeDepartment(id) {
    if (confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      api.deleteEmployeeDepartment(id)
        .then(() => {
          if (typeof showNotification === 'function') {
            showNotification('Department deleted successfully!', 'success');
          }
          loadEmployeeDepartmentList();
          loadEmployeeDepartments(); // Refresh dropdown
        })
        .catch(error => {
          console.error('Error deleting employee department:', error);
          if (typeof showNotification === 'function') {
            showNotification('Failed to delete department: ' + (error.message || 'Unknown error'), 'error');
          }
        });
    }
  }

  function loadEmployeeDepartmentList() {
    const tableBody = document.getElementById('employeeDepartmentListBody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Loading departments...</td></tr>';
    }

    api.getEmployeeDepartments()
      .then(departments => {
        if (tableBody) {
          tableBody.innerHTML = '';
          
          if (departments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No departments found. Add one to get started.</td></tr>';
            return;
          }

          departments.forEach(dept => {
            const row = document.createElement('tr');
            const statusBadge = dept.isActive
              ? '<span class="badge bg-success">Active</span>'
              : '<span class="badge bg-secondary">Inactive</span>';
            
            row.innerHTML = `
              <td>${dept.name || 'N/A'}</td>
              <td>${dept.description || '-'}</td>
              <td>${statusBadge}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-2" onclick="if(typeof editEmployeeDepartment === 'function') editEmployeeDepartment('${dept._id}')">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="if(typeof deleteEmployeeDepartment === 'function') deleteEmployeeDepartment('${dept._id}')">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </td>
            `;
            tableBody.appendChild(row);
          });
        }
      })
      .catch(error => {
        console.error('Error loading employee departments:', error);
        if (tableBody) {
          tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading departments</td></tr>';
        }
        if (typeof showNotification === 'function') {
          showNotification('Failed to load departments: ' + (error.message || 'Unknown error'), 'error');
        }
      });
  }

  function loadEmployeeDepartments() {
    const selector = document.getElementById('employeeDepartment');
    if (!selector) {
      console.warn('Employee department selector not found');
      return Promise.resolve();
    }
    
    selector.innerHTML = '<option value="">Loading departments...</option>';
    selector.disabled = true;
    
    return api.getEmployeeDepartments()
      .then(departments => {
        selector.innerHTML = '<option value="">Select Department</option>';
        
        if (departments && departments.length > 0) {
          // Filter only active departments and sort by name
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
        } else {
          selector.innerHTML = '<option value="">No departments found</option>';
        }
        
        selector.disabled = false;
        return departments;
      })
      .catch(error => {
        console.error('Error loading employee departments:', error);
        selector.innerHTML = '<option value="">Error loading departments</option>';
        selector.disabled = false;
        if (typeof showNotification === 'function') {
          showNotification('Failed to load departments', 'error');
        }
        return [];
      });
  }

  function setupBankAccountSyncing() {
    const bankSelect = document.getElementById('employeeBankSelect');
    const accNoInput = document.getElementById('employeeAccNo');
    const bankFields = {
      'HBL': document.getElementById('employeeHBL'),
      'ALF': document.getElementById('employeeALF'),
      'BOP': document.getElementById('employeeBOP'),
      'BIP': document.getElementById('employeeBIP'),
      'BAHL': document.getElementById('employeeBAHL')
    };
    
    // Lock Acc No field - it should only be populated from bank details
    if (accNoInput) {
      accNoInput.readOnly = true;
      accNoInput.style.backgroundColor = '#e9ecef';
      accNoInput.style.cursor = 'not-allowed';
    }
    
    // Function to update Acc No from selected bank field
    function updateAccNoFromBank() {
      if (!bankSelect || !accNoInput) return;
      
      const selectedBank = bankSelect.value;
      if (selectedBank && bankFields[selectedBank]) {
          const bankAccNo = bankFields[selectedBank].value.trim();
            accNoInput.value = bankAccNo;
          } else {
            accNoInput.value = '';
          }
    }
    
    // When bank is selected, sync Acc No from corresponding bank field
    if (bankSelect) {
      bankSelect.addEventListener('change', function() {
        updateAccNoFromBank();
      });
    }
    
    // When bank detail fields are updated, sync with Acc No if that bank is selected
    Object.keys(bankFields).forEach(bankCode => {
      const bankField = bankFields[bankCode];
      if (bankField) {
        bankField.addEventListener('input', function() {
          const selectedBank = bankSelect ? bankSelect.value : '';
          const accNo = this.value.trim();
          
          // If this bank is selected, update Acc No field
          if (selectedBank === bankCode && accNoInput) {
            accNoInput.value = accNo;
          }
        });
        
        bankField.addEventListener('blur', function() {
          const selectedBank = bankSelect ? bankSelect.value : '';
          const accNo = this.value.trim();
          
          // If this bank is selected, update Acc No field
          if (selectedBank === bankCode && accNoInput) {
            accNoInput.value = accNo;
          }
        });
      }
    });
  }

  function setupTotalHoursCalculation() {
    const fDutyTimeInput = document.getElementById('employeeFDutyTime');
    const tDutyTimeInput = document.getElementById('employeeTDutyTime');
    const totalHrsInput = document.getElementById('employeeTotalHrs');
    
    if (!fDutyTimeInput || !tDutyTimeInput || !totalHrsInput) return;
    
    // Lock the Total Hrs field
    totalHrsInput.readOnly = true;
    totalHrsInput.style.backgroundColor = '#e9ecef';
    totalHrsInput.style.cursor = 'not-allowed';
    
    // Function to calculate total hours
    function calculateTotalHours() {
      const fromTime = fDutyTimeInput.value;
      const toTime = tDutyTimeInput.value;
      
      if (!fromTime || !toTime) {
        totalHrsInput.value = '0';
        return;
      }
      
      // Parse time strings (HH:MM format)
      const fromParts = fromTime.split(':');
      const toParts = toTime.split(':');
      
      if (fromParts.length !== 2 || toParts.length !== 2) {
        totalHrsInput.value = '0';
        return;
      }
      
      const fromHours = parseInt(fromParts[0], 10);
      const fromMinutes = parseInt(fromParts[1], 10);
      const toHours = parseInt(toParts[0], 10);
      const toMinutes = parseInt(toParts[1], 10);
      
      // Convert to minutes for easier calculation
      const fromTotalMinutes = fromHours * 60 + fromMinutes;
      const toTotalMinutes = toHours * 60 + toMinutes;
      
      // Calculate difference
      let diffMinutes = toTotalMinutes - fromTotalMinutes;
      
      // Handle case where end time is next day (e.g., 22:00 to 06:00)
      if (diffMinutes < 0) {
        diffMinutes = (24 * 60) + diffMinutes; // Add 24 hours
      }
      
      // Convert back to hours (with decimal for minutes)
      const totalHours = diffMinutes / 60;
      
      // Round to 2 decimal places
      totalHrsInput.value = totalHours.toFixed(2);
    }
    
    // Add event listeners to both time inputs
    fDutyTimeInput.addEventListener('change', calculateTotalHours);
    fDutyTimeInput.addEventListener('input', calculateTotalHours);
    tDutyTimeInput.addEventListener('change', calculateTotalHours);
    tDutyTimeInput.addEventListener('input', calculateTotalHours);
    
    // Calculate initial value if times are already set
    setTimeout(calculateTotalHours, 100);
  }

  let currentEmployeeDesignationId = null;

  function showEmployeeDesignationModal() {
    resetEmployeeDesignationForm();
    loadEmployeeDesignationList();
    
    const modalElement = document.getElementById('employeeDesignationModal');
    if (modalElement && window.bootstrap && typeof window.bootstrap.Modal === 'function') {
      const modal = new window.bootstrap.Modal(modalElement);
      modal.show();
    } else {
      console.error('Employee Designation Modal not found or Bootstrap not available');
      if (typeof showNotification === 'function') {
        showNotification('Designation modal not found', 'error');
      }
    }
  }

  function resetEmployeeDesignationForm() {
    currentEmployeeDesignationId = null;
    const form = document.getElementById('employeeDesignationForm');
    if (form) form.reset();
    
    document.getElementById('employeeDesignationActive').checked = true;
    document.getElementById('employeeDesignationFormTitle').textContent = 'Add New Designation';
    
    const saveBtn = document.getElementById('saveEmployeeDesignationBtn');
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save';
      saveBtn.onclick = function() {
        if (typeof saveEmployeeDesignation === 'function') saveEmployeeDesignation();
      };
    }
  }

  function saveEmployeeDesignation() {
    const name = document.getElementById('employeeDesignationName').value.trim();
    if (!name) {
      if (typeof showNotification === 'function') {
        showNotification('Designation name is required', 'error');
      }
      return;
    }

    const designationData = {
      name: name,
      description: document.getElementById('employeeDesignationDescription').value.trim(),
      isActive: document.getElementById('employeeDesignationActive').checked
    };

    const saveBtn = document.getElementById('saveEmployeeDesignationBtn');
    const originalText = saveBtn ? saveBtn.innerHTML : '';
    
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
      saveBtn.disabled = true;
    }

    const apiCall = currentEmployeeDesignationId
      ? api.updateEmployeeDesignation(currentEmployeeDesignationId, designationData)
      : api.createEmployeeDesignation(designationData);

    apiCall
      .then((savedDesignation) => {
        if (typeof showNotification === 'function') {
          showNotification(
            currentEmployeeDesignationId ? 'Designation updated successfully!' : 'Designation saved successfully!',
            'success'
          );
        }
        resetEmployeeDesignationForm();
        loadEmployeeDesignationList();
        loadEmployeeDesignations(); // Refresh dropdown
        
        // Auto-select the newly created/updated designation in employee form
        setTimeout(() => {
          const desigSelect = document.getElementById('employeeDesignation');
          if (desigSelect && savedDesignation && savedDesignation._id) {
            desigSelect.value = savedDesignation._id;
          }
        }, 300);
      })
      .catch(error => {
        console.error('Error saving employee designation:', error);
        const errorMsg = error.message || 'Unknown error';
        if (typeof showNotification === 'function') {
          showNotification('Failed to save designation: ' + errorMsg, 'error');
        }
      })
      .finally(() => {
        if (saveBtn) {
          saveBtn.innerHTML = originalText;
          saveBtn.disabled = false;
        }
      });
  }

  function editEmployeeDesignation(id) {
    api.getEmployeeDesignation(id)
      .then(designation => {
        currentEmployeeDesignationId = designation._id;
        
        document.getElementById('employeeDesignationId').value = designation._id;
        document.getElementById('employeeDesignationName').value = designation.name || '';
        document.getElementById('employeeDesignationDescription').value = designation.description || '';
        document.getElementById('employeeDesignationActive').checked = designation.isActive !== false;
        
        document.getElementById('employeeDesignationFormTitle').textContent = 'Edit Designation';
        
        const saveBtn = document.getElementById('saveEmployeeDesignationBtn');
        if (saveBtn) {
          saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Update';
          saveBtn.onclick = function() {
            if (typeof saveEmployeeDesignation === 'function') saveEmployeeDesignation();
          };
        }
        
        // Scroll to form
        const formCard = document.querySelector('#employeeDesignationForm').closest('.card');
        if (formCard) {
          formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      })
      .catch(error => {
        console.error('Error fetching employee designation:', error);
        if (typeof showNotification === 'function') {
          showNotification('Failed to load designation: ' + (error.message || 'Unknown error'), 'error');
        }
      });
  }

  function deleteEmployeeDesignation(id) {
    if (confirm('Are you sure you want to delete this designation? This action cannot be undone.')) {
      api.deleteEmployeeDesignation(id)
        .then(() => {
          if (typeof showNotification === 'function') {
            showNotification('Designation deleted successfully!', 'success');
          }
          loadEmployeeDesignationList();
          loadEmployeeDesignations(); // Refresh dropdown
        })
        .catch(error => {
          console.error('Error deleting employee designation:', error);
          if (typeof showNotification === 'function') {
            showNotification('Failed to delete designation: ' + (error.message || 'Unknown error'), 'error');
          }
        });
    }
  }

  function loadEmployeeDesignationList() {
    const tableBody = document.getElementById('employeeDesignationListBody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Loading designations...</td></tr>';
    }

    api.getEmployeeDesignations()
      .then(designations => {
        if (tableBody) {
          tableBody.innerHTML = '';
          
          if (designations.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No designations found. Add one to get started.</td></tr>';
            return;
          }

          designations.forEach(desig => {
            const row = document.createElement('tr');
            const statusBadge = desig.isActive
              ? '<span class="badge bg-success">Active</span>'
              : '<span class="badge bg-secondary">Inactive</span>';
            
            row.innerHTML = `
              <td>${desig.name || 'N/A'}</td>
              <td>${desig.description || '-'}</td>
              <td>${statusBadge}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-2" onclick="if(typeof editEmployeeDesignation === 'function') editEmployeeDesignation('${desig._id}')">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="if(typeof deleteEmployeeDesignation === 'function') deleteEmployeeDesignation('${desig._id}')">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </td>
            `;
            tableBody.appendChild(row);
          });
        }
      })
      .catch(error => {
        console.error('Error loading employee designations:', error);
        if (tableBody) {
          tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading designations</td></tr>';
        }
        if (typeof showNotification === 'function') {
          showNotification('Failed to load designations: ' + (error.message || 'Unknown error'), 'error');
        }
      });
  }

  function loadEmployeeDesignations() {
    const selector = document.getElementById('employeeDesignation');
    if (!selector) {
      console.warn('Employee designation selector not found');
      return Promise.resolve();
    }
    
    selector.innerHTML = '<option value="">Loading designations...</option>';
    selector.disabled = true;
    
    return api.getEmployeeDesignations()
      .then(designations => {
        selector.innerHTML = '<option value="">Select Designation</option>';
        
        if (designations && designations.length > 0) {
          // Filter only active designations and sort by name
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
        } else {
          selector.innerHTML = '<option value="">No designations found</option>';
        }
        
        selector.disabled = false;
        return designations;
      })
      .catch(error => {
        console.error('Error loading employee designations:', error);
        selector.innerHTML = '<option value="">Error loading designations</option>';
        selector.disabled = false;
        if (typeof showNotification === 'function') {
          showNotification('Failed to load designations', 'error');
        }
        return [];
      });
  }

  // Expose functions globally
  window.loadEmployees = loadEmployees;
  window.clearEmployeeForm = clearEmployeeForm;
  window.saveEmployee = saveEmployee;
  window.editEmployee = editEmployee;
  window.deleteEmployee = deleteEmployee;
  window.loadEmployeeList = loadEmployeeList;
  window.checkEmployeeListPermission = checkEmployeeListPermission;
  window.showEmployeeDepartmentModal = showEmployeeDepartmentModal;
  window.saveEmployeeDepartment = saveEmployeeDepartment;
  window.editEmployeeDepartment = editEmployeeDepartment;
  window.deleteEmployeeDepartment = deleteEmployeeDepartment;
  window.resetEmployeeDepartmentForm = resetEmployeeDepartmentForm;
  window.loadEmployeeDepartments = loadEmployeeDepartments;
  window.loadEmployeeDepartmentList = loadEmployeeDepartmentList;
  window.showEmployeeDesignationModal = showEmployeeDesignationModal;
  window.saveEmployeeDesignation = saveEmployeeDesignation;
  window.editEmployeeDesignation = editEmployeeDesignation;
  window.deleteEmployeeDesignation = deleteEmployeeDesignation;
  window.resetEmployeeDesignationForm = resetEmployeeDesignationForm;
  window.loadEmployeeDesignations = loadEmployeeDesignations;
  window.loadEmployeeDesignationList = loadEmployeeDesignationList;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmployeesSection);
  } else {
    initEmployeesSection();
  }
})();

