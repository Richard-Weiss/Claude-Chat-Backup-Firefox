async function getCookie(): Promise<string | null> {
    const cookie = await browser.cookies.get({
        url: 'https://claude.ai',
        name: 'lastActiveOrg'
    });
    return cookie ? cookie.value : null;
}

async function fetchConversations(organizationId: string): Promise<any[]> {
    const url = `https://claude.ai/api/organizations/${organizationId}/chat_conversations`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
}

async function fetchAllConversationDetails(organizationId: string, conversations: any[]): Promise<any[]> {
    const detailPromises = conversations.map(conv =>
        fetch(`https://claude.ai/api/organizations/${organizationId}/chat_conversations/${conv.uuid}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
    );
    return await Promise.all(detailPromises);
}

async function exportConversations() {
    try {
        const organizationId = await getCookie();
        if (!organizationId) {
            console.error("Required cookie not found");
            return;
        }

        const conversations = await fetchConversations(organizationId);
        const detailedConversations = await fetchAllConversationDetails(organizationId, conversations);

        const jsonData = JSON.stringify(detailedConversations, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Please don't ask, just use a proper language or one of the bazillion libraries if you see this.
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timezoneOffset = -now.getTimezoneOffset() / 60;
        const formattedDate = `${year}-${month}-${day}T${hours}${minutes}${timezoneOffset >= 0 ? '+' : '-'}${Math.abs(timezoneOffset)}`;

        const filename = `${formattedDate}_claude_conversations_export.json`;
        await browser.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        });
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error exporting conversations:", error);
    }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "exportConversations") {
        exportConversations();
    }
});
