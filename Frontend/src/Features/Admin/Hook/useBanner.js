import {
    getActiveBannersApi, getAllBannersApi, createBannerApi, toggleBannerApi, deleteBannerApi,
} from "../Service/bannerApi";

const useBanner = () => {
    const getActiveBannersHandler = async () => (await getActiveBannersApi()).banners;
    const getAllBannersHandler = async () => (await getAllBannersApi()).banners;
    const createBannerHandler = async (formData) => (await createBannerApi(formData)).banner;
    const toggleBannerHandler = async (id) => (await toggleBannerApi(id)).banner;
    const deleteBannerHandler = async (id) => { await deleteBannerApi(id); };

    return { getActiveBannersHandler, getAllBannersHandler, createBannerHandler, toggleBannerHandler, deleteBannerHandler };
};

export default useBanner;
