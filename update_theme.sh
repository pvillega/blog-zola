#!/bin/bash

echo "Updating all git submodules (usually zola themes)"
git submodule foreach git pull --rebase
