// =====================================================================
// SITE WEB ORPHELIN PRIORITÉ ASBL - SCRIPT PRINCIPAL
// Version: 3.0.0 | Date: 2024
// Auteur: Développeur Backend Senior
// =====================================================================

'use strict';

// =====================================================================
// CONFIGURATION GLOBALE
// =====================================================================
const CONFIG = {
    DEBUG_MODE: window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('dev'),
    API_ENDPOINTS: {
        CONTACT: '/envoyer-contact/',
        NEWSLETTER: '/newsletter/',
        DONATION: '/api/donations/',
        ANALYTICS: '/api/analytics/'
    },
    TIMEOUTS: {
        PRELOADER: 1000,
        CAROUSEL_AUTO: 5000,
        TOAST_DURATION: 5000,
        ANIMATION_DELAY: 50,
        DEBOUNCE_RESIZE: 250,
        DEBOUNCE_SCROLL: 50,
        RETRY_DELAY: 2000
    },
    BREAKPOINTS: {
        MOBILE: 768,
        TABLET: 992,
        DESKTOP: 1200
    },
    VALIDATION: {
        EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        PHONE_REGEX: /^[\+]?[0-9\s\-\(\)]{10,}$/,
        NAME_MIN_LENGTH: 2,
        MESSAGE_MIN_LENGTH: 10,
        PASSWORD_MIN_LENGTH: 8
    },
    LOCAL_STORAGE_KEYS: {
        THEME: 'orphelin_theme',
        USER_PREFERENCES: 'orphelin_prefs',
        FORM_DATA: 'orphelin_form_cache',
        SESSION_ID: 'orphelin_session'
    },
    PERFORMANCE: {
        LAZY_LOAD_THRESHOLD: 0.3,
        IMAGE_LOAD_TIMEOUT: 10000,
        MAX_CACHE_SIZE: 50,
        REQUEST_TIMEOUT: 30000
    },
    ANALYTICS: {
        TRACK_EVENTS: true,
        PAGE_VIEWS: true,
        FORM_INTERACTIONS: true,
        ERROR_TRACKING: true
    }
};

// =====================================================================
// ÉTAT GLOBAL DE L'APPLICATION
// =====================================================================
const APP_STATE = {
    // État général
    isInitialized: false,
    isMobile: false,
    isTablet: false,
    isLoading: false,
    isOnline: navigator.onLine,

    // État des composants
    carousel: {
        active: false,
        currentSlide: 0,
        totalSlides: 0,
        interval: null,
        isAnimating: false
    },

    navigation: {
        menuOpen: false,
        currentSection: 'home',
        scrollPosition: 0,
        scrollDirection: 'down'
    },

    forms: {
        contact: {
            isSubmitting: false,
            lastSubmit: null,
            attempts: 0
        },
        newsletter: {
            isSubmitting: false,
            subscribed: false
        }
    },

    modals: {
        donation: { open: false },
        gallery: { open: false },
        activeModals: []
    },

    // Cache
    cache: {
        images: new Map(),
        requests: new Map(),
        templates: new Map()
    },

    // Sessions
    session: {
        id: generateSessionId(),
        startTime: Date.now(),
        pageViews: 0,
        events: []
    },

    // Performance
    performance: {
        loadTime: 0,
        fps: 60,
        memory: null
    }
};

// =====================================================================
// CLASSES DE BASE
// =====================================================================

class Logger {
    constructor(prefix = 'APP') {
        this.prefix = prefix;
        this.colors = {
            info: '#3498db',
            success: '#2ecc71',
            warning: '#f39c12',
            error: '#e74c3c',
            debug: '#9b59b6'
        };
    }

    log(type, message, data = null) {
        if (!CONFIG.DEBUG_MODE && type === 'debug') return;

        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        const color = this.colors[type] || '#95a5a6';
        const style = `color: ${color}; font-weight: bold;`;

        console.log(`%c[${timestamp}] ${this.prefix}: ${message}`, style);
        if (data && CONFIG.DEBUG_MODE) {
            console.log(data);
        }

        // Stocker pour analytics
        if (CONFIG.ANALYTICS.ERROR_TRACKING && type === 'error') {
            this.trackError(message, data);
        }
    }

    info(message, data) { this.log('info', message, data); }
    success(message, data) { this.log('success', message, data); }
    warning(message, data) { this.log('warning', message, data); }
    error(message, data) { this.log('error', message, data); }
    debug(message, data) { this.log('debug', message, data); }

    trackError(message, data) {
        const errorData = {
            type: 'javascript_error',
            message: message,
            data: data,
            url: window.location.href,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        };

        APP_STATE.session.events.push({
            type: 'error',
            data: errorData,
            timestamp: Date.now()
        });

        // Envoyer au serveur si possible
        this.sendErrorToServer(errorData);
    }

    async sendErrorToServer(errorData) {
        try {
            await fetch('/api/log-error/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorData)
            });
        } catch (err) {
            // Silently fail pour les erreurs de logging
        }
    }
}

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.maxSize = CONFIG.PERFORMANCE.MAX_CACHE_SIZE;
    }

    set(key, value, ttl = 300000) { // 5 minutes par défaut
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });

        return true;
    }

    get(key) {
        const item = this.cache.get(key);

        if (!item) return null;

        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, item] of this.cache.entries()) {
            if (item.timestamp < oldestTime) {
                oldestTime = item.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    size() {
        return this.cache.size;
    }
}

class EventManager {
    constructor() {
        this.events = new Map();
        this.logger = new Logger('EVENTS');
    }

    on(element, event, handler, options = {}) {
        if (!element) {
            this.logger.warning(`Tentative d'ajout d'événement sur élément null: ${event}`);
            return () => { };
        }

        const wrappedHandler = (e) => {
            try {
                handler(e);
            } catch (error) {
                this.logger.error(`Erreur dans le handler pour ${event}:`, error);
            }
        };

        element.addEventListener(event, wrappedHandler, options);

        const unsubscribe = () => {
            element.removeEventListener(event, wrappedHandler, options);
        };

        const eventKey = `${event}-${Date.now()}-${Math.random()}`;
        this.events.set(eventKey, { element, event, handler: wrappedHandler, unsubscribe });

        return unsubscribe;
    }

    off(element, event, handler) {
        for (const [key, evt] of this.events.entries()) {
            if (evt.element === element && evt.event === event && evt.handler === handler) {
                evt.unsubscribe();
                this.events.delete(key);
                break;
            }
        }
    }

    once(element, event, handler) {
        const unsubscribe = this.on(element, event, (e) => {
            handler(e);
            unsubscribe();
        });

        return unsubscribe;
    }

    delegate(container, selector, event, handler) {
        return this.on(container, event, (e) => {
            if (e.target.matches(selector) || e.target.closest(selector)) {
                handler(e);
            }
        });
    }

    trigger(element, eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });

        element.dispatchEvent(event);
    }

    destroyAll() {
        for (const [key, evt] of this.events.entries()) {
            evt.unsubscribe();
            this.events.delete(key);
        }
    }
}

class AnalyticsTracker {
    constructor() {
        this.logger = new Logger('ANALYTICS');
        this.events = [];
        this.pageViewSent = false;
    }

    trackPageView() {
        if (!CONFIG.ANALYTICS.PAGE_VIEWS || this.pageViewSent) return;

        const pageData = {
            type: 'pageview',
            url: window.location.href,
            referrer: document.referrer,
            title: document.title,
            timestamp: Date.now(),
            sessionId: APP_STATE.session.id
        };

        this.events.push(pageData);
        APP_STATE.session.pageViews++;
        this.pageViewSent = true;

        // Envoyer au serveur
        this.sendEvent(pageData);

        this.logger.debug('Page view tracked', pageData);
    }

    trackEvent(category, action, label = '', value = 0) {
        if (!CONFIG.ANALYTICS.TRACK_EVENTS) return;

        const eventData = {
            type: 'event',
            category,
            action,
            label,
            value,
            timestamp: Date.now(),
            sessionId: APP_STATE.session.id
        };

        this.events.push(eventData);
        APP_STATE.session.events.push({
            type: 'analytics',
            data: eventData,
            timestamp: Date.now()
        });

        this.sendEvent(eventData);
        this.logger.debug('Event tracked', eventData);
    }

    trackFormInteraction(formId, action, data = {}) {
        if (!CONFIG.ANALYTICS.FORM_INTERACTIONS) return;

        this.trackEvent('form', action, formId);

        // Stocker localement pour récupération en cas de problème
        this.saveFormInteraction(formId, action, data);
    }

    async sendEvent(eventData) {
        try {
            const response = await fetch(CONFIG.API_ENDPOINTS.ANALYTICS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return true;
        } catch (error) {
            // Stocker pour réessayer plus tard
            this.queueForRetry(eventData);
            return false;
        }
    }

    queueForRetry(eventData) {
        const pendingEvents = JSON.parse(localStorage.getItem('analytics_pending') || '[]');
        pendingEvents.push(eventData);

        // Garder seulement les 50 derniers événements
        if (pendingEvents.length > 50) {
            pendingEvents.splice(0, pendingEvents.length - 50);
        }

        localStorage.setItem('analytics_pending', JSON.stringify(pendingEvents));
    }

    saveFormInteraction(formId, action, data) {
        const key = `form_${formId}_${Date.now()}`;
        const interaction = {
            formId,
            action,
            data,
            timestamp: Date.now()
        };

        localStorage.setItem(key, JSON.stringify(interaction));
    }

    flushPendingEvents() {
        const pendingEvents = JSON.parse(localStorage.getItem('analytics_pending') || '[]');

        if (pendingEvents.length === 0) return;

        pendingEvents.forEach(async (event) => {
            await this.sendEvent(event);
        });

        localStorage.removeItem('analytics_pending');
    }
}

// =====================================================================
## SITE WEB ORPHELIN PRIORITÉ ASBL - SCRIPT PRINCIPAL(Suite)
// =====================================================================

class FormValidator {
    constructor() {
        this.rules = {
            name: {
                required: true,
                minLength: CONFIG.VALIDATION.NAME_MIN_LENGTH,
                maxLength: 100,
                pattern: /^[a-zA-ZÀ-ÿ\s\-']+$/,
                errorMessages: {
                    required: 'Le nom est requis',
                    minLength: `Le nom doit contenir au moins ${CONFIG.VALIDATION.NAME_MIN_LENGTH} caractères`,
                    maxLength: 'Le nom ne doit pas dépasser 100 caractères',
                    pattern: 'Le nom ne doit contenir que des lettres, espaces, tirets et apostrophes'
                }
            },
            email: {
                required: true,
                pattern: CONFIG.VALIDATION.EMAIL_REGEX,
                errorMessages: {
                    required: 'L\'email est requis',
                    pattern: 'Veuillez entrer une adresse email valide'
                }
            },
            message: {
                required: true,
                minLength: CONFIG.VALIDATION.MESSAGE_MIN_LENGTH,
                maxLength: 2000,
                errorMessages: {
                    required: 'Le message est requis',
                    minLength: `Le message doit contenir au moins ${CONFIG.VALIDATION.MESSAGE_MIN_LENGTH} caractères`,
                    maxLength: 'Le message ne doit pas dépasser 2000 caractères'
                }
            },
            phone: {
                required: false,
                pattern: CONFIG.VALIDATION.PHONE_REGEX,
                errorMessages: {
                    pattern: 'Veuillez entrer un numéro de téléphone valide'
                }
            },
            subject: {
                required: false,
                maxLength: 200,
                errorMessages: {
                    maxLength: 'Le sujet ne doit pas dépasser 200 caractères'
                }
            }
        };
    }

    validateField(fieldName, value) {
        const rule = this.rules[fieldName];
        if (!rule) return { valid: true, message: '' };

        const errors = [];

        // Validation required
        if (rule.required && (!value || value.trim() === '')) {
            errors.push(rule.errorMessages.required);
        }

        // Validation minLength
        if (rule.minLength && value && value.length < rule.minLength) {
            errors.push(rule.errorMessages.minLength);
        }

        // Validation maxLength
        if (rule.maxLength && value && value.length > rule.maxLength) {
            errors.push(rule.errorMessages.maxLength);
        }

        // Validation pattern
        if (rule.pattern && value && value.trim() !== '' && !rule.pattern.test(value)) {
            errors.push(rule.errorMessages.pattern);
        }

        return {
            valid: errors.length === 0,
            message: errors.length > 0 ? errors[0] : ''
        };
    }

    validateForm(formData) {
        const errors = {};
        let isValid = true;

        for (const [fieldName, value] of Object.entries(formData)) {
            const validation = this.validateField(fieldName, value);

            if (!validation.valid) {
                errors[fieldName] = validation.message;
                isValid = false;
            }
        }

        return {
            valid: isValid,
            errors: errors,
            message: isValid ? '' : 'Veuillez corriger les erreurs dans le formulaire'
        };
    }

    validateEmail(email) {
        return CONFIG.VALIDATION.EMAIL_REGEX.test(email);
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .trim()
            .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
            .replace(/[<>'"\\]/g, '') // Supprimer les caractères dangereux
            .slice(0, 2000); // Limiter la longueur
    }

    prepareFormData(formElement) {
        const formData = new FormData(formElement);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = this.sanitizeInput(value);
        }

        return data;
    }
}

class ToastManager {
    constructor() {
        this.container = null;
        this.queue = [];
        this.isShowing = false;
        this.logger = new Logger('TOAST');
        this.initContainer();
    }

    initContainer() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '10000',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '400px'
        });

        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = CONFIG.TIMEOUTS.TOAST_DURATION) {
        const toast = {
            id: Date.now() + Math.random(),
            message,
            type,
            duration,
            timestamp: Date.now()
        };

        this.queue.push(toast);
        this.processQueue();

        // Track analytics
        if (window.analytics) {
            window.analytics.trackEvent('ui', 'toast_shown', type);
        }
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }

    processQueue() {
        if (this.isShowing || this.queue.length === 0) return;

        this.isShowing = true;
        const toast = this.queue.shift();
        this.createToastElement(toast);
    }

    createToastElement(toast) {
        const toastElement = document.createElement('div');
        toastElement.className = `toast toast-${toast.type}`;
        toastElement.dataset.id = toast.id;

        // Icône selon le type
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        toastElement.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[toast.type] || icons.info}</span>
                <span class="toast-message">${toast.message}</span>
                <button class="toast-close" aria-label="Fermer">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="toast-progress"></div>
        `;

        // Styles
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        Object.assign(toastElement.style, {
            background: colors[toast.type] || colors.info,
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            marginBottom: '10px',
            transform: 'translateX(100%)',
            opacity: '0',
            transition: 'transform 0.3s ease, opacity 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            maxWidth: '100%'
        });

        const content = toastElement.querySelector('.toast-content');
        Object.assign(content.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            position: 'relative',
            zIndex: '2'
        });

        const progress = toastElement.querySelector('.toast-progress');
        Object.assign(progress.style, {
            position: 'absolute',
            bottom: '0',
            left: '0',
            height: '3px',
            background: 'rgba(255,255,255,0.5)',
            width: '100%',
            transform: 'scaleX(1)',
            transformOrigin: 'left',
            transition: 'transform ${toast.duration}ms linear'
        });

        const closeBtn = toastElement.querySelector('.toast-close');
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            color: 'inherit',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0',
            marginLeft: 'auto',
            opacity: '0.8',
            transition: 'opacity 0.2s ease'
        });

        closeBtn.addEventListener('mouseover', () => {
            closeBtn.style.opacity = '1';
        });

        closeBtn.addEventListener('mouseout', () => {
            closeBtn.style.opacity = '0.8';
        });

        // Ajouter au container
        this.container.appendChild(toastElement);

        // Animer l'entrée
        requestAnimationFrame(() => {
            toastElement.style.transform = 'translateX(0)';
            toastElement.style.opacity = '1';

            // Démarrer la barre de progression
            setTimeout(() => {
                progress.style.transform = 'scaleX(0)';
            }, 10);
        });

        // Fermer au clic
        closeBtn.addEventListener('click', () => {
            this.removeToast(toastElement, toast.id);
        });

        // Fermer automatiquement
        const autoClose = setTimeout(() => {
            this.removeToast(toastElement, toast.id);
        }, toast.duration);

        // Sauvegarder les références
        toastElement._toastData = toast;
        toastElement._closeTimer = autoClose;

        // Passer au suivant après un délai
        setTimeout(() => {
            this.isShowing = false;
            this.processQueue();
        }, 300);
    }

    removeToast(toastElement, id) {
        if (toastElement._closeTimer) {
            clearTimeout(toastElement._closeTimer);
        }

        toastElement.style.transform = 'translateX(100%)';
        toastElement.style.opacity = '0';

        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        }, 300);
    }

    clearAll() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => {
            this.removeToast(toast, toast.dataset.id);
        });

        this.queue = [];
        this.isShowing = false;
    }
}

// =====================================================================
## SITE WEB ORPHELIN PRIORITÉ ASBL - MODULE CAROUSEL AVANCÉ
// =====================================================================

class AdvancedCarousel {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container ${containerId} not found`);
        }

        this.options = {
            images: [],
            autoPlay: true,
            interval: CONFIG.TIMEOUTS.CAROUSEL_AUTO,
            infinite: true,
            showIndicators: true,
            showControls: true,
            touchEnabled: true,
            fadeEffect: false,
            lazyLoad: true,
            preload: 2,
            ...options
        };

        this.state = {
            currentIndex: 0,
            totalSlides: this.options.images.length,
            isAnimating: false,
            touchStartX: 0,
            touchEndX: 0,
            direction: 'next',
            intervalId: null,
            loadedImages: new Set()
        };

        this.elements = {
            track: null,
            slides: [],
            indicators: [],
            prevBtn: null,
            nextBtn: null,
            captions: []
        };

        this.logger = new Logger('CAROUSEL');
        this.analytics = window.analytics;

        this.init();
    }

    init() {
        this.createStructure();
        this.renderSlides();
        this.setupControls();
        this.setupIndicators();
        this.setupTouchEvents();
        this.setupKeyboardEvents();
        this.setupIntersectionObserver();

        if (this.options.autoPlay) {
            this.startAutoPlay();
        }

        // Précharger les images
        this.preloadImages();

        this.logger.success('Carousel initialisé avec', this.state.totalSlides, 'slides');

        // Track analytics
        if (this.analytics) {
            this.analytics.trackEvent('carousel', 'initialized', this.container.id);
        }
    }

    createStructure() {
        // Nettoyer le container
        this.container.innerHTML = '';

        // Créer la structure HTML
        this.container.className = 'advanced-carousel';

        const carouselInner = document.createElement('div');
        carouselInner.className = 'carousel-inner';

        this.elements.track = document.createElement('div');
        this.elements.track.className = 'carousel-track';
        this.elements.track.setAttribute('role', 'region');
        this.elements.track.setAttribute('aria-label', 'Carousel d\'images');
        this.elements.track.setAttribute('aria-roledescription', 'carousel');

        if (this.options.fadeEffect) {
            this.elements.track.style.display = 'block';
        } else {
            this.elements.track.style.display = 'flex';
            this.elements.track.style.overflow = 'hidden';
        }

        carouselInner.appendChild(this.elements.track);
        this.container.appendChild(carouselInner);

        // Créer les contrôles si demandé
        if (this.options.showControls) {
            this.createControls();
        }

        // Créer les indicateurs si demandé
        if (this.options.showIndicators) {
            this.createIndicatorsContainer();
        }
    }

    createControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'carousel-controls';

        // Bouton précédent
        this.elements.prevBtn = document.createElement('button');
        this.elements.prevBtn.className = 'carousel-control carousel-control-prev';
        this.elements.prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        this.elements.prevBtn.setAttribute('aria-label', 'Image précédente');
        this.elements.prevBtn.setAttribute('aria-controls', this.container.id);

        // Bouton suivant
        this.elements.nextBtn = document.createElement('button');
        this.elements.nextBtn.className = 'carousel-control carousel-control-next';
        this.elements.nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        this.elements.nextBtn.setAttribute('aria-label', 'Image suivante');
        this.elements.nextBtn.setAttribute('aria-controls', this.container.id);

        controlsContainer.appendChild(this.elements.prevBtn);
        controlsContainer.appendChild(this.elements.nextBtn);
        this.container.appendChild(controlsContainer);
    }

    createIndicatorsContainer() {
        const indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'carousel-indicators-container';
        indicatorsContainer.setAttribute('role', 'tablist');
        indicatorsContainer.setAttribute('aria-label', 'Sélection de diapositive');

        this.container.appendChild(indicatorsContainer);
    }

    renderSlides() {
        this.elements.track.innerHTML = '';
        this.elements.slides = [];
        this.elements.captions = [];

        this.options.images.forEach((image, index) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            slide.dataset.index = index;
            slide.setAttribute('role', 'tabpanel');
            slide.setAttribute('aria-roledescription', 'slide');
            slide.setAttribute('aria-label', `${index + 1} sur ${this.state.totalSlides}`);

            if (index === 0) {
                slide.classList.add('active');
                slide.setAttribute('aria-hidden', 'false');
            } else {
                slide.setAttribute('aria-hidden', 'true');
            }

            // Conteneur d'image
            const imageContainer = document.createElement('div');
            imageContainer.className = 'carousel-image-container';

            // Image principale
            const img = document.createElement('img');
            img.className = 'carousel-image';
            img.alt = image.title || `Image ${index + 1}`;

            if (this.options.lazyLoad && index > this.options.preload) {
                img.setAttribute('data-src', image.url);
                img.setAttribute('loading', 'lazy');
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlZWVlIi8+PC9zdmc+';
            } else {
                img.src = image.url;
            }

            img.onload = () => {
                this.handleImageLoad(index);
                img.classList.add('loaded');
            };

            img.onerror = () => {
                this.handleImageError(index, img);
            };

            imageContainer.appendChild(img);
            slide.appendChild(imageContainer);

            // Caption
            if (image.title || image.description) {
                const caption = document.createElement('div');
                caption.className = 'carousel-caption';
                caption.innerHTML = `
                    ${image.title ? `<h3 class="carousel-title">${image.title}</h3>` : ''}
                    ${image.description ? `<p class="carousel-description">${image.description}</p>` : ''}
                `;
                slide.appendChild(caption);
                this.elements.captions.push(caption);
            }

            this.elements.track.appendChild(slide);
            this.elements.slides.push(slide);
        });

        this.updateTrackPosition();
    }

    handleImageLoad(index) {
        this.state.loadedImages.add(index);

        if (index === this.state.currentIndex) {
            this.elements.slides[index].classList.add('image-loaded');
        }

        // Track performance
        if (this.analytics) {
            this.analytics.trackEvent('image', 'loaded', `slide_${index}`);
        }
    }

    handleImageError(index, imgElement) {
        this.logger.warning(`Erreur de chargement de l'image ${index}`);

        // Remplacer par un placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'image-error-placeholder';
        placeholder.innerHTML = `
            <i class="fas fa-image"></i>
            <p>Image non disponible</p>
        `;

        imgElement.style.display = 'none';
        imgElement.parentNode.appendChild(placeholder);

        // Track error
        if (this.analytics) {
            this.analytics.trackEvent('error', 'image_load_failed', `slide_${index}`);
        }
    }

    setupControls() {
        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.prev();
            });

            this.elements.prevBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.prev();
                }
            });
        }

        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.next();
            });

            this.elements.nextBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.next();
                }
            });
        }
    }

    setupIndicators() {
        if (!this.options.showIndicators) return;

        const container = this.container.querySelector('.carousel-indicators-container');
        if (!container) return;

        container.innerHTML = '';
        this.elements.indicators = [];

        for (let i = 0; i < this.state.totalSlides; i++) {
            const indicator = document.createElement('button');
            indicator.className = 'carousel-indicator';
            indicator.dataset.index = i;
            indicator.setAttribute('role', 'tab');
            indicator.setAttribute('aria-label', `Aller à la diapositive ${i + 1}`);
            indicator.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
            indicator.setAttribute('aria-controls', this.container.id);

            if (i === 0) {
                indicator.classList.add('active');
            }

            indicator.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToSlide(i);
            });

            indicator.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.goToSlide(i);
                }
            });

            container.appendChild(indicator);
            this.elements.indicators.push(indicator);
        }
    }

    setupTouchEvents() {
        if (!this.options.touchEnabled) return;

        let touchStartX = 0;
        let touchStartY = 0;
        let isScrolling = false;

        this.elements.track.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isScrolling = false;
            this.stopAutoPlay();
        }, { passive: true });

        this.elements.track.addEventListener('touchmove', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;

            const diffX = touchStartX - touchX;
            const diffY = touchStartY - touchY;

            // Déterminer si c'est un scroll vertical ou horizontal
            if (Math.abs(diffY) > Math.abs(diffX)) {
                isScrolling = true;
            }
        }, { passive: true });

        this.elements.track.addEventListener('touchend', (e) => {
            if (!touchStartX || isScrolling) {
                touchStartX = 0;
                touchStartY = 0;
                isScrolling = false;
                if (this.options.autoPlay) {
                    this.startAutoPlay();
                }
                return;
            }

            const touchEndX = e.changedTouches[0].clientX;
            const diffX = touchStartX - touchEndX;

            const swipeThreshold = 50;

            if (Math.abs(diffX) > swipeThreshold) {
                if (diffX > 0) {
                    this.next();
                } else {
                    this.prev();
                }
            }

            touchStartX = 0;
            touchStartY = 0;
            isScrolling = false;

            if (this.options.autoPlay) {
                this.startAutoPlay();
            }
        }, { passive: true });
    }

    setupKeyboardEvents() {
        this.container.addEventListener('keydown', (e) => {
            if (!this.container.contains(document.activeElement)) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prev();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.next();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToSlide(this.state.totalSlides - 1);
                    break;
            }
        });
    }

    setupIntersectionObserver() {
        if (!this.options.lazyLoad) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const slide = entry.target;
                    const index = parseInt(slide.dataset.index);
                    this.loadLazyImage(index);
                    observer.unobserve(slide);
                }
            });
        }, {
            threshold: CONFIG.PERFORMANCE.LAZY_LOAD_THRESHOLD,
            rootMargin: '50px'
        });

        this.elements.slides.forEach((slide, index) => {
            if (index > this.options.preload) {
                observer.observe(slide);
            }
        });
    }

    loadLazyImage(index) {
        const slide = this.elements.slides[index];
        if (!slide) return;

        const img = slide.querySelector('img[data-src]');
        if (!img) return;

        const src = img.getAttribute('data-src');
        img.src = src;
        img.removeAttribute('data-src');
    }

    preloadImages() {
        const preloadCount = Math.min(this.options.preload, this.state.totalSlides);

        for (let i = 0; i < preloadCount; i++) {
            if (i >= this.state.totalSlides) break;

            const img = new Image();
            img.src = this.options.images[i].url;

            img.onload = () => {
                this.state.loadedImages.add(i);
            };

            img.onerror = () => {
                this.logger.warning(`Échec du préchargement de l'image ${i}`);
            };
        }
    }

    next() {
        if (this.state.isAnimating) return;

        let nextIndex = this.state.currentIndex + 1;

        if (nextIndex >= this.state.totalSlides) {
            if (this.options.infinite) {
                nextIndex = 0;
            } else {
                return; // Désactiver si pas infini
            }
        }

        this.goToSlide(nextIndex, 'next');
    }

    prev() {
        if (this.state.isAnimating) return;

        let prevIndex = this.state.currentIndex - 1;

        if (prevIndex < 0) {
            if (this.options.infinite) {
                prevIndex = this.state.totalSlides - 1;
            } else {
                return; // Désactiver si pas infini
            }
        }

        this.goToSlide(prevIndex, 'prev');
    }

    goToSlide(index, direction = null) {
        if (this.state.isAnimating || index === this.state.currentIndex) return;

        // Validation de l'index
        if (index < 0 || index >= this.state.totalSlides) {
            this.logger.error(`Index ${index} hors limites`);
            return;
        }

        this.state.isAnimating = true;
        this.state.direction = direction || (index > this.state.currentIndex ? 'next' : 'prev');

        const oldIndex = this.state.currentIndex;
        this.state.currentIndex = index;

        // Animation
        this.animateTransition(oldIndex, index);

        // Mettre à jour l'état
        this.updateActiveStates();
        this.updateTrackPosition();
        this.updateAccessibility();

        // Charger l'image si besoin
        this.loadCurrentImage();

        // Track analytics
        if (this.analytics) {
            this.analytics.trackEvent('carousel', 'slide_changed', `from_${oldIndex}_to_${index}`);
        }

        // Réinitialiser l'animation après un délai
        setTimeout(() => {
            this.state.isAnimating = false;
        }, 500);
    }

    animateTransition(oldIndex, newIndex) {
        const oldSlide = this.elements.slides[oldIndex];
        const newSlide = this.elements.slides[newIndex];

        if (!oldSlide || !newSlide) return;

        if (this.options.fadeEffect) {
            // Effet fade
            oldSlide.style.opacity = '0';
            newSlide.style.opacity = '0';
            newSlide.style.display = 'block';

            requestAnimationFrame(() => {
                newSlide.style.transition = 'opacity 0.5s ease';
                newSlide.style.opacity = '1';

                setTimeout(() => {
                    oldSlide.style.display = 'none';
                    newSlide.style.transition = '';
                }, 500);
            });
        } else {
            // Effet slide
            this.elements.track.style.transition = 'transform 0.5s ease';
        }
    }

    updateTrackPosition() {
        if (this.options.fadeEffect) return;

        const slideWidth = 100; // Pourcentage
        const translateX = -(this.state.currentIndex * slideWidth);
        this.elements.track.style.transform = `translateX(${translateX}%)`;
    }

    updateActiveStates() {
        // Mettre à jour les slides
        this.elements.slides.forEach((slide, index) => {
            if (index === this.state.currentIndex) {
                slide.classList.add('active');
                slide.setAttribute('aria-hidden', 'false');
            } else {
                slide.classList.remove('active');
                slide.setAttribute('aria-hidden', 'true');
            }
        });

        // Mettre à jour les indicateurs
        if (this.options.showIndicators) {
            this.elements.indicators.forEach((indicator, index) => {
                if (index === this.state.currentIndex) {
                    indicator.classList.add('active');
                    indicator.setAttribute('aria-selected', 'true');
                } else {
                    indicator.classList.remove('active');
                    indicator.setAttribute('aria-selected', 'false');
                }
            });
        }

        // Mettre à jour les contrôles
        if (this.options.showControls) {
            if (!this.options.infinite) {
                if (this.elements.prevBtn) {
                    this.elements.prevBtn.disabled = this.state.currentIndex === 0;
                }
                if (this.elements.nextBtn) {
                    this.elements.nextBtn.disabled = this.state.currentIndex === this.state.totalSlides - 1;
                }
            }
        }
    }

    updateAccessibility() {
        // Mettre à jour le live region pour les lecteurs d'écran
        const liveRegion = this.container.querySelector('.carousel-live-region');
        if (!liveRegion) {
            const region = document.createElement('div');
            region.className = 'carousel-live-region';
            region.setAttribute('aria-live', 'polite');
            region.setAttribute('aria-atomic', 'true');
            region.style.position = 'absolute';
            region.style.width = '1px';
            region.style.height = '1px';
            region.style.padding = '0';
            region.style.margin = '-1px';
            region.style.overflow = 'hidden';
            region.style.clip = 'rect(0, 0, 0, 0)';
            region.style.whiteSpace = 'nowrap';
            region.style.border = '0';
            this.container.appendChild(region);

            this.elements.liveRegion = region;
        }

        if (this.elements.liveRegion) {
            const currentImage = this.options.images[this.state.currentIndex];
            const message = `Diapositive ${this.state.currentIndex + 1} sur ${this.state.totalSlides}: ${currentImage.title || ''}`;
            this.elements.liveRegion.textContent = message;
        }
    }

    loadCurrentImage() {
        const currentIndex = this.state.currentIndex;

        if (!this.state.loadedImages.has(currentIndex)) {
            const slide = this.elements.slides[currentIndex];
            const img = slide.querySelector('img');

            if (img && img.hasAttribute('data-src')) {
                const src = img.getAttribute('data-src');
                img.src = src;
                img.removeAttribute('data-src');
            }
        }
    }

    startAutoPlay() {
        this.stopAutoPlay();

        if (!this.options.autoPlay) return;

        this.state.intervalId = setInterval(() => {
            this.next();
        }, this.options.interval);
    }

    stopAutoPlay() {
        if (this.state.intervalId) {
            clearInterval(this.state.intervalId);
            this.state.intervalId = null;
        }
    }

    pauseAutoPlay() {
        this.stopAutoPlay();
    }

    resumeAutoPlay() {
        if (this.options.autoPlay && !this.state.intervalId) {
            this.startAutoPlay();
        }
    }

    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };

        if (newOptions.autoPlay !== undefined) {
            if (newOptions.autoPlay) {
                this.startAutoPlay();
            } else {
                this.stopAutoPlay();
            }
        }

        if (newOptions.images) {
            this.state.totalSlides = newOptions.images.length;
            this.renderSlides();
            this.setupIndicators();
        }
    }

    destroy() {
        this.stopAutoPlay();

        // Supprimer les événements
        if (this.elements.prevBtn) {
            this.elements.prevBtn.replaceWith(this.elements.prevBtn.cloneNode(true));
        }
        if (this.elements.nextBtn) {
            this.elements.nextBtn.replaceWith(this.elements.nextBtn.cloneNode(true));
        }

        // Supprimer le contenu
        this.container.innerHTML = '';

        this.logger.info('Carousel détruit');
    }

    // Méthodes utilitaires
    getCurrentSlide() {
        return this.state.currentIndex;
    }

    getTotalSlides() {
        return this.state.totalSlides;
    }

    isPlaying() {
        return this.state.intervalId !== null;
    }

    // Méthode pour récupérer les données du carousel
    getCarouselData() {
        return {
            currentSlide: this.state.currentIndex,
            totalSlides: this.state.totalSlides,
            isPlaying: this.isPlaying(),
            loadedImages: Array.from(this.state.loadedImages),
            options: { ...this.options }
        };
    }
}

// =====================================================================
## SITE WEB ORPHELIN PRIORITÉ ASBL - MODULE FORMULAIRE DE CONTACT PROFESSIONNEL
// =====================================================================

class ProfessionalContactForm {
    constructor(formId, options = {}) {
        this.form = document.getElementById(formId);
        if (!this.form) {
            throw new Error(`Formulaire ${formId} non trouvé`);
        }

        this.options = {
            endpoint: CONFIG.API_ENDPOINTS.CONTACT,
            method: 'POST',
            enableValidation: true,
            showSuccessMessage: true,
            showErrorMessage: true,
            autoSave: true,
            autoSaveInterval: 30000,
            maxRetries: 3,
            timeout: CONFIG.PERFORMANCE.REQUEST_TIMEOUT,
            analytics: true,
            ...options
        };

        this.state = {
            isSubmitting: false,
            hasSubmitted: false,
            retryCount: 0,
            lastSave: null,
            formData: {},
            validationErrors: {}
        };

        this.elements = {
            fields: {},
            submitBtn: null,
            successMessage: null,
            errorMessage: null,
            loadingIndicator: null
        };

        this.validator = new FormValidator();
        this.logger = new Logger('CONTACT_FORM');
        this.analytics = window.analytics;
        this.toast = window.toastManager;

        this.init();
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupAutoSave();
        this.restoreSavedData();
        this.setupAccessibility();

        // Initialiser l'analytics
        if (this.options.analytics && this.analytics) {
            this.analytics.trackEvent('form', 'loaded', this.form.id);
        }

        this.logger.success('Formulaire de contact initialisé');
    }

    cacheElements() {
        // Récupérer tous les champs
        const fields = this.form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            const name = field.name || field.id;
            if (name) {
                this.elements.fields[name] = field;
            }
        });

        // Récupérer le bouton d'envoi
        this.elements.submitBtn = this.form.querySelector('button[type="submit"]') ||
            this.form.querySelector('.submit-btn');

        // Créer les messages
        this.createMessageElements();

        // Créer l'indicateur de chargement
        this.createLoadingIndicator();
    }

    createMessageElements() {
        // Message de succès
        this.elements.successMessage = document.createElement('div');
        this.elements.successMessage.className = 'form-success-message';
        this.elements.successMessage.style.display = 'none';
        this.elements.successMessage.setAttribute('role', 'alert');
        this.elements.successMessage.setAttribute('aria-live', 'polite');

        // Message d'erreur
        this.elements.errorMessage = document.createElement('div');
        this.elements.errorMessage.className = 'form-error-message';
        this.elements.errorMessage.style.display = 'none';
        this.elements.errorMessage.setAttribute('role', 'alert');
        this.elements.errorMessage.setAttribute('aria-live', 'assertive');

        // Insérer après le formulaire
        this.form.parentNode.insertBefore(this.elements.successMessage, this.form.nextSibling);
        this.form.parentNode.insertBefore(this.elements.errorMessage, this.form.nextSibling);
    }

    createLoadingIndicator() {
        this.elements.loadingIndicator = document.createElement('div');
        this.elements.loadingIndicator.className = 'form-loading-indicator';
        this.elements.loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <span class="loading-text">Envoi en cours...</span>
        `;
        this.elements.loadingIndicator.style.display = 'none';

        this.form.appendChild(this.elements.loadingIndicator);
    }

    setupEventListeners() {
        // Événement de soumission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Validation en temps réel
        if (this.options.enableValidation) {
            this.setupRealTimeValidation();
        }

        // Sauvegarde automatique lors de la saisie
        if (this.options.autoSave) {
            this.setupAutoSaveListeners();
        }

        // Gestion du focus pour l'accessibilité
        this.setupFocusManagement();

        // Événements pour analytics
        this.setupAnalyticsEvents();
    }

    setupRealTimeValidation() {
        Object.values(this.elements.fields).forEach(field => {
            const fieldName = field.name || field.id;
            if (!fieldName) return;

            // Validation lors du blur
            field.addEventListener('blur', () => {
                this.validateField(fieldName, field.value);
            });

            // Validation lors de la saisie (délai)
            let timeout;
            field.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.validateField(fieldName, field.value);
                }, 500);
            });
        });
    }

    setupAutoSaveListeners() {
        Object.values(this.elements.fields).forEach(field => {
            field.addEventListener('input', () => {
                this.saveFormData();
            });

            field.addEventListener('change', () => {
                this.saveFormData();
            });
        });
    }

    setupAutoSave() {
        if (!this.options.autoSave) return;

        // Sauvegarde périodique
        this.autoSaveInterval = setInterval(() => {
            if (this.hasFormDataChanged()) {
                this.saveFormData();
            }
        }, this.options.autoSaveInterval);
    }

    setupAccessibility() {
        // Ajouter les labels ARIA
        Object.values(this.elements.fields).forEach(field => {
            if (!field.id) {
                field.id = `field_${Date.now()}_${Math.random()}`;
            }

            const label = this.form.querySelector(`label[for="${field.id}"]`);
            if (label && !field.getAttribute('aria-label')) {
                field.setAttribute('aria-label', label.textContent);
            }
        });

        // Gérer le focus après soumission
        this.form.setAttribute('aria-label', 'Formulaire de contact');
    }

    setupAnalyticsEvents() {
        if (!this.options.analytics || !this.analytics) return;

        Object.values(this.elements.fields).forEach(field => {
            field.addEventListener('focus', () => {
                this.analytics.trackEvent('form', 'field_focus', field.name || field.id);
            });

            field.addEventListener('blur', () => {
                this.analytics.trackEvent('form', 'field_blur', field.name || field.id);
            });
        });
    }

    setupFocusManagement() {
        // Garder le focus dans le formulaire lors de la soumission
        this.form.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isSubmitting) {
                e.preventDefault();
                this.cancelSubmission();
            }
        });
    }

    validateField(fieldName, value) {
        if (!this.options.enableValidation) return { valid: true };

        const validation = this.validator.validateField(fieldName, value);

        if (!validation.valid) {
            this.showFieldError(fieldName, validation.message);
            this.state.validationErrors[fieldName] = validation.message;
        } else {
            this.hideFieldError(fieldName);
            delete this.state.validationErrors[fieldName];
        }

        this.updateSubmitButton();

        return validation;
    }

    validateForm() {
        if (!this.options.enableValidation) return { valid: true };

        const formData = this.getFormData();
        const validation = this.validator.validateForm(formData);

        // Afficher toutes les erreurs
        if (!validation.valid) {
            Object.entries(validation.errors).forEach(([fieldName, error]) => {
                this.showFieldError(fieldName, error);
                this.state.validationErrors[fieldName] = error;
            });
        } else {
            // Effacer toutes les erreurs
            Object.keys(this.state.validationErrors).forEach(fieldName => {
                this.hideFieldError(fieldName);
            });
            this.state.validationErrors = {};
        }

        this.updateSubmitButton();

        return validation;
    }

    showFieldError(fieldName, message) {
        const field = this.elements.fields[fieldName];
        if (!field) return;

        // Créer ou mettre à jour le message d'erreur
        let errorElement = field.parentNode.querySelector('.field-error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error-message';
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        errorElement.style.display = 'block';

        // Ajouter la classe d'erreur au champ
        field.classList.add('field-error');
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', errorElement.id || `error_${fieldName}`);

        // Focus sur le premier champ en erreur
        if (!this.firstErrorField) {
            this.firstErrorField = field;
        }
    }

    hideFieldError(fieldName) {
        const field = this.elements.fields[fieldName];
        if (!field) return;

        // Supprimer le message d'erreur
        const errorElement = field.parentNode.querySelector('.field-error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }

        // Retirer la classe d'erreur
        field.classList.remove('field-error');
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');

        if (this.firstErrorField === field) {
            this.firstErrorField = null;
        }
    }

    updateSubmitButton() {
        if (!this.elements.submitBtn) return;

        const isValid = Object.keys(this.state.validationErrors).length === 0;
        const hasData = this.hasFormData();

        this.elements.submitBtn.disabled = !isValid || !hasData || this.state.isSubmitting;

        if (this.state.isSubmitting) {
            this.elements.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        } else {
            this.elements.submitBtn.textContent = 'Envoyer le message';
        }
    }

    async handleSubmit() {
        // Validation
        const validation = this.validateForm();
        if (!validation.valid) {
            this.showErrorMessage('Veuillez corriger les erreurs dans le formulaire.');

            // Focus sur le premier champ en erreur
            if (this.firstErrorField) {
                this.firstErrorField.focus();
            }

            // Track analytics
            if (this.options.analytics && this.analytics) {
                this.analytics.trackEvent('form', 'validation_failed', this.form.id);
            }

            return;
        }

        // Préparer l'envoi
        this.prepareSubmission();

        try {
            // Envoyer les données
            const response = await this.sendFormData();

            if (response.success) {
                this.handleSuccess(response);
            } else {
                this.handleError(response);
            }
        } catch (error) {
            this.handleNetworkError(error);
        } finally {
            this.finalizeSubmission();
        }
    }

    prepareSubmission() {
        this.state.isSubmitting = true;
        this.state.hasSubmitted = true;
        this.state.retryCount = 0;

        // Afficher l'indicateur de chargement
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'block';
        }

        // Désactiver le formulaire
        this.disableForm();

        // Mettre à jour le bouton
        this.updateSubmitButton();

        // Track analytics
        if (this.options.analytics && this.analytics) {
            this.analytics.trackEvent('form', 'submission_started', this.form.id);
        }
    }

    async sendFormData() {
        const formData = this.getFormData();
        const csrfToken = this.getCSRFToken();

        // Préparer les données
        const data = {
            ...formData,
            timestamp: Date.now(),
            sessionId: APP_STATE.session.id,
            _csrf: csrfToken
        };

        // Options de la requête
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

        try {
            const response = await fetch(this.options.endpoint, {
                method: this.options.method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            // Tentative de nouvelle tentative
            if (this.state.retryCount < this.options.maxRetries) {
                this.state.retryCount++;
                this.logger.warning(`Tentative ${this.state.retryCount}/${this.options.maxRetries}`);

                // Attendre avant de réessayer
                await this.delay(1000 * this.state.retryCount);
                return this.sendFormData();
            }

            throw error;
        }
    }

    handleSuccess(response) {
        this.logger.success('Formulaire envoyé avec succès', response);

        // Afficher le message de succès
        if (this.options.showSuccessMessage) {
            this.showSuccessMessage(response.message || 'Votre message a été envoyé avec succès!');
        }

        // Toast
        if (this.toast) {
            this.toast.success(response.message || 'Message envoyé avec succès!');
        }

        // Réinitialiser le formulaire
        this.resetForm();

        // Effacer les données sauvegardées
        this.clearSavedData();

        // Track analytics
        if (this.options.analytics && this.analytics) {
            this.analytics.trackEvent('form', 'submission_success', this.form.id);
        }
    }

    handleError(response) {
        this.logger.error('Erreur lors de l\'envoi du formulaire', response);

        // Afficher le message d'erreur
        if (this.options.showErrorMessage) {
            this.showErrorMessage(response.message || 'Une erreur est survenue lors de l\'envoi.');
        }

        // Toast
        if (this.toast) {
            this.toast.error(response.message || 'Erreur lors de l\'envoi');
        }

        // Track analytics
        if (this.options.analytics && this.analytics) {
            this.analytics.trackEvent('form', 'submission_error', this.form.id, response.code || 0);
        }
    }

    handleNetworkError(error) {
        this.logger.error('Erreur réseau', error);

        // Afficher le message d'erreur
        if (this.options.showErrorMessage) {
            this.showErrorMessage('Erreur de connexion. Veuillez vérifier votre connexion internet.');
        }

        // Toast
        if (this.toast) {
            this.toast.error('Erreur de connexion au serveur');
        }

        // Sauvegarder les données pour réessayer plus tard
        this.saveForRetry();

        // Track analytics
        if (this.options.analytics && this.analytics) {
            this.analytics.trackEvent('form', 'network_error', this.form.id);
        }
    }

    finalizeSubmission() {
        this.state.isSubmitting = false;

        // Cacher l'indicateur de chargement
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'none';
        }

        // Réactiver le formulaire
        this.enableForm();

        // Mettre à jour le bouton
        this.updateSubmitButton();
    }

    disableForm() {
        Object.values(this.elements.fields).forEach(field => {
            field.disabled = true;
        });

        if (this.elements.submitBtn) {
            this.elements.submitBtn.disabled = true;
        }
    }

    enableForm() {
        Object.values(this.elements.fields).forEach(field => {
            field.disabled = false;
        });

        this.updateSubmitButton();
    }

    showSuccessMessage(message) {
        if (!this.elements.successMessage) return;

        this.elements.successMessage.textContent = message;
        this.elements.successMessage.style.display = 'block';
        this.elements.successMessage.setAttribute('aria-live', 'polite');

        // Cacher après 5 secondes
        setTimeout(() => {
            this.elements.successMessage.style.display = 'none';
        }, 5000);
    }

    showErrorMessage(message) {
        if (!this.elements.errorMessage) return;

        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.style.display = 'block';
        this.elements.errorMessage.setAttribute('aria-live', 'assertive');

        // Focus sur le message d'erreur pour l'accessibilité
        this.elements.errorMessage.focus();

        // Cacher après 10 secondes
        setTimeout(() => {
            this.elements.errorMessage.style.display = 'none';
        }, 10000);
    }

    hideMessages() {
        if (this.elements.successMessage) {
            this.elements.successMessage.style.display = 'none';
        }
        if (this.elements.errorMessage) {
            this.elements.errorMessage.style.display = 'none';
        }
    }

    getFormData() {
        const formData = {};

        Object.entries(this.elements.fields).forEach(([name, field]) => {
            if (field.type === 'checkbox') {
                formData[name] = field.checked;
            } else if (field.type === 'radio') {
                if (field.checked) {
                    formData[name] = field.value;
                }
            } else if (field.type === 'select-multiple') {
                const selected = Array.from(field.selectedOptions).map(option => option.value);
                formData[name] = selected;
            } else {
                formData[name] = field.value.trim();
            }
        });

        return formData;
    }

    setFormData(data) {
        Object.entries(data).forEach(([name, value]) => {
            const field = this.elements.fields[name];
            if (!field) return;

            if (field.type === 'checkbox') {
                field.checked = Boolean(value);
            } else if (field.type === 'radio') {
                if (field.value === value) {
                    field.checked = true;
                }
            } else if (field.type === 'select-multiple' && Array.isArray(value)) {
                Array.from(field.options).forEach(option => {
                    option.selected = value.includes(option.value);
                });
            } else {
                field.value = value || '';
            }
        });
    }

    resetForm() {
        this.form.reset();
        this.state.formData = {};
        this.state.validationErrors = {};
        this.hideMessages();
        this.updateSubmitButton();

        // Supprimer les erreurs de champ
        Object.keys(this.elements.fields).forEach(fieldName => {
            this.hideFieldError(fieldName);
        });
    }

    saveFormData() {
        if (!this.options.autoSave) return;

        const formData = this.getFormData();
        this.state.formData = formData;
        this.state.lastSave = Date.now();

        // Stocker dans localStorage
        const key = `${CONFIG.LOCAL_STORAGE_KEYS.FORM_DATA}_${this.form.id}`;
        localStorage.setItem(key, JSON.stringify({
            data: formData,
            timestamp: this.state.lastSave
        }));

        this.logger.debug('Données du formulaire sauvegardées');
    }

    restoreSavedData() {
        if (!this.options.autoSave) return;

        const key = `${CONFIG.LOCAL_STORAGE_KEYS.FORM_DATA}_${this.form.id}`;
        const saved = localStorage.getItem(key);

        if (saved) {
            try {
                const { data, timestamp } = JSON.parse(saved);

                // Ne restaurer que si moins de 24h
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                    this.setFormData(data);
                    this.state.formData = data;
                    this.state.lastSave = timestamp;
                    this.logger.info('Données du formulaire restaurées');
                } else {
                    localStorage.removeItem(key);
                }
            } catch (error) {
                this.logger.error('Erreur lors de la restauration des données', error);
                localStorage.removeItem(key);
            }
        }
    }

    clearSavedData() {
        const key = `${CONFIG.LOCAL_STORAGE_KEYS.FORM_DATA}_${this.form.id}`;
        localStorage.removeItem(key);
        this.state.formData = {};
        this.state.lastSave = null;
    }

    saveForRetry() {
        const formData = this.getFormData();
        const pendingKey = `pending_submission_${this.form.id}_${Date.now()}`;

        localStorage.setItem(pendingKey, JSON.stringify({
            formId: this.form.id,
            data: formData,
            endpoint: this.options.endpoint,
            timestamp: Date.now(),
            attempts: this.state.retryCount
        }));

        this.logger.info('Soumission sauvegardée pour nouvelle tentative');
    }

    hasFormData() {
        const data = this.getFormData();
        return Object.values(data).some(value => {
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'boolean') return true;
            return value && value.toString().trim().length > 0;
        });
    }

    hasFormDataChanged() {
        const currentData = this.getFormData();
        const previousData = this.state.formData;

        return JSON.stringify(currentData) !== JSON.stringify(previousData);
    }

    getCSRFToken() {
        // Chercher dans les cookies
        const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
        if (cookieMatch) return cookieMatch[1];

        // Chercher dans le DOM
        const csrfInput = this.form.querySelector('[name="csrfmiddlewaretoken"]');
        if (csrfInput) return csrfInput.value;

        // Chercher dans les meta tags
        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken) return metaToken.content;

        return '';
    }

    cancelSubmission() {
        this.state.isSubmitting = false;
        this.finalizeSubmission();

        if (this.toast) {
            this.toast.info('Envoi annulé');
        }

        this.logger.info('Envoi annulé par l\'utilisateur');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Méthodes publiques
    submit() {
        return this.handleSubmit();
    }

    validate() {
        return this.validateForm();
    }

    reset() {
        this.resetForm();
    }

    getState() {
        return {
            isSubmitting: this.state.isSubmitting,
            hasSubmitted: this.state.hasSubmitted,
            validationErrors: { ...this.state.validationErrors },
            formData: { ...this.state.formData }
        };
    }

    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }

    destroy() {
        // Nettoyer les intervalles
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        // Supprimer les éléments créés
        if (this.elements.successMessage && this.elements.successMessage.parentNode) {
            this.elements.successMessage.parentNode.removeChild(this.elements.successMessage);
        }

        if (this.elements.errorMessage && this.elements.errorMessage.parentNode) {
            this.elements.errorMessage.parentNode.removeChild(this.elements.errorMessage);
        }

        if (this.elements.loadingIndicator && this.elements.loadingIndicator.parentNode) {
            this.elements.loadingIndicator.parentNode.removeChild(this.elements.loadingIndicator);
        }

        // Réinitialiser le formulaire
        this.resetForm();

        this.logger.info('Formulaire de contact détruit');
    }
}

// =====================================================================
## SITE WEB ORPHELIN PRIORITÉ ASBL - MODULE GESTION DU THÈME AVANCÉ
// =====================================================================

class ThemeManager {
    constructor() {
        this.themes = {
            light: {
                name: 'light',
                label: 'Mode clair',
                icon: 'fa-moon',
                next: 'dark'
            },
            dark: {
                name: 'dark',
                label: 'Mode sombre',
                icon: 'fa-sun',
                next: 'auto'
            },
            auto: {
                name: 'auto',
                label: 'Auto',
                icon: 'fa-adjust',
                next: 'light'
            }
        };

        this.state = {
            currentTheme: 'auto',
            systemPreference: 'light',
            isTransitioning: false,
            userOverride: false
        };

        this.elements = {
            toggleButton: null,
            themeIndicator: null,
            stylesheet: null
        };

        this.logger = new Logger('THEME');
        this.analytics = window.analytics;

        this.init();
    }

    init() {
        this.detectSystemPreference();
        this.loadSavedTheme();
        this.applyTheme();
        this.setupToggleButton();
        this.createStylesheet();
        this.setupMediaQueryListener();

        this.logger.success('Gestionnaire de thème initialisé');
    }

    detectSystemPreference() {
        this.state.systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

        this.logger.debug(`Préférence système détectée: ${this.state.systemPreference}`);
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.THEME);

        if (savedTheme && this.themes[savedTheme]) {
            this.state.currentTheme = savedTheme;
            this.state.userOverride = true;
            this.logger.debug(`Thème chargé depuis le stockage: ${savedTheme}`);
        } else {
            this.state.currentTheme = 'auto';
            this.state.userOverride = false;
        }
    }

    saveTheme() {
        localStorage.setItem(CONFIG.LOCAL_STORAGE_KEYS.THEME, this.state.currentTheme);
        this.logger.debug(`Thème sauvegardé: ${this.state.currentTheme}`);
    }

    applyTheme() {
        if (this.state.isTransitioning) return;

        this.state.isTransitioning = true;

        const effectiveTheme = this.getEffectiveTheme();

        // Appliquer le thème au document
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        document.documentElement.classList.add('theme-transition');

        // Mettre à jour les meta tags
        this.updateMetaTags(effectiveTheme);

        // Mettre à jour l'interface
        this.updateUI();

        // Émettre un événement
        this.emitThemeChange(effectiveTheme);

        // Track analytics
        if (this.analytics) {
            this.analytics.trackEvent('theme', 'changed', effectiveTheme);
        }

        // Fin de la transition
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transition');
            this.state.isTransitioning = false;
        }, 300);

        this.logger.info(`Thème appliqué: ${effectiveTheme} (sélection: ${this.state.currentTheme})`);
    }

    getEffectiveTheme() {
        if (this.state.currentTheme === 'auto') {
            return this.state.systemPreference;
        }
        return this.state.currentTheme;
    }

    updateMetaTags(theme) {
        // Mettre à jour la couleur de la barre d'adresse (mobile)
        const themeColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');

        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        metaThemeColor.content = themeColor;
    }

    updateUI() {
        // Mettre à jour le bouton de bascule
        if (this.elements.toggleButton) {
            const theme = this.themes[this.state.currentTheme];
            const icon = this.elements.toggleButton.querySelector('i');

            if (icon) {
                icon.className = `fas ${theme.icon}`;
            }

            this.elements.toggleButton.setAttribute('aria-label', `Basculer vers le mode ${theme.next}`);
            this.elements.toggleButton.title = `Actuellement: ${theme.label}. Cliquer pour basculer vers ${this.themes[theme.next].label}`;
        }

        // Mettre à jour l'indicateur
        if (this.elements.themeIndicator) {
            this.elements.themeIndicator.textContent = this.themes[this.state.currentTheme].label;
        }
    }

    setupToggleButton() {
        this.elements.toggleButton = document.getElementById('themeToggle');

        if (!this.elements.toggleButton) {
            this.logger.warning('Bouton de bascule de thème non trouvé');
            return;
        }

        // Configurer le bouton
        this.elements.toggleButton.setAttribute('role', 'button');
        this.elements.toggleButton.setAttribute('aria-pressed', 'false');
        this.elements.toggleButton.tabIndex = 0;

        // Événements
        this.elements.toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleTheme();
        });

        this.elements.toggleButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // Créer un indicateur de texte
        this.createThemeIndicator();

        this.logger.debug('Bouton de bascule de thème configuré');
    }

    createThemeIndicator() {
        this.elements.themeIndicator = document.createElement('span');
        this.elements.themeIndicator.className = 'theme-indicator';
        this.elements.themeIndicator.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;

        this.elements.toggleButton.appendChild(this.elements.themeIndicator);
    }

    createStylesheet() {
        this.elements.stylesheet = document.createElement('style');
        this.elements.stylesheet.id = 'theme-transition-styles';
        this.elements.stylesheet.textContent = `
            :root {
                --theme-transition-duration: 0.3s;
            }
            
            .theme-transition * {
                transition-duration: var(--theme-transition-duration) !important;
                transition-property: background-color, border-color, color, fill, stroke !important;
                transition-timing-function: ease-in-out !important;
            }
            
            /* Prévenir les flashs lors du chargement */
            :root:not([data-theme]) {
                opacity: 0;
            }
            
            :root[data-theme] {
                opacity: 1;
                transition: opacity 0.3s ease;
            }
            
            /* Styles spécifiques au thème sombre */
            [data-theme="dark"] {
                color-scheme: dark;
            }
            
            [data-theme="light"] {
                color-scheme: light;
            }
        `;

        document.head.appendChild(this.elements.stylesheet);
    }

    setupMediaQueryListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', (e) => {
            this.state.systemPreference = e.matches ? 'dark' : 'light';

            if (this.state.currentTheme === 'auto') {
                this.applyTheme();
            }

            this.logger.debug(`Préférence système changée: ${this.state.systemPreference}`);
        });
    }

    toggleTheme() {
        const currentTheme = this.themes[this.state.currentTheme];
        this.state.currentTheme = currentTheme.next;
        this.state.userOverride = true;

        this.saveTheme();
        this.applyTheme();

        // Feedback haptique (si supporté)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    setTheme(themeName) {
        if (!this.themes[themeName]) {
            this.logger.error(`Thème inconnu: ${themeName}`);
            return false;
        }

        this.state.currentTheme = themeName;
        this.state.userOverride = true;

        this.saveTheme();
        this.applyTheme();

        return true;
    }

    getTheme() {
        return {
            selected: this.state.currentTheme,
            effective: this.getEffectiveTheme(),
            system: this.state.systemPreference,
            userOverride: this.state.userOverride
        };
    }

    emitThemeChange(theme) {
        const event = new CustomEvent('themechange', {
            detail: {
                theme: theme,
                selectedTheme: this.state.currentTheme,
                systemPreference: this.state.systemPreference
            },
            bubbles: true
        });

        document.dispatchEvent(event);
    }

    // Méthode pour forcer un thème temporairement (pour le contraste par exemple)
    setHighContrast(enable = true) {
        if (enable) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
    }

    // Méthode pour réduire la transparence
    setReducedTransparency(enable = true) {
        if (enable) {
            document.documentElement.classList.add('reduced-transparency');
        } else {
            document.documentElement.classList.remove('reduced-transparency');
        }
    }

    // Méthode pour réduire le mouvement
    setReducedMotion(enable = true) {
        if (enable) {
            document.documentElement.classList.add('reduced-motion');
        } else {
            document.documentElement.classList.remove('reduced-motion');
        }
    }

    destroy() {
        // Supprimer le stylesheet
        if (this.elements.stylesheet && this.elements.stylesheet.parentNode) {
            this.elements.stylesheet.parentNode.removeChild(this.elements.stylesheet);
        }

        // Supprimer l'indicateur
        if (this.elements.themeIndicator && this.elements.themeIndicator.parentNode) {
            this.elements.themeIndicator.parentNode.removeChild(this.elements.themeIndicator);
        }

        this.logger.info('Gestionnaire de thème détruit');
    }
}

// =====================================================================
## SITE WEB ORPHELIN PRIORITÉ ASBL - MODULE GESTION DES PERFORMANCES
// =====================================================================

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            navigation: {},
            paint: {},
            resources: [],
            userTiming: []
        };

        this.thresholds = {
            fcp: 2000,    // First Contentful Paint
            lcp: 2500,    // Largest Contentful Paint
            fid: 100,     // First Input Delay
            cls: 0.1,     // Cumulative Layout Shift
            ttfb: 800     // Time to First Byte
        };

        this.observers = {
            performance: null,
            resources: null,
            layoutShift: null
        };

        this.logger = new Logger('PERFORMANCE');
        this.analytics = window.analytics;

        this.init();
    }

    init() {
        if (!window.performance || !window.PerformanceObserver) {
            this.logger.warning('Performance API non supportée');
            return;
        }

        this.setupPerformanceObserver();
        this.setupResourceObserver();
        this.setupLayoutShiftObserver();
        this.setupLongTasksObserver();
        this.setupMemoryObserver();

        // Capture les métriques de navigation
        this.captureNavigationTiming();

        this.logger.success('Moniteur de performance initialisé');
    }

    setupPerformanceObserver() {
        try {
            this.observers.performance = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.handlePerformanceEntry(entry);
                }
            });

            this.observers.performance.observe({
                entryTypes: ['paint', 'largest-contentful-paint', 'first-input']
            });
        } catch (error) {
            this.logger.error('Erreur PerformanceObserver:', error);
        }
    }

    setupResourceObserver() {
        try {
            this.observers.resources = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.handleResourceEntry(entry);
                }
            });

            this.observers.resources.observe({
                entryTypes: ['resource']
            });
        } catch (error) {
            this.logger.error('Erreur ResourceObserver:', error);
        }
    }

    setupLayoutShiftObserver() {
        try {
            let clsValue = 0;

            this.observers.layoutShift = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        this.metrics.cls = clsValue;

                        // Vérifier le seuil
                        if (clsValue > this.thresholds.cls) {
                            this.logger.warning(`CLS élevé: ${clsValue.toFixed(3)}`);
                        }
                    }
                }
            });

            this.observers.layoutShift.observe({
                entryTypes: ['layout-shift']
            });
        } catch (error) {
            this.logger.error('Erreur LayoutShiftObserver:', error);
        }
    }

    setupLongTasksObserver() {
        if (!window.PerformanceLongTaskTiming) return;

        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) { // > 50ms est considéré comme long
                        this.logger.warning(`Tâche longue détectée: ${entry.duration}ms`, {
                            name: entry.name,
                            startTime: entry.startTime,
                            duration: entry.duration,
                            attribution: entry.attribution
                        });
                    }
                }
            });

            longTaskObserver.observe({
                entryTypes: ['longtask']
            });
        } catch (error) {
            this.logger.debug('LongTask Observer non disponible');
        }
    }

    setupMemoryObserver() {
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memory = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };

                // Vérifier l'utilisation de la mémoire
                const usagePercent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
                if (usagePercent > 80) {
                    this.logger.warning(`Utilisation mémoire élevée: ${usagePercent.toFixed(1)}%`);
                }
            }, 30000); // Toutes les 30 secondes
        }
    }

    handlePerformanceEntry(entry) {
        switch (entry.entryType) {
            case 'paint':
                if (entry.name === 'first-paint') {
                    this.metrics.paint.fp = entry.startTime;
                    this.logger.info(`First Paint: ${entry.startTime}ms`);
                } else if (entry.name === 'first-contentful-paint') {
                    this.metrics.paint.fcp = entry.startTime;
                    this.logger.info(`First Contentful Paint: ${entry.startTime}ms`);

                    // Vérifier le seuil
                    if (entry.startTime > this.thresholds.fcp) {
                        this.logger.warning(`FCP dépassé: ${entry.startTime}ms (seuil: ${this.thresholds.fcp}ms)`);
                    }
                }
                break;

            case 'largest-contentful-paint':
                this.metrics.paint.lcp = entry.startTime;
                this.logger.info(`Largest Contentful Paint: ${entry.startTime}ms`);

                // Vérifier le seuil
                if (entry.startTime > this.thresholds.lcp) {
                    this.logger.warning(`LCP dépassé: ${entry.startTime}ms (seuil: ${this.thresholds.lcp}ms)`);
                }
                break;

            case 'first-input':
                this.metrics.fid = entry.processingStart - entry.startTime;
                this.logger.info(`First Input Delay: ${this.metrics.fid}ms`);

                // Vérifier le seuil
                if (this.metrics.fid > this.thresholds.fid) {
                    this.logger.warning(`FID dépassé: ${this.metrics.fid}ms (seuil: ${this.thresholds.fid}ms)`);
                }
                break;
        }
    }

    handleResourceEntry(entry) {
        const resource = {
            name: entry.name,
            duration: entry.duration,
            size: entry.encodedBodySize || entry.decodedBodySize || 0,
            type: entry.initiatorType,
            startTime: entry.startTime,
            responseEnd: entry.responseEnd
        };

        this.metrics.resources.push(resource);

        // Garder seulement les 100 dernières ressources
        if (this.metrics.resources.length > 100) {
            this.metrics.resources.shift();
        }

        // Vérifier les ressources lentes
        if (entry.duration > 1000) { // > 1 seconde
            this.logger.warning(`Ressource lente: ${entry.name} (${entry.duration}ms)`);
        }
    }

    captureNavigationTiming() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return;

        this.metrics.navigation = {
            ttfb: navigation.responseStart - navigation.requestStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
            load: navigation.loadEventEnd - navigation.startTime,
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            total: navigation.duration
        };

        this.logger.info('Métriques de navigation capturées', this.metrics.navigation);

        // Vérifier TTFB
        if (this.metrics.navigation.ttfb > this.thresholds.ttfb) {
            this.logger.warning(`TTFB élevé: ${this.metrics.navigation.ttfb}ms`);
        }
    }

    startUserTiming(markName) {
        performance.mark(`${markName}-start`);
    }

    endUserTiming(markName, measureName) {
        performance.mark(`${markName}-end`);
        performance.measure(measureName || markName, `${markName}-start`, `${markName}-end`);

        const measures = performance.getEntriesByName(measureName || markName);
        if (measures.length > 0) {
            this.metrics.userTiming.push({
                name: measureName || markName,
                duration: measures[0].duration
            });
        }
    }

    measureElementLoad(selector) {
        const element = document.querySelector(selector);
        if (!element) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    this.endUserTiming(`${selector}-load`, `${selector} Load Time`);
                    observer.disconnect();
                }
            });
        });

        this.startUserTiming(`${selector}-load`);
        observer.observe(element, { childList: true });
    }

    getMetrics() {
        return {
            ...this.metrics,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
    }

    sendMetricsToAnalytics() {
        if (!this.analytics) return;

        const metrics = this.getMetrics();

        // Envoyer seulement les métriques importantes
        const analyticsData = {
            fcp: metrics.paint.fcp,
            lcp: metrics.paint.lcp,
            fid: metrics.fid,
            cls: metrics.cls,
            ttfb: metrics.navigation.ttfb,
            navigation: metrics.navigation.total
        };

        this.analytics.trackEvent('performance', 'metrics', 'core_web_vitals', analyticsData);
    }

    optimizeImages() {
        // Détecter les images non optimisées
        const images = document.querySelectorAll('img:not([loading]), img[loading="lazy"]:not([data-optimized])');

        images.forEach(img => {
            // Ajouter lazy loading si manquant
            if (!img.loading) {
                img.loading = 'lazy';
            }

            // Optimiser les srcset si disponible
            if (img.srcset && !img.sizes) {
                // Déterminer les tailles appropriées
                const containerWidth = img.parentElement ? img.parentElement.offsetWidth : 800;
                img.sizes = `(max-width: ${containerWidth}px) 100vw, ${containerWidth}px`;
            }

            // Marquer comme optimisé
            img.dataset.optimized = 'true';
        });

        this.logger.debug(`${images.length} images optimisées`);
    }

    debounceResize() {
        let resizeTimeout;

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, CONFIG.TIMEOUTS.DEBOUNCE_RESIZE);
        });
    }

    handleResize() {
        // Recalculer les éléments qui dépendent de la taille
        this.optimizeImages();

        // Track analytics
        if (this.analytics) {
            this.analytics.trackEvent('performance', 'resize', window.innerWidth);
        }
    }

    monitorFPS() {
        let frameCount = 0;
        let lastTime = performance.now();
        let fps = 60;

        const calculateFPS = () => {
            const currentTime = performance.now();
            frameCount++;

            if (currentTime > lastTime + 1000) {
                fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;

                APP_STATE.performance.fps = fps;

                // Avertir si FPS bas
                if (fps < 30) {
                    this.logger.warning(`FPS bas: ${fps}`);
                }
            }

            requestAnimationFrame(calculateFPS);
        };

        requestAnimationFrame(calculateFPS);
    }

    destroy() {
        // Désabonner tous les observers
        Object.values(this.observers).forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });

        this.logger.info('Moniteur de performance détruit');
    }
}

// =====================================================================
## SITE WEB ORPHELIN PRIORITÉ ASBL - MODULE GESTION DU SITE COMPLET
// =====================================================================

class SiteManager {
    constructor() {
        this.modules = {};
        this.components = {};
        this.logger = new Logger('SITE');
        this.analytics = null;
        this.performance = null;
        this.theme = null;
        this.toast = null;

        // État du site
        this.state = {
            isInitialized: false,
            isOnline: navigator.onLine,
            isMobile: window.innerWidth <= CONFIG.BREAKPOINTS.MOBILE,
            isTablet: window.innerWidth <= CONFIG.BREAKPOINTS.TABLET,
            currentPage: this.getCurrentPage(),
            scrollPosition: 0,
            menuOpen: false
        };

        this.init();
    }

    init() {
        this.logger.info('Initialisation du gestionnaire de site...');

        // Initialiser les modules de base
        this.initCoreModules();

        // Initialiser les composants
        this.initComponents();

        // Configurer les événements globaux
        this.setupGlobalEvents();

        // Configurer l'intersection observer
        this.setupIntersectionObserver();

        // Configurer la détection de réseau
        this.setupNetworkDetection();

        // Démarrer les services
        this.startServices();

        this.state.isInitialized = true;
        this.logger.success('Gestionnaire de site initialisé');

        // Track page view
        this.trackPageView();
    }

    initCoreModules() {
        // Analytics
        this.analytics = new AnalyticsTracker();
        window.analytics = this.analytics;

        // Performance
        this.performance = new PerformanceMonitor();
        window.performanceMonitor = this.performance;

        // Toast Manager
        this.toast = new ToastManager();
        window.toastManager = this.toast;

        // Theme Manager
        this.theme = new ThemeManager();
        window.themeManager = this.theme;

        // Cache Manager
        this.cache = new CacheManager();
        window.cacheManager = this.cache;

        // Event Manager
        this.events = new EventManager();
        window.eventManager = this.events;

        this.logger.debug('Modules de base initialisés');
    }

    initComponents() {
        // Carousel principal
        this.initCarousel();

        // Formulaire de contact
        this.initContactForm();

        // Menu de navigation
        this.initNavigation();

        // Images d'équipe
        this.initTeamImages();

        // Animations
        this.initAnimations();

        // Compteurs
        this.initCounters();

        // Modales
        this.initModals();

        // Newsletter
        this.initNewsletter();

        this.logger.debug('Composants initialisés');
    }

    initCarousel() {
        try {
            const carouselContainer = document.getElementById('carouselTrack');
            if (!carouselContainer) {
                this.logger.warning('Carousel non trouvé');
                return;
            }

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

            this.components.carousel = new AdvancedCarousel('carouselTrack', {
                images: carouselImages,
                autoPlay: true,
                interval: 5000,
                infinite: true,
                showIndicators: true,
                showControls: true,
                touchEnabled: true,
                lazyLoad: true,
                preload: 2
            });

        } catch (error) {
            this.logger.error('Erreur d\'initialisation du carousel:', error);
        }
    }

    initContactForm() {
        try {
            const contactForm = document.getElementById('contactForm');
            if (!contactForm) {
                this.logger.warning('Formulaire de contact non trouvé');
                return;
            }

            this.components.contactForm = new ProfessionalContactForm('contactForm', {
                endpoint: CONFIG.API_ENDPOINTS.CONTACT,
                enableValidation: true,
                autoSave: true,
                analytics: true
            });

        } catch (error) {
            this.logger.error('Erreur d\'initialisation du formulaire de contact:', error);
        }
    }

    initNavigation() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navMenu = document.getElementById('navMenu');

        if (!mobileMenuBtn || !navMenu) {
            this.logger.warning('Navigation mobile non trouvée');
            return;
        }

        // Toggle du menu mobile
        mobileMenuBtn.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Fermer le menu en cliquant sur un lien
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (this.state.menuOpen) {
                    this.toggleMobileMenu();
                }
            });
        });

        // Fermer le menu en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (this.state.menuOpen &&
                !navMenu.contains(e.target) &&
                !mobileMenuBtn.contains(e.target)) {
                this.toggleMobileMenu();
            }
        });

        // Navigation smooth
        this.initSmoothScrolling();

        // Navigation active
        this.initActiveNavigation();

        this.logger.debug('Navigation initialisée');
    }

    toggleMobileMenu() {
        const navMenu = document.getElementById('navMenu');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');

        if (!navMenu || !mobileMenuBtn) return;

        this.state.menuOpen = !this.state.menuOpen;
        navMenu.classList.toggle('active');

        const icon = mobileMenuBtn.querySelector('i');
        if (icon) {
            icon.className = this.state.menuOpen ? 'fas fa-times' : 'fas fa-bars';
        }

        mobileMenuBtn.setAttribute('aria-expanded', this.state.menuOpen);

        // Bloquer/débloquer le scroll
        document.body.style.overflow = this.state.menuOpen ? 'hidden' : '';

        // Analytics
        if (this.analytics) {
            this.analytics.trackEvent('navigation', 'mobile_menu_toggle', this.state.menuOpen ? 'open' : 'close');
        }
    }

    initSmoothScrolling() {
        const header = document.getElementById('header');
        const headerHeight = header ? header.offsetHeight : 0;

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();

                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const targetPosition = targetElement.offsetTop - headerHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Mettre à jour l'URL sans recharger la page
                    history.pushState(null, null, targetId);

                    // Track analytics
                    if (this.analytics) {
                        this.analytics.trackEvent('navigation', 'smooth_scroll', targetId);
                    }
                }
            });
        });
    }

    initActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        const updateActiveLink = () => {
            const scrollPosition = window.scrollY + 100;
            let currentSection = '';

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSection = sectionId;
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href')?.replace('#', '');
                if (href === currentSection) {
                    link.classList.add('active');
                }
            });
        };

        window.addEventListener('scroll', updateActiveLink);
        updateActiveLink(); // Initial call
    }

    initTeamImages() {
        const teamImages = document.querySelectorAll('.team-img');

        teamImages.forEach(img => {
            // Lazy loading
            if (!img.loading) {
                img.loading = 'lazy';
            }

            // Gestion des erreurs
            img.addEventListener('error', () => {
                const container = img.closest('.team-img-container');
                if (container) {
                    container.innerHTML = `
                        <div class="team-img-placeholder">
                            <i class="fas fa-user-circle"></i>
                            <span>Photo non disponible</span>
                        </div>
                    `;
                }
            });

            // Animation au chargement
            img.addEventListener('load', () => {
                img.classList.add('loaded');
                img.style.opacity = '1';
            });
        });

        this.logger.debug(`${teamImages.length} images d'équipe initialisées`);
    }

    initAnimations() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');

        if (animatedElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');

                    // Animation spécifique pour les compteurs
                    if (entry.target.classList.contains('stat-number') ||
                        entry.target.classList.contains('impact-number')) {
                        this.animateCounter(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        animatedElements.forEach(el => {
            observer.observe(el);
        });

        this.logger.debug(`${animatedElements.length} éléments d'animation initialisés`);
    }

    animateCounter(counter) {
        if (counter.classList.contains('animated')) return;

        const target = parseInt(counter.getAttribute('data-count') || '0');
        const duration = 2000;
        const step = Math.ceil(target / (duration / 16));
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                counter.textContent = target.toLocaleString();
                clearInterval(timer);
                counter.classList.add('animated');
            } else {
                counter.textContent = Math.floor(current).toLocaleString();
            }
        }, 16);
    }

    initCounters() {
        const counters = document.querySelectorAll('.stat-number, .impact-number');

        if (counters.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            observer.observe(counter);
        });
    }

    initModals() {
        // Modal de donation
        const donationModal = document.getElementById('donationModal');
        const modalClose = document.getElementById('modalClose');

        if (donationModal && modalClose) {
            modalClose.addEventListener('click', () => {
                donationModal.classList.remove('active');
                document.body.style.overflow = '';
            });

            donationModal.addEventListener('click', (e) => {
                if (e.target === donationModal) {
                    donationModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }

        // Modal de galerie
        const galleryModal = document.getElementById('galleryModal');
        const galleryModalClose = document.getElementById('galleryModalClose');

        if (galleryModal && galleryModalClose) {
            galleryModalClose.addEventListener('click', () => {
                galleryModal.classList.remove('active');
                document.body.style.overflow = '';
            });

            galleryModal.addEventListener('click', (e) => {
                if (e.target === galleryModal) {
                    galleryModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }

        // Fermer avec Echap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (donationModal && donationModal.classList.contains('active')) {
                    donationModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
                if (galleryModal && galleryModal.classList.contains('active')) {
                    galleryModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });

        this.logger.debug('Modales initialisées');
    }

    initNewsletter() {
        const newsletterForm = document.querySelector('.newsletter-form');
        if (!newsletterForm) return;

        const newsletterBtn = newsletterForm.querySelector('.newsletter-btn');
        const newsletterInput = newsletterForm.querySelector('.newsletter-input');

        if (!newsletterBtn || !newsletterInput) return;

        newsletterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleNewsletterSubmit(newsletterInput, newsletterBtn);
        });

        newsletterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                newsletterBtn.click();
            }
        });
    }

    async handleNewsletterSubmit(input, btn) {
        const email = input.value.trim();

        if (!email || !this.validateEmail(email)) {
            this.toast.error('Veuillez entrer une adresse email valide');
            return;
        }

        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            // Simulation d'envoi - À remplacer par votre API
            await new Promise(resolve => setTimeout(resolve, 1500));

            this.toast.success('Merci pour votre inscription à notre newsletter!');
            input.value = '';

            // Analytics
            if (this.analytics) {
                this.analytics.trackEvent('newsletter', 'subscribed');
            }

        } catch (error) {
            this.toast.error('Erreur lors de l\'inscription');
            this.logger.error('Erreur newsletter:', error);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    validateEmail(email) {
        return CONFIG.VALIDATION.EMAIL_REGEX.test(email);
    }

    setupGlobalEvents() {
        // Scroll
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            this.state.scrollPosition = window.scrollY;

            // Header scroll effect
            const header = document.getElementById('header');
            if (header) {
                header.classList.toggle('scrolled', window.scrollY > 50);
            }

            // Back to top button
            const backToTopBtn = document.getElementById('backToTop');
            if (backToTopBtn) {
                backToTopBtn.classList.toggle('active', window.scrollY > 300);
            }

            // Debounce pour les animations
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, CONFIG.TIMEOUTS.DEBOUNCE_SCROLL);
        });

        // Back to top
        const backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });

                if (this.analytics) {
                    this.analytics.trackEvent('navigation', 'back_to_top');
                }
            });
        }

        // Resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, CONFIG.TIMEOUTS.DEBOUNCE_RESIZE);
        });

        // Before unload
        window.addEventListener('beforeunload', () => {
            this.saveSessionData();
        });

        // Page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });

        this.logger.debug('Événements globaux configurés');
    }

    setupIntersectionObserver() {
        // Observer pour les images lazy
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });

        // Observer pour les vidéos
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    video.play();
                } else {
                    video.pause();
                }
            });
        }, {
            threshold: 0.5
        });

        // Appliquer les observers
        document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
        document.querySelectorAll('video[autoplay]').forEach(video => videoObserver.observe(video));
    }

    setupNetworkDetection() {
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            this.toast.info('Connexion rétablie');

            // Synchroniser les données en attente
            this.syncPendingData();
        });

        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            this.toast.warning('Vous êtes hors ligne');
        });
    }

    handleScroll() {
        // Mettre à jour la navigation active
        this.initActiveNavigation();

        // Déclencher les animations
        const animatedElements = document.querySelectorAll('.animate-on-scroll:not(.visible)');
        animatedElements.forEach(el => {
            if (this.isElementInViewport(el)) {
                el.classList.add('visible');
            }
        });
    }

    handleResize() {
        const width = window.innerWidth;
        const wasMobile = this.state.isMobile;
        const wasTablet = this.state.isTablet;

        this.state.isMobile = width <= CONFIG.BREAKPOINTS.MOBILE;
        this.state.isTablet = width <= CONFIG.BREAKPOINTS.TABLET && width > CONFIG.BREAKPOINTS.MOBILE;

        // Fermer le menu mobile si on passe en desktop
        if (!this.state.isMobile && this.state.menuOpen) {
            this.toggleMobileMenu();
        }

        // Réinitialiser les composants si nécessaire
        if (wasMobile !== this.state.isMobile || wasTablet !== this.state.isTablet) {
            this.onBreakpointChange();
        }

        this.logger.debug(`Redimensionnement: ${width}px (mobile: ${this.state.isMobile}, tablet: ${this.state.isTablet})`);
    }

    onBreakpointChange() {
        // Réinitialiser le carousel
        if (this.components.carousel) {
            this.components.carousel.updateOptions({
                touchEnabled: this.state.isMobile || this.state.isTablet
            });
        }

        // Optimiser les images
        if (this.performance) {
            this.performance.optimizeImages();
        }
    }

    handlePageHidden() {
        this.logger.debug('Page cachée');

        // Pause des médias
        document.querySelectorAll('video, audio').forEach(media => {
            media.pause();
        });

        // Pause du carousel
        if (this.components.carousel) {
            this.components.carousel.pauseAutoPlay();
        }
    }

    handlePageVisible() {
        this.logger.debug('Page visible');

        // Reprise du carousel
        if (this.components.carousel) {
            this.components.carousel.resumeAutoPlay();
        }
    }

    startServices() {
        // Optimisation des performances
        if (this.performance) {
            this.performance.optimizeImages();
            this.performance.debounceResize();
            this.performance.monitorFPS();
        }

        // Synchronisation des données en attente
        this.syncPendingData();

        // Vérification des mises à jour
        this.checkForUpdates();

        this.logger.debug('Services démarrés');
    }

    async syncPendingData() {
        if (!this.state.isOnline) return;

        // Synchroniser les analytics en attente
        if (this.analytics) {
            this.analytics.flushPendingEvents();
        }

        // Synchroniser les formulaires en attente
        await this.syncPendingForms();
    }

    async syncPendingForms() {
        const pendingForms = [];

        // Récupérer les formulaires en attente depuis localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('pending_submission_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    pendingForms.push({ key, data });
                } catch (error) {
                    localStorage.removeItem(key);
                }
            }
        }

        // Traiter les formulaires en attente
        for (const { key, data } of pendingForms) {
            try {
                const response = await fetch(data.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data.data)
                });

                if (response.ok) {
                    localStorage.removeItem(key);
                    this.logger.info(`Formulaire en attente synchronisé: ${key}`);
                }
            } catch (error) {
                this.logger.warning(`Échec de synchronisation: ${key}`, error);
            }
        }
    }

    async checkForUpdates() {
        if (!CONFIG.DEBUG_MODE) return;

        try {
            const response = await fetch('/api/check-updates/', {
                method: 'HEAD',
                cache: 'no-cache'
            });

            const lastModified = response.headers.get('Last-Modified');
            const cachedLastModified = localStorage.getItem('last_modified');

            if (lastModified && lastModified !== cachedLastModified) {
                this.logger.info('Nouvelles mises à jour disponibles');
                this.showUpdateNotification();

                localStorage.setItem('last_modified', lastModified);
            }
        } catch (error) {
            // Silently fail
        }
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <p>Une nouvelle version du site est disponible.</p>
            <button onclick="location.reload()">Recharger</button>
            <button onclick="this.parentNode.remove()">Plus tard</button>
        `;

        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
        `;

        document.body.appendChild(notification);
    }

    trackPageView() {
        if (this.analytics) {
            this.analytics.trackPageView();
        }
    }

    saveSessionData() {
        const sessionData = {
            sessionId: APP_STATE.session.id,
            pageViews: APP_STATE.session.pageViews,
            events: APP_STATE.session.events,
            duration: Date.now() - APP_STATE.session.startTime,
            timestamp: Date.now()
        };

        localStorage.setItem(CONFIG.LOCAL_STORAGE_KEYS.SESSION_ID, JSON.stringify(sessionData));
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/') return 'home';
        return path.replace(/\//g, '').replace('.html', '') || 'home';
    }

    isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;

        return (
            rect.top <= windowHeight * 0.85 &&
            rect.bottom >= 0
        );
    }

    // Méthodes publiques
    showToast(message, type = 'info', duration = 5000) {
        if (this.toast) {
            this.toast.show(message, type, duration);
        }
    }

    toggleTheme() {
        if (this.theme) {
            this.theme.toggleTheme();
        }
    }

    getSiteState() {
        return {
            ...this.state,
            performance: this.performance ? this.performance.getMetrics() : null,
            theme: this.theme ? this.theme.getTheme() : null,
            analytics: this.analytics ? this.analytics.events.length : 0
        };
    }

    destroy() {
        // Détruire tous les composants
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });

        // Détruire tous les modules
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });

        // Détruire les modules de base
        if (this.events) this.events.destroyAll();
        if (this.performance) this.performance.destroy();
        if (this.theme) this.theme.destroy();

        this.logger.info('Gestionnaire de site détruit');
    }
}

// =====================================================================
## SITE WEB ORPHELIN PRIORITÉ ASBL - INITIALISATION FINALE
// =====================================================================

// Initialisation lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🔧 ORPHELIN PRIORITÉ ASBL - Système initialisation', 'color: #3498db; font-size: 14px; font-weight: bold;');
    console.log('%cVersion: 3.0.0 | Mode: ' + (CONFIG.DEBUG_MODE ? 'Développement' : 'Production'), 'color: #2ecc71;');

    // Initialiser l'application
    try {
        // Créer l'instance principale
        window.SiteApp = new SiteManager();

        // Exposer certaines méthodes globalement
        window.showDonationModal = function (type) {
            const donationModal = document.getElementById('donationModal');
            if (!donationModal) return;

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
                    </div>
                `;
            }

            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalContent').innerHTML = content;
            donationModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        window.openGalleryModal = function (galleryItem) {
            const galleryModal = document.getElementById('galleryModal');
            if (!galleryModal) return;

            const img = galleryItem.querySelector('img') || galleryItem.querySelector('.fas');
            const title = galleryItem.querySelector('h4')?.textContent || '';
            const description = galleryItem.querySelector('p')?.textContent || '';

            if (img && galleryModalImg && galleryModalCaption) {
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
            }
        };

        console.log('%c✅ Application initialisée avec succès!', 'color: #2ecc71; font-weight: bold;');

    } catch (error) {
        console.error('%c❌ Erreur lors de l\'initialisation:', 'color: #e74c3c; font-weight: bold;', error);

        // Fallback basique si l'application échoue
        document.body.classList.remove('no-js');

        const fallbackStyle = document.createElement('style');
        fallbackStyle.textContent = `
            .no-js-fallback { display: none; }
            body { opacity: 1 !important; }
        `;
        document.head.appendChild(fallbackStyle);
    }
});

// Gérer l'événement de chargement complet
window.addEventListener('load', () => {
    // Masquer le preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.transition = 'opacity 0.5s ease';
            preloader.style.opacity = '0';

            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, CONFIG.TIMEOUTS.PRELOADER);
    }

    // Démarrer les animations des compteurs
    if (window.SiteApp) {
        window.SiteApp.initCounters();
    }

    // Track performance
    if (window.performanceMonitor) {
        setTimeout(() => {
            window.performanceMonitor.sendMetricsToAnalytics();
        }, 2000);
    }

    console.log('%c🚀 Site complètement chargé et prêt!', 'color: #9b59b6; font-weight: bold;');
});

// Gérer les erreurs non capturées
window.addEventListener('error', (event) => {
    console.error('%c🔥 Erreur non capturée:', 'color: #e74c3c; font-weight: bold;', event.error);

    // Envoyer à l'analytics si disponible
    if (window.analytics) {
        window.analytics.trackEvent('error', 'uncaught', event.error.message);
    }
});

// Gérer les promesses non gérées
window.addEventListener('unhandledrejection', (event) => {
    console.error('%c⚠️ Promesse non gérée:', 'color: #f39c12; font-weight: bold;', event.reason);
});

// =====================================================================
// FIN DU SCRIPT PRINCIPAL - ORPHELIN PRIORITÉ ASBL
// =====================================================================