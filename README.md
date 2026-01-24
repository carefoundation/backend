# Backend API

Node.js Express backend with PostgreSQL database.

## Project Structure

```
backend/
├── config/
│   ├── database.js          # PostgreSQL connection configuration
│   └── env.example.js       # Environment variables example
├── controllers/
│   ├── userController.js    # User controller logic
│   └── authController.js    # Authentication controller (register, signin)
├── middleware/
│   ├── asyncHandler.js      # Async error handler wrapper
│   └── errorHandler.js      # Global error handler
├── models/
│   └── User.js              # User Sequelize model
├── routes/
│   ├── index.js             # Main routes file
│   ├── userRoutes.js        # User routes
│   └── authRoutes.js        # Authentication routes
├── utils/
│   └── logger.js            # Logger utility
├── app.js                   # Express app configuration
├── server.js                # Server entry point
├── package.json             # Dependencies and scripts
├── .env.example             # Environment variables template
└── README.md                # Project documentation
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your PostgreSQL connection details:
```
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

Alternatively, you can use the POSTGRES_* prefix:
```
POSTGRES_DB=your_database_name
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

## Running the Application

### Development mode (with nodemon):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
  - Body: `{ name, mobileNumber, email, password, confirmPassword }`
- `POST /api/auth/signin` - Sign in user
  - Body: `{ email, password }`

### General
- `GET /health` - Health check endpoint
- `GET /api` - API status

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `DB_NAME` or `POSTGRES_DB` - PostgreSQL database name
- `DB_USER` or `POSTGRES_USER` - PostgreSQL username
- `DB_PASSWORD` or `POSTGRES_PASSWORD` - PostgreSQL password
- `DB_HOST` or `POSTGRES_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` or `POSTGRES_PORT` - PostgreSQL port (default: 5432)
- `JWT_SECRET` - Secret key for JWT token generation (required for authentication)

