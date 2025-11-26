;(function(){
  function init(){
    var section = document.getElementById('income-statement-report-section');
    if (!section) return;
    if (!window.api) return;
    setDefaultDates();
    loadBranches();
    loadGroups();
    setupListeners();
    
    // Auto-refresh data when section is opened
    autoRefreshOnOpen();
  }
  
  function autoRefreshOnOpen(){
    // Check if section is visible
    var section = document.getElementById('income-statement-report-section');
    if (!section) return;
    
    // Use MutationObserver to detect when section becomes visible
    var checkAndAutoLoad = function(){
      var isVisible = section.offsetParent !== null && 
                     window.getComputedStyle(section).display !== 'none' &&
                     section.classList.contains('active');
      
      if (isVisible){
        var branchSelect = document.getElementById('isrBranchSelect');
        var fromDate = document.getElementById('isrFromDate');
        var toDate = document.getElementById('isrToDate');
        
        // If branch and dates are set, auto-generate report
        if (branchSelect && branchSelect.value && fromDate && fromDate.value && toDate && toDate.value){
          console.log('🔄 Auto-refreshing income statement report on screen open...');
          // Small delay to ensure DOM is ready
          setTimeout(function(){
            generate();
          }, 500);
        }
      }
    };
    
    // Check immediately
    setTimeout(checkAndAutoLoad, 1000);
    
    // Also observe section visibility changes
    var observer = new MutationObserver(function(mutations){
      checkAndAutoLoad();
    });
    
    observer.observe(section, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      childList: false,
      subtree: false
    });
    
    // Also listen for section show events
    document.addEventListener('sectionShown', function(e){
      if (e && e.detail && e.detail.sectionName === 'income-statement-report'){
        setTimeout(checkAndAutoLoad, 300);
      }
    });
    
    // Listen for custom income statement section shown event
    document.addEventListener('incomeStatementSectionShown', function(e){
      console.log('📢 Income Statement section shown event received');
      setTimeout(checkAndAutoLoad, 500);
    });
  }

  function loadBranches(){
    if (!window.appData || !appData.branches || !appData.branches.length){
      api.getBranches().then(function(branches){
        window.appData = window.appData || {};
        appData.branches = branches;
        populateBranchSelect();
        // Auto-refresh after branches are loaded if dates are set
        setTimeout(function(){
          var branchSelect = document.getElementById('isrBranchSelect');
          var fromDate = document.getElementById('isrFromDate');
          var toDate = document.getElementById('isrToDate');
          if (branchSelect && branchSelect.value && fromDate && fromDate.value && toDate && toDate.value){
            generate();
          }
        }, 800);
      }).catch(function(){});
    } else {
      populateBranchSelect();
      // Auto-refresh after branches are populated if dates are set
      setTimeout(function(){
        var branchSelect = document.getElementById('isrBranchSelect');
        var fromDate = document.getElementById('isrFromDate');
        var toDate = document.getElementById('isrToDate');
        if (branchSelect && branchSelect.value && fromDate && fromDate.value && toDate && toDate.value){
          generate();
        }
      }, 800);
    }
  }

  function populateBranchSelect(){
    var sel = document.getElementById('isrBranchSelect');
    if (!sel || !appData.branches) return;
    var first = sel.options[0];
    sel.innerHTML = '';
    if (first) sel.appendChild(first);
    var userBranches = appData.currentUser && appData.currentUser.branches ? appData.currentUser.branches : [];
    var userBranchIds = userBranches.map(function(b){ return (b._id || b).toString(); });
    appData.branches.forEach(function(b){
      if (userBranchIds.length && !userBranchIds.includes(b._id.toString())) return;
      var opt = document.createElement('option');
      opt.value = b._id;
      opt.textContent = b.name || 'Unnamed';
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function(){ 
      loadDepartmentsForBranch(this.value);
      // Auto-refresh report if dates are already set
      var fromDate = document.getElementById('isrFromDate');
      var toDate = document.getElementById('isrToDate');
      if (this.value && fromDate && fromDate.value && toDate && toDate.value){
        setTimeout(function(){ generate(); }, 500);
      }
    });
    if (sel.value) loadDepartmentsForBranch(sel.value);
  }

  function loadDepartmentsForBranch(branchId){
    if (!branchId) {
      var sel = document.getElementById('isrSectionSelect');
      if (sel) {
        var first = sel.options[0];
        sel.innerHTML = '';
        if (first) sel.appendChild(first);
      }
      return;
    }
    api.getDepartments(branchId).then(function(departments){
      var sel = document.getElementById('isrSectionSelect');
      if (!sel) return;
      var first = sel.options[0];
      sel.innerHTML = '';
      if (first) sel.appendChild(first);
      departments.forEach(function(d){
        var opt = document.createElement('option');
        opt.value = d._id;
        opt.textContent = d.name || 'Unnamed';
        sel.appendChild(opt);
      });
    }).catch(function(){});
  }

  function setDefaultDates(){
    var from = document.getElementById('isrFromDate');
    var to = document.getElementById('isrToDate');
    // Don't auto-set dates - let user select manually
    if (from) {
      // Add change listener for auto-refresh
      from.addEventListener('change', function(){
        var branchSelect = document.getElementById('isrBranchSelect');
        var toDate = document.getElementById('isrToDate');
        if (branchSelect && branchSelect.value && toDate && toDate.value){
          setTimeout(function(){ generate(); }, 500);
        }
      });
    }
    if (to) {
      // Add change listener for auto-refresh
      to.addEventListener('change', function(){
        var branchSelect = document.getElementById('isrBranchSelect');
        var fromDate = document.getElementById('isrFromDate');
        if (branchSelect && branchSelect.value && fromDate && fromDate.value){
          setTimeout(function(){ generate(); }, 500);
        }
      });
    }
  }

  function loadGroups(){
    api.getGroups().then(function(groups){
      window.appData = window.appData || {};
      appData.groups = groups;
      var sel = document.getElementById('isrGroupSelect');
      if (sel){
        var first = sel.options[0];
        sel.innerHTML = '';
        if (first) sel.appendChild(first);
        groups.forEach(function(g){
          var opt = document.createElement('option');
          opt.value = g._id;
          opt.textContent = g.name || 'Unnamed';
          sel.appendChild(opt);
        });
      }
    }).catch(function(){});
  }

  function setupListeners(){
    document.querySelectorAll('#income-statement-report-section .report-tab').forEach(function(tab){
      var t = tab.cloneNode(true);
      tab.parentNode.replaceChild(t, tab);
      t.addEventListener('click', function(){
        var name = this.getAttribute('data-tab');
        switchTab(name);
      });
    });
    var btn = document.getElementById('isrGenerateBtn');
    if (btn){
      var n = btn.cloneNode(true);
      btn.parentNode.replaceChild(n, btn);
      n.addEventListener('click', function(e){ e.preventDefault(); generate(); });
    }
    
    // Setup event listeners for expenses and short cash input fields
    setupSummaryInputs();
    
    // Setup save, list, and print buttons
    setupReportActions();
  }
  
  function setupSummaryInputs(){
    var expensesEl = document.getElementById('isrSummaryExpenses');
    var shortCashEl = document.getElementById('isrSummaryShortCash');
    
    if (expensesEl && expensesEl.tagName === 'INPUT') {
      // Clone to remove existing listeners and add new ones
      var newExpenses = expensesEl.cloneNode(true);
      expensesEl.parentNode.replaceChild(newExpenses, expensesEl);
      newExpenses.addEventListener('input', function(){
        recalculateNetProfit();
      });
      newExpenses.addEventListener('change', function(){
        recalculateNetProfit();
      });
    }
    
    if (shortCashEl && shortCashEl.tagName === 'INPUT') {
      // Clone to remove existing listeners and add new ones
      var newShortCash = shortCashEl.cloneNode(true);
      shortCashEl.parentNode.replaceChild(newShortCash, shortCashEl);
      newShortCash.addEventListener('input', function(){
        recalculateNetProfit();
      });
      newShortCash.addEventListener('change', function(){
        recalculateNetProfit();
      });
    }
  }

  function switchTab(tab){
    document.querySelectorAll('#income-statement-report-section .report-tab').forEach(function(t){
      t.classList.toggle('active', t.getAttribute('data-tab')===tab);
    });
    document.querySelectorAll('#income-statement-report-section .report-tab-content').forEach(function(c){
      c.classList.toggle('active', c.id==='tab-'+tab);
    });
  }

  function qs(obj){
    var p = new URLSearchParams();
    Object.keys(obj).forEach(function(k){ var v=obj[k]; if(v!==undefined&&v!==null&&String(v).trim()!=='') p.append(k,v); });
    return p.toString();
  }

  function fmt(n){
    var x = Number(n||0);
    return x.toLocaleString(undefined,{maximumFractionDigits:0});
  }

  function generate(){
    var branch = document.getElementById('isrBranchSelect');
    var section = document.getElementById('isrSectionSelect');
    var group = document.getElementById('isrGroupSelect');
    var from = document.getElementById('isrFromDate');
    var to = document.getElementById('isrToDate');
    var params = { 
      branchId: branch?branch.value:'', 
      departmentId: section?section.value:'', 
      groupId: group?group.value:'', 
      from: from?from.value:'', 
      to: to?to.value:'' 
    };
    // Add cache-busting timestamp and random string to ensure fresh data from backend
    params._t = Date.now();
    params._r = Math.random().toString(36).substring(7);
    var url = '/reports/income-statement'+(function(){var s=qs(params);return s?'?'+s:'';})();
    console.log('🔍 Requesting income statement (with cache-bust):', url, params);
    api.request(url).then(function(data){
      console.log('✅ Income statement data received:', data);
      window.isrData = data;
      render(data);
      if (data.branch && data.branch.name){
        var branchNameEl = document.getElementById('isrBranchName');
        var branchHeader = document.getElementById('isrBranchNameHeader');
        if (branchNameEl) branchNameEl.textContent = data.branch.name;
        if (branchHeader) branchHeader.style.display = 'block';
      }
    }).catch(function(err){
      console.error(err);
      if (typeof showNotification === 'function') showNotification('Failed to generate report: ' + (err.message || 'Unknown error'), 'error');
    });
  }

  function render(data){
    var tbody = document.getElementById('isrTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var rows = data && data.items ? data.items : [];
    
    // Debug: Log data received
    console.log('📊 Income Statement Data:', {
      itemCount: rows.length,
      sampleItem: rows[0],
      fullData: data
    });
    
    if (!rows.length){
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 13; td.className = 'text-center text-muted py-4'; td.textContent = 'No data';
      tr.appendChild(td); tbody.appendChild(tr);
      updateSummary({});
      return;
    }
    
    // Group rows by department
    var deptGroups = {};
    var rowIndex = 0;
    
    rows.forEach(function(r){
      var deptName = r.departmentName || 'Uncategorized';
      var deptId = r.departmentId ? (r.departmentId._id || r.departmentId).toString() : 'none';
      var deptSequence = r.departmentSequence !== undefined ? r.departmentSequence : 0;
      
      if (!deptGroups[deptId]) {
        deptGroups[deptId] = {
          name: deptName,
          id: deptId,
          sequence: deptSequence,
          items: []
        };
      }
      deptGroups[deptId].items.push(r);
    });
    
    // Sort departments by sequence, then by name (if sequences are equal)
    var sortedDeptIds = Object.keys(deptGroups).sort(function(a, b){
      var seqA = deptGroups[a].sequence || 0;
      var seqB = deptGroups[b].sequence || 0;
      if (seqA !== seqB) {
        return seqA - seqB;
      }
      return deptGroups[a].name.localeCompare(deptGroups[b].name);
    });
    
    // Render grouped data
    sortedDeptIds.forEach(function(deptId){
      var dept = deptGroups[deptId];
      
      // Sort sub-departments within this department by sequence, then by name
      dept.items.sort(function(a, b){
        var seqA = (a.subDepartment && a.subDepartment.sequence !== undefined) ? a.subDepartment.sequence : 0;
        var seqB = (b.subDepartment && b.subDepartment.sequence !== undefined) ? b.subDepartment.sequence : 0;
        if (seqA !== seqB) {
          return seqA - seqB;
        }
        var nameA = (a.subDepartment && a.subDepartment.name) || '';
        var nameB = (b.subDepartment && b.subDepartment.name) || '';
        return nameA.localeCompare(nameB);
      });
      
      // Add department header row
      var deptTr = document.createElement('tr');
      deptTr.className = 'isr-dept-header';
      deptTr.style.backgroundColor = '#e9ecef';
      deptTr.style.fontWeight = 'bold';
      deptTr.innerHTML = '<td colspan="13" style="padding: 12px; font-size: 1.1em; border: 1px solid #000000; color: #000000; background-color: #e9ecef;"><i class="fas fa-building me-2"></i>' + dept.name + '</td>';
      tbody.appendChild(deptTr);
      
      // Add column header row for this department
      var headerTr = document.createElement('tr');
      headerTr.className = 'isr-dept-column-header';
      headerTr.innerHTML = '<th style="padding: 10px 8px; text-align: left; vertical-align: middle; background-color: #000000; color: #ffffff; border: 1px solid #ffffff;">Sub Department</th>' +
        '<th class="text-end" style="padding: 10px 8px; text-align: right; vertical-align: middle; background-color: #000000; color: #ffffff; border: 1px solid #ffffff;">Sales</th>' +
        '<th class="text-end" style="padding: 10px 8px; text-align: right; vertical-align: middle; background-color: #000000; color: #ffffff; border: 1px solid #ffffff;">Returns</th>' +
        '<th class="text-end" style="padding: 10px 8px; text-align: right; vertical-align: middle; background-color: #000000; color: #ffffff; border: 1px solid #ffffff;">GST</th>' +
        '<th class="text-end" style="padding: 10px 8px; text-align: right; vertical-align: middle; background-color: #000000; color: #ffffff; border: 1px solid #ffffff;">Net Sale</th>' +
        '<th class="text-end" style="padding: 10px 8px; text-align: right; vertical-align: middle; background-color: #000000; color: #ffffff; border: 1px solid #ffffff;">Cost</th>' +
        '<th class="text-end" style="padding: 10px 8px; text-align: right; vertical-align: middle; background-color: #000000; color: #ffffff; border: 1px solid #ffffff;">G Profit W-B-D</th>' +
        '<th class="text-end" style="padding: 10px 8px; text-align: right; vertical-align: middle; background-color: #000000; color: #ffffff; border: 1px solid #ffffff;">Bank Ded</th>' +
        '<th class="text-end" style="padding: 10px 8px; text-align: right; vertical-align: middle; background-color: #000000; color: #ffffff; border: 1px solid #ffffff;">G.P</th>' +
        '<th class="text-end" style="padding: 10px 8px; text-align: right; vertical-align: middle; background-color: #000000; color: #ffffff; border: 1px solid #ffffff;">DISC %</th>' +
        '<th class="text-end" style="padding: 10px 8px; text-align: right; vertical-align: middle; background-color: #000000; color: #ffffff; border: 1px solid #ffffff;">Discount Value</th>' +
        '<th class="text-end" style="padding: 10px 8px; text-align: right; vertical-align: middle; background-color: #000000; color: #ffffff; border: 1px solid #ffffff;">GP Rate %</th>' +
        '<th class="text-center" style="padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #000000; color: #ffffff; border: 1px solid #ffffff;">MARGIN DED %</th>';
      tbody.appendChild(headerTr);
      
      // Initialize department totals
      var deptTotals = {
        sales: 0,
        returns: 0,
        gst: 0,
        net: 0,
        cost: 0,
        gross: 0,
        bank: 0,
        gp: 0,
        discount: 0
      };
      
      // Get marginDedPercent once for the department (for rowspan merge)
      var deptMarginDedPercent = dept.items.length > 0 && dept.items[0].departmentMarginDedPercent ? Number(dept.items[0].departmentMarginDedPercent) : 0;
      var deptRowCount = 0; // Count valid sub-department rows for rowspan
      
      // First pass: count valid rows
      dept.items.forEach(function(r){
        if (r.subDepartment && r.subDepartment.name) {
          deptRowCount++;
        }
      });
      
      // Add sub-department rows for this department
      var isFirstRow = true;
      dept.items.forEach(function(r){
        // Skip items without sub-department data
        if (!r.subDepartment || !r.subDepartment.name) {
          console.warn('⚠️ Skipping item without sub-department:', r);
          return;
        }
        
        var sales = Number(r.sales||0);
        var returns = Number(r.returns||0);
        var gst = Number(r.gst||0);
        // Calculate net sale using formula: sales - returns + GST
        var net = sales - returns + gst;
        // Get cost from sales entry data (no calculation)
        var cost = Number(r.cost || 0);
        // Calculate gross profit using actual cost from data
        var gross = net - cost;
        var bankVal = 0; // Bank Ded starts as 0
        var discountPct = Number(r.discountPercent||0);
        var discountAmt = Number(r.discountAmount||0);
        var gp = gross - bankVal; // GP calculation
        var gpRate = net>0 ? (gp*100/net) : 0;
        
        // Add to department totals
        deptTotals.sales += sales;
        deptTotals.returns += returns;
        deptTotals.gst += gst;
        deptTotals.net += net;
        deptTotals.cost += cost;
        deptTotals.gross += gross;
        deptTotals.bank += bankVal;
        deptTotals.gp += gp;
        deptTotals.discount += discountAmt;
        
        var tr = document.createElement('tr');
        tr.className = 'isr-subdept-row';
        tr.setAttribute('data-dept-id', deptId);
        
        // Build row HTML - include MARGIN DED % only in first row with rowspan
        var rowHtml = '<td style="padding-left: 30px; padding-right: 20px; text-align: left; border: 1px solid #000000;"><strong>'+r.subDepartment.name+'</strong></td>'+
          '<td class="text-end" style="text-align: right; border: 1px solid #000000;">'+fmt(sales)+'</td>'+
          '<td class="text-end" style="text-align: right; border: 1px solid #000000;">'+fmt(returns)+'</td>'+
          '<td class="text-end" style="text-align: right; border: 1px solid #000000;">'+fmt(gst)+'</td>'+
          '<td class="text-end" style="text-align: right; border: 1px solid #000000;" data-val="net">'+fmt(net)+'</td>'+
          '<td class="text-end" style="text-align: right; border: 1px solid #000000;" data-val="cost">'+fmt(cost)+'</td>'+
          '<td class="text-end" style="text-align: right; border: 1px solid #000000;" data-val="gross">'+fmt(gross)+'</td>'+
          '<td class="text-end" style="text-align: right; padding: 8px; border: 1px solid #000000;"><input type="number" class="form-control form-control-sm isr-input" data-idx="'+rowIndex+'" data-field="bankDed" data-subdept-id="'+(r.subDepartment._id || r.subDepartment).toString()+'" placeholder="Enter amount" value=""></td>'+
          '<td class="text-end" style="text-align: right; border: 1px solid #000000;" data-val="gp">'+fmt(gp)+'</td>'+
          '<td class="text-end" style="text-align: right; border: 1px solid #000000;" data-val="discountPct">'+(discountPct.toFixed(2))+'</td>'+
          '<td class="text-end" style="text-align: right; border: 1px solid #000000;" data-val="discount">'+fmt(discountAmt)+'</td>'+
          '<td class="text-end" style="text-align: right; border: 1px solid #000000;" data-val="rate">'+(gpRate.toFixed(2))+'</td>';
        
        // Add MARGIN DED % only in first row with rowspan to merge across all rows
        if (isFirstRow && deptRowCount > 0) {
          rowHtml += '<td class="text-center" style="text-align: center; border: 1px solid #000000; vertical-align: middle; padding: 10px 8px;" rowspan="'+deptRowCount+'" data-val="marginDed"><strong>'+(deptMarginDedPercent > 0 ? deptMarginDedPercent.toFixed(2) + '%' : '')+'</strong></td>';
          isFirstRow = false;
        }
        
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
        rowIndex++;
      });
      
      // Add Sub Total row for this department (blue highlighted)
      // Initially set all cost-related values to 0 - they will be recalculated from input fields
      if (dept.items.length > 0) {
        var grandTotalTr = document.createElement('tr');
        grandTotalTr.className = 'isr-dept-grand-total';
        grandTotalTr.setAttribute('data-dept-id', deptId);
        grandTotalTr.innerHTML = '<td style="padding-left: 30px; padding-right: 20px; font-weight: bold; background-color: #2C6EBA; color: #ffffff; border: 1px solid #ffffff;">Sub Total</td>'+
          '<td class="text-end" style="font-weight: bold; background-color: #2C6EBA; color: #ffffff; border: 1px solid #ffffff;">'+fmt(deptTotals.sales)+'</td>'+
          '<td class="text-end" style="font-weight: bold; background-color: #2C6EBA; color: #ffffff; border: 1px solid #ffffff;">'+fmt(deptTotals.returns)+'</td>'+
          '<td class="text-end" style="font-weight: bold; background-color: #2C6EBA; color: #ffffff; border: 1px solid #ffffff;">'+fmt(deptTotals.gst)+'</td>'+
          '<td class="text-end" style="font-weight: bold; background-color: #2C6EBA; color: #ffffff; border: 1px solid #ffffff;" data-val="net">'+fmt(deptTotals.net)+'</td>'+
          '<td class="text-end" style="font-weight: bold; background-color: #2C6EBA; color: #ffffff; border: 1px solid #ffffff;" data-val="cost">'+fmt(deptTotals.cost)+'</td>'+
          '<td class="text-end" style="font-weight: bold; background-color: #2C6EBA; color: #ffffff; border: 1px solid #ffffff;" data-val="gross">'+fmt(deptTotals.gross)+'</td>'+
          '<td class="text-end" style="font-weight: bold; background-color: #2C6EBA; color: #ffffff; border: 1px solid #ffffff;" data-val="bank">0</td>'+
          '<td class="text-end" style="font-weight: bold; background-color: #2C6EBA; color: #ffffff; border: 1px solid #ffffff;" data-val="gp">'+fmt(deptTotals.gp)+'</td>'+
          '<td class="text-end" style="font-weight: bold; background-color: #2C6EBA; color: #ffffff; border: 1px solid #ffffff;" data-val="discountPct">'+(deptTotals.sales > 0 ? (deptTotals.discount * 100 / deptTotals.sales).toFixed(2) : '0.00')+'</td>'+
          '<td class="text-end" style="font-weight: bold; background-color: #2C6EBA; color: #ffffff; border: 1px solid #ffffff;" data-val="discount">'+fmt(deptTotals.discount)+'</td>'+
          '<td class="text-end" style="font-weight: bold; background-color: #2C6EBA; color: #ffffff; border: 1px solid #ffffff;" data-val="rate">'+(deptTotals.net > 0 ? (deptTotals.gp * 100 / deptTotals.net).toFixed(2) : '0.00')+'</td>'+
          '<td class="text-center" style="font-weight: bold; background-color: #2C6EBA; color: #ffffff; border: 1px solid #ffffff; text-align: center; padding: 10px 8px;" data-val="marginDed"></td>';
        tbody.appendChild(grandTotalTr);
        
        // Recalculate Sub Total from actual input field values
        recalcDeptGrandTotal(deptId);
      }
    });
    
    bindInputs();
    recomputeTotals();
    updateSummary(data.summary||{});
  }

  function bindInputs(){
    document.querySelectorAll('#income-statement-report-section .isr-input').forEach(function(inp){
      var n = inp.cloneNode(true);
      inp.parentNode.replaceChild(n, inp);
      n.addEventListener('input', function(){ recalcRow(this.getAttribute('data-idx')); });
    });
  }

  function recalcRow(idx){
    idx = Number(idx);
    var tbody = document.getElementById('isrTableBody');
    // Find row by data-idx attribute (skip header rows)
    var row = null;
    var deptId = null;
    Array.from(tbody.rows).forEach(function(r){
      if (r.classList.contains('isr-dept-header') || r.classList.contains('isr-dept-grand-total')) return;
      var input = r.querySelector('input[data-idx="'+idx+'"]');
      if (input) {
        row = r;
        deptId = r.getAttribute('data-dept-id');
      }
    });
    if (!row) return;
    var netEl = row.querySelector('[data-val="net"]');
    var costEl = row.querySelector('[data-val="cost"]');
    var grossEl = row.querySelector('[data-val="gross"]');
    var bankEl = row.querySelector('[data-val="bank"]');
    var gpEl = row.querySelector('[data-val="gp"]');
    var rateEl = row.querySelector('[data-val="rate"]');
    var net = numText(netEl);
    var cost = Number(costEl ? numText(costEl) : 0);
    var bankDedInput = row.querySelector('input[data-field="bankDed"]');
    var gross = net - cost;
    var bankVal = Number(bankDedInput && bankDedInput.value ? bankDedInput.value : 0);
    var gp = gross - bankVal;
    var rate = net>0 ? (gp*100/net) : 0;
    setText(grossEl, gross);
    setText(bankEl, bankVal);
    setText(gpEl, gp);
    if (rateEl) rateEl.textContent = rate.toFixed(2);
    
    // Recalculate Sub Total for this department
    if (deptId) {
      recalcDeptGrandTotal(deptId);
    }
    
    recomputeTotals();
  }
  
  function recalcDeptGrandTotal(deptId){
    var tbody = document.getElementById('isrTableBody');
    var deptTotals = {
      sales: 0,
      returns: 0,
      gst: 0,
      net: 0,
      cost: 0,
      gross: 0,
      bank: 0,
      gp: 0,
      discount: 0
    };
    
    // Sum all sub-department rows for this department
    Array.from(tbody.rows).forEach(function(r){
      if (r.classList.contains('isr-dept-header') || r.classList.contains('isr-dept-grand-total')) return;
      if (r.getAttribute('data-dept-id') !== deptId) return;
      
      deptTotals.sales += parseCell(r, 2);
      deptTotals.returns += parseCell(r, 3);
      deptTotals.gst += parseCell(r, 4);
      var netRow = parseDataVal(r, 'net');
      deptTotals.net += netRow;
      
      // Calculate cost, gross, bank, and gp from data values
      var costEl = r.querySelector('[data-val="cost"]');
      var bankDedInput = r.querySelector('input[data-field="bankDed"]');
      var costRow = Number(costEl ? parseDataVal(r, 'cost') : 0);
      var bankValRow = Number(bankDedInput && bankDedInput.value ? bankDedInput.value : 0);
      var grossRow = netRow - costRow; // G Profit W-B-D
      var gpRow = grossRow - bankValRow; // G.P
      
      deptTotals.cost += costRow;
      deptTotals.gross += grossRow;
      deptTotals.bank += bankValRow;
      deptTotals.gp += gpRow;
      deptTotals.discount += parseDataVal(r, 'discount');
    });
    
    // Update Sub Total row
    var grandTotalRow = tbody.querySelector('tr.isr-dept-grand-total[data-dept-id="'+deptId+'"]');
    if (grandTotalRow) {
      var grandTotalRate = deptTotals.net > 0 ? (deptTotals.gp * 100 / deptTotals.net) : 0;
      var cells = grandTotalRow.cells;
      // Maintain background color and white borders for all cells
      Array.from(cells).forEach(function(cell) {
        cell.style.backgroundColor = '#2C6EBA';
        cell.style.color = '#ffffff';
        cell.style.border = '1px solid #ffffff';
      });
      if (cells[1]) cells[1].textContent = fmt(deptTotals.sales);
      if (cells[2]) cells[2].textContent = fmt(deptTotals.returns);
      if (cells[3]) cells[3].textContent = fmt(deptTotals.gst);
      var netCell = grandTotalRow.querySelector('[data-val="net"]');
      if (netCell) netCell.textContent = fmt(deptTotals.net);
      if (cells[5]) cells[5].textContent = fmt(deptTotals.cost);
      var grossCell = grandTotalRow.querySelector('[data-val="gross"]');
      if (grossCell) grossCell.textContent = fmt(deptTotals.gross);
      var bankCell = grandTotalRow.querySelector('[data-val="bank"]');
      if (bankCell) bankCell.textContent = fmt(deptTotals.bank);
      var gpCell = grandTotalRow.querySelector('[data-val="gp"]');
      if (gpCell) gpCell.textContent = fmt(deptTotals.gp);
      var discountPctCell = grandTotalRow.querySelector('[data-val="discountPct"]');
      if (discountPctCell) discountPctCell.textContent = (deptTotals.sales > 0 ? (deptTotals.discount * 100 / deptTotals.sales).toFixed(2) : '0.00');
      var discountCell = grandTotalRow.querySelector('[data-val="discount"]');
      if (discountCell) discountCell.textContent = fmt(deptTotals.discount);
      var rateCell = grandTotalRow.querySelector('[data-val="rate"]');
      if (rateCell) rateCell.textContent = grandTotalRate.toFixed(2);
      var marginDedCell = grandTotalRow.querySelector('[data-val="marginDed"]');
      if (marginDedCell) {
        // Sub Total row should have empty MARGIN DED % (as per reference image)
        marginDedCell.textContent = '';
      }
    }
  }

  function numText(el){
    var t = (el && el.textContent) ? el.textContent.replace(/,/g,'') : '0';
    return Number(t)||0;
  }

  function setText(el, val){
    if (el) el.textContent = fmt(val);
  }

  function recomputeTotals(){
    var tbody = document.getElementById('isrTableBody');
    var totals = { sales:0, returns:0, gst:0, net:0, cost:0, gross:0, bank:0, gp:0, discount:0 };
    Array.from(tbody.rows).forEach(function(r){
      // Skip department header rows and Sub Total rows
      if (r.classList.contains('isr-dept-header') || r.classList.contains('isr-dept-grand-total')) return;
      
      totals.sales += parseCell(r,2);
      totals.returns += parseCell(r,3);
      totals.gst += parseCell(r,4);
      totals.net += parseDataVal(r,'net');
      var costEl = r.querySelector('[data-val="cost"]');
      totals.cost += Number(costEl ? parseDataVal(r,'cost') : 0);
      totals.gross += parseDataVal(r,'gross');
      totals.bank += parseDataVal(r,'bank');
      totals.gp += parseDataVal(r,'gp');
      totals.discount += parseDataVal(r,'discount');
    });
    // Update footer totals and maintain background color
    var totalRow = document.querySelector('tfoot .isr-total-row');
    if (totalRow) {
      Array.from(totalRow.cells).forEach(function(cell) {
        cell.style.backgroundColor = '#000000';
        cell.style.color = '#ffffff';
        cell.style.border = '1px solid #ffffff';
      });
    }
    setEl('isrTotalSales', totals.sales);
    setEl('isrTotalReturns', totals.returns);
    setEl('isrTotalGst', totals.gst);
    setEl('isrTotalNetSale', totals.net);
    setEl('isrTotalCost', totals.cost);
    setEl('isrTotalGrossProfit', totals.gross);
    setEl('isrTotalBankDed', totals.bank);
    setEl('isrTotalGP', totals.gp);
    var discountPct = totals.sales > 0 ? (totals.discount * 100 / totals.sales) : 0;
    var discountPctEl = document.getElementById('isrTotalDiscountPct');
    if (discountPctEl) {
      discountPctEl.textContent = discountPct.toFixed(2);
      discountPctEl.style.backgroundColor = '#000000';
      discountPctEl.style.color = '#ffffff';
      discountPctEl.style.border = '1px solid #ffffff';
    }
    setEl('isrTotalDiscount', totals.discount);
    var avgRate = totals.net>0 ? (totals.gp*100/totals.net) : 0;
    var el = document.getElementById('isrAvgGpRate');
    if (el) {
      el.textContent = avgRate.toFixed(2);
      el.style.backgroundColor = '#000000';
      el.style.color = '#ffffff';
      el.style.border = '1px solid #ffffff';
    }
    // Leave marginDed empty for grand total (as shown in reference image)
    var marginDedEl = document.getElementById('isrTotalMarginDed');
    if (marginDedEl) {
      marginDedEl.textContent = '';
      marginDedEl.style.backgroundColor = '#000000';
      marginDedEl.style.color = '#ffffff';
      marginDedEl.style.border = '1px solid #ffffff';
    }
    updateSummary({ totalSale: totals.sales, totalReturns: totals.returns, netSales: totals.net, cost: totals.cost, grossProfit: totals.gross, expenses: 0, shortCash: 0, netProfit: totals.gp });
  }

  function parseCell(tr, idx){
    var td = tr.cells[idx-1];
    var v = td && td.textContent ? td.textContent.replace(/,/g,'') : '0';
    return Number(v)||0;
  }

  function parseDataVal(tr, key){
    var el = tr.querySelector('[data-val="'+key+'"]');
    return numText(el);
  }

  function setEl(id, val){
    var el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'INPUT') {
        el.value = val || 0;
      } else {
        el.textContent = fmt(val);
      }
    }
  }

  function recalculateNetProfit(){
    var grossProfitEl = document.getElementById('isrSummaryGrossProfit');
    var expensesEl = document.getElementById('isrSummaryExpenses');
    var shortCashEl = document.getElementById('isrSummaryShortCash');
    var netProfitEl = document.getElementById('isrSummaryNetProfit');
    var saveBtn = document.getElementById('isrSaveBtn');
    
    if (grossProfitEl && expensesEl && shortCashEl && netProfitEl) {
      var grossProfit = parseFloat(grossProfitEl.textContent.replace(/,/g, '')) || 0;
      var expenses = parseFloat(expensesEl.value) || 0;
      var shortCash = parseFloat(shortCashEl.value) || 0;
      var netProfit = grossProfit - expenses - shortCash;
      netProfitEl.textContent = fmt(netProfit);
    }
  }

  function updateSummary(s){
    setEl('isrSummaryTotalSale', s.totalSale||0);
    setEl('isrSummaryTotalReturns', s.totalReturns||0);
    setEl('isrSummaryNetSales', s.netSales||0);
    setEl('isrSummaryCost', s.cost||0);
    setEl('isrSummaryGrossProfit', s.grossProfit||0);
    setEl('isrSummaryExpenses', s.expenses||0);
    setEl('isrSummaryShortCash', s.shortCash||0);
    
    // Setup input listeners (in case inputs were recreated)
    setupSummaryInputs();
    
    // Recalculate net profit after setting expenses and short cash
    setTimeout(function(){
      recalculateNetProfit();
    }, 0);
  }

  // Save Income Statement Report
  function saveReport(){
    if (!window.isrData) {
      if (typeof showNotification === 'function') showNotification('Please generate a report first', 'warning');
      return;
    }
    
    var expensesEl = document.getElementById('isrSummaryExpenses');
    var shortCashEl = document.getElementById('isrSummaryShortCash');
    var expenses = expensesEl ? (parseFloat(expensesEl.value) || 0) : 0;
    var shortCash = shortCashEl ? (parseFloat(shortCashEl.value) || 0) : 0;
    
    var saveData = {
      items: window.isrData.items || [],
      summary: window.isrData.summary || {},
      branch: window.isrData.branch || null,
      meta: window.isrData.meta || {},
      expenses: expenses,
      shortCash: shortCash,
      notes: ''
    };
    
    if (typeof showNotification === 'function') showNotification('Saving report...', 'info');
    
    api.request('/reports/income-statement/save', {
      method: 'POST',
      body: JSON.stringify(saveData)
    }).then(function(response){
      if (typeof showNotification === 'function') showNotification('Report saved successfully!', 'success');
      console.log('Report saved:', response);
      
      // Refresh the saved reports list if it's visible
      var listView = document.getElementById('isrSavedReportsList');
      if (listView && listView.style.display !== 'none') {
        loadSavedReportsList();
      }
    }).catch(function(error){
      console.error('Error saving report:', error);
      if (typeof showNotification === 'function') showNotification('Failed to save report: ' + (error.message || 'Unknown error'), 'error');
    });
  }
  
  // Load Saved Reports List
  function loadSavedReportsList(){
    var fromDate = document.getElementById('isrListFromDate');
    var toDate = document.getElementById('isrListToDate');
    var branchFilter = document.getElementById('isrListBranchFilter');
    
    var params = {};
    if (fromDate && fromDate.value) params.from = fromDate.value;
    if (toDate && toDate.value) params.to = toDate.value;
    if (branchFilter && branchFilter.value) params.branchId = branchFilter.value;
    
    var url = '/reports/income-statement/list' + (function(){
      var s = Object.keys(params).map(function(k){ return k+'='+encodeURIComponent(params[k]); }).join('&');
      return s ? '?'+s : '';
    })();
    
    console.log('🔍 Loading saved reports from:', url);
    
    var tbody = document.getElementById('isrSavedReportsTableBody');
    if (!tbody) {
      console.error('❌ Table body element not found');
      return;
    }
    
    // Show loading state
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4"><i class="fas fa-spinner fa-spin me-2"></i>Loading reports...</td></tr>';
    
    api.request(url).then(function(reports){
      console.log('✅ Saved reports loaded:', reports);
      
      if (!reports || !Array.isArray(reports) || reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4"><i class="fas fa-inbox me-2"></i>No saved reports found</td></tr>';
        return;
      }
      
      tbody.innerHTML = reports.map(function(report){
        try {
          var reportDate = new Date(report.createdAt || report.reportDate || Date.now());
          var fromDate = new Date(report.fromDate || Date.now());
          var toDate = new Date(report.toDate || Date.now());
          var branchName = (report.branchId && (report.branchId.name || report.branchId)) || (report.branch && (report.branch.name || report.branch)) || 'Unknown';
          var savedBy = (report.savedBy && (report.savedBy.username || report.savedBy.name)) || 'Unknown';
          var totalSales = (report.summary && report.summary.totalSale) || 0;
          var netProfit = (report.summary && report.summary.netProfit) || 0;
          var reportId = (report._id && report._id.toString()) || (report.id && report.id.toString()) || '';
          
          return '<tr>' +
            '<td>' + reportDate.toLocaleDateString() + '</td>' +
            '<td>' + (branchName || 'Unknown') + '</td>' +
            '<td>' + fromDate.toLocaleDateString() + '</td>' +
            '<td>' + toDate.toLocaleDateString() + '</td>' +
            '<td class="text-end">' + (totalSales.toLocaleString()) + '</td>' +
            '<td class="text-end">' + (netProfit.toLocaleString()) + '</td>' +
            '<td>' + (savedBy || 'Unknown') + '</td>' +
            '<td>' +
              '<button class="btn btn-sm btn-warning me-1" onclick="editSavedReport(\'' + reportId + '\')"><i class="fas fa-edit"></i> Edit</button>' +
              '<button class="btn btn-sm btn-info me-1" onclick="printSavedReport(\'' + reportId + '\')"><i class="fas fa-print"></i> Print</button>' +
              '<button class="btn btn-sm btn-danger" onclick="deleteSavedReport(\'' + reportId + '\')"><i class="fas fa-trash"></i> Delete</button>' +
            '</td>' +
          '</tr>';
        } catch (e) {
          console.error('Error processing report:', e, report);
          return '<tr><td colspan="8" class="text-center text-danger">Error loading report</td></tr>';
        }
      }).join('');
    }).catch(function(error){
      console.error('Error loading saved reports:', error);
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-4"><i class="fas fa-exclamation-triangle me-2"></i>Failed to load reports: ' + (error.message || 'Unknown error') + '</td></tr>';
      }
      if (typeof showNotification === 'function') showNotification('Failed to load saved reports: ' + (error.message || 'Unknown error'), 'error');
    });
  }
  
  // View Saved Report
  window.viewSavedReport = function(reportId){
    api.request('/reports/income-statement/' + reportId).then(function(report){
      // Switch to table tab and render the report
      switchTab('table');
      window.isrData = {
        items: report.items || [],
        summary: report.summary || {},
        branch: report.branch || report.branchId || null,
        meta: {
          from: report.fromDate,
          to: report.toDate,
          branchId: report.branchId && report.branchId._id ? report.branchId._id : report.branchId,
          departmentId: report.departmentId && report.departmentId._id ? report.departmentId._id : report.departmentId
        }
      };
      render(window.isrData);
      updateSummary(window.isrData.summary);
      
      // Set expenses and short cash
      var expensesEl = document.getElementById('isrSummaryExpenses');
      var shortCashEl = document.getElementById('isrSummaryShortCash');
      if (expensesEl && report.summary) expensesEl.value = report.summary.expenses || 0;
      if (shortCashEl && report.summary) shortCashEl.value = report.summary.shortCash || 0;
      recalculateNetProfit();
      
      // Close list view
      var listView = document.getElementById('isrSavedReportsList');
      if (listView) {
        listView.style.display = 'none';
      }
      
      if (typeof showNotification === 'function') showNotification('Report loaded successfully', 'success');
    }).catch(function(error){
      console.error('Error loading report:', error);
      if (typeof showNotification === 'function') showNotification('Failed to load report', 'error');
    });
  };
  
  // Edit Saved Report
  window.editSavedReport = function(reportId){
    api.request('/reports/income-statement/' + reportId).then(function(report){
      // Switch to table tab and render the report for editing
      switchTab('table');
      
      // Store the original report ID for potential update
      window.editingReportId = reportId;
      
      window.isrData = {
        items: report.items || [],
        summary: report.summary || {},
        branch: report.branch || report.branchId || null,
        meta: {
          from: report.fromDate,
          to: report.toDate,
          branchId: report.branchId && report.branchId._id ? report.branchId._id : report.branchId,
          departmentId: report.departmentId && report.departmentId._id ? report.departmentId._id : report.departmentId
        }
      };
      
      // Set date fields
      var fromDateEl = document.getElementById('isrFromDate');
      var toDateEl = document.getElementById('isrToDate');
      var branchEl = document.getElementById('isrBranch');
      
      if (fromDateEl && report.fromDate) {
        var fromDate = new Date(report.fromDate);
        fromDateEl.value = fromDate.toISOString().split('T')[0];
      }
      if (toDateEl && report.toDate) {
        var toDate = new Date(report.toDate);
        toDateEl.value = toDate.toISOString().split('T')[0];
      }
      if (branchEl && report.branchId) {
        var branchId = report.branchId._id || report.branchId;
        branchEl.value = branchId;
      }
      
      // Render the report data
      render(window.isrData);
      updateSummary(window.isrData.summary);
      
      // Set expenses and short cash
      var expensesEl = document.getElementById('isrSummaryExpenses');
      var shortCashEl = document.getElementById('isrSummaryShortCash');
      if (expensesEl && report.summary) expensesEl.value = report.summary.expenses || 0;
      if (shortCashEl && report.summary) shortCashEl.value = report.summary.shortCash || 0;
      recalculateNetProfit();
      
      // Close list view
      var listView = document.getElementById('isrSavedReportsList');
      if (listView) {
        listView.style.display = 'none';
      }
      
      if (typeof showNotification === 'function') showNotification('Report loaded for editing. Make your changes and save.', 'info');
    }).catch(function(error){
      console.error('Error loading report for editing:', error);
      if (typeof showNotification === 'function') showNotification('Failed to load report for editing', 'error');
    });
  };
  
  // Print Saved Report
  window.printSavedReport = function(reportId){
    api.request('/reports/income-statement/' + reportId).then(function(report){
      // Transform saved report data to match expected format (same as viewSavedReport)
      var formattedReport = {
        items: report.items || [],
        summary: report.summary || {},
        branch: report.branch || report.branchId || null,
        meta: {
          from: report.fromDate,
          to: report.toDate,
          branchId: report.branchId && report.branchId._id ? report.branchId._id : report.branchId,
          departmentId: report.departmentId && report.departmentId._id ? report.departmentId._id : report.departmentId
        }
      };
      printReport(formattedReport);
    }).catch(function(error){
      console.error('Error loading report for print:', error);
      if (typeof showNotification === 'function') showNotification('Failed to load report for printing', 'error');
    });
  };
  
  // Delete Saved Report
  window.deleteSavedReport = function(reportId){
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    api.request('/reports/income-statement/' + reportId, {
      method: 'DELETE'
    }).then(function(){
      if (typeof showNotification === 'function') showNotification('Report deleted successfully', 'success');
      loadSavedReportsList();
    }).catch(function(error){
      console.error('Error deleting report:', error);
      if (typeof showNotification === 'function') showNotification('Failed to delete report', 'error');
    });
  };
  
  // Print Current Report
  function printReport(reportData){
    if (!reportData) {
      if (!window.isrData) {
        if (typeof showNotification === 'function') showNotification('Please generate a report first', 'warning');
        return;
      }
      reportData = window.isrData;
    }
    
    var expensesEl = document.getElementById('isrSummaryExpenses');
    var shortCashEl = document.getElementById('isrSummaryShortCash');
    var expenses = expensesEl ? (parseFloat(expensesEl.value) || 0) : 0;
    var shortCash = shortCashEl ? (parseFloat(shortCashEl.value) || 0) : 0;
    
    var printWindow = window.open('', '_blank');
    var printContent = generatePrintContent(reportData, expenses, shortCash);
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function(){
      printWindow.print();
    }, 250);
  }
  
  // Generate Print Content
  function generatePrintContent(reportData, expenses, shortCash){
    var summary = reportData.summary || {};
    var branch = reportData.branch || {};
    var meta = reportData.meta || {};
    var items = reportData.items || [];
    
    // Calculate final net profit
    var finalNetProfit = (summary.grossProfit || 0) - (expenses || 0) - (shortCash || 0);
    
    // Calculate number of days in the month of the report
    var fromDateObj = meta.from ? new Date(meta.from) : new Date();
    var toDateObj = meta.to ? new Date(meta.to) : new Date();
    
    // Use the month from toDate (or fromDate if toDate not available) to get total days in that month
    var reportDate = toDateObj || fromDateObj;
    var year = reportDate.getFullYear();
    var month = reportDate.getMonth(); // 0-11 (0 = January, 11 = December)
    
    // Get total days in the month (handles leap years for February)
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Format dates for display
    var fromDate = fromDateObj.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    var toDate = toDateObj.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    var period = fromDate === toDate ? fromDate : fromDate + ' to ' + toDate;
    
    // Get branch address (if available)
    var branchName = branch.name || '';
    var branchAddress = branch.address || '';
    
    // Group items by department and calculate totals
    var deptGroups = {};
    var grandTotal = { netSale: 0, gp: 0, discountAmount: 0, avgSalePerDay: 0 };
    
    // Store original items array for reference when building print rows
    var originalItems = items;
    
    items.forEach(function(item){
      var deptName = item.departmentName || 'Uncategorized';
      if (!deptGroups[deptName]) {
        deptGroups[deptName] = {
          name: deptName,
          items: [],
          totals: { netSale: 0, gp: 0, discountAmount: 0, avgSalePerDay: 0, marginDedPercent: 0 }
        };
      }
      
      var net = item.netSale || 0;
      var cost = item.cost || 0;
      var gp = net - cost;
      var avgSalePerDay = daysInMonth > 0 ? (net / daysInMonth) : 0;
      
      // Store marginDedPercent from first item (same for all items in department)
      // Check both departmentMarginDedPercent and marginDedPercent for compatibility
      if (deptGroups[deptName].items.length === 0) {
        var marginDed = item.departmentMarginDedPercent !== undefined ? item.departmentMarginDedPercent : 
                       (item.marginDedPercent !== undefined ? item.marginDedPercent : 0);
        deptGroups[deptName].totals.marginDedPercent = marginDed || 0;
      }
      
      // Get marginDedPercent from item (check both possible field names)
      var itemMarginDed = item.departmentMarginDedPercent !== undefined ? item.departmentMarginDedPercent : 
                         (item.marginDedPercent !== undefined ? item.marginDedPercent : 0);
      
      deptGroups[deptName].items.push({
        subDept: item.subDepartment && item.subDepartment.name || '',
        netSale: net,
        gp: gp,
        discountPercent: item.discountPercent || 0,
        gpRate: net > 0 ? (gp * 100 / net) : 0,
        avgSalePerDay: avgSalePerDay,
        marginDedPercent: itemMarginDed || 0,
        departmentMarginDedPercent: itemMarginDed || 0 // Store both for compatibility
      });
      
      deptGroups[deptName].totals.netSale += net;
      deptGroups[deptName].totals.gp += gp;
      deptGroups[deptName].totals.discountAmount += (item.discountAmount || 0);
      
      grandTotal.netSale += net;
      grandTotal.gp += gp;
      grandTotal.discountAmount += (item.discountAmount || 0);
    });
    
    // Calculate department totals
    Object.keys(deptGroups).forEach(function(deptName){
      var dept = deptGroups[deptName];
      dept.totals.avgSalePerDay = daysInMonth > 0 ? (dept.totals.netSale / daysInMonth) : 0;
      dept.totals.gpRate = dept.totals.netSale > 0 ? (dept.totals.gp * 100 / dept.totals.netSale) : 0;
      dept.totals.discountPercent = dept.totals.netSale > 0 ? (dept.totals.discountAmount * 100 / dept.totals.netSale) : 0;
    });
    
    grandTotal.avgSalePerDay = daysInMonth > 0 ? (grandTotal.netSale / daysInMonth) : 0;
    grandTotal.gpRate = grandTotal.netSale > 0 ? (grandTotal.gp * 100 / grandTotal.netSale) : 0;
    
    // Build table rows
    var tableRows = '';
    var deptNames = Object.keys(deptGroups).sort();
    
    deptNames.forEach(function(deptName){
      var dept = deptGroups[deptName];
      
      // Department header
      tableRows += '<thead>';
      tableRows += '<tr style="background-color: #00685c; color: #fff;">';
      tableRows += '<th style="padding: 10px 8px; border: 1px solid #ffffff; text-align: left; font-size: 11px; background-color: #00685c;">CATEGORIES</th>';
      tableRows += '<th style="padding: 10px 8px; border: 1px solid #ffffff; text-align: right; font-size: 11px; background-color: #00685c;">AVERAGE SALE PER DAY</th>';
      tableRows += '<th style="padding: 10px 8px; border: 1px solid #ffffff; text-align: right; font-size: 11px; background-color: #00685c;">NET SALE</th>';
      tableRows += '<th style="padding: 10px 8px; border: 1px solid #ffffff; text-align: right; font-size: 11px; background-color: #00685c;">G.P</th>';
      tableRows += '<th style="padding: 10px 8px; border: 1px solid #ffffff; text-align: right; font-size: 11px; background-color: #00685c;">DISC %</th>';
      tableRows += '<th style="padding: 10px 8px; border: 1px solid #ffffff; text-align: right; font-size: 11px; background-color: #00685c;">GP RATE</th>';
      tableRows += '<th style="padding: 10px 8px; border: 1px solid #ffffff; text-align: center; font-size: 11px; background-color: #00685c; width: 60px; min-width: 60px; max-width: 60px;">MARGIN DED %</th>';
      tableRows += '</tr>';
      tableRows += '</thead><tbody>';
      
      // Sub-department rows
      var isFirstRow = true;
      dept.items.forEach(function(item, index){
        tableRows += '<tr>';
        tableRows += '<td style="padding: 9px 7px; border: 1px solid #000; text-align: left; font-size: 11px;">' + (item.subDept || '') + '</td>';
        tableRows += '<td style="padding: 9px 7px; border: 1px solid #000; text-align: right; font-size: 11px;">' + (Math.round(item.avgSalePerDay).toLocaleString()) + '</td>';
        tableRows += '<td style="padding: 9px 7px; border: 1px solid #000; text-align: right; font-size: 11px;">' + (item.netSale.toLocaleString()) + '</td>';
        tableRows += '<td style="padding: 9px 7px; border: 1px solid #000; text-align: right; font-size: 11px;">' + (item.gp.toLocaleString()) + '</td>';
        tableRows += '<td style="padding: 9px 7px; border: 1px solid #000; text-align: right; font-size: 11px;">' + (item.discountPercent.toFixed(2)) + '</td>';
        tableRows += '<td style="padding: 9px 7px; border: 1px solid #000; text-align: right; font-size: 11px;">' + (item.gpRate.toFixed(2)) + '</td>';
        // Add MARGIN DED % only in first row with rowspan to merge across all rows
        if (isFirstRow && dept.items.length > 0) {
          // Try multiple possible field names for marginDedPercent
          // First check dept.totals, then check first item in various ways
          var marginDedValue = null;
          if (dept.totals.marginDedPercent !== undefined && dept.totals.marginDedPercent !== null) {
            marginDedValue = Number(dept.totals.marginDedPercent);
          } else if (dept.items[0]) {
            if (dept.items[0].marginDedPercent !== undefined && dept.items[0].marginDedPercent !== null) {
              marginDedValue = Number(dept.items[0].marginDedPercent);
            } else if (dept.items[0].departmentMarginDedPercent !== undefined && dept.items[0].departmentMarginDedPercent !== null) {
              marginDedValue = Number(dept.items[0].departmentMarginDedPercent);
            }
          }
          
          // Also try to get from original items array if available
          if ((marginDedValue === null || marginDedValue === 0 || isNaN(marginDedValue)) && originalItems && originalItems.length > 0) {
            // Find matching item by department name and sub-department
            var matchingItem = originalItems.find(function(origItem) {
              return origItem.departmentName === dept.name && 
                     origItem.subDepartment && 
                     origItem.subDepartment.name === dept.items[0].subDept;
            });
            if (matchingItem) {
              if (matchingItem.departmentMarginDedPercent !== undefined && matchingItem.departmentMarginDedPercent !== null) {
                marginDedValue = Number(matchingItem.departmentMarginDedPercent);
              } else if (matchingItem.marginDedPercent !== undefined && matchingItem.marginDedPercent !== null) {
                marginDedValue = Number(matchingItem.marginDedPercent);
              }
            }
          }
          
          // Display the value (show even if 0, but format properly)
          var displayValue = (marginDedValue !== null && marginDedValue !== undefined && !isNaN(marginDedValue)) ? marginDedValue.toFixed(2) + '%' : '';
          tableRows += '<td style="padding: 9px 7px; border: 1px solid #000; text-align: center; font-size: 11px; font-weight: bold; vertical-align: middle; width: 60px; min-width: 60px; max-width: 60px;" rowspan="' + dept.items.length + '">' + displayValue + '</td>';
          isFirstRow = false;
        }
        tableRows += '</tr>';
      });
      
      // Department TOTAL row
      tableRows += '<tr style="background-color: #000000; font-weight: bold; color: #ffffff;">';
      tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: left; font-size: 11px; color: #ffffff; background-color: #000000;">' + dept.name.toUpperCase() + ' TOTAL</td>';
      tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: right; font-size: 11px; color: #ffffff; background-color: #000000;">' + (Math.round(dept.totals.avgSalePerDay).toLocaleString()) + '</td>';
      tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: right; font-size: 11px; color: #ffffff; background-color: #000000;">' + (dept.totals.netSale.toLocaleString()) + '</td>';
      tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: right; font-size: 11px; color: #ffffff; background-color: #000000;">' + (dept.totals.gp.toLocaleString()) + '</td>';
      tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: right; font-size: 11px; color: #ffffff; background-color: #000000;">' + (dept.totals.discountAmount.toLocaleString()) + '</td>';
      tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: right; font-size: 11px; color: #ffffff; background-color: #000000;">' + (dept.totals.gpRate.toFixed(2)) + '</td>';
      tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: center; font-size: 11px; color: #ffffff; background-color: #000000; width: 60px; min-width: 60px; max-width: 60px;"></td>';
      tableRows += '</tr>';
      tableRows += '</tbody>';
    });
    
    // GRAND TOTAL row
    tableRows += '<tfoot>';
    tableRows += '<tr style="background-color: #00685c; color: #ffffff; font-weight: bold;">';
    tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: left; font-size: 11px; background-color: #00685c;">GRAND TOTAL</td>';
    tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: right; font-size: 11px; background-color: #00685c;">' + (Math.round(grandTotal.avgSalePerDay).toLocaleString()) + '</td>';
    tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: right; font-size: 11px; background-color: #00685c;">' + (grandTotal.netSale.toLocaleString()) + '</td>';
    tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: right; font-size: 11px; background-color: #00685c;">' + (grandTotal.gp.toLocaleString()) + '</td>';
    tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: right; font-size: 11px; background-color: #00685c;">' + (grandTotal.discountAmount.toLocaleString()) + '</td>';
    tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: right; font-size: 11px; background-color: #00685c;">' + (grandTotal.gpRate.toFixed(2)) + '</td>';
    tableRows += '<td style="padding: 9px 7px; border: 1px solid #ffffff; text-align: center; font-size: 11px; background-color: #00685c;"></td>';
    tableRows += '</tr>';
    tableRows += '</tfoot>';
    
    return '<!DOCTYPE html><html><head><title>Item Category Wise Income Statement</title><style>' +
      '* { box-sizing: border-box; }' +
      'body { font-family: Arial, sans-serif; margin: 0; padding: 10px; font-size: 13px; }' +
      'h1 { text-align: center; margin: 0 0 4px 0; font-size: 18px; font-weight: bold; line-height: 1.3; }' +
      'h2 { text-align: center; margin: 0 0 4px 0; font-size: 16px; line-height: 1.3; }' +
      'h3 { text-align: center; margin: 0 0 12px 0; font-size: 14px; color: #666; line-height: 1.3; }' +
      'table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }' +
      'th, td { border: 1px solid #000; padding: 8px 6px; text-align: right; line-height: 1.4; }' +
      'th { background-color: #808080; color: #fff; font-weight: bold; }' +
      'td:first-child, th:first-child { text-align: left; }' +
      '.summary { margin-top: 12px; width: 100%; font-size: 13px; }' +
      '.summary-header { background-color: #d3d3d3; padding: 10px; font-weight: bold; border: 1px solid #000; text-align: left; font-size: 13px; }' +
      '.summary-item { display: flex; justify-content: space-between; padding: 8px 10px; border: 1px solid #000; border-top: none; font-size: 13px; line-height: 1.5; }' +
      '.summary-item.total { background-color: #000; color: #fff; font-weight: bold; }' +
      '@media print { ' +
        'body { margin: 0; padding: 10mm; font-size: 12px; }' +
        '@page { size: A4; margin: 10mm; }' +
        'h1 { font-size: 17px; margin-bottom: 4px; }' +
        'h2 { font-size: 15px; margin-bottom: 4px; }' +
        'h3 { font-size: 13px; margin-bottom: 10px; }' +
        'table { font-size: 11px; margin-bottom: 10px; }' +
        'th, td { padding: 9px 7px; line-height: 1.5; }' +
        '.summary { margin-top: 10px; font-size: 12px; }' +
        '.summary-header { padding: 8px; font-size: 12px; }' +
        '.summary-item { padding: 7px 8px; font-size: 12px; line-height: 1.6; }' +
        'thead { display: table-header-group; }' +
        'tfoot { display: table-footer-group; }' +
        'tr { page-break-inside: avoid; }' +
      '}' +
      '</style></head><body>' +
      '<h1>ITEM CATEGORY WISE INCOME STATEMENT</h1>' +
      '<h2>' + (branchName || '') + '</h2>' +
      (branchAddress ? '<h3>' + branchAddress + '</h3>' : '') +
      '<h3>Period: ' + period + '</h3>' +
      '<table>' + tableRows + '</table>' +
      '<div class="summary">' +
        '<div class="summary-header">SUMMARY</div>' +
        '<div class="summary-item"><span>NET SALES</span><strong>' + ((summary.netSales || 0).toLocaleString()) + '</strong></div>' +
        '<div class="summary-item"><span>G PROFIT</span><strong>' + ((summary.grossProfit || 0).toLocaleString()) + '</strong></div>' +
        '<div class="summary-item"><span>EXPENSES</span><strong>' + (expenses.toLocaleString()) + '</strong></div>' +
        '<div class="summary-item"><span>SHORT CASH (-)</span><strong>' + (shortCash.toLocaleString()) + '</strong></div>' +
        '<div class="summary-item total" style="border: 1px solid #ffffff;"><span>NET PROFIT</span><strong>' + (finalNetProfit.toLocaleString()) + '</strong></div>' +
      '</div>' +
      '</body></html>';
  }
  
  // Setup Save, List, and Print buttons
  function setupReportActions(){
    var saveBtn = document.getElementById('isrSaveBtn');
    var listBtn = document.getElementById('isrListBtn');
    var printBtn = document.getElementById('isrPrintBtn');
    var closeListBtn = document.getElementById('isrCloseListBtn');
    var filterListBtn = document.getElementById('isrFilterListBtn');
    
    if (saveBtn) {
      saveBtn.addEventListener('click', function(e){
        e.preventDefault();
        saveReport();
      });
    }
    
    if (listBtn) {
      listBtn.addEventListener('click', function(e){
        e.preventDefault();
        var listView = document.getElementById('isrSavedReportsList');
        if (listView) {
          // Show list view in small view (not full screen)
          listView.style.display = 'block';
          
          // Load data
          loadSavedReportsList();
          loadBranchesForList();
        }
      });
    }
    
    if (printBtn) {
      printBtn.addEventListener('click', function(e){
        e.preventDefault();
        printReport();
      });
    }
    
    if (closeListBtn) {
      closeListBtn.addEventListener('click', function(e){
        e.preventDefault();
        var listView = document.getElementById('isrSavedReportsList');
        if (listView) {
          listView.style.display = 'none';
        }
      });
    }
    
    if (filterListBtn) {
      filterListBtn.addEventListener('click', function(e){
        e.preventDefault();
        loadSavedReportsList();
      });
    }
  }
  
  // Load branches for list filter
  function loadBranchesForList(){
    var branchFilter = document.getElementById('isrListBranchFilter');
    if (!branchFilter || !appData.branches) return;
    
    var userBranches = appData.currentUser && appData.currentUser.branches ? appData.currentUser.branches : [];
    var userBranchIds = userBranches.map(function(b){ return (b._id || b).toString(); });
    
    branchFilter.innerHTML = '<option value="">All Branches</option>';
    appData.branches.forEach(function(b){
      if (userBranchIds.length && !userBranchIds.includes(b._id.toString())) return;
      var opt = document.createElement('option');
      opt.value = b._id;
      opt.textContent = b.name || 'Unnamed';
      branchFilter.appendChild(opt);
    });
  }

  // Expose init function globally for section loading
  window.initIncomeStatementReport = init;

  document.addEventListener('sectionLoaded', function(e){
    if (e && e.detail && e.detail.sectionName === 'income-statement-report'){
      setTimeout(init,0);
    }
  });
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ requestAnimationFrame(init); });
  } else {
    requestAnimationFrame(init);
  }
})();
