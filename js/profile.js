/* ==========================
   Profile Page Handler — SkillToBill
   Unified Buyer + Seller Dashboard
========================== */

// ========== GLOBAL HELPERS ==========

/**
 * Safe user retrieval with error handling
 * Returns parsed user object or null if unavailable
 */
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  if (!userStr || !token) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Failed to parse user data:', e);
    return null;
  }
}

/**
 * Check if user is authenticated
 * Returns true only if token AND valid user data exist
 */
function isLoggedIn() {
  return !!localStorage.getItem('token') && !!getCurrentUser();
}

/**
 * Global toast notification system
 * Types: success, error, info
 * Auto-hides after 3 seconds
 */
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

// Get user data from localStorage (alias for backwards compatibility)
function getUserData() {
  return getCurrentUser();
}

document.addEventListener('DOMContentLoaded', () => {
  // ========== AUTH GUARD ==========
  if (!isLoggedIn()) {
    showToast('error', 'Please log in to access your profile');
    setTimeout(() => {
      window.location.href = 'signup-login.html';
    }, 1500);
    return;
  }

  const authMessage = document.getElementById('authMessage');
  const profileContent = document.getElementById('profileContent');
  const profileName = document.getElementById('profileName');
  const profileAvatar = document.getElementById('profileAvatar');
  const roleBadge = document.getElementById('roleBadge');
  const userBio = document.getElementById('userBio');
  
  const sellerSection = document.getElementById('sellerSection');
  const buyerSection = document.getElementById('buyerSection');
  const servicesGrid = document.getElementById('servicesGrid');
  const noServices = document.getElementById('noServices');
  const buyerOrders = document.getElementById('buyerOrders');
  const noOrders = document.getElementById('noOrders');
  
  const listNewServiceBtns = document.querySelectorAll('#listNewServiceBtn, #listNewServiceBtn2');
  const serviceModal = document.getElementById('serviceModal');
  const serviceForm = document.getElementById('serviceForm');
  const modalClose = document.getElementById('modalClose');
  const modalCancel = document.getElementById('modalCancel');
  const editProfileBtn = document.getElementById('editProfileBtn');

  // Initialize page
  function init() {
    const user = getCurrentUser();
    
    if (!user) {
      // This shouldn't happen due to auth guard, but fallback just in case
      authMessage.style.display = 'block';
      profileContent.style.display = 'none';
      return;
    }

    // Hide auth message, show profile content
    authMessage.style.display = 'none';
    profileContent.style.display = 'block';

    // Populate profile
    populateProfile(user);
    renderRoleBasedSections(user);
    setupEventListeners(user);
  }

  // Populate profile header with safe rendering
  function populateProfile(user) {
    if (!user) user = { name: 'User', role: null, bio: 'No bio added yet', skills: [] };
    
    // Generate initials safely
    const initials = (user.name || 'U')
      .split(' ')
      .slice(0, 2)
      .map(n => n[0].toUpperCase())
      .join('')
      .substring(0, 2);

    profileName.textContent = user.name || 'User';
    
    // Avatar with fallback
    profileAvatar.textContent = initials;
    profileAvatar.style.backgroundColor = `hsl(${Math.abs((user.name || 'U').charCodeAt(0)) % 360}, 70%, 60%)`;
    
    // Role badge with color variants - hide if missing
    const isSeller = user.role === 'earner';
    if (user.role) {
      roleBadge.textContent = isSeller ? 'Service Provider' : 'Buyer';
      roleBadge.className = `role-badge ${isSeller ? 'seller' : 'buyer'}`;
      roleBadge.style.display = 'inline-block';
    } else {
      roleBadge.style.display = 'none';
    }
    
    // Bio with fallback
    userBio.textContent = user.bio || 'No bio added yet';
    
    // Contact info population with fallbacks
    const contactEmail = document.getElementById('contactEmail');
    const contactLocation = document.getElementById('contactLocation');
    if (contactEmail) contactEmail.textContent = user.email || 'Not provided';
    if (contactLocation) contactLocation.textContent = user.location || 'Not provided';
    
    // Skills rendering with filter and fallback
    const skillsList = document.getElementById('skillsList');
    if (skillsList) {
      const skills = Array.isArray(user.skills) ? user.skills : [];
      const validSkills = skills.filter(skill => skill && skill.trim());
      if (validSkills.length > 0) {
        skillsList.innerHTML = validSkills
          .map(skill => `<span class="skill-tag">${skill.trim()}</span>`)
          .join('');
      } else {
        skillsList.innerHTML = '<p class="text-muted">No skills added yet</p>';
      }
    }
  }

  // Render role-based sections
  function renderRoleBasedSections(user) {
    if (user.role === 'earner') {
      // Show seller section
      sellerSection.style.display = 'block';
      buyerSection.style.display = 'none';
      
      loadSellerServices(user);
    } else {
      // Show buyer section
      sellerSection.style.display = 'none';
      buyerSection.style.display = 'block';
      
      loadBuyerOrders(user);
    }
  }

  // Load seller services
  function loadSellerServices(user) {
    const servicesStr = localStorage.getItem('userServices');
    const services = servicesStr ? JSON.parse(servicesStr) : [];

    if (services.length === 0) {
      servicesGrid.style.display = 'none';
      noServices.style.display = 'block';
      return;
    }

    servicesGrid.style.display = 'grid';
    noServices.style.display = 'none';
    servicesGrid.innerHTML = '';

    services.forEach((service, index) => {
      const card = document.createElement('div');
      card.className = 'service-card';
      card.innerHTML = `
        ${service.image ? `<img src="${service.image}" alt="${service.title}" class="service-card-image">` : '<div class="service-card-image" style="background: #e0e0e0;"></div>'}
        <div class="service-card-content">
          <h3 class="service-card-title">${service.title}</h3>
          <div class="service-card-price">₹${service.price}</div>
          <div class="service-card-delivery">${service.delivery} days delivery</div>
          <div class="service-card-actions">
            <button class="edit-btn" onclick="editService(${index})">Edit</button>
            <button class="delete-btn" onclick="deleteService(${index})">Delete</button>
          </div>
        </div>
      `;
      servicesGrid.appendChild(card);
    });

    // Update stats
    document.getElementById('servicesCount').textContent = services.length;
  }

  // Load buyer orders
  function loadBuyerOrders(user) {
    const ordersStr = localStorage.getItem('userOrders');
    const orders = ordersStr ? JSON.parse(ordersStr) : [];

    if (orders.length === 0) {
      buyerOrders.style.display = 'none';
      noOrders.style.display = 'block';
      return;
    }

    buyerOrders.style.display = 'flex';
    noOrders.style.display = 'none';
    buyerOrders.innerHTML = '';

    orders.forEach((order) => {
      const card = document.createElement('div');
      card.className = 'order-card';
      const statusClass = `order-status ${order.status || 'pending'}`;
      card.innerHTML = `
        <div class="order-info">
          <h3>${order.serviceName || 'Service'}</h3>
          <p>Order ID: ${order.id || 'N/A'} • By ${order.sellerName || 'Unknown'}</p>
        </div>
        <span class="${statusClass}">${(order.status || 'Pending').toUpperCase()}</span>
      `;
      buyerOrders.appendChild(card);
    });
  }

  // Modal functions
  function openServiceModal() {
    serviceModal.style.display = 'flex';
    serviceForm.reset();
    delete serviceForm.dataset.editId;
    
    // Reset modal title
    const modalTitle = serviceModal.querySelector('h2');
    if (modalTitle) modalTitle.textContent = 'List New Service';
  }

  function closeServiceModal() {
    serviceModal.style.display = 'none';
    delete serviceForm.dataset.editId;
  }

  // Setup event listeners
  function setupEventListeners(user) {
    // List new service buttons
    listNewServiceBtns.forEach(btn => {
      btn.addEventListener('click', openServiceModal);
    });

    // Modal close buttons
    modalClose.addEventListener('click', closeServiceModal);
    modalCancel.addEventListener('click', closeServiceModal);

    // Close modal on outside click
    serviceModal.addEventListener('click', (e) => {
      if (e.target === serviceModal) {
        closeServiceModal();
      }
    });

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && serviceModal.style.display === 'flex') {
        closeServiceModal();
      }
    });

    // Edit profile button
    editProfileBtn.addEventListener('click', () => {
      showToast('info', 'Opening edit profile form...');
      const editModal = document.getElementById('editProfileModal');
      if (editModal) editModal.style.display = 'flex';
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userServices');
        
        showToast('success', 'Logged out successfully');
        
        // Redirect to home after brief delay
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      });
    }

    // Service form submission
    serviceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveService();
    });
  }

  // Save service with validation and edit mode support
  function saveService() {
    const title = document.getElementById('serviceTitle').value.trim();
    const category = document.getElementById('serviceCategory').value.trim();
    const description = document.getElementById('serviceDescription').value.trim();
    const price = document.getElementById('servicePrice').value.trim();
    const delivery = document.getElementById('serviceDelivery').value.trim();
    const image = document.getElementById('serviceImage').value.trim();

    // Validation with toast notifications
    if (!title) {
      showToast('error', 'Service title is required');
      return;
    }
    if (!category) {
      showToast('error', 'Please select a category');
      return;
    }
    if (!description) {
      showToast('error', 'Service description is required');
      return;
    }
    
    // Price must be numeric only
    const priceNum = parseInt(price);
    if (!price || isNaN(priceNum) || priceNum < 100) {
      showToast('error', 'Price must be numeric and at least ₹100');
      return;
    }
    
    // Delivery must be integer only
    const deliveryNum = parseInt(delivery);
    if (!delivery || isNaN(deliveryNum) || deliveryNum < 1) {
      showToast('error', 'Delivery days must be integer and at least 1');
      return;
    }

    try {
      const editId = serviceForm.dataset.editId;
      
      // Get existing services safely
      const servicesStr = localStorage.getItem('userServices');
      let services = [];
      try {
        services = servicesStr ? JSON.parse(servicesStr) : [];
      } catch (e) {
        services = [];
      }

      if (editId) {
        // Update existing service
        const index = services.findIndex(s => s.id === parseInt(editId));
        if (index !== -1) {
          services[index] = {
            ...services[index],
            title,
            category,
            description,
            price: priceNum,
            delivery: deliveryNum,
            image: image || null,
            updatedAt: new Date().toISOString()
          };
          showToast('success', 'Service updated successfully!');
        }
        delete serviceForm.dataset.editId;
      } else {
        // Prevent duplicate services with same title + price
        if (services.some(s => s.title === title && s.price === priceNum)) {
          showToast('error', 'Service with same title and price already exists');
          return;
        }

        // Create new service
        const service = {
          id: Date.now(),
          title,
          category,
          description,
          price: priceNum,
          delivery: deliveryNum,
          image: image || null,
          createdAt: new Date().toISOString()
        };
        services.push(service);
        showToast('success', 'Service added successfully!');
      }

      // Save to localStorage
      localStorage.setItem('userServices', JSON.stringify(services));

      // Close modal and reload
      closeServiceModal();
      loadSellerServices(getCurrentUser());
    } catch (error) {
      showToast('error', 'Failed to save service. Please try again.');
    }
  }

  // Global functions for edit/delete (exposed to window)
  window.editService = function(id) {
    try {
      const servicesStr = localStorage.getItem('userServices');
      const services = servicesStr ? JSON.parse(servicesStr) : [];
      const service = services.find(s => s.id === id);

      if (!service) {
        showToast('error', 'Service not found');
        return;
      }

      // Pre-fill form with service data
      document.getElementById('serviceTitle').value = service.title;
      document.getElementById('serviceCategory').value = service.category;
      document.getElementById('serviceDescription').value = service.description;
      document.getElementById('servicePrice').value = service.price;
      document.getElementById('serviceDelivery').value = service.delivery;
      document.getElementById('serviceImage').value = service.image || '';

      // Set edit mode flag
      serviceForm.dataset.editId = id;
      
      // Update modal title
      const modalTitle = serviceModal.querySelector('h2');
      if (modalTitle) modalTitle.textContent = 'Edit Service';

      openServiceModal();
    } catch (error) {
      showToast('error', 'Failed to load service for editing');
    }
  };

  window.deleteService = function(id) {
    // Confirmation dialog
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      const servicesStr = localStorage.getItem('userServices');
      let services = servicesStr ? JSON.parse(servicesStr) : [];
      
      services = services.filter(s => s.id !== id);
      localStorage.setItem('userServices', JSON.stringify(services));
      
      showToast('success', 'Service deleted successfully');
      loadSellerServices(getCurrentUser());
    } catch (error) {
      showToast('error', 'Failed to delete service');
    }
  };

  // ========== EDIT PROFILE FUNCTIONALITY ==========
  const editProfileModal = document.getElementById('editProfileModal');
  const editProfileForm = document.getElementById('editProfileForm');
  const editModalClose = document.getElementById('editModalClose');
  const editModalCancel = document.getElementById('editModalCancel');
  const successMessage = document.getElementById('successMessage');
  const errorMessage = document.getElementById('errorMessage');

  // Open edit profile modal
  editProfileBtn.addEventListener('click', () => {
    const user = getUserData();
    if (!user) return;

    // Prefill form with existing data
    document.getElementById('editAvatar').value = user.avatar || '';
    document.getElementById('editName').value = user.name || '';
    document.getElementById('editBio').value = user.bio || '';
    document.getElementById('editSkills').value = (user.skills && Array.isArray(user.skills)) ? user.skills.join(', ') : '';
    document.getElementById('editLocation').value = user.location || '';
    document.getElementById('editEmail').value = user.email || '';

    editProfileModal.style.display = 'flex';
  });

  // Close edit profile modal
  function closeEditProfileModal() {
    editProfileModal.style.display = 'none';
    editProfileForm.reset();
  }

  editModalClose.addEventListener('click', closeEditProfileModal);
  editModalCancel.addEventListener('click', closeEditProfileModal);

  // Close modal on outside click
  editProfileModal.addEventListener('click', (e) => {
    if (e.target === editProfileModal) {
      closeEditProfileModal();
    }
  });

  // Close modal on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editProfileModal.style.display === 'flex') {
      closeEditProfileModal();
    }
  });

  // Handle edit profile form submission with validation
  editProfileForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) {
      showToast('error', 'User data not found');
      return;
    }

    // Get form data
    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const skills = document.getElementById('editSkills').value.trim() 
      ? document.getElementById('editSkills').value.split(',').map(s => s.trim()).filter(s => s)
      : [];
    const location = document.getElementById('editLocation').value.trim();
    const avatar = document.getElementById('editAvatar').value.trim();

    // Clear previous error messages
    document.getElementById('editNameError').textContent = '';
    document.getElementById('editNameError').classList.remove('show');
    document.getElementById('editEmailError').textContent = '';
    document.getElementById('editEmailError').classList.remove('show');

    // Validation: required fields must not be empty
    let hasErrors = false;
    if (!name) {
      document.getElementById('editNameError').textContent = 'Name is required';
      document.getElementById('editNameError').classList.add('show');
      hasErrors = true;
    }
    
    // Email format validation
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      document.getElementById('editEmailError').textContent = 'Valid email is required';
      document.getElementById('editEmailError').classList.add('show');
      hasErrors = true;
    }

    if (hasErrors) return;

    try {
      const submitBtn = editProfileForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const updatedUser = {
        ...user,
        avatar: avatar || user.avatar,
        name,
        bio: bio || 'No bio added yet',
        skills,
        location: location || 'Not provided',
        email,
        updatedAt: new Date().toISOString()
      };

      // Save to localStorage safely
      localStorage.setItem('user', JSON.stringify(updatedUser));

      showToast('success', 'Profile updated successfully!');

      // Close modal and reload profile
      closeEditProfileModal();
      populateProfile(updatedUser);
      
      if (submitBtn) submitBtn.disabled = false;
    } catch (error) {
      showToast('error', 'Failed to update profile. Please try again.');
      const submitBtn = editProfileForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Show success message
  function showSuccessMessage(message) {
    const successText = document.getElementById('successText');
    successText.textContent = message;
    successMessage.style.display = 'flex';
    
    setTimeout(() => {
      successMessage.style.display = 'none';
    }, 3000);
  }

  // Show error message
  function showErrorMessage(message) {
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    
    setTimeout(() => {
      errorMessage.style.display = 'none';
    }, 3000);
  }

  // Initialize
  init();
});
