#!/bin/sh
# start.sh
echo "Waiting for Hardhat node..."
while ! nc -z hardhat 8545; do
  sleep 1
done

echo "Hardhat is up, starting Express..."
npm start
