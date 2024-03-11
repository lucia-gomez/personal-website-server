#!/bin/bash

# must provide timestamp backup dir to restore from
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <timestamp>"
    exit 1
fi

TIMESTAMP="$1"
DIR=__restore__

mkdir -p $DIR/$TIMESTAMP 

# wait for all backup files to download
node awsDownload.js $DIR $TIMESTAMP

if [[ -f ../.env ]]; then
    source ../.env
fi

ATLAS_USERNAME="admin"
ATLAS_CLUSTER="luciagomez.xykba6v.mongodb.net"
ATLAS_DATABASE="personalWebsite"

# Construct the MongoDB Atlas URI
MONGO_URI="mongodb+srv://${ATLAS_USERNAME}:${REACT_APP_MONGO_PASSWORD}@${ATLAS_CLUSTER}/${ATLAS_DATABASE}"

echo "Starting mongorestore..."
mongorestore --uri $MONGO_URI --nsInclude=personalWebsite.drafts $DIR/$TIMESTAMP
mongorestore --uri $MONGO_URI --nsInclude=personalWebsite.posts $DIR/$TIMESTAMP
mongorestore --uri $MONGO_URI --nsInclude=personalWebsite.subscribers $DIR/$TIMESTAMP
mongorestore --uri $MONGO_URI --nsInclude=personalWebsite.subscribersTest $DIR/$TIMESTAMP
echo "mongorestore completed"