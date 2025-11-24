// Authentication module: handles login/signup UI and auth checks
// Relies on global window.api (APIService) and window.appData

function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginToggle = document.getElementById('loginToggle');
  const signupToggle = document.getElementById('signupToggle');
  const secretAccessBtn = document.getElementById('secretAccessBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  if (loginToggle) {
    loginToggle.addEventListener('click', () => switchToLogin());
  }

  if (signupToggle) {
    signupToggle.addEventListener('click', () => switchToSignup());
  }

  if (secretAccessBtn) {
    let clickCount = 0;
    let clickTimer = null;

    secretAccessBtn.addEventListener('click', () => {
      clickCount++;
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { clickCount = 0; }, 3000);
      if (clickCount >= 5) {
        unlockSignupAccess();
        clickCount = 0;
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'S') {
      event.preventDefault();
      unlockSignupAccess();
    }
  });
}

function unlockSignupAccess() {
  const signupToggle = document.getElementById('signupToggle');
  const secretAccessBtn = document.getElementById('secretAccessBtn');

  if (signupToggle) {
    signupToggle.classList.remove('d-none');
    signupToggle.style.opacity = '1';
    signupToggle.style.transition = 'opacity 0.3s ease';
  }

  if (secretAccessBtn) {
    secretAccessBtn.style.opacity = '0.8';
    secretAccessBtn.innerHTML = '<i class="fas fa-unlock"></i>';
    secretAccessBtn.title = 'Signup access unlocked';
  }

  if (typeof showNotification === 'function') {
    showNotification('Admin access unlocked! Signup option is now available.', 'success');
  }

  setTimeout(() => {
    if (signupToggle && !signupToggle.classList.contains('active')) {
      signupToggle.classList.add('d-none');
      signupToggle.style.opacity = '0';
    }
    if (secretAccessBtn) {
      secretAccessBtn.style.opacity = '0.3';
      secretAccessBtn.innerHTML = '<i class="fas fa-key"></i>';
      secretAccessBtn.title = '';
    }
  }, 10000);
}

async function handleLogin(event) {
  event.preventDefault();

  const usernameElement = document.getElementById('username');
  const passwordElement = document.getElementById('password');
  const errorElement = document.getElementById('loginError');

  if (!usernameElement || !passwordElement || !errorElement) {
    console.error('Required login elements not found');
    return;
  }

  const username = usernameElement.value.trim();
  const password = passwordElement.value;

  if (!username || username.length < 3) {
    errorElement.textContent = 'Username must be at least 3 characters long';
    errorElement.classList.remove('d-none');
    return;
  }
  if (!password || password.length < 6) {
    errorElement.textContent = 'Password must be at least 6 characters long';
    errorElement.classList.remove('d-none');
    return;
  }

  try {
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    const response = await window.api.login({ username, password });

    window.appData.currentUser = {
      ...response.user,
      permissions: response.user.permissions || response.user.groupId?.permissions || []
    };

    showMainApp();
    
    // Load initial data first, then show dashboard
    if (typeof loadInitialData === 'function') {
      loadInitialData();
    }
    
    // Set URL hash to dashboard immediately
    if (window.location.hash !== '#dashboard') {
      window.history.replaceState(null, null, '#dashboard');
    }
    
    // Wait for main app to be visible before showing dashboard
    setTimeout(() => {
      // Show dashboard section after login - ensure it's the main page
      if (typeof showSection === 'function') {
        showSection('dashboard');
      } else {
        // Fallback: manually show dashboard section
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
          // Hide all sections first
          document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
            section.style.visibility = 'hidden';
            section.style.opacity = '0';
          });
          // Show dashboard
          dashboardSection.classList.add('active');
          dashboardSection.style.display = 'block';
          dashboardSection.style.visibility = 'visible';
          dashboardSection.style.opacity = '1';
        }
      }
      
      // Update active state in sidebar
      setTimeout(() => {
        document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
        const dashboardLink = document.querySelector('.sidebar .nav-link[data-section="dashboard"]');
        if (dashboardLink) {
          dashboardLink.classList.add('active');
        }
        
        // Activate warehouse dashboard tab after a delay
        setTimeout(() => {
          const warehouseTab = document.getElementById('warehouse-dashboard-tab');
          if (warehouseTab && typeof window.bootstrap !== 'undefined') {
            try {
              const tab = new window.bootstrap.Tab(warehouseTab);
              tab.show();
            } catch (e) {
              console.warn('Could not show warehouse tab:', e);
            }
          }
        }, 300);
      }, 100);
      
      // Ensure dashboard loads even if initial data doesn't trigger it
      setTimeout(() => {
        const dashboardSection = document.getElementById('dashboard-section');
        if (!dashboardSection || !dashboardSection.classList.contains('active')) {
          // Dashboard not shown yet, show it
          if (typeof showSection === 'function') {
            showSection('dashboard');
          } else if (dashboardSection) {
            dashboardSection.classList.add('active');
            dashboardSection.style.display = 'block';
            dashboardSection.style.visibility = 'visible';
            dashboardSection.style.opacity = '1';
          }
        }
        
        // Load dashboard data if not already loading
        if (typeof loadDashboard === 'function') {
          const dashboardContainer = document.getElementById('warehouseBranchCardsContainer');
          if (!dashboardContainer || dashboardContainer.innerHTML.trim() === '') {
            loadDashboard(null, 'warehouse');
          }
        }
      }, 500);
    }, 200);
    
    errorElement.classList.add('d-none');
  } catch (error) {
    console.error('Login error:', error);
    const errorElement = document.getElementById('loginError');
    errorElement.textContent = error.message || 'Login failed. Please check your credentials.';
    errorElement.classList.remove('d-none');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Login';
    submitBtn.disabled = false;
  }
}

async function handleSignup(event) {
  event.preventDefault();

  const usernameElement = document.getElementById('signupUsername');
  const fullNameElement = document.getElementById('signupFullName');
  const emailElement = document.getElementById('signupEmail');
  const passwordElement = document.getElementById('signupPassword');
  const confirmPasswordElement = document.getElementById('signupConfirmPassword');
  const adminPasswordElement = document.getElementById('adminPassword');
  const errorElement = document.getElementById('signupError');

  if (!usernameElement || !fullNameElement || !emailElement || !passwordElement ||
      !confirmPasswordElement || !adminPasswordElement || !errorElement) {
    console.error('Required signup elements not found');
    return;
  }

  const username = usernameElement.value.trim();
  const fullName = fullNameElement.value.trim();
  const email = emailElement.value.trim();
  const password = passwordElement.value;
  const confirmPassword = confirmPasswordElement.value;
  const adminPassword = adminPasswordElement.value;

  if (!username || username.length < 3) {
    errorElement.textContent = 'Username must be at least 3 characters long';
    errorElement.classList.remove('d-none');
    return;
  }
  if (!fullName || fullName.length < 2) {
    errorElement.textContent = 'Full name must be at least 2 characters long';
    errorElement.classList.remove('d-none');
    return;
  }
  if (!email || !email.includes('@')) {
    errorElement.textContent = 'Please enter a valid email address';
    errorElement.classList.remove('d-none');
    return;
  }
  if (!password || password.length < 6) {
    errorElement.textContent = 'Password must be at least 6 characters long';
    errorElement.classList.remove('d-none');
    return;
  }
  if (password !== confirmPassword) {
    errorElement.textContent = 'Passwords do not match';
    errorElement.classList.remove('d-none');
    return;
  }

  const expectedAdminPassword = 'admin123';
  if (adminPassword !== expectedAdminPassword) {
    errorElement.textContent = 'Invalid admin access code. Access denied.';
    errorElement.classList.remove('d-none');
    return;
  }

  try {
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;

    const response = await window.api.signup({
      username,
      fullName,
      email,
      password,
      confirmPassword
    });

    window.appData.currentUser = {
      ...response.user,
      permissions: response.user.permissions || response.user.groupId?.permissions || []
    };

    showMainApp();
    
    // Show dashboard section after signup
    if (typeof showSection === 'function') {
      showSection('dashboard');
      // Update active state in sidebar
      setTimeout(() => {
        document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
        const dashboardLink = document.querySelector('.sidebar .nav-link[data-section="dashboard"]');
        if (dashboardLink) dashboardLink.classList.add('active');
        
        // Activate warehouse dashboard tab
        const warehouseTab = document.getElementById('warehouse-dashboard-tab');
        if (warehouseTab && typeof window.bootstrap !== 'undefined') {
          const tab = new window.bootstrap.Tab(warehouseTab);
          tab.show();
        }
      }, 100);
    }
    
    if (typeof loadInitialData === 'function') loadInitialData();
    errorElement.classList.add('d-none');
    if (typeof showNotification === 'function') {
      showNotification('Account created successfully with admin privileges! Welcome to D.Watson Pharmacy Dashboard.');
    }
  } catch (error) {
    console.error('Signup error:', error);
    errorElement.textContent = error.message || 'Signup failed. Please try again.';
    errorElement.classList.remove('d-none');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Sign Up';
    submitBtn.disabled = false;
  }
}

function switchToLogin() {
  document.getElementById('loginForm').classList.remove('d-none');
  document.getElementById('signupForm').classList.add('d-none');
  document.getElementById('loginToggle').classList.add('active');
  document.getElementById('signupToggle').classList.remove('active');
  document.getElementById('loginError').classList.add('d-none');
  document.getElementById('signupError').classList.add('d-none');
}

function switchToSignup() {
  document.getElementById('loginForm').classList.add('d-none');
  document.getElementById('signupForm').classList.remove('d-none');
  document.getElementById('loginToggle').classList.remove('active');
  document.getElementById('signupToggle').classList.add('active');
  document.getElementById('loginError').classList.add('d-none');
  document.getElementById('signupError').classList.add('d-none');
}

function showLoginSection() {
  const loginSection = document.getElementById('loginSection');
  const mainApp = document.getElementById('mainApp');
  if (loginSection) loginSection.style.display = 'flex';
  if (mainApp) mainApp.style.display = 'none';

  try {
    const url = (typeof window.LOGIN_LOGO_URL === 'string' && window.LOGIN_LOGO_URL.trim()) ? window.LOGIN_LOGO_URL.trim() : 'assets/dw-logo.png';
    document.querySelectorAll('.login-logo-inline').forEach(img => { try { img.src = url; img.style.display = ''; } catch(e) {} });
    const savedCompanyName = localStorage.getItem('appCompanyName');
    if (savedCompanyName) {
      document.querySelectorAll('.company-name').forEach(el => { el.textContent = savedCompanyName; });
    }
  } catch(e) {}
}

function showMainApp() {
  const loginSection = document.getElementById('loginSection');
  const mainApp = document.getElementById('mainApp');
  if (loginSection) loginSection.style.display = 'none';
  if (mainApp) mainApp.style.display = 'block';
  if (typeof startInactivityWatch === 'function') startInactivityWatch();
  setTimeout(() => {
    if (typeof setDefaultDates === 'function') setDefaultDates();
  }, 100);
}

// Initialize display state based on token presence to prevent login flash
function initializeDisplayState() {
  const token = localStorage.getItem('authToken');
  const loginSection = document.getElementById('loginSection');
  const mainApp = document.getElementById('mainApp');
  
  if (token) {
    // Token exists - show main app immediately to prevent login flash
    if (loginSection) loginSection.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
  } else {
    // No token - show login
    if (loginSection) loginSection.style.display = 'flex';
    if (mainApp) mainApp.style.display = 'none';
  }
}

let retryCount = 0;
const maxRetries = 5;
const baseDelay = 8000; // 8 seconds
async function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function checkAuthStatus(retryAttempt = 0) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) { 
      showLoginSection(); 
      return; 
    }
    window.api.setToken(token);
    
    // Keep main app visible during auth check to prevent login flash
    const loginSection = document.getElementById('loginSection');
    const mainApp = document.getElementById('mainApp');
    if (loginSection) loginSection.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';

    let user;
    try {
      user = await window.api.getCurrentUser();
      retryCount = 0;
    } catch (error) {
      if (error.message && error.message.includes('Too many requests')) {
        if (retryAttempt < maxRetries) {
          const delayTime = baseDelay * Math.pow(2, retryAttempt);
          await delay(delayTime);
          return checkAuthStatus(retryAttempt + 1);
        } else {
          showMainApp();
          if (typeof loadDashboard === 'function') {
            const monthFilter = document.getElementById('dashboardMonthFilter');
            const selectedMonth = monthFilter ? monthFilter.value : null;
            loadDashboard(selectedMonth || null);
          }
          return;
        }
      }

      if (error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('500') ||
          error.message.includes('503')) {
        showMainApp();
        return;
      }
      throw error;
    }

    window.appData.currentUser = { ...user, permissions: user.groupId?.permissions || [] };
    showMainApp();
    if (typeof loadInitialData === 'function') loadInitialData();

    // Determine which section to show - ALWAYS prioritize URL hash first (most reliable for page refresh)
    let sectionToShow = null;
    
    // Priority 1: Check URL hash FIRST (this is what's in the browser address bar)
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && hash !== '' && hash !== 'null' && hash !== 'undefined') {
      sectionToShow = hash;
      console.log('🔍 Restoring section from URL hash:', sectionToShow);
    }
    
    // Priority 2: Only check localStorage if no hash exists
    if (!sectionToShow) {
      try {
        const lastActiveSection = localStorage.getItem('lastActiveSection');
        if (lastActiveSection && lastActiveSection !== 'null' && lastActiveSection !== 'undefined' && lastActiveSection !== '') {
          sectionToShow = lastActiveSection;
          console.log('🔍 Restoring section from localStorage:', sectionToShow);
        }
      } catch (e) {
        console.warn('Could not read last active section from localStorage:', e);
      }
    }

    if (sectionToShow && sectionToShow !== '') {
      setTimeout(() => {
        const section = sectionToShow;
        const permissions = user.groupId?.permissions || [];
        let hasPermission = false;
        if (['groups', 'users', 'settings'].includes(section)) {
          hasPermission = permissions.includes('admin');
        } else {
          hasPermission = permissions.includes(section) || permissions.includes('admin');
        }
        if (hasPermission) {
          // Update URL hash to match the section being shown
          if (window.location.hash !== '#' + section) {
            window.history.replaceState(null, null, '#' + section);
          }
          
          if (typeof showSection === 'function') showSection(section);
          document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
          const activeLink = document.querySelector(`.sidebar .nav-link[data-section="${section}"]`);
          if (activeLink) activeLink.classList.add('active');
          
          // Restore report tab if reports section is being shown
          if (section === 'reports' && typeof window.switchReportTab === 'function') {
            try {
              const lastActiveReportTab = localStorage.getItem('lastActiveReportTab');
              if (lastActiveReportTab && lastActiveReportTab !== 'null' && lastActiveReportTab !== 'undefined') {
                setTimeout(() => {
                  window.switchReportTab(lastActiveReportTab);
                }, 200);
              } else {
                // Default to sales-report if no saved tab
                setTimeout(() => {
                  window.switchReportTab('sales-report');
                }, 200);
              }
            } catch (e) {
              console.warn('Could not restore report tab:', e);
            }
          }
        } else {
          // Set URL hash to dashboard when no permission for requested section
          if (window.location.hash !== '#dashboard') {
            window.history.replaceState(null, null, '#dashboard');
          }
          
          // Show dashboard section if no permission for requested section
          if (typeof showSection === 'function') {
            showSection('dashboard');
            document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
            const dashboardLink = document.querySelector('.sidebar .nav-link[data-section="dashboard"]');
            if (dashboardLink) dashboardLink.classList.add('active');
            // Activate warehouse dashboard tab
            setTimeout(() => {
              const warehouseTab = document.getElementById('warehouse-dashboard-tab');
              if (warehouseTab && typeof window.bootstrap !== 'undefined') {
                try {
                  const tab = new window.bootstrap.Tab(warehouseTab);
                  tab.show();
                } catch (e) {
                  console.warn('Could not show warehouse tab:', e);
                }
              }
            }, 150);
          }
          if (typeof loadDashboard === 'function') {
            const monthFilter = document.getElementById('warehouseDashboardMonthFilter');
            const selectedMonth = monthFilter ? monthFilter.value : null;
            loadDashboard(selectedMonth || null, 'warehouse');
          }
        }
      }, 100);
    } else {
      // No section from hash or localStorage - check URL hash again (might have been missed)
      // This should rarely happen, but double-check URL hash before defaulting to dashboard
      const currentHash = window.location.hash.replace('#', '').trim();
      if (currentHash && currentHash !== '' && currentHash !== 'null' && currentHash !== 'undefined') {
        // Found hash - restore it
        setTimeout(() => {
          const section = currentHash;
          const permissions = user.groupId?.permissions || [];
          let hasPermission = false;
          if (['groups', 'users', 'settings'].includes(section)) {
            hasPermission = permissions.includes('admin');
          } else {
            hasPermission = permissions.includes(section) || permissions.includes('admin');
          }
          if (hasPermission) {
            console.log('✅ Restoring section from URL hash (else block):', section);
            if (typeof showSection === 'function') showSection(section);
            document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
            const activeLink = document.querySelector(`.sidebar .nav-link[data-section="${section}"]`);
            if (activeLink) activeLink.classList.add('active');
            
            // Restore report tab if reports section
            if (section === 'reports' && typeof window.switchReportTab === 'function') {
              try {
                const lastActiveReportTab = localStorage.getItem('lastActiveReportTab');
                if (lastActiveReportTab && lastActiveReportTab !== 'null' && lastActiveReportTab !== 'undefined') {
                  setTimeout(() => {
                    window.switchReportTab(lastActiveReportTab);
                  }, 200);
                } else {
                  setTimeout(() => {
                    window.switchReportTab('sales-report');
                  }, 200);
                }
              } catch (e) {
                console.warn('Could not restore report tab:', e);
              }
            }
          } else {
            // No permission - try localStorage before dashboard
            try {
              const lastActiveSection = localStorage.getItem('lastActiveSection');
              if (lastActiveSection && lastActiveSection !== 'null' && lastActiveSection !== 'undefined' && lastActiveSection !== '') {
                const permissions = user.groupId?.permissions || [];
                let hasPermissionForSaved = false;
                if (['groups', 'users', 'settings'].includes(lastActiveSection)) {
                  hasPermissionForSaved = permissions.includes('admin');
                } else {
                  hasPermissionForSaved = permissions.includes(lastActiveSection) || permissions.includes('admin');
                }
                if (hasPermissionForSaved) {
                  if (window.location.hash !== '#' + lastActiveSection) {
                    window.history.replaceState(null, null, '#' + lastActiveSection);
                  }
                  setTimeout(() => {
                    console.log('✅ Restoring saved section (no permission for hash):', lastActiveSection);
                    if (typeof showSection === 'function') showSection(lastActiveSection);
                    document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
                    const activeLink = document.querySelector(`.sidebar .nav-link[data-section="${lastActiveSection}"]`);
                    if (activeLink) activeLink.classList.add('active');
                  }, 100);
                  return;
                }
              }
            } catch (e) {
              console.warn('Could not check saved section:', e);
            }
            
            // Only show dashboard if no permission AND no saved section
            console.log('⚠️ No permission for hash section, defaulting to dashboard');
            if (window.location.hash !== '#dashboard') {
              window.history.replaceState(null, null, '#dashboard');
            }
            if (typeof showSection === 'function') {
              showSection('dashboard');
              document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
              const dashboardLink = document.querySelector('.sidebar .nav-link[data-section="dashboard"]');
              if (dashboardLink) dashboardLink.classList.add('active');
              setTimeout(() => {
                const warehouseTab = document.getElementById('warehouse-dashboard-tab');
                if (warehouseTab && typeof window.bootstrap !== 'undefined') {
                  try {
                    const tab = new window.bootstrap.Tab(warehouseTab);
                    tab.show();
                  } catch (e) {
                    console.warn('Could not show warehouse tab:', e);
                  }
                }
              }, 150);
            }
            if (typeof loadDashboard === 'function') {
              const monthFilter = document.getElementById('warehouseDashboardMonthFilter');
              const selectedMonth = monthFilter ? monthFilter.value : null;
              loadDashboard(selectedMonth || null, 'warehouse');
            }
          }
        }, 100);
        return; // Exit early - hash found
      }
      
      // No hash at all - check localStorage before defaulting to dashboard
      try {
        const lastActiveSection = localStorage.getItem('lastActiveSection');
        if (lastActiveSection && lastActiveSection !== 'null' && lastActiveSection !== 'undefined' && lastActiveSection !== '') {
          const permissions = user.groupId?.permissions || [];
          let hasPermission = false;
          if (['groups', 'users', 'settings'].includes(lastActiveSection)) {
            hasPermission = permissions.includes('admin');
          } else {
            hasPermission = permissions.includes(lastActiveSection) || permissions.includes('admin');
          }
          if (hasPermission) {
            // Update URL hash to match the section being restored
            if (window.location.hash !== '#' + lastActiveSection) {
              window.history.replaceState(null, null, '#' + lastActiveSection);
            }
            
            setTimeout(() => {
              console.log('✅ Restoring section from localStorage (else block):', lastActiveSection);
              if (typeof showSection === 'function') showSection(lastActiveSection);
              document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
              const activeLink = document.querySelector(`.sidebar .nav-link[data-section="${lastActiveSection}"]`);
              if (activeLink) activeLink.classList.add('active');
              
              // Restore report tab if reports section
              if (lastActiveSection === 'reports' && typeof window.switchReportTab === 'function') {
                try {
                  const lastActiveReportTab = localStorage.getItem('lastActiveReportTab');
                  if (lastActiveReportTab && lastActiveReportTab !== 'null' && lastActiveReportTab !== 'undefined') {
                    setTimeout(() => {
                      window.switchReportTab(lastActiveReportTab);
                    }, 200);
                  } else {
                    setTimeout(() => {
                      window.switchReportTab('sales-report');
                    }, 200);
                  }
                } catch (e) {
                  console.warn('Could not restore report tab:', e);
                }
              }
            }, 100);
            return; // Exit early - section restored
          }
        }
      } catch (e) {
        console.warn('Could not check saved section:', e);
      }
      
      // Only show dashboard if truly no section to restore (no hash AND no saved section)
      console.log('📊 No section to restore, defaulting to dashboard');
      if (!window.location.hash || window.location.hash === '' || window.location.hash === '#') {
        window.history.replaceState(null, null, '#dashboard');
      }
      if (typeof showSection === 'function') {
        showSection('dashboard');
        document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
        const dashboardLink = document.querySelector('.sidebar .nav-link[data-section="dashboard"]');
        if (dashboardLink) dashboardLink.classList.add('active');
        setTimeout(() => {
          const warehouseTab = document.getElementById('warehouse-dashboard-tab');
          if (warehouseTab && typeof window.bootstrap !== 'undefined') {
            try {
              const tab = new window.bootstrap.Tab(warehouseTab);
              tab.show();
            } catch (e) {
              console.warn('Could not show warehouse tab:', e);
            }
          }
        }, 150);
      }
      if (typeof loadDashboard === 'function') {
        const monthFilter = document.getElementById('warehouseDashboardMonthFilter');
        const selectedMonth = monthFilter ? monthFilter.value : null;
        loadDashboard(selectedMonth || null, 'warehouse');
      }
    }
  } catch (error) {
    console.error('Authentication check failed:', error);
    if (error.message.includes('401') || error.message.includes('403') ||
        error.message.includes('Authentication failed') || error.message.includes('Invalid token')) {
      window.api.clearToken();
      showLoginSection();
    } else {
      showMainApp();
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== '') {
        setTimeout(() => {
          const section = hash;
          const permissions = window.appData.currentUser?.permissions || [];
          let hasPermission = false;
          if (['groups', 'users', 'settings'].includes(section)) {
            hasPermission = permissions.includes('admin');
          } else {
            hasPermission = permissions.includes(section) || permissions.includes('admin');
          }
          if (hasPermission) {
          if (typeof showSection === 'function') showSection(section);
          document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
          const activeLink = document.querySelector(`.sidebar .nav-link[data-section="${section}"]`);
          if (activeLink) activeLink.classList.add('active');
        } else {
          // Set URL hash to dashboard when no permission for requested section
          if (window.location.hash !== '#dashboard') {
            window.history.replaceState(null, null, '#dashboard');
          }
          
          // Show dashboard section if no permission for requested section
          if (typeof showSection === 'function') {
            showSection('dashboard');
            document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
            const dashboardLink = document.querySelector('.sidebar .nav-link[data-section="dashboard"]');
            if (dashboardLink) dashboardLink.classList.add('active');
            // Activate warehouse dashboard tab
            setTimeout(() => {
              const warehouseTab = document.getElementById('warehouse-dashboard-tab');
              if (warehouseTab && typeof window.bootstrap !== 'undefined') {
                try {
                  const tab = new window.bootstrap.Tab(warehouseTab);
                  tab.show();
                } catch (e) {
                  console.warn('Could not show warehouse tab:', e);
                }
              }
            }, 150);
          }
          if (typeof loadDashboard === 'function') loadDashboard(null, 'warehouse');
        }
      }, 100);
    } else {
      // Set URL hash to dashboard when no hash (default view after login)
      if (!window.location.hash || window.location.hash === '' || window.location.hash === '#') {
        window.history.replaceState(null, null, '#dashboard');
      }
      
      // Show dashboard section when no hash (default view after login)
      if (typeof showSection === 'function') {
        showSection('dashboard');
        document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
        const dashboardLink = document.querySelector('.sidebar .nav-link[data-section="dashboard"]');
        if (dashboardLink) dashboardLink.classList.add('active');
        // Activate warehouse dashboard tab
        setTimeout(() => {
          const warehouseTab = document.getElementById('warehouse-dashboard-tab');
          if (warehouseTab && typeof window.bootstrap !== 'undefined') {
            try {
              const tab = new window.bootstrap.Tab(warehouseTab);
              tab.show();
            } catch (e) {
              console.warn('Could not show warehouse tab:', e);
            }
          }
        }, 150);
      }
      if (typeof loadDashboard === 'function') loadDashboard(null, 'warehouse');
    }
    }
  }
}

// Expose to global for existing inline script usage
window.setupLoginForm = setupLoginForm;
window.unlockSignupAccess = unlockSignupAccess;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.switchToLogin = switchToLogin;
window.switchToSignup = switchToSignup;
window.showLoginSection = showLoginSection;
window.showMainApp = showMainApp;
window.checkAuthStatus = checkAuthStatus;

export { setupLoginForm, unlockSignupAccess, handleLogin, handleSignup, switchToLogin, switchToSignup, showLoginSection, showMainApp, checkAuthStatus };
