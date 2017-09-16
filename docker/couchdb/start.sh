#!/bin/sh

docker run -p 5988:5984 \
-e COUCHDB_USER=xxx -e COUCHDB_PASSWORD=ccc \
-v /data/spring/couchdb:/usr/local/var/lib/couchdb \
--restart always \
--name spring-couchdb \
-d couchdb
