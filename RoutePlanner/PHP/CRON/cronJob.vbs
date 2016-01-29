Set WinScriptHost = CreateObject("WScript.Shell")
WinScriptHost.Run Chr(34) & "C:\wamp\www\cronJob.bat" & Chr(34), 0
Set WinScriptHost = Nothing