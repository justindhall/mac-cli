#!/usr/bin/env bash
sync() {
  rsync -av  --exclude $ROUNDTRIP_WORKSPACE_DIRECTORY/databases --exclude $ROUNDTRIP_WORKSPACE_DIRECTORY/mobile  --exclude $ROUNDTRIP_WORKSPACE_DIRECTORY/archived — progress -e "ssh -i /Users/sam.birk/.ssh/aws-cali.pem" $ROUNDTRIP_WORKSPACE_DIRECTORY/ ubuntu@ec2-54-183-121-206.us-west-1.compute.amazonaws.com:/home/ubuntu/workspace
}

ssh-dev() {
  ssh -i $HOME/.ssh/aws-cali.pem ubuntu@ec2-54-183-121-206.us-west-1.compute.amazonaws.com
}
