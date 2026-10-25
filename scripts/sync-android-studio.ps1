param([string]$Target='C:\Users\joshu\AndroidStudioProjects\DuelTheory')
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$targetPath=[IO.Path]::GetFullPath($Target).TrimEnd('\')
if($targetPath -ne 'C:\Users\joshu\AndroidStudioProjects\DuelTheory'){throw 'This sync is restricted to the user-provided Android project.'}
$source=Join-Path $repo 'android'
if(!(Test-Path -LiteralPath (Join-Path $source 'app\src\main\assets\public\index.html'))){throw 'Run npm run android:sync first.'}
$backup=Join-Path (Split-Path $repo -Parent) ('android-starter-backup-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup | Out-Null
# Back up only the native project we replace; unrelated web checkouts are left alone.
foreach($entry in Get-ChildItem -LiteralPath $source -Force){
 if($entry.Name -in @('.gradle','.kotlin','build','local.properties')){continue}
 $existing=Join-Path $targetPath $entry.Name
 if(!(Test-Path -LiteralPath $existing)){continue}
 if($entry.PSIsContainer){
  & robocopy $existing (Join-Path $backup $entry.Name) /E /XD .gradle .idea .kotlin build node_modules .git /R:2 /W:1 /NFL /NDL /NJH /NJS | Out-Null
  if($LASTEXITCODE -gt 7){throw 'Could not back up the existing Android project.'}
 }else{Copy-Item -LiteralPath $existing -Destination $backup -Force}
}
foreach($relative in @('settings.gradle.kts','build.gradle.kts','app\build.gradle.kts')){
 $leaf=[IO.Path]::GetFullPath((Join-Path $targetPath $relative))
 if(!$leaf.StartsWith($targetPath+'\')){throw 'Unexpected target path.'}
 if(Test-Path -LiteralPath $leaf){Remove-Item -LiteralPath $leaf -Force}
}
$resources=[IO.Path]::GetFullPath((Join-Path $targetPath 'app\src\main\res'))
if($resources -ne ($targetPath+'\app\src\main\res')){throw 'Unexpected resource directory.'}
if(Test-Path -LiteralPath $resources){Remove-Item -LiteralPath $resources -Recurse -Force}
$webAssets=[IO.Path]::GetFullPath((Join-Path $targetPath 'app\src\main\assets\public'))
if($webAssets -ne ($targetPath+'\app\src\main\assets\public')){throw 'Unexpected web asset directory.'}
if(Test-Path -LiteralPath $webAssets){Remove-Item -LiteralPath $webAssets -Recurse -Force}
& robocopy $source $targetPath /E /XD .gradle .idea .kotlin build /XF local.properties /R:2 /W:1 /NFL /NDL /NJH /NJS | Out-Null
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
$localGradle=Join-Path $targetPath '.gradle'
New-Item -ItemType Directory -Force -Path $localGradle | Out-Null
[IO.File]::WriteAllText((Join-Path $localGradle 'config.properties'),"java.home=C:/Program Files/Java/jdk-21`n")
Write-Output "Android project updated: $targetPath"
Write-Output "Previous files backed up: $backup"
