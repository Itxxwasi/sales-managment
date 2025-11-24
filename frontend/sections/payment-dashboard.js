(() => {
  function updatePaymentCharts(payments) {
    const ctx1 = document.getElementById('paymentTrendChart');
    if (ctx1 && typeof Chart !== 'undefined') {
      if (window.paymentTrendChart && typeof window.paymentTrendChart.destroy === 'function') window.paymentTrendChart.destroy();
      const branchFilter = document.getElementById('paymentDashboardBranchFilter')?.value || '';
      const supplierFilter = document.getElementById('paymentDashboardSupplierFilter')?.value || '';
      const last7Days = []; const dateStrs = [];
      for (let i = 6; i >= 0; i--) { const date = new Date(); date.setDate(date.getDate() - i); const dateStr = date.toISOString().split('T')[0]; dateStrs.push(dateStr); last7Days.push(date.toLocaleDateString('en', { weekday: 'short' })); }
      let datasets = []; const colors = [ { border: 'rgb(78, 115, 223)', bg: 'rgba(78, 115, 223, 0.1)' }, { border: 'rgb(28, 200, 154)', bg: 'rgba(28, 200, 154, 0.1)' }, { border: 'rgb(54, 185, 204)', bg: 'rgba(54, 185, 204, 0.1)' }, { border: 'rgb(246, 194, 62)', bg: 'rgba(246, 194, 62, 0.1)' }, { border: 'rgb(231, 74, 59)', bg: 'rgba(231, 74, 59, 0.1)' }, { border: 'rgb(133, 135, 150)', bg: 'rgba(133, 135, 150, 0.1)' } ];
      if (branchFilter && supplierFilter) {
        const amounts = dateStrs.map(dateStr => payments.filter(p => { const pDate = p.date === dateStr || new Date(p.date).toISOString().split('T')[0] === dateStr; return pDate; }).reduce((sum, p) => sum + (p.amount || 0), 0));
        const branchName = appData.branches.find(b => b._id === branchFilter)?.name || 'Selected Branch';
        const supplierName = appData.suppliers.find(s => s._id === supplierFilter)?.name || 'Selected Supplier';
        datasets.push({ label: `${branchName} - ${supplierName}`, data: amounts, borderColor: colors[0].border, backgroundColor: colors[0].bg, tension: 0.4, fill: false });
      } else if (branchFilter) {
        const supplierSet = new Set(); payments.forEach(p => { const supplierName = p.supplierId?.name || p.supplier || 'Unknown Supplier'; supplierSet.add(supplierName); });
        Array.from(supplierSet).forEach((supplierName, index) => {
          const amounts = dateStrs.map(dateStr => payments.filter(p => { const pDate = p.date === dateStr || new Date(p.date).toISOString().split('T')[0] === dateStr; const pSupplier = p.supplierId?.name || p.supplier || 'Unknown Supplier'; return pDate && pSupplier === supplierName; }).reduce((sum, p) => sum + (p.amount || 0), 0));
          const color = colors[index % colors.length];
          datasets.push({ label: supplierName, data: amounts, borderColor: color.border, backgroundColor: color.bg, tension: 0.4, fill: false });
        });
      } else if (supplierFilter) {
        const branchSet = new Set(); payments.forEach(p => { const branchName = p.branchId?.name || 'Unknown Branch'; branchSet.add(branchName); });
        Array.from(branchSet).forEach((branchName, index) => {
          const amounts = dateStrs.map(dateStr => payments.filter(p => { const pDate = p.date === dateStr || new Date(p.date).toISOString().split('T')[0] === dateStr; const pBranch = p.branchId?.name || 'Unknown Branch'; return pDate && pBranch === branchName; }).reduce((sum, p) => sum + (p.amount || 0), 0));
          const color = colors[index % colors.length];
          datasets.push({ label: branchName, data: amounts, borderColor: color.border, backgroundColor: color.bg, tension: 0.4, fill: false });
        });
      } else {
        const branchSet = new Set(); payments.forEach(p => { const branchName = p.branchId?.name || 'Unknown Branch'; branchSet.add(branchName); });
        Array.from(branchSet).forEach((branchName, index) => {
          const amounts = dateStrs.map(dateStr => payments.filter(p => { const pDate = p.date === dateStr || new Date(p.date).toISOString().split('T')[0] === dateStr; const pBranch = p.branchId?.name || 'Unknown Branch'; return pDate && pBranch === branchName; }).reduce((sum, p) => sum + (p.amount || 0), 0));
          const color = colors[index % colors.length];
          datasets.push({ label: branchName, data: amounts, borderColor: color.border, backgroundColor: color.bg, tension: 0.4, fill: false });
        });
      }
      if (datasets.length === 0) { const amounts = dateStrs.map(dateStr => payments.filter(p => p.date === dateStr || new Date(p.date).toISOString().split('T')[0] === dateStr).reduce((sum, p) => sum + (p.amount || 0), 0)); datasets = [{ label: 'Daily Payments', data: amounts, borderColor: 'rgb(78, 115, 223)', backgroundColor: 'rgba(78, 115, 223, 0.1)', tension: 0.4 }]; }
      window.paymentTrendChart = new Chart(ctx1, { type: 'line', data: { labels: last7Days, datasets }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top' }, tooltip: { callbacks: { label: function(context){ return context.dataset.label + ': ' + context.parsed.y.toLocaleString(); } } } }, scales: { y: { beginAtZero: true, ticks: { callback: function(value){ return value.toLocaleString(); } } } } } });
    }
    const ctx2 = document.getElementById('paymentSupplierChart');
    if (ctx2 && typeof Chart !== 'undefined') {
      if (window.paymentSupplierChart && typeof window.paymentSupplierChart.destroy === 'function') window.paymentSupplierChart.destroy();
      const supplierData = {}; payments.forEach(p => { const supplierName = p.supplierId?.name || p.supplier || 'Unknown'; supplierData[supplierName] = (supplierData[supplierName] || 0) + (p.amount || 0); });
      window.paymentSupplierChart = new Chart(ctx2, { type: 'doughnut', data: { labels: Object.keys(supplierData), datasets: [{ data: Object.values(supplierData), backgroundColor: ['#4e73df','#1cc88a','#36b9cc','#f6c23e','#e74a3b','#858796'] }] }, options: { responsive: true, maintainAspectRatio: false } });
    }
  }

  function updatePaymentDashboard() {
    const dashboardSection = document.getElementById('payment-dashboard-section');
    if (!dashboardSection || dashboardSection.style.display === 'none') return;
    const branchFilter = document.getElementById('paymentDashboardBranchFilter')?.value || '';
    const supplierFilter = document.getElementById('paymentDashboardSupplierFilter')?.value || '';
    const dateFilter = parseInt(document.getElementById('paymentDashboardDateFilter')?.value || '30');
    let url = '/payments'; const params = []; if (branchFilter) params.push(`branchId=${branchFilter}`); if (supplierFilter) params.push(`supplierId=${supplierFilter}`); url += params.length > 0 ? '?' + params.join('&') : '';
    api.getPayments(url).then(paymentsData => {
      const cutoffDate = new Date(); cutoffDate.setDate(cutoffDate.getDate() - dateFilter);
      const filteredPayments = paymentsData.filter(p => { const paymentDate = new Date(p.date); return paymentDate >= cutoffDate; });
      const normalize = m => (m || 'Cash').toLowerCase();
      const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const cashAmount = filteredPayments.filter(p => ['cash'].includes(normalize(p.paymentMethod))).reduce((sum, p) => sum + (p.amount || 0), 0);
      const bankAmount = filteredPayments.filter(p => ['bank transfer','bank','bank_transfer'].includes(normalize(p.paymentMethod))).reduce((sum, p) => sum + (p.amount || 0), 0);
      const chequeAmount = filteredPayments.filter(p => ['check','cheque'].includes(normalize(p.paymentMethod))).reduce((sum, p) => sum + (p.amount || 0), 0);
      const onlineAmount = filteredPayments.filter(p => ['online payment','online','card','credit card','debit card'].includes(normalize(p.paymentMethod))).reduce((sum, p) => sum + (p.amount || 0), 0);
      document.getElementById('paymentCashAmount').textContent = cashAmount.toLocaleString();
      document.getElementById('paymentBankAmount').textContent = bankAmount.toLocaleString();
      const chequeEl = document.getElementById('paymentChequeAmount'); if (chequeEl) chequeEl.textContent = chequeAmount.toLocaleString();
      const onlineEl = document.getElementById('paymentOnlineAmount'); if (onlineEl) onlineEl.textContent = onlineAmount.toLocaleString();
      document.getElementById('paymentTotalAmount').textContent = totalAmount.toLocaleString();
      const recentVouchers = filteredPayments.slice(-5).reverse();
      const tbody = document.getElementById('paymentRecentVouchersTable');
      if (tbody) { if (recentVouchers.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No vouchers found</td></tr>'; } else { tbody.innerHTML = recentVouchers.map(v => { const branchName = v.branchId?.name || 'Unknown'; const supplierName = v.supplierId?.name || v.supplier || 'Unknown'; const statusBadge = v.status === 'Approved' ? 'success' : v.status === 'Pending' ? 'warning' : 'danger'; return `
          <tr>
            <td>${v.voucherNumber || 'N/A'}</td>
            <td>${formatDate(v.date)}</td>
            <td>${supplierName}</td>
            <td><span class="badge bg-secondary">${branchName}</span></td>
            <td>${v.amount.toLocaleString()}</td>
            <td><span class="badge bg-${statusBadge}">${v.status || 'Pending'}</span></td>
            <td>
              <button class="btn btn-sm btn-info" onclick="viewPaymentVoucher('${v._id}')"><i class="fas fa-eye"></i></button>
            </td>
          </tr>
        `; }).join(''); } }
      updatePaymentCharts(filteredPayments);
      setTimeout(() => { const s = document.getElementById('payment-dashboard-section'); if (s) { s.style.display = 'block'; s.classList.add('active'); } }, 50);
      const goToMethod = method => { showPaymentTab('payment-voucher-list'); setTimeout(() => { try { loadPaymentVoucherList(method); } catch(e) {} }, 100); };
      const cashCard = document.getElementById('cardCashPaid'); if (cashCard) cashCard.onclick = () => goToMethod('Cash');
      const bankCard = document.getElementById('cardBankPaid'); if (bankCard) bankCard.onclick = () => goToMethod('Bank Transfer');
      const chequeCard = document.getElementById('cardChequePaid'); if (chequeCard) chequeCard.onclick = () => goToMethod('Cheque');
      const onlineCard = document.getElementById('cardOnlinePaid'); if (onlineCard) onlineCard.onclick = () => goToMethod('Online Payment');
    }).catch(() => {});
  }

  window.updatePaymentDashboard = updatePaymentDashboard;
  window.updatePaymentCharts = updatePaymentCharts;
  const b = document.getElementById('paymentDashboardBranchFilter');
  const s = document.getElementById('paymentDashboardSupplierFilter');
  const d = document.getElementById('paymentDashboardDateFilter');
  if (b) b.addEventListener('change', updatePaymentDashboard);
  if (s) s.addEventListener('change', updatePaymentDashboard);
  if (d) d.addEventListener('change', updatePaymentDashboard);
  updatePaymentDashboard();
})();
