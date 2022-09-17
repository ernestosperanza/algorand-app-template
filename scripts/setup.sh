#!/bin/bash

echo "$(tput setaf 2)Seting up 🚀$(tput setaf 7)"
echo ""

if [ ! -d "pyteal/venv" ]; 
then
    echo "$(tput setaf 2)Seting up the pyteal environment...$(tput setaf 7)"
    cd pyteal
    python3 -m venv venv
    source venv/bin/activate
    pip3 install -r ./requirements.txt
    cd ..
fi

if [ ! -d "node_modules" ]; 
then
    echo ""
    echo "$(tput setaf 2)Seting up the node environment...$(tput setaf 7)"
    echo ""
    npm install
fi

if [ ! -d "./sandbox" ]
then
    echo ""
    echo "$(tput setaf 2)Getting the Algorand sandbox...$(tput setaf 7)"
    echo ""
    git clone https://github.com/algorand/sandbox.git
fi

open -a "docker"
cd sandbox
./sandbox up dev
cd ..

echo ""
echo "✅$(tput setaf 2) Pyteal environment$(tput setaf 7)"
echo "✅$(tput setaf 2) Node.js $(tput setaf 7)"
echo "✅$(tput setaf 2) Algorand sandbox $(tput setaf 7)"
echo "$(tput setaf 2)The environment is ready, happy hacking...👨‍💻$(tput setaf 7)"