export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    const allowedOrigins = [
      'https://www.dwatson.online',
      'https://multifiles-testing-7a8c586ca438.herokuapp.com',
      'https://shopmodule-9c27ee49e041.herokuapp.com',
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
