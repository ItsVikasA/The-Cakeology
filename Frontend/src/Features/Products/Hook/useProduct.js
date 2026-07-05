import { useDispatch } from "react-redux";
import { createProductApi, createVariantApi, deleteVariantApi, deleteProductApi, updateVariantStockApi, getProductApi, getProductsApi, getSellerProductsApi, updateProductApi } from "../Service/productApi"
import { setAllProducts, setProduct } from "../State/productSlice.js"
import { setSellerProducts } from "../State/productSlice.js"
import { setLoading } from "../../Authentication/State/authSlice.js";

const useProduct = () => {

    const dispatch = useDispatch();

    const createProductHandler = async ({ title, description, category, brand, price, images }) => {
        const formData = new FormData();

        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        if (brand) formData.append('brand', brand);
        formData.append('price', JSON.stringify(price));


        images.forEach(image => {
            formData.append('images', image);
        });

        try {
            const productData = await createProductApi(formData);
            return productData.product;
        } catch (error) {
            const data = error.response?.data;
            const serverMsg = data?.errors?.map((e) => e.msg).join(', ') || data?.message || error.message;
            console.error('Create product failed:', data || error);
            throw new Error(serverMsg);
        }
    }

    const createVariantHandler = async ({ productId, attribute, price, stock, images }) => {
        const formData = new FormData;
        formData.append('attribute', JSON.stringify(attribute));
        formData.append('price', JSON.stringify(price));
        formData.append('stock', stock);

        images.forEach((image) => {
            formData.append('images', image);
        });

        await createVariantApi(productId, formData);

    }

    const deleteVariantHandler = async (productId, variantId) => {
        await deleteVariantApi(productId, variantId);

    }

    const deleteProductHandler = async (productId) => {
        await deleteProductApi(productId);
        // Refresh the seller's product list after deletion.
        await SellerProductsHandler();
    }

    const updateVariantStockHandler = async (productId, variantId, stock) => {
        const res = await updateVariantStockApi(productId, variantId, stock);
        return res;
    }

    const SellerProductsHandler = async () => {
        const sellerProductsData = await getSellerProductsApi();
        dispatch(setSellerProducts(sellerProductsData.products));
    }

    const ProductsHandler = async () => {
        try {
            const ProductsData = await getProductsApi();
            dispatch(setAllProducts(ProductsData.products));
        } catch (error) {
            console.error('Failed to load products:', error?.response?.data || error);
            dispatch(setAllProducts([]));
        } finally {
            dispatch(setLoading(false));
        }
    }

    const ProductHandler = async ({ productId }) => {
        const ProductData = await getProductApi({ productId });
        dispatch(setProduct(ProductData.product));
    }

    const updateProductHandler = async (productId, title, description, price, variants, images, category, brand) => {
        const formData = new FormData();

        if (title !== null) formData.append('title', title);
        if (description !== null) formData.append('description', description);
        if (category !== null && category !== undefined) formData.append('category', category);
        if (brand !== null && brand !== undefined) formData.append('brand', brand);
        if (price !== null) formData.append('price', JSON.stringify(price));

        if (images !== null) {

            const existingImages = [...(images.filter(img => !(img instanceof File)))];

            formData.append("existingImages", JSON.stringify(existingImages));

            images.forEach(image => {
                if (image instanceof File) formData.append('images', image);
            })
        }

        const data = await updateProductApi(productId, formData);
        if (data.product) {
            dispatch(setProduct(data.product));
        }
        return true;
    }

    return { createProductHandler, createVariantHandler, deleteVariantHandler, deleteProductHandler, updateVariantStockHandler, SellerProductsHandler, ProductsHandler, ProductHandler, updateProductHandler }
}

export default useProduct;