// =====================================================================
// VARIABLES GLOBALES
// =====================================================================
let preloader, header, mobileMenuBtn, navMenu, navLinks, dropdowns, backToTopBtn;
let donationModal, modalClose, galleryModal, galleryModalClose, galleryModalImg, galleryModalCaption;
let contactForm, themeToggle;
let carouselTrack, carouselPrev, carouselNext, carouselIndicators;

// Données du carousel
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
    
    // Initialiser le carousel
    initCarousel();

    // Initialiser les images d'équipe centrées
    centerTeamImages();

    // -------------------------------------------------------------------------
    // AJOUT : Partie pour l'ENREGISTREMENT des messages dans Django
    // -------------------------------------------------------------------------
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const data = {
                nom: document.getElementById('name').value,
                email: document.getElementById('email').value,
                sujet: document.getElementById('subject').value,
                motif: document.getElementById('reason').value,
                message: document.getElementById('message').value
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

            try {
                const response = await fetch('/envoyer-contact/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    showToast("✅ Message envoyé avec succès !", 'success');
                    contactForm.reset();
                } else {
                    const errorData = await response.json();
                    showToast("❌ Erreur lors de l'envoi : " + (errorData.message || 'Erreur serveur'), 'error');
                }
            } catch (err) {
                showToast("❌ Erreur réseau : Impossible de contacter le serveur.", 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    // -------------------------------------------------------------------------
    
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
    
    // Contact form
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
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
    
    // Team images load
    const teamImages = document.querySelectorAll('.team-img');
    teamImages.forEach(img => {
        img.addEventListener('load', () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
        });
        
        if (img.complete) {
            img.classList.remove('loading');
            img.classList.add('loaded');
        }
    });

    // Redimensionnement de la fenêtre
    window.addEventListener('resize', handleResize);
}

// =====================================================================
// GESTIONNAIRES D'ÉVÉNEMENTS
// =====================================================================
function handleWindowLoad() {
    setTimeout(() => {
        if (preloader) preloader.classList.add('hidden');
        animateCounters();
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

function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('name')?.value;
    const email = document.getElementById('email')?.value;
    const subject = document.getElementById('subject')?.value;
    const reason = document.getElementById('reason')?.value;
    const message = document.getElementById('message')?.value;
    
    if (!name || !email || !reason || !message) {
        showToast('Veuillez remplir tous les champs obligatoires.', 'error');
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
    
    // Simulation d'envoi
    setTimeout(() => {
        showToast(`Merci ${name}, votre message a bien été enregistré ! Nous vous répondrons dans les plus brefs délais.`, 'success');
        contactForm.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 1500);
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
// FONCTIONS DU CAROUSEL - OPTIMISÉ MOBILE
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
// FONCTIONS UTILITAIRES
// =====================================================================
function checkMobileView() {
    isMobile = window.innerWidth <= 768;
}

function centerTeamImages() {
    const teamImageContainers = document.querySelectorAll('.team-img-container');
    teamImageContainers.forEach(container => {
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.margin = '0 auto';
        
        const img = container.querySelector('img');
        if (img) {
            img.style.objectFit = 'cover';
            img.style.objectPosition = 'center';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.maxWidth = '250px';
            img.style.maxHeight = '250px';
            img.style.borderRadius = '50%';
        }
    });
    
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach(member => {
        member.style.textAlign = 'center';
        member.style.display = 'flex';
        member.style.flexDirection = 'column';
        member.style.alignItems = 'center';
    });
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
        } else {
            galleryModalImg.style.display = 'none';
        }
        
        galleryModalCaption.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
        galleryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Ajuster le style pour mobile
        if (isMobile) {
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
// FONCTIONS POUR "À PROPOS DE NOUS"
// =====================================================================
function initAboutSection() {
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
        // Ajouter des classes pour le responsive
        const aboutContent = aboutSection.querySelector('.about-content');
        if (aboutContent) {
            aboutContent.classList.add('mobile-optimized');
        }
        
        // Optimiser les images dans la section about
        const aboutImages = aboutSection.querySelectorAll('img');
        aboutImages.forEach(img => {
            img.loading = 'lazy';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
        });
        
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
}

// =====================================================================
// EXPOSITION DES FONCTIONS GLOBALES
// =====================================================================
window.showDonationModal = showDonationModal;
window.openGalleryModal = openGalleryModal;

// Initialiser la section "À propos" quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initAboutSection);