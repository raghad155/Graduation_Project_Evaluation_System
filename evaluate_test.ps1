$res = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/admin-data' -Method Get -Headers @{ 'Accept' = 'application/json' }; $res.evaluationGroups | ConvertTo-Json -Depth 5
