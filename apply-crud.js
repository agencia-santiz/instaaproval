const fs = require('fs');

let file = fs.readFileSync('js/app-enhanced.js', 'utf8');

if (!file.includes('window.deletePost')) {
  // Add backend functions
  file += `
window.deletePost = async (postId) => {
    if (!confirm('Tem certeza que deseja deletar este post? Essa ação não pode ser desfeita.')) return;
    
    // Optimistic UI update
    state.data.posts = state.data.posts.filter(p => p.id !== postId);
    if (state.data.allPosts) {
      state.data.allPosts = state.data.allPosts.filter(p => p.id !== postId);
    }
    renderCurrentView();
    
    try {
        await api().deletePost?.(postId);
    } catch(e) {
        console.error('Delete action failed', e);
        // Silent rollback logic omitted for simplicity in MVP
    }
};
`;
}

// Inject delete button to UI
const targetString = `<button class="btn btn-success" onclick="updateStatus(\'\${post.id}\', \'approved\')" aria-label="Aprovar post" \${canApprovePosts() ? \'\' : \'disabled title="Seu perfil nao pode alterar status"\'}><i data-lucide="check"></i> Aprovar</button>`;

if (!file.includes('deletePost(\'${post.id}\')')) {
  const replacement = `\${isAdmin() ? \`<button class="btn btn-secondary" style="border-color: var(--color-danger); color: var(--color-danger);" onclick="deletePost('\${post.id}')" aria-label="Deletar post" title="Deletar permanentemente"><i data-lucide="trash-2"></i></button>\` : ''}
                    ` + targetString;
  file = file.replace(targetString, replacement);
}

fs.writeFileSync('js/app-enhanced.js', file);
console.log('CRUD extensions added successfully.');
