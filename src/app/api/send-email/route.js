import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

export async function POST(request) {
  try {
    const { to, subject, body, from } = await request.json();

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

    // Configure email options with reply-to
    const mailOptions = {
      from: `"${from || "No Reply"}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: body,
      replyTo: from, // This ensures replies go to the original sender
      headers: {
        "Reply-To": from, // Additional header for better compatibility
      },
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Email sending failed:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
