#!/bin/bash
cp -R ../dist ./dist
docker build -t amv/trafficsoft-system-demo-app .
rm -r ./dist
