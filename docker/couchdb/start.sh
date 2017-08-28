#!/bin/sh

couchdb_data_file=~/app/app-admin/couchdb/fountain.couch

if [ ! -e "$couchdb_data_file" ]; then
  cp fountain.couch  /data/spring/couchdb/
fi


docker run -p 5988:5984 \
-e COUCHDB_USER=admin -e COUCHDB_PASSWORD=sadmin28 \
-v /data/spring/couchdb:/usr/local/var/lib/couchdb \
--restart always \
--name spring-couchdb \
-d couchdb
