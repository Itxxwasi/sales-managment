(() => {
  function loadPaymentVoucherList(methodFilter) {
    const listSection = document.getElementById('payment-voucher-list-section');
    if (!listSection || listSection.style.display === 'none') return;
    const permissions = appData.currentUser?.permissions || [];
    if (!permissions.includes('admin') && !permissions.includes('payment-voucher-list')) {
      showNotification('Access denied. You do not have permission to view supplier voucher list.', 'error');
      const tbodyDenied = document.querySelector('#payment-voucher-list-section table tbody');
      if (tbodyDenied) tbodyDenied.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Access denied. You do not have permission to view supplier voucher list.</td></tr>';
      return;
    }
    const checkedBoxes = Array.from(document.querySelectorAll('.payment-select:checked'));
    const selectedIds = checkedBoxes.map(cb => cb.value);
    window.appData = window.appData || {};
    appData.paymentVoucherSelectedIds = selectedIds;
    const branchFilter = document.getElementById('paymentVoucherListBranchFilter')?.value || '';
    const supplierFilter = document.getElementById('paymentVoucherListSupplierFilter')?.value || '';
    const fromDate = document.getElementById('paymentVoucherListFromDate')?.value || '';
    const toDate = document.getElementById('paymentVoucherListToDate')?.value || '';
    const search = document.getElementById('paymentVoucherSearch')?.value || '';
    if (!fromDate && !toDate) {
      const tbodyEmpty = document.querySelector('#payment-voucher-list-section table tbody');
      if (tbodyEmpty) tbodyEmpty.innerHTML = '<tr><td colspan="10" class="text-center text-muted">Please select at least one date (From or To) to view voucher list</td></tr>';
      showNotification('Please select at least one date (From or To) to view voucher list', 'info');
      return;
    }
    let url = '/payments?';
    const params = [];
    if (branchFilter) params.push(`branchId=${branchFilter}`);
    if (supplierFilter) params.push(`supplierId=${supplierFilter}`);
    if (fromDate) params.push(`from=${fromDate}`);
    if (toDate) params.push(`to=${toDate}`);
    url += params.join('&');
    api.getPayments(url).then(paymentsData => {
      let filteredPayments = paymentsData;
      if (methodFilter) { const norm = m => String(m || 'Cash').toLowerCase(); const target = norm(methodFilter); filteredPayments = filteredPayments.filter(p => norm(p.paymentMethod) === target); }
      if (search) { const s = search.toLowerCase(); filteredPayments = filteredPayments.filter(p => (p.voucherNumber && String(p.voucherNumber).toLowerCase().includes(s)) || (p.supplierId?.name && String(p.supplierId.name).toLowerCase().includes(s)) || (p.supplier && String(p.supplier).toLowerCase().includes(s)) || (p.description && String(p.description).toLowerCase().includes(s)) || (p.branchId?.name && String(p.branchId.name).toLowerCase().includes(s)) || (p.paymentMethod && String(p.paymentMethod).toLowerCase().includes(s))); }
      window.appData = window.appData || {}; appData.latestPaymentVouchers = filteredPayments;
      renderPaymentVoucherList(filteredPayments);
      const selectAll = document.getElementById('paymentSelectAll');
      if (selectAll) { selectAll.onclick = () => { document.querySelectorAll('.payment-select').forEach(cb => { cb.checked = selectAll.checked; }); }; }
      setTimeout(() => { const s = document.getElementById('payment-voucher-list-section'); if (s) { s.style.display = 'block'; s.classList.add('active'); } }, 50);
    }).catch(error => {
      if (error.response && error.response.status === 403) {
        showNotification('Access denied. You do not have permission to view supplier voucher list.', 'error');
        const tbody = document.querySelector('#payment-voucher-list-section table tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Access denied. You do not have permission to view supplier voucher list.</td></tr>';
      } else {
        showNotification('Failed to load supplier voucher list: ' + (error.message || 'Unknown error'), 'error');
      }
    });
  }

  function renderPaymentVoucherList(vouchers) {
    const tbody = document.getElementById('paymentVoucherListTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (vouchers.length === 0) { tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No vouchers found</td></tr>'; return; }
    const selectedIds = appData.paymentVoucherSelectedIds || [];
    const canEditSupplierVoucher = (appData.currentUser?.permissions || []).includes('payment-edit') || (appData.currentUser?.permissions || []).includes('admin');
    const canDeleteSupplierVoucher = (appData.currentUser?.permissions || []).includes('payment-delete') || (appData.currentUser?.permissions || []).includes('admin');
    vouchers.forEach(voucher => {
      const row = document.createElement('tr');
      const branchName = voucher.branchId?.name || 'Unknown';
      const entityName = voucher.supplierId?.name || voucher.supplier || 'Unknown';
      const voucherNum = voucher.voucherNumber || 'N/A';
      const isChecked = selectedIds.includes(String(voucher._id));
      const canEdit = canEditSupplierVoucher;
      const canDelete = canDeleteSupplierVoucher;
      const editFunction = 'editPaymentVoucher';
      const deleteFunction = 'deletePaymentVoucher';
      row.innerHTML = `
        <td class="no-print"><input type="checkbox" class="payment-select" value="${voucher._id}" ${isChecked ? 'checked' : ''}></td>
        <td>${voucherNum}</td>
        <td>${formatDate(voucher.date)}</td>
        <td><span class="badge bg-primary me-1">Supplier</span>${entityName}</td>
        <td>${branchName}</td>
        <td>PKR ${voucher.amount.toLocaleString()}</td>
        <td>${voucher.paymentMethod || 'Cash'}</td>
        <td>${voucher.description || '-'}</td>
        <td class="no-print">
          <button class="btn btn-sm btn-info me-1" onclick="viewPaymentVoucher('${voucher._id}')"><i class="fas fa-eye"></i></button>
          ${canEdit ? `<button class="btn btn-sm btn-warning me-1" onclick="${editFunction}('${voucher._id}')"><i class=\"fas fa-edit\"></i></button>` : ''}
          ${canDelete ? `<button class="btn btn-sm btn-danger" onclick="${deleteFunction}('${voucher._id}')"><i class=\"fas fa-trash\"></i></button>` : ''}
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  function printSelectedVouchersList() {
    const checked = Array.from(document.querySelectorAll('.payment-select:checked'));
    if (checked.length === 0) { showNotification('Please select at least one voucher to print', 'error'); return; }
    const ids = checked.map(c => c.value);
    const all = (window.appData && appData.latestPaymentVouchers) ? appData.latestPaymentVouchers : [];
    const vouchers = all.filter(v => ids.includes(String(v._id)));
    if (vouchers.length === 0) { showNotification('Selected vouchers not found in current list', 'error'); return; }
    const companyName = appData.settings?.companyName || 'D.Watson Group of Pharmacy';
    const uniqueBranches = [...new Set(vouchers.map(v => v.branchId?.name || 'Unknown'))];
    const uniqueSuppliers = [...new Set(vouchers.map(v => v.supplierId?.name || v.supplier || 'Unknown'))];
    const branchDisplayName = uniqueBranches.length === 1 ? uniqueBranches[0] : 'Multiple Branches';
    const supplierDisplayName = uniqueSuppliers.length === 1 ? uniqueSuppliers[0] : 'Multiple Suppliers';
    const includeSupplierCol = (uniqueSuppliers.length > 1);
    let printContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Selected Payment Vouchers</title><style>*{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}@page{size:A4;margin:0.5in;}body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.4;color:#000;background:#fff;margin:0;padding:20px;} .print-header{text-align:center;margin-bottom:30px;padding:30px 25px;background:#00685c;color:#ffffff;border-bottom:3px solid #000;} .print-header h2{margin:0;font-size:24pt;font-weight:bold;letter-spacing:1px;color:#ffffff;} table{width:100%;border-collapse:collapse;margin-bottom:30px;border:1px solid #333;background:white;table-layout:fixed;} th{padding:10px 8px;border:1px solid #333;font-weight:bold;color:#ffffff;font-size:10pt;text-transform:uppercase;white-space:normal;word-wrap:break-word;line-height:1.3;} td{padding:10px 8px;border:1px solid #333;font-size:11pt;word-wrap:break-word;overflow:hidden;} .summary-section{border:2px solid #000;padding:25px;margin-top:35px;background:#ffffff;}</style></head><body><div class="print-header"><h2>${companyName}</h2><p style="margin:10px 0 0 0;font-size:16pt;font-weight:bold;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">SELECTED PAYMENT VOUCHERS</p><p style="margin:8px 0 0 0;font-size:10pt;color:#ffffff;">Generated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p></div><div style="margin-bottom:20px;padding:15px;background:#f8f9fa;border:1px solid #333;"><div style="display:flex;justify-content:space-between;font-size:13pt;font-weight:bold;color:#000;"><div><span style="color:#00685c;">Branch:</span> <span>${branchDisplayName}</span></div><div><span style="color:#00685c;">Supplier:</span> <span>${supplierDisplayName}</span></div></div></div><table><thead><tr style="background:#00685c;"><th style="text-align:center;width:4%;padding:10px 6px;">#</th><th style="text-align:left;width:12%;padding:10px 6px;">V.No</th><th style="text-align:left;width:10%;padding:10px 6px;">Date</th>${includeSupplierCol ? '<th style="text-align:left;width:18%;padding:10px 6px;">Supplier</th>' : ''}<th style="text-align:center;width:10%;padding:10px 6px;">PM</th><th style="text-align:left;width:${includeSupplierCol ? '28%' : '38%'};padding:10px 6px;">Description</th><th style="text-align:right;width:16%;padding:10px 6px;">Amount</th></tr></thead><tbody>`;
    vouchers.forEach((voucher, index) => {
      const voucherNum = voucher.voucherNumber || 'N/A';
      const voucherDate = formatDate(voucher.date);
      const amount = voucher.amount || 0;
      const paymentMethod = voucher.paymentMethod || 'Cash';
      const supplierName = voucher.supplierId?.name || voucher.supplier || 'Unknown';
      const description = voucher.description || '-';
      const rowBg = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
      printContent += `<tr style="background-color:${rowBg};vertical-align:top;"><td style="padding:10px 6px;border:1px solid #333;font-weight:bold;color:#000;text-align:center;font-size:11pt;width:4%;vertical-align:top;">${index+1}</td><td style="padding:10px 6px;border:1px solid #333;font-weight:bold;color:#000;font-size:11pt;width:12%;vertical-align:top;">${voucherNum}</td><td style="padding:10px 6px;border:1px solid #333;color:#000;font-size:11pt;width:10%;vertical-align:top;">${voucherDate}</td>${includeSupplierCol ? `<td style="padding:10px 6px;border:1px solid #333;color:#000;font-size:11pt;width:18%;vertical-align:top;">${supplierName}</td>` : ''}<td style="padding:10px 6px;border:1px solid #333;text-align:center;color:#000;font-size:11pt;width:10%;vertical-align:top;">${paymentMethod}</td><td style="padding:10px 6px;border:1px solid #333;color:#000;font-size:11pt;width:${includeSupplierCol ? '28%' : '38%'};white-space:normal;word-wrap:break-word;overflow-wrap:break-word;vertical-align:top;line-height:1.4;">${description}</td><td style="padding:10px 6px;border:1px solid #333;text-align:right;font-weight:bold;color:#000;font-size:11pt;width:16%;white-space:nowrap;vertical-align:top;">${amount.toLocaleString()}</td></tr>`;
    });
    const totalAmount = vouchers.reduce((sum, v) => sum + (v.amount || 0), 0);
    printContent += `</tbody></table><div class="summary-section"><h3 style="text-align:center;margin-bottom:25px;text-transform:uppercase;font-size:16pt;font-weight:bold;color:#000;letter-spacing:2px;padding-bottom:15px;border-bottom:2px solid #333;">SUMMARY</h3><table style="width: 100%; border-collapse: collapse;"><tr style="background-color: #f0f0f0;"><td style="padding: 12px; border: 1px solid #333; font-weight: bold; width: 30%; background: #f8f9fa; color: #000; font-size: 12pt;">Total Vouchers:</td><td style="padding: 12px; border: 1px solid #333; width: 20%; color: #000; font-weight: bold; font-size: 12pt;">${vouchers.length}</td><td style="padding: 12px; border: 1px solid #333; font-weight: bold; width: 30%; background: #f8f9fa; color: #000; font-size: 12pt;">Total Amount:</td><td style="padding: 12px; border: 1px solid #333; font-weight: bold; width: 20%; text-align: right; color: #000; font-size: 12pt;">${totalAmount.toLocaleString()}</td></tr></table></div><div style="display: flex; justify-content: space-between; margin-top: 60px; padding-top: 35px; border-top: 2px solid #333;"><div style="width: 45%; text-align: center;"><p style="margin: 0 0 12px 0; font-weight: bold; color: #000; font-size: 12pt; letter-spacing: 0.5px;">PREPARED BY</p><div style="border-top: 2px solid #000; margin-top: 60px; padding-top: 8px;"><p style="margin: 0; color: #000; font-size: 10pt; letter-spacing: 0.5px;">Signature & Date</p></div></div><div style="width: 45%; text-align: center;"><p style="margin: 0 0 12px 0; font-weight: bold; color: #000; font-size: 12pt; letter-spacing: 0.5px;">CASH RECEIVED BY</p><div style="border-top: 2px solid #000; margin-top: 60px; padding-top: 8px;"><p style="margin: 0; color: #000; font-size: 10pt; letter-spacing: 0.5px;">Signature & Date</p></div></div></div></body></html>`;
    const w = window.open('', '_blank'); if (!w) { showNotification('Popup blocked. Please allow popups.', 'error'); return; } w.document.write(printContent); w.document.close(); w.focus(); setTimeout(() => w.print(), 250);
    setTimeout(() => { document.querySelectorAll('.payment-select:checked').forEach(checkbox => { checkbox.checked = false; }); const selectAllCheckbox = document.getElementById('paymentSelectAll'); if (selectAllCheckbox) selectAllCheckbox.checked = false; }, 500);
  }

  function filterPaymentVouchers() { loadPaymentVoucherList(); }
  function clearPaymentVoucherFilters() { document.getElementById('paymentVoucherSearch').value = ''; document.getElementById('paymentVoucherListBranchFilter').value = ''; document.getElementById('paymentVoucherListSupplierFilter').value = ''; document.getElementById('paymentVoucherListFromDate').value = ''; document.getElementById('paymentVoucherListToDate').value = ''; loadPaymentVoucherList(); }
  function downloadPaymentVouchersCSV() { let url = '/payments'; api.getPayments(url).then(vouchers => { let csv = 'Voucher Number,Date,Supplier,Branch,Amount,Payment Method,Description\n'; vouchers.forEach(v => { const branchName = v.branchId?.name || 'Unknown'; const supplierName = v.supplierId?.name || v.supplier || 'Unknown'; csv += `${v.voucherNumber || ''},${v.date},${supplierName},${branchName},${v.amount},${v.paymentMethod || 'Cash'},"${v.description || ''}"\n`; }); const blob = new Blob([csv], { type: 'text/csv' }); const url2 = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url2; a.download = `vouchers_${new Date().toISOString().split('T')[0]}.csv`; a.click(); window.URL.revokeObjectURL(url2); showNotification('Vouchers downloaded successfully!', 'success'); }).catch(() => { showNotification('Failed to download vouchers', 'error'); }); }

  function printPaymentVoucherList() {
    const tbody = document.getElementById('paymentVoucherListTable');
    if (!tbody) { showNotification('No vouchers to print', 'error'); return; }
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0 || (rows.length === 1 && rows[0].textContent.includes('No vouchers'))) { showNotification('No vouchers to print', 'error'); return; }
    const fromDate = document.getElementById('paymentVoucherListFromDate')?.value || '';
    const toDate = document.getElementById('paymentVoucherListToDate')?.value || '';
    const branchFilter = document.getElementById('paymentVoucherListBranchFilter')?.value || '';
    const supplierFilter = document.getElementById('paymentVoucherListSupplierFilter')?.value || '';
    let url = '/payments?'; const params = []; if (branchFilter) params.push(`branchId=${branchFilter}`); if (supplierFilter) params.push(`supplierId=${supplierFilter}`); if (fromDate) params.push(`from=${fromDate}`); if (toDate) params.push(`to=${toDate}`); url += params.join('&');
    api.getPayments(url).then(vouchers => {
      if (!vouchers || vouchers.length === 0) { showNotification('No vouchers to print', 'error'); return; }
      const companyName = appData.settings?.companyName || 'D.Watson Group of Pharmacy';
      let branchDisplayName = 'All Branches'; let supplierDisplayName = 'All Suppliers';
      if (branchFilter) { const branch = appData.branches.find(b => b._id === branchFilter); branchDisplayName = branch ? branch.name : 'Selected Branch'; } else if (vouchers.length > 0) { const uniqueBranches = [...new Set(vouchers.map(v => v.branchId?.name || 'Unknown'))]; branchDisplayName = uniqueBranches.length === 1 ? uniqueBranches[0] : 'All Branches'; }
      if (supplierFilter) { const supplier = appData.suppliers.find(s => s._id === supplierFilter); supplierDisplayName = supplier ? supplier.name : 'Selected Supplier'; } else if (vouchers.length > 0) { const uniqueSuppliers = [...new Set(vouchers.map(v => v.supplierId?.name || v.supplier || 'Unknown'))]; supplierDisplayName = uniqueSuppliers.length === 1 ? uniqueSuppliers[0] : 'All Suppliers'; }
      const uniqueBranches = [...new Set(vouchers.map(v => v.branchId?.name || 'Unknown'))]; const uniqueSuppliers = [...new Set(vouchers.map(v => v.supplierId?.name || v.supplier || 'Unknown'))]; const includeSupplierCol = (uniqueSuppliers.length > 1);
      const vouchersByMethod = {}; vouchers.forEach(voucher => { const method = voucher.paymentMethod || 'Cash'; if (!vouchersByMethod[method]) vouchersByMethod[method] = []; vouchersByMethod[method].push(voucher); }); const sortedMethods = Object.keys(vouchersByMethod).sort();
      let printContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Payment Vouchers List</title><style>*{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}@page{size:A4;margin:0.5in;}body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.4;color:#000;background:#fff;margin:0;padding:20px;} .print-header{text-align:center;margin-bottom:30px;padding:30px 25px;background:#00685c;color:#ffffff;border-bottom:3px solid #000;} .print-header h2{margin:0;font-size:24pt;font-weight:bold;letter-spacing:1px;color:#ffffff;} table{width:100%;border-collapse:collapse;margin-bottom:30px;border:1px solid #333;background:white;table-layout:fixed;} th{padding:10px 8px;border:1px solid #333;font-weight:bold;color:#ffffff;font-size:10pt;text-transform:uppercase;white-space:normal;word-wrap:break-word;line-height:1.3;} td{padding:10px 8px;border:1px solid #333;font-size:11pt;word-wrap:break-word;overflow:hidden;} tr{height:auto;} .summary-section{border:2px solid #000;padding:25px;margin-top:35px;background:#ffffff;} .summary-section h3{text-align:center;margin-bottom:25px;text-transform:uppercase;font-size:16pt;font-weight:bold;color:#000;letter-spacing:2px;padding-bottom:15px;border-bottom:2px solid #333;}</style></head><body><div class="print-header"><h2>${companyName}</h2><p style="margin:10px 0 0 0;font-size:16pt;font-weight:bold;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">PAYMENT VOUCHERS LIST</p>${fromDate || toDate ? `<p style=\"margin:8px 0 0 0;font-size:11pt;color:#ffffff;\">Period: ${fromDate ? formatDate(fromDate) : 'All'} - ${toDate ? formatDate(toDate) : 'All'}</p>` : ''}<p style="margin:8px 0 0 0;font-size:10pt;color:#ffffff;">Generated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p></div><div style="margin-bottom:20px;padding:15px;background:#f8f9fa;border:1px solid #333;"><div style="display:flex;justify-content:space-between;font-size:13pt;font-weight:bold;color:#000;"><div><span style="color:#00685c;">Branch:</span> <span>${branchDisplayName}</span></div><div><span style="color:#00685c;">Supplier:</span> <span>${supplierDisplayName}</span></div></div></div><table><thead><tr style="background:#00685c;"><th style="text-align:center;width:4%;padding:10px 6px;">#</th><th style="text-align:left;width:12%;padding:10px 6px;">V.No</th><th style="text-align:left;width:10%;padding:10px 6px;">Date</th>${includeSupplierCol ? '<th style="text-align:left;width:18%;padding:10px 6px;">Supplier</th>' : ''}<th style="text-align:center;width:10%;padding:10px 6px;">PM</th><th style="text-align:left;width:${includeSupplierCol ? '28%' : '38%'};padding:10px 6px;">Description</th><th style="text-align:right;width:16%;padding:10px 6px;">Amount</th></tr></thead><tbody>`;
      let globalRowIndex = 0;
      sortedMethods.forEach(method => {
        const methodVouchers = vouchersByMethod[method];
        const methodTotal = methodVouchers.reduce((sum, v) => sum + (v.amount || 0), 0);
        methodVouchers.forEach((voucher, voucherIndex) => {
          globalRowIndex++;
          const voucherNum = voucher.voucherNumber || 'N/A';
          const voucherDate = formatDate(voucher.date);
          const amount = voucher.amount || 0;
          const description = voucher.description || '-';
          const supplierName = voucher.supplierId?.name || voucher.supplier || 'Unknown';
          const rowBg = voucherIndex % 2 === 0 ? '#ffffff' : '#f8f9fa';
          printContent += `<tr style=\"background-color:${rowBg};vertical-align:top;\"><td style=\"padding:10px 6px;border:1px solid #333;font-weight:bold;color:#000;text-align:center;font-size:11pt;width:4%;vertical-align:top;\">${globalRowIndex}</td><td style=\"padding:10px 6px;border:1px solid #333;font-weight:bold;color:#000;font-size:11pt;width:12%;vertical-align:top;\">${voucherNum}</td><td style=\"padding:10px 6px;border:1px solid #333;color:#000;font-size:11pt;width:10%;vertical-align:top;\">${voucherDate}</td>${includeSupplierCol ? `<td style=\"padding:10px 6px;border:1px solid #333;color:#000;font-size:11pt;width:18%;vertical-align:top;\">${supplierName}</td>` : ''}<td style=\"padding:10px 6px;border:1px solid #333;text-align:center;color:#000;font-size:11pt;width:10%;vertical-align:top;\">${method}</td><td style=\"padding:10px 6px;border:1px solid #333;color:#000;font-size:11pt;width:${includeSupplierCol ? '28%' : '38%'};white-space:normal;word-wrap:break-word;overflow-wrap:break-word;vertical-align:top;line-height:1.4;\">${description || '-'}</td><td style=\"padding:10px 6px;border:1px solid #333;text-align:right;font-weight:bold;color:#000;font-size:11pt;width:16%;white-space:nowrap;vertical-align:top;\">${amount.toLocaleString()}</td></tr>`;
        });
        printContent += `<tr style=\"background-color:#000000;color:#ffffff;\"><td colspan=\"${includeSupplierCol ? '6' : '5'}\" style=\"padding:12px 8px;border:2px solid #000000;font-weight:bold;font-size:13pt;text-align:center;text-transform:uppercase;\">Subtotal ${method} Paid</td><td style=\"padding:12px 8px;border:2px solid #000000;font-weight:bold;font-size:13pt;text-align:right;color:#ffffff;white-space:nowrap;\">${methodTotal.toLocaleString()}</td></tr>`;
      });
      printContent += `</tbody></table>`;
      const totalAmount = vouchers.reduce((sum, v) => sum + (v.amount || 0), 0);
      printContent += `<div class=\"summary-section\"><h3>SUMMARY</h3><table style=\"width:100%;border-collapse:collapse;\"><tr style=\"background-color:#f0f0f0;\"><td style=\"padding:12px;border:1px solid #333;font-weight:bold;width:30%;background:#f8f9fa;color:#000;font-size:12pt;\">Total Vouchers:</td><td style=\"padding:12px;border:1px solid #333;width:20%;color:#000;font-weight:bold;font-size:12pt;\">${vouchers.length}</td><td style=\"padding:12px;border:1px solid #333;font-weight:bold;width:30%;background:#f8f9fa;color:#000;font-size:12pt;\">Total Amount:</td><td style=\"padding:12px;border:1px solid #333;font-weight:bold;width:20%;text-align:right;color:#000;font-size:12pt;\">${totalAmount.toLocaleString()}</td></tr><tr><td style=\"padding:12px;border:1px solid #333;font-weight:bold;background:#f8f9fa;color:#000;font-size:12pt;\">Status:</td><td style=\"padding:12px;border:1px solid #333;color:#000;font-weight:bold;font-size:12pt;\">All PAID</td><td style=\"padding:12px;border:1px solid #333;background:#f8f9fa;\" colspan=\"2\"></td></tr></table></div><div style=\"display:flex;justify-content:space-between;margin-top:60px;padding-top:35px;border-top:2px solid #333;\"><div style=\"width:45%;text-align:center;\"><p style=\"margin:0 0 12px 0;font-weight:bold;color:#000;font-size:12pt;letter-spacing:0.5px;\">PREPARED BY</p><div style=\"border-top:2px solid #000;margin-top:60px;padding-top:8px;\"><p style=\"margin:0;color:#000;font-size:10pt;letter-spacing:0.5px;\">Signature & Date</p></div></div><div style=\"width:45%;text-align:center;\"><p style=\"margin:0 0 12px 0;font-weight:bold;color:#000;font-size:12pt;letter-spacing:0.5px;\">CASH RECEIVED BY</p><div style=\"border-top:2px solid #000;margin-top:60px;padding-top:8px;\"><p style=\"margin:0;color:#000;font-size:10pt;letter-spacing:0.5px;\">Signature & Date</p></div></div></div></body></html>`;
      try { const previewWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes'); if (!previewWindow) { throw new Error('Popup blocked. Please allow popups for this site.'); } previewWindow.document.write(printContent); previewWindow.document.close(); previewWindow.onload = function(){ setTimeout(() => { previewWindow.print(); }, 250); }; setTimeout(() => { if (previewWindow.document.readyState === 'complete') { previewWindow.print(); } }, 500); } catch(e) { showNotification('Failed to open print preview. Please allow popups for this site.', 'error'); }
    }).catch(() => { showNotification('Failed to load vouchers for printing', 'error'); });
  }

  window.loadPaymentVoucherList = loadPaymentVoucherList;
  window.renderPaymentVoucherList = renderPaymentVoucherList;
  window.printSelectedVouchersList = printSelectedVouchersList;
  window.filterPaymentVouchers = filterPaymentVouchers;
  window.clearPaymentVoucherFilters = clearPaymentVoucherFilters;
  window.downloadPaymentVouchersCSV = downloadPaymentVouchersCSV;
  window.printPaymentVoucherList = printPaymentVoucherList;

  if (document.getElementById('payment-voucher-list-section')) try { loadPaymentVoucherList(); } catch(e) {}
})();
