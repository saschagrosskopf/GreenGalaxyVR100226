/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔐 ENTERPRISE SECURITY UTILITIES
 * GreenGalaxy VR Platform - Security hardening for enterprise deployment
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🔑 SECURE ID GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generates a cryptographically secure random ID
 * Uses Web Crypto API instead of Math.random()
 */
export const generateSecureId = (prefix: string = 'id'): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}_${hex}`;
};

/**
 * Generates a secure session ID for multiplayer
 */
export const generateSessionId = (): string => {
    return generateSecureId('session');
};

/**
 * Generates a secure player ID
 */
export const generatePlayerId = (): string => {
    return generateSecureId('player');
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ INPUT SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sanitizes user text input to prevent XSS
 * Strips dangerous HTML/script content
 */
export const sanitizeTextInput = (input: string, maxLength: number = 500): string => {
    if (!input || typeof input !== 'string') return '';

    return input
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove on* event handlers
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        // Remove javascript: URLs
        .replace(/javascript:/gi, '')
        // Remove data: URLs (potential XSS vector)
        .replace(/data:/gi, '')
        // Escape HTML entities
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        // Trim whitespace
        .trim()
        // Enforce max length
        .slice(0, maxLength);
};

/**
 * Sanitizes a space/room name
 */
export const sanitizeSpaceName = (name: string): string => {
    if (!name || typeof name !== 'string') return 'Untitled Space';

    // Allow alphanumeric, spaces, dashes, underscores only
    const clean = name
        .replace(/[^a-zA-Z0-9\s\-_]/g, '')
        .trim()
        .slice(0, 100);

    return clean || 'Untitled Space';
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔗 URL VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * List of trusted GLB/GLTF model sources
 */
const TRUSTED_MODEL_DOMAINS = [
    'firebasestorage.googleapis.com',
    'storage.googleapis.com',
    'raw.githubusercontent.com',
    'github.com',
    'githubusercontent.com',
    'sketchfab.com',
    'cdn.sketchfab.com',
    'models.readyplayer.me',
    'localhost',
    '127.0.0.1'
];

/**
 * Validates a URL is from a trusted source for 3D models
 */
export const isValidModelUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;

    try {
        const parsed = new URL(url);

        // Must be HTTPS (or localhost for dev)
        if (!['https:', 'http:'].includes(parsed.protocol)) return false;
        if (parsed.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) {
            return false;
        }

        // Check trusted domains
        const isTrusted = TRUSTED_MODEL_DOMAINS.some(domain =>
            parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
        );

        // Check file extension
        const hasValidExtension = /\.(glb|gltf|obj|fbx)$/i.test(parsed.pathname);

        return isTrusted && hasValidExtension;
    } catch {
        return false;
    }
};

/**
 * Validates a URL is safe for iframe embedding (Google Workspace, etc.)
 */
export const isValidEmbedUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;

    const TRUSTED_EMBED_DOMAINS = [
        'docs.google.com',
        'sheets.google.com',
        'slides.google.com',
        'drive.google.com',
        'calendar.google.com',
        'youtube.com',
        'www.youtube.com',
        'vimeo.com',
        'figma.com',
        'miro.com'
    ];

    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;

        return TRUSTED_EMBED_DOMAINS.some(domain =>
            parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
        );
    } catch {
        return false;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 VR SAFETY LIMITS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * VR environment safety constants
 * Prevents performance issues and user discomfort
 */
export const VR_SAFETY_LIMITS = {
    // Camera/Avatar constraints
    MIN_CAMERA_HEIGHT: -10.0,    // Allow going below 0 for custom floors
    MAX_CAMERA_HEIGHT: 100.0,    // Allow flying for debug
    DEFAULT_AVATAR_HEIGHT: 0.0,  // Treat 0 as floor level

    // Movement constraints
    MAX_MOVEMENT_SPEED: 20,      // Max m/s to prevent motion sickness
    MAX_ROTATION_SPEED: 180,     // Max degrees/second

    // World bounds
    MAX_WORLD_SIZE: 500,         // Maximum world radius in meters
    MAX_OBJECTS_PER_SPACE: 1000, // Prevent performance issues

    // Model constraints
    MAX_GLB_FILE_SIZE: 50 * 1024 * 1024, // 50MB max for GLB files
    MAX_TEXTURE_SIZE: 4096,      // Max texture dimension

    // Multiplayer limits
    MAX_PLAYERS_PER_ROOM: 50,
    PLAYER_STALE_TIMEOUT: 30000, // 30 seconds
    POSITION_SYNC_INTERVAL: 16,  // 16ms (~60fps) for high-performance syncing

    // Rendering safety
    MAX_DRAW_CALLS: 500,
    MAX_TRIANGLES: 1000000,      // 1M triangles max
};

/**
 * Clamps camera position to safe bounds
 */
export const clampCameraPosition = (
    x: number,
    y: number,
    z: number
): [number, number, number] => {
    const { MIN_CAMERA_HEIGHT, MAX_CAMERA_HEIGHT, MAX_WORLD_SIZE } = VR_SAFETY_LIMITS;

    return [
        Math.max(-MAX_WORLD_SIZE, Math.min(MAX_WORLD_SIZE, x)),
        Math.max(MIN_CAMERA_HEIGHT, Math.min(MAX_CAMERA_HEIGHT, y)),
        Math.max(-MAX_WORLD_SIZE, Math.min(MAX_WORLD_SIZE, z))
    ];
};

/**
 * Validates scene object count is within limits
 */
export const isWithinObjectLimit = (currentCount: number): boolean => {
    return currentCount < VR_SAFETY_LIMITS.MAX_OBJECTS_PER_SPACE;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 AUTHENTICATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Role-based permission levels
 */
export const PERMISSION_LEVELS = {
    VIEWER: 0,
    EDITOR: 1,
    ADMIN: 2,
    OWNER: 3
} as const;

export type UserRole = 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER';

/**
 * Checks if user has required permission level
 */
export const hasPermission = (
    userRole: UserRole | undefined,
    requiredLevel: keyof typeof PERMISSION_LEVELS
): boolean => {
    if (!userRole) return false;
    return PERMISSION_LEVELS[userRole] >= PERMISSION_LEVELS[requiredLevel];
};

/**
 * Checks if user can edit a space
 */
export const canEditSpace = (userRole: UserRole | undefined): boolean => {
    return hasPermission(userRole, 'EDITOR');
};

/**
 * Checks if user can delete a space
 */
export const canDeleteSpace = (userRole: UserRole | undefined): boolean => {
    return hasPermission(userRole, 'ADMIN');
};

/**
 * Checks if user can manage team members
 */
export const canManageTeam = (userRole: UserRole | undefined): boolean => {
    return hasPermission(userRole, 'ADMIN');
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 AUDIT LOGGING
// ═══════════════════════════════════════════════════════════════════════════════

export interface AuditLogEntry {
    timestamp: string;
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, any>;
    ip?: string;
}

/**
 * Creates an audit log entry
 * In production, this would write to a secure audit log service
 */
export const createAuditLog = (
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>
): AuditLogEntry => {
    const entry: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        userId,
        action,
        resource,
        resourceId,
        details
    };

    // In production: send to audit log service
    if (process.env.NODE_ENV === 'development') {
        console.log('📋 AUDIT:', entry);
    }

    return entry;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔐 CONTENT SECURITY POLICY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Recommended CSP headers for VR application
 */
export const RECOMMENDED_CSP = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:', 'https://firebasestorage.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': [
        "'self'",
        'https://*.googleapis.com',
        'https://*.firebaseio.com',
        'wss://*.firebaseio.com',
        'https://firebasestorage.googleapis.com',
        'https://*.cloudfunctions.net'
    ],
    'frame-src': ['https://docs.google.com', 'https://drive.google.com', 'https://accounts.google.com'],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"]
};

/**
 * Generates CSP header string
 */
export const generateCSPString = (): string => {
    return Object.entries(RECOMMENDED_CSP)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
};

export default {
    generateSecureId,
    generateSessionId,
    generatePlayerId,
    sanitizeTextInput,
    sanitizeSpaceName,
    isValidModelUrl,
    isValidEmbedUrl,
    VR_SAFETY_LIMITS,
    clampCameraPosition,
    isWithinObjectLimit,
    hasPermission,
    canEditSpace,
    canDeleteSpace,
    canManageTeam,
    createAuditLog,
    RECOMMENDED_CSP,
    generateCSPString
};
