#!/bin/bash
cp -R ../dist ./dist
docker build -t amv/geolocation-app .
rm -r ./dist
