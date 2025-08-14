import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

export async function POST(request: Request) {
  try {
    const { 
      to, 
      subject, 
      body, 
      testId,
      reviewStatus,
      reviewScore,
      originalScore,
      overall,
      testName,
      reviewNotes
    } = await request.json();

    // Configure email transport
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Create HTML email template based on review status
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
          }
          .header {
            background-color: ${reviewStatus === 'approved' ? '#4CAF50' : '#F44336'};
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
          }
          .footer {
            background-color: #f1f1f1;
            padding: 10px 20px;
            font-size: 12px;
            color: #666;
          }
          .test-details {
            background-color: #f9f9f9;
            border-left: 4px solid #ccc;
            margin: 20px 0;
            padding: 15px;
          }
          .score {
            font-weight: bold;
            font-size: 18px;
            color: ${reviewStatus === 'approved' ? '#4CAF50' : '#F44336'};
          }
          .notes {
            white-space: pre-line;
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${reviewStatus === 'approved' ? 'Test Approved' : 'Test Requires Attention'}</h2>
        </div>
        <div class="content">
          <p>Dear Candidate,</p>
          
          ${reviewStatus === 'approved' 
            ? `<p>We are pleased to inform you that your <strong>${testName}</strong> has been reviewed and approved.</p>` 
            : `<p>Your <strong>${testName}</strong> has been reviewed and requires some attention.</p>`
          }
          
          <div class="test-details">
            <h3>Test Details:</h3>
            <p><strong>Test:</strong> ${testName}</p>
            <p><strong>Original Score:</strong> <span class="score">${originalScore}/${overall}</span></p>
            ${reviewScore !== null ? `<p><strong>Review Score:</strong> <span class="score">${reviewScore}/${overall}</span></p>` : ''}
          </div>
          
          <h3>Reviewer Notes:</h3>
          <div class="notes">
            ${reviewNotes.replace(/\n/g, '<br>')}
          </div>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The Assessment Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
      </body>
      </html>
    `;

    // Configure email options
    const mailOptions: Mail.Options = {
      from: `"Assessment Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: body, // Plain text version
      html: htmlContent, // HTML version
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Log the email sent for audit purposes
    console.log(`Evaluation email sent to ${to} for test ${testId} with status ${reviewStatus}`);

    return NextResponse.json({
      success: true,
      message: "Evaluation email sent successfully",
    });
  } catch (error) {
    console.error("Evaluation email sending failed:", error);
    return NextResponse.json(
      {
        error: "Failed to send evaluation email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}