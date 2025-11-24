;(function() {
  function initReportsSection() {
    const section = document.getElementById('reports-section');
    if (!section) {
      // Section not loaded yet, try again later
      return;
    }
    
    // Check if API is available
    if (!window.api || typeof window.api.getBranches !== 'function') {
      console.warn('API not available yet, will retry initialization');
      setTimeout(initReportsSection, 500);
      return;
    }
    
    // Load data and populate dropdowns first
    loadReportsData().then(() => {
      // After data is loaded, set up tab switching
      if (typeof window.switchReportTab === 'function') {
        window.switchReportTab('sales-report');
      } else if (typeof switchReportTab === 'function') {
        switchReportTab('sales-report');
      }
      
      // Set up event listeners after a short delay to ensure DOM is ready
      setTimeout(() => {
        initReportEventListeners();
      }, 200);
    }).catch(error => {
      console.error('Error initializing reports section:', error);
      // Retry after delay
      setTimeout(() => {
        initReportsSection();
      }, 1000);
    });
  }

  async function loadReportsData() {
    try {
      // Load branches
      if (!window.appData) {
        window.appData = {};
      }
      if (!appData.branches || appData.branches.length === 0) {
        if (window.api && typeof window.api.getBranches === 'function') {
          const branches = await api.getBranches();
          appData.branches = branches;
        } else {
          console.warn('API or getBranches function not available');
        }
      }
      
      // Load categories
      if (!appData.categories || appData.categories.length === 0) {
        if (window.api && typeof window.api.getCategories === 'function') {
          const categories = await api.getCategories();
          appData.categories = categories;
        } else {
          console.warn('API or getCategories function not available');
        }
      }
      
      // Populate branch selectors
      if (typeof window.populateBranchSelectors === 'function') {
        window.populateBranchSelectors();
      } else if (typeof populateBranchSelectors === 'function') {
        populateBranchSelectors();
      } else {
        console.warn('populateBranchSelectors function not found');
      }
      
      // Populate category selectors
      if (typeof window.populateCategorySelectors === 'function') {
        window.populateCategorySelectors();
      } else if (typeof populateCategorySelectors === 'function') {
        populateCategorySelectors();
      } else {
        console.warn('populateCategorySelectors function not found');
      }
      
    } catch (error) {
      console.error('Error loading reports data:', error);
      if (typeof showNotification === 'function') {
        showNotification('Failed to load reports data: ' + error.message, 'error');
      }
      throw error; // Re-throw to allow caller to handle
    }
  }

  function initReportEventListeners() {
    // Set up tab click handlers
    const reportTabs = document.querySelectorAll('.report-tab');
    reportTabs.forEach(tab => {
      // Clone to remove existing listeners
      const newTab = tab.cloneNode(true);
      tab.parentNode.replaceChild(newTab, tab);
      
      newTab.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        if (tabName && typeof window.switchReportTab === 'function') {
          window.switchReportTab(tabName, false);
          // Reload data when switching tabs
          loadReportsData();
        }
      });
    });
    
    // Generate Sales Report Button
    const generateSalesReportBtn = document.getElementById('generateSalesReportBtn');
    if (generateSalesReportBtn) {
      const newBtn = generateSalesReportBtn.cloneNode(true);
      generateSalesReportBtn.parentNode.replaceChild(newBtn, generateSalesReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.generateSalesReport === 'function') {
          window.generateSalesReport();
        }
      });
    }
    
    // Generate Comparison Report Button
    const generateComparisonReportBtn = document.getElementById('generateComparisonReportBtn');
    if (generateComparisonReportBtn) {
      const newBtn = generateComparisonReportBtn.cloneNode(true);
      generateComparisonReportBtn.parentNode.replaceChild(newBtn, generateComparisonReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.generateComparisonReport === 'function') {
          window.generateComparisonReport();
        }
      });
    }
    
    // Generate Datewise Report Button
    const generateDatewiseReportBtn = document.getElementById('generateDatewiseReportBtn');
    if (generateDatewiseReportBtn) {
      const newBtn = generateDatewiseReportBtn.cloneNode(true);
      generateDatewiseReportBtn.parentNode.replaceChild(newBtn, generateDatewiseReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.generateDatewiseReport === 'function') {
          window.generateDatewiseReport();
        }
      });
    }
    
    // Generate Payment Report Button
    const generatePaymentReportBtn = document.getElementById('generatePaymentReportBtn');
    if (generatePaymentReportBtn) {
      const newBtn = generatePaymentReportBtn.cloneNode(true);
      generatePaymentReportBtn.parentNode.replaceChild(newBtn, generatePaymentReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.generatePaymentReport === 'function') {
          window.generatePaymentReport();
        }
      });
    }
    
    // Generate Department-Wise Report Button
    const generateDeptWiseReportBtn = document.getElementById('generateDeptWiseReportBtn');
    if (generateDeptWiseReportBtn) {
      const newBtn = generateDeptWiseReportBtn.cloneNode(true);
      generateDeptWiseReportBtn.parentNode.replaceChild(newBtn, generateDeptWiseReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.generateDeptWiseReport === 'function') {
          window.generateDeptWiseReport();
        }
      });
    }
    
    // Generate Sub-Department-Wise Report Button
    const generateSubDeptWiseReportBtn = document.getElementById('generateSubDeptWiseReportBtn');
    if (generateSubDeptWiseReportBtn) {
      const newBtn = generateSubDeptWiseReportBtn.cloneNode(true);
      generateSubDeptWiseReportBtn.parentNode.replaceChild(newBtn, generateSubDeptWiseReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.generateSubDeptWiseReport === 'function') {
          window.generateSubDeptWiseReport();
        }
      });
    }
    
    // Generate Department Comparison Report Button
    const generateDeptComparisonReportBtn = document.getElementById('generateDeptComparisonReportBtn');
    if (generateDeptComparisonReportBtn) {
      const newBtn = generateDeptComparisonReportBtn.cloneNode(true);
      generateDeptComparisonReportBtn.parentNode.replaceChild(newBtn, generateDeptComparisonReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.generateDeptComparisonReport === 'function') {
          window.generateDeptComparisonReport();
        }
      });
    }
    
    // Generate Branch Comparison Report Button
    const generateBranchComparisonReportBtn = document.getElementById('generateBranchComparisonReportBtn');
    if (generateBranchComparisonReportBtn) {
      const newBtn = generateBranchComparisonReportBtn.cloneNode(true);
      generateBranchComparisonReportBtn.parentNode.replaceChild(newBtn, generateBranchComparisonReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.generateBranchComparisonReport === 'function') {
          window.generateBranchComparisonReport();
        }
      });
    }
    
    // Print buttons
    const printSalesReportBtn = document.getElementById('printSalesReportBtn');
    if (printSalesReportBtn) {
      const newBtn = printSalesReportBtn.cloneNode(true);
      printSalesReportBtn.parentNode.replaceChild(newBtn, printSalesReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.printSalesReportPreview === 'function') {
          window.printSalesReportPreview();
        }
      });
    }
    
    const printComparisonReportBtn = document.getElementById('printComparisonReportBtn');
    if (printComparisonReportBtn) {
      const newBtn = printComparisonReportBtn.cloneNode(true);
      printComparisonReportBtn.parentNode.replaceChild(newBtn, printComparisonReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.printComparisonReportPreview === 'function') {
          window.printComparisonReportPreview();
        }
      });
    }
    
    const printDatewiseReportBtn = document.getElementById('printDatewiseReportBtn');
    if (printDatewiseReportBtn) {
      const newBtn = printDatewiseReportBtn.cloneNode(true);
      printDatewiseReportBtn.parentNode.replaceChild(newBtn, printDatewiseReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.printDateWiseData === 'function') {
          window.printDateWiseData();
        }
      });
    }
    
    const printPaymentReportBtn = document.getElementById('printPaymentReportBtn');
    if (printPaymentReportBtn) {
      const newBtn = printPaymentReportBtn.cloneNode(true);
      printPaymentReportBtn.parentNode.replaceChild(newBtn, printPaymentReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.printPaymentReportPreview === 'function') {
          window.printPaymentReportPreview();
        }
      });
    }
    
    const printDeptWiseReportBtn = document.getElementById('printDeptWiseReportBtn');
    if (printDeptWiseReportBtn) {
      const newBtn = printDeptWiseReportBtn.cloneNode(true);
      printDeptWiseReportBtn.parentNode.replaceChild(newBtn, printDeptWiseReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.printDeptWiseReport === 'function') {
          window.printDeptWiseReport();
        }
      });
    }
    
    const printSubDeptWiseReportBtn = document.getElementById('printSubDeptWiseReportBtn');
    if (printSubDeptWiseReportBtn) {
      const newBtn = printSubDeptWiseReportBtn.cloneNode(true);
      printSubDeptWiseReportBtn.parentNode.replaceChild(newBtn, printSubDeptWiseReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.printSubDeptWiseReport === 'function') {
          window.printSubDeptWiseReport();
        }
      });
    }
    
    const printDeptComparisonReportBtn = document.getElementById('printDeptComparisonReportBtn');
    if (printDeptComparisonReportBtn) {
      const newBtn = printDeptComparisonReportBtn.cloneNode(true);
      printDeptComparisonReportBtn.parentNode.replaceChild(newBtn, printDeptComparisonReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.printDeptComparisonReport === 'function') {
          window.printDeptComparisonReport();
        }
      });
    }
    
    const printBranchComparisonReportBtn = document.getElementById('printBranchComparisonReportBtn');
    if (printBranchComparisonReportBtn) {
      const newBtn = printBranchComparisonReportBtn.cloneNode(true);
      printBranchComparisonReportBtn.parentNode.replaceChild(newBtn, printBranchComparisonReportBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.printBranchComparisonReport === 'function') {
          window.printBranchComparisonReport();
        }
      });
    }
    
    // Set up branch change listeners for department-wise reports
    setupDepartmentReportListeners();
  }
  
  function setupDepartmentReportListeners() {
    // Department-Wise Report Branch Change
    const deptWiseReportBranch = document.getElementById('deptWiseReportBranch');
    if (deptWiseReportBranch) {
      const newSelect = deptWiseReportBranch.cloneNode(true);
      deptWiseReportBranch.parentNode.replaceChild(newSelect, deptWiseReportBranch);
      newSelect.addEventListener('change', function() {
        if (typeof window.loadDepartmentsForDeptWiseReport === 'function') {
          window.loadDepartmentsForDeptWiseReport();
        }
      });
    }
    
    // Sub-Department-Wise Report Branch Change
    const subDeptWiseReportBranch = document.getElementById('subDeptWiseReportBranch');
    if (subDeptWiseReportBranch) {
      const newSelect = subDeptWiseReportBranch.cloneNode(true);
      subDeptWiseReportBranch.parentNode.replaceChild(newSelect, subDeptWiseReportBranch);
      newSelect.addEventListener('change', function() {
        if (typeof window.loadDepartmentsForSubDeptWiseReport === 'function') {
          window.loadDepartmentsForSubDeptWiseReport();
        }
      });
    }
    
    // Sub-Department-Wise Report Department Change
    const subDeptWiseReportDepartment = document.getElementById('subDeptWiseReportDepartment');
    if (subDeptWiseReportDepartment) {
      const newSelect = subDeptWiseReportDepartment.cloneNode(true);
      subDeptWiseReportDepartment.parentNode.replaceChild(newSelect, subDeptWiseReportDepartment);
      newSelect.addEventListener('change', function() {
        if (typeof window.loadSubDepartmentsForSubDeptWiseReport === 'function') {
          window.loadSubDepartmentsForSubDeptWiseReport();
        }
      });
    }
    
    // Department Comparison Report Branch Change
    const deptComparisonReportBranch = document.getElementById('deptComparisonReportBranch');
    if (deptComparisonReportBranch) {
      const newSelect = deptComparisonReportBranch.cloneNode(true);
      deptComparisonReportBranch.parentNode.replaceChild(newSelect, deptComparisonReportBranch);
      newSelect.addEventListener('change', function() {
        if (typeof window.loadDepartmentsForDeptComparisonReport === 'function') {
          window.loadDepartmentsForDeptComparisonReport();
        }
      });
    }
    
    // Datewise search input
    const datewiseSearchInput = document.getElementById('datewiseSearch');
    if (datewiseSearchInput) {
      const newInput = datewiseSearchInput.cloneNode(true);
      datewiseSearchInput.parentNode.replaceChild(newInput, datewiseSearchInput);
      let searchTimeout;
      newInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          if (typeof window.generateDatewiseReport === 'function') {
            window.generateDatewiseReport();
          }
        }, 300);
      });
    }
  }

  function getReportData() {
    var fromDate = document.getElementById('reportDateFrom')?.value || document.getElementById('salesReportDateFrom')?.value;
    var toDate = document.getElementById('reportDateTo')?.value || document.getElementById('salesReportDateTo')?.value;
    var branchId = document.getElementById('reportBranch')?.value || document.getElementById('salesReportBranch')?.value;
    var filters = {}; 
    if (fromDate) filters.from = fromDate; 
    if (toDate) filters.to = toDate; 
    if (branchId) filters.branchId = branchId;
    var filteredSales = appData.sales || [];
    if (filters.from || filters.to){ 
      filteredSales = filteredSales.filter(function(sale){ 
        var saleDate = new Date(sale.date); 
        if (filters.from && saleDate < new Date(filters.from)) return false; 
        if (filters.to && saleDate > new Date(filters.to)) return false; 
        return true; 
      }); 
    }
    if (filters.branchId){ 
      filteredSales = filteredSales.filter(function(sale){ 
        var saleBranchId = (sale && sale.branchId && sale.branchId._id) ? sale.branchId._id : sale.branchId; 
        return saleBranchId === filters.branchId; 
      }); 
    }
    var categoryTotals = {}; 
    filteredSales.forEach(function(sale){ 
      var catId = (sale.categoryId && sale.categoryId._id) || sale.categoryId; 
      var catName = (sale.categoryId && sale.categoryId.name) || 'Unknown'; 
      if (!categoryTotals[catId]){ 
        categoryTotals[catId] = { name: catName, totalSales: 0, totalCost: 0, totalProfit: 0, profitMargin: 0 }; 
      } 
      categoryTotals[catId].totalSales += sale.total || 0; 
      categoryTotals[catId].totalCost += sale.costTotal || 0; 
      categoryTotals[catId].totalProfit += (sale.total || 0) - (sale.costTotal || 0); 
    }); 
    Object.keys(categoryTotals).forEach(function(catId){ 
      var cat = categoryTotals[catId]; 
      cat.profitMargin = cat.totalSales > 0 ? ((cat.totalProfit / cat.totalSales) * 100) : 0; 
    }); 
    var grandTotalSales = filteredSales.reduce(function(sum, sale){ return sum + (sale.total || 0); }, 0); 
    var grandTotalCost = filteredSales.reduce(function(sum, sale){ return sum + (sale.costTotal || 0); }, 0); 
    var grandTotalProfit = grandTotalSales - grandTotalCost; 
    var grandProfitMargin = grandTotalSales > 0 ? ((grandTotalProfit / grandTotalSales) * 100) : 0; 
    return { 
      filteredSales: filteredSales, 
      categoryTotals: categoryTotals, 
      grandTotalSales: grandTotalSales, 
      grandTotalCost: grandTotalCost, 
      grandTotalProfit: grandTotalProfit, 
      grandProfitMargin: grandProfitMargin 
    };
  }

  function createPrintContent(reportData, fromDate, toDate, branchName, branchAddress, reportType){
    var currentDate = new Date().toLocaleDateString('en-GB'); 
    var dateRange = (fromDate && toDate) ? (new Date(fromDate).toLocaleDateString('en-GB') + ' - ' + new Date(toDate).toLocaleDateString('en-GB')) : 'All Time'; 
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Sales Report - D.Watson Pharmacy</title><style>@page{size:A4;margin:1in;}body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.4;color:#000;background:#fff;margin:0;padding:0;}*{color:#000 !important}.print-header{text-align:center;margin-bottom:30px;border-bottom:2px solid #000;padding-bottom:15px}.print-header h1{font-size:24pt;font-weight:bold;margin:0 0 10px 0;color:#000}.print-header .company-info{font-size:10pt;color:#000;margin:5px 0;font-weight:500}.print-header .report-info{font-size:11pt;color:#000;margin:10px 0 0 0;font-weight:500}.print-section{margin-bottom:25px;page-break-inside:avoid}.print-section h3{font-size:14pt;font-weight:bold;color:#000;margin:0 0 15px 0;border-bottom:2px solid #000;padding-bottom:5px}.print-table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:10pt}.print-table th,.print-table td{border:1px solid #333;padding:8px;text-align:left;vertical-align:top}.print-table th{background-color:#f5f5f5;font-weight:bold;color:#000}.print-table .text-right{text-align:right}.print-table .text-center{text-align:center}.print-summary-boxes{display:flex;justify-content:space-between;margin-bottom:20px;gap:15px}.summary-box{flex:1;border:2px solid #333;border-left:5px solid #2c6e8a;padding:15px;text-align:center;background-color:#f8f9fa;box-shadow:0 2px 4px rgba(0,0,0,.1);display:flex;flex-direction:column;justify-content:center}.summary-label{font-size:12pt;color:#000;margin-bottom:8px;font-weight:bold}.summary-value{font-size:14pt;font-weight:bold;color:#000}.print-footer{margin-top:30px;text-align:center;font-size:9pt;color:#666;border-top:1px solid #ccc;padding-top:10px}</style></head><body><div class="print-container"><div class="print-header"><h1>D.Watson Group of Pharmacy</h1><div class="company-info">Sales Report</div><div class="report-info"><strong>Branch:</strong> ' + branchName + '<br>' + (branchAddress ? ('<strong>Address:</strong> ' + branchAddress + '<br>') : '') + '<strong>Period:</strong> ' + dateRange + '<br><strong>Generated:</strong> ' + currentDate + '</div></div>' + (reportType==='detailed' ? '' : ('<div class="print-section"><h3>Summary</h3><div class="print-summary-boxes"><div class="summary-box"><div class="summary-label">Total Sales</div><div class="summary-value">' + reportData.grandTotalSales.toLocaleString() + '</div></div><div class="summary-box"><div class="summary-label">Total Cost</div><div class="summary-value">' + reportData.grandTotalCost.toLocaleString() + '</div></div><div class="summary-box"><div class="summary-label">Total Profit</div><div class="summary-value">' + reportData.grandTotalProfit.toLocaleString() + '</div></div><div class="summary-box"><div class="summary-label">Profit Margin</div><div class="summary-value">' + reportData.grandProfitMargin.toFixed(1) + '%</div></div></div></div><div class="print-section"><h3>Category-wise Sales Breakdown</h3><table class="print-table"><thead><tr><th>Category</th><th class="text-right">Total Sales</th><th class="text-right">Total Cost</th><th class="text-right">Total Profit</th><th class="text-center">Profit Margin</th></tr></thead><tbody>' + Object.values(reportData.categoryTotals).map(function(cat){ return '<tr><td>' + cat.name + '</td><td class="text-right">' + cat.totalSales.toLocaleString() + '</td><td class="text-right">' + cat.totalCost.toLocaleString() + '</td><td class="text-right">' + cat.totalProfit.toLocaleString() + '</td><td class="text-center">' + cat.profitMargin.toFixed(1) + '%</td></tr>'; }).join('') + '<tr style="font-weight:bold;background-color:#f9f9f9;"><td><strong>GRAND TOTAL</strong></td><td class="text-right"><strong>' + reportData.grandTotalSales.toLocaleString() + '</strong></td><td class="text-right"><strong>' + reportData.grandTotalCost.toLocaleString() + '</strong></td><td class="text-right"><strong>' + reportData.grandTotalProfit.toLocaleString() + '</strong></td><td class="text-center"><strong>' + reportData.grandProfitMargin.toFixed(1) + '%</strong></td></tr></tbody></table></div>')) + ((reportType==='summary') ? '' : ('<div class="print-section"><h3>Detailed Transaction List</h3><table class="print-table"><thead><tr><th>Date</th><th>Branch</th><th>Category</th><th class="text-right">Sales</th><th class="text-right">Cost</th><th class="text-right">Profit</th></tr></thead><tbody>' + reportData.filteredSales.map(function(sale){ return '<tr><td>' + new Date(sale.date).toLocaleDateString('en-GB') + '</td><td>' + (sale.branchId && sale.branchId.name || 'Unknown') + '</td><td>' + (sale.categoryId && sale.categoryId.name || 'Unknown') + '</td><td class="text-right">' + ((sale.total||0).toLocaleString()) + '</td><td class="text-right">' + ((sale.costTotal||0).toLocaleString()) + '</td><td class="text-right">' + (((sale.total||0)-(sale.costTotal||0)).toLocaleString()) + '</td></tr>'; }).join('') + '</tbody></table></div>')) + '<div class="print-footer"><p>This report was generated on ' + currentDate + ' by D.Watson Pharmacy Management System</p><p>For any queries, please contact the management</p></div></div></body></html>';
  }

  function printProfessionalReport(){ 
    var fromDate = document.getElementById('reportDateFrom')?.value || document.getElementById('salesReportDateFrom')?.value; 
    var toDate = document.getElementById('reportDateTo')?.value || document.getElementById('salesReportDateTo')?.value; 
    var branchId = document.getElementById('reportBranch')?.value || document.getElementById('salesReportBranch')?.value; 
    var selectedBranch = branchId ? appData.branches.find(function(b){ return b._id === branchId; }) : null; 
    var branchName = selectedBranch ? selectedBranch.name : 'All Branches'; 
    var branchAddress = selectedBranch ? selectedBranch.address : ''; 
    var reportData = getReportData(); 
    var printContent = createPrintContent(reportData, fromDate, toDate, branchName, branchAddress, 'full'); 
    try { 
      var printWindow = window.open('', '_blank', 'width=800,height=600'); 
      if (!printWindow) throw new Error('Popup blocked. Please allow popups for this site.'); 
      printWindow.document.write(printContent); 
      printWindow.document.close(); 
      printWindow.onload = function(){ 
        printWindow.focus(); 
        printWindow.print(); 
        printWindow.close(); 
      }; 
    } catch (error) { 
      console.error('Print window error:', error); 
      if (typeof showNotification === 'function') showNotification('Print failed: ' + error.message, 'error'); 
    } 
  }

  function previewReport(){ 
    var fromDate = document.getElementById('reportDateFrom')?.value || document.getElementById('salesReportDateFrom')?.value; 
    var toDate = document.getElementById('reportDateTo')?.value || document.getElementById('salesReportDateTo')?.value; 
    var branchId = document.getElementById('reportBranch')?.value || document.getElementById('salesReportBranch')?.value; 
    var selectedBranch = branchId ? appData.branches.find(function(b){ return b._id === branchId; }) : null; 
    var branchName = selectedBranch ? selectedBranch.name : 'All Branches'; 
    var branchAddress = selectedBranch ? selectedBranch.address : ''; 
    var reportData = getReportData(); 
    var printContent = createPrintContent(reportData, fromDate, toDate, branchName, branchAddress); 
    try { 
      var previewWindow = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes'); 
      if (!previewWindow) throw new Error('Popup blocked. Please allow popups for this site.'); 
      previewWindow.document.write(printContent); 
      previewWindow.document.close(); 
      previewWindow.onload = function(){ 
        var printBtn = previewWindow.document.createElement('button'); 
        printBtn.innerHTML = '<i class="fas fa-print"></i> Print'; 
        printBtn.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;'; 
        printBtn.onclick = function(){ previewWindow.print(); }; 
        previewWindow.document.body.appendChild(printBtn); 
      }; 
    } catch (error) { 
      console.error('Preview window error:', error); 
      if (typeof showNotification === 'function') showNotification('Preview failed: ' + error.message, 'error'); 
    } 
  }

  function downloadPdfReport(){ 
    var fromDate = document.getElementById('reportDateFrom')?.value || document.getElementById('salesReportDateFrom')?.value; 
    var toDate = document.getElementById('reportDateTo')?.value || document.getElementById('salesReportDateTo')?.value; 
    var branchId = document.getElementById('reportBranch')?.value || document.getElementById('salesReportBranch')?.value; 
    var selectedBranch = branchId ? appData.branches.find(function(b){ return b._id === branchId; }) : null; 
    var branchName = selectedBranch ? selectedBranch.name : 'All Branches'; 
    var branchAddress = selectedBranch ? selectedBranch.address : ''; 
    var reportData = getReportData(); 
    var printContent = createPrintContent(reportData, fromDate, toDate, branchName, branchAddress); 
    try { 
      var tempWindow = window.open('', '_blank', 'width=800,height=600'); 
      if (!tempWindow) throw new Error('Popup blocked. Please allow popups for this site.'); 
      tempWindow.document.write(printContent); 
      tempWindow.document.close(); 
      tempWindow.onload = function(){ 
        tempWindow.print(); 
        setTimeout(function(){ tempWindow.close(); }, 1000); 
      }; 
    } catch (error) { 
      console.error('PDF generation error:', error); 
      if (typeof showNotification === 'function') showNotification('PDF generation failed: ' + error.message, 'error'); 
    } 
  }

  // Expose functions to global scope
  window.getReportData = getReportData;
  window.createPrintContent = createPrintContent;
  window.printProfessionalReport = printProfessionalReport;
  window.previewReport = previewReport;
  window.downloadPdfReport = downloadPdfReport;
  
  // Track initialization state
  let reportsInitialized = false;
  
  // Initialize when section loads
  document.addEventListener('sectionLoaded', function(e) {
    if (e && e.detail && e.detail.sectionName === 'reports') {
      reportsInitialized = false; // Reset on each load
      setTimeout(() => {
        initReportsSection();
      }, 100);
    }
  });
  
  // Also try to initialize when DOM is ready (in case section is already visible)
  function tryInitReports() {
    const section = document.getElementById('reports-section');
    if (section && section.classList.contains('active') && !reportsInitialized) {
      reportsInitialized = true;
      initReportsSection();
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tryInitReports, 200);
    });
  } else {
    setTimeout(tryInitReports, 200);
  }
  
  // Also try when API becomes available
  const checkAPIInterval = setInterval(() => {
    if (window.api && typeof window.api.getBranches === 'function') {
      clearInterval(checkAPIInterval);
      const section = document.getElementById('reports-section');
      if (section && section.classList.contains('active') && !reportsInitialized) {
        reportsInitialized = true;
        initReportsSection();
      }
    }
  }, 500);
  
  // Clear interval after 10 seconds to avoid infinite checking
  setTimeout(() => clearInterval(checkAPIInterval), 10000);
})();
