#!/bin/bash

if [[ -f .env ]]; then
    source .env
fi

ATLAS_USERNAME="admin"
ATLAS_CLUSTER="luciagomez.xykba6v.mongodb.net"
ATLAS_DATABASE="personalWebsite"

# Construct the MongoDB Atlas URI
MONGO_URI="mongodb+srv://${ATLAS_USERNAME}:${REACT_APP_MONGO_PASSWORD}@${ATLAS_CLUSTER}/${ATLAS_DATABASE}"

# Run mongodump to create a backup in the temporary directory
echo "Starting mongorestore..."
mongorestore --uri $MONGO_URI -d personalWebsite -c posts ./posts.bson
mongorestore --uri $MONGO_URI -d personalWebsite -c drafts ./drafts.bson
mongorestore --uri $MONGO_URI -d personalWebsite -c subscribers ./subscribers.bson
echo "mongorestore completed"