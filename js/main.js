/* ==========================
   main.js — SkillToBill
   Global Navigation & Footer Loader
========================== */

document.addEventListener("DOMContentLoaded", () => {
  // Load Navbar
  const navbarDiv = document.getElementById("navbar");
  if (navbarDiv) {
    fetch("navbar.html")
      .then(res => {
        if (!res.ok) throw new Error("Navbar load failed");
        return res.text();
      })
      .then(data => {
        navbarDiv.innerHTML = data;
        initNavbarScripts();
        setActiveNavLink();
      })
      .catch(err => console.log("Navbar loading error:", err));
  }

  // Load Footer
  const footerDiv = document.getElementById("footer");
  if (footerDiv) {
    fetch("footer.html")
      .then(res => {
        if (!res.ok) throw new Error("Footer load failed");
        return res.text();
      })
      .then(data => {
        footerDiv.innerHTML = data;
      })
      .catch(err => console.log("Footer loading error:", err));
  }
});

// Initialize navbar dropdown interactions
function initNavbarScripts() {
  const profileIcon = document.querySelector('.profile-icon');
  const profileMenu = document.querySelector('.profile-menu');
  const notificationsIcon = document.querySelector('.notifications-icon');
  const notificationsMenu = document.querySelector('.notifications-menu');

  // Profile dropdown
  if (profileIcon && profileMenu) {
    profileIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('active');
      notificationsMenu?.classList.remove('active');
    });
  }

  // Notifications dropdown
  if (notificationsIcon && notificationsMenu) {
    notificationsIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationsMenu.classList.toggle('active');
      profileMenu?.classList.remove('active');
    });
  }

  // Close menus on outside click
  document.addEventListener('click', (e) => {
    if (profileIcon && !profileIcon.contains(e.target) && profileMenu && !profileMenu.contains(e.target)) {
      profileMenu.classList.remove('active');
    }
    if (notificationsIcon && !notificationsIcon.contains(e.target) && notificationsMenu && !notificationsMenu.contains(e.target)) {
      notificationsMenu.classList.remove('active');
    }
  });

  // Hamburger menu handler
  const hamburger = document.querySelector('.hamburger-menu');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });

    // Close menu on link click
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
      });
    });
  }
}

// Set active navigation link based on current page
function setActiveNavLink() {
  const currentFile = window.location.pathname.split("/").pop() || "home.html";
  const navLinks = document.querySelectorAll(".nav-links a, .mobile-menu a");
  
  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href && currentFile.includes(href.replace(".html", ""))) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

