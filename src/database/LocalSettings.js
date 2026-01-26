const fs = require('fs-extra');
const path = require('path');

class LocalSettings {
    constructor() {
        this.filePath = path.join(process.cwd(), 'data', 'local_settings.json');
        fs.ensureFileSync(this.filePath);
        try {
            this.data = fs.readJsonSync(this.filePath);
        } catch (e) {
            this.data = {};
        }
    }

    get(groupId) {
        return this.data[groupId] || { voiceEnabled: false };
    }

    set(groupId, settings) {
        this.data[groupId] = { ...this.get(groupId), ...settings };
        this.save();
    }

    save() {
        try {
            fs.writeJsonSync(this.filePath, this.data, { spaces: 2 });
        } catch (e) {
            console.error('Failed to save local settings:', e);
        }
    }
}

module.exports = new LocalSettings();
