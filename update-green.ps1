$files = Get-ChildItem -Recurse -File | Where-Object { $_.Extension -in '.ts','.tsx','.js' }
$changed = 0
foreach ($f in $files) {
  $t = Get-Content -Raw $f
  $new = $t -replace '#2E7D32','#1D5C45' -replace '#1B5E20','#16482F'
  if ($new -ne $t) { $new | Set-Content $f; $changed++; Write-Output "Updated: $($f.FullName)" }
}
Write-Output "Total updated: $changed"