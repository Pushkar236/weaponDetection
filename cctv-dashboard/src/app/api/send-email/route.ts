import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    status: "Email service ready",
    message: "Configure EMAIL_USER and EMAIL_PASSWORD environment variables for full functionality"
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      to = "security@organization.com",
      subject,
      weaponType,
      confidence,
      location,
      timestamp,
      severity,
      screenshot
    } = body;

    // For demo purposes, we'll just log the email data
    // In production, you'd integrate with an actual email service like SendGrid, Nodemailer, etc.
    
    const emailContent = {
      to,
      subject,
      content: {
        weaponType,
        confidence,
        location,
        timestamp: new Date(timestamp).toLocaleString(),
        severity,
        hasScreenshot: !!screenshot
      }
    };

    console.log("📧 Email notification:", emailContent);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real implementation, you would:
    // 1. Use a service like SendGrid, AWS SES, or SMTP
    // 2. Format the email with proper HTML template
    // 3. Attach the screenshot if provided
    // 4. Handle authentication and error cases

    return NextResponse.json({
      success: true,
      message: "Email notification sent successfully (demo mode)",
      emailContent
    });

  } catch (error) {
    console.error("❌ Failed to send email:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        message: "Failed to send security alert email",
      },
      { status: 500 }
    );
  }
}