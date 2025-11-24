;(function() {
  function initUsersSection() {
    const addBtn = document.getElementById('addUserBtn');
    if (addBtn) {
      const newBtn = addBtn.cloneNode(true);
      addBtn.parentNode.replaceChild(newBtn, addBtn);
      newBtn.addEventListener('click', function() {
        if (typeof window.isAdmin === 'function' && !window.isAdmin()) {
          if (typeof window.showNotification === 'function') {
            window.showNotification('You need admin privileges to create users', 'error');
          }
          return;
        }

        const form = document.getElementById('userForm');
        if (form) form.reset();

        const saveBtn = document.getElementById('saveUserBtn');
        if (saveBtn) {
          saveBtn.textContent = 'Save User';
          saveBtn.onclick = null;
          saveBtn.removeAttribute('onclick');
          saveBtn.onclick = function() {
            const formEl = document.getElementById('userForm');
            if (formEl && formEl.checkValidity()) {
              if (typeof window.saveUser === 'function') {
                window.saveUser();
              } else if (typeof saveUser === 'function') {
                saveUser();
              }
            } else if (formEl) {
              formEl.reportValidity();
            }
          };
        }

        if (typeof window.populateGroupSelectorInUserModal === 'function') {
          window.populateGroupSelectorInUserModal();
        }
        if (typeof window.populateBranchSelectorInUserModal === 'function') {
          window.populateBranchSelectorInUserModal();
        }

        const modalEl = document.getElementById('addUserModal');
        if (modalEl && window.bootstrap && typeof window.bootstrap.Modal === 'function') {
          const modal = new window.bootstrap.Modal(modalEl);
          modal.show();
        }
      });
    }

    if (typeof window.loadUsers === 'function') {
      window.loadUsers();
    } else if (typeof loadUsers === 'function') {
      loadUsers();
    }
  }

  function loadUsers() {
    if (typeof ensureSectionViewLoaded === 'function') ensureSectionViewLoaded('users');
    if (typeof isAdmin === 'function' && !isAdmin()) { const banner = document.getElementById('permission-denied-banner-users'); if (banner) banner.classList.remove('d-none'); return; }
    const bannerOk = document.getElementById('permission-denied-banner-users'); if (bannerOk) bannerOk.classList.add('d-none');
    const tableBody = document.getElementById('usersTableBody'); if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Loading users...</td></tr>';
    const loadUsersData = async () => { if (typeof isAdmin === 'function' && !isAdmin()) return; try { if (!appData.groups || appData.groups.length === 0) { const groupsData = await api.getGroups(); appData.groups = groupsData; } if (!appData.branches || appData.branches.length === 0) { const branchesData = await api.getBranches(); appData.branches = branchesData; } const usersData = await api.getUsers(); appData.users = usersData; renderUsers(usersData); } catch (error) { console.error('Error loading users:', error); if (typeof showNotification === 'function') showNotification('Failed to load users: ' + error.message, 'error'); } };
    loadUsersData();
  }

  function renderUsers(usersData) {
    const cardContainer = document.getElementById('usersContainer'); const currentUserId = appData.currentUser ? appData.currentUser._id : null; if (cardContainer) { cardContainer.innerHTML = ''; usersData.forEach(user => { const card = document.createElement('div'); card.className = 'col-12 col-md-6 col-lg-4 mb-3'; let groupName = 'None'; if (user.groupId) { if (typeof user.groupId === 'object' && user.groupId.name) groupName = user.groupId.name; else { const userGroup = appData.groups.find(g => g._id === user.groupId); groupName = userGroup ? userGroup.name : 'None'; } } let branchNames = 'None'; if (user.branches && user.branches.length > 0) { branchNames = user.branches.map(branchId => { const branch = appData.branches.find(b => b._id === branchId); return branch ? branch.name : 'Unknown'; }).join(', '); } card.innerHTML = '<div class="card"><div class="card-body"><div class="user-info"><div class="user-avatar">' + (user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()) + '</div><div class="user-details"><h5>' + (user.fullName || user.username) + '</h5><p>' + user.email + '</p></div></div><div class="mb-2"><small class="text-muted">Group:</small><div>' + groupName + '</div></div><div class="mb-3"><small class="text-muted">Assigned Branches:</small><div>' + branchNames + '</div></div><div class="d-flex justify-content-between"><button class="btn btn-sm btn-outline-primary" onclick="editUser(\'' + user._id + '\')"><i class="fas fa-edit"></i> Edit</button>' + (currentUserId && user._id === currentUserId ? '<button class="btn btn-sm btn-outline-secondary" disabled title="You cannot delete your own account"><i class="fas fa-trash"></i> Delete</button>' : '<button class="btn btn-sm btn-outline-danger" onclick="deleteUser(\'' + user._id + '\')"><i class="fas fa-trash"></i> Delete</button>') + '</div></div></div>'; cardContainer.appendChild(card); }); }
    const tableBody = document.getElementById('usersTableBody'); if (!tableBody) return; tableBody.innerHTML = '';
    usersData.forEach(user => { const row = document.createElement('tr'); const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'; const status = user.isActive ? 'Active' : 'Inactive'; const statusClass = user.isActive ? 'success' : 'secondary'; let groupName = 'None'; if (user.groupId) { if (typeof user.groupId === 'object' && user.groupId.name) groupName = user.groupId.name; else { const userGroup = appData.groups.find(g => g._id === user.groupId); groupName = userGroup ? userGroup.name : 'None'; } } row.innerHTML = '<td><strong>' + user.username + '</strong></td><td>' + (user.fullName || 'N/A') + '</td><td>' + user.email + '</td><td><span class="badge bg-primary">' + groupName + '</span></td><td><span class="badge bg-' + statusClass + '">' + status + '</span></td><td>' + lastLogin + '</td><td><button class="btn btn-sm btn-outline-primary me-2" onclick="editUser(\'' + user._id + '\')"><i class="fas fa-edit"></i> Edit</button>' + (currentUserId && user._id === currentUserId ? '<button class="btn btn-sm btn-outline-secondary" disabled title="You cannot delete your own account"><i class="fas fa-trash"></i> Delete</button>' : '<button class="btn btn-sm btn-outline-danger" onclick="deleteUser(\'' + user._id + '\')"><i class="fas fa-trash"></i> Delete</button>') + '</td>'; tableBody.appendChild(row); });
  }

  function saveUser() {
    if (typeof isAdmin === 'function' && !isAdmin()) { if (typeof showNotification === 'function') showNotification('You need admin privileges to create users', 'error'); return; }
    const branches = []; document.querySelectorAll('#userBranchesSelector input[type="checkbox"]:checked').forEach(c => branches.push(c.value)); const groupId = document.getElementById('userGroup').value; const username = document.getElementById('userName').value.trim(); const fullName = document.getElementById('userFullName').value.trim(); const email = document.getElementById('userEmail').value.trim(); const password = document.getElementById('userPassword').value; if (!username || !fullName || !email || !password || !groupId) { if (typeof showNotification === 'function') showNotification('Please fill in all required fields', 'error'); return; } const userData = { username, fullName, email, password, groupId, branches };
    api.createUser(userData).then(user => { if (window.bootstrap) window.bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide(); document.getElementById('userForm').reset(); document.querySelectorAll('#userBranchesSelector input[type="checkbox"]').forEach(c => { c.checked = false; }); if (typeof showNotification === 'function') showNotification('User saved successfully!', 'success'); Promise.all([api.getGroups(), api.getBranches()]).then(([groupsData, branchesData]) => { appData.groups = groupsData; appData.branches = branchesData; loadUsers(); }).catch(() => { loadUsers(); }); }).catch(error => { console.error('Error saving user:', error); if (typeof showNotification === 'function') showNotification('Failed to save user: ' + error.message, 'error'); });
  }

  function editUser(id) {
    if (typeof isAdmin === 'function' && !isAdmin()) { if (typeof showNotification === 'function') showNotification('You need admin privileges to edit users', 'error'); return; }
    api.getUsers().then(usersData => { const user = usersData.find(u => u._id === id); if (user) { document.getElementById('userName').value = user.username; document.getElementById('userFullName').value = user.fullName || ''; document.getElementById('userEmail').value = user.email || ''; document.getElementById('userPassword').value = ''; let groupIdValue = ''; if (user.groupId) { if (typeof user.groupId === 'object' && user.groupId._id) groupIdValue = user.groupId._id; else groupIdValue = user.groupId; } document.getElementById('userGroup').value = groupIdValue; populateBranchSelectorInUserModal(); setTimeout(() => { document.querySelectorAll('#userBranchesSelector input[type="checkbox"]').forEach(checkbox => { checkbox.checked = user.branches && user.branches.includes(checkbox.value); }); }, 100); const saveBtn = document.getElementById('saveUserBtn'); if (saveBtn) { saveBtn.textContent = 'Update User'; saveBtn.onclick = function() { const formEl = document.getElementById('userForm'); if (formEl && formEl.checkValidity()) updateUser(id); else formEl.reportValidity(); }; } if (window.bootstrap) { const modal = new window.bootstrap.Modal(document.getElementById('addUserModal')); modal.show(); } } }).catch(error => { console.error('Error fetching user data:', error); if (typeof showNotification === 'function') showNotification('Failed to load user data: ' + error.message, 'error'); });
  }

  function updateUser(id) {
    if (typeof isAdmin === 'function' && !isAdmin()) { if (typeof showNotification === 'function') showNotification('You need admin privileges to update users', 'error'); return; }
    const branches = []; document.querySelectorAll('#userBranchesSelector input[type="checkbox"]:checked').forEach(c => branches.push(c.value)); const groupId = document.getElementById('userGroup').value; const username = document.getElementById('userName').value.trim(); const fullName = document.getElementById('userFullName').value.trim(); const email = document.getElementById('userEmail').value.trim(); if (!username || !fullName || !email || !groupId) { if (typeof showNotification === 'function') showNotification('Please fill in all required fields', 'error'); return; } const userData = { username, fullName, email, groupId, branches }; const password = document.getElementById('userPassword').value; if (password) userData.password = password;
    api.updateUser(id, userData).then(() => { if (window.bootstrap) window.bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide(); document.getElementById('userForm').reset(); document.querySelectorAll('#userBranchesSelector input[type="checkbox"]').forEach(c => { c.checked = false; }); const saveBtn = document.getElementById('saveUserBtn'); if (saveBtn) { saveBtn.textContent = 'Save User'; saveBtn.onclick = saveUser; } if (typeof showNotification === 'function') showNotification('User updated successfully!', 'success'); Promise.all([api.getGroups(), api.getBranches()]).then(([groupsData, branchesData]) => { appData.groups = groupsData; appData.branches = branchesData; loadUsers(); if (appData.currentUser && appData.currentUser._id === id) { appData.currentUser = { ...appData.currentUser, ...userData, permissions: userData.groupId?.permissions || appData.currentUser.permissions }; if (typeof updateCurrentUserUI === 'function') updateCurrentUserUI(); if (typeof updateSidebarPermissions === 'function') updateSidebarPermissions(); if (typeof populateBranchSelectors === 'function') populateBranchSelectors(); } }).catch(() => { loadUsers(); if (appData.currentUser && appData.currentUser._id === id) { appData.currentUser = { ...appData.currentUser, ...userData, permissions: userData.groupId?.permissions || appData.currentUser.permissions }; if (typeof updateCurrentUserUI === 'function') updateCurrentUserUI(); if (typeof updateSidebarPermissions === 'function') updateSidebarPermissions(); if (typeof populateBranchSelectors === 'function') populateBranchSelectors(); } }); }).catch(error => { console.error('Error updating user:', error); if (typeof showNotification === 'function') showNotification('Failed to update user: ' + error.message, 'error'); });
  }

  function deleteUser(id) {
    if (typeof isAdmin === 'function' && !isAdmin()) { if (typeof showNotification === 'function') showNotification('You need admin privileges to delete users', 'error'); return; }
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) { api.deleteUser(id).then(() => { if (typeof showNotification === 'function') showNotification('User deleted successfully!', 'success'); loadUsers(); }).catch(error => { console.error('Error deleting user:', error); if (typeof showNotification === 'function') showNotification('Failed to delete user: ' + error.message, 'error'); }); }
  }

  async function promoteUserToAdmin() {
    const username = document.getElementById('promoteUsername').value.trim(); const adminPassword = document.getElementById('confirmAdminPassword').value; const errorElement = document.getElementById('promoteUserError');
    try { const submitBtn = document.getElementById('confirmPromoteBtn'); const originalText = submitBtn.innerHTML; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Promoting...'; submitBtn.disabled = true; const userInfo = await api.getUserByUsername(username); const response = await api.promoteUser(username, adminPassword); if (window.bootstrap) window.bootstrap.Modal.getInstance(document.getElementById('promoteUserModal')).hide(); document.getElementById('promoteUserForm').reset(); errorElement.classList.add('d-none'); if (typeof showNotification === 'function') showNotification('User "' + username + '" has been successfully promoted to admin!', 'success'); loadUsers(); } catch (error) { console.error('Error promoting user:', error); errorElement.textContent = error.message || 'Failed to promote user. Please check the username and admin password.'; errorElement.classList.remove('d-none'); const submitBtn = document.getElementById('confirmPromoteBtn'); submitBtn.innerHTML = '<i class="fas fa-crown me-2"></i>Promote to Admin'; submitBtn.disabled = false; }
  }

  function populateGroupSelectorInUserModal() { const selector = document.getElementById('userGroup'); if (selector) { const firstOption = selector.options[0]; selector.innerHTML = ''; if (firstOption) selector.appendChild(firstOption); appData.groups.forEach(group => { const option = document.createElement('option'); option.value = group._id; option.textContent = group.name; selector.appendChild(option); }); } }

  function populateBranchSelectorInUserModal() { const container = document.getElementById('userBranchesSelector'); if (container) { container.innerHTML = ''; appData.branches.forEach(branch => { const branchItem = document.createElement('div'); branchItem.className = 'branch-item'; const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = 'branch-' + branch._id; checkbox.value = branch._id; const label = document.createElement('label'); label.htmlFor = 'branch-' + branch._id; label.textContent = branch.name; branchItem.appendChild(checkbox); branchItem.appendChild(label); container.appendChild(branchItem); }); } }

  window.loadUsers = loadUsers;
  window.renderUsers = renderUsers;
  window.saveUser = saveUser;
  window.editUser = editUser;
  window.updateUser = updateUser;
  window.deleteUser = deleteUser;
  window.promoteUserToAdmin = promoteUserToAdmin;
  window.populateGroupSelectorInUserModal = populateGroupSelectorInUserModal;
  window.populateBranchSelectorInUserModal = populateBranchSelectorInUserModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      requestAnimationFrame(initUsersSection);
    });
  } else {
    requestAnimationFrame(initUsersSection);
  }
})();
