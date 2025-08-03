// Utility functions for the GoKart Racing Game

class Utils {
    // Mathematical utilities
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    static normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    static angleDifference(a1, a2) {
        return this.normalizeAngle(a2 - a1);
    }

    static randomFloat(min, max) {
        return min + Math.random() * (max - min);
    }

    static randomInt(min, max) {
        return Math.floor(min + Math.random() * (max - min + 1));
    }

    // Vector operations
    static createVector(x = 0, y = 0) {
        return { x, y };
    }

    static vectorAdd(v1, v2) {
        return { x: v1.x + v2.x, y: v1.y + v2.y };
    }

    static vectorSubtract(v1, v2) {
        return { x: v1.x - v2.x, y: v1.y - v2.y };
    }

    static vectorMultiply(v, scalar) {
        return { x: v.x * scalar, y: v.y * scalar };
    }

    static vectorMagnitude(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }

    static vectorNormalize(v) {
        const mag = this.vectorMagnitude(v);
        if (mag === 0) return { x: 0, y: 0 };
        return { x: v.x / mag, y: v.y / mag };
    }

    static vectorDot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    // Collision detection
    static circleCircleCollision(x1, y1, r1, x2, y2, r2) {
        const distance = this.distance(x1, y1, x2, y2);
        return distance < (r1 + r2);
    }

    static pointInCircle(px, py, cx, cy, radius) {
        return this.distance(px, py, cx, cy) <= radius;
    }

    static lineCircleIntersection(x1, y1, x2, y2, cx, cy, radius) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const fx = x1 - cx;
        const fy = y1 - cy;

        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = (fx * fx + fy * fy) - radius * radius;

        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) return false;

        const discriminantSqrt = Math.sqrt(discriminant);
        const t1 = (-b - discriminantSqrt) / (2 * a);
        const t2 = (-b + discriminantSqrt) / (2 * a);

        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    }

    // Rectangle collision detection
    static rectRectCollision(r1, r2) {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    }

    static pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
    }

    // Time utilities
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    static now() {
        return performance.now() / 1000;
    }

    // Array utilities
    static shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Color utilities
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    }

    static interpolateColor(color1, color2, factor) {
        if (arguments.length < 3) factor = 0.5;
        
        const result = color1.slice();
        for (let i = 0; i < 3; i++) {
            result[i] = Math.round(result[i] + factor * (color2[i] - result[i]));
        }
        return result;
    }

    // Canvas utilities
    static createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    static resizeCanvas(canvas, width, height) {
        canvas.width = width;
        canvas.height = height;
    }

    static getCanvasImageData(canvas) {
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    // Performance utilities
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    static debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Storage utilities
    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
            return false;
        }
    }

    static loadFromLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
            return defaultValue;
        }
    }

    static removeFromLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('Failed to remove from localStorage:', e);
            return false;
        }
    }

    // Device detection
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    static isAndroid() {
        return /Android/.test(navigator.userAgent);
    }

    static hasTouch() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    static getViewportSize() {
        return {
            width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };
    }

    // URL utilities
    static getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    static setQueryParam(name, value) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(name, value);
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }

    // Audio utilities
    static createAudioContext() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        return new AudioContext();
    }

    static loadAudioBuffer(audioContext, url) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            
            request.onload = function() {
                audioContext.decodeAudioData(
                    request.response,
                    resolve,
                    reject
                );
            };
            
            request.onerror = reject;
            request.send();
        });
    }

    // Image utilities
    static loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    static createImageFromCanvas(canvas) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve);
        });
    }

    // Game-specific utilities
    static generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    static generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static sanitizePlayerName(name) {
        return name.replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 20) || 'Anonymous';
    }

    // Physics utilities
    static calculateSlipstreamEffect(kart1, kart2, maxDistance = 100) {
        const distance = this.distance(kart1.x, kart1.y, kart2.x, kart2.y);
        if (distance > maxDistance) return 0;

        const angle1 = kart1.rotation;
        const angle2 = this.angle(kart1.x, kart1.y, kart2.x, kart2.y);
        const angleDiff = Math.abs(this.angleDifference(angle1, angle2));

        if (angleDiff > Math.PI / 4) return 0; // Not behind the kart

        const factor = 1 - (distance / maxDistance);
        return factor * 0.3; // 30% speed boost at maximum
    }

    static calculateCornering(speed, radius, maxSpeed = 100) {
        const optimalSpeed = Math.sqrt(radius * 0.5);
        if (speed > optimalSpeed) {
            return Math.max(0, 1 - (speed - optimalSpeed) / maxSpeed);
        }
        return 1;
    }

    // Track utilities
    static isPointOnTrack(x, y, trackPath) {
        // Simple implementation - check if point is within track bounds
        let inside = false;
        for (let i = 0, j = trackPath.length - 1; i < trackPath.length; j = i++) {
            if (((trackPath[i].y > y) !== (trackPath[j].y > y)) &&
                (x < (trackPath[j].x - trackPath[i].x) * (y - trackPath[i].y) / (trackPath[j].y - trackPath[i].y) + trackPath[i].x)) {
                inside = !inside;
            }
        }
        return inside;
    }

    static getTrackProgress(x, y, checkpoints) {
        let minDistance = Infinity;
        let closestCheckpoint = 0;
        
        for (let i = 0; i < checkpoints.length; i++) {
            const distance = this.distance(x, y, checkpoints[i].x, checkpoints[i].y);
            if (distance < minDistance) {
                minDistance = distance;
                closestCheckpoint = i;
            }
        }
        
        return closestCheckpoint / checkpoints.length;
    }

    // Error handling
    static handleError(error, context = 'Game') {
        console.error(`[${context}] Error:`, error);
        
        // Send error to analytics if available
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: error.message || error.toString(),
                fatal: false
            });
        }
    }

    // Animation utilities
    static easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    static easeIn(t) {
        return t * t;
    }

    static easeOut(t) {
        return t * (2 - t);
    }

    static bounce(t) {
        if (t < 1/2.75) {
            return 7.5625 * t * t;
        } else if (t < 2/2.75) {
            return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
        } else if (t < 2.5/2.75) {
            return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
        }
    }
}

// Global utility instance
window.Utils = Utils;