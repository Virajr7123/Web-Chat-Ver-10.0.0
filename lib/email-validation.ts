"use server"

export async function validateEmailOnServer(email: string): Promise<{ isValid: boolean; message: string }> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_EMAIL_VALIDATION_API_KEY

    // If API key is not configured, skip API validation and use local validation only
    if (!apiKey) {
      return { isValid: true, message: "Email format validated" }
    }

    const response = await fetch(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`,
    )

    if (response.ok) {
      const data = await response.json()
      if (data.deliverability === "UNDELIVERABLE" || data.is_disposable_email?.value === true) {
        return { isValid: false, message: "Email address cannot receive emails" }
      }
      if (data.deliverability === "DELIVERABLE") {
        return { isValid: true, message: "Email verified successfully" }
      }
    }
  } catch (apiError) {
    console.error("Email validation API error:", apiError)
    // API failed, return success to allow user to proceed with local validation
    return { isValid: true, message: "Email format validated" }
  }

  return { isValid: true, message: "Email format validated" }
}
