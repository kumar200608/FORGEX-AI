"""Email (.eml) content extractor for TraceGuard AI."""

import email
from email import policy
from email.message import EmailMessage
from typing import Any, Dict, List
from bs4 import BeautifulSoup

from app.ingestion.extractors.base import BaseExtractor, ExtractionResult, ExtractionStatus


class EmailExtractor(BaseExtractor):
    """
    Safely parses RFC 822 / MIME .eml email messages.
    
    Security note:
    Email headers (From, To, Subject) and message bodies are untrusted external input.
    Sender address must never be treated as identity verification or authorization.
    """

    @property
    def supported_extensions(self) -> List[str]:
        return [".eml"]

    @property
    def format_name(self) -> str:
        return "Email Message (EML)"

    def extract(self, filename: str, content: bytes) -> ExtractionResult:
        try:
            msg: EmailMessage = email.message_from_bytes(content, policy=policy.default)
            
            headers: Dict[str, str] = {
                "from": str(msg.get("From", "")),
                "to": str(msg.get("To", "")),
                "cc": str(msg.get("Cc", "")),
                "subject": str(msg.get("Subject", "")),
                "date": str(msg.get("Date", "")),
                "message_id": str(msg.get("Message-ID", "")),
            }

            body_parts = []
            attachment_names = []

            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get_content_disposition() or "")

                    if "attachment" in content_disposition:
                        att_name = part.get_filename() or "unnamed_attachment"
                        attachment_names.append(att_name)
                    elif content_type == "text/plain":
                        try:
                            payload = part.get_payload(decode=True)
                            if payload:
                                body_parts.append(payload.decode("utf-8", errors="replace").strip())
                        except Exception:
                            pass
                    elif content_type == "text/html":
                        try:
                            payload = part.get_payload(decode=True)
                            if payload:
                                html_text = payload.decode("utf-8", errors="replace")
                                soup = BeautifulSoup(html_text, "html.parser")
                                for s in soup(["script", "style", "iframe"]):
                                    s.decompose()
                                clean_html_text = soup.get_text(separator="\n").strip()
                                if clean_html_text:
                                    body_parts.append(clean_html_text)
                        except Exception:
                            pass
            else:
                content_type = msg.get_content_type()
                payload = msg.get_payload(decode=True)
                if payload:
                    raw_str = payload.decode("utf-8", errors="replace")
                    if content_type == "text/html":
                        soup = BeautifulSoup(raw_str, "html.parser")
                        for s in soup(["script", "style", "iframe"]):
                            s.decompose()
                        body_parts.append(soup.get_text(separator="\n").strip())
                    else:
                        body_parts.append(raw_str.strip())

            # Construct normalized email text representation
            header_lines = [
                f"From: {headers['from']}",
                f"To: {headers['to']}",
            ]
            if headers["cc"]:
                header_lines.append(f"CC: {headers['cc']}")
            header_lines.append(f"Subject: {headers['subject']}")
            if headers["date"]:
                header_lines.append(f"Date: {headers['date']}")
            if attachment_names:
                header_lines.append(f"Attachments: {', '.join(attachment_names)}")

            full_headers_text = "\n".join(header_lines)
            full_body_text = "\n\n".join([b for b in body_parts if b.strip()])

            full_text = f"{full_headers_text}\n\n--- Body ---\n{full_body_text}".strip()

            metadata = {
                "headers": headers,
                "attachment_count": len(attachment_names),
                "attachment_names": attachment_names,
                "is_multipart": msg.is_multipart(),
            }

            return ExtractionResult(
                status=ExtractionStatus.SUCCESS,
                raw_text=full_text,
                extracted_fields={
                    "sender": headers["from"],
                    "recipient": headers["to"],
                    "subject": headers["subject"],
                    "attachments": attachment_names,
                },
                metadata=metadata,
                warnings=[
                    "Email headers and body content are untrusted external input.",
                ] if any(headers.values()) else [],
            )
        except Exception as e:
            return ExtractionResult(
                status=ExtractionStatus.FAILED,
                error_message=f"Email (.eml) parsing error: {str(e)}",
            )
