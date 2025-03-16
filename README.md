# Montra Backend API

A robust financial management REST API built with Node.js and Express, featuring comprehensive transaction tracking, multi-source account management, and detailed financial reporting capabilities.

## 🌟 Features

- **User Management**
  - Secure authentication with JWT
  - Profile management with image upload
  - PIN-based security for sensitive operations

- **Financial Account Management**
  - Multiple bank account support
  - Digital wallet integration
  - Cash account tracking

- **Transaction Management**
  - Income tracking with proof attachments
  - Expense monitoring
  - Inter-account transfers
  - Budget planning and tracking

- **Data Export**
  - Export financial data in CSV/PDF formats
  - Customizable date ranges
  - Filtered exports by transaction type

- **API Documentation**
  - Interactive Swagger documentation
  - Detailed endpoint descriptions
  - Request/response examples

## 🛠️ Tech Stack

- Node.js
- Express.js
- MySQL
- JWT Authentication
- Swagger UI
- Multer (File Upload)
- PDFKit & CSV Writer (Export Generation)

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn package manager

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/chiragdhunna/montra_backend.git
   cd montra_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```env
   DB_HOST=your_database_host
   DB_USERNAME=your_database_username
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Set up the database**
   - Create a MySQL database with the name specified in your .env file
   - Import the database schema (schema file to be provided)

5. **Start the server**
   ```bash
   npm start
   ```

## 📁 Project Structure

```plaintext
montra_backend/
├── app.js              # Application entry point
├── routes/            # API route definitions
│   ├── user.js        # User management routes
│   ├── bank.js        # Bank account routes
│   ├── wallet.js      # Digital wallet routes
│   ├── income.js      # Income tracking routes
│   ├── expense.js     # Expense tracking routes
│   ├── transfer.js    # Transfer management routes
│   └── budget.js      # Budget management routes
├── controllers/       # Route controllers
├── middlewares/      # Custom middleware
│   ├── auth.js       # Authentication middleware
│   └── error.js      # Error handling middleware
├── utils/            # Utility functions
│   └── feature.js    # File upload configuration
├── database/         # Database configuration
│   └── db.js        # MySQL connection setup
├── swagger/          # API documentation
│   └── swagger.js    # Swagger configuration
├── uploads/          # File upload directory
└── exports/          # Export file directory
```

## 🔌 API Endpoints

### User Management
- `POST /api/v1/user/signup` - Register new user
- `POST /api/v1/user/login` - User authentication
- `POST /api/v1/user/imageupload` - Upload profile picture
- `GET /api/v1/user/getimage` - Retrieve profile picture
- `POST /api/v1/user/export` - Export financial data

### Bank Account Management
- `POST /api/v1/bank/create` - Create bank account
- `GET /api/v1/bank/all` - List all bank accounts
- `PUT /api/v1/bank/update` - Update bank account
- `DELETE /api/v1/bank/delete` - Remove bank account

### Income Management
- `POST /api/v1/income/add` - Record new income
  - Supports file attachments (proof of income)
  - Source specification (wallet/bank/cash/credit card)

### Expense Management
- `POST /api/v1/expense/add` - Record new expense
  - Receipt upload support
  - Source specification
  - Expense categorization

### Transfer Management
- `POST /api/v1/transfer/add` - Create new transfer
- `GET /api/v1/transfer/all` - List all transfers
- `PUT /api/v1/transfer/update` - Modify transfer
- `DELETE /api/v1/transfer/delete` - Remove transfer

## 📊 Data Export Features

### Export Types
- Complete financial history
- Income records
- Expense records
- Transfer history
- Budget reports

### Export Formats
- **CSV Format**
  - Detailed transaction records
  - Compatible with spreadsheet software
  - Custom field selection

- **PDF Format**
  - Professional report layout
  - Transaction summaries
  - Visual representations

### Time Range Options
- Last month
- Last quarter
- Last 6 months
- Last year

## 🔒 Security Features

1. **Authentication**
   - JWT-based token authentication
   - Secure password hashing with bcrypt
   - PIN verification for sensitive operations

2. **File Upload Security**
   - File type validation
   - Size restrictions (5MB limit)
   - Secure storage management

3. **Data Protection**
   - Input validation
   - SQL injection prevention
   - XSS protection

## 🚀 Development

### Running in Development Mode
```bash
npm run dev
```

### API Documentation Access
Visit `http://localhost:3000/api/v1/docs` for interactive Swagger documentation

### Environment Configuration
Required environment variables:
- `DB_HOST` - Database host
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing key

## 🧪 Testing

```bash
npm test
```

## 📦 Deployment

1. Set up production environment variables
2. Configure MySQL database
3. Build the application
4. Start the server using PM2 or similar process manager

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Chirag Dhunna** - *Initial work* - [chiragdhunna](https://github.com/chiragdhunna)

## 🙏 Acknowledgments

- Express.js community
- MySQL community
- All contributors who helped with the project

## 📞 Support

For support, please email [chiragdhunna2468@gmail.com] or create an issue in the GitHub repository.

## 🔄 Version History

- 1.0.0
    - Initial Release
    - Basic financial management features
    - User authentication
    - File upload support 