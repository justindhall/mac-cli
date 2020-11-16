#!/usr/bin/env bash

alias gs='git status'

alias undo_commit='git reset --soft HEAD~1'
alias undo_stage='git reset HEAD'

gpl () {
  git pull origin $(git rev-parse --abbrev-ref HEAD)
}

alias gpul='gpl'
alias gpull='gpl'

gpsh () {
	MESSAGE="$(echo "$*"| sed 's/{/(/' | sed 's/}/)/'  | sed 's/\@/#/')"
	 if [ "$MESSAGE" = "" ]; then
    echo "ERROR: You must provide a message."
  else
    git pull origin $(git rev-parse --abbrev-ref HEAD)
    git add .
    git commit -m "$MESSAGE" --allow-empty
    git push origin $(git rev-parse --abbrev-ref HEAD)
  fi
}
