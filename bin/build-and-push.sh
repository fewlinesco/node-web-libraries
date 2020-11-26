#! /usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

_appEnvironment() {
  local branch=$1;

  if [ "$branch" = "master" ]; then
    echo "prod";
  else
    echo r$(cut -f 1 -d "-" <<< $branch)
  fi
}


cwd=$(dirname $(realpath $0))

imageName=${1:?"app name is required as first argument"}
gitRepo=${2:?"git repository URL is required as second argument"};
gitCommit=${4:?"git commit SHA is required as fourth argument"};
gitBranch=${3:?"git branch is required as third argument"};

gitShortCommit=$(echo $CIRCLE_SHA1 | cut -c -7)
releaseName=$(echo ${gitBranch} | sed 's/^\(CU-[[:alnum:]]*\).*/\1/')

environment=$(_appEnvironment $gitBranch)
dockerTag=${environment}_${gitCommit}
dockerImage=$(echo "fewlines/${imageName}:${releaseName}-${gitShortCommit}")
dockerImageLatest=$(echo "fewlines/${imageName}:${releaseName}-latest")

docker build \
		--build-arg GIT_REPOSITORY=${gitRepo} \
		--build-arg GIT_SHA=${gitCommit} \
		--tag ${dockerImage} \
		--tag ${dockerImageLatest} \
		.

docker push $dockerImage
docker push $dockerImageLatest

# _updateManifest manifest.txt connect-demo-signup $environment $dockerTag