document.addEventListener('DOMContentLoaded', () => {
    const exportConversationsBtn = document.getElementById('exportConversationsBtn');

    if (exportConversationsBtn) {
        exportConversationsBtn.addEventListener('click', () => {
            browser.runtime.sendMessage({ action: "exportConversations" });
        });
    }
});
