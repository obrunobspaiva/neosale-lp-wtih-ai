#!/bin/bash

# Get list of changed files
CHANGED_FILES=$(git diff --name-only --cached 2>/dev/null)
if [ -z "$CHANGED_FILES" ]; then
    CHANGED_FILES=$(git diff --name-only 2>/dev/null)
fi

if [ -z "$CHANGED_FILES" ]; then
    echo "Nenhuma alteração detectada."
    exit 0
fi

# Analyze changes and build commit message
TYPE="feat"
CHANGES=()

# Check for specific patterns in changed files
if echo "$CHANGED_FILES" | grep -q "fix\|bug\|error"; then
    TYPE="fix"
fi

# Analyze each changed file
while IFS= read -r file; do
    case "$file" in
        *api.js*)
            CHANGES+=("ajuste na lógica de API")
            ;;
        *config.js*)
            CHANGES+=("configuração de ambiente")
            ;;
        *Dockerfile*)
            CHANGES+=("configuração Docker")
            ;;
        *entrypoint.sh*)
            CHANGES+=("script de inicialização")
            ;;
        *.jsx*)
            COMPONENT=$(basename "$file" .jsx)
            CHANGES+=("componente $COMPONENT")
            ;;
        *package.json*)
            CHANGES+=("dependências/scripts")
            ;;
        *.css*)
            CHANGES+=("estilos")
            ;;
        *index.html*)
            CHANGES+=("estrutura HTML")
            ;;
        *)
            CHANGES+=("$(basename "$file")")
            ;;
    esac
done <<< "$CHANGED_FILES"

# Remove duplicates and build message
UNIQUE_CHANGES=($(echo "${CHANGES[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '))

# Build commit message
if [ ${#UNIQUE_CHANGES[@]} -eq 0 ]; then
    MESSAGE="$TYPE: atualizações gerais"
elif [ ${#UNIQUE_CHANGES[@]} -eq 1 ]; then
    MESSAGE="$TYPE: ${UNIQUE_CHANGES[0]}"
elif [ ${#UNIQUE_CHANGES[@]} -le 3 ]; then
    MESSAGE="$TYPE: ${UNIQUE_CHANGES[*]}"
else
    MESSAGE="$TYPE: múltiplas atualizações (${#UNIQUE_CHANGES[@]} áreas)"
fi

echo "Arquivos alterados:"
echo "$CHANGED_FILES"
echo ""
echo "Commit message: $MESSAGE"
echo ""

# Stage all changes
git add .

# Commit with generated message
git commit -m "$MESSAGE"

# Push to remote
git push

echo ""
echo "✅ Push realizado com sucesso!"
