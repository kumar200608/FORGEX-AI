"""Mock Vendor Master Registry for Business-Context Verification."""

from typing import Dict, List, Optional
from app.core.models import VendorRecord

# Deterministic mock vendor dataset
MOCK_VENDORS = [
    VendorRecord(
        vendor_id="V001",
        name="ABC Supplies",
        aliases=["ABC Supplies Corporation", "ABC Supplies Ltd", "ABC Inc"],
        approved_beneficiary="ACCT-ABC-001",
        status="ACTIVE",
    ),
    VendorRecord(
        vendor_id="V002",
        name="Global Supplies Corporation",
        aliases=["Global Supplies Corp", "Global Supplies", "Global Corp"],
        approved_beneficiary="GBL-CORP-US-992144",
        status="ACTIVE",
    ),
    VendorRecord(
        vendor_id="V003",
        name="Metro Industrial Partners",
        aliases=["Metro Industrial", "Metro Partners", "Metro Industry"],
        approved_beneficiary="METRO-IND-HDFC-102938",
        status="ACTIVE",
    ),
    VendorRecord(
        vendor_id="V004",
        name="Apex Office Logistics",
        aliases=["Apex Logistics", "Apex Office", "Apex Corp"],
        approved_beneficiary="APEX_HDFC_009988",
        status="ACTIVE",
    ),
    VendorRecord(
        vendor_id="V005",
        name="Legacy Corporation",
        aliases=["Legacy Corp", "Legacy Ltd"],
        approved_beneficiary="LEGACY-OLD-111",
        status="INACTIVE",
    ),
]


class VendorRegistry:
    """In-memory mock vendor registry."""

    def __init__(self):
        self._vendors_by_id: Dict[str, VendorRecord] = {}
        for v in MOCK_VENDORS:
            self._vendors_by_id[v.vendor_id] = v

    def get_vendor_by_id(self, vendor_id: str) -> Optional[VendorRecord]:
        """Lookup vendor by unique ID."""
        return self._vendors_by_id.get(vendor_id)

    def get_vendor_by_name(self, vendor_name: str) -> Optional[VendorRecord]:
        """Fuzzy/exact lookup vendor by name or aliases."""
        if not vendor_name:
            return None
        name_clean = vendor_name.strip().lower()

        # Direct name check
        for v in self._vendors_by_id.values():
            if v.name.lower() == name_clean:
                return v

        # Alias / partial matching
        for v in self._vendors_by_id.values():
            if any(alias.lower() == name_clean for alias in v.aliases):
                return v
            if name_clean in v.name.lower() or v.name.lower() in name_clean:
                return v

        return None

    def is_vendor_active(self, vendor_name_or_id: str) -> bool:
        """Check if a vendor is found and has ACTIVE status."""
        v = self.get_vendor_by_id(vendor_name_or_id) or self.get_vendor_by_name(vendor_name_or_id)
        return v is not None and v.status == "ACTIVE"

    def get_approved_beneficiary(self, vendor_name_or_id: str) -> Optional[str]:
        """Return the whitelisted bank account/beneficiary for an approved vendor."""
        v = self.get_vendor_by_id(vendor_name_or_id) or self.get_vendor_by_name(vendor_name_or_id)
        return v.approved_beneficiary if v else None

    def list_vendors(self) -> List[VendorRecord]:
        """Return all vendor master records."""
        return list(self._vendors_by_id.values())


# Global singleton
_vendor_registry = VendorRegistry()


def get_vendor_registry() -> VendorRegistry:
    """Return global singleton vendor registry."""
    return _vendor_registry
