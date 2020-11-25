_appEnvironment() {
  local branch=$1;

  if [ "$branch" = "master" ]; then
    echo "prod";
  else
    echo r$(cut -f 1 -d "-" <<< $branch)
  fi
}

