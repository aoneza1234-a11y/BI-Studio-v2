$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
} catch {
    $port = 3001
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Google Sheets Dashboard Local Server" -ForegroundColor Cyan
Write-Host "  Server running at: http://localhost:$port/" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Gray

Start-Process "http://localhost:$port/dashboard-offline.html"

Write-Host "Server is active. Keep this window open while using the dashboard." -ForegroundColor White
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $subPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($subPath)) {
            $subPath = "dashboard-offline.html"
        }

        # Handle API proxy for Google Sheets CSV
        if ($subPath.StartsWith("api/sheets-csv")) {
            try {
                $rawQuery = $request.Url.Query.TrimStart('?')
                $params = @{}
                $rawQuery.Split('&') | ForEach-Object {
                    $parts = $_.Split('=', 2)
                    if ($parts.Length -ge 1 -and -not [string]::IsNullOrEmpty($parts[0])) {
                        $val = if ($parts.Length -eq 2) { [System.Uri]::UnescapeDataString($parts[1]) } else { "" }
                        $params[$parts[0]] = $val
                    }
                }
                $sheetId = $params['id']
                $gid = $params['gid']
                $sheetName = $params['sheet']

                if (-not [string]::IsNullOrEmpty($sheetId)) {
                    $targetUrl = "https://docs.google.com/spreadsheets/d/$sheetId/gviz/tq?tqx=out:csv"
                    if (-not [string]::IsNullOrEmpty($gid)) {
                        $targetUrl += "&gid=$gid"
                    }
                    if (-not [string]::IsNullOrEmpty($sheetName)) {
                        $encodedSheet = [System.Uri]::EscapeDataString($sheetName)
                        $targetUrl += "&sheet=$encodedSheet"
                    }

                    $webClient = New-Object System.Net.WebClient
                    $webClient.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    $csvBytes = $webClient.DownloadData($targetUrl)
                    $webClient.Dispose()

                    $response.ContentType = "text/csv; charset=utf-8"
                    $response.ContentLength64 = $csvBytes.Length
                    $response.AddHeader("Access-Control-Allow-Origin", "*")
                    $response.OutputStream.Write($csvBytes, 0, $csvBytes.Length)
                    $response.Close()
                    continue
                }
            } catch {
                $response.StatusCode = 502
                $response.Close()
                continue
            }
        }

        $localPath = Join-Path (Get-Location) $subPath
        if ([System.IO.Directory]::Exists($localPath)) {
            $localPath = Join-Path $localPath "dashboard-offline.html"
            if (-not [System.IO.File]::Exists($localPath)) {
                $localPath = Join-Path (Get-Location) "dist/index.html"
            }
        }

        if ([System.IO.File]::Exists($localPath)) {
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentLength64 = $bytes.Length

            if ($localPath.EndsWith('.html')) { $response.ContentType = 'text/html; charset=utf-8' }
            elseif ($localPath.EndsWith('.js')) { $response.ContentType = 'application/javascript; charset=utf-8' }
            elseif ($localPath.EndsWith('.css')) { $response.ContentType = 'text/css; charset=utf-8' }
            elseif ($localPath.EndsWith('.json')) { $response.ContentType = 'application/json; charset=utf-8' }
            elseif ($localPath.EndsWith('.png')) { $response.ContentType = 'image/png' }
            elseif ($localPath.EndsWith('.jpg') -or $localPath.EndsWith('.jpeg')) { $response.ContentType = 'image/jpeg' }
            elseif ($localPath.EndsWith('.svg')) { $response.ContentType = 'image/svg+xml' }
            elseif ($localPath.EndsWith('.ico')) { $response.ContentType = 'image/x-icon' }

            # Add CORS headers so Google Sheets and fetch work seamlessly
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    } catch {
        # Ignore client aborts
    }
}
