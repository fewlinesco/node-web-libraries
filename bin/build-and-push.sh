#! /usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

cwd=$(dirname $(realpath $0))
source ${cwd}/lib/utils.sh

appName=${1:?"app name is required as first argument"}
gitRepo=${2:?"git repository URL is required as second argument"};
gitBranch=${3:?"git branch is required as third argument"};
gitCommit=${4:?"git commit SHA is required as fourth argument"};

releaseName=$(echo ${gitBranch} | sed 's/^\(CU-[[:alnum:]]*\).*/\1/')

environment=$(_appEnvironment $gitBranch)
dockerTag=${environment}_${gitCommit}
dockerImage=$(_dockerImage $gitRepo $gitBranch $gitCommit)
dockerImageLatest=$(_dockerImageLatest $gitRepo $gitBranch)

docker build \
		--build-arg GIT_REPOSITORY=${gitRepo} \
		--build-arg GIT_SHA=${gitCommit} \
		--build-arg CREATED_AT=${CREATED_AT} \
		--tag ${appName}:${releaseName}-${GIT_SHORT_SHA} \
		--tag ${appName}:${releaseName}-latest \
		.

docker push $dockerImage
docker push $dockerImageLatest

# _updateManifest manifest.txt connect-demo-signup $environment $dockerTag