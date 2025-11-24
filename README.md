# D.Watson Pharmacy Sales Dashboard

Complete sales management system for D.Watson Pharmacy with multi-branch support, role-based access control, and comprehensive reporting.

## Features

✅ **Multi-Branch Management** - Manage multiple pharmacy branches  
✅ **Role-Based Access Control** - Admin, Sales, Manager roles with permissions  
✅ **Sales Tracking** - Real-time sales entry, editing, and deletion  
✅ **Category Management** - Organize products by categories (Medicine, Cosmetics, etc.)  
✅ **Advanced Reporting** - Generate and print comprehensive sales reports  
✅ **Dashboard** - Visual analytics with charts and KPI cards  
✅ **User Management** - Create and manage user accounts with permissions  

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Authentication**: JWT with bcrypt
- **UI Framework**: Bootstrap 5
- **Charts**: Chart.js

## Quick Start

### Prerequisites
- Node.js 20.x or higher
- MongoDB Atlas account

### Installation

1. Clone the repository
```bash
git clone https://github.com/Itxxwasi/DWATSON-DB.git
cd DWATSON-DB
```

2. Install dependencies
```bash
cd server
npm install
cd ..
```

3. Configure environment variables

Create a `.env` file in the server directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
ADMIN_PASSWORD=admin123
NODE_ENV=development
PORT=5000
```

**MongoDB Connection String Formats:**
- **Local MongoDB**: `mongodb://localhost:27017/dwatson-pharmacy`
- **MongoDB Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/dwatson-pharmacy?retryWrites=true&w=majority`

The server will automatically validate your MongoDB connection string and provide helpful error messages if the connection fails.

4. Start the server
```bash
npm start
```

5. Open browser
```
http://localhost:5000
```

## Deployment

### Deploy to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Itxxwasi/DWATSON-DB.git)

**Or use CLI:**

```bash
heroku login
heroku create your-app-name
heroku git:remote -a your-app-name
git push heroku main

# Set environment variables
heroku config:set MONGODB_URI="your_mongodb_uri"
heroku config:set JWT_SECRET="your_jwt_secret"
heroku config:set ADMIN_PASSWORD="your_admin_password"

# Scale dyno
heroku ps:scale web=1

# Open app
heroku open
```

### Deploy to Railway

1. Push to GitHub
2. Import project on Railway
3. Add environment variables
4. Deploy

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `ADMIN_PASSWORD` | Admin password for promotions | Yes |
| `NODE_ENV` | Environment (production/development) | No |
| `PORT` | Server port | No |

## Project Structure

```
dwatson-pharmacy/
├── server/               # Backend server
│   ├── index.js         # Main server file
│   └── package.json     # Dependencies
├── index.html           # Frontend application
├── package.json         # Root package config
├── Procfile             # Heroku deployment config
├── app.json            # Heroku app config
└── README.md           # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Sales
- `GET /api/sales` - Get all sales (with filters)
- `POST /api/sales` - Create new sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Branches
- `GET /api/branches` - Get all branches
- `POST /api/branches` - Create branch
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch

### Users & Groups
- `GET /api/users` - Get all users (Admin only)
- `GET /api/groups` - Get all groups (Admin only)
- And more...

## Security Features

- ✅ JWT Authentication
- ✅ Password hashing with bcrypt
- ✅ Input sanitization
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Role-based access control

## Support

For issues or questions, please contact the development team.

## License

ISC

---

**Developed by Bilal Shah & Wasi**  
**GitHub**: [@Itxxwasi](https://github.com/Itxxwasi)  
**D.Watson Pharmacy Management System**
