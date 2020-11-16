#!/usr/bin/env bash
export GEM_CREDENTIALS="---\n:github: Bearer ${GITHUB_TOKEN}"
export GEMRC_CREDENTIALS="---
:backtrace: false
:bulk_threshold: 1000
:sources:
- https://rubygems.org/
- https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@rubygems.pkg.github.com/IDme/
:update_sources: true
:verbose: true
";

createGemCredentials () {
  if [ $GITHUB_USERNAME = "" ]; then
    echo "PLEASE SETUP git"
  else
    if [ $GITHUB_TOKEN = "" ]; then
      echo "PLEASE SETUP A GITHUB TOKEN by going to https://github.com/settings/tokens"
      echo "WHEN YOU FINISH PLEASE ADD `export GITHUB_TOKEN='<your_token>'` to the top of your .bash_profile or .zshrc file"
    else
      if [ $# -eq 0 ]; then
        echo ''
      else
        if [ $1 = "--force" ]; then
          rm -rf $HOME/.gem/credentials
          rm -f $HOME/.gemrc
        fi

      fi

      mkdir -p ~/.gem
      if test -f "$HOME/.gem/credentials"; then
        #echo "$HOME/.gem/credentials EXISTS"
        echo "GEM CREDENTIALS ALREADY CREATED"
      else
        echo "CREATING $HOME/.gem/credentials with github credentials"
        echo $GEM_CREDENTIALS > ~/.gem/credentials
        chmod 600 ~/.gem/credentials
      fi
       if test -f "$HOME/.gemrc"; then
        #echo "$HOME/.gem/credentials EXISTS"
        echo ".gemrc ALREADY CREATED"
      else
        echo "CREATING $HOME/.gemrc with github credentials"
        echo $GEMRC_CREDENTIALS > ~/.gemrc
        chmod 600 ~/.gem/credentials
      fi
    fi
  fi

}

#createGemCredentials
