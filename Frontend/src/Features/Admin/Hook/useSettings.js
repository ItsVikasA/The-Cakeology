import { getSettingsApi, getPublicSettingsApi, updateSettingsApi } from "../Service/settingsApi";

const useSettings = () => {
    const getSettingsHandler = async () => (await getSettingsApi()).settings;
    const getPublicSettingsHandler = async () => (await getPublicSettingsApi()).settings;
    const updateSettingsHandler = async (data) => (await updateSettingsApi(data)).settings;

    return { getSettingsHandler, getPublicSettingsHandler, updateSettingsHandler };
};

export default useSettings;
