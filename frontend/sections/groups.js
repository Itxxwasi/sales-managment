;(function() {
  function initGroupsSection() {
    const saveBtn = document.getElementById('saveGroupBtn');
    if (saveBtn) {
      const newBtn = saveBtn.cloneNode(true);
      saveBtn.parentNode.replaceChild(newBtn, saveBtn);
      newBtn.onclick = function() {
        if (typeof window.saveGroup === 'function') window.saveGroup();
        else if (typeof saveGroup === 'function') saveGroup();
      };
    }
    const addNewGroupBtn = document.getElementById('addNewGroupBtn');
    if (addNewGroupBtn) {
      const newBtn = addNewGroupBtn.cloneNode(true);
      addNewGroupBtn.parentNode.replaceChild(newBtn, addNewGroupBtn);
      newBtn.onclick = function() {
        if (typeof window.resetGroupForm === 'function') window.resetGroupForm();
        else if (typeof resetGroupForm === 'function') resetGroupForm();
        const nameInput = document.getElementById('groupNameInput');
        if (nameInput) setTimeout(function(){ nameInput.focus(); }, 100);
      };
    }
    if (typeof window.resetGroupForm === 'function') window.resetGroupForm();
    else if (typeof resetGroupForm === 'function') resetGroupForm();
    if (typeof window.loadGroups === 'function') window.loadGroups();
    else if (typeof loadGroups === 'function') loadGroups();
  }

  async function loadGroups() { if (typeof ensureSectionViewLoaded === 'function') ensureSectionViewLoaded('groups'); if (typeof isAdmin === 'function' && !isAdmin()) { const banner = document.getElementById('permission-denied-banner'); if (banner) banner.classList.remove('d-none'); return; } const bannerOk = document.getElementById('permission-denied-banner'); if (bannerOk) bannerOk.classList.add('d-none'); api.getGroups().then(groupsData => { appData.groups = groupsData; renderGroups(groupsData); }).catch(error => { console.error('Error loading groups:', error); if (typeof showNotification === 'function') showNotification('Failed to load groups: ' + error.message, 'error'); }); }

  function renderGroups(groupsData) { const tableBody = document.getElementById('groupsTableBody'); if (!tableBody) { console.error('groupsTableBody not found'); return; } tableBody.innerHTML = ''; if (!groupsData || groupsData.length === 0) { tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No groups found</td></tr>'; return; } groupsData.forEach(group => { const row = document.createElement('tr'); const isActive = group.isActive !== false; row.innerHTML = '<td><strong>' + (group.name || 'Unnamed') + '</strong></td><td>' + (isActive ? 'true' : 'false') + '</td><td><button class="btn btn-sm btn-outline-primary me-2" onclick="editGroup(\'' + group._id + '\')" title="Edit"><i class="fas fa-check"></i></button><button class="btn btn-sm btn-outline-danger" onclick="deleteGroup(\'' + group._id + '\')" title="Delete"><i class="fas fa-trash"></i></button></td>'; tableBody.appendChild(row); }); }

  function saveGroup() { if (typeof isAdmin === 'function' && !isAdmin()) { if (typeof showNotification === 'function') showNotification('You need admin privileges to create groups', 'error'); return; } const groupNameInput = document.getElementById('groupNameInput'); const groupActiveCheckbox = document.getElementById('groupActiveCheckbox'); if (!groupNameInput) { console.error('groupNameInput not found'); return; } const groupName = groupNameInput.value.trim(); if (!groupName) { if (typeof showNotification === 'function') showNotification('Group name is required', 'error'); return; } const permissions = []; document.querySelectorAll('#permissionsChecklist .permission-checkbox:checked').forEach(checkbox => { const permission = checkbox.getAttribute('data-permission'); if (permission) permissions.push(permission); }); const groupData = { name: groupName, isActive: groupActiveCheckbox ? groupActiveCheckbox.checked : true, permissions }; const currentGroupId = window.currentGroupId; if (currentGroupId) { api.updateGroup(currentGroupId, groupData).then(() => { if (typeof showNotification === 'function') showNotification('Group updated successfully!', 'success'); resetGroupForm(); loadGroups(); }).catch(error => { console.error('Error updating group:', error); if (typeof showNotification === 'function') showNotification('Failed to update group: ' + error.message, 'error'); }); } else { api.createGroup(groupData).then(() => { if (typeof showNotification === 'function') showNotification('Group saved successfully!', 'success'); resetGroupForm(); const formContainer = document.querySelector('.group-form-container'); if (formContainer) { formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }); } api.getCurrentUser().then(updatedUser => { appData.currentUser = { ...updatedUser, permissions: updatedUser.groupId?.permissions || [] }; if (typeof updateCurrentUserUI === 'function') updateCurrentUserUI(); if (typeof updateSidebarPermissions === 'function') updateSidebarPermissions(); if (typeof populateBranchSelectors === 'function') populateBranchSelectors(); loadGroups(); }).catch(() => { loadGroups(); }); }).catch(error => { console.error('Error saving group:', error); if (typeof showNotification === 'function') showNotification('Failed to save group: ' + error.message, 'error'); }); } }

  function resetGroupForm() { const groupNameInput = document.getElementById('groupNameInput'); const groupActiveCheckbox = document.getElementById('groupActiveCheckbox'); const saveBtnText = document.getElementById('saveGroupBtnText'); const cancelBtn = document.getElementById('cancelGroupBtn'); if (groupNameInput) groupNameInput.value = ''; if (groupActiveCheckbox) groupActiveCheckbox.checked = true; document.querySelectorAll('#permissionsChecklist .permission-checkbox').forEach(checkbox => { checkbox.checked = false; checkbox.disabled = false; checkbox.title = ''; }); if (saveBtnText) saveBtnText.textContent = 'Save'; if (cancelBtn) cancelBtn.style.display = 'none'; window.currentGroupId = null; }

  function editGroup(id) { if (typeof isAdmin === 'function' && !isAdmin()) { api.getCurrentUser().then(updatedUser => { appData.currentUser = { ...updatedUser, permissions: updatedUser.permissions || updatedUser.groupId?.permissions || [] }; if (!appData.currentUser.permissions.includes('admin')) { if (typeof showNotification === 'function') showNotification('You need admin privileges to edit groups', 'error'); return; } proceedWithEditGroup(id); }).catch(() => { if (typeof showNotification === 'function') showNotification('You need admin privileges to edit groups', 'error'); }); } else { proceedWithEditGroup(id); } }

  function proceedWithEditGroup(id) { api.getGroups().then(groupsData => { const group = groupsData.find(g => g._id === id); if (group) { window.currentGroupId = id; const groupNameInput = document.getElementById('groupNameInput'); const groupActiveCheckbox = document.getElementById('groupActiveCheckbox'); if (groupNameInput) groupNameInput.value = group.name || ''; if (groupActiveCheckbox) groupActiveCheckbox.checked = group.isActive !== false; document.querySelectorAll('#permissionsChecklist .permission-checkbox').forEach(checkbox => { const permission = checkbox.getAttribute('data-permission'); checkbox.checked = group.permissions && group.permissions.includes(permission); if (group.name && group.name.toLowerCase() === 'admin' && permission === 'admin') { checkbox.checked = true; checkbox.disabled = true; checkbox.title = 'Admin permission cannot be removed from Admin group'; } else { checkbox.disabled = false; checkbox.title = ''; } }); const saveBtnText = document.getElementById('saveGroupBtnText'); const cancelBtn = document.getElementById('cancelGroupBtn'); if (saveBtnText) saveBtnText.textContent = 'Update'; if (cancelBtn) cancelBtn.style.display = 'inline-block'; const formContainer = document.querySelector('.group-form-container'); if (formContainer) formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }).catch(error => { console.error('Error fetching group data:', error); if (typeof showNotification === 'function') showNotification('Failed to load group data: ' + error.message, 'error'); }); }

  function deleteGroup(id) { if (typeof isAdmin === 'function' && !isAdmin()) { if (typeof showNotification === 'function') showNotification('You need admin privileges to delete groups', 'error'); return; } if (confirm('Are you sure you want to delete this group? This will affect all users assigned to this group.')) { api.deleteGroup(id).then(() => { if (typeof showNotification === 'function') showNotification('Group deleted successfully!', 'success'); api.getCurrentUser().then(updatedUser => { appData.currentUser = { ...updatedUser, permissions: updatedUser.groupId?.permissions || [] }; if (typeof updateCurrentUserUI === 'function') updateCurrentUserUI(); if (typeof updateSidebarPermissions === 'function') updateSidebarPermissions(); if (typeof populateBranchSelectors === 'function') populateBranchSelectors(); loadGroups(); }).catch(() => { loadGroups(); }); }).catch(error => { console.error('Error deleting group:', error); if (typeof showNotification === 'function') showNotification('Failed to delete group: ' + error.message, 'error'); }); } }

  window.loadGroups = loadGroups;
  window.renderGroups = renderGroups;
  window.saveGroup = saveGroup;
  window.resetGroupForm = resetGroupForm;
  window.editGroup = editGroup;
  window.deleteGroup = deleteGroup;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      requestAnimationFrame(initGroupsSection);
    });
  } else {
    requestAnimationFrame(initGroupsSection);
  }
})();
