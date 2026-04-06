import { App, PluginSettingTab, Setting } from 'obsidian';
import type GhosttyTerminalPlugin from '../main';

export interface GhosttyTerminalSettings {
    /** Location to open the terminal by default */
    defaultLocation: 'right' | 'left' | 'tab' | 'split' | 'window';
    /** Override path to Ghostty config file. Empty = auto-detect. */
    ghosttyConfigPath: string;
    /** Default shell. Empty = use $SHELL env. */
    defaultShell: string;
    /** Override font family (empty = read from Ghostty config). */
    fontFamilyOverride: string;
    /** Override font size (0 = read from Ghostty config). */
    fontSizeOverride: number;
    /** Enable font ligatures */
    ligatures: boolean;
    /** Number of scrollback lines */
    scrollbackLines: number;
    /** Override background opacity (0 = use Ghostty config, 0.01-1.0). */
    backgroundOpacityOverride: number;
    /** Override window padding X in pixels (-1 = use Ghostty config). */
    windowPaddingXOverride: number;
    /** Override window padding Y in pixels (-1 = use Ghostty config). */
    windowPaddingYOverride: number;
}

export const DEFAULT_SETTINGS: GhosttyTerminalSettings = {
    defaultLocation: 'right',
    ghosttyConfigPath: '',
    defaultShell: '',
    fontFamilyOverride: 'JetBrains Mono, Menlo, Consolas, monospace',
    fontSizeOverride: 0,
    ligatures: true,
    scrollbackLines: 10000,
    backgroundOpacityOverride: 0,
    windowPaddingXOverride: -1,
    windowPaddingYOverride: -1,
};

export class GhosttySettingTab extends PluginSettingTab {
    plugin: GhosttyTerminalPlugin;

    constructor(app: App, plugin: GhosttyTerminalPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // --- Display ---
        new Setting(containerEl).setName('Display').setHeading();

        new Setting(containerEl)
            .setName('Default location')
            .setDesc('Where should the terminal launch by default?')
            .addDropdown(dropdown =>
                dropdown
                    .addOption('right', 'Right sidebar')
                    .addOption('left', 'Left sidebar')
                    .addOption('tab', 'New tab')
                    .addOption('split', 'New split')
                    .addOption('window', 'Popout window')
                    .setValue(this.plugin.settings.defaultLocation)
                    .onChange(async (value: 'right' | 'left' | 'tab' | 'split' | 'window') => {
                        this.plugin.settings.defaultLocation = value;
                        await this.plugin.saveSettings();
                    })
            );

        // --- Ghostty Config ---
        new Setting(containerEl).setName('Ghostty config').setHeading();

        new Setting(containerEl)
            .setName('Config file path')
            .setDesc('Path to your ghostty config file (leave blank to auto-detect).')
            .addText(text =>
                text
                    .setValue(this.plugin.settings.ghosttyConfigPath)
                    .onChange(async value => {
                        this.plugin.settings.ghosttyConfigPath = value;
                        await this.plugin.saveSettings();
                    })
            );

        // --- Shell ---
        new Setting(containerEl).setName('Shell').setHeading();

        new Setting(containerEl)
            .setName('Default shell')
            .setDesc('Path to shell binary (leave blank to use default shell).')
            .addText(text =>
                text
                    .setPlaceholder('/bin/zsh')
                    .setValue(this.plugin.settings.defaultShell)
                    .onChange(async value => {
                        this.plugin.settings.defaultShell = value;
                        await this.plugin.saveSettings();
                    })
            );

        // --- Font (overrides) ---
        new Setting(containerEl).setName('Font overrides').setHeading();
        containerEl.createEl('small', {
            text: 'These override values from your ghostty config (leave blank or 0 to use ghostty config values).',
            cls: 'setting-item-description',
        });

        new Setting(containerEl)
            .setName('Font family')
            .setDesc('Override font family.')
            .addText(text =>
                text
                    .setValue(this.plugin.settings.fontFamilyOverride)
                    .onChange(async value => {
                        this.plugin.settings.fontFamilyOverride = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Font size')
            .setDesc('Override font size (set to 0 to use default).')
            .addText(text =>
                text
                    .setPlaceholder('15')
                    .setValue(this.plugin.settings.fontSizeOverride > 0 ? String(this.plugin.settings.fontSizeOverride) : '')
                    .onChange(async value => {
                        this.plugin.settings.fontSizeOverride = parseFloat(value) || 0;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Font ligatures')
            .setDesc('Enable font ligatures (if supported by your font).')
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.ligatures)
                    .onChange(async value => {
                        this.plugin.settings.ligatures = value;
                        await this.plugin.saveSettings();
                    })
            );

        // --- Appearance ---
        new Setting(containerEl).setName('Appearance').setHeading();
        containerEl.createEl('small', {
            text: 'Override visual settings from your Ghostty config.',
            cls: 'setting-item-description',
        });

        new Setting(containerEl)
            .setName('Background opacity')
            .setDesc('Override background opacity (0 = use Ghostty config value, 0.01–1.0).')
            .addText(text =>
                text
                    .setPlaceholder('0')
                    .setValue(this.plugin.settings.backgroundOpacityOverride > 0 ? String(this.plugin.settings.backgroundOpacityOverride) : '')
                    .onChange(async value => {
                        const parsed = parseFloat(value) || 0;
                        this.plugin.settings.backgroundOpacityOverride = Math.max(0, Math.min(1, parsed));
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Window padding X')
            .setDesc('Horizontal padding in pixels (-1 = use Ghostty config).')
            .addText(text =>
                text
                    .setPlaceholder('-1')
                    .setValue(this.plugin.settings.windowPaddingXOverride >= 0 ? String(this.plugin.settings.windowPaddingXOverride) : '')
                    .onChange(async value => {
                        this.plugin.settings.windowPaddingXOverride = value.trim() === '' ? -1 : (parseInt(value, 10) ?? -1);
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Window padding Y')
            .setDesc('Vertical padding in pixels (-1 = use Ghostty config).')
            .addText(text =>
                text
                    .setPlaceholder('-1')
                    .setValue(this.plugin.settings.windowPaddingYOverride >= 0 ? String(this.plugin.settings.windowPaddingYOverride) : '')
                    .onChange(async value => {
                        this.plugin.settings.windowPaddingYOverride = value.trim() === '' ? -1 : (parseInt(value, 10) ?? -1);
                        await this.plugin.saveSettings();
                    })
            );

        // --- Performance ---
        new Setting(containerEl).setName('Performance').setHeading();

        new Setting(containerEl)
            .setName('Scrollback lines')
            .setDesc('Number of lines to keep in scrollback buffer.')
            .addText(text =>
                text
                    .setPlaceholder('10000')
                    .setValue(String(this.plugin.settings.scrollbackLines))
                    .onChange(async value => {
                        this.plugin.settings.scrollbackLines = parseInt(value, 10) || 10000;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
