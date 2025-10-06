const Waitlist = require('../models/Waitlist');
const brevo = require('@getbrevo/brevo');

// Configure API key
const apiKey = process.env.BREVO_API_KEY;

// Add email to waitlist and Brevo
exports.addToWaitlist = async (req, res) => {
  try {
    const { email, source = 'other' } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if email already exists
    const existingEntry = await Waitlist.findOne({ email: email.toLowerCase() });
    if (existingEntry) {
      return res.status(200).json({ 
        message: 'You are already on the waitlist!',
        alreadyExists: true 
      });
    }

    // Create Brevo contact
    let brevoContactId = null;
    try {
      const contactsApi = new brevo.ContactsApi();
      contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);
      
      const createContact = new brevo.CreateContact();
      createContact.email = email.toLowerCase();
      createContact.listIds = [parseInt(process.env.BREVO_WAITLIST_ID) || 2];
      createContact.attributes = {
        SOURCE: source,
        SIGNUP_DATE: new Date().toISOString()
      };

      const brevoResponse = await contactsApi.createContact(createContact);
      brevoContactId = brevoResponse.body?.id || brevoResponse.id;
    } catch (brevoError) {
      console.error('Brevo contact creation error:', brevoError);
      // Continue even if Brevo fails
    }

    // Send welcome email
    let emailSent = false;
    try {
      const emailApi = new brevo.TransactionalEmailsApi();
      emailApi.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
      
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = {
        email: process.env.BREVO_SENDER_EMAIL || 'hello@paltextai.com',
        name: 'PaltextAI Team'
      };
      sendSmtpEmail.to = [{ email: email.toLowerCase() }];
      sendSmtpEmail.subject = 'Welcome to the PalText Waitlist! 🎉';
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            h1 { margin: 0; font-size: 32px; }
            .emoji { font-size: 48px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to PalText! 🚀</h1>
            </div>
            <div class="content">
              <div class="emoji">🎉</div>
              <h2>Thank You for Joining Our Waitlist!</h2>
              <p>Hi there,</p>
              <p>We're thrilled to have you on board! You're now on the exclusive waitlist for PalText - the AI-powered customer service platform that doesn't just chat, but actually solves problems.</p>
              
              <h3>What happens next?</h3>
              <ul>
                <li>🎯 You'll be among the first to get early access</li>
                <li>💎 Exclusive launch pricing and benefits</li>
                <li>📧 Regular updates on our progress</li>
                <li>🤝 Direct line to our team for feedback and questions</li>
              </ul>

              <p>In the meantime, feel free to check out our website to learn more about how PalText is revolutionizing customer service:</p>
              
              <div style="text-align: center;">
                <a href="https://paltextai.com" class="button">Visit Our Website</a>
              </div>

              <p>Have questions? Just hit reply - we'd love to hear from you!</p>
              
              <p>Best regards,<br>
              <strong>The PalText Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} PalText. All rights reserved.</p>
              <p>You're receiving this email because you signed up for our waitlist.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await emailApi.sendTransacEmail(sendSmtpEmail);
      emailSent = true;
    } catch (emailError) {
      console.error('Email sending error:', emailError.response?.body || emailError.body || emailError.message);
      // Continue even if email fails
    }

    // Save to database
    const waitlistEntry = new Waitlist({
      email: email.toLowerCase(),
      source,
      brevoContactId,
      emailSent
    });

    await waitlistEntry.save();

    res.status(201).json({ 
      message: 'Successfully joined the waitlist! Check your email.',
      success: true,
      emailSent
    });

  } catch (error) {
    console.error('Waitlist error:', error);
    
    // Check if it's a duplicate key error
    if (error.code === 11000) {
      return res.status(200).json({ 
        message: 'You are already on the waitlist!',
        alreadyExists: true 
      });
    }

    res.status(500).json({ 
      message: 'Failed to join waitlist. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get waitlist stats (admin only)
exports.getWaitlistStats = async (req, res) => {
  try {
    const total = await Waitlist.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await Waitlist.countDocuments({
      createdAt: { $gte: today }
    });

    const sourceBreakdown = await Waitlist.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      total,
      today: todayCount,
      bySource: sourceBreakdown
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// Get all waitlist entries (admin only)
exports.getAllWaitlistEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const entries = await Waitlist.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Waitlist.countDocuments();

    res.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch entries error:', error);
    res.status(500).json({ message: 'Failed to fetch entries' });
  }
};

