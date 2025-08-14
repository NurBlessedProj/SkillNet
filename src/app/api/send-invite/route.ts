import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email, role, name, disciplines, subcategories,currentDomain } =
      await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Create a nodemailer transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Format disciplines and subcategories for the email
    const disciplinesList = disciplines?.join(", ") || "";
   
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Assessment System"}" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Welcome to the Assessment System - Examiner Access",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4640DE;">Welcome to the Assessment System!</h2>
          <p>Hello ${name || "Examiner"},</p>
          <p>You have been added as an <strong>Examiner</strong> to our assessment system. You will be responsible for reviewing and evaluating test submissions from candidates.</p>
          
          <h3 style="color: #333;">Your Assigned Disciplines:</h3>
          <p>${disciplinesList || "No specific disciplines assigned yet."}</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Login Details:</strong></p>
            <p style="margin: 5px 0;">Email: ${email}</p>
            <p style="margin: 5px 0;">Password: The password you received separately</p>
            <p style="margin: 10px 0 0; font-size: 0.9em; color: #666;">For security reasons, we recommend changing your password after your first login.</p>
          </div>
          
          <p>To get started, please visit <a href="${
            process.env.NEXT_PUBLIC_SITE_URL || currentDomain
          }/auth" style="color: #4640DE;">our login page</a> and enter your credentials.</p>
          
          <p>If you have any questions or need assistance, please contact the administrator.</p>
          
          <p>Thank you for your contribution to our assessment process!</p>
          
          <p style="margin-top: 30px; font-size: 0.9em; color: #666;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return NextResponse.json(
      { error: "Failed to send invitation email" },
      { status: 500 }
    );
  }
}
