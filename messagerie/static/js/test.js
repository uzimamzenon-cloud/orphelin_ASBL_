// =====================================================================
// VARIABLES GLOBALES
// =====================================================================
// Note: On utilise des URLs relatives (ex: '/envoyer-contact/') au lieu d'URL absolues
// car l'URL absolue '127.0.0.1' ne fonctionne pas sur téléphone mobile

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
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM chargé - Initialisation du site');

    // Afficher immédiatement le contenu de base
    document.body.classList.remove('no-js');
    if (preloader) {
        preloader.style.opacity = '1';
    }

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

    // Initialiser les images d'équipe (sans délai)
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
    }, 100);

    console.log('Site initialisé avec succès');
});

// =====================================================================
// FONCTIONS UTILITAIRES POUR CSRF TOKEN
// =====================================================================
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

function getCSRFToken() {
    let token = getCookie('csrftoken');
    if (!token) {
        // Fallback: chercher dans le DOM
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        if (csrfInput) token = csrfInput.value;
    }
    return token;
}

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

    // Injecter les styles dynamiques
    addDynamicStyles();
}

// =====================================================================
// PRELOADER CORRIGÉ
// =====================================================================
function initPreloader() {
    // Fonction pour masquer le preloader
    const hidePreloader = () => {
        if (preloader && !preloader.classList.contains('hidden')) {
            preloader.style.transition = 'opacity 0.5s ease';
            preloader.style.opacity = '0';

            setTimeout(() => {
                preloader.style.display = 'none';
                preloader.classList.add('hidden');

                // Démarrer les animations
                animateCounters();
                startAboutCarousel();
                optimizeTeamImages();
            }, 500);
        }
    };

    // Masquer après chargement (avec délai)
    window.addEventListener('load', function () {
        setTimeout(hidePreloader, 500);
    });

    // Fallback: si déjà chargé
    if (document.readyState === 'complete') {
        setTimeout(hidePreloader, 300);
    }

    // SÉCURITÉ : Forcer la fermeture après 5 secondes max (si le load plante)
    setTimeout(hidePreloader, 5000);
}

// =====================================================================
// CONFIGURATION DES ÉVÉNEMENTS
// =====================================================================
function setupEventListeners() {
    // Preloader
    initPreloader();

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
    const email = input.value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && emailRegex.test(email)) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        // Envoyer au backend Django
        fetch('/envoyer-newsletter/', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCSRFToken() || ''
            },
            body: JSON.stringify({ email: email })
        })
            .then(response => {
                console.log('Newsletter response status:', response.status);
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Erreur ${response.status}: ${text}`);
                    });
                }
                return response.json();
            })
            .then(result => {
                if (result.status === 'success') {
                    showToast(result.message || `Merci pour votre inscription!`, 'success');
                    input.value = '';
                } else if (result.status === 'warning') {
                    showToast(result.message, 'warning');
                } else {
                    showToast(result.message || 'Erreur lors de l\'inscription.', 'error');
                }
            })
            .catch(error => {
                console.error('Erreur newsletter:', error);
                showToast('Erreur de connexion au serveur: ' + error.message, 'error');
            })
            .finally(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
    } else {
        showToast('Veuillez entrer une adresse email valide.', 'error');
    }
}

function handleOutsideClick(e) {
    // Mobile menu
    const isMobileView = window.innerWidth <= 992;
    if (isMobileView && navMenu && mobileMenuBtn &&
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

    // Ré-optimiser les images d'équipe
    optimizeTeamImages();

    // Ré-optimiser le formulaire d'impact pour mobile
    const impactForm = document.querySelector('#impact .impact-form');
    if (impactForm) {
        optimizeImpactFormForMobile(impactForm);
    }

    // Réinitialiser le carousel "À propos" pour mobile
    updateAboutCarouselForMobile();
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

        img.onload = function () {
            this.style.opacity = '1';
        };

        img.onerror = function () {
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
// FONCTIONS DU CAROUSEL "À PROPOS DE NOUS" - CORRIGÉES
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

        img.onload = function () {
            this.style.opacity = '1';
        };

        img.onerror = function () {
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

    // Initialiser pour mobile
    updateAboutCarouselForMobile();
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

        if (isMobile) {
            // Pour mobile: défilement horizontal
            aboutCarouselTrack.style.transform = `translateX(-${index * 100}%)`;
        } else {
            // Pour desktop: transition normale
            aboutCarouselTrack.style.transform = `translateX(-${index * 100}%)`;
        }

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
        if (aboutCarouselInterval) {
            clearInterval(aboutCarouselInterval);
        }
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

        // Redémarrer le carousel après interaction tactile
        setTimeout(() => {
            startAboutCarousel();
        }, 3000);
    });
}

function updateAboutCarouselForMobile() {
    if (!aboutCarouselTrack) return;

    if (isMobile) {
        // Mode mobile: layout horizontal avec scroll
        aboutCarouselTrack.style.display = 'flex';
        aboutCarouselTrack.style.flexWrap = 'nowrap';
        aboutCarouselTrack.style.overflowX = 'auto';
        aboutCarouselTrack.style.scrollSnapType = 'x mandatory';
        aboutCarouselTrack.style.scrollBehavior = 'smooth';
        aboutCarouselTrack.style.webkitOverflowScrolling = 'touch';

        const slides = aboutCarouselTrack.querySelectorAll('.about-carousel-slide');
        slides.forEach(slide => {
            slide.style.flex = '0 0 auto';
            slide.style.width = '100%';
            slide.style.scrollSnapAlign = 'start';
            slide.style.scrollSnapStop = 'always';
        });

        // S'assurer que l'indicateur actuel est visible
        scrollToAboutSlide(aboutCurrentSlideIndex);
    } else {
        // Mode desktop: transition normale
        aboutCarouselTrack.style.display = 'flex';
        aboutCarouselTrack.style.overflow = 'hidden';
        aboutCarouselTrack.style.scrollSnapType = '';

        const slides = aboutCarouselTrack.querySelectorAll('.about-carousel-slide');
        slides.forEach(slide => {
            slide.style.flex = '0 0 100%';
            slide.style.width = '100%';
            slide.style.scrollSnapAlign = '';
        });
    }
}

// =====================================================================
// FONCTIONS POUR LES IMAGES D'ÉQUIPE - SIMPLIFIÉES
// =====================================================================
function initTeamImages() {
    const teamImages = document.querySelectorAll('.team-img');

    teamImages.forEach((img) => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';

        if (img.complete) {
            img.style.opacity = '1';
        } else {
            img.addEventListener('load', function () {
                this.style.opacity = '1';
            });

            img.addEventListener('error', function () {
                this.style.opacity = '1';
                const container = this.closest('.team-img-container');
                if (container) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'team-img-placeholder';
                    placeholder.innerHTML = `
                        <i class="fas fa-user"></i>
                        <span>Photo non disponible</span>
                    `;
                    container.appendChild(placeholder);
                }
            });
        }
    });

    // Optimiser après un court délai
    setTimeout(optimizeTeamImages, 100);
}

function optimizeTeamImages() {
    const teamCards = document.querySelectorAll('.team-card');

    if (!teamCards.length) return;

    teamCards.forEach((card, index) => {
        const imgContainer = card.querySelector('.team-img-container');
        if (!imgContainer) return;

        // S'assurer que le conteneur est visible
        imgContainer.style.opacity = '1';
        imgContainer.style.visibility = 'visible';

        const img = imgContainer.querySelector('img');
        if (img) {
            // Forcer l'affichage de l'image
            img.style.opacity = '1';
            img.style.visibility = 'visible';

            // Styles responsives
            if (isMobile) {
                imgContainer.style.width = '180px';
                imgContainer.style.height = '180px';
                imgContainer.style.margin = '0 auto 20px auto';
                imgContainer.style.borderRadius = '12px';
                imgContainer.style.overflow = 'hidden';

                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '12px';
            } else {
                imgContainer.style.width = '100%';
                imgContainer.style.height = '280px';
                imgContainer.style.borderRadius = '10px';
                imgContainer.style.overflow = 'hidden';
                imgContainer.style.marginBottom = '20px';

                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '10px';
            }
        }

        // Animation d'apparition
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
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
// FONCTIONS POUR LES FORMULAIRES - VERSION SIMPLIFIÉE ET CORRIGÉE
// =====================================================================
function initForms() {
    initContactForm();
    initNewsletterForm();
    initDonationForms();
}

function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) {
        console.log('Formulaire de contact non trouvé');
        return;
    }

    console.log('Initialisation du formulaire de contact...');

    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('Soumission du formulaire détectée');

        // Récupération des éléments
        const nameInput = document.getElementById('contact-name');
        const emailInput = document.getElementById('contact-email');
        const subjectInput = document.getElementById('contact-subject');
        const reasonInput = document.getElementById('contact-reason');
        const messageInput = document.getElementById('contact-message');

        // Récupération des valeurs
        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const subject = subjectInput ? subjectInput.value.trim() : '';
        const reason = reasonInput ? reasonInput.value : '';
        const message = messageInput ? messageInput.value.trim() : '';

        console.log('Données récupérées:', { name, email, subject, reason, message });

        // Validation détaillée
        let errors = [];
        if (!name) errors.push('Nom manquant');
        if (!email) errors.push('Email manquant');
        if (!message) errors.push('Message manquant');

        if (errors.length > 0) {
            console.warn('Erreurs de validation:', errors);
            showToast('Veuillez remplir tous les champs obligatoires (Nom, Email, Message).', 'error');

            // Mettre en évidence les champs manquants
            if (!name && nameInput) nameInput.classList.add('is-invalid');
            if (!email && emailInput) emailInput.classList.add('is-invalid');
            if (!message && messageInput) messageInput.classList.add('is-invalid');

            // Retirer la classe invalid au focus
            [nameInput, emailInput, messageInput].forEach(input => {
                if (input) {
                    input.addEventListener('input', () => input.classList.remove('is-invalid'), { once: true });
                }
            });

            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Veuillez entrer une adresse email valide.', 'error');
            return;
        }

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        submitBtn.disabled = true;

        try {
            // Préparer les données
            const data = {
                nom: name,
                email: email,
                sujet: subject || "Sans sujet",
                motif: reason || "Information",
                message: message
            };

            const csrfToken = getCSRFToken();
            console.log('Données à envoyer:', data);
            console.log('CSRF Token:', csrfToken);

            if (!csrfToken) {
                console.warn('ATTENTION: Token CSRF non trouvé !');
            }

            // Envoi AJAX à Django
            const response = await fetch('/envoyer-contact/', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken || ''
                },
                body: JSON.stringify(data)
            });

            console.log('Statut de la réponse:', response.status);

            if (response.ok) {
                const result = await response.json();
                if (result.status === 'success' || result.success) {
                    showToast(`Merci ${name}, votre message a bien été enregistré !`, 'success');
                    contactForm.reset();
                } else {
                    showToast(result.message || 'Erreur lors de l\'envoi.', 'error');
                }
            } else {
                showToast(`Erreur serveur (${response.status}). Veuillez réessayer.`, 'error');
            }
        } catch (error) {
            console.error('Erreur d\'envoi:', error);
            showToast('Erreur de connexion au serveur.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
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
    console.log('Mode mobile:', isMobile, 'Largeur:', window.innerWidth);
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
        background: ${type === 'success' ? '#28a745' :
            type === 'warning' ? '#ffc107' :
                type === 'error' ? '#dc3545' : '#007bff'};
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
        /* ============ PRELOADER ============ */
        #preloader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--light, #f8f9fa);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            transition: opacity 0.5s ease;
        }
        
        #preloader.hidden {
            opacity: 0;
            pointer-events: none;
        }
        
        .preloader-content {
            text-align: center;
        }
        
        .preloader-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid var(--light-gray, #e9ecef);
            border-top: 3px solid var(--primary, #007bff);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* ============ CAROUSEL "À PROPOS" RESPONSIVE ============ */
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
        
        /* ============ RESPONSIVE MOBILE ============ */
        @media (max-width: 768px) {
            .about-carousel-track {
                height: 300px;
            }
            
            .about-carousel-container {
                border-radius: 8px;
            }
            
            .about-carousel-slide img {
                border-radius: 8px;
            }
            
            /* Mode scroll tactile pour mobile */
            .about-carousel-track {
                overflow-x: auto;
                scroll-snap-type: x mandatory;
                -webkit-overflow-scrolling: touch;
            }
            
            .about-carousel-slide {
                scroll-snap-align: start;
                scroll-snap-stop: always;
            }
        }
        
        @media (max-width: 480px) {
            .about-carousel-track {
                height: 250px;
            }
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
        
        /* ============ NO-JS FALLBACK ============ */
        .no-js #preloader {
            display: none;
        }
        
        .no-js .js-only {
            display: none;
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