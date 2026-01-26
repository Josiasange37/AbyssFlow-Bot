const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs-extra');
const path = require('path');
const { log } = require('../utils/logger');

/**
 * VoiceManager - Handles High-Quality Neural TTS using Microsoft Edge
 * Optimized for Baileys/WhatsApp compatibility.
 */
class VoiceManager {
    constructor() {
        // Ensure absolute path for cache directory
        this.cacheDir = path.resolve(process.cwd(), 'data', 'audio_cache');
        fs.ensureDirSync(this.cacheDir);

        // Premium Neural Voices
        this.voices = {
            fr_female_1: 'fr-FR-DeniseNeural', // Warm, professional
            fr_female_2: 'fr-FR-EloiseNeural', // Young, energetic
            en_female: 'en-US-AriaNeural',     // Professional English
        };

        this.defaultVoice = this.voices.fr_female_1;
    }

    /**
     * Generates an audio file from text.
     * @param {string} text - The text to speak.
     * @param {string} voice - Voice ID (optional).
     * @returns {Promise<string>} - Path to the generated .mp3 file.
     */
    async generateAudio(text, voice = null) {
        let ttsInstance = null;
        try {
            // 1. Create a fresh instance for each request to prevent state pollution
            ttsInstance = new MsEdgeTTS();

            const selectedVoice = voice || this.defaultVoice;
            // 2. Set Metadata (Voice & Format)
            await ttsInstance.setMetadata(selectedVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

            // 3. Generate File Path
            const safeText = text.substring(0, 15).replace(/[^a-z0-9]/gi, '');
            const timestamp = Date.now();
            const filename = `tts_${safeText}_${timestamp}.mp3`;
            const filePath = path.join(this.cacheDir, filename);

            // 4. Create Write Stream
            const writeStream = fs.createWriteStream(filePath);

            // 5. Get Audio Stream from Library
            // Note: toStream returns object { audioStream, metadataStream, requestId } synchronously
            const { audioStream } = ttsInstance.toStream(text);

            // 6. Handle Stream Pipe with Proper Cleanup
            return new Promise((resolve, reject) => {
                audioStream.pipe(writeStream);

                // CRITICAL: Only close connection AFTER file is full written
                writeStream.on('finish', () => {
                    ttsInstance.close(); // Clean close
                    resolve(filePath);
                });

                writeStream.on('error', (err) => {
                    log.error('File Write Error:', err);
                    ttsInstance.close();
                    reject(err);
                });

                audioStream.on('error', (err) => {
                    log.error('TTS Stream Error:', err);
                    ttsInstance.close();
                    reject(err);
                });
            });

        } catch (error) {
            log.error('TTS Generation failed:', error.message);
            if (ttsInstance) ttsInstance.close();
            return null;
        }
    }

    /**
     * Cleans up old audio files (call periodically)
     */
    async cleanCache() {
        try {
            const files = await fs.readdir(this.cacheDir);
            const now = Date.now();
            const ONE_HOUR = 60 * 60 * 1000;

            for (const file of files) {
                const filePath = path.join(this.cacheDir, file);
                const stats = await fs.stat(filePath);
                if (now - stats.mtimeMs > ONE_HOUR) {
                    await fs.unlink(filePath);
                }
            }
        } catch (e) {
            log.warn('Cache cleanup failed:', e.message);
        }
    }
}

module.exports = new VoiceManager();
