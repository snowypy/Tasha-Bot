
const tagColors = {
    'Urgent': '#FF0000',
    'Bug': '#FFA500',
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const tag = btn.dataset.tag;
            try {
                const response = await fetch(`/tickets/${ticketId}/tags`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tag })
                });
                if (response.ok) {
                    btn.classList.toggle('active');
                    if (btn.classList.contains('active')) {
                        btn.style.backgroundColor = `${tagColors[tag]}20`;
                        btn.style.color = `${tagColors[tag]}`;
                        btn.style.border = `1px solid ${tagColors[tag]}40`;
                    } else {
                        btn.style.backgroundColor = '#555';
                        btn.style.color = '#888';
                        btn.style.border = '1px solid #444';
                    }
                } else {
                    console.error('Failed to toggle tag:', tag);
                }
            } catch (error) {
                console.error('Error toggling tag:', error);
            }
        });
    });
});