# telecharger-images.ps1 — JB EMERIC
# Lance ce script depuis le dossier Jbemeric pour télécharger toutes les images
# PowerShell: .\telecharger-images.ps1

$dest = ".\assets\images"
if (!(Test-Path $dest)) { New-Item -ItemType Directory -Path $dest }

$images = @(
  @{url="https://jbemeric.com/wp-content/uploads/2025/12/PODIUM-RICARD-94-CHAMP-B-JB-GUIBBERT-TARRES-DANIEL-DELIEN-300x216-1.jpg"; local="podium-paul-ricard-1994.jpg"},
  @{url="https://jbemeric.com/wp-content/uploads/2022/01/KARTING-X-2-AV-768x512.jpg"; local="karting-enfant-circuit.jpg"},
  @{url="https://jbemeric.com/wp-content/uploads/2022/05/Depart-avec-les-news-270cc-compresse-768x576.jpg"; local="karting-adulte-depart.jpg"},
  @{url="https://jbemeric.com/wp-content/uploads/2020/07/JB-EXPLIQUE-PISTE-A-LANDINI-RICARD-SUPERTOURISME-300x200.jpg"; local="jb-coaching-piste.jpg"},
  @{url="https://jbemeric.com/wp-content/uploads/2026/02/B-M-W-325-I-HTCC-3-4-AVANT.jpg"; local="bmw-325i-htcc.jpg"},
  @{url="https://jbemeric.com/wp-content/uploads/2026/02/B-M-W-325-I-HTCC-COTE.jpg"; local="bmw-325i-htcc-cote.jpg"},
  @{url="https://jbemeric.com/wp-content/uploads/2026/02/AFFICHE-CASQU-CASQUETTE-COUPE-D-K-A-A-683x1024.png"; local="affiche-challenge-kart-auto.png"},
  @{url="https://jbemeric.com/wp-content/uploads/2022/01/KARTING-5-BRIEF-MIEUX-300x200.jpg"; local="briefing-karting-enfant.jpg"},
  @{url="https://jbemeric.com/wp-content/uploads/2022/01/KARTING-X-5-ATTENTE-300x200.jpg"; local="karting-adulte-circuit.jpg"},
  @{url="https://jbemeric.com/wp-content/uploads/2022/01/KARTING-08-3-4-300x200.jpg"; local="karting-challenge-auto.jpg"},
  @{url="https://jbemeric.com/wp-content/uploads/2022/01/JB-EMERIC-PILOTE-300x200.jpg"; local="jb-emeric-pilote.jpg"},
  @{url="https://jbemeric.com/wp-content/uploads/2022/01/photo-salle-briefing-300x225.jpg"; local="salle-briefing.jpg"},
  @{url="https://jbemeric.com/wp-content/uploads/2022/01/LOTUS-AU-CIRCUIT-DU-LUC-LAURET9-300x194.jpg"; local="lotus-circuit-du-luc.jpg"},
  @{url="https://jbemeric.com/wp-content/uploads/2020/07/G-T-3-R-S-3-4-AVANT-JOELLE-LE-LUC-15-8-19-4-300x200.jpg"; local="porsche-gt3-circuit-albi.jpg"},
)

foreach ($img in $images) {
  $path = "$dest\$($img.local)"
  if (Test-Path $path) { Write-Host "~ Deja present: $($img.local)"; continue }
  try {
    Invoke-WebRequest -Uri $img.url -OutFile $path -UserAgent "Mozilla/5.0"
    $size = (Get-Item $path).Length / 1KB
    Write-Host "OK $($img.local) ($([math]::Round($size))Ko)"
  } catch {
    Write-Host "ERREUR $($img.local): $_"
  }
}
Write-Host "
Termine ! Images dans assets/images/"
