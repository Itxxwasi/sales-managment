import mongoose from 'mongoose';

export const validateMongoUri = (mongoUri) => {
  if (!mongoUri) {
    console.error('❌ MONGODB_URI environment variable is required');
    console.error('Please set MONGODB_URI in your .env file');
    process.exit(1);
  }
  const mongodbUriPattern = /^mongodb(\+srv)?:\/\//;
  if (!mongodbUriPattern.test(mongoUri)) {
    console.error('❌ Invalid MongoDB URI format');
    console.error('MongoDB URI must start with mongodb:// or mongodb+srv://');
    console.error('Current URI starts with:', mongoUri.substring(0, 20) + '...');
    process.exit(1);
  }
};

export const connectDB = async (mongoUri) => {
  validateMongoUri(mongoUri);
  const maskedUri = mongoUri.replace(/(mongodb(\+srv)?:\/\/)([^:]+):([^@]+)@/, (match, protocol, srv, username, password) => {
    return `${protocol}${username}:****@`;
  });
  console.log('🔄 Attempting to connect to MongoDB...');
  console.log('📍 Connection String:', maskedUri);

  try {
    await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connection established');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
  });

  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error closing MongoDB connection:', err.message);
      process.exit(1);
    }
  });
};

export const checkDatabaseConnection = (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database connection not available. Please try again later.',
      status: 'database_unavailable',
    });
  }
  next();
};

export default connectDB;