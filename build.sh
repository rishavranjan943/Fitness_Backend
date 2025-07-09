#!/usr/bin/env bash

# Install Python & pip
apt-get update && apt-get install -y python python-pip

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js packages
npm install
