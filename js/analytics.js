// analytics.js - Advanced tracking and A/B test integration for Modz4.0
(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    GA_TRACKING_ID: 'G-XTF87DM051', // Replace with actual
    API_ENDPOINT: 'https://modz40.netlify.app/analytics',
    DEBUG: false, // set false in production
    CONSENT_COOKIE: 'modz40_analytics_consent',
    VARIANT_COOKIE: 'modz40_ab_variant',
    DEFAULT_VARIANTS: {
      '/signup': ['/signup-a', '/signup-b']
    }
  };

  // State
  let consentGiven = false;
  let userId = null;

  // Utility functions
  const log = (...args) => CONFIG.DEBUG && console.log('[Analytics]', ...args);
  const error = (...args) => CONFIG.DEBUG && console.error('[Analytics]', ...args);

  // Cookie helpers
  const setCookie = (name, value, days = 365) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
  };

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };

  // Generate a random user ID
  const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  };

  // Get or create user ID
  const getUserId = () => {
    let uid = getCookie('modz40_uid');
    if (!uid) {
      uid = generateUserId();
      setCookie('modz40_uid', uid, 365);
    }
    return uid;
  };

  // A/B test assignment
  const getVariantForPath = (path) => {
    // Check if path is in test
    for (let [testPath, variants] of Object.entries(CONFIG.DEFAULT_VARIANTS)) {
      if (path === testPath || path.startsWith(testPath + '/')) {
        // Check if user already has a variant assigned
        let variant = getCookie(CONFIG.VARIANT_COOKIE + '_' + testPath);
        if (variant && variants.includes(variant)) {
          return variant;
        }
        // Assign new variant randomly
        const index = Math.floor(Math.random() * variants.length);
        variant = variants[index];
        setCookie(CONFIG.VARIANT_COOKIE + '_' + testPath, variant, 365);
        log(`Assigned variant ${variant} for ${testPath}`);
        return variant;
      }
    }
    return null;
  };

  // Actually redirect if needed (for A/B tests)
  const applyVariantRedirect = () => {
    const currentPath = window.location.pathname;
    const variant = getVariantForPath(currentPath);
    if (variant && currentPath !== variant) {
      log(`Redirecting to variant: ${variant}`);
      window.location.replace(variant);
    }
  };

  // Send event to analytics endpoint
  const sendEvent = (eventName, properties = {}) => {
    if (!consentGiven) return;
    const data = {
      event: eventName,
      properties: properties,
      user_id: userId,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    };

    // Send to API
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(CONFIG.API_ENDPOINT, blob);
    } else {
      fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(err => error('Failed to send event', err));
    }

    // Also log to console in debug
    log('Event sent:', eventName, properties);
  };

  // Page view tracking
  const trackPageView = () => {
    sendEvent('page_view', {
      path: window.location.pathname,
      title: document.title
    });
  };

  // Consent management
  const consentBanner = () => {
    if (getCookie(CONFIG.CONSENT_COOKIE) === 'accepted') {
      consentGiven = true;
      return;
    }
    // Show consent banner
    const banner = document.createElement('div');
    banner.id = 'analytics-consent-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #1e2430;
      color: white;
      padding: 1rem;
      text-align: center;
      z-index: 9999;
      border-top: 1px solid #3a4050;
    `;
    banner.innerHTML = `
      <p style="margin:0 0 10px;">We use cookies to improve your experience. By continuing, you agree to our use of analytics.</p>
      <button id="accept-analytics" style="background:#667eea; border:none; color:white; padding:8px 20px; border-radius:30px; cursor:pointer;">Accept</button>
      <button id="decline-analytics" style="background:transparent; border:1px solid #667eea; color:#667eea; padding:8px 20px; border-radius:30px; margin-left:10px; cursor:pointer;">Decline</button>
    `;
    document.body.appendChild(banner);

    document.getElementById('accept-analytics').addEventListener('click', () => {
      consentGiven = true;
      setCookie(CONFIG.CONSENT_COOKIE, 'accepted', 365);
      banner.remove();
      trackPageView(); // track initial view after consent
    });
    document.getElementById('decline-analytics').addEventListener('click', () => {
      setCookie(CONFIG.CONSENT_COOKIE, 'declined', 365);
      banner.remove();
    });
  };

  // Initialize
  const init = () => {
    userId = getUserId();
    consentGiven = getCookie(CONFIG.CONSENT_COOKIE) === 'accepted';
    
    if (!consentGiven) {
      consentBanner();
    } else {
      trackPageView();
    }

    // Apply A/B test redirects after consent (maybe before)
    applyVariantRedirect();

    // Track clicks on certain elements (e.g., signup buttons)
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a, button');
      if (!target) return;
      const text = target.innerText.trim();
      if (text && consentGiven) {
        sendEvent('click', { element_text: text, element_tag: target.tagName });
      }
    });

    // Track time on page
    let startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (consentGiven) {
        sendEvent('time_on_page', { seconds: timeSpent });
      }
    });
  };

  // Expose public methods if needed
  window.Modz40Analytics = {
    trackEvent: sendEvent,
    setConsent: (accept) => {
      consentGiven = accept;
      setCookie(CONFIG.CONSENT_COOKIE, accept ? 'accepted' : 'declined', 365);
    }
  };

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
