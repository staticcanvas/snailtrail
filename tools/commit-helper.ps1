<# Commit Fusion template file use to create large detailed commits #>

# ==========================
$gituser      = "sgkens"
$footer       = $true
$gitgroup     = "staticcanvas"
# ............................


# ==========================

$change_type  = "style"; $scope = "default.css"
$description  = "Added default styles for debug panel HTML example"

$Notes = 
  ''

$FeatureAdditions =
  ''

# $BugFixes =
#   ''

# $BreakingChanges =
#   ''

# $FeatureNotes =
#   ''

# ............................




$Params = @{
  Type            = $change_type; 
  Scope           = $scope; 
  GitUser         = $gituser; 
  GitGroup        = $gitgroup; 
  Description     = $description
  footer          = $footer 
}

  # ............................................................................

  if($Notes.count -ne 0) { $Params.Notes = $Notes }
  if($FeatureAdditions.count -ne 0) { $Params.FeatureAdditions = $FeatureAdditions }
  if($BugFixes.count -ne 0) { $Params.BugFixes = $BugFixes }
  if ($BreakingChanges.count -ne 0) { $Params.BreakingChanges = $BreakingChanges }
  if ($FeatureNotes.count -ne 0) { $Params.FeatureNotes = $FeatureNotes }
  # ............................................................................


# ACTIONS
# -------
# ConventionalCommit with params sent commit
New-Commit @Params