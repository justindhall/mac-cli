#!/bin/bash

until PGPASSWORD=$POSTGRES_PASSWORD psql -h "db" -U $USERNAME -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - wait 10 seconds"
sleep 10

>&2 echo "set bundle config for gems"
bundle config set rubygems.pkg.github.com $GITHUB_USERNAME:$GITHUB_TOKEN
>&2 echo "bundle install"
bundle check || bundle install

##DATABASE MIGRATION##

## this doesn't work and I don't know how to make it work
#egrep -lr  'roundtrip' /app/. | xargs -r sed -i -e "s/roundtrip\.com/${BRANCH}.roundtrip.io/g"

>&2 echo "start server"
rm -f tmp/pids/server.pid && bundle exec puma -C config/puma.rb -p 3000
