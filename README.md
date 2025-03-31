# Hotel Room Booking System

## Project Information
This project is a **Hotel Room Booking System** built using:
- **Node.js** for the backend
- **Express.js** for handling API requests
- **Prisma ORM** for database management
- **PostgreSQL** as the database
- **JWT Authentication** for securing user access

## Features
- **Booking Room API**
  - Users can book a room by providing their name, contact details, check-in date, and check-out date.
  - Assigns a room automatically based on availability.
  - Returns a confirmation with booking details including room number, guest name, and stay duration.
- **View Booking Details API**
  - Retrieves the details of a guest's room booking by providing their email address.
- **View All Guests in the Hotel API**
  - Returns a list of all the guests currently staying in the hotel, including their room numbers.
- **Cancel Room Booking API**
  - Allows a guest to cancel their booking by providing their email and room details.
- **Modify Booking API**
  - Allows a guest to modify their check-in or check-out date by providing their email and booking details.

## API Endpoints
### Authentication
- **Create User** (POST `/api/v1/bookings/createUser`)
- **Login** (POST `/api/v1/bookings/login`)

### Hotel & Room Management
- **Check Hotels** (GET `/api/v1/bookings/checkHotels`)
- **Book a Room** (POST `/api/v1/bookings/bookRoom`)
- **View Booking Details** (GET `/api/v1/bookings/ViewBooking`)
- **View All Guests** (GET `/api/v1/bookings/allGuest`)
- **Cancel Booking** (PATCH `/api/v1/bookings/canceledRoom`)
- **Modify Booking** (POST `/api/v1/bookings/modefiBooking`)

## Installation & Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/avikrjha/hotel-room-booking-system.git
   cd hotel-booking
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up environment variables in `.env` file:
   ```sh
   DATABASE_URL=your_database_url
   SECRET_KEY=your_jwt_secret
   PORT =5000
   SALT_ROUND=10
   JWTEXPIRED="xd"
   ```
4. Run database migrations with Prisma:
   ```sh
   npx prisma migrate dev
   ```
5. Start the server:
   ```sh
   npm run dev
   ```

## Authentication
- JWT-based authentication is used for protected routes.
- Bearer tokens must be sent in headers: `Authorization: Bearer <token>`

## Contributing
1. Fork the repository.
2. Create a new branch: `git checkout -b feature-branch`
3. Commit your changes: `git commit -m "Add new feature"`
4. Push the changes: `git push origin feature-branch`
5. Open a pull request.

## License
This project is licensed under Avinash Jha.

---
🚀 Happy Coding! Let us know if you have any issues or suggestions.

