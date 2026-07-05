import ImageKit from '@imagekit/nodejs';
import { toFile } from '@imagekit/nodejs';
import { Config } from '../config/config.js';

const ImagetKitUpload = async (buffer, fileName, folder = '/Cakeology/Products/') => {

    const client = new ImageKit({
        privateKey: Config.IMAGEKIT_PRIVATE_KEY
    })

    const response = await client.files.upload({
        file: await toFile(Buffer.from(buffer), 'file'),
        fileName: fileName,
        folder: folder,
    })

    return response.url;
}

export default ImagetKitUpload;