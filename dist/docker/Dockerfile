#FROM ruby:alpine
#MAINTAINER Roundtrip
#RUN apk add --update --no-cache \
#      build-base \
#      linux-headers \
#      nodejs \
#      ##ALPINE NPM PACKAGE##
#      tzdata \
#      git \
#      libxml2-dev \
#      libxslt-dev \
#      postgresql \
#      postgresql-dev \
#      openssh-client \
#      imagemagick \
#      bash \
#      curl \
#      cmake
#
#ARG GITHUB_USERNAME
#ARG GITHUB_TOKEN
#ARG APP_NAME
#ENV GITHUB_USERNAME=$GITHUB_USERNAME
#ENV GITHUB_TOKEN=$GITHUB_TOKEN
#ENV RAILS_MASTER_KEY=$RAILS_MASTER_KEY
#
#ENV APP_NAME=$APP_NAME
#
#COPY . /app
#WORKDIR /app
#
#ENV GEM_CREDENTIALS="---\n:github: Bearer ${GITHUB_TOKEN}"
#ENV GEMRC_CREDENTIALS="---\n:backtrace: false\n:bulk_threshold: 1000\n:sources:\n- https://rubygems.org/\n- https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@rubygems.pkg.github.com/IDme/\n:update_sources: true\n:verbose: true\n"
#
#RUN mkdir -p /root/.gem
#RUN touch /root/.gem/credentials
#RUN chmod 600 /root/.gem/credentials
#RUN echo -e $GEM_CREDENTIALS > /root/.gem/credentials
#RUN echo -e $GEMRC_CREDENTIALS > /root/.gemrc
#
#ENV BUNDLE_GITHUB__COM=x-access-token:$GITHUB_TOKEN
#ENV BUNDLE_PATH=/root/.gems
#ENV BUNDLER_VERSION=2.1.4
#
#RUN sed -i "s/git@github.com:IDme/https:\/\/github.com\/idme/g" Gemfile
#
#RUN gem update --system
#RUN gem install bundler
#RUN bundle config set rubygems.pkg.github.com $GITHUB_USERNAME:$GITHUB_TOKEN
#RUN bundle install
###RUN NPM INSTALL##
###RUN YARN INSTALL##
#
#EXPOSE 3000
#CMD /bin/bash