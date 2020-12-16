#!/usr/bin/env bash
#echo "${GITHUB_TOKEN}" | docker login docker.pkg.github.com -u ${GITHUB_USERNAME} --password-stdin
dlogs () {
  CONTAINER=$(docker container ls | grep "redis" | awk '{print $NF}')
  docker logs -f $CONTAINER
}

dcontainers () {
  docker container ls
}

dimages () {
  docker image ls
}

dexec () {
  docker exec -it "workspace_${1}_1" bash
}

dclean () {
  docker stop $(docker ps -a -q)
  docker rm -f $(docker ps -a -q)
  docker rmi -f $(docker images -q)
}

dbuild () {
  docker build --build-arg GITHUB_USERNAME=${GITHUB_USERNAME} --build-arg RAILS_MASTER_KEY=${RAILS_MASTER_KEY}  --build-arg GITHUB_TOKEN=${GITHUB_TOKEN}  --build-arg APP_NAME=$(basename $(pwd)) . -t $(basename $(pwd))
}

drun () {
  docker run --net=host -e DATABASE_URL=postgres://${USER}@kubernetes.docker.internal -e TEST_DATABASE_URL=postgres://${USER}@kubernetes.docker.internal -e RAILS_ENV=development -e REDIS_DOMAIN=redis -e USERNAME=${USER} -e APP_NAME=APP_NAME=$(basename $(pwd)) -e GITHUB_USERNAME=${GITHUB_USERNAME} -e RAILS_MASTER_KEY=${RAILS_MASTER_KEY}  -e GITHUB_TOKEN=${GITHUB_TOKEN} -v $(pwd):/app -it $(basename $(pwd))
  docker run -e RAILS_ENV=production -v $(pwd):/app -it $(basename $(pwd))
}

dbuild_semver () {
  docker build --build-arg RELEASE_GITHUB_USERNAMES=${GITHUB_USERNAME}  --build-arg JIRA_TOKEN=${JIRA_TOKEN} . -t semantic-versioning-actions
}

drun_semver () {
  echo $(pwd)
  docker run -v $(pwd)/:/current \
 		-v $ROUNDTRIP_WORKSPACE_DIRECTORY/github-actions/semantic-versioning-actions/:/code \
 		-e GITHUB_ACTOR=$GITHUB_USERNAME \
 		-e DEVELOPMENT="true" \
 		-e GITHUB_TOKEN=$GITHUB_TOKEN  \
 		-e GITHUB_REF="refs/pull/1442/merge"  \
 		-e GITHUB_REPOSITORY=$(basename $(pwd)) semantic-versioning-actions $1
}
