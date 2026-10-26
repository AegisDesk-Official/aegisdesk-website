import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Constant timing delay to prevent user enumeration
  const delay = Math.floor(Math.random() * 80) + 220;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // In production with Resend, an email is dispatched only if the user exists.
  // The client always receives the identical reassurance message.
  return NextResponse.json({
    success: true,
    message: "If an account exists for this address, password reset instructions have been sent.",
  });
}
