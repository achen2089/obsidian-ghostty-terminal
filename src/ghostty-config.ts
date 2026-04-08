import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface GhosttyThemeColors {
    background?: string;
    foreground?: string;
    cursor?: string;
    cursorText?: string;
    selectionBackground?: string;
    selectionForeground?: string;
    // 16 ANSI colors
    black?: string;
    red?: string;
    green?: string;
    yellow?: string;
    blue?: string;
    magenta?: string;
    cyan?: string;
    white?: string;
    brightBlack?: string;
    brightRed?: string;
    brightGreen?: string;
    brightYellow?: string;
    brightBlue?: string;
    brightMagenta?: string;
    brightCyan?: string;
    brightWhite?: string;
}

export interface GhosttyKeybind {
    mods: Set<string>;  // 'super' | 'ctrl' | 'shift' | 'alt'
    key: string;        // ghostty key name, lowercased
    action: string;     // e.g. 'copy_to_clipboard', 'paste_from_clipboard', 'text:\n'
}

export interface GhosttyConfig {
    // Font
    fontFamily?: string;
    fontFamilyBold?: string;
    fontFamilyItalic?: string;
    fontFamilyBoldItalic?: string;
    fontSize?: number;
    fontStyle?: string;
    fontStyleBold?: string;
    fontStyleItalic?: string;
    fontStyleBoldItalic?: string;
    fontSyntheticStyle?: string;  // bool or comma-separated: no-bold,no-italic,no-bold-italic
    fontVariation?: string[];
    fontVariationBold?: string[];
    fontVariationItalic?: string[];
    fontVariationBoldItalic?: string[];
    fontCodepointMap?: string[];  // repeatable: codepoint_range=fontname
    fontThicken?: boolean;
    fontThickenStrength?: number; // 0-255
    fontShapingBreak?: string;    // comma-separated
    fontFeatures?: string[];      // accumulative, repeatable

    // Layout
    lineHeight?: number;
    letterSpacing?: number;
    adjustCellWidth?: string;     // percentage or pixel offset
    adjustFontBaseline?: string;
    adjustUnderlinePosition?: string;
    adjustUnderlineThickness?: string;
    adjustStrikethroughPosition?: string;
    adjustStrikethroughThickness?: string;
    adjustOverlinePosition?: string;
    adjustOverlineThickness?: string;
    adjustCursorThickness?: string;
    adjustCursorHeight?: string;
    adjustBoxThickness?: string;

    // Cursor
    cursorStyle?: 'block' | 'bar' | 'underline';
    cursorBlink?: boolean;

    // Theme
    theme?: string;
    colors: GhosttyThemeColors;

    // Background/Window
    backgroundOpacity?: number;   // 0-1
    backgroundImage?: string;     // path
    backgroundImageOpacity?: number;
    backgroundImagePosition?: string;
    backgroundImageFit?: string;
    backgroundImageRepeat?: string;
    windowPaddingX?: number;      // pixels
    windowPaddingY?: number;      // pixels
    minimumContrast?: number;     // 1-21

    // Selection/Input
    selectionClearOnTyping?: boolean;
    selectionClearOnCopy?: boolean;
    selectionWordChars?: string;
    mouseHideWhileTyping?: boolean;
    confirmCloseSurface?: boolean;

    // Rendering
    alphaBlending?: string;       // native|linear|linear-corrected
    graphemeWidthMethod?: string;  // legacy|unicode

    // Scrollback
    scrollback?: number;

    // Shell
    shell?: string;

    // Ligatures (derived from font-feature)
    ligatures?: boolean;

    // Keybinds
    keybinds: GhosttyKeybind[];
}

/** Returns candidate config file paths in priority order */
function getCandidatePaths(overridePath?: string): string[] {
    if (overridePath) return [overridePath];

    const candidates: string[] = [];

    // XDG / Linux / newer macOS Ghostty
    const xdgConfig = process.env.XDG_CONFIG_HOME
        ? path.join(process.env.XDG_CONFIG_HOME, 'ghostty', 'config')
        : path.join(os.homedir(), '.config', 'ghostty', 'config');
    candidates.push(xdgConfig);

    // macOS Application Support fallback
    if (process.platform === 'darwin') {
        candidates.push(
            path.join(os.homedir(), 'Library', 'Application Support', 'com.mitchellh.ghostty', 'config')
        );
    }

    return candidates;
}

/** Returns candidate theme directories in priority order */
function getThemeDirs(): string[] {
    const dirs: string[] = [];

    // User theme dirs
    const xdgConfig = process.env.XDG_CONFIG_HOME
        ? path.join(process.env.XDG_CONFIG_HOME, 'ghostty', 'themes')
        : path.join(os.homedir(), '.config', 'ghostty', 'themes');
    dirs.push(xdgConfig);

    if (process.platform === 'darwin') {
        dirs.push(
            path.join(os.homedir(), 'Library', 'Application Support', 'com.mitchellh.ghostty', 'themes')
        );
    }

    // Ghostty built-in themes (common install locations)
    const builtinPaths = [
        // macOS app bundle
        '/Applications/Ghostty.app/Contents/Resources/ghostty/themes',
        '/usr/share/ghostty/themes',
        '/usr/local/share/ghostty/themes',
        '/opt/homebrew/share/ghostty/themes',
        // Flatpak
        path.join(os.homedir(), '.local', 'share', 'flatpak', 'app', 'com.mitchellh.ghostty', 'current', 'active', 'files', 'share', 'ghostty', 'themes'),
    ];

    // Also check if GHOSTTY_RESOURCES_DIR is set
    if (process.env.GHOSTTY_RESOURCES_DIR) {
        dirs.push(path.join(process.env.GHOSTTY_RESOURCES_DIR, 'themes'));
    }

    dirs.push(...builtinPaths);
    return dirs;
}

/** Expand $HOME / ~ in string values */
function expandHome(val: string): string {
    if (val.startsWith('~')) return path.join(os.homedir(), val.slice(1));
    return val;
}

/** Normalize a color value: convert rgb(...) or named colors Ghostty may output */
function normalizeColor(val: string): string {
    val = val.trim();
    // Ghostty uses hex (with or without #)
    if (/^[0-9a-fA-F]{6}$/.test(val)) return '#' + val;
    if (/^#[0-9a-fA-F]{3,8}$/.test(val)) return val;
    return val;
}

/**
 * Resolve a theme name to its file path. Returns null if not found.
 */
function resolveThemeFile(themeName: string): string | null {
    const themeDirs = getThemeDirs();
    for (const dir of themeDirs) {
        // Try exact name, then with common extensions
        const candidates = [
            path.join(dir, themeName),
            path.join(dir, themeName + '.conf'),
            path.join(dir, themeName + '.theme'),
        ];
        for (const candidate of candidates) {
            try {
                if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                    return candidate;
                }
            } catch {
                // skip
            }
        }
    }
    return null;
}

/**
 * Parse a Ghostty config/theme file into key-value pairs.
 * Does NOT apply them — just returns the raw lines.
 */
function parseConfigLines(content: string): Array<{ key: string; value: string }> {
    const entries: Array<{ key: string; value: string }> = [];
    const lines = content.split('\n');
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) continue;

        // Section header — skip
        if (/^\[.+\]$/.test(trimmedLine)) continue;

        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) continue;

        const key = line.slice(0, eqIdx).trim().toLowerCase();
        const value = line.slice(eqIdx + 1).trim();

        // Strip inline comments (but not inside quoted values)
        const commentIdx = value.indexOf(' #');
        const cleanValue = commentIdx !== -1 ? value.slice(0, commentIdx).trim() : value;

        entries.push({ key, value: cleanValue });
    }
    return entries;
}

/**
 * Load and parse theme colors from a theme file.
 * Theme files are just Ghostty config files but we only extract color-related keys.
 * Theme resolution does NOT recurse — themes cannot set `theme`.
 */
function loadThemeColors(themeName: string): GhosttyThemeColors {
    const colors: GhosttyThemeColors = {};
    const themeFile = resolveThemeFile(themeName);
    if (!themeFile) {
        console.debug(`[GhosttyTerminal] Theme "${themeName}" not found in any theme directory`);
        return colors;
    }

    try {
        const content = fs.readFileSync(themeFile, 'utf8');
        const entries = parseConfigLines(content);
        for (const { key, value } of entries) {
            // Only apply color-related keys from theme files
            applyColorKey(colors, key, value);
        }
        console.debug(`[GhosttyTerminal] Loaded theme "${themeName}" from: ${themeFile}`);
    } catch (e) {
        console.debug(`[GhosttyTerminal] Failed to read theme file: ${themeFile}`, e);
    }
    return colors;
}

/**
 * Apply a color-related config key to a GhosttyThemeColors object.
 * Returns true if the key was handled.
 */
function applyColorKey(colors: GhosttyThemeColors, key: string, value: string): boolean {
    switch (key) {
        case 'background':
            colors.background = normalizeColor(value);
            return true;
        case 'foreground':
            colors.foreground = normalizeColor(value);
            return true;
        case 'cursor-color':
            colors.cursor = normalizeColor(value);
            return true;
        case 'cursor-text':
            colors.cursorText = normalizeColor(value);
            return true;
        case 'selection-background':
            colors.selectionBackground = normalizeColor(value);
            return true;
        case 'selection-foreground':
            colors.selectionForeground = normalizeColor(value);
            return true;
        case 'palette': {
            const [idxStr, colorStr] = value.split('=');
            const idx = parseInt(idxStr.trim(), 10);
            const color = normalizeColor((colorStr || '').trim());
            applyPaletteColor(colors, idx, color);
            return true;
        }
        default:
            return false;
    }
}

function parseBool(value: string): boolean {
    return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Parse a Ghostty config file.
 * Ghostty config is line-delimited key = value (comments with #).
 *
 * Resolution order:
 * 1. Parse the main config to find the theme name
 * 2. Resolve and apply theme colors as base
 * 3. Apply all main config on top (explicit settings override theme)
 */
export function parseGhosttyConfig(overridePath?: string): GhosttyConfig {
    const config: GhosttyConfig = {
        colors: {},
        keybinds: [],
        fontFeatures: [],
        fontVariation: [],
        fontVariationBold: [],
        fontVariationItalic: [],
        fontVariationBoldItalic: [],
        fontCodepointMap: [],
    };

    const candidates = getCandidatePaths(overridePath);
    let rawContent: string | null = null;

    for (const candidate of candidates) {
        try {
            if (fs.existsSync(candidate)) {
                rawContent = fs.readFileSync(candidate, 'utf8');
                console.debug(`[GhosttyTerminal] Loaded config from: ${candidate}`);
                break;
            }
        } catch {
            // skip unreadable paths
        }
    }

    if (!rawContent) {
        console.debug('[GhosttyTerminal] No Ghostty config found; using defaults.');
        return config;
    }

    const entries = parseConfigLines(rawContent);

    // First pass: find theme name
    let themeName: string | undefined;
    for (const { key, value } of entries) {
        if (key === 'theme') {
            themeName = value;
        }
    }

    // Resolve theme and apply as base colors
    if (themeName) {
        config.theme = themeName;
        const resolvedColors = resolveTheme(themeName);
        Object.assign(config.colors, resolvedColors);
    }

    // Second pass: apply all config (overrides theme colors)
    for (const { key, value } of entries) {
        applyConfigKey(config, key, value);
    }

    // Derive ligatures from font features if not explicitly set
    if (config.ligatures === undefined && config.fontFeatures && config.fontFeatures.length > 0) {
        // If any feature starts with '-', check for -calt specifically
        const hasCalt = config.fontFeatures.some(f => f.toLowerCase().includes('calt'));
        const hasNegativeCalt = config.fontFeatures.some(f => f.startsWith('-') && f.toLowerCase().includes('calt'));
        if (hasNegativeCalt) config.ligatures = false;
        else if (hasCalt) config.ligatures = true;
    }

    return config;
}

/**
 * Resolve a theme value. Supports:
 * - Simple name: "catppuccin-mocha"
 * - Light/dark syntax: "light:catppuccin-latte,dark:catppuccin-mocha"
 *
 * For light/dark, we default to dark theme (Obsidian tends to be dark-themed).
 */
function resolveTheme(themeValue: string): GhosttyThemeColors {
    // Check for light:X,dark:Y syntax
    if (themeValue.includes(':')) {
        const parts = themeValue.split(',').map(s => s.trim());
        let darkTheme: string | undefined;
        let lightTheme: string | undefined;

        for (const part of parts) {
            const colonIdx = part.indexOf(':');
            if (colonIdx === -1) continue;
            const prefix = part.slice(0, colonIdx).trim().toLowerCase();
            const name = part.slice(colonIdx + 1).trim();
            if (prefix === 'dark') darkTheme = name;
            else if (prefix === 'light') lightTheme = name;
        }

        // Prefer dark theme, fall back to light
        const chosen = darkTheme || lightTheme;
        if (chosen) {
            return loadThemeColors(chosen);
        }
        return {};
    }

    // Simple theme name
    return loadThemeColors(themeValue);
}

function applyConfigKey(config: GhosttyConfig, key: string, value: string) {
    // Try color keys first
    if (applyColorKey(config.colors, key, value)) return;

    switch (key) {
        // ── Font ──────────────────────────────────────────────────
        case 'font-family':
            config.fontFamily = value;
            break;
        case 'font-family-bold':
            config.fontFamilyBold = value;
            break;
        case 'font-family-italic':
            config.fontFamilyItalic = value;
            break;
        case 'font-family-bold-italic':
            config.fontFamilyBoldItalic = value;
            break;
        case 'font-size':
            config.fontSize = parseFloat(value) || undefined;
            break;
        case 'font-style':
            config.fontStyle = value;
            break;
        case 'font-style-bold':
            config.fontStyleBold = value;
            break;
        case 'font-style-italic':
            config.fontStyleItalic = value;
            break;
        case 'font-style-bold-italic':
            config.fontStyleBoldItalic = value;
            break;
        case 'font-synthetic-style':
            config.fontSyntheticStyle = value;
            break;
        case 'font-variation':
            config.fontVariation!.push(value);
            break;
        case 'font-variation-bold':
            config.fontVariationBold!.push(value);
            break;
        case 'font-variation-italic':
            config.fontVariationItalic!.push(value);
            break;
        case 'font-variation-bold-italic':
            config.fontVariationBoldItalic!.push(value);
            break;
        case 'font-codepoint-map':
            config.fontCodepointMap!.push(value);
            break;
        case 'font-thicken':
            config.fontThicken = parseBool(value);
            break;
        case 'font-thicken-strength':
            config.fontThickenStrength = Math.max(0, Math.min(255, parseInt(value, 10) || 0));
            break;
        case 'font-shaping-break':
            config.fontShapingBreak = value;
            break;
        case 'font-feature':
            // Accumulative — each line adds a feature
            config.fontFeatures!.push(value);
            // Also update ligatures flag
            if (value.startsWith('-') && value.toLowerCase().includes('calt')) {
                config.ligatures = false;
            } else if (value.toLowerCase().includes('calt')) {
                config.ligatures = true;
            }
            break;

        // ── Layout adjustments ────────────────────────────────────
        case 'adjust-cell-height':
            // Ghostty uses percentage offsets; map roughly to lineHeight
            config.lineHeight = 1.0 + (parseFloat(value) / 100) || 1.0;
            break;
        case 'adjust-cell-width':
            config.adjustCellWidth = value;
            break;
        case 'adjust-font-baseline':
            config.adjustFontBaseline = value;
            break;
        case 'adjust-underline-position':
            config.adjustUnderlinePosition = value;
            break;
        case 'adjust-underline-thickness':
            config.adjustUnderlineThickness = value;
            break;
        case 'adjust-strikethrough-position':
            config.adjustStrikethroughPosition = value;
            break;
        case 'adjust-strikethrough-thickness':
            config.adjustStrikethroughThickness = value;
            break;
        case 'adjust-overline-position':
            config.adjustOverlinePosition = value;
            break;
        case 'adjust-overline-thickness':
            config.adjustOverlineThickness = value;
            break;
        case 'adjust-cursor-thickness':
            config.adjustCursorThickness = value;
            break;
        case 'adjust-cursor-height':
            config.adjustCursorHeight = value;
            break;
        case 'adjust-box-thickness':
            config.adjustBoxThickness = value;
            break;

        // ── Cursor ────────────────────────────────────────────────
        case 'cursor-style':
            if (['block', 'bar', 'underline'].includes(value)) {
                config.cursorStyle = value as 'block' | 'bar' | 'underline';
            }
            break;
        case 'cursor-style-blink':
            config.cursorBlink = parseBool(value);
            break;

        // ── Theme (stored but resolved separately) ────────────────
        case 'theme':
            config.theme = value;
            break;

        // ── Background/Window ─────────────────────────────────────
        case 'background-opacity':
            config.backgroundOpacity = Math.max(0, Math.min(1, parseFloat(value) || 1));
            break;
        case 'background-image':
            config.backgroundImage = expandHome(value);
            break;
        case 'background-image-opacity':
            config.backgroundImageOpacity = Math.max(0, Math.min(1, parseFloat(value) || 1));
            break;
        case 'background-image-position':
            config.backgroundImagePosition = value;
            break;
        case 'background-image-fit':
            config.backgroundImageFit = value;
            break;
        case 'background-image-repeat':
            config.backgroundImageRepeat = value;
            break;
        case 'window-padding-x':
            config.windowPaddingX = parseInt(value, 10) || 0;
            break;
        case 'window-padding-y':
            config.windowPaddingY = parseInt(value, 10) || 0;
            break;
        case 'minimum-contrast':
            config.minimumContrast = Math.max(1, Math.min(21, parseFloat(value) || 1));
            break;

        // ── Selection/Input ───────────────────────────────────────
        case 'selection-clear-on-typing':
            config.selectionClearOnTyping = parseBool(value);
            break;
        case 'selection-clear-on-copy':
            config.selectionClearOnCopy = parseBool(value);
            break;
        case 'selection-word-chars':
            config.selectionWordChars = value;
            break;
        case 'mouse-hide-while-typing':
            config.mouseHideWhileTyping = parseBool(value);
            break;
        case 'confirm-close-surface':
            config.confirmCloseSurface = parseBool(value);
            break;

        // ── Rendering ─────────────────────────────────────────────
        case 'alpha-blending':
            config.alphaBlending = value;
            break;
        case 'grapheme-width-method':
            config.graphemeWidthMethod = value;
            break;

        // ── Scrollback ────────────────────────────────────────────
        case 'scrollback-limit':
            config.scrollback = parseInt(value, 10) || undefined;
            break;

        // ── Shell ─────────────────────────────────────────────────
        case 'command':
            config.shell = expandHome(value);
            break;

        // ── Keybindings ───────────────────────────────────────────
        case 'keybind': {
            const eqIdx = value.lastIndexOf('=');
            if (eqIdx === -1) break;
            const combo = value.slice(0, eqIdx).trim();
            const action = value.slice(eqIdx + 1).trim();
            if (!combo || !action) break;

            const parts = combo.split('+');
            const keyVal = parts[parts.length - 1].toLowerCase();
            const mods = new Set(parts.slice(0, -1).map(m => m.toLowerCase()));
            config.keybinds.push({ mods, key: keyVal, action });
            break;
        }
    }
}

const PALETTE_NAMES: (keyof GhosttyThemeColors)[] = [
    'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
    'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
    'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
];

function applyPaletteColor(colors: GhosttyThemeColors, idx: number, color: string) {
    if (idx >= 0 && idx < PALETTE_NAMES.length) {
        (colors as Record<string, string>)[PALETTE_NAMES[idx]] = color;
    }
}
