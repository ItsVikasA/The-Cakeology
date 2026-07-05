import settingsModel from "../models/settingsModel.js";

// Returns the singleton settings doc, creating it with defaults if absent.
async function getOrCreate() {
    let settings = await settingsModel.findOne({ key: 'global' });
    if (!settings) settings = await settingsModel.create({ key: 'global' });
    return settings;
}

// Admin: full settings.
export const getSettings = async (req, res) => {
    const settings = await getOrCreate();
    res.status(200).json({ message: "Fetched settings", success: true, settings });
}

// Public: storefront-relevant subset (used by cart for shipping/tax).
export const getPublicSettings = async (req, res) => {
    const s = await getOrCreate();
    res.status(200).json({
        message: "Fetched settings",
        success: true,
        settings: {
            storeName: s.general.storeName,
            currency: s.general.currency,
            maintenanceMode: s.general.maintenanceMode,
            shipping: s.shipping,
            tax: s.tax,
            razorpayKeyId: s.payment.razorpayKeyId,
            whatsappNumber: s.payment.whatsappNumber,
            activeMethod: s.payment.activeMethod,
            checkoutMode: s.checkout?.mode || 'guest',
        }
    });
}

// Admin: update one or more setting groups (deep-merged).
export const updateSettings = async (req, res) => {
    const settings = await getOrCreate();
    const groups = ['general', 'shipping', 'tax', 'payment', 'email', 'checkout'];

    for (const g of groups) {
        if (req.body[g] && typeof req.body[g] === 'object') {
            settings[g] = { ...settings[g].toObject?.() ?? settings[g], ...req.body[g] };
        }
    }

    await settings.save();
    res.status(200).json({ message: "Settings updated", success: true, settings });
}
