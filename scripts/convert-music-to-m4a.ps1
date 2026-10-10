$files = Get-ChildItem "public/assets/music/url/*.opus"
foreach ($f in $files) {
    $out = $f.FullName -replace '\.opus$', '.m4a'
    Write-Host "Converting $($f.Name) -> $(Split-Path $out -Leaf)..."
    & ffmpeg -y -v error -i $f.FullName -c:a aac -b:a 192k $out
}
Write-Host "All converted successfully!"
