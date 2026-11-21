$ErrorActionPreference = 'Stop'
$root = Join-Path $PSScriptRoot '..'
$ep = Join-Path $root 'episodes\emu-war'
New-Item -ItemType Directory -Force (Join-Path $ep 'voice') | Out-Null
Copy-Item (Join-Path $root 'episodes\boston-molasses\cast') (Join-Path $ep 'cast') -Recurse -Force
Copy-Item (Join-Path $root 'episodes\boston-molasses\film.json') (Join-Path $ep 'film.json') -Force
$film = Get-Content (Join-Path $ep 'film.json') -Raw | ConvertFrom-Json
$film.title = 'The Army That Lost a War to Birds'
$film.words = 'voice/words.json'
$film.puppet_pkg = @('cast','../../templates/vector2d_characters/code')
$film.camera_idea = [pscustomobject]@{ name = 'The Flock That Outsmarted the Gun'; why = 'Start on the soldier and gun, reveal the enormous wheat field, track the emus through the fence, then return to the baffled soldier.'; signature = 'A low tracking move follows the flock while the gun and truck shrink behind it.' }
foreach ($c in $film.cast.psobject.Properties) { $c.Value.puppet = 'cast:sheet05/redcoat' }
$film.cast.usaa_boss.puppet = 'cast:sheet05/sheriff'
$film.places.tank_yard.set = 'emu_field'; $film.places.tank_yard.light = 'day'; $film.places.tank_yard.sky_kind = 'clear-day'
$film.places.molasses_wave.set = 'emu_field'; $film.places.molasses_wave.light = 'golden'; $film.places.molasses_wave.sky_kind = 'clear-day'
$film.places.flooded_street.set = 'emu_field'; $film.places.flooded_street.light = 'overcast'; $film.places.flooded_street.sky_kind = 'clear-day'
$film.places.harbor_clean.set = 'emu_field'; $film.places.harbor_clean.light = 'day'; $film.places.harbor_clean.sky_kind = 'clear-day'
$storyShows = @('anthony','chief','usaa_boss','gun','emu','wheat','fence','grass','truck','speed','birds','running')
foreach ($take in $film.takes) { foreach ($station in $take.stations) { $station.shows = $storyShows } }
$film.sentences[1].subject = 'anthony'; $film.sentences[2].subject = 'anthony'; $film.sentences[3].subject = 'anthony'; $film.sentences[4].subject = 'anthony'
$film.sentences = @(
  [pscustomobject]@{ text='A soldier aimed a machine gun at a flock of emus in a wheat field.'; words=@(0,13); subject='anthony'; nouns=@([pscustomobject]@{word='gun';at=0;show='gun'},[pscustomobject]@{word='emus';at=45;show='emu'},[pscustomobject]@{word='wheat';at=90;show='wheat'}) },
  [pscustomobject]@{ text='But the birds split apart, ran through the fence, and vanished into the golden grass.'; words=@(14,28); subject='chief'; nouns=@([pscustomobject]@{word='fence';at=135;show='fence'},[pscustomobject]@{word='grass';at=180;show='wheat'}) },
  [pscustomobject]@{ text='The army brought trucks, ammunition, and confidence. The emus brought speed.'; words=@(29,40); subject='usaa_boss'; nouns=@([pscustomobject]@{word='truck';at=225;show='truck'},[pscustomobject]@{word='speed';at=270;show='emu'}) },
  [pscustomobject]@{ text='After days of chasing them, the soldiers had one problem: the birds were winning.'; words=@(41,55); subject='anthony'; nouns=@([pscustomobject]@{word='birds';at=315;show='emu'}) },
  [pscustomobject]@{ text='The Great Emu War ended with the emus still running.'; words=@(56,66); subject='chief'; nouns=@([pscustomobject]@{word='running';at=360;show='emu'}) }
)
$film.sound = @([pscustomobject]@{at=0;name='dry_wind_wheat'},[pscustomobject]@{at=30;name='truck_engine'},[pscustomobject]@{at=45;name='emu_footsteps_and_calls'},[pscustomobject]@{at=60;name='metal_gun_click'})
$film | Add-Member -NotePropertyName post -NotePropertyValue ([pscustomobject]@{dof=0; dust=.55; bloom=.65; vignette=.68}) -Force
$film | ConvertTo-Json -Depth 80 | Set-Content (Join-Path $ep 'film.json') -Encoding utf8
$text = 'A soldier aimed a machine gun at a flock of emus in a wheat field. But the birds split apart, ran through the fence, and vanished into the golden grass. The army brought trucks, ammunition, and confidence. The emus brought speed. After days of chasing them, the soldiers had one problem: the birds were winning. The Great Emu War ended with the emus still running.'
Copy-Item (Join-Path $root 'episodes\boston-molasses\voice\words.json') (Join-Path $ep 'voice\words.json') -Force
foreach ($set in @('molasses_wave','flooded_street','harbor_clean')) { Copy-Item (Join-Path $ep 'sets\emu_field.js') (Join-Path $ep ("sets\$set.js")) -Force }
