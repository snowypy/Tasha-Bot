async function closeTicket(id) {
    console.log('Initiating close ticket for ID:', id);
    if (confirm('Are you sure you want to close this ticket?')) {
        try {
            const response = await fetch(`/tickets/${id}/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (response.ok) {
                console.log('Ticket closed successfully:', id);
                location.reload();
            } else {
                console.error('Failed to close ticket:', id);
            }
        } catch (error) {
            console.error('Error closing ticket:', error);
        }
    } else {
        console.log('Ticket close action canceled for ID:', id);
    }
}