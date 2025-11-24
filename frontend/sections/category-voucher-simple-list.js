(() => {
  function initializeCategoryVoucherSimpleList() {
    populateCategoryVoucherSimpleFilters();
    loadCategoryVoucherSimpleList();
  }

  function populateCategoryVoucherSimpleFilters() {
    const categoryFilter = document.getElementById('categoryVoucherSimpleListCategoryFilter');
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

    const branchFilter = document.getElementById('categoryVoucherSimpleListBranchFilter');
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

  function loadCategoryVoucherSimpleList() {
    const listSection = document.getElementById('category-voucher-simple-list-section');
    if (!listSection || listSection.style.display === 'none') return;

    const permissions = window.appData?.currentUser?.permissions || [];
    if (!permissions.includes('admin') && !permissions.includes('category-voucher-list')) {
      showNotification('Access denied. You do not have permission to view category voucher list.', 'error');
      const tbody = document.getElementById('categoryVoucherSimpleListTable');
      if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Access denied. You do not have permission to view category voucher list.</td></tr>';
      return;
    }

    const branchFilter = document.getElementById('categoryVoucherSimpleListBranchFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryVoucherSimpleListCategoryFilter')?.value || '';
    const fromDate = document.getElementById('categoryVoucherSimpleListFromDate')?.value || '';
    const toDate = document.getElementById('categoryVoucherSimpleListToDate')?.value || '';
    const search = document.getElementById('categoryVoucherSimpleSearch')?.value || '';

    let url = '/category-payments';
    const params = [];
    if (branchFilter) params.push(`branchId=${branchFilter}`);
    if (categoryFilter) params.push(`categoryId=${categoryFilter}`);
    if (fromDate) params.push(`from=${fromDate}`);
    if (toDate) params.push(`to=${toDate}`);
    if (params.length > 0) url += '?' + params.join('&');

    api.getCategoryPayments(url).then(paymentsData => {
      let filteredPayments = paymentsData;
      if (search) {
        const s = search.toLowerCase();
        filteredPayments = filteredPayments.filter(p => (
          p.voucherNumber && String(p.voucherNumber).toLowerCase().includes(s)
        ) || (
          (p.category && String(p.category).toLowerCase().includes(s)) || (p.categoryId && p.categoryId.name && String(p.categoryId.name).toLowerCase().includes(s))
        ) || (
          p.description && String(p.description).toLowerCase().includes(s)
        ) || (
          p.branchId && p.branchId.name && String(p.branchId.name).toLowerCase().includes(s)
        ));
      }
      renderCategoryVoucherSimpleList(filteredPayments);
    }).catch(error => {
      console.error('Error loading category voucher simple list:', error);
      if (error.response && error.response.status === 403) {
        showNotification('Access denied. You do not have permission to view category voucher list.', 'error');
        const tbody = document.getElementById('categoryVoucherSimpleListTable');
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Access denied. You do not have permission to view category voucher list.</td></tr>';
      } else {
        showNotification('Failed to load category voucher list: ' + (error.message || 'Unknown error'), 'error');
      }
    });
  }

  function renderCategoryVoucherSimpleList(vouchers) {
    const tbody = document.getElementById('categoryVoucherSimpleListTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!vouchers || vouchers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No category vouchers found</td></tr>';
      return;
    }
    const canEditVoucher = (window.appData?.currentUser?.permissions || []).includes('category-voucher-edit') || (window.appData?.currentUser?.permissions || []).includes('admin');
    const canDeleteVoucher = (window.appData?.currentUser?.permissions || []).includes('category-voucher-delete') || (window.appData?.currentUser?.permissions || []).includes('admin');
    vouchers.forEach(voucher => {
      const branchName = voucher.branchId?.name || 'Unknown';
      const categoryName = voucher.categoryId?.name || voucher.category || 'Unknown';
      const voucherNum = voucher.voucherNumber || 'N/A';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${voucherNum}</td>
        <td>${formatDate(voucher.date)}</td>
        <td><span class="badge bg-info">${categoryName}</span></td>
        <td>${branchName}</td>
        <td class="text-end">PKR ${voucher.amount.toLocaleString()}</td>
        <td>${voucher.paymentMethod || 'Cash'}</td>
        <td>${voucher.description || '-'}</td>
        <td class="no-print">
          <button class="btn btn-sm btn-info me-1" onclick="viewCategoryPaymentVoucher('${voucher._id}')"><i class="fas fa-eye"></i></button>
          ${canEditVoucher ? `<button class="btn btn-sm btn-warning me-1" onclick="editCategoryPaymentVoucher('${voucher._id}')"><i class="fas fa-edit"></i></button>` : ''}
          ${canDeleteVoucher ? `<button class="btn btn-sm btn-danger" onclick="deleteCategoryPaymentVoucher('${voucher._id}')"><i class="fas fa-trash"></i></button>` : ''}
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  function clearCategoryVoucherSimpleFilters() {
    const s = document.getElementById('categoryVoucherSimpleSearch'); if (s) s.value = '';
    const b = document.getElementById('categoryVoucherSimpleListBranchFilter'); if (b) b.value = '';
    const c = document.getElementById('categoryVoucherSimpleListCategoryFilter'); if (c) c.value = '';
    const f = document.getElementById('categoryVoucherSimpleListFromDate'); if (f) f.value = '';
    const t = document.getElementById('categoryVoucherSimpleListToDate'); if (t) t.value = '';
    loadCategoryVoucherSimpleList();
  }

  function printCategoryVoucherSimpleList() {
    const tbody = document.getElementById('categoryVoucherSimpleListTable');
    if (!tbody) { showNotification('No vouchers to print', 'error'); return; }
    const branchFilter = document.getElementById('categoryVoucherSimpleListBranchFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryVoucherSimpleListCategoryFilter')?.value || '';
    const fromDate = document.getElementById('categoryVoucherSimpleListFromDate')?.value || '';
    const toDate = document.getElementById('categoryVoucherSimpleListToDate')?.value || '';
    const search = document.getElementById('categoryVoucherSimpleSearch')?.value || '';
    const branchName = branchFilter ? (window.appData?.branches?.find(b => b._id === branchFilter)?.name || 'All Branches') : 'All Branches';
    const categoryName = categoryFilter ? (window.appData?.categories?.find(c => c._id === categoryFilter)?.name || 'All Categories') : 'All Categories';
    const companyName = window.appData?.settings?.companyName || 'D.Watson Group Of Pharmacies';
    const rows = Array.from(tbody.querySelectorAll('tr')).filter(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length === 1 && (cells[0].textContent.includes('No vouchers') || cells[0].textContent.includes('Loading'))) return false;
      return cells.length >= 7;
    });
    if (rows.length === 0) { showNotification('No vouchers to print', 'error'); return; }
    const printContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Category Voucher List - ${new Date().toLocaleDateString('en-GB')}</title><style>*{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#000;background:#fff;margin:0;padding:20px}.print-header{text-align:center;margin-bottom:30px;border-bottom:3px solid #2c6e8a;padding-bottom:15px}.print-header h1{font-size:28pt;font-weight:bold;margin:0 0 10px 0;color:#2c6e8a}.filter-info{margin-bottom:20px;padding:15px 20px;background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);border:2px solid #2c6e8a;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1)}table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:10pt}th{background-color:#2c6e8a;color:#fff;padding:12px;text-align:left;font-weight:bold;border:1px solid #1a4d63}td{padding:10px;border:1px solid #ddd}.text-end{text-align:right}@page{size:A4 portrait;margin:0.5in}@media print{body{padding:0}}</style></head><body><div class="print-header"><h1>${companyName}</h1><div class="company-info">Category Voucher List</div><div class="company-info">Generated: ${new Date().toLocaleDateString('en-GB')}</div></div><div class="filter-info"><p><strong>Branch:</strong> ${branchName}</p><p><strong>Category:</strong> ${categoryName}</p><p><strong>From Date:</strong> ${fromDate || 'All Dates'}</p><p><strong>To Date:</strong> ${toDate || 'All Dates'}</p>${search ? `<p><strong>Search:</strong> ${search}</p>` : ''}</div><table><thead><tr><th>Voucher #</th><th>Date</th><th>Category</th><th>Branch</th><th class="text-end">Amount</th><th>Method</th><th>Description</th></tr></thead><tbody>${rows.map(row=>{const cells=row.querySelectorAll('td');const categoryText=cells[2].textContent.replace(/badge.*?>/g,'').replace(/span.*?>/g,'').trim();return `<tr><td>${cells[0].textContent.trim()}</td><td>${cells[1].textContent.trim()}</td><td>${categoryText}</td><td>${cells[3].textContent.trim()}</td><td class="text-end">${cells[4].textContent.trim()}</td><td>${cells[5].textContent.trim()}</td><td>${cells[6].textContent.trim()}</td></tr>`}).join('')}</tbody></table></body></html>`;
    const w = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (!w) { showNotification('Popup blocked. Please allow popups.', 'error'); return; }
    w.document.write(printContent); w.document.close(); w.focus(); setTimeout(() => w.print(), 250);
  }

  window.initializeCategoryVoucherSimpleList = initializeCategoryVoucherSimpleList;
  window.populateCategoryVoucherSimpleFilters = populateCategoryVoucherSimpleFilters;
  window.loadCategoryVoucherSimpleList = loadCategoryVoucherSimpleList;
  window.renderCategoryVoucherSimpleList = renderCategoryVoucherSimpleList;
  window.clearCategoryVoucherSimpleFilters = clearCategoryVoucherSimpleFilters;
  window.printCategoryVoucherSimpleList = printCategoryVoucherSimpleList;

  const simpleSearch = document.getElementById('categoryVoucherSimpleSearch');
  if (simpleSearch) simpleSearch.addEventListener('input', loadCategoryVoucherSimpleList);

  if (document.getElementById('category-voucher-simple-list-section')) {
    try { initializeCategoryVoucherSimpleList(); } catch (e) {}
  }
})();
