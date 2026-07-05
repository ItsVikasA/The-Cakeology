import app from './src/app.js';
import ConntectToDb from './src/config/database.js';

ConntectToDb();

// Render (and most hosts) inject a PORT to bind to. Fall back to 6060 locally.
const PORT = process.env.PORT || 6060;

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
})