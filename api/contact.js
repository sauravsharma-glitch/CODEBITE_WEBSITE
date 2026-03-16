// Serverless function for Vercel
// Save as: api/contact.js

import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, phone, message, recaptcha_token } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !message || !recaptcha_token) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate reCAPTCHA
        const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptcha_token}`
        });

        const recaptchaData = await recaptchaResponse.json();
        
        if (!recaptchaData.success || recaptchaData.score < 0.5) {
            return res.status(400).json({ error: 'reCAPTCHA verification failed' });
        }

        // Server-side validation
        if (name.length < 2 || name.length > 50) {
            return res.status(400).json({ error: 'Invalid name length' });
        }
        
        const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
        if (!emailPattern.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        const phonePattern = /^[0-9]{10}$/;
        if (!phonePattern.test(phone)) {
            return res.status(400).json({ error: 'Invalid phone number' });
        }
        
        if (message.length < 10 || message.length > 500) {
            return res.status(400).json({ error: 'Invalid message length' });
        }

        // Configure email transport
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to yourself
            subject: `New Contact Form Submission from ${name}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
                        .field { margin-bottom: 15px; }
                        .label { font-weight: bold; color: #2563eb; }
                        .value { background: white; padding: 10px; border-radius: 5px; margin-top: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>New Contact Form Submission</h2>
                        </div>
                        <div class="content">
                            <div class="field">
                                <div class="label">Name:</div>
                                <div class="value">${name}</div>
                            </div>
                            <div class="field">
                                <div class="label">Email:</div>
                                <div class="value">${email}</div>
                            </div>
                            <div class="field">
                                <div class="label">Phone:</div>
                                <div class="value">${phone}</div>
                            </div>
                            <div class="field">
                                <div class="label">Message:</div>
                                <div class="value">${message}</div>
                            </div>
                            <div class="field">
                                <div class="label">Time:</div>
                                <div class="value">${new Date().toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Phone: ${phone}
Message: ${message}
Time: ${new Date().toLocaleString()}
            `
        });

        res.status(200).json({ 
            success: true, 
            message: 'Form submitted successfully' 
        });

    } catch (error) {
        console.error('Form submission error:', error);
        res.status(500).json({ 
            error: 'Failed to send message. Please try again.' 
        });
    }
}