def send_email(recipient: str, subject: str, body: str) -> dict:
    """
    Prototype email tool.
    This does not send a real email.
    It only simulates the email tool execution.
    """

    print("\n📧 EMAIL TOOL EXECUTED")
    print(f"To: {recipient}")
    print(f"Subject: {subject}")
    print(f"Body: {body}")

    return {
        "status": "email_sent",
        "recipient": recipient,
        "subject": subject,
        "message": "Email tool executed successfully."
    }