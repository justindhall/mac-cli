#!/usr/bin/env bash

feature_ssh () {
	ssh ubuntu@${1}.roundtriphealth.com
}

alias fsh="feature_ssh"
