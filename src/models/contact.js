const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    primaryContactId: { type: String, unique: true },
    emails: [String],
    phoneNumbers: [String],
    secondaryContactIds: [String]
});

mongoose.connect('mongodb://localhost/contact_db', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;