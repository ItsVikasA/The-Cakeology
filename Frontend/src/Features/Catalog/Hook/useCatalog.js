import {
    getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi,
    getBrandsApi, createBrandApi, deleteBrandApi,
} from "../Service/catalogApi";

const useCatalog = () => {
    const getCategoriesHandler = async () => (await getCategoriesApi()).categories || [];
    const createCategoryHandler = async (data) => (await createCategoryApi(data)).category;
    const updateCategoryHandler = async (id, data) => (await updateCategoryApi(id, data)).category;
    const deleteCategoryHandler = async (id) => { await deleteCategoryApi(id); };

    const getBrandsHandler = async () => (await getBrandsApi()).brands || [];
    const createBrandHandler = async (data) => (await createBrandApi(data)).brand;
    const deleteBrandHandler = async (id) => { await deleteBrandApi(id); };

    return {
        getCategoriesHandler, createCategoryHandler, updateCategoryHandler, deleteCategoryHandler,
        getBrandsHandler, createBrandHandler, deleteBrandHandler,
    };
};

export default useCatalog;
