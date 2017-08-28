#!/bin/sh

couchdb_data_file=~/app/fountain/couchdb/fountain.couch

if [ ! -e "$couchdb_data_file" ]; then
  cp fountain.couch  ~/app/data/couchdb/
fi


docker run -p 5984:5984 \
-e COUCHDB_USER=admin -e COUCHDB_PASSWORD=sadmin28 \
-v ~/app/data/couchdb:/usr/local/var/lib/couchdb \
--name spring-couchdb \
-d couchdb