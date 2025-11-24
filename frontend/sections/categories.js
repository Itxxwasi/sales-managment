;(function() {
  function initCategoriesSection() {
    const addBtn = document.getElementById('addCategoryBtn');
    if (addBtn) {
      const newBtn = addBtn.cloneNode(true);
      addBtn.parentNode.replaceChild(newBtn, addBtn);
      newBtn.addEventListener('click', function() {
        const form = document.getElementById('categoryForm');
        if (form) form.reset();
        const title = document.getElementById('addCategoryModalLabel');
        if (title) title.textContent = 'Add New Category';

        const saveBtn = document.getElementById('saveCategoryBtn');
        if (saveBtn) {
          saveBtn.textContent = 'Save Category';
          saveBtn.onclick = null;
          saveBtn.removeAttribute('onclick');
          saveBtn.onclick = function() {
            const formEl = document.getElementById('categoryForm');
            if (formEl && formEl.checkValidity()) {
              if (typeof window.saveCategory === 'function') {
                window.saveCategory();
              } else {
                if (typeof saveCategory === 'function') saveCategory();
              }
            } else if (formEl) {
              formEl.reportValidity();
            }
          };
        }

        const modalEl = document.getElementById('addCategoryModal');
        if (modalEl && window.bootstrap && typeof window.bootstrap.Modal === 'function') {
          const modal = new window.bootstrap.Modal(modalEl);
          modal.show();
        }
      });
    }

    const cardBtn = document.getElementById('categoryCardViewBtn');
    const tableBtn = document.getElementById('categoryTableViewBtn');
    const cardView = document.getElementById('categoryCardView');
    const tableView = document.getElementById('categoryTableView');
    if (cardBtn && tableBtn && cardView && tableView) {
      const cardBtnNew = cardBtn.cloneNode(true);
      cardBtn.parentNode.replaceChild(cardBtnNew, cardBtn);
      const tableBtnNew = tableBtn.cloneNode(true);
      tableBtn.parentNode.replaceChild(tableBtnNew, tableBtn);
      cardBtnNew.addEventListener('click', function() {
        cardBtnNew.classList.add('active');
        tableBtnNew.classList.remove('active');
        cardView.style.display = 'block';
        tableView.style.display = 'none';
      });
      tableBtnNew.addEventListener('click', function() {
        tableBtnNew.classList.add('active');
        cardBtnNew.classList.remove('active');
        tableView.style.display = 'block';
        cardView.style.display = 'none';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      requestAnimationFrame(initCategoriesSection);
    });
  } else {
    requestAnimationFrame(initCategoriesSection);
  }
})();
