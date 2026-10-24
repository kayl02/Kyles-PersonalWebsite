// Handles navigation, scrolling, project popups, and form checks.
document.addEventListener('DOMContentLoaded', function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('header');
  const sectionIds = ['home', 'about', 'project', 'education', 'tech-stack', 'contact'];
  const navigationLinks = document.querySelectorAll('.nav-inner a, #mobile-nav a');

  // Mark the current section in the navigation.
  function setActiveLink(sectionId) {
    navigationLinks.forEach(function (link) {
      const isCurrentLink = link.getAttribute('href') === '#' + sectionId;
      link.classList.toggle('active', isCurrentLink);
    });
  }

  function updateActiveLinkOnScroll() {
    const pageBottom = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (pageBottom >= documentHeight - 60) {
      setActiveLink('contact');
      return;
    }

    const readingPosition = window.scrollY + (header ? header.offsetHeight : 0) + 5;
    let currentSection = 'home';

    sectionIds.forEach(function (sectionId) {
      const section = document.getElementById(sectionId);
      if (section && section.offsetTop <= readingPosition) {
        currentSection = sectionId;
      }
    });

    setActiveLink(currentSection);
  }

  // Update the progress bar while scrolling.
  const progressBar = document.getElementById('scroll-progress');

  function updateProgressBar() {
    const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = pageHeight > 0 ? (window.scrollY / pageHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  }

  if (progressBar && !prefersReducedMotion) {
    window.addEventListener('scroll', updateProgressBar, { passive: true });
    updateProgressBar();
  }

  // Control the mobile menu.
  const menuButton = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-nav');

  function closeMobileMenu() {
    if (!menuButton || !mobileMenu) return;
    menuButton.classList.remove('open');
    mobileMenu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      const menuIsOpen = mobileMenu.classList.toggle('open');
      menuButton.classList.toggle('open', menuIsOpen);
      menuButton.setAttribute('aria-expanded', menuIsOpen);
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('click', function (event) {
      const clickedOutsideMenu = !menuButton.contains(event.target) && !mobileMenu.contains(event.target);
      if (clickedOutsideMenu) closeMobileMenu();
    });
  }

  // Scroll to a section below the header.
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      const sectionId = link.getAttribute('href').slice(1);
      const target = document.getElementById(sectionId);

      if (!target) return;
      event.preventDefault();

      if (sectionId === 'top' || sectionId === 'home') {
        setActiveLink('home');
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });

        if (link.classList.contains('back-to-top')) {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
        return;
      }

      setActiveLink(sectionId);
      const headerHeight = header ? header.offsetHeight : 0;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({
        top: Math.round(targetPosition),
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  });

  window.addEventListener('scroll', updateActiveLinkOnScroll, { passive: true });
  updateActiveLinkOnScroll();

  // Reveal sections on scroll, or show them all when motion or browser support is limited.
  const revealItems = document.querySelectorAll('[data-animate]');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) {
      item.classList.add('visible');
    });
  } else {
    const revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  // Add the same open and close behavior to both project popups.
  let closeOpenDialog = null;

  document.querySelectorAll('.newspaper-modal').forEach(function (dialog) {
    const openButton = document.querySelector('[data-open-modal="' + dialog.id + '"]');
    const closeButtons = dialog.querySelectorAll('.modal-close-btn, .modal-footer-close');
    const backdrop = dialog.querySelector('.modal-backdrop');

    if (!openButton) return;

    function closeDialog() {
      dialog.classList.remove('is-open');
      document.body.style.overflow = '';
      closeOpenDialog = null;

      window.setTimeout(function () {
        if (!dialog.classList.contains('is-open')) {
          dialog.setAttribute('hidden', '');
        }
      }, 250);

      openButton.focus();
    }

    openButton.addEventListener('click', function () {
      dialog.removeAttribute('hidden');
      window.requestAnimationFrame(function () {
        dialog.classList.add('is-open');
      });
      document.body.style.overflow = 'hidden';
      closeOpenDialog = closeDialog;

      const closeButton = dialog.querySelector('.modal-close-btn');
      if (closeButton) closeButton.focus();
    });

    closeButtons.forEach(function (button) {
      button.addEventListener('click', closeDialog);
    });

    if (backdrop) backdrop.addEventListener('click', closeDialog);
  });

  // Let visitors open project images in a larger view.
  const projectImages = Array.from(document.querySelectorAll('.card-img, .showcase-screenshot'));

  if (projectImages.length) {
    const imageViewer = document.createElement('div');
    imageViewer.className = 'image-viewer';
    imageViewer.setAttribute('role', 'dialog');
    imageViewer.setAttribute('aria-modal', 'true');
    imageViewer.setAttribute('aria-label', 'Project image viewer');
    imageViewer.hidden = true;
    imageViewer.innerHTML = `
      <button class="image-viewer-close" type="button" aria-label="Close image">&times;</button>
      <button class="image-viewer-previous" type="button" aria-label="Previous image">&larr;</button>
      <figure class="image-viewer-figure">
        <img class="image-viewer-image" alt="" />
        <figcaption class="image-viewer-caption"></figcaption>
      </figure>
      <button class="image-viewer-next" type="button" aria-label="Next image">&rarr;</button>
      <span class="image-viewer-count" aria-live="polite"></span>`;
    document.body.appendChild(imageViewer);

    const viewerImage = imageViewer.querySelector('.image-viewer-image');
    const viewerCaption = imageViewer.querySelector('.image-viewer-caption');
    const viewerCount = imageViewer.querySelector('.image-viewer-count');
    let currentImageIndex = 0;
    let previousFocus = null;
    let previousOverflow = '';

    function showProjectImage(index) {
      currentImageIndex = (index + projectImages.length) % projectImages.length;
      const selectedImage = projectImages[currentImageIndex];
      viewerImage.src = selectedImage.currentSrc || selectedImage.src;
      viewerImage.alt = selectedImage.alt;
      viewerCaption.textContent = selectedImage.alt;
      viewerCount.textContent = (currentImageIndex + 1) + ' / ' + projectImages.length;
    }

    function closeImageViewer() {
      if (imageViewer.hidden) return;
      imageViewer.hidden = true;
      document.body.style.overflow = previousOverflow;
      if (previousFocus) previousFocus.focus();
    }

    projectImages.forEach(function (image, index) {
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', 'Enlarge image: ' + image.alt);

      function openImageViewer() {
        previousFocus = image;
        previousOverflow = document.body.style.overflow;
        showProjectImage(index);
        imageViewer.hidden = false;
        document.body.style.overflow = 'hidden';
        imageViewer.querySelector('.image-viewer-close').focus();
      }

      image.addEventListener('click', openImageViewer);
      image.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openImageViewer();
        }
      });
    });

    imageViewer.querySelector('.image-viewer-close').addEventListener('click', closeImageViewer);
    imageViewer.querySelector('.image-viewer-previous').addEventListener('click', function () {
      showProjectImage(currentImageIndex - 1);
    });
    imageViewer.querySelector('.image-viewer-next').addEventListener('click', function () {
      showProjectImage(currentImageIndex + 1);
    });
    imageViewer.addEventListener('click', function (event) {
      if (event.target === imageViewer) closeImageViewer();
    });

    document.addEventListener('keydown', function (event) {
      if (imageViewer.hidden) return;
      if (event.key === 'Escape') {
        event.stopImmediatePropagation();
        closeImageViewer();
      }
      if (event.key === 'ArrowLeft') showProjectImage(currentImageIndex - 1);
      if (event.key === 'ArrowRight') showProjectImage(currentImageIndex + 1);
    });
  }

  // Press Escape to close the menu or popup.
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    closeMobileMenu();
    if (closeOpenDialog && document.querySelector('.image-viewer:not([hidden])') === null) {
      closeOpenDialog();
    }
  });

  // Show a message if the portrait image cannot load.
  const portrait = document.querySelector('.hero-image img');

  if (portrait) {
    portrait.addEventListener('error', function () {
      const message = document.createElement('div');
      message.className = 'hero-image-fallback';
      message.textContent = 'Portrait image unavailable';
      message.setAttribute('role', 'img');
      message.setAttribute('aria-label', 'Portrait image unavailable');
      portrait.replaceWith(message);
    });
  }

  // The browser checks the form, but it does not send messages.
  const contactForm = document.getElementById('contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      contactForm.reportValidity();
    });
  }
});
