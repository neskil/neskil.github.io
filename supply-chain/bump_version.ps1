$idx = Get-Content 'index.html' -Raw
$idx = $idx -replace 'v=1\.49\.0','v=1.50.0'
Set-Content 'index.html' -Value $idx -NoNewline
$tst = Get-Content 'tests.html' -Raw
$tst = $tst -replace 'v=1\.49\.0','v=1.50.0'
Set-Content 'tests.html' -Value $tst -NoNewline
