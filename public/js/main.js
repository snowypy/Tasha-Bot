async function closeTicket(id) {
    if (confirm('Are you sure you want to close this ticket?')) {
        try {
            const response = await fetch(`/tickets/${id}/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (response.ok) {
                location.reload();
            }
        } catch (error) {
            console.error('Error closing ticket:', error);
        }
    }
}