_appEnvironment() {
  local branch=$1;

  if [ "$branch" = "master" ]; then
    echo "prod";
  else
    echo r$(cut -f 1 -d "-" <<< $branch)
  fi
}

_appNamespace() {
  local branch=$1;

  if [ "$branch" = "master" ]; then
    echo "prod";
  else
    echo "review";
  fi
}

_dockerImage() {
  local repo=$1;
  local branch=$2;
  local commit=$3;

  echo "fewlines/"$(_appName $repo):$(_appEnvironment $branch)_$commit
}

_dockerImageLatest() {
  local repo=$1;
  local branch=$2;

  echo "fewlines/"$(_appName $repo):$(_appEnvironment $branch)_latest
}

_readTagFromManifest() {
  local manifestFile=$1;
  local application=$2;
  awk -F ":" "/$application/ {print \$4}" $manifestFile
}

_updateManifest() {
  local manifestFile=$1;
  local application=$2;
  local environment=$3;
  local dockerTag=$4;

  touch $manifestFile
  sed -i.bak /^${application}/d $manifestFile
  rm ${manifestFile}.bak
  echo ${application}:fewlines/${application}:${environment}_latest:${dockerTag} >> $manifestFile
}

_userName() {
  local repo=$1

  echo $(_appName $repo) | sed "s/-/_/g"
}
