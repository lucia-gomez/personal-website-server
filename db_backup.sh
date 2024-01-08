#!/bin/bash

if [[ -f .env ]]; then
    source .env
fi

ATLAS_USERNAME="admin"
ATLAS_CLUSTER="luciagomez.xykba6v.mongodb.net"
ATLAS_DATABASE="personalWebsite"

# Construct the MongoDB Atlas URI
MONGO_URI="mongodb+srv://${ATLAS_USERNAME}:${REACT_APP_MONGO_PASSWORD}@${ATLAS_CLUSTER}/${ATLAS_DATABASE}"

BACKUP_DIR=backup

# Create a timestamp for the backup folder
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Create the temporary backup directory
mkdir -p $BACKUP_DIR/$TIMESTAMP

# Run mongodump to create a backup in the temporary directory
echo "Starting mongodump at $(date)"
mongodump --uri $MONGO_URI --out $BACKUP_DIR/$TIMESTAMP
echo "mongodump completed at $(date)"

aws s3 cp $BACKUP_DIR/$TIMESTAMP s3://lucia-gomez-db-backup/$TIMESTAMP --recursive --profile admin --region us-east-1
