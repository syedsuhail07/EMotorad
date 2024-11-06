const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Contact = require('./models/contact'); // Assuming your contact schema is set up

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost/contact_db', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(bodyParser.json());

// Endpoint to handle contact identification and consolidation
app.post('/contacts', async (req, res) => {
    const { email, phoneNumber } = req.body;

    try {
        // Check if a contact already exists with the given email or phone number
        let existingContact = await Contact.findOne({ $or: [{ emails: email }, { phoneNumbers: phoneNumber }] });

        if (existingContact) {
            // Consolidate contact details into the existing primary contact
            if (!existingContact.emails.includes(email)) {
                existingContact.emails.push(email);
            }
            if (!existingContact.phoneNumbers.includes(phoneNumber)) {
                existingContact.phoneNumbers.push(phoneNumber);
            }
            
            // Save updated contact details
            await existingContact.save();

            // Create a secondary contact if this request introduces new information
            const secondaryContact = new Contact({
                primaryContactId: existingContact.primaryContactId,
                emails: [email],
                phoneNumbers: [phoneNumber],
                linkPrecedence: 'secondary',
                secondaryContactIds: [...existingContact.secondaryContactIds, existingContact._id]
            });
            await secondaryContact.save();

            // Send response with consolidated contact information
            res.status(200).json({
                primaryContactId: existingContact.primaryContactId,
                emails: existingContact.emails,
                phoneNumbers: existingContact.phoneNumbers,
                secondaryContactIds: existingContact.secondaryContactIds
            });
        } else {
            // Create a new primary contact if no matching contact is found
            const primaryContactId = new mongoose.Types.ObjectId().toString();
            const newContact = new Contact({
                primaryContactId,
                emails: [email],
                phoneNumbers: [phoneNumber],
                linkPrecedence: 'primary',
                secondaryContactIds: []
            });
            await newContact.save();

            // Respond with the newly created contact information
            res.status(200).json({
                primaryContactId: newContact.primaryContactId,
                emails: newContact.emails,
                phoneNumbers: newContact.phoneNumbers,
                secondaryContactIds: newContact.secondaryContactIds
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('A discreet error occurred');
    }
});

// Basic route for checking server status
app.get('/', (req, res) => {
    res.send('Welcome to the Contact Service API');
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
