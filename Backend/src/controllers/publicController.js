import path from 'path';
import fs from 'fs';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serves the built SPA when it's bundled with the backend. When the frontend
// is deployed separately (no public/dist), respond with a lightweight health
// payload instead of throwing ENOENT on every request / health check.
export const publicRoute = async (req, res) => {
    const index = path.join(__dirname, '../', '../', 'public/dist/index.html');

    if (fs.existsSync(index)) {
        return res.sendFile(index);
    }

    res.status(200).json({
        message: "Cakeology API is running",
        success: true,
    });
}
