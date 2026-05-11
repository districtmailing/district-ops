import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sellercomp.com";
    const signupUrl = `${appUrl}/signup?invite=${encodeURIComponent(cleanEmail)}`;

    console.log("LIVE RESEND INVITE ROUTE HIT");
    console.log("Sending Resend invite to:", cleanEmail);
    console.log("RESEND KEY EXISTS:", !!process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: "SellerComp <invites@sellercomp.com>",
      to: [cleanEmail],
      subject: "You have been invited to SellerComp",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>You have been invited to SellerComp</h2>
          <p>You have been invited to join your company team.</p>
          <p>Click below to create your account:</p>
          <a href="${signupUrl}" style="display:inline-block;background:#2F80ED;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Create Account
          </a>
          <p>If the button does not work, copy and paste this link:</p>
          <p>${signupUrl}</p>
        </div>
      `,
    });

    console.log("Resend data:", data);
    console.log("Resend error:", error);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data, signupUrl });
  } catch (error: any) {
    console.error("Invite email failed:", error);

    return NextResponse.json(
      { error: error?.message || "Invite email failed." },
      { status: 500 }
    );
  }
}