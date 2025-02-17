#!/bin/bash

# Remove existing husky configuration
rm -rf .husky

# Initialize husky
yarn husky install

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
EOF

# Make the pre-commit hook executable
chmod +x .husky/pre-commit
