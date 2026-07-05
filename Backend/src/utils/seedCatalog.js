import categoryModel from "../models/categoryModel.js";

const STANDARD_WEIGHTS = ['0.5 Kg', '1 Kg', '1.5 Kg', '2 Kg', '3 Kg', '5 Kg'];
const PASTRY_PACKS = ['Pack of 2', 'Pack of 4', 'Pack of 6', 'Pack of 12'];
const SINGLE_SERVE = ['Single', 'Pack of 2', 'Pack of 4'];

const DEFAULT_CATEGORIES = [
    { name: 'Birthday Cake', slug: 'birthday', sizeOptions: STANDARD_WEIGHTS },
    { name: 'Wedding Cake', slug: 'wedding', sizeOptions: ['2 Kg', '3 Kg', '5 Kg', '8 Kg'] },
    { name: 'Anniversary Cake', slug: 'anniversary', sizeOptions: STANDARD_WEIGHTS },
    { name: 'Cupcakes', slug: 'cupcake', sizeOptions: PASTRY_PACKS },
    { name: 'Cheesecake', slug: 'cheesecake', sizeOptions: STANDARD_WEIGHTS },
    { name: 'Brownies', slug: 'brownie', sizeOptions: PASTRY_PACKS },
    { name: 'Pastry', slug: 'pastry', sizeOptions: SINGLE_SERVE },
    { name: 'Cookies', slug: 'cookies', sizeOptions: PASTRY_PACKS },
    { name: 'Custom Cake', slug: 'custom', sizeOptions: STANDARD_WEIGHTS },
];

// Seeds default top-level categories once, so existing products (which store a
// category slug like "birthday") map to real category documents.
export async function seedCatalog() {
    try {
        const count = await categoryModel.estimatedDocumentCount();
        if (count > 0) return;
        await categoryModel.insertMany(
            DEFAULT_CATEGORIES.map((c) => ({ ...c, parent: null }))
        );
        console.log('Seeded default categories.');
    } catch (e) {
        console.error('Category seed failed:', e.message);
    }
}
