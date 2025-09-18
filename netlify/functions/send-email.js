const fetch = require('node-fetch');

// Configure email provider (you can use SendGrid, AWS SES, etc.)
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'console';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@dogusotomat.com';
const FROM_NAME = process.env.FROM_NAME || 'Doğuş Otomat Telemetri Sistemi';

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the request body
    const { to, subject, htmlContent, from } = JSON.parse(event.body);
    
    // Validate required fields
    if (!to || !subject || !htmlContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to, subject, htmlContent' })
      };
    }

    // Send email based on provider
    let result;
    switch (EMAIL_PROVIDER) {
      case 'sendgrid':
        result = await sendViaSendGrid(to, subject, htmlContent, from);
        break;
      case 'console':
      default:
        result = await sendViaConsole(to, subject, htmlContent, from);
        break;
    }

    console.log(`✅ Email sent successfully to: ${to.join(', ')}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        provider: EMAIL_PROVIDER,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to send email',
        message: error.message
      })
    };
  }
};

// Send email via SendGrid
async function sendViaSendGrid(to, subject, htmlContent, from) {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: to.map(email => ({ email })),
        subject: subject
      }],
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      content: [{
        type: 'text/html',
        value: htmlContent
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
  }

  return { success: true };
}

// Console-based email simulation (for development/testing)
async function sendViaConsole(to, subject, htmlContent, from) {
  console.log('\n📧 EMAIL NOTIFICATION SENT (CONSOLE SIMULATION):');
  console.log('━'.repeat(70));
  console.log(`📤 From: ${from || `${FROM_NAME} <${FROM_EMAIL}>`}`);
  console.log(`📥 To: ${to.join(', ')}`);
  console.log(`📋 Subject: ${subject}`);
  console.log(`⏰ Time: ${new Date().toLocaleString('tr-TR')}`);
  console.log('━'.repeat(70));
  
  // Remove HTML tags for console display
  const textContent = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  console.log('📄 Email Content:');
  console.log(textContent.substring(0, 500) + (textContent.length > 500 ? '...' : ''));
  console.log('━'.repeat(70));
  console.log('✅ Email simulation completed\n');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return { success: true };
}