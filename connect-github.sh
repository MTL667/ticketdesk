#!/bin/bash

# Script to connect this repository to a new GitHub repository
# Usage: ./connect-github.sh YOUR_USERNAME YOUR_REPO_NAME

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./connect-github.sh YOUR_USERNAME YOUR_REPO_NAME"
  echo "Example: ./connect-github.sh kevin ticketdesk"
  exit 1
fi

USERNAME=$1
REPO_NAME=$2

echo "Connecting to GitHub repository: $USERNAME/$REPO_NAME"
echo ""

# Ensure we're on main branch
git branch -M main

# Add remote origin
git remote add origin "https://github.com/$USERNAME/$REPO_NAME.git" 2>/dev/null || git remote set-url origin "https://github.com/$USERNAME/$REPO_NAME.git"

echo "Remote added: https://github.com/$USERNAME/$REPO_NAME.git"
echo ""
echo "Next steps:"
echo "1. Make sure you've created the repository on GitHub first"
echo "2. Run: git push -u origin main"
echo ""
read -p "Do you want to push now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git push -u origin main
fi

