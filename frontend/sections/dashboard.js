;(function() {
  function initDashboardSection() {
    const section = document.getElementById('dashboard-section');
    if (!section) return;
    const warehouseTab = document.getElementById('warehouse-dashboard-tab');
    const shopTab = document.getElementById('shop-dashboard-tab');
    if (warehouseTab && shopTab) {
      const w = warehouseTab.cloneNode(true);
      const s = shopTab.cloneNode(true);
      warehouseTab.parentNode.replaceChild(w, warehouseTab);
      shopTab.parentNode.replaceChild(s, shopTab);
      w.addEventListener('click', function(){ section.classList.add('active'); });
      s.addEventListener('click', function(){ section.classList.add('active'); });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      requestAnimationFrame(initDashboardSection);
    });
  } else {
    requestAnimationFrame(initDashboardSection);
  }
})();
