const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");

const app = express()

app.use(express.json())
app.use(cors());

const dbPath = path.join(__dirname, "medical.db");

let db = null;

const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        })

        app.listen(3000, () => {
            console.log("Server is Running at http://localhost:3000/");
        });
    } catch (e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
}

initializeDBAndServer();

app.get("/", (request, response) => {
    try {
        response.send("Welcome! This is a Baby Steps Company Assignment backend domain.Please access any path to get the data.");
    } catch (e) {
        console.log(e.message);
        response.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET all doctors
app.get("/doctors/", async (request, response) => {
    try {
        const selectAllDoctorsQuery = `SELECT * FROM doctor;`;
        const doctors = await db.all(selectAllDoctorsQuery);
        response.json(doctors);
    } catch (error) {
        console.log(`DB Error: ${error.message}`);
        response.status(500).send("An error occured while getting all the doctors");
    }
});

// GET available slots for a doctor on a given date
app.get("/doctors/:id/slots", async (request, response) => {
    try {
        const { id } = request.params;
        const { date } = request.query;

        // Get doctor details
        const doctorQuery = `
          SELECT working_hours_start, working_hours_end 
          FROM doctor 
          WHERE id = ?`;
        const doctor = await db.get(doctorQuery, [id]);

        if (!doctor) {
            response.status(404).send("Doctor not found");
        }

        const { working_hours_start, working_hours_end } = doctor;

        // Fetch booked appointments for the given date
        const appointmentsQuery = `
          SELECT duration 
          FROM appointment 
          WHERE doctor_id = ? AND date = ?;`;
        const appointments = await db.all(appointmentsQuery, [id, date]);

        // Calculate available slots
        let availableSlots = [];
        let currentTime = working_hours_start;

        while (currentTime < working_hours_end) {
            let isBooked = appointments.some(appoint => currentTime === appoint.start_time);
            if (!isBooked) {
                availableSlots.push(currentTime);
            }
            // Increment by 30 minutes for next slot
            let [hours, minutes] = currentTime.split(":").map(Number);
            minutes += 30;
            if (minutes >= 60) {
                hours += 1;
                minutes -= 60;
            }
            currentTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
        }
        response.json({ availableSlots });

    } catch (e) {
        console.log(`Error fetching slots: ${e.message}`);
        response.status(500).send("Error fetching available slots");
    }
});

// Get all appointments
app.get("/appointments", async (request, response) => {
    try {
        const appointmentsQuery = "SELECT * FROM appointment;";
        const appointments = await db.all(appointmentsQuery);
        response.json(appointments);
    } catch (error) {
        console.error("Error fetching appointments:", error.message);
        response.status(500).send("An error occurred while retrieving appointments");
    }
});

// Get a specific appointment by ID
app.get("/appointments/:id", async (request, response) => {
    try {
        const { id } = request.params;
        const appointmentQuery = "SELECT * FROM appointment WHERE id = ?;";
        const appointment = await db.get(appointmentQuery, [id]);

        if (!appointment) {
            return response.status(404).send("Appointment not found");
        }

        response.json(appointment);
    } catch (error) {
        console.error("Error fetching appointment:", error.message);
        response.status(500).send("An error occurred while retrieving the appointment");
    }
});

// Create a new appointment
app.post("/appointments", async (request, response) => {
    try {
        const { doctorId, date, duration, appointmentType, patientName, notes } = request.body;

        if (!doctorId || !date || !duration || !appointmentType || !patientName) {
            return response.status(400).send("Missing required fields");
        }

        // Check if doctor exists
        const doctorQuery = `SELECT * FROM doctor WHERE id = ?;`;
        const doctor = await db.get(doctorQuery, [doctorId]);

        if (!doctor) {
            return response.status(404).send("Doctor not found");
        }

        // Check for overlapping appointments
        const overlappingQuery = `
            SELECT * FROM appointment 
            WHERE doctor_id = ? AND date = ? AND duration = ?;
        `;
        const overlappingAppointment = await db.get(overlappingQuery, [doctorId, date, duration]);

        if (overlappingAppointment) {
            return response.status(400).send("Time slot not available");
        }

        // Insert new appointment
        const insertAppointmentQuery = `
            INSERT INTO appointment (doctor_id, date, duration, appointment_type, patient_name, notes) 
            VALUES (?, ?, ?, ?, ?, ?);
        `;

        await db.run(insertAppointmentQuery, [doctorId, date, duration, appointmentType, patientName, notes || ""]);

        response.status(201).send("Appointment created successfully");
    } catch (error) {
        console.error("Error creating appointment:", error.message);
        response.status(500).send("An error occurred while creating the appointment");
    }
});

// Update an existing appointment
app.put("/appointments/:id", async (request, response) => {
    try {
        const { id } = request.params;
        const { date, duration, appointmentType, patientName, notes } = request.body;

        // Check if appointment exists
        const appointmentQuery = `SELECT * FROM appointment WHERE id = ?;`;
        const appointment = await db.get(appointmentQuery, [id]);

        if (!appointment) {
            return response.status(404).send("Appointment not found");
        }

        // Update appointment
        const updateAppointmentQuery = `
            UPDATE appointment 
            SET date = ?, duration = ?, appointment_type = ?, patient_name = ?, notes = ? 
            WHERE id = ?;
        `;

        await db.run(updateAppointmentQuery, [date, duration, appointmentType, patientName, notes || "", id]);

        response.send("Appointment updated successfully");
    } catch (error) {
        console.error("Error updating appointment:", error.message);
        response.status(500).send("An error occurred while updating the appointment");
    }
});

// Delete an appointment
app.delete("/appointments/:id", async (request, response) => {
    try {
        const { id } = request.params;

        // Check if appointment exists
        const appointmentQuery = `SELECT * FROM appointment WHERE id = ?;`;
        const appointment = await db.get(appointmentQuery, [id]);

        if (!appointment) {
            return response.status(404).send("Appointment not found");
        }

        // Delete appointment
        const deleteAppointmentQuery = `DELETE FROM appointment WHERE id = ?;`;
        await db.run(deleteAppointmentQuery, [id]);

        response.send("Appointment deleted successfully");
    } catch (error) {
        console.error("Error deleting appointment:", error.message);
        response.status(500).send("An error occurred while deleting the appointment");
    }
});

module.exports = app;