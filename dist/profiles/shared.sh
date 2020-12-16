#!/usr/bin/env bash
ssh-add -K ~/.ssh/id_rsa 2> /dev/null
export ROUNDTRIP_WORKSPACE_DIRECTORY=$HOME/roundtrip
#export GITHUB_USERNAME=$($GITHUB_USERNAME || git config user.name)

# PROFILE SHORTCUTS
alias resource='. ~/.zshrc'
alias zprofile='subl ~/.zshrc'

# LOCAL DEVELOPMENT SETUP

mkdir -p $ROUNDTRIP_WORKSPACE_DIRECTORY
alias mac-cli="ts-node $ROUNDTRIP_WORKSPACE_DIRECTORY/mac-cli/src/index.ts"
if [ ! -d $ROUNDTRIP_WORKSPACE_DIRECTORY/mac-cli/node_modules ]; then
  cd $ROUNDTRIP_WORKSPACE_DIRECTORY/mac-cli/; npm ci --silent; cd -
fi

alias log_puma="tail -f ~/Library/Logs/puma-dev.log"
alias puma_logs="tail -f ~/Library/Logs/puma-dev.log"
alias stop_puma="puma-dev -stop"
export LOCAL_GITHUB_REPO_STRUCTURE='clean' # You can override this to be flat if you want all of your repos in one place

source $ROUNDTRIP_WORKSPACE_DIRECTORY/mac-cli/dist/profiles/git.sh
source $ROUNDTRIP_WORKSPACE_DIRECTORY/mac-cli/dist/profiles/rails.sh
source $ROUNDTRIP_WORKSPACE_DIRECTORY/mac-cli/dist/profiles/docker.sh
source $ROUNDTRIP_WORKSPACE_DIRECTORY/mac-cli/dist/profiles/local-docker-development.sh
source $ROUNDTRIP_WORKSPACE_DIRECTORY/mac-cli/dist/profiles/release.sh
source $ROUNDTRIP_WORKSPACE_DIRECTORY/mac-cli/dist/profiles/react.sh
source $ROUNDTRIP_WORKSPACE_DIRECTORY/mac-cli/dist/profiles/npm.sh
source $ROUNDTRIP_WORKSPACE_DIRECTORY/mac-cli/dist/profiles/feature.sh
