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
    initTeamImages();

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
    
    // Redimensionnement de la fenêtre
    window.addEventListener('resize', handleResize);

    // Optimiser les images d'équipe au redimensionnement
    window.addEventListener('resize', optimizeTeamImages);
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
    
    // Ré-optimiser le formulaire d'impact pour mobile
    const impactForm = document.querySelector('#impact .impact-form');
    if (impactForm) {
        optimizeImpactFormForMobile(impactForm);
    }
    
    // Ré-optimiser les images d'équipe
    optimizeTeamImages();
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
// FONCTIONS DU CAROUSEL PRINCIPAL - OPTIMISÉ MOBILE
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
        
        // Créer l'indicateur (plus gros sur mobile)
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
        
        // Support tactile pour indicateurs
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
    
    // Gestion du défilement horizontal avec molette
    carouselTrack.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            return;
        }
        
        e.preventDefault();
        carouselTrack.scrollLeft += e.deltaY;
        updateActiveSlideIndex();
    }, { passive: false });
    
    // Mettre à jour l'index de la diapositive active
    carouselTrack.addEventListener('scroll', () => {
        updateActiveSlideIndex();
    });
}

function scrollToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides[index]) {
        // Sur mobile, utilisation de scrollTo pour meilleure compatibilité
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
    // Vérifier si le conteneur existe, sinon le créer
    const aboutSection = document.querySelector('#about');
    if (!aboutSection) return;
    
    let aboutCarouselContainer = aboutSection.querySelector('.about-carousel-container');
    
    if (!aboutCarouselContainer) {
        // Créer le conteneur du carousel
        aboutCarouselContainer = document.createElement('div');
        aboutCarouselContainer.className = 'about-carousel-container';
        
        // Créer la piste du carousel
        aboutCarouselTrack = document.createElement('div');
        aboutCarouselTrack.className = 'about-carousel-track';
        aboutCarouselTrack.id = 'aboutCarouselTrack';
        
        // Créer les indicateurs
        const indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'about-carousel-indicators';
        indicatorsContainer.id = 'aboutCarouselIndicators';
        
        aboutCarouselContainer.appendChild(aboutCarouselTrack);
        aboutCarouselContainer.appendChild(indicatorsContainer);
        
        // Ajouter le carousel à la section about
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
        // Créer la diapositive
        const slide = document.createElement('div');
        slide.className = 'about-carousel-slide';
        slide.dataset.index = index;
        
        // Créer l'image
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Image ${index + 1} de la section À propos`;
        img.loading = 'lazy';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '12px';
        
        img.onerror = function() {
            this.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.className = 'about-image-placeholder';
            placeholder.style.cssText = `
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background: linear-gradient(135deg, var(--primary-light), var(--secondary));
                color: white;
                border-radius: 12px;
            `;
            placeholder.innerHTML = `
                <i class="fas fa-image" style="font-size: 48px; margin-bottom: 10px;"></i>
                <p style="font-size: 16px; text-align: center;">Image ${index + 1}</p>
            `;
            slide.appendChild(placeholder);
        };
        
        slide.appendChild(img);
        aboutCarouselTrack.appendChild(slide);
        
        // Créer l'indicateur
        const indicator = document.createElement('button');
        indicator.className = 'about-carousel-indicator';
        indicator.dataset.index = index;
        indicator.setAttribute('aria-label', `Aller à l'image ${index + 1}`);
        indicator.style.cssText = `
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--light, #f8f9fa);
            border: 2px solid var(--primary, #007bff);
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 0 5px;
        `;
        
        if (index === 0) {
            indicator.classList.add('active');
            indicator.setAttribute('aria-current', 'true');
            indicator.style.background = 'var(--primary, #007bff)';
            indicator.style.transform = 'scale(1.2)';
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
    // Arrêter tout intervalle existant
    if (aboutCarouselInterval) {
        clearInterval(aboutCarouselInterval);
    }
    
    // Démarrer le défilement automatique
    aboutCarouselInterval = setInterval(() => {
        aboutCurrentSlideIndex = (aboutCurrentSlideIndex + 1) % aboutImages.length;
        scrollToAboutSlide(aboutCurrentSlideIndex);
    }, 4000); // Change toutes les 4 secondes
}

function scrollToAboutSlide(index) {
    if (!aboutCarouselTrack) return;
    
    const slides = aboutCarouselTrack.querySelectorAll('.about-carousel-slide');
    if (slides[index]) {
        aboutCurrentSlideIndex = index;
        
        // Animation de transition
        aboutCarouselTrack.style.transition = 'transform 0.5s ease-in-out';
        aboutCarouselTrack.style.transform = `translateX(-${index * 100}%)`;
        
        // Mettre à jour les indicateurs
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
            indicator.style.background = 'var(--primary, #007bff)';
            indicator.style.transform = 'scale(1.2)';
        } else {
            indicator.classList.remove('active');
            indicator.removeAttribute('aria-current');
            indicator.style.background = 'var(--light, #f8f9fa)';
            indicator.style.transform = 'scale(1)';
        }
    });
}

function setupAboutCarouselEvents() {
    if (!aboutCarouselTrack) return;
    
    // Arrêter le défilement automatique au survol
    aboutCarouselTrack.addEventListener('mouseenter', () => {
        if (aboutCarouselInterval) {
            clearInterval(aboutCarouselInterval);
        }
    });
    
    // Reprendre le défilement automatique quand la souris quitte
    aboutCarouselTrack.addEventListener('mouseleave', () => {
        startAboutCarousel();
    });
    
    // Support tactile pour mobile
    aboutCarouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    aboutCarouselTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && aboutCurrentSlideIndex < aboutImages.length - 1) {
                // Swipe gauche -> image suivante
                aboutCurrentSlideIndex++;
            } else if (diff < 0 && aboutCurrentSlideIndex > 0) {
                // Swipe droite -> image précédente
                aboutCurrentSlideIndex--;
            }
            scrollToAboutSlide(aboutCurrentSlideIndex);
        }
    });
}

// =====================================================================
// FONCTIONS POUR LES IMAGES D'ÉQUIPE
// =====================================================================
function initTeamImages() {
    optimizeTeamImages();
    
    // Observer le chargement des images d'équipe
    const teamImages = document.querySelectorAll('.team-img');
    teamImages.forEach(img => {
        img.addEventListener('load', handleTeamImageLoad);
        
        if (img.complete) {
            handleTeamImageLoad.call(img);
        }
    });
}

function handleTeamImageLoad() {
    this.style.opacity = '1';
    this.style.transform = 'scale(1)';
    
    // Ajouter une transition pour un effet doux
    this.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
}

function optimizeTeamImages() {
    const teamCards = document.querySelectorAll('.team-card');
    if (!teamCards.length) return;
    
    teamCards.forEach(card => {
        const imgContainer = card.querySelector('.team-img-container');
        if (!imgContainer) return;
        
        const img = imgContainer.querySelector('img');
        
        if (isMobile) {
            // Style pour mobile
            imgContainer.style.cssText = `
                position: relative;
                width: 200px;
                height: 200px;
                margin: 0 auto 20px auto;
                border-radius: 50%;
                overflow: hidden;
                border: 4px solid var(--primary-soft);
                box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                display: flex;
                justify-content: center;
                align-items: center;
            `;
            
            if (img) {
                img.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    transition: transform 0.3s ease;
                `;
            }
            
            // Centrer le contenu de la carte
            const teamInfo = card.querySelector('.team-info');
            if (teamInfo) {
                teamInfo.style.textAlign = 'center';
                teamInfo.style.padding = '20px 15px';
            }
            
            // Centrer les icônes sociales
            const socialLinks = card.querySelector('.team-social');
            if (socialLinks) {
                socialLinks.style.justifyContent = 'center';
                socialLinks.style.marginTop = '15px';
            }
        } else {
            // Style pour desktop
            imgContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: 350px;
                border-radius: 12px 12px 0 0;
                overflow: hidden;
            `;
            
            if (img) {
                img.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    transition: transform 0.3s ease;
                `;
            }
        }
    });
}

// =====================================================================
// FONCTIONS POUR "À PROPOS DE NOUS"
// =====================================================================
function initAboutSection() {
    const aboutSection = document.querySelector('#about');
    if (!aboutSection) return;
    
    // Optimiser les éléments pour le responsive
    const aboutContent = aboutSection.querySelector('.about-content');
    if (aboutContent) {
        aboutContent.classList.add('mobile-optimized');
    }
    
    // Animer les statistiques
    const stats = aboutSection.querySelectorAll('.stat-item');
    stats.forEach(stat => {
        stat.style.opacity = '0';
        stat.style.transform = 'translateY(20px)';
        stat.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Observer pour l'animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = Array.from(stats).indexOf(entry.target);
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });
    
    stats.forEach(stat => observer.observe(stat));
}

// =====================================================================
// FONCTIONS POUR "NOTRE IMPACT"
// =====================================================================
function initImpactSection() {
    const impactSection = document.querySelector('#impact');
    if (!impactSection) return;
    
    // Optimiser pour mobile
    const impactForm = impactSection.querySelector('.impact-form');
    if (impactForm) {
        optimizeImpactFormForMobile(impactForm);
    }
    
    // Animer les éléments d'impact
    const impactItems = impactSection.querySelectorAll('.impact-item');
    impactItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Observer pour l'animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = Array.from(impactItems).indexOf(entry.target);
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });
    
    impactItems.forEach(item => observer.observe(item));
}

function optimizeImpactFormForMobile(form) {
    if (!form) return;
    
    if (isMobile) {
        // Style pour mobile
        form.style.cssText = `
            padding: 20px;
            margin: 20px auto;
            max-width: 100%;
            width: 100%;
            box-sizing: border-box;
        `;
        
        // Optimiser les champs de formulaire
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.style.cssText = `
                font-size: 16px;
                padding: 12px;
                margin-bottom: 15px;
                width: 100%;
                box-sizing: border-box;
                border-radius: 8px;
                border: 1px solid var(--border-color);
            `;
        });
        
        // Optimiser les boutons
        const buttons = form.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.cssText = `
                padding: 15px 25px;
                font-size: 18px;
                width: 100%;
                border-radius: 8px;
                background: var(--secondary);
                color: white;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            
            button.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });
            
            button.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
            });
        });
        
        // Optimiser les labels
        const labels = form.querySelectorAll('label');
        labels.forEach(label => {
            label.style.cssText = `
                display: block;
                margin-bottom: 8px;
                font-size: 16px;
                font-weight: bold;
                color: var(--text-primary);
            `;
        });
        
        // Optimiser les groupes de formulaire
        const formGroups = form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.style.marginBottom = '20px';
        });
    } else {
        // Réinitialiser pour desktop
        form.style.cssText = '';
        
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.style.cssText = '';
        });
        
        const buttons = form.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.cssText = '';
            button.removeEventListener('touchstart', null);
            button.removeEventListener('touchend', null);
        });
        
        const labels = form.querySelectorAll('label');
        labels.forEach(label => {
            label.style.cssText = '';
        });
        
        const formGroups = form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.style.marginBottom = '';
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
        
        // Validation
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
        
        // Simulation d'envoi
        setTimeout(() => {
            showToast(`Merci ${data.nom}, votre message a bien été enregistré ! Nous vous répondrons dans les plus brefs délais.`, 'success');
            contactForm.reset();
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 1500);
    });
    
    // Optimiser pour mobile
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

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number, .impact-number');
    counters.forEach(counter => {
        if (isElementInViewport(counter) && !counter.classList.contains('animated')) {
            counter.classList.add('animated');
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
    });
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
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
        
        // Ajuster le style pour mobile
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
        
        // Ajuster le style pour mobile
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
    // Supprimer les toasts existants
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    // Style responsive
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
// AJOUT DES STYLES DYNAMIQUES
// =====================================================================
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Styles pour le carousel "À propos de nous" */
        .about-carousel-container {
            width: 100%;
            max-width: 800px;
            margin: 30px auto;
            overflow: hidden;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.1);
            position: relative;
        }
        
        .about-carousel-track {
            display: flex;
            transition: transform 0.5s ease-in-out;
            height: 400px;
        }
        
        .about-carousel-slide {
            min-width: 100%;
            height: 100%;
            position: relative;
            flex-shrink: 0;
        }
        
        .about-carousel-indicators {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
            padding: 10px;
        }
        
        /* Styles responsive pour les images d'équipe */
        @media (max-width: 768px) {
            .team-card {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                margin: 20px auto;
                max-width: 300px;
            }
            
            .team-img-container {
                width: 200px !important;
                height: 200px !important;
                margin: 0 auto 20px auto !important;
                border-radius: 50% !important;
                overflow: hidden !important;
                border: 4px solid var(--primary-soft) !important;
                box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important;
            }
            
            .team-img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                object-position: center !important;
                transition: transform 0.3s ease !important;
            }
            
            .team-card:hover .team-img {
                transform: scale(1.05) !important;
            }
            
            .team-info {
                padding: 20px 15px !important;
                text-align: center !important;
            }
            
            .team-social {
                justify-content: center !important;
                margin-top: 15px !important;
            }
            
            .team-social a {
                width: 40px !important;
                height: 40px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            
            /* Ajustements pour le carousel "À propos" sur mobile */
            .about-carousel-track {
                height: 300px !important;
            }
            
            .about-carousel-indicator {
                width: 10px !important;
                height: 10px !important;
            }
            
            /* Formulaire d'impact sur mobile */
            .impact-form {
                padding: 15px !important;
                margin: 15px 0 !important;
            }
            
            .impact-form input,
            .impact-form textarea,
            .impact-form select,
            .impact-form button {
                font-size: 16px !important;
                padding: 14px !important;
                margin-bottom: 12px !important;
            }
            
            .impact-form button {
                padding: 16px !important;
                font-size: 18px !important;
            }
            
            .impact-form label {
                font-size: 16px !important;
                margin-bottom: 10px !important;
            }
        }
        
        @media (max-width: 576px) {
            .team-img-container {
                width: 180px !important;
                height: 180px !important;
            }
            
            .about-carousel-track {
                height: 250px !important;
            }
        }
        
        @media (max-width: 480px) {
            .team-img-container {
                width: 160px !important;
                height: 160px !important;
            }
        }
        
        /* Animation pour les éléments qui apparaissent au scroll */
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .animate-on-scroll.visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Placeholder pour les images */
        .image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: var(--light-gray, #e9ecef);
            color: var(--gray, #6c757d);
            border-radius: 8px;
        }
        
        .image-placeholder i {
            font-size: 48px;
            margin-bottom: 10px;
        }
        
        /* Toast animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Améliorations pour les cartes d'équipe */
        .team-card:hover {
            transform: translateY(-5px);
            transition: transform 0.3s ease;
        }
        
        .team-social a:hover {
            transform: translateY(-3px);
            transition: transform 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Ajouter les styles dynamiques au chargement
addDynamicStyles();

// =====================================================================
// EXPOSITION DES FONCTIONS GLOBALES
// =====================================================================
window.showDonationModal = showDonationModal;
window.openGalleryModal = openGalleryModal;
window.optimizeImpactFormForMobile = optimizeImpactFormForMobile;
window.optimizeTeamImages = optimizeTeamImages;