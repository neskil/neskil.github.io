Add-Type -AssemblyName System.Drawing

$w = 400
$h = 180
$bmp = [System.Drawing.Bitmap]::new($w, $h)
$gfx = [System.Drawing.Graphics]::FromImage($bmp)
$gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
$gfx.Clear([System.Drawing.Color]::White)

$black   = [System.Drawing.Color]::FromArgb(0, 0, 0)
$red     = [System.Drawing.Color]::FromArgb(255, 0, 0)
$blue    = [System.Drawing.Color]::FromArgb(0, 0, 255)
$green   = [System.Drawing.Color]::FromArgb(0, 200, 50)
$magenta = [System.Drawing.Color]::FromArgb(255, 0, 255)

$bBlack   = [System.Drawing.SolidBrush]::new($black)
$bRed     = [System.Drawing.SolidBrush]::new($red)
$bBlue    = [System.Drawing.SolidBrush]::new($blue)
$bGreen   = [System.Drawing.SolidBrush]::new($green)
$bMagenta = [System.Drawing.SolidBrush]::new($magenta)

# Helpers
function FillRect($b, $x, $y, $sw, $sh) { $gfx.FillRectangle($b, [int]$x, [int]$y, [int]$sw, [int]$sh) }
function Dot($b, $x, $y) { $gfx.FillRectangle($b, [int]$x, [int]$y, 1, 1) }

# --- FLOOR (solid base) ---
FillRect $bBlack 0 160 400 20

# --- LEFT CLIFF / WALL ---
FillRect $bBlack 0 0 15 160

# --- RIGHT CLIFF / WALL ---
FillRect $bBlack 385 0 15 160

# --- Zone A: Open landing area (left, wide, flat) ---
# Raised plateau
FillRect $bBlack 15 120 60 40

# --- Zone B: Canyon bridge leading to cave (center-left) ---
# Canyon walls
FillRect $bBlack 75 60 12 100
FillRect $bBlack 110 40 12 120

# Canyon floor slot (gap, open — the lander has to cross the ravine)

# Bridge above canyon (optional ceiling segment)
FillRect $bBlack 75 38 47 10

# --- Zone C: Central cave system ---
# Ceiling slab
FillRect $bBlack 122 25 100 12

# Left wall of cave
FillRect $bBlack 122 37 12 90

# Right wall of cave
FillRect $bBlack 210 37 12 90

# Interior cave floor (thin shelf at bottom)
FillRect $bBlack 134 127 76 5

# Cave interior is free space (the tunnel)
# Stalagmite in the middle of cave
FillRect $bBlack 172 110 10 22

# Upper passage in cave ceiling
FillRect $bBlack 143 25 40 8
# break in ceiling = passage upward

# --- Zone D: Upper area (above cave) accessible via passage ---
FillRect $bBlack 122 0 100 15
# Rock pillars
FillRect $bBlack 140 15 10 10
FillRect $bBlack 190 15 10 10

# --- Zone E: Right side - jagged canyon / hazard zone ---
# Step terrain descending right
FillRect $bBlack 222 80 30 80
FillRect $bBlack 252 100 30 60
FillRect $bBlack 282 115 30 45
FillRect $bBlack 312 90 20 70
FillRect $bBlack 332 130 53 30

# Overhang ledge
FillRect $bBlack 252 70 50 10

# --- PAD PLACEMENTS ---

# Start Depot (red) — Zone A plateau, nice open area
Dot $bRed 50 119

# Delivery Hub 1 (blue) — inside the cave, floor shelf
Dot $bBlue 165 126

# Delivery Hub 2 (green) — upper zone above cave
Dot $bGreen 160 14

# Sandworm Hazard 1 (magenta) — canyon gap
Dot $bMagenta 95 159

# Sandworm Hazard 2 (magenta) — right hazard zone
Dot $bMagenta 300 114

$out = "c:\AntiGravity\neskil.github.io\space-trucking\levels\level_02.png"
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Level saved to $out ($w x $h pixels)"

