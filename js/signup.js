// SkillToBill Signup/Login Script

// ========== GLOBAL TOAST HELPER ==========
function showToast(type = 'info', message = '') {
  const toastId = 'global-toast-' + Date.now();
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `global-toast global-toast-${type}`;
  toast.textContent = message;
  
  // Inject CSS if not already present
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .global-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInUp 0.3s ease-out;
      }
      .global-toast-success {
        background: #10b981;
        color: white;
      }
      .global-toast-error {
        background: #ef4444;
        color: white;
      }
      .global-toast-info {
        background: #3b82f6;
        color: white;
      }
      @keyframes slideInUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @media (max-width: 480px) {
        .global-toast {
          bottom: 16px;
          right: 16px;
          left: 16px;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const loginFormContainer = document.getElementById('loginFormContainer');
  const signupFormContainer = document.getElementById('signupFormContainer');
  const signupRoleSelect = document.getElementById('signupRole');
  const categoryContainer = document.getElementById('categoryContainer');

  // Tab switching
  function showLogin() {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginFormContainer.style.display = 'block';
    signupFormContainer.style.display = 'none';
    clearMessages();
  }

  function showSignup() {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupFormContainer.style.display = 'block';
    loginFormContainer.style.display = 'none';
    clearMessages();
  }

  loginTab.addEventListener('click', showLogin);
  signupTab.addEventListener('click', showSignup);
  document.getElementById('toSignup')?.addEventListener('click', showSignup);
  document.getElementById('toLogin')?.addEventListener('click', showLogin);

  // Show category select for earners
  signupRoleSelect?.addEventListener('change', (e) => {
    categoryContainer.style.display = e.target.value === 'earner' ? 'block' : 'none';
    document.getElementById('signupCategory').required = e.target.value === 'earner';
  });

  // Password visibility toggle
  function togglePasswordVisibility(targetId, btn) {
    const input = document.getElementById(targetId);
    if (!input) return;
    
    if (input.type === 'password') {
      input.type = 'text';
      btn.setAttribute('aria-label', 'Hide password');
    } else {
      input.type = 'password';
      btn.setAttribute('aria-label', 'Show password');
    }
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-password');
    if (btn) {
      const target = btn.getAttribute('data-target');
      togglePasswordVisibility(target, btn);
    }
  });

  // Message handling
  function clearMessages() {
    document.querySelectorAll('.message').forEach(msg => msg.remove());
  }

  function showMessage(message, type = 'error') {
    clearMessages();
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.textContent = message;
    document.querySelector('.container').insertBefore(msgDiv, document.querySelector('.tabs'));
    setTimeout(() => msgDiv.remove(), 5000);
  }

  // Loading state
  function setLoading(button, loading) {
    if (loading) {
      button.classList.add('loading');
      button.disabled = true;
      button.textContent = '';
    } else {
      button.classList.remove('loading');
      button.disabled = false;
      button.textContent = button.closest('#signupForm') ? 'Sign Up' : 'Login';
    }
  }

  const BASE_URL = 'https://skilltobill-b.onrender.com/api/auth';

  // Signup Form
  document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    const data = {
      name: document.getElementById('signupName').value.trim(),
      email: document.getElementById('signupEmail').value.trim(),
      phone: document.getElementById('signupPhone').value.trim(),
      password: document.getElementById('signupPassword').value,
      role: document.getElementById('signupRole').value
    };

    if (data.role === 'earner') {
      data.category = document.getElementById('signupCategory').value;
      if (!data.category) {
        showToast('error', 'Please select a service category');
        setLoading(submitBtn, false);
        return;
      }
    }

    if (!data.name || !data.email || !data.phone || !data.password || !data.role) {
      showToast('error', 'Please fill in all required fields');
      setLoading(submitBtn, false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok) {
        showToast('error', result.message || 'Signup failed');
        setLoading(submitBtn, false);
        return;
      }

      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      showToast('success', 'Account created! Redirecting...');

      setTimeout(() => {
        window.location.href = 'profile.html';
      }, 1500);
    } catch (err) {
      showToast('error', 'Network error. Please try again.');
      setLoading(submitBtn, false);
    }
  });

  // Login Form
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    const data = {
      email: document.getElementById('loginEmail').value.trim(),
      password: document.getElementById('loginPassword').value
    };

    if (!data.email || !data.password) {
      showToast('error', 'Please enter email and password');
      setLoading(submitBtn, false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok) {
        showToast('error', result.message || 'Login failed');
        setLoading(submitBtn, false);
        return;
      }

      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      showToast('success', 'Welcome back! Redirecting...');

      setTimeout(() => {
        window.location.href = 'profile.html';
      }, 1500);
    } catch (err) {
      showToast('error', 'Network error. Please try again.');
      setLoading(submitBtn, false);
    }
  });
});
