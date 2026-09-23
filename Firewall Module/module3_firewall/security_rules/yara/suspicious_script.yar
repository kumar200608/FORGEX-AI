rule SuspiciousScript
{
    meta:
        description = "Detects suspicious command execution and scripting patterns"
        author = "Unified AI Security Firewall"
        severity = "HIGH"

    strings:
        $powershell1 = "powershell -nop" ascii wide nocase
        $powershell2 = "powershell -enc" ascii wide nocase
        $powershell3 = "powershell.exe -executionpolicy bypass" ascii wide nocase
        $cmd1 = "cmd.exe /c" ascii wide nocase
        $wscript = "wscript.shell" ascii wide nocase
        $b64_exec = "FromBase64String" ascii wide nocase
        $download = "DownloadString(" ascii wide nocase

    condition:
        any of them
}
