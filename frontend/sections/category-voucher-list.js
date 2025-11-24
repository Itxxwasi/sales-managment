(() => {
  function initializeCategoryVoucherList() {
    populateCategoryVoucherListFilters();
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const fromDateEl = document.getElementById('categoryVoucherListFromDate');
    const toDateEl = document.getElementById('categoryVoucherListToDate');
    if (fromDateEl && !fromDateEl.value) fromDateEl.value = firstDay.toISOString().split('T')[0];
    if (toDateEl && !toDateEl.value) toDateEl.value = lastDay.toISOString().split('T')[0];
  }

  function populateCategoryVoucherListFilters() {
    const categoryFilter = document.getElementById('categoryVoucherListCategoryFilter');
    if (categoryFilter && window.appData && appData.categories) {
      const firstOption = categoryFilter.options[0];
      categoryFilter.innerHTML = '';
      if (firstOption) categoryFilter.appendChild(firstOption);
      appData.categories.forEach(c => {
        const option = document.createElement('option');
        option.value = c._id;
        option.textContent = c.name;
        categoryFilter.appendChild(option);
      });
    }
    const branchFilter = document.getElementById('categoryVoucherListBranchFilter');
    if (branchFilter && window.appData && appData.branches) {
      const firstOption = branchFilter.options[0];
      branchFilter.innerHTML = '';
      if (firstOption) branchFilter.appendChild(firstOption);
      appData.branches.forEach(b => {
        const option = document.createElement('option');
        option.value = b._id;
        option.textContent = b.name;
        branchFilter.appendChild(option);
      });
    }
  }

  function loadCategoryVoucherList() {
    const permissions = window.appData?.currentUser?.permissions || [];
    if (!permissions.includes('admin') && !permissions.includes('category-voucher-list')) {
      showNotification('Access denied. You do not have permission to view category voucher list.', 'error');
      const tbody = document.getElementById('categoryVoucherListTable');
      if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Access denied. You do not have permission to view category voucher list.</td></tr>';
      return;
    }

    const categoryId = document.getElementById('categoryVoucherListCategoryFilter')?.value || '';
    const branchId = document.getElementById('categoryVoucherListBranchFilter')?.value || '';
    const fromDate = document.getElementById('categoryVoucherListFromDate')?.value || '';
    const toDate = document.getElementById('categoryVoucherListToDate')?.value || '';
    if (!fromDate || !toDate) { showNotification('Please select date range', 'error'); return; }

    const salesFilters = {};
    if (categoryId) salesFilters.categoryId = categoryId;
    if (branchId) salesFilters.branchId = branchId;
    if (fromDate) salesFilters.from = fromDate;
    if (toDate) salesFilters.to = toDate;

    let categoryPaymentUrl = '/category-payments';
    const paymentParams = [];
    if (branchId) paymentParams.push(`branchId=${branchId}`);
    if (categoryId) paymentParams.push(`categoryId=${categoryId}`);
    if (fromDate) paymentParams.push(`from=${fromDate}`);
    if (toDate) paymentParams.push(`to=${toDate}`);
    if (paymentParams.length > 0) categoryPaymentUrl += '?' + paymentParams.join('&');

    Promise.all([
      api.getSales(salesFilters),
      api.getCategoryPayments(categoryPaymentUrl)
    ]).then(([sales, payments]) => {
      renderCategoryVoucherList(sales, payments);
    }).catch(error => {
      console.error('Error loading category voucher list:', error);
      if (error.response && error.response.status === 403) {
        showNotification('Access denied. You do not have permission to view category voucher list.', 'error');
        const tbody = document.getElementById('categoryVoucherListTable');
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Access denied. You do not have permission to view category voucher list.</td></tr>';
      } else {
        showNotification('Failed to load category voucher list: ' + (error.message || 'Unknown error'), 'error');
      }
    });
  }

  function renderCategoryVoucherList(sales, payments) {
    const tbody = document.getElementById('categoryVoucherListTable');
    if (!tbody) return;
    const fromDate = document.getElementById('categoryVoucherListFromDate')?.value || '';
    const toDate = document.getElementById('categoryVoucherListToDate')?.value || '';
    tbody.innerHTML = '';

    const salesByCategoryBranch = {};
    let totalSales = 0;
    let totalCost = 0;
    sales.forEach(sale => {
      const categoryId = sale.categoryId?._id || sale.categoryId || 'unknown';
      const categoryName = sale.categoryId?.name || sale.category || 'Unknown';
      const branchId = sale.branchId?._id || sale.branchId || 'unknown';
      const branchName = sale.branchId?.name || 'Unknown';
      const key = `${categoryId}_${branchId}`;
      if (!salesByCategoryBranch[key]) {
        salesByCategoryBranch[key] = { categoryId, categoryName, branchId, branchName, sales: 0, cost: 0 };
      }
      salesByCategoryBranch[key].sales += sale.total || 0;
      salesByCategoryBranch[key].cost += sale.costTotal || 0;
      totalSales += sale.total || 0;
      totalCost += sale.costTotal || 0;
    });

    const paymentsByCategoryBranch = {};
    let totalPayment = 0;
    payments.forEach(payment => {
      if (payment.voucherType && payment.voucherType !== 'category') return;
      if (!payment.categoryId) return;
      const categoryId = payment.categoryId?._id || payment.categoryId || 'unknown';
      const categoryName = payment.categoryId?.name || payment.category || 'Unknown';
      const branchId = payment.branchId?._id || payment.branchId || 'unknown';
      const branchName = payment.branchId?.name || 'Unknown';
      const key = `${categoryId}_${branchId}`;
      if (!paymentsByCategoryBranch[key]) paymentsByCategoryBranch[key] = { categoryId, categoryName, branchId, branchName, payment: 0 };
      paymentsByCategoryBranch[key].payment += payment.amount || 0;
      totalPayment += payment.amount || 0;
    });

    const allKeys = new Set([...Object.keys(salesByCategoryBranch), ...Object.keys(paymentsByCategoryBranch)]);
    allKeys.forEach(key => {
      const saleData = salesByCategoryBranch[key] || {};
      const paymentData = paymentsByCategoryBranch[key] || {};
      const categoryName = saleData.categoryName || paymentData.categoryName || 'Unknown';
      const branchName = saleData.branchName || paymentData.branchName || 'Unknown';
      const salesAmount = saleData.sales || 0;
      const costAmount = saleData.cost || 0;
      const paymentAmount = paymentData.payment || 0;
      const balance = paymentAmount - costAmount;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${categoryName}</td>
        <td>${branchName}</td>
        <td>${fromDate && toDate ? `${fromDate} to ${toDate}` : formatDate(new Date())}</td>
        <td class="text-end">PKR ${salesAmount.toLocaleString()}</td>
        <td class="text-end">PKR ${costAmount.toLocaleString()}</td>
        <td class="text-end">PKR ${paymentAmount.toLocaleString()}</td>
        <td class="text-end ${balance < 0 ? 'text-danger' : balance > 0 ? 'text-success' : ''}">PKR ${balance.toLocaleString()}</td>
      `;
      tbody.appendChild(row);
    });

    const balance = totalPayment - totalCost;
    const totalSalesEl = document.getElementById('categoryVoucherTotalSales');
    const totalCostEl = document.getElementById('categoryVoucherTotalCost');
    const totalPaymentEl = document.getElementById('categoryVoucherTotalPayment');
    const balanceEl = document.getElementById('categoryVoucherBalance');
    if (totalSalesEl) totalSalesEl.textContent = `PKR ${totalSales.toLocaleString()}`;
    if (totalCostEl) totalCostEl.textContent = `PKR ${totalCost.toLocaleString()}`;
    if (totalPaymentEl) totalPaymentEl.textContent = `PKR ${totalPayment.toLocaleString()}`;
    if (balanceEl) {
      const span = balanceEl.querySelector('span');
      if (span) { span.textContent = `PKR ${balance.toLocaleString()}`; span.className = balance < 0 ? 'text-danger' : balance > 0 ? 'text-success' : 'text-warning'; }
    }
    if (tbody.children.length === 0) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No data found for selected filters</td></tr>';
  }

  function clearCategoryVoucherFilters() {
    const c = document.getElementById('categoryVoucherListCategoryFilter'); if (c) c.value = '';
    const b = document.getElementById('categoryVoucherListBranchFilter'); if (b) b.value = '';
    const f = document.getElementById('categoryVoucherListFromDate'); if (f) f.value = '';
    const t = document.getElementById('categoryVoucherListToDate'); if (t) t.value = '';
    const tbody = document.getElementById('categoryVoucherListTable'); if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Click "Apply Filters" to load data</td></tr>';
    const ts = document.getElementById('categoryVoucherTotalSales'); if (ts) ts.textContent = '0';
    const tc = document.getElementById('categoryVoucherTotalCost'); if (tc) tc.textContent = '0';
    const tp = document.getElementById('categoryVoucherTotalPayment'); if (tp) tp.textContent = '0';
    const balanceEl = document.getElementById('categoryVoucherBalance');
    if (balanceEl) { const span = balanceEl.querySelector('span'); if (span) { span.textContent = '0'; span.className = 'text-warning'; } }
  }

  function printCategoryVoucherList() {
    const tbody = document.getElementById('categoryVoucherListTable');
    if (!tbody) { showNotification('No vouchers to print', 'error'); return; }
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0 || (rows.length === 1 && rows[0].textContent.includes('No data'))) { showNotification('No vouchers to print', 'error'); return; }
    const fromDate = document.getElementById('categoryVoucherListFromDate')?.value || '';
    const toDate = document.getElementById('categoryVoucherListToDate')?.value || '';
    const branchFilter = document.getElementById('categoryVoucherListBranchFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryVoucherListCategoryFilter')?.value || '';
    let url = '/category-payments?'; const params = []; if (branchFilter) params.push(`branchId=${branchFilter}`); if (categoryFilter) params.push(`categoryId=${categoryFilter}`); if (fromDate) params.push(`from=${fromDate}`); if (toDate) params.push(`to=${toDate}`); url += params.join('&');
    api.getCategoryPayments(url).then(vouchers => {
      if (!vouchers || vouchers.length === 0) { showNotification('No vouchers to print', 'error'); return; }
      const companyName = appData.settings?.companyName || 'D.Watson Group of Pharmacy';
      let branchDisplayName = 'All Branches'; let categoryDisplayName = 'All Categories';
      if (branchFilter) { const branch = appData.branches.find(b => b._id === branchFilter); branchDisplayName = branch ? branch.name : 'Selected Branch'; } else if (vouchers.length > 0) { const uniqueBranches = [...new Set(vouchers.map(v => v.branchId?.name || 'Unknown'))]; branchDisplayName = uniqueBranches.length === 1 ? uniqueBranches[0] : 'All Branches'; }
      if (categoryFilter) { const category = appData.categories.find(c => c._id === categoryFilter); categoryDisplayName = category ? category.name : 'Selected Category'; } else if (vouchers.length > 0) { const uniqueCategories = [...new Set(vouchers.map(v => v.categoryId?.name || v.category || 'Unknown'))]; categoryDisplayName = uniqueCategories.length === 1 ? uniqueCategories[0] : 'All Categories'; }
      const uniqueBranches = [...new Set(vouchers.map(v => v.branchId?.name || 'Unknown'))]; const uniqueCategories = [...new Set(vouchers.map(v => v.categoryId?.name || v.category || 'Unknown'))]; const includeCategoryCol = (uniqueCategories.length > 1);
      const vouchersByMethod = {}; vouchers.forEach(voucher => { const method = voucher.paymentMethod || 'Cash'; if (!vouchersByMethod[method]) vouchersByMethod[method] = []; vouchersByMethod[method].push(voucher); }); const sortedMethods = Object.keys(vouchersByMethod).sort();
      let printContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Category Payment Vouchers List</title><style>*{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}@page{size:A4;margin:0.5in;}body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.4;color:#000;background:#fff;margin:0;padding:20px;} .print-header{text-align:center;margin-bottom:30px;padding:30px 25px;background:#00685c;color:#ffffff;border-bottom:3px solid #000;} .print-header h2{margin:0;font-size:24pt;font-weight:bold;letter-spacing:1px;color:#ffffff;} table{width:100%;border-collapse:collapse;margin-bottom:30px;border:1px solid #333;background:white;table-layout:fixed;} th{padding:10px 8px;border:1px solid #333;font-weight:bold;color:#ffffff;font-size:10pt;text-transform:uppercase;white-space:normal;word-wrap:break-word;line-height:1.3;} td{padding:10px 8px;border:1px solid #333;font-size:11pt;word-wrap:break-word;overflow:hidden;} tr{height:auto;} .summary-section{border:2px solid #000;padding:25px;margin-top:35px;background:#ffffff;} .summary-section h3{text-align:center;margin-bottom:25px;text-transform:uppercase;font-size:16pt;font-weight:bold;color:#000;letter-spacing:2px;padding-bottom:15px;border-bottom:2px solid #333;}</style></head><body><div class="print-header"><h2>${companyName}</h2><p style="margin:10px 0 0 0;font-size:16pt;font-weight:bold;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">CATEGORY PAYMENT VOUCHERS LIST</p>${fromDate || toDate ? `<p style=\"margin:8px 0 0 0;font-size:11pt;color:#ffffff;\">Period: ${fromDate ? formatDate(fromDate) : 'All'} - ${toDate ? formatDate(toDate) : 'All'}</p>` : ''}<p style="margin:8px 0 0 0;font-size:10pt;color:#ffffff;">Generated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p></div><div style="margin-bottom:20px;padding:15px;background:#f8f9fa;border:1px solid #333;"><div style="display:flex;justify-content:space-between;font-size:13pt;font-weight:bold;color:#000;"><div><span style="color:#00685c;">Branch:</span> <span>${branchDisplayName}</span></div><div><span style="color:#00685c;">Category:</span> <span>${categoryDisplayName}</span></div></div></div><table><thead><tr style="background:#00685c;"><th style="text-align:center;width:4%;padding:10px 6px;">#</th><th style="text-align:left;width:12%;padding:10px 6px;">V.No</th><th style="text-align:left;width:10%;padding:10px 6px;">Date</th>${includeCategoryCol ? '<th style="text-align:left;width:18%;padding:10px 6px;">Category</th>' : ''}<th style="text-align:center;width:10%;padding:10px 6px;">PM</th><th style="text-align:left;width:${includeCategoryCol ? '28%' : '38%'};padding:10px 6px;">Description</th><th style="text-align:right;width:16%;padding:10px 6px;">Amount</th></tr></thead><tbody>`;
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
          const categoryName = voucher.categoryId?.name || voucher.category || 'Unknown';
          const rowBg = voucherIndex % 2 === 0 ? '#ffffff' : '#f8f9fa';
          printContent += `<tr style=\"background-color:${rowBg};vertical-align:top;\"><td style=\"padding:10px 6px;border:1px solid #333;font-weight:bold;color:#000;text-align:center;font-size:11pt;width:4%;vertical-align:top;\">${globalRowIndex}</td><td style=\"padding:10px 6px;border:1px solid #333;font-weight:bold;color:#000;font-size:11pt;width:12%;vertical-align:top;\">${voucherNum}</td><td style=\"padding:10px 6px;border:1px solid #333;color:#000;font-size:11pt;width:10%;vertical-align:top;\">${voucherDate}</td>${includeCategoryCol ? `<td style=\"padding:10px 6px;border:1px solid #333;color:#000;font-size:11pt;width:18%;vertical-align:top;\">${categoryName}</td>` : ''}<td style=\"padding:10px 6px;border:1px solid #333;text-align:center;color:#000;font-size:11pt;width:10%;vertical-align:top;\">${method}</td><td style=\"padding:10px 6px;border:1px solid #333;color:#000;font-size:11pt;width:${includeCategoryCol ? '28%' : '38%'};white-space:normal;word-wrap:break-word;overflow-wrap:break-word;vertical-align:top;line-height:1.4;\">${description || '-'}</td><td style=\"padding:10px 6px;border:1px solid #333;text-align:right;font-weight:bold;color:#000;font-size:11pt;width:16%;white-space:nowrap;vertical-align:top;\">${amount.toLocaleString()}</td></tr>`;
        });
        printContent += `<tr style=\"background-color:#000000;color:#ffffff;\"><td colspan=\"${includeCategoryCol ? '6' : '5'}\" style=\"padding:12px 8px;border:2px solid #000000;font-weight:bold;font-size:13pt;text-align:center;text-transform:uppercase;\">Subtotal ${method} Paid</td><td style=\"padding:12px 8px;border:2px solid #000000;font-weight:bold;font-size:13pt;text-align:right;color:#ffffff;white-space:nowrap;\">${methodTotal.toLocaleString()}</td></tr>`;
      });
      printContent += `</tbody></table>`;
      const totalAmount = vouchers.reduce((sum, v) => sum + (v.amount || 0), 0);
      printContent += `<div class=\"summary-section\"><h3>SUMMARY</h3><table style=\"width:100%;border-collapse:collapse;\"><tr style=\"background-color:#f0f0f0;\"><td style=\"padding:12px;border:1px solid #333;font-weight:bold;width:30%;background:#f8f9fa;color:#000;font-size:12pt;\">Total Vouchers:</td><td style=\"padding:12px;border:1px solid #333;width:20%;color:#000;font-weight:bold;font-size:12pt;\">${vouchers.length}</td><td style=\"padding:12px;border:1px solid #333;font-weight:bold;width:30%;background:#f8f9fa;color:#000;font-size:12pt;\">Total Amount:</td><td style=\"padding:12px;border:1px solid #333;font-weight:bold;width:20%;text-align:right;color:#000;font-size:12pt;\">${totalAmount.toLocaleString()}</td></tr><tr><td style=\"padding:12px;border:1px solid #333;font-weight:bold;background:#f8f9fa;color:#000;font-size:12pt;\">Status:</td><td style=\"padding:12px;border:1px solid #333;color:#000;font-weight:bold;font-size:12pt;\">All PAID</td><td style=\"padding:12px;border:1px solid #333;background:#f8f9fa;\" colspan=\"2\"></td></tr></table></div><div style=\"display:flex;justify-content:space-between;margin-top:60px;padding-top:35px;border-top:2px solid #333;\"><div style=\"width:45%;text-align:center;\"><p style=\"margin:0 0 12px 0;font-weight:bold;color:#000;font-size:12pt;letter-spacing:0.5px;\">PREPARED BY</p><div style=\"border-top:2px solid #000;margin-top:60px;padding-top:8px;\"><p style=\"margin:0;color:#000;font-size:10pt;letter-spacing:0.5px;\">Signature & Date</p></div></div><div style=\"width:45%;text-align:center;\"><p style=\"margin:0 0 12px 0;font-weight:bold;color:#000;font-size:12pt;letter-spacing:0.5px;\">CASH RECEIVED BY</p><div style=\"border-top:2px solid #000;margin-top:60px;padding-top:8px;\"><p style=\"margin:0;color:#000;font-size:10pt;letter-spacing:0.5px;\">Signature & Date</p></div></div></div></body></html>`;
      try { const previewWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes'); if (!previewWindow) { throw new Error('Popup blocked. Please allow popups for this site.'); } previewWindow.document.write(printContent); previewWindow.document.close(); previewWindow.onload = function(){ setTimeout(() => { previewWindow.print(); }, 250); }; setTimeout(() => { if (previewWindow.document.readyState === 'complete') { previewWindow.print(); } }, 500); } catch(e) { showNotification('Failed to open print preview. Please allow popups for this site.', 'error'); }
    }).catch(() => { showNotification('Failed to load vouchers for printing', 'error'); });
  }

  window.initializeCategoryVoucherList = initializeCategoryVoucherList;
  window.populateCategoryVoucherListFilters = populateCategoryVoucherListFilters;
  window.loadCategoryVoucherList = loadCategoryVoucherList;
  window.renderCategoryVoucherList = renderCategoryVoucherList;
  window.clearCategoryVoucherFilters = clearCategoryVoucherFilters;
  window.printCategoryVoucherList = printCategoryVoucherList;

  if (document.getElementById('category-voucher-list-section')) {
    try { initializeCategoryVoucherList(); } catch (e) {}
  }
})();
