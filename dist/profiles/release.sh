#!/usr/bin/env bash
run-release () {
	MESSAGE="$(echo "$*"| sed 's/{/(/' | sed 's/}/)/'  | sed 's/\@/#/')"
  if [ "$MESSAGE" = "" ]; then
    echo "ERROR: You must provide a message."
  else
    git checkout master
    git pull origin master
    echo "chore(run-release): $MESSAGE --allow-empty"
    git commit -m "chore(run-release): $MESSAGE" --allow-empty
    git push origin $(git rev-parse --abbrev-ref HEAD)
    semver_release
  fi
}

semver_release () {
echo $(pwd)
   docker run -v $(pwd)/:/current \
 			-e GITHUB_ACTOR=$GITHUB_USERNAME \
 			-e GITHUB_TOKEN=$GITHUB_TOKEN  \
      -e GITHUB_HEAD_REF='master'  \
      -e GITHUB_REF='master'  \
 			-e GITHUB_REPOSITORY=$(basename $(pwd)) docker.pkg.github.com/roundtrip/ release
}
