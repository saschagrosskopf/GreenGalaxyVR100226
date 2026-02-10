# Create directory
New-Item -ItemType Directory -Force -Path "frontend/public/assets/avatars"

# Define assets
$assets = @(
    @("executive.glb", "https://models.readyplayer.me/64bfa15f0e72c63d7c3934af.glb"),
    @("architect.glb", "https://models.readyplayer.me/64bfa15f0e72c63d7c3934b3.glb"),
    @("creative.glb", "https://models.readyplayer.me/64bfa15f0e72c63d7c3934b7.glb"),
    @("anim_idle.glb", "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?animations=idle"),
    @("anim_walk.glb", "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?animations=walk"),
    @("anim_wave.glb", "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?animations=wave"),
    @("anim_clap.glb", "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?animations=clap"),
    @("anim_dance.glb", "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?animations=dance"),
    @("anim_thumbsup.glb", "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?animations=thumbsup"),
    @("anim_thinking.glb", "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?animations=thinking")
)

# Download loop
foreach ($asset in $assets) {
    $name = $asset[0]
    $url = $asset[1]
    $output = "frontend/public/assets/avatars/$name"
    
    Write-Host "Downloading $name..."
    Invoke-WebRequest -Uri $url -OutFile $output
}

Write-Host "✅ All avatars downloaded to frontend/public/assets/avatars/"
