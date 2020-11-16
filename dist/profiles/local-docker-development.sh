#!/usr/bin/env bash
# LOCAL DEVELOPMENT SHORTCUTS
#mac-cli create-docker-compose
alias debug_start_roundtrip="cd $ROUNDTRIP_WORKSPACE_DIRECTORY; docker-compose up --remove-orphans --force-recreate --build ; cd -"
alias debug_soft_start_roundtrip="cd $ROUNDTRIP_WORKSPACE_DIRECTORY; docker-compose up --remove-orphans ; cd -"
alias start_roundtrip="cd $ROUNDTRIP_WORKSPACE_DIRECTORY; docker-compose up -d --remove-orphans --build --no-recreate; cd -"
alias stop_roundtrip="cd $ROUNDTRIP_WORKSPACE_DIRECTORY; docker-compose down; cd -"

alias restart_roundtrip='stop_roundtrip; start_roundtrip'
alias tail_logs='tail -f ~/Library/Logs/puma-dev.log'

service-name() {
  echo $(echo $(dcontainers | grep  $1)  | cut -d ' ' -f2 | sed s/^workspace_//)
}

container-name() {
  echo $(echo $(dcontainers | grep  authority) | rev | cut -d ' ' -f1 | rev)
}

dexec-service() {
  CONTAINER=$(container-name $1)
  docker exec -it $CONTAINER bash
}

restart-service() {
  pushd $ROUNDTRIP_WORKSPACE_DIRECTORY  > /dev/null
  SERVICE=$(service-name $1)
  echo "RESTARTING: $(service-name $SERVICE)"
  stop-service $SERVICE
  start-service $SERVICE
  popd  > /dev/null
}

stop-service() {
  pushd $ROUNDTRIP_WORKSPACE_DIRECTORY  > /dev/null
  SERVICE=$(service-name $1)
  echo "STOPPING: $SERVICE"
  docker-compose stop $SERVICE
  popd  > /dev/null
}

start-service() {
  pushd $ROUNDTRIP_WORKSPACE_DIRECTORY  > /dev/null
  echo "STARTING: $1"
  docker-compose start $1
  popd  > /dev/null
}
