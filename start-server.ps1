$logFile = "C:\Users\moham\car-rental-os\server.log"
$process = Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "next start -p 3003" -WorkingDirectory "C:\Users\moham\car-rental-os" -RedirectStandardOutput $logFile -RedirectStandardError $logFile -PassThru
Write-Host "Server started with PID: $($process.Id)"
Write-Host "Log file: $logFile"
