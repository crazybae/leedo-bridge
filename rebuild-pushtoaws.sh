#!/bin/bash
rm -rf ./build
yarn build
tar cvfz build.tar.gz ./build
scp -i "~/.ssh/leedobridge.pem" ./build.tar.gz ubuntu@3.36.99.205:~/leedobridge/leedo-bridge-client
