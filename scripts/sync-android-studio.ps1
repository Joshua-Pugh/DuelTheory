param([string]$Target='C:\Users\joshu\AndroidStudioProjects\DuelTheory')
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$targetPath=[IO.Path]::GetFullPath($Target).TrimEnd('\')
if($targetPath -ne 'C:\Users\joshu\AndroidStudioProjects\DuelTheory'){throw 'This sync is restricted to the user-provided Android project.'}
$source=Join-Path $repo 'android'
if(!(Test-Path -LiteralPath (Join-Path $source 'app\src\main\assets\public\index.html'))){throw 'Run npm run android:sync first.'}
$backup=Join-Path (Split-Path $repo -Parent) ('android-starter-backup-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup | Out-Null
& robocopy $targetPath $backup /E /XD .gradle .idea build /NFL /NDL /NJH /NJS | Out-Null
if($LASTEXITCODE -gt 7){throw 'Could not back up the existing Android project.'}
foreach($relative in @('settings.gradle.kts','build.gradle.kts','app\build.gradle.kts')){
 $leaf=[IO.Path]::GetFullPath((Join-Path $targetPath $relative))
 if(!$leaf.StartsWith($targetPath+'\')){throw 'Unexpected target path.'}
 if(Test-Path -LiteralPath $leaf){Remove-Item -LiteralPath $leaf -Force}
}
$resources=[IO.Path]::GetFullPath((Join-Path $targetPath 'app\src\main\res'))
if($resources -ne ($targetPath+'\app\src\main\res')){throw 'Unexpected resource directory.'}
if(Test-Path -LiteralPath $resources){Remove-Item -LiteralPath $resources -Recurse -Force}
& robocopy $source $targetPath /E /XD .gradle .idea build /XF local.properties /NFL /NDL /NJH /NJS | Out-Null
if($LASTEXITCODE -gt 7){throw 'Could not copy the Android project.'}
foreach($density in @('mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi')){
 foreach($name in @('ic_launcher','ic_launcher_round')){
  $relative="app\src\main\res\mipmap-$density\$name.webp"
  $leaf=[IO.Path]::GetFullPath((Join-Path $targetPath $relative))
  $replacement=Join-Path $source "app\src\main\res\mipmap-$density\$name.png"
  if(!$leaf.StartsWith($targetPath+'\')){throw 'Unexpected icon path.'}
  if((Test-Path -LiteralPath $replacement) -and (Test-Path -LiteralPath $leaf)){Remove-Item -LiteralPath $leaf -Force}
 }
}
$settings=Join-Path $targetPath 'capacitor.settings.gradle'
$content=Get-Content -LiteralPath $settings -Raw
$modules=(Join-Path $repo 'node_modules').Replace('\','/')
$content=$content.Replace('../node_modules',$modules)
[IO.File]::WriteAllText($settings,$content)
$properties=Join-Path $targetPath 'gradle.properties'
$propertiesContent=Get-Content -LiteralPath $properties -Raw
$propertiesContent+="`norg.gradle.java.home=C:/Program Files/Java/jdk-21`n"
[IO.File]::WriteAllText($properties,$propertiesContent)
Write-Output "Android project updated: $targetPath"
Write-Output "Previous files backed up: $backup"
