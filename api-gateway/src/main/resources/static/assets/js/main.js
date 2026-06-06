/**
* Template Name: Medilab
* Template URL: https://bootstrapmade.com/medilab-free-medical-bootstrap-theme/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  if (mobileNavToggleBtn) {
    function mobileNavToogle() {
      document.querySelector('body').classList.toggle('mobile-nav-active');
      mobileNavToggleBtn.classList.toggle('bi-list');
      mobileNavToggleBtn.classList.toggle('bi-x');
    }
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        document.querySelector('body').classList.toggle('mobile-nav-active');
        if (mobileNavToggleBtn) {
          mobileNavToggleBtn.classList.toggle('bi-list');
          mobileNavToggleBtn.classList.toggle('bi-x');
        }
      }
    });
  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button (SECȚIUNEA REPARATĂ)
   */
  let scrollTop = document.querySelector('.scroll-top');

  if (scrollTop) {
    const toggleScrollTop = function() {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    };

    scrollTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    window.addEventListener('load', toggleScrollTop);
    document.addEventListener('scroll', toggleScrollTop);
  }

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 600,
        easing: 'ease-in-out',
        once: true,
        mirror: false
      });
    }
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate glightbox
   */
  if (typeof GLightbox !== 'undefined') {
    const glightbox = GLightbox({
      selector: '.glightbox'
    });
  }

  /**
   * Initiate Pure Counter
   */
  if (typeof PureCounter !== 'undefined') {
    new PureCounter();
  }

  /**
   * Frequently Asked Questions Toggle
   */
  document.querySelectorAll('.faq-item h3, .faq-item .faq-toggle').forEach((faqItem) => {
    faqItem.addEventListener('click', () => {
      faqItem.parentNode.classList.toggle('faq-active');
    });
  });

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    if (typeof Swiper !== 'undefined') {
      document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
        let config = JSON.parse(
          swiperElement.querySelector(".swiper-config").innerHTML.trim()
        );

        if (swiperElement.classList.contains("swiper-tab")) {
          initSwiperWithCustomPagination(swiperElement, config);
        } else {
          new Swiper(swiperElement, config);
        }
      });
    }
  }

  window.addEventListener("load", initSwiper);

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);

  // === LOGICĂ PENTRU ACTUALIZAREA BAREI DE NAVIGARE (HEADER) ===
  function updateNavbar() {
      const loginItem = document.getElementById('nav-login-item');
      const userItem = document.getElementById('nav-user-item');
      const userNameDisplay = document.getElementById('display-user-name');
      const logoutBtn = document.getElementById('btn-logout');

      // Am preluat butonul exact pe care l-am etichetat în header.html
      const headerAppointmentBtn = document.getElementById('header-appointment-btn');

      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const userName = localStorage.getItem('userName');
      const userRole = localStorage.getItem('userRole');

      if (loginItem && userItem) {
          if (isLoggedIn === 'true') {
              loginItem.style.setProperty('display', 'none', 'important');
              userItem.style.setProperty('display', 'block', 'important');

              if (userNameDisplay && userName && userName !== 'undefined') {
                  userNameDisplay.textContent = userName.split(' ')[0];
              }

              // Dacă e ADMIN, ascundem elegant butonul. Altfel, îl lăsăm vizibil.
              if (headerAppointmentBtn) {
                  if (userRole === 'ADMIN') {
                      headerAppointmentBtn.style.setProperty('display', 'none', 'important');
                  } else {
                      headerAppointmentBtn.style.removeProperty('display');
                  }
              }

          } else {
              loginItem.style.setProperty('display', 'block', 'important');
              userItem.style.setProperty('display', 'none', 'important');

              if (headerAppointmentBtn) {
                  headerAppointmentBtn.style.removeProperty('display');
              }
          }
      }

      if (logoutBtn && !logoutBtn.dataset.listenerAttached) {
          logoutBtn.addEventListener('click', (e) => {
              e.preventDefault();
              localStorage.clear();
              window.location.href = 'index.html';
          });
          logoutBtn.dataset.listenerAttached = 'true';
      }
  }

  window.addEventListener('componentsLoaded', updateNavbar);
  setTimeout(updateNavbar, 300);

  // === LOGICĂ GLOBALĂ PENTRU BUTOANELE DE PROGRAMARE ===
  document.addEventListener('click', (e) => {
      const appointmentBtn = e.target.closest('a[href="#appointment"], .btn-appointment');

      if (appointmentBtn) {
          e.preventDefault();
          const isLoggedIn = localStorage.getItem('isLoggedIn');

          if (isLoggedIn === 'true') {
              window.location.href = 'booking.html';
          } else {
              alert("Pentru a face o programare, te rugăm să te autentifici sau să îți creezi un cont gratuit.");
              window.location.href = 'account.html';
          }
      }
  });

})();