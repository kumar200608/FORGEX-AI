rule SuspiciousPayload
{
    meta:
        description = "Detects suspicious payload structures and EICAR markers"
        author = "Unified AI Security Firewall"
        severity = "HIGH"

    strings:
        $eicar = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*" ascii wide
        $eval = "eval(base64_decode" ascii wide nocase
        $shellcode = "\\x90\\x90\\x90\\x90\\x90\\x90\\x90\\x90" ascii wide

    condition:
        any of them
}
