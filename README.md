# EBay_Admin

## Project Overview

This project is a backend application designed for managing an eBay-like platform. It utilizes Node.js, Express.js, and JavaScript to provide a RESTful API for handling various functionalities, including user authentication, product management, cart operations, payment processing, and more.

## Key Features & Benefits

*   **RESTful API:** Provides a well-structured API for interacting with the backend services.
*   **User Authentication:** Secure user registration, login, and authentication mechanisms.
*   **Product Management:**  Features for creating, updating, and managing product listings.
*   **Cart Operations:** Functionality for managing user shopping carts.
*   **Payment Processing:** Integrations with payment gateways for secure transactions (VietQR and PayOS, potentially others).
*   **Category Management:** Create and manage product categories.
*   **Chat Functionality:** Real-time chat implementation between users and admins.
*   **Dispute Management:** System for handling disputes between buyers and sellers.
*   **Scheduled Tasks:** Utilizes `node-cron` for periodic tasks like payment verification.
*   **Cloudinary Integration:**  For image storage and management.
*   **Socket.IO:** Implements real-time communication.

## Prerequisites & Dependencies

Before you begin, ensure you have met the following requirements:

*   **Node.js:**  (v16 or higher recommended) - [https://nodejs.org/](https://nodejs.org/)
*   **npm** or **Yarn:** Package managers included with Node.js.
*   **MongoDB:** Database - [https://www.mongodb.com/](https://www.mongodb.com/)
*   **Cloudinary Account:**  For image storage.
*   **Environment Variables:**  Set up necessary environment variables (see Configuration section).

## Installation & Setup Instructions

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/RinkVN/EBay_Admin.git
    cd EBay_Admin
    ```

2.  **Navigate to the Backend Directory:**

    ```bash
    cd backend
    ```

3.  **Install Dependencies:**

    ```bash
    npm install  # or yarn install
    ```

4.  **Configure Environment Variables:**

    Create a `.env` file in the `backend` directory and populate it with the necessary environment variables (see Configuration Options).  Example variables (replace with your actual values):

    ```
    PORT=9999
    MONGODB_URI=mongodb://localhost:27017/ebay_admin
    JWT_SECRET=your_secret_key
    CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name

    ADMIN_IP_ALLOWLIST=

    EMAIL_HOST=***.gmail.com
    EMAIL_PORT=***
    EMAIL_USER=***@gmail.com
    EMAIL_PASS=***
    
    # --- Thông tin tích hợp VietQR ---
    # Lấy từ tài khoản Business của bạn trên my.vietqr.io
    VIETQR_CLIENT_ID=***
    VIETQR_API_KEY=***
    
    PAYOS_API_KEY=***
    PAYOS_SECRET_KEY=***
    PAYOS_CLIENT_ID=***
    PAYOS_CHECKSUM_KEY=***
    # --- Thông tin tài khoản ngân hàng nhận tiền ---
    # Mã BIN của ngân hàng bạn. Tra cứu tại: https://api.vietqr.io/v2/banks
    BANK_ACQ_ID=***
    BANK_ACCOUNT_NO=***
    BANK_ACCOUNT_NAME=***
    ```

5.  **Start the Server:**

    ```bash
    npm run dev # For development with nodemon
    # or
    npm start # For production
    ```

6.  **Database Setup:**
    Ensure MongoDB is running and accessible at the specified `MONGODB_URI`.  You may need to create the database (`ebay_admin` in the example above) manually.

## Usage Examples & API Documentation

API documentation is not explicitly provided here.  However, the `src/routers/index.js` file serves as the entry point for defining API routes. Each controller file (`src/controllers/*.js`) handles the logic for specific API endpoints.

Example API endpoints:

*   `POST /auth/register` - Register a new user.
*   `POST /auth/login` - Login an existing user.
*   `GET /products` - Get all products.
*   `POST /products` - Create a new product.

Consult the code in `src/routers` and `src/controllers` for a comprehensive list of available endpoints and their expected parameters/responses.
## Configuration Options

The application relies heavily on environment variables for configuration.  Here is a summary of the key environment variables:

| Variable Name           | Description                                                | Example Value                               |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| `PORT`                  | The port the server will listen on.                        | `3000`                                      |
| `MONGODB_URI`           | The MongoDB connection string.                             | `mongodb://localhost:27017/ebay_admin`      |
| `JWT_SECRET`            | Secret key used for signing JWTs.                          | `your_secret_key`                           |
| `CLOUDINARY_URL`        | Cloudinary connection URL.                                | `cloudinary://api_key:api_secret@cloud_name` |
| `BANK_ACCOUNT_NO`       | Bank account number for VietQR payments.                  | `1234567890`                                |
| `BANK_ACCOUNT_NAME`     | Bank account name for VietQR payments.                    | `Your Name`                                 |
| `BANK_ACQ_ID`           | Bank acquirer ID for VietQR payments.                     | `970422`                                    |
| `VIETQR_CLIENT_ID`      | Client ID for VietQR API.                                | `your_client_id`                            |
| `VIETQR_API_KEY`         | API key for VietQR API.                                   | `your_api_key`                              |
| `PAYOS_CLIENT_ID`       | Client ID for PayOS API.                                   | `your_payos_client_id`                      |
| ...                     | Other payment gateway specific variables                   | ...                                         |

Additionally:

*   **HTTPS Configuration:** The application attempts to use HTTPS by loading `server.crt` and `server.key` files from the `backend/src/certs/` directory. Ensure these files exist if you want to run the server over HTTPS. You can generate self-signed certificates using `openssl`.

## Contributing Guidelines

We welcome contributions to this project! To contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear, descriptive commit messages.
4.  Submit a pull request to the `main` branch.

Please adhere to the existing code style and conventions. Ensure your code is well-documented and includes tests where appropriate.

## License Information

This project does not currently have a specified license.  All rights are reserved by the owner.

## Acknowledgments

*   This project utilizes various open-source libraries and frameworks, including Node.js, Express.js, Mongoose, Cloudinary, and others. We acknowledge and appreciate the contributions of the developers of these tools.
