import dotenv from 'dotenv';
dotenv.config();
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
if (process.env.MONGO_URI) {
    console.log('MONGO_URI start:', process.env.MONGO_URI.substring(0, 20));
}
process.exit(0);
