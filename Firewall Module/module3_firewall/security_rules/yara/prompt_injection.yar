rule PromptInjection
{
    meta:
        description = "Detects indirect prompt injection phrases"
        author = "Unified AI Security Firewall"
        severity = "HIGH"

    strings:
        $p1 = "ignore previous instructions" ascii wide nocase
        $p2 = "override system instructions" ascii wide nocase
        $p3 = "bypass security" ascii wide nocase
        $p4 = "reveal secrets" ascii wide nocase
        $p5 = "send data to" ascii wide nocase
        $p6 = "disable security" ascii wide nocase
        $p7 = "execute this command" ascii wide nocase
        $p8 = "change your priority" ascii wide nocase
        $p9 = "follow these hidden instructions" ascii wide nocase

    condition:
        any of them
}
