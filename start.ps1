# Starts local-only servers. Both windows remain hidden; logs stay in runtime.
$taskRoot=$PSScriptRoot
New-Item -ItemType Directory -Force -Path (Join-Path $taskRoot 'runtime') | Out-Null
Start-Process -FilePath 'python' -ArgumentList '-m','uvicorn','backend.main:app','--host','127.0.0.1','--port','8011' -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRoot 'runtime/backend.log') -RedirectStandardError (Join-Path $taskRoot 'runtime/backend-error.log')
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm run dev' -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRoot 'runtime/frontend.log') -RedirectStandardError (Join-Path $taskRoot 'runtime/frontend-error.log')
Write-Output 'Do Duniya: http://127.0.0.1:5175 (servers must be stopped before running this again).'
