"""Business Context and Vendor Master Verification Engine."""

from typing import Any, Dict, List, Optional
from app.business.vendor_registry import get_vendor_registry
from app.core.models import BusinessVerificationResult


class VendorVerificationEngine:
    """Verifies invoice business context against mock master vendor registry."""

    def __init__(self):
        self.registry = get_vendor_registry()

    def verify_invoice_business_context(
        self,
        source_id: str,
        extracted_fields: Dict[str, Any],
    ) -> BusinessVerificationResult:
        """
        Evaluate invoice business attributes:
        - Check vendor existence in approved registry
        - Check vendor operational status (ACTIVE vs INACTIVE)
        - Validate beneficiary account against whitelisted bank details on file
        """
        vendor_raw = extracted_fields.get("vendor")
        beneficiary_raw = extracted_fields.get("beneficiary_account")

        reasons: List[str] = []
        risk_level = "NONE"

        # 1. Vendor existence check
        vendor_record = self.registry.get_vendor_by_name(str(vendor_raw)) if vendor_raw else None

        if not vendor_record:
            return BusinessVerificationResult(
                source_id=source_id,
                vendor_name=str(vendor_raw) if vendor_raw else "Unknown",
                vendor_found=False,
                vendor_status="NOT_FOUND",
                beneficiary_match=False,
                actual_beneficiary=str(beneficiary_raw) if beneficiary_raw else None,
                risk_level="HIGH",
                reasons=[
                    f"Vendor '{vendor_raw}' was not found in the approved vendor registry. "
                    "Unregistered vendor accounts require out-of-band onboarding."
                ],
            )

        vendor_id = vendor_record.vendor_id
        vendor_name = vendor_record.name
        vendor_status = vendor_record.status
        expected_beneficiary = vendor_record.approved_beneficiary

        # 2. Check vendor operational status
        if vendor_status != "ACTIVE":
            risk_level = "HIGH"
            reasons.append(
                f"Vendor '{vendor_name}' ({vendor_id}) has inactive status '{vendor_status}'. "
                "Payments to inactive vendors are prohibited."
            )

        # 3. Check beneficiary account matching
        if not beneficiary_raw:
            beneficiary_match = False
            risk_level = "MEDIUM" if risk_level == "NONE" else risk_level
            reasons.append("Invoice does not specify a beneficiary account.")
        elif str(beneficiary_raw).strip() == expected_beneficiary:
            beneficiary_match = True
            reasons.append(
                f"Beneficiary account '{beneficiary_raw}' matches approved master record for {vendor_name}."
            )
        else:
            beneficiary_match = False
            risk_level = "CRITICAL"
            reasons.append(
                f"CRITICAL BENEFICIARY MISMATCH: Invoice states account '{beneficiary_raw}', "
                f"but approved vendor registry specifies '{expected_beneficiary}'."
            )

        if vendor_status == "ACTIVE" and beneficiary_match:
            reasons.insert(0, f"Vendor '{vendor_name}' ({vendor_id}) verified active with matching beneficiary.")

        return BusinessVerificationResult(
            source_id=source_id,
            vendor_id=vendor_id,
            vendor_name=vendor_name,
            vendor_found=True,
            vendor_status=vendor_status,
            beneficiary_match=beneficiary_match,
            expected_beneficiary=expected_beneficiary,
            actual_beneficiary=str(beneficiary_raw) if beneficiary_raw else None,
            risk_level=risk_level,
            reasons=reasons,
        )


# Global singleton
_verification_engine = VendorVerificationEngine()


def get_vendor_verification_engine() -> VendorVerificationEngine:
    """Return global singleton vendor verification engine."""
    return _verification_engine
