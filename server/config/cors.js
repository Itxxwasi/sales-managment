export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    const allowedOrigins = [
      'https://www.dwatson.online',
      'http://www.dwatson.online',
      'https://www.dwatson.work.gd',
      'https://sales-managment-f18df154a5ee.herokuapp.com',
      'https://dwatson-db-902c7d197f9e.herokuapp.com',
    ];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

export default corsOptions;
