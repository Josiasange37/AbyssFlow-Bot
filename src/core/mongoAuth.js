const { Curve, signedKeyPair } = require('@whiskeysockets/baileys/lib/Utils/crypto');
const { delay } = require('@whiskeysockets/baileys/lib/Utils/generics');
const { BufferJSON, initAuthCreds, proto } = require('@whiskeysockets/baileys');
const Session = require('../database/models/Session');

/**
 * Custom Baileys Auth State using MongoDB
 */
const useMongoAuthState = async (sessionId) => {

    const writeData = async (data, id) => {
        const json = JSON.stringify(data, BufferJSON.replacer);
        await Session.findOneAndUpdate(
            { id: `${sessionId}-${id}` },
            { data: json },
            { upsert: true, new: true }
        );
    };

    const readData = async (id) => {
        try {
            const result = await Session.findOne({ id: `${sessionId}-${id}` });
            if (result) {
                return JSON.parse(result.data, BufferJSON.reviver);
            }
        } catch (error) {
            return null;
        }
        return null;
    };

    const removeData = async (id) => {
        await Session.deleteOne({ id: `${sessionId}-${id}` });
    };

    // Initialize creds
    let creds = await readData('creds');
    if (!creds) {
        creds = initAuthCreds();
        await writeData(creds, 'creds');
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const sId = `${category}-${id}`;
                            if (value) {
                                tasks.push(writeData(value, sId));
                            } else {
                                tasks.push(removeData(sId));
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: async () => {
            await writeData(creds, 'creds');
        }
    };
};

module.exports = useMongoAuthState;
