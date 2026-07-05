// Central catalog of cake categories and their allowed variant options.
// Used by the seller forms so category drives the available weights.

const STANDARD_WEIGHTS = ['0.5 Kg', '1 Kg', '1.5 Kg', '2 Kg', '3 Kg', '5 Kg'];
const PASTRY_PACKS = ['Pack of 2', 'Pack of 4', 'Pack of 6', 'Pack of 12'];
const SINGLE_SERVE = ['Single', 'Pack of 2', 'Pack of 4'];

export const CATEGORIES = [
    { value: 'birthday', label: 'Birthday Cake', sizes: STANDARD_WEIGHTS },
    { value: 'wedding', label: 'Wedding Cake', sizes: ['2 Kg', '3 Kg', '5 Kg', '8 Kg'] },
    { value: 'anniversary', label: 'Anniversary Cake', sizes: STANDARD_WEIGHTS },
    { value: 'cupcake', label: 'Cupcakes', sizes: PASTRY_PACKS },
    { value: 'cheesecake', label: 'Cheesecake', sizes: STANDARD_WEIGHTS },
    { value: 'brownie', label: 'Brownies', sizes: PASTRY_PACKS },
    { value: 'pastry', label: 'Pastry', sizes: SINGLE_SERVE },
    { value: 'cookies', label: 'Cookies', sizes: PASTRY_PACKS },
    { value: 'custom', label: 'Custom Cake', sizes: STANDARD_WEIGHTS },
];

// Available cake flavours (exported as COLORS to keep existing imports stable).
export const COLORS = [
    'Vanilla', 'Chocolate', 'Red Velvet', 'Black Forest', 'Butterscotch',
    'Strawberry', 'Pineapple', 'Mango', 'Blueberry', 'Coffee',
    'Caramel', 'Coconut', 'Lemon', 'Hazelnut', 'Fruit',
];

// Indicative colour for rendering each flavour swatch in the seller forms.
export const COLOR_SWATCHES = {
    Vanilla: '#f3e9c6',
    Chocolate: '#5b3a22',
    'Red Velvet': '#a31f2b',
    'Black Forest': '#3b2417',
    Butterscotch: '#d99a3a',
    Strawberry: '#e8889d',
    Pineapple: '#e9d24a',
    Mango: '#f3b53c',
    Blueberry: '#4a5ba8',
    Coffee: '#6f4e37',
    Caramel: '#b9762f',
    Coconut: '#f5f0e6',
    Lemon: '#e9e04a',
    Hazelnut: '#a8794f',
    Fruit: '#d36b8b',
};

// List of valid category values, handy for backend-aligned validation.
export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);

export const getCategoryLabel = (value) =>
    CATEGORIES.find((c) => c.value === value)?.label || value || '';

export const getSizesForCategory = (value) =>
    CATEGORIES.find((c) => c.value === value)?.sizes || [];
