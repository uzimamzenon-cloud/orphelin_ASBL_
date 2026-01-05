// =====================================================================
// VARIABLES GLOBALES
// =====================================================================
let preloader, header, mobileMenuBtn, navMenu, navLinks, dropdowns, backToTopBtn;
let donationModal, modalClose, galleryModal, galleryModalClose, galleryModalImg, galleryModalCaption;
let contactForm, themeToggle;
let carouselTrack, carouselPrev, carouselNext, carouselIndicators;
let aboutCarouselTrack, aboutCarouselIndicators, aboutCurrentSlideIndex = 0, aboutCarouselInterval;

// Données du carousel principal
const carouselImages = [
    {
        url: '/static/images/IMG-20251212-WA0000.jpg',
        title: 'Notre équipe en action',
        description: 'Réunion de travail avec notre équipe sur le terrain'
    },
    {
        url: '/static/images/IMG-20251212-WA0005.jpg',
        title: 'Distribution scolaire',
        description: 'Remise de kits scolaires aux enfants'
    },
    {
        url: '/static/images/Screenshot_20251211-124109.png',
        title: 'Activités éducatives',
        description: 'Ateliers éducatifs avec les enfants'
    },
    {
        url: '/static/images/IMG-20251212-WA0002.jpg',
        title: 'Visites communautaires',
        description: 'Rencontres avec les familles dans les communautés'
    },
    {
        url: '/static/images/Screenshot_20251211-124304.png',
        title: 'Formation des bénévoles',
        description: "Formation des membres de l'équipe"
    },
    {
        url: '/static/images/IMG-20251212-WA0003.jpg',
        title: 'Nos réalisations',
        description: 'Bilan des projets réalisés cette année'
    }
];

// Images pour la section "À propos de nous"
const aboutImages = [
    '/static/images/IMG-20251212-WA0000.jpg',
    '/static/images/IMG-20251212-WA0005.jpg',
    '/static/images/Screenshot_20251211-124109.png',
    '/static/images/IMG-20251212-WA0002.jpg',
    '/static/images/Screenshot_20251211-124304.png',
    '/static/images/IMG-20251212-WA0003.jpg'
];

let currentSlideIndex = 0;
let isMobile = false;
let touchStartX = 0;
let touchEndX = 0;

// =====================================================================
// INITIALISATION - Attendre que le DOM soit chargé
// =====================================================================
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si on est sur mobile
    checkMobileView();
    
    // Initialiser les variables
    initVariables();
    initTheme();
    watchThemeChanges();
    setupEventListeners();
    
    // Initialiser les carousels
    initCarousel();
    initAboutCarousel();
    
    // Initialiser les images d'équipe (avec délai pour éviter le bug)
    setTimeout(initTeamImages, 500);

    // Initialiser la section "À propos de nous"
    initAboutSection();

    // Initialiser la section "Notre impact"
    initImpactSection();

    // Initialiser les formulaires
    initForms();

    // Initialiser les animations
    setTimeout(() => {
        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach(el => {
            if (isElementInViewport(el)) {
                el.classList.add('visible');
            }
        });
    }, 300);
    
    // Retirer la classe no-js
    document.body.classList.remove('no-js');
});

// =====================================================================
// INITIALISATION DES VARIABLES
// =====================================================================
function initVariables() {
    preloader = document.getElementById('preloader');
    header = document.getElementById('header');
    mobileMenuBtn = document.getElementById('mobileMenuBtn');
    navMenu = document.getElementById('navMenu');
    navLinks = document.querySelectorAll('.nav-link');
    dropdowns = document.querySelectorAll('.nav-dropdown');
    backToTopBtn = document.getElementById('backToTop');
    donationModal = document.getElementById('donationModal');
    modalClose = document.getElementById('modalClose');
    galleryModal = document.getElementById('galleryModal');
    galleryModalClose = document.getElementById('galleryModalClose');
    galleryModalImg = document.getElementById('galleryModalImg');
    galleryModalCaption = document.getElementById('galleryModalCaption');
    contactForm = document.getElementById('contactForm');
    themeToggle = document.getElementById('themeToggle');
    carouselTrack = document.getElementById('carouselTrack');
    carouselPrev = document.getElementById('carouselPrev');
    carouselNext = document.getElementById('carouselNext');
    carouselIndicators = document.getElementById('carouselIndicators');
    aboutCarouselTrack = document.getElementById('aboutCarouselTrack');
    aboutCarouselIndicators = document.getElementById('aboutCarouselIndicators');
}

// =====================================================================
// CONFIGURATION DES ÉVÉNEMENTS
// =====================================================================
function setupEventListeners() {
    // Preloader
    window.addEventListener('load', handleWindowLoad);
    
    // Scroll events (avec debounce pour performance mobile)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleWindowScroll, 50);
    });
    
    // Mobile menu
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        mobileMenuBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleMobileMenu();
        }, { passive: false });
    }
    
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavLinkClick);
        link.addEventListener('touchstart', (e) => {
            e.preventDefault();
            link.click();
        }, { passive: false });
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', handleSmoothScroll);
    });
    
    // Back to top
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', scrollToTop);
        backToTopBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            scrollToTop();
        }, { passive: false });
    }
    
    // Donation modal
    if (modalClose) {
        modalClose.addEventListener('click', closeDonationModal);
    }
    
    // Gallery modal
    if (galleryModalClose) {
        galleryModalClose.addEventListener('click', closeGalleryModal);
    }
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        themeToggle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleTheme();
        }, { passive: false });
    }
    
    // Program tabs
    const programTabs = document.querySelectorAll('.program-tab');
    programTabs.forEach(tab => {
        tab.addEventListener('click', handleProgramTabClick);
        tab.addEventListener('touchstart', (e) => {
            e.preventDefault();
            tab.click();
        }, { passive: false });
    });
    
    // Newsletter form
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        const newsletterBtn = newsletterForm.querySelector('.newsletter-btn');
        const newsletterInput = newsletterForm.querySelector('.newsletter-input');
        
        newsletterBtn.addEventListener('click', (e) => handleNewsletterSubmit(e, newsletterInput, newsletterBtn));
        newsletterBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            newsletterBtn.click();
        }, { passive: false });
        
        newsletterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                newsletterBtn.click();
            }
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('touchstart', handleOutsideClick);
    
    // Close modals with Escape key
    document.addEventListener('keydown', handleEscapeKey);
    
    // Redimensionnement de la fenêtre (avec debounce)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 250);
    });

    // Observer pour les animations au scroll
    initScrollAnimations();
}

// =====================================================================
// GESTIONNAIRES D'ÉVÉNEMENTS
// =====================================================================
function handleWindowLoad() {
    setTimeout(() => {
        if (preloader) preloader.classList.add('hidden');
        animateCounters();
        // Démarrer le carousel "À propos" après le chargement
        startAboutCarousel();
        
        // Optimiser les images après chargement complet
        setTimeout(optimizeTeamImages, 500);
    }, 1000);
}

function handleWindowScroll() {
    // Header scroll effect
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    // Back to top button
    if (backToTopBtn) {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('active');
        } else {
            backToTopBtn.classList.remove('active');
        }
    }
    
    // Active navigation link
    setActiveNavLink();
    
    // Animate elements on scroll
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => {
        if (isElementInViewport(el)) {
            el.classList.add('visible');
        }
    });
    
    // Animate counters
    animateCounters();
}

function toggleMobileMenu() {
    const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
    navMenu.classList.toggle('active');
    mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
    
    const icon = mobileMenuBtn.querySelector('i');
    icon.className = navMenu.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
    
    // Bloquer/débloquer le défilement
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    
    // Animation du bouton hamburger
    mobileMenuBtn.classList.toggle('active');
}

function handleNavLinkClick(e) {
    if (window.innerWidth <= 992) {
        navMenu.classList.remove('active');
        mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Update active link
    navLinks.forEach(navLink => navLink.classList.remove('active'));
    this.classList.add('active');
}

function handleSmoothScroll(e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = targetElement.offsetTop - headerHeight;
        
        // Fermer le menu mobile si ouvert
        if (window.innerWidth <= 992 && navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function closeDonationModal() {
    if (donationModal) {
        donationModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeGalleryModal() {
    if (galleryModal) {
        galleryModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function handleProgramTabClick() {
    const programTabs = document.querySelectorAll('.program-tab');
    programTabs.forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    
    const tabId = this.getAttribute('data-tab');
    const programContents = document.querySelectorAll('.program-content');
    programContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
            content.classList.add('active');
        }
    });
}

function handleNewsletterSubmit(e, input, btn) {
    e.preventDefault();
    const email = input.value;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && emailRegex.test(email)) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;
        
        setTimeout(() => {
            showToast(`Merci de vous être inscrit à notre newsletter avec l'adresse: ${email}`, 'success');
            input.value = '';
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1000);
    } else {
        showToast('Veuillez entrer une adresse email valide.', 'error');
    }
}

function handleOutsideClick(e) {
    // Mobile menu
    const isMobile = window.innerWidth <= 992;
    if (isMobile && navMenu && mobileMenuBtn && 
        !navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        navMenu.classList.remove('active');
        mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Donation modal
    if (donationModal && e.target === donationModal) {
        closeDonationModal();
    }
    
    // Gallery modal
    if (galleryModal && e.target === galleryModal) {
        closeGalleryModal();
    }
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        if (donationModal && donationModal.classList.contains('active')) {
            closeDonationModal();
        }
        if (galleryModal && galleryModal.classList.contains('active')) {
            closeGalleryModal();
        }
    }
}

function handleResize() {
    checkMobileView();
    // Réinitialiser le menu mobile si on passe en desktop
    if (window.innerWidth > 992 && navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Ré-optimiser les images d'équipe (sans délai pour réactivité)
    optimizeTeamImages();
    
    // Ré-optimiser le formulaire d'impact pour mobile
    const impactForm = document.querySelector('#impact .impact-form');
    if (impactForm) {
        optimizeImpactFormForMobile(impactForm);
    }
}

// =====================================================================
// FONCTIONS DU THÈME
// =====================================================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let theme = savedTheme;
    if (!theme) {
        theme = prefersDark ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    showToast(`Mode ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`, 'success');
}

function updateThemeIcon(theme) {
    if (!themeToggle) return;
    
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    themeToggle.setAttribute('aria-label',
        theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre');
}

function watchThemeChanges() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const theme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            updateThemeIcon(theme);
        }
    });
}

// =====================================================================
// FONCTIONS DU CAROUSEL PRINCIPAL
// =====================================================================
function initCarousel() {
    if (!carouselTrack || !carouselIndicators) return;
    
    renderCarousel();
    updateCarouselControls();
    setupCarouselEvents();
}

function renderCarousel() {
    carouselTrack.innerHTML = '';
    carouselIndicators.innerHTML = '';
    
    carouselImages.forEach((image, index) => {
        // Créer la diapositive
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.dataset.index = index;
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-label', `${index + 1} sur ${carouselImages.length}`);
        
        // Conteneur d'image
        const imgContainer = document.createElement('div');
        imgContainer.className = 'carousel-img-container';
        
        // Créer l'image
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = image.title;
        img.loading = 'lazy';
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';
        
        img.onload = function() {
            this.style.opacity = '1';
        };
        
        img.onerror = function() {
            this.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            placeholder.innerHTML = `
                <i class="fas fa-image" aria-hidden="true"></i>
                <p>${image.title}</p>
            `;
            imgContainer.appendChild(placeholder);
        };
        
        imgContainer.appendChild(img);
        slide.appendChild(imgContainer);
        
        // Ajouter la légende
        const caption = document.createElement('div');
        caption.className = 'carousel-caption';
        caption.innerHTML = `
            <h4>${image.title}</h4>
            <p>${image.description}</p>
        `;
        slide.appendChild(caption);
        
        carouselTrack.appendChild(slide);
        
        // Créer l'indicateur
        const indicator = document.createElement('button');
        indicator.className = 'carousel-indicator';
        indicator.dataset.index = index;
        indicator.setAttribute('aria-label', `Aller à la diapositive ${index + 1}`);
        indicator.setAttribute('aria-controls', 'carouselTrack');
        
        if (index === 0) {
            indicator.classList.add('active');
            indicator.setAttribute('aria-current', 'true');
        }
        
        indicator.addEventListener('click', () => {
            scrollToSlide(index);
        });
        
        indicator.addEventListener('touchstart', (e) => {
            e.preventDefault();
            scrollToSlide(index);
        }, { passive: false });
        
        carouselIndicators.appendChild(indicator);
    });
}

function updateCarouselControls() {
    if (!carouselPrev || !carouselNext) return;
    
    carouselPrev.disabled = currentSlideIndex === 0;
    carouselNext.disabled = currentSlideIndex >= carouselImages.length - 1;
    
    carouselPrev.style.opacity = carouselPrev.disabled ? '0.5' : '1';
    carouselNext.style.opacity = carouselNext.disabled ? '0.5' : '1';
    
    document.querySelectorAll('.carousel-indicator').forEach((indicator, index) => {
        if (index === currentSlideIndex) {
            indicator.classList.add('active');
            indicator.setAttribute('aria-current', 'true');
        } else {
            indicator.classList.remove('active');
            indicator.removeAttribute('aria-current');
        }
    });
}

function setupCarouselEvents() {
    if (!carouselTrack || !carouselPrev || !carouselNext) return;
    
    // Bouton précédent
    carouselPrev.addEventListener('click', () => {
        if (currentSlideIndex > 0) {
            currentSlideIndex--;
            scrollToSlide(currentSlideIndex);
        }
    });
    
    // Bouton suivant
    carouselNext.addEventListener('click', () => {
        if (currentSlideIndex < carouselImages.length - 1) {
            currentSlideIndex++;
            scrollToSlide(currentSlideIndex);
        }
    });
    
    // Support tactile pour boutons
    carouselPrev.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (currentSlideIndex > 0) {
            currentSlideIndex--;
            scrollToSlide(currentSlideIndex);
        }
    }, { passive: false });
    
    carouselNext.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (currentSlideIndex < carouselImages.length - 1) {
            currentSlideIndex++;
            scrollToSlide(currentSlideIndex);
        }
    }, { passive: false });
    
    // Gestion du défilement tactile pour mobile
    carouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    carouselTrack.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
    }, { passive: true });
    
    carouselTrack.addEventListener('touchend', () => {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && currentSlideIndex < carouselImages.length - 1) {
                // Swipe gauche -> diapo suivante
                currentSlideIndex++;
            } else if (diff < 0 && currentSlideIndex > 0) {
                // Swipe droite -> diapo précédente
                currentSlideIndex--;
            }
            scrollToSlide(currentSlideIndex);
        }
    });
    
    carouselTrack.addEventListener('scroll', () => {
        updateActiveSlideIndex();
    });
}

function scrollToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides[index]) {
        if (isMobile) {
            const slideWidth = slides[index].offsetWidth;
            carouselTrack.scrollTo({
                left: slideWidth * index,
                behavior: 'smooth'
            });
        } else {
            slides[index].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
        currentSlideIndex = index;
        updateCarouselControls();
    }
}

function updateActiveSlideIndex() {
    const slides = document.querySelectorAll('.carousel-slide');
    const trackRect = carouselTrack.getBoundingClientRect();
    
    let closestSlide = null;
    let closestDistance = Infinity;
    
    slides.forEach((slide, index) => {
        const slideRect = slide.getBoundingClientRect();
        const slideCenter = slideRect.left + slideRect.width / 2;
        const trackCenter = trackRect.left + trackRect.width / 2;
        const distance = Math.abs(slideCenter - trackCenter);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestSlide = index;
        }
    });
    
    if (closestSlide !== null && closestSlide !== currentSlideIndex) {
        currentSlideIndex = closestSlide;
        updateCarouselControls();
    }
}

// =====================================================================
// FONCTIONS DU CAROUSEL "À PROPOS DE NOUS"
// =====================================================================
function initAboutCarousel() {
    const aboutSection = document.querySelector('#about');
    if (!aboutSection) return;
    
    let aboutCarouselContainer = aboutSection.querySelector('.about-carousel-container');
    
    if (!aboutCarouselContainer) {
        aboutCarouselContainer = document.createElement('div');
        aboutCarouselContainer.className = 'about-carousel-container';
        
        aboutCarouselTrack = document.createElement('div');
        aboutCarouselTrack.className = 'about-carousel-track';
        aboutCarouselTrack.id = 'aboutCarouselTrack';
        
        const indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'about-carousel-indicators';
        indicatorsContainer.id = 'aboutCarouselIndicators';
        
        aboutCarouselContainer.appendChild(aboutCarouselTrack);
        aboutCarouselContainer.appendChild(indicatorsContainer);
        
        const aboutContent = aboutSection.querySelector('.about-content');
        if (aboutContent) {
            aboutContent.appendChild(aboutCarouselContainer);
        } else {
            aboutSection.appendChild(aboutCarouselContainer);
        }
    }
    
    renderAboutCarousel();
    setupAboutCarouselEvents();
    startAboutCarousel();
}

function renderAboutCarousel() {
    if (!aboutCarouselTrack || !aboutCarouselIndicators) return;
    
    aboutCarouselTrack.innerHTML = '';
    aboutCarouselIndicators.innerHTML = '';
    
    aboutImages.forEach((imageUrl, index) => {
        const slide = document.createElement('div');
        slide.className = 'about-carousel-slide';
        slide.dataset.index = index;
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Image ${index + 1} de la section À propos`;
        img.loading = 'lazy';
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';
        
        img.onload = function() {
            this.style.opacity = '1';
        };
        
        img.onerror = function() {
            this.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.className = 'about-image-placeholder';
            placeholder.innerHTML = `
                <i class="fas fa-image"></i>
                <p>Image ${index + 1}</p>
            `;
            slide.appendChild(placeholder);
        };
        
        slide.appendChild(img);
        aboutCarouselTrack.appendChild(slide);
        
        const indicator = document.createElement('button');
        indicator.className = 'about-carousel-indicator';
        indicator.dataset.index = index;
        indicator.setAttribute('aria-label', `Aller à l'image ${index + 1}`);
        
        if (index === 0) {
            indicator.classList.add('active');
            indicator.setAttribute('aria-current', 'true');
        }
        
        indicator.addEventListener('click', () => {
            scrollToAboutSlide(index);
        });
        
        indicator.addEventListener('touchstart', (e) => {
            e.preventDefault();
            scrollToAboutSlide(index);
        }, { passive: false });
        
        aboutCarouselIndicators.appendChild(indicator);
    });
}

function startAboutCarousel() {
    if (aboutCarouselInterval) {
        clearInterval(aboutCarouselInterval);
    }
    
    aboutCarouselInterval = setInterval(() => {
        aboutCurrentSlideIndex = (aboutCurrentSlideIndex + 1) % aboutImages.length;
        scrollToAboutSlide(aboutCurrentSlideIndex);
    }, 4000);
}

function scrollToAboutSlide(index) {
    if (!aboutCarouselTrack) return;
    
    const slides = aboutCarouselTrack.querySelectorAll('.about-carousel-slide');
    if (slides[index]) {
        aboutCurrentSlideIndex = index;
        aboutCarouselTrack.style.transition = 'transform 0.5s ease-in-out';
        aboutCarouselTrack.style.transform = `translateX(-${index * 100}%)`;
        updateAboutCarouselIndicators();
    }
}

function updateAboutCarouselIndicators() {
    if (!aboutCarouselIndicators) return;
    
    const indicators = aboutCarouselIndicators.querySelectorAll('.about-carousel-indicator');
    indicators.forEach((indicator, index) => {
        if (index === aboutCurrentSlideIndex) {
            indicator.classList.add('active');
            indicator.setAttribute('aria-current', 'true');
        } else {
            indicator.classList.remove('active');
            indicator.removeAttribute('aria-current');
        }
    });
}

function setupAboutCarouselEvents() {
    if (!aboutCarouselTrack) return;
    
    aboutCarouselTrack.addEventListener('mouseenter', () => {
        if (aboutCarouselInterval) {
            clearInterval(aboutCarouselInterval);
        }
    });
    
    aboutCarouselTrack.addEventListener('mouseleave', () => {
        startAboutCarousel();
    });
    
    aboutCarouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    aboutCarouselTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && aboutCurrentSlideIndex < aboutImages.length - 1) {
                aboutCurrentSlideIndex++;
            } else if (diff < 0 && aboutCurrentSlideIndex > 0) {
                aboutCurrentSlideIndex--;
            }
            scrollToAboutSlide(aboutCurrentSlideIndex);
        }
    });
}

// =====================================================================
// FONCTIONS POUR LES IMAGES D'ÉQUIPE - CORRIGÉES POUR ÉVITER LA DISPARITION
// =====================================================================
function initTeamImages() {
    console.log('Initialisation des images d\'équipe...');
    
    // Attacher les événements aux images d'équipe
    const teamImages = document.querySelectorAll('.team-img');
    console.log(`Nombre d'images d'équipe trouvées: ${teamImages.length}`);
    
    teamImages.forEach((img, index) => {
        console.log(`Image ${index}: ${img.src}`);
        
        // Réinitialiser l'opacité pour éviter la disparition
        img.style.opacity = '0.5'; // Opacité temporaire pendant le chargement
        img.style.transition = 'opacity 0.5s ease';
        
        img.addEventListener('load', function() {
            console.log(`Image ${index} chargée: ${this.src}`);
            handleTeamImageLoad.call(this);
        });
        
        img.addEventListener('error', function() {
            console.error(`Erreur de chargement image ${index}: ${this.src}`);
            handleTeamImageError.call(this);
        });
        
        // Si l'image est déjà chargée, déclencher manuellement
        if (img.complete) {
            console.log(`Image ${index} déjà complète`);
            if (img.naturalHeight > 0) {
                handleTeamImageLoad.call(img);
            } else {
                handleTeamImageError.call(img);
            }
        }
    });
    
    // Optimiser les images d'équipe (avec un léger délai pour laisser le temps au DOM)
    setTimeout(() => {
        console.log('Optimisation des images d\'équipe...');
        optimizeTeamImages();
    }, 200);
}

function handleTeamImageLoad() {
    console.log('handleTeamImageLoad appelé pour:', this.src);
    
    // Toujours s'assurer que l'image reste visible
    this.style.opacity = '1';
    this.classList.add('loaded');
    
    const container = this.closest('.team-img-container');
    if (container) {
        container.classList.add('loaded');
        container.style.opacity = '1';
    }
}

function handleTeamImageError() {
    console.warn('Erreur de chargement de l\'image d\'équipe:', this.src);
    
    const container = this.closest('.team-img-container');
    if (container) {
        const placeholder = document.createElement('div');
        placeholder.className = 'team-img-placeholder';
        placeholder.innerHTML = `
            <i class="fas fa-user-circle"></i>
            <span>Photo non disponible</span>
        `;
        container.appendChild(placeholder);
    }
    
    // Au lieu de masquer complètement, garder une faible opacité
    this.style.opacity = '0.1';
    this.style.filter = 'grayscale(100%)';
}

function optimizeTeamImages() {
    console.log('optimizeTeamImages appelé, isMobile:', isMobile);
    
    const teamCards = document.querySelectorAll('.team-card');
    console.log(`Nombre de cartes d'équipe trouvées: ${teamCards.length}`);
    
    if (!teamCards.length) return;
    
    teamCards.forEach((card, index) => {
        console.log(`Optimisation carte ${index}...`);
        
        const imgContainer = card.querySelector('.team-img-container');
        if (!imgContainer) {
            console.warn(`Carte ${index} n'a pas de conteneur d'image`);
            return;
        }
        
        // 1. S'assurer que la carte est visible
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        card.style.display = 'block';
        
        // 2. Réinitialiser les styles du conteneur (MAIS PAS l'opacité)
        imgContainer.style.cssText = '';
        imgContainer.className = 'team-img-container';
        
        // 3. S'assurer que le conteneur est visible
        imgContainer.style.opacity = '1';
        imgContainer.style.visibility = 'visible';
        imgContainer.style.display = 'block';
        
        const img = imgContainer.querySelector('img');
        if (img) {
            console.log(`Image trouvée dans carte ${index}, src:`, img.src);
            
            // 4. Réinitialiser l'image (MAIS GARDER L'OPACITÉ)
            img.className = 'team-img';
            
            // FORCE LE CARRÉ ARRONDI - GRAND ET BIEN VISIBLE
            // 1. Conteneur carré GRAND
            if (isMobile) {
                // Sur mobile : GRAND carré de 220px avec arrondi de 15px
                imgContainer.style.width = '220px';
                imgContainer.style.height = '220px';
                imgContainer.style.margin = '0 auto 25px auto';
                imgContainer.style.borderRadius = '15px';
                imgContainer.style.border = '4px solid var(--primary-soft, rgba(0, 123, 255, 0.15))';
                imgContainer.style.overflow = 'hidden';
                imgContainer.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)';
                imgContainer.style.backgroundColor = 'var(--light-gray, #f8f9fa)';
            } else {
                // Sur desktop : TRÈS GRAND carré de 320px avec arrondi de 12px
                imgContainer.style.width = '100%';
                imgContainer.style.height = '320px'; // AUGMENTÉ
                imgContainer.style.margin = '0 0 25px 0';
                imgContainer.style.borderRadius = '12px';
                imgContainer.style.border = 'none';
                imgContainer.style.overflow = 'hidden';
                imgContainer.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
                imgContainer.style.backgroundColor = 'var(--light-gray, #f8f9fa)';
            }
            
            // 2. Image carrée arrondie - OPTIMISÉE POUR LA VISIBILITÉ
            img.style.objectFit = 'cover';
            img.style.objectPosition = 'center center'; // Position centrale optimale
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.borderRadius = isMobile ? '15px' : '12px';
            img.style.opacity = '1'; // FORCE L'OPACITÉ À 1
            img.style.visibility = 'visible';
            img.style.display = 'block';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            
            // 3. S'assurer que l'image est complètement chargée
            if (img.complete && img.naturalHeight > 0) {
                img.style.opacity = '1';
                img.classList.add('loaded');
            }
            
            // 4. Chargement lazy si manquant
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
        } else {
            console.warn(`Carte ${index} n'a pas d'image dans le conteneur`);
        }
        
        // 5. Centrer le contenu sur mobile
        if (isMobile) {
            const teamInfo = card.querySelector('.team-info');
            const socialLinks = card.querySelector('.team-social');
            
            if (teamInfo) {
                teamInfo.style.textAlign = 'center';
                teamInfo.style.padding = '20px 15px';
            }
            
            if (socialLinks) {
                socialLinks.style.justifyContent = 'center';
                socialLinks.style.marginTop = '20px';
            }
            
            // Centrer la carte entière sur mobile
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'center';
            card.style.maxWidth = '280px';
            card.style.margin = '0 auto 40px auto';
        } else {
            // Réinitialiser pour desktop
            const teamInfo = card.querySelector('.team-info');
            const socialLinks = card.querySelector('.team-social');
            
            if (teamInfo) {
                teamInfo.style.textAlign = '';
                teamInfo.style.padding = '';
            }
            
            if (socialLinks) {
                socialLinks.style.justifyContent = '';
                socialLinks.style.marginTop = '';
            }
            
            card.style.display = '';
            card.style.flexDirection = '';
            card.style.alignItems = '';
            card.style.maxWidth = '';
            card.style.margin = '';
        }
        
        // 6. Ajouter une animation d'apparition progressive
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 150);
        
        console.log(`Carte ${index} optimisée avec succès`);
    });
    
    console.log('Optimisation des images d\'équipe terminée');
}

// =====================================================================
// FONCTIONS POUR "À PROPOS DE NOUS"
// =====================================================================
function initAboutSection() {
    const aboutSection = document.querySelector('#about');
    if (!aboutSection) return;
    
    const stats = aboutSection.querySelectorAll('.stat-item');
    stats.forEach((stat, index) => {
        stat.style.opacity = '0';
        stat.style.transform = 'translateY(20px)';
        stat.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            if (isElementInViewport(stat)) {
                stat.style.opacity = '1';
                stat.style.transform = 'translateY(0)';
            }
        }, index * 100);
    });
}

// =====================================================================
// FONCTIONS POUR "NOTRE IMPACT"
// =====================================================================
function initImpactSection() {
    const impactSection = document.querySelector('#impact');
    if (!impactSection) return;
    
    const impactForm = impactSection.querySelector('.impact-form');
    if (impactForm) {
        optimizeImpactFormForMobile(impactForm);
    }
    
    const impactItems = impactSection.querySelectorAll('.impact-item');
    impactItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            if (isElementInViewport(item)) {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }
        }, index * 100);
    });
}

function optimizeImpactFormForMobile(form) {
    if (!form) return;
    
    if (isMobile) {
        form.style.padding = '20px';
        form.style.margin = '20px auto';
        form.style.maxWidth = '100%';
        form.style.boxSizing = 'border-box';
        
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.style.fontSize = '16px';
            input.style.padding = '12px';
            input.style.marginBottom = '15px';
            input.style.width = '100%';
            input.style.boxSizing = 'border-box';
        });
        
        const buttons = form.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.padding = '15px 25px';
            button.style.fontSize = '18px';
            button.style.width = '100%';
            button.style.borderRadius = '8px';
        });
    } else {
        form.style.cssText = '';
        
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.style.cssText = '';
        });
        
        const buttons = form.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.cssText = '';
        });
    }
}

// =====================================================================
// FONCTIONS POUR LES FORMULAIRES
// =====================================================================
function initForms() {
    initContactForm();
    initNewsletterForm();
    initDonationForms();
}

function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const data = {
            nom: document.getElementById('name')?.value,
            email: document.getElementById('email')?.value,
            sujet: document.getElementById('subject')?.value,
            motif: document.getElementById('reason')?.value,
            message: document.getElementById('message')?.value
        };
        
        if (!data.nom || !data.email || !data.message) {
            showToast('Veuillez remplir tous les champs obligatoires.', 'error');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showToast('Veuillez entrer une adresse email valide.', 'error');
            return;
        }
        
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            showToast(`Merci ${data.nom}, votre message a bien été enregistré ! Nous vous répondrons dans les plus brefs délais.`, 'success');
            contactForm.reset();
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 1500);
    });
    
    if (isMobile) {
        const inputs = contactForm.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.style.fontSize = '16px';
        });
    }
}

function initNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (!newsletterForm) return;
    
    const newsletterBtn = newsletterForm.querySelector('.newsletter-btn');
    const newsletterInput = newsletterForm.querySelector('.newsletter-input');
    
    if (!newsletterBtn || !newsletterInput) return;
    
    newsletterBtn.addEventListener('click', (e) => handleNewsletterSubmit(e, newsletterInput, newsletterBtn));
    newsletterInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            newsletterBtn.click();
        }
    });
}

function initDonationForms() {
    const donationButtons = document.querySelectorAll('[data-donation-type]');
    donationButtons.forEach(button => {
        button.addEventListener('click', () => {
            const type = button.getAttribute('data-donation-type');
            showDonationModal(type);
        });
        
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const type = button.getAttribute('data-donation-type');
            showDonationModal(type);
        }, { passive: false });
    });
}

// =====================================================================
// FONCTIONS UTILITAIRES
// =====================================================================
function checkMobileView() {
    isMobile = window.innerWidth <= 768;
    console.log('checkMobileView: isMobile =', isMobile, 'window width =', window.innerWidth);
}

function setActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 100;
    
    let currentSectionId = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentSectionId = sectionId;
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href')?.substring(1);
        if (href === currentSectionId) {
            link.classList.add('active');
        }
    });
}

function isElementInViewport(el) {
    if (!el) return false;
    
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    return (
        rect.top <= windowHeight * 0.85 &&
        rect.bottom >= 0
    );
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                if (entry.target.classList.contains('stat-number') || 
                    entry.target.classList.contains('impact-number')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.animate-on-scroll, .stat-number, .impact-number').forEach(el => {
        observer.observe(el);
    });
}

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number, .impact-number');
    counters.forEach(counter => {
        if (isElementInViewport(counter) && !counter.classList.contains('animated')) {
            animateCounter(counter);
            counter.classList.add('animated');
        }
    });
}

function animateCounter(counter) {
    const target = parseInt(counter.getAttribute('data-count')) || 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    
    let current = 0;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            counter.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            counter.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

function showDonationModal(type) {
    let title = '';
    let content = '';
    
    if (type === 'bank') {
        title = 'Faire un virement bancaire';
        content = `
            <div class="donation-info">
                <p>Pour effectuer un virement bancaire, veuillez utiliser les coordonnées suivantes :</p>
                <div class="bank-details">
                    <p><strong>Banque :</strong> Rawbank</p>
                    <p><strong>IBAN :</strong> CD08 01002 0500007194 89</p>
                    <p><strong>Code Swift :</strong> RAWBCDKI</p>
                    <p><strong>Titulaire :</strong> ORPHELIN PRIORITE ASBL</p>
                    <p><strong>Adresse :</strong> Q. Katindo, Avenue Masisi, N°26, Goma, RDC</p>
                </div>
                <p>Après avoir effectué votre virement, merci de nous envoyer un email à <strong>donations@orphelinpriorite.org</strong> avec votre nom et le montant du don pour que nous puissions vous envoyer un reçu.</p>
                <p class="donation-note"><strong>Note :</strong> Pour les dons supérieurs à 40€, un reçu fiscal vous sera délivré.</p>
            </div>
        `;
    } else if (type === 'mobile') {
        title = 'Donner via Mobile Money';
        content = `
            <div class="donation-info">
                <p>Pour effectuer un don via Mobile Money, veuillez utiliser l'un des numéros suivants :</p>
                <div class="mobile-money-details">
                    <p><strong>M-Pesa :</strong> +243 81 787 9584</p>
                    <p><strong>Airtel Money :</strong> +243 99 597 4028</p>
                    <p><strong>Orange Money :</strong> +243 97 000 0000</p>
                </div>
                <p><strong>Instructions :</strong></p>
                <ol>
                    <li>Accédez à l'application de votre opérateur mobile</li>
                    <li>Sélectionnez "Envoyer de l'argent"</li>
                    <li>Entrez le numéro correspondant à votre opérateur</li>
                    <li>Indiquez le montant de votre don</li>
                    <li>Dans le message, écrivez "DON ORPHELIN"</li>
                    <li>Validez la transaction</li>
                </ol>
                <p class="donation-note">Après votre don, vous pouvez nous envoyer un screenshot à <strong>+243 817 879 584</strong> sur WhatsApp pour recevoir un reçu.</p>
            </div>
        `;
    }
    
    if (donationModal) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalContent').innerHTML = content;
        donationModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (isMobile) {
            donationModal.style.padding = '20px';
        }
        
        setTimeout(() => {
            if (modalClose) modalClose.focus();
        }, 100);
    }
}

function openGalleryModal(galleryItem) {
    const img = galleryItem.querySelector('img') || galleryItem.querySelector('.fas');
    const title = galleryItem.querySelector('h4')?.textContent || galleryItem.querySelector('.gallery-title')?.textContent || '';
    const description = galleryItem.querySelector('p')?.textContent || galleryItem.querySelector('.gallery-description')?.textContent || '';
    
    if (img && galleryModalImg && galleryModalCaption && galleryModal) {
        if (img.tagName === 'IMG') {
            galleryModalImg.src = img.src;
            galleryModalImg.alt = img.alt;
            galleryModalImg.style.display = 'block';
        } else {
            galleryModalImg.style.display = 'none';
        }
        
        galleryModalCaption.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
        galleryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (isMobile) {
            galleryModal.style.padding = '10px';
            galleryModalImg.style.maxWidth = '90vw';
            galleryModalImg.style.maxHeight = '60vh';
        }
        
        setTimeout(() => {
            if (galleryModalClose) galleryModalClose.focus();
        }, 100);
    }
}

function showToast(message, type = 'success') {
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    toast.style.cssText = `
        position: fixed;
        bottom: ${isMobile ? '80px' : '20px'};
        right: ${isMobile ? '50%' : '20px'};
        transform: ${isMobile ? 'translateX(50%)' : 'none'};
        background: ${type === 'success' ? 'var(--success, #28a745)' :
                     type === 'warning' ? 'var(--warning, #ffc107)' :
                     type === 'error' ? 'var(--accent, #dc3545)' : 'var(--primary, #007bff)'};
        color: white;
        padding: ${isMobile ? '15px 20px' : '12px 20px'};
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: fadeIn 0.3s ease-out;
        font-size: ${isMobile ? '14px' : '16px'};
        text-align: center;
        max-width: ${isMobile ? '90vw' : '300px'};
        word-wrap: break-word;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 500);
    }, 3000);
}

// =====================================================================
// AJOUT DES STYLES DYNAMIQUES CORRIGÉS
// =====================================================================
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* ============ STYLES CARRÉS ARRONDIS - GRAND ET VISIBLE ============ */
        
        /* FORCE LA VISIBILITÉ DE BASE */
        .team-card,
        .team-img-container,
        .team-img {
            opacity: 1 !important;
            visibility: visible !important;
        }
        
        /* Conteneur de base - GRAND */
        .team-img-container {
            position: relative;
            background-color: var(--light-gray, #f8f9fa);
            transition: all 0.3s ease;
            opacity: 1 !important;
            visibility: visible !important;
        }
        
        /* Image de base - TOUJOURS VISIBLE */
        .team-img {
            display: block;
            transition: transform 0.3s ease, opacity 0.5s ease;
            opacity: 1 !important;
            visibility: visible !important;
            will-change: opacity, transform;
        }
        
        .team-img.loaded {
            opacity: 1 !important;
        }
        
        /* Placeholder pour images manquantes */
        .team-img-placeholder {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, var(--primary-light, #e3f2fd), var(--secondary-light, #f3e5f5));
            color: var(--gray, #666);
            font-size: 14px;
            text-align: center;
            z-index: 1;
            border-radius: inherit;
            opacity: 1 !important;
        }
        
        .team-img-placeholder i {
            font-size: 48px;
            margin-bottom: 8px;
            color: var(--primary, #007bff);
        }
        
        /* ============ MOBILE : TRÈS GRANDS CARRÉS ARRONDIS ============ */
        @media (max-width: 768px) {
            .team-img-container {
                width: 220px !important;
                height: 220px !important;
                border-radius: 15px !important;
                border: 4px solid var(--primary-soft, rgba(0, 123, 255, 0.15)) !important;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12) !important;
                margin: 0 auto 25px auto !important;
                background-color: var(--light-gray, #f8f9fa) !important;
            }
            
            .team-img {
                border-radius: 15px !important;
                object-fit: cover !important;
                object-position: center center !important;
                opacity: 1 !important;
            }
            
            /* Centrer les cartes sur mobile */
            .team-card {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                max-width: 280px !important;
                margin: 0 auto 40px auto !important;
                opacity: 1 !important;
            }
            
            .team-info {
                text-align: center !important;
                padding: 20px 15px !important;
            }
            
            .team-social {
                justify-content: center !important;
                margin-top: 20px !important;
            }
        }
        
        /* ============ DESKTOP : EXTRÊMEMENT GRANDS CARRÉS ARRONDIS ============ */
        @media (min-width: 769px) {
            .team-img-container {
                width: 100% !important;
                height: 320px !important; /* AUGMENTÉ */
                border-radius: 12px !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
                margin: 0 0 25px 0 !important;
                background-color: var(--light-gray, #f8f9fa) !important;
            }
            
            .team-img {
                border-radius: 12px !important;
                object-fit: cover !important;
                object-position: center center !important;
                opacity: 1 !important;
            }
        }
        
        /* ============ EFFETS D'INTERACTION AMÉLIORÉS ============ */
        .team-card:hover .team-img-container {
            transform: translateY(-8px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        }
        
        .team-card:hover .team-img {
            transform: scale(1.08);
        }
        
        /* ============ ANIMATIONS RENFORCÉES ============ */
        .team-card {
            opacity: 1 !important;
            transform: translateY(0) !important;
            transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease !important;
        }
        
        /* ============ STYLES POUR LE CAROUSEL "À PROPOS" ============ */
        .about-carousel-container {
            width: 100%;
            max-width: 800px;
            margin: 30px auto;
            overflow: hidden;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.1);
        }
        
        .about-carousel-track {
            display: flex;
            transition: transform 0.5s ease-in-out;
            height: 400px;
        }
        
        .about-carousel-slide {
            min-width: 100%;
            height: 100%;
            flex-shrink: 0;
        }
        
        .about-carousel-slide img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 12px;
            opacity: 1 !important;
            transition: opacity 0.5s ease;
        }
        
        .about-carousel-indicators {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
            padding: 10px;
        }
        
        .about-carousel-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--light, #f8f9fa);
            border: 2px solid var(--primary, #007bff);
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .about-carousel-indicator.active {
            background: var(--primary, #007bff);
            transform: scale(1.2);
        }
        
        /* ============ RESPONSIVE ADJUSTMENTS ============ */
        @media (max-width: 768px) {
            .about-carousel-track {
                height: 300px;
            }
            
            .about-carousel-indicator {
                width: 10px;
                height: 10px;
            }
            
            /* Ajustements supplémentaires pour très petits écrans */
            .team-img-container {
                width: 200px !important;
                height: 200px !important;
            }
        }
        
        @media (max-width: 576px) {
            .about-carousel-track {
                height: 250px;
            }
            
            .team-img-container {
                width: 180px !important;
                height: 180px !important;
                border-radius: 12px !important;
            }
            
            .team-img {
                border-radius: 12px !important;
            }
        }
        
        @media (max-width: 480px) {
            .team-img-container {
                width: 160px !important;
                height: 160px !important;
            }
        }
        
        /* ============ ANIMATIONS GÉNÉRALES ============ */
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .animate-on-scroll.visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* ============ TOAST ANIMATIONS ============ */
        @keyframes fadeIn {
            from { 
                opacity: 0; 
                transform: translateY(20px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }
        
        /* ============ SUPPORT THÈME SOMBRE ============ */
        [data-theme="dark"] .team-img-placeholder {
            background: linear-gradient(135deg, var(--dark-primary, #1a237e), var(--dark-secondary, #4a148c));
            color: var(--dark-text, #e0e0e0);
        }
        
        [data-theme="dark"] .team-img-placeholder i {
            color: var(--dark-accent, #64b5f6);
        }
        
        [data-theme="dark"] .team-img-container {
            border-color: var(--dark-primary-soft, rgba(100, 181, 246, 0.25));
            background-color: var(--dark-light-gray, #2a2a2a) !important;
        }
        
        [data-theme="dark"] .team-card:hover .team-img-container {
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
        }
    `;
    document.head.appendChild(style);
}

// Ajouter les styles dynamiques
addDynamicStyles();

// =====================================================================
// EXPOSITION DES FONCTIONS GLOBALES
// =====================================================================
window.showDonationModal = showDonationModal;
window.openGalleryModal = openGalleryModal;
window.optimizeImpactFormForMobile = optimizeImpactFormForMobile;
window.optimizeTeamImages = optimizeTeamImages;