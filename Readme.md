# Baby Steps Backend Assignment

This is a simple Node.js and Express backend for managing doctors and patient appointments using SQLite.

## Features

- Manage doctors and their working hours.
- Book appointments with doctors.
- Retrieve available time slots for doctors.
- Update and delete appointments.
- CORS enabled for frontend integration.

## Project Structure

### 1. Clone the repository:
```sh
git clone https://github.com/srinivas9548/Baby-steps-backend-assignment.git
cd Baby-steps-backend-assignment
```
### 2. Install Dependencies:
```sh
npm install
```
### 3. Start the server:
```sh
node index.js
```
The server runs at `http://localhost:3000/`

## API Endpoints

### **Doctors**
- **Get all doctors**
  ```http
  GET /doctors/
  ```

- **Get available slots for a doctor**
  ```http
  GET /doctors/:id/slots?date=YYYY-MM-DD
  ```

### **Appointments**
- **Get all appointments**
  ```http
  GET /appointments
  ```

- **Get appointment by ID**
  ```http
  GET /appointments/:id
  ```

- **Create an appointment**
  ```http
  POST /appointments
  ```
  **Request Body:**
  ```json
  {
    "doctorId": 1,
    "date": "2025-02-25",
    "duration": 30,
    "appointmentType": "Consultation",
    "patientName": "John Doe",
    "notes": "Follow-up checkup"
  }
  ```

- **Update an appointment**
  ```http
  PUT /appointments/:id
  ```

- **Delete an appointment**
  ```http
  DELETE /appointments/:id
  ```

## Deployment

### **Deploy on Vercel**
1. Install Vercel CLI:
   ```sh
   npm install -g vercel
   ```
2. Deploy:
   ```sh
   vercel
   ```


