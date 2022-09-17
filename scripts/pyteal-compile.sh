#!/bin/bash

SB="$HOME/sandbox/sandbox"
GOAL="$SB goal"

app_name=contracts/approval.teal
clear_name=contracts/clear.teal

makeTeal() {
    python3 pyteal/contract.py
    $SB copyTo $app_name
    $SB copyTo $clear_name 
}

echo "$(tput setaf 2)Compiling application$(tput setaf 7)"
    makeTeal
echo "$(tput setaf 2)Contract compiled 🎉$(tput setaf 7)"
