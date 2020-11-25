#! /usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

cwd=$(dirname $(realpath $0))
source ${cwd}/lib/utils.sh

imageName=${1:?"app name is required as first argument"}
gitRepo=${2:?"git repository URL is required as second argument"};
gitCommit=${4:?"git commit SHA is required as fourth argument"};
gitBranch=${3:?"git branch is required as third argument"};

releaseName=$(echo ${gitBranch} | sed 's/^\(CU-[[:alnum:]]*\).*/\1/')

environment=$(_appEnvironment $gitBranch)
dockerTag=${environment}_${gitCommit}
dockerImage=$(echo "fewlines/${imageName}: ${imageName}:${releaseName}-${GIT_SHORT_SHA}")
dockerImageLatest=$(echo "fewlines/${imageName}:$(_appEnvironment $branch)_latest")

docker build \
		--build-arg GIT_REPOSITORY=${gitRepo} \
		--build-arg GIT_SHA=${gitCommit} \
		--build-arg CREATED_AT=${CREATED_AT} \
		--tag ${imageName}:${releaseName}-${GIT_SHORT_SHA} \
		--tag ${imageName}:${releaseName}-latest \
		.

docker push $dockerImage
docker push $dockerImageLatest

# _updateManifest manifest.txt connect-demo-signup $environment $dockerTag