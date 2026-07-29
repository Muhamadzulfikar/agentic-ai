const minio = require('minio')

module.exports = async () => {
    try {
        const minioClient = new minio.Client({
            endPoint: process.env.S3_ENDPOINT,
            port: process.env.S3_PORT,
            useSSL: false,
            accessKey: process.env.S3_ACCESS_KEY,
            secretKey: process.env.S3_SECRET_KEY,
        });

        const exist = await minioClient.bucketExists(process.env.S3_BUCKET);

        if (exist) {
            console.log(' [✓] S3 Storage Connected');
        }

        return minioClient;
    } catch (error) {
        console.error('[x] Failed connect to S3 Storage', error.message);
    }
}